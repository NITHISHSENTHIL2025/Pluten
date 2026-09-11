const prisma = require('../lib/prisma');
const {
  createOrder: cashfreeCreateOrder,
  fetchPayments: cashfreeFetchPayments,
  createRefund: cashfreeCreateRefund,
} = require('../utils/cashfree');
const { getActiveOffers, calculateProductPricing, normalizeCoupon } = require('../services/pricingService');
const { grantEntitlement, ensureLegacyEntitlement } = require('../services/entitlementService');
const { fulfillPaidOrder, money } = require('../services/orderFulfillmentService');
const { synchronizeOrderRefundState } = require('../services/refundStateService');
const { reconcilePendingPayments } = require('../services/paymentReconciliationService');
const { reconcilePendingRefunds } = require('../services/refundReconciliationService');
const { recordAnalyticsEvent } = require('../utils/analytics');
const recordAudit = require('../utils/auditLogger');
const crypto = require('crypto');

const getCashfreeMode = () => (process.env.CASHFREE_MODE === 'production' ? 'production' : 'sandbox');
const paidStates = ['SUCCESS', 'PARTIALLY_REFUNDED'];
const redemptionStates = ['PENDING', 'SUCCESS', 'PARTIALLY_REFUNDED', 'REFUNDED'];

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function assertOfferCapacity(tx, offer, userId) {
  if (!offer?.id) return;
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`offer:${offer.id}`}))`;
  const current = await tx.offer.findUnique({ where: { id: offer.id }, select: { maxRedemptions: true, perUserLimit: true, status: true, startAt: true, endAt: true } });
  const now = new Date();
  if (!current || current.status !== 'ACTIVE' || current.startAt > now || current.endAt < now) throw httpError('That offer is no longer available.', 409);

  const [totalUsed, userUsed] = await Promise.all([
    tx.order.count({ where: { offerId: offer.id, status: { in: redemptionStates } } }),
    tx.order.count({ where: { offerId: offer.id, userId, status: { in: redemptionStates } } }),
  ]);

  if (current.maxRedemptions !== null && totalUsed >= current.maxRedemptions) throw httpError('That offer has reached its redemption limit.', 409);
  if (current.perUserLimit > 0 && userUsed >= current.perUserLimit) throw httpError('You have already used this offer.', 409);
}

const quoteOrder = async (req, res) => {
  try {
    const { productId, couponCode } = req.body || {};
    if (!productId || typeof productId !== 'string') return res.status(400).json({ error: 'Product ID is required.' });
    const product = await prisma.product.findFirst({ where: { id: productId, isArchived: false, isDigital: true } });
    if (!product) return res.status(404).json({ error: 'Digital product not found or unavailable.' });
    const offers = await getActiveOffers();
    const pricing = calculateProductPricing(product, offers, normalizeCoupon(couponCode));
    if (normalizeCoupon(couponCode) && !pricing.offer) return res.status(400).json({ error: 'That coupon is invalid or no longer available for this product.' });
    return res.status(200).json({ success: true, ...pricing });
  } catch (error) {
    console.error('[PAYMENT] Quote error:', { requestId: req.requestId, message: error.message });
    return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Unable to calculate the current price.' });
  }
};

const createOrder = async (req, res) => {
  let internalOrderId = null;
  try {
    const { productId, customerPhone, clientRequestId, couponCode } = req.body || {};
    if (!productId || typeof productId !== 'string') return res.status(400).json({ error: 'Product ID is required.' });
    if (!clientRequestId || typeof clientRequestId !== 'string' || clientRequestId.length > 100) return res.status(400).json({ error: 'Checkout request ID is required.' });

    const legacyOwnership = await ensureLegacyEntitlement(req.user.id, productId);
    if (legacyOwnership) return res.status(200).json({ success: true, alreadyPurchased: true, order_id: legacyOwnership.sourceOrderId || null });

    const checkout = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`purchase:${req.user.id}:${productId}`}))`;

      const entitlement = await tx.entitlement.findUnique({ where: { userId_productId: { userId: req.user.id, productId } } });
      if (entitlement?.status === 'ACTIVE') return { type: 'OWNED', orderId: entitlement.sourceOrderId };

      const previousPurchase = await tx.order.findFirst({
        where: { userId: req.user.id, productId, status: { in: paidStates } },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        select: { id: true },
      });
      if (previousPurchase) {
        await grantEntitlement({ userId: req.user.id, productId, orderId: previousPurchase.id, client: tx });
        return { type: 'OWNED', orderId: previousPurchase.id };
      }

      const byRequest = await tx.order.findFirst({ where: { userId: req.user.id, clientRequestId } });
      if (byRequest) {
        if (paidStates.includes(byRequest.status)) return { type: 'OWNED', orderId: byRequest.id };
        if (byRequest.status === 'PENDING' && byRequest.paymentSessionId) return { type: 'PENDING', order: byRequest };
        throw httpError(byRequest.status === 'FAILED' ? 'This checkout attempt failed. Start checkout again to create a fresh payment session.' : 'This checkout attempt is already being processed.', 409);
      }

      const pending = await tx.order.findFirst({ where: { userId: req.user.id, productId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
      if (pending) {
        const stale = Date.now() - new Date(pending.createdAt).getTime() > 45 * 60 * 1000;
        if (!stale) return { type: 'PENDING', order: pending };
        await tx.order.update({ where: { id: pending.id }, data: { status: 'FAILED', transactionId: 'LOCAL_CHECKOUT_EXPIRED', paymentFailureReason: 'Checkout session expired before a new checkout was started.' } });
      }

      const product = await tx.product.findFirst({ where: { id: productId, isArchived: false, isDigital: true } });
      if (!product) throw httpError('Digital product not found or unavailable.', 404);
      if (!product.assetUrl) throw httpError('This digital product is not ready for delivery yet.', 409);

      const offers = await getActiveOffers(new Date(), tx);
      const normalizedCoupon = normalizeCoupon(couponCode);
      const pricing = calculateProductPricing(product, offers, normalizedCoupon);
      if (normalizedCoupon && !pricing.offer) throw httpError('That coupon is invalid or no longer available for this product.', 400);
      await assertOfferCapacity(tx, pricing.offer, req.user.id);

      const finalPrice = money(pricing.finalPrice);
      if (finalPrice === null) throw httpError('Unable to calculate the secure product price.', 500);
      if (finalPrice > 0 && !/^\d{10}$/.test(String(customerPhone || ''))) throw httpError('A valid 10-digit customer phone number is required.', 400);

      internalOrderId = `pluten_${crypto.randomUUID()}`;
      const baseData = {
        id: internalOrderId,
        userId: req.user.id,
        productId: product.id,
        offerId: pricing.offer?.id || null,
        totalAmount: finalPrice,
        originalAmount: product.price,
        discountAmount: Math.max(0, Number(product.price) - finalPrice),
        couponCode: normalizedCoupon || null,
        currency: 'INR',
        clientRequestId,
        customerSnapshot: { email: req.user.email, phone: customerPhone ? String(customerPhone) : null },
      };

      if (finalPrice === 0) {
        const order = await tx.order.create({ data: { ...baseData, status: 'SUCCESS', gateway: 'PLUTEN_FREE', transactionId: `FREE_${crypto.randomUUID()}`, paidAt: new Date() } });
        await grantEntitlement({ userId: req.user.id, productId: product.id, orderId: order.id, client: tx });
        return { type: 'FREE', order, pricing };
      }

      const order = await tx.order.create({ data: { ...baseData, status: 'PENDING', gateway: 'CASHFREE', transactionId: 'AWAITING_PAYMENT' } });
      return { type: 'NEW_PAID', order, pricing, phone: String(customerPhone) };
    });

    if (checkout.type === 'OWNED') return res.status(200).json({ success: true, alreadyPurchased: true, order_id: checkout.orderId || null });
    if (checkout.type === 'PENDING') {
      if (checkout.order.paymentSessionId) return res.status(200).json({ success: true, resumed: true, payment_session_id: checkout.order.paymentSessionId, order_id: checkout.order.id, amount: money(checkout.order.totalAmount), cashfree_mode: getCashfreeMode() });
      return res.status(409).json({ error: 'Your checkout is being prepared. Please try again in a moment.', order_id: checkout.order.id });
    }

    if (checkout.type === 'FREE') {
      await recordAnalyticsEvent({ type: 'CHECKOUT_STARTED', visitorId: String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim(), sessionKey: String(req.headers['x-analytics-session'] || '').trim() || null, userId: req.user.id, productId, metadata: { orderId: checkout.order.id, amount: 0, free: true } }).catch(() => null);
      await recordAnalyticsEvent({ type: 'PAYMENT_SUCCESS', visitorId: String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim(), sessionKey: String(req.headers['x-analytics-session'] || '').trim() || null, userId: req.user.id, productId, metadata: { orderId: checkout.order.id, free: true } }).catch(() => null);
      return res.status(200).json({ success: true, freeOrder: true, order_id: checkout.order.id, amount: 0, pricing: checkout.pricing });
    }

    const frontendBaseUrl = process.env.FRONTEND_URL;
    if (!frontendBaseUrl) throw new Error('FRONTEND_URL is not configured.');
    const request = {
      order_id: checkout.order.id,
      order_amount: money(checkout.order.totalAmount),
      order_currency: 'INR',
      customer_details: { customer_id: String(req.user.id), customer_phone: checkout.phone, customer_email: req.user.email },
      order_meta: {
        return_url: `${frontendBaseUrl}/payment-success?order_id={order_id}`,
        ...(process.env.CASHFREE_WEBHOOK_URL ? { notify_url: process.env.CASHFREE_WEBHOOK_URL } : {}),
      },
    };

    const response = await cashfreeCreateOrder(request);
    const paymentSessionId = response?.data?.payment_session_id;
    if (!paymentSessionId) throw new Error('Cashfree did not return a payment session.');

    await prisma.order.update({
      where: { id: checkout.order.id },
      data: {
        paymentSessionId: String(paymentSessionId),
        transactionId: String(response.data.cf_order_id || 'GATEWAY_SESSION_CREATED'),
        gatewayOrderId: String(response.data.cf_order_id || checkout.order.id),
      },
    });

    await recordAnalyticsEvent({ type: 'CHECKOUT_STARTED', visitorId: String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim(), sessionKey: String(req.headers['x-analytics-session'] || '').trim() || null, userId: req.user.id, productId, metadata: { orderId: checkout.order.id, amount: request.order_amount } }).catch(() => null);
    await recordAnalyticsEvent({ type: 'PAYMENT_ATTEMPTED', visitorId: String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim(), sessionKey: String(req.headers['x-analytics-session'] || '').trim() || null, userId: req.user.id, productId, metadata: { orderId: checkout.order.id } }).catch(() => null);

    return res.status(200).json({ success: true, payment_session_id: paymentSessionId, order_id: checkout.order.id, amount: request.order_amount, pricing: checkout.pricing, cashfree_mode: getCashfreeMode() });
  } catch (error) {
    console.error('[PAYMENT] Create order error:', { requestId: req.requestId, message: error.message, gateway: error?.response?.data });
    if (internalOrderId) {
      try {
        await prisma.order.updateMany({
          where: { id: internalOrderId, status: 'PENDING' },
          data: { status: 'FAILED', transactionId: 'GATEWAY_CREATE_FAILED', paymentFailureReason: String(error.message).slice(0, 250) },
        });
      } catch (updateError) {
        console.error('[PAYMENT] Failed to mark gateway create failure:', updateError.message);
      }
    }

    if (error?.code === 'P2002') {
      const pending = await prisma.order.findFirst({ where: { userId: req.user.id, productId: req.body?.productId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } }).catch(() => null);
      return res.status(409).json({ error: 'A checkout for this product is already in progress.', order_id: pending?.id || null });
    }
    return res.status(error.statusCode || 502).json({ error: error.statusCode ? error.message : 'Payment could not be initialized. Please start checkout again.' });
  }
};

const verifyPayment = async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== 'string') return res.status(400).json({ error: 'Order ID is required.' });
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id } });
    if (!order) return res.status(404).json({ error: 'Order not found for the authenticated account.' });
    if (paidStates.includes(order.status)) {
      await grantEntitlement({ userId: order.userId, productId: order.productId, orderId: order.id });
      return res.status(200).json({ success: true, message: 'Asset already secured.', order });
    }
    if (order.status === 'REFUNDED') return res.status(409).json({ error: 'This order has been fully refunded.', status: 'REFUNDED' });
    if (order.gateway === 'PLUTEN_FREE' && money(order.totalAmount) === 0) {
      const result = await fulfillPaidOrder(order.id, { amount: 0, paymentId: order.transactionId, gatewayOrderId: order.id, method: 'FREE' });
      return res.status(200).json({ success: true, order: result.order });
    }

    const cfResponse = await cashfreeFetchPayments(orderId);
    const successfulPayment = Array.isArray(cfResponse?.data) ? cfResponse.data.find((payment) => payment.payment_status === 'SUCCESS') : null;
    if (!successfulPayment) return res.status(409).json({ error: 'Payment has not been confirmed yet.', status: 'PENDING' });

    const result = await fulfillPaidOrder(orderId, {
      amount: successfulPayment.payment_amount,
      paymentId: successfulPayment.cf_payment_id,
      gatewayOrderId: order.gatewayOrderId || orderId,
      method: successfulPayment.payment_group || successfulPayment.payment_method || '',
    });
    if (result.state === 'AMOUNT_MISMATCH') return res.status(409).json({ error: 'Payment amount verification failed. Support has been notified.', status: 'REVIEW' });
    if (result.state !== 'SUCCESS') return res.status(409).json({ error: 'This transaction could not be fulfilled.', status: result.state });

    await recordAnalyticsEvent({ type: 'PAYMENT_SUCCESS', visitorId: String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim(), sessionKey: String(req.headers['x-analytics-session'] || '').trim() || null, userId: req.user.id, productId: result.order?.productId || null, metadata: { orderId } }).catch(() => null);
    return res.status(200).json({ success: true, order: result.order });
  } catch (error) {
    console.error('[PAYMENT] Verification error:', { requestId: req.requestId, message: error.message });
    return res.status(502).json({ error: 'The payment provider could not confirm this transaction right now.' });
  }
};

const webhookHandler = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody;
    if (!signature || !timestamp || !rawBody) return res.status(400).send('Missing webhook signature data.');

    const timestampMs = Number(timestamp);
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return res.status(401).send('Expired webhook.');

    const secretKey = process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) throw new Error('Cashfree webhook secret is not configured.');
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(`${timestamp}${rawBody}`).digest('base64');
    const provided = Buffer.from(String(signature));
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return res.status(401).send('Signature mismatch');

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload?.event;
    const orderId = payload?.data?.order?.order_id;
    if (!orderId) return res.status(200).send('WEBHOOK_RECEIVED');
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(200).send('WEBHOOK_RECEIVED');

    const refundPayload = payload?.data?.refund;
    if (refundPayload) {
      const merchantRefundId = String(refundPayload.refund_id || '').trim();
      const gatewayRefundId = refundPayload.cf_refund_id ? String(refundPayload.cf_refund_id) : null;
      const refundStatus = String(refundPayload.refund_status || '').toUpperCase();
      const mapped = refundStatus === 'SUCCESS' ? 'SUCCESS' : refundStatus === 'CANCELLED' ? 'CANCELLED' : refundStatus === 'FAILED' ? 'FAILED' : 'PENDING';
      let refund = merchantRefundId ? await prisma.refund.findUnique({ where: { refundId: merchantRefundId } }) : null;
      if (!refund && gatewayRefundId) refund = await prisma.refund.findFirst({ where: { gatewayRefundId } });

      if (!refund && merchantRefundId) {
        const amount = money(refundPayload.refund_amount);
        if (amount && amount > 0) {
          refund = await prisma.refund.create({ data: { orderId, userId: order.userId, refundId: merchantRefundId, gatewayRefundId, amount, status: mapped, processedAt: mapped === 'SUCCESS' ? new Date() : null, note: 'Imported from Cashfree webhook' } });
        }
      } else if (refund) {
        refund = await prisma.refund.update({
          where: { id: refund.id },
          data: {
            gatewayRefundId,
            status: mapped,
            processedAt: mapped === 'SUCCESS' ? new Date() : refund.processedAt,
            failureReason: mapped === 'FAILED' ? String(refundPayload.status_description || 'Refund failed').slice(0, 250) : null,
          },
        });
      }
      if (refund && mapped === 'SUCCESS') await prisma.$transaction((tx) => synchronizeOrderRefundState(orderId, tx));
      return res.status(200).send('WEBHOOK_RECEIVED');
    }

    if (event === 'PAYMENT_SUCCESS_WEBHOOK') {
      const cfPaymentId = payload?.data?.payment?.cf_payment_id;
      if (!cfPaymentId) return res.status(400).send('Malformed payment webhook.');
      const result = await fulfillPaidOrder(orderId, {
        amount: payload?.data?.payment?.payment_amount,
        paymentId: cfPaymentId,
        gatewayOrderId: order.gatewayOrderId || orderId,
        method: payload?.data?.payment?.payment_group || payload?.data?.payment?.payment_method || '',
      });
      if (result.state === 'SUCCESS') await recordAnalyticsEvent({ type: 'PAYMENT_SUCCESS', visitorId: `user:${order.userId}`, sessionKey: null, userId: order.userId, productId: order.productId, metadata: { orderId, webhook: true } }).catch(() => null);
    } else if (event && /FAILED|CANCELLED|USER_DROPPED|EXPIRED/i.test(event)) {
      await prisma.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'FAILED', transactionId: `GATEWAY_${String(event).slice(0, 50)}`, paymentFailureReason: String(event).slice(0, 250) } });
      await recordAnalyticsEvent({ type: 'PAYMENT_FAILED', visitorId: `user:${order.userId}`, sessionKey: null, userId: order.userId, productId: order.productId, metadata: { orderId, event } }).catch(() => null);
    }

    return res.status(200).send('WEBHOOK_RECEIVED');
  } catch (error) {
    console.error('[PAYMENT] Webhook processing fault:', { message: error.message });
    return res.status(500).send('WEBHOOK_FAULT');
  }
};

const createRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const amount = money(req.body?.amount);
    const note = String(req.body?.note || 'Pluten refund').trim().slice(0, 180);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Refund amount must be greater than zero.' });

    const reserved = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id"=${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { refunds: true } });
      if (!order) throw httpError('Order not found.', 404);
      if (!['SUCCESS', 'PARTIALLY_REFUNDED'].includes(order.status)) throw httpError('Only paid orders with remaining value can be refunded.', 409);

      const committed = order.refunds.reduce((sum, refund) => sum + (['SUCCESS', 'PENDING'].includes(refund.status) ? Number(refund.amount) : 0), 0);
      if (committed + amount > Number(order.totalAmount) + 0.00001) throw httpError('Refund amount exceeds the remaining refundable amount.', 400);

      const merchantRefundId = `rf_${crypto.randomUUID().replace(/-/g, '').slice(0, 28)}`;
      const refund = await tx.refund.create({ data: { orderId, userId: order.userId, refundId: merchantRefundId, amount, note } });
      return { order, refund, merchantRefundId };
    });

    await recordAudit({ userId: req.user.id, action: 'REFUND_REQUESTED', entity: 'ORDER', entityId: orderId, details: { amount, refundId: reserved.merchantRefundId, note }, req });

    try {
      const response = await cashfreeCreateRefund(
        reserved.order.gatewayOrderId || reserved.order.id,
        { refund_amount: amount, refund_id: reserved.merchantRefundId, refund_note: note, refund_speed: 'STANDARD' },
        crypto.randomUUID(),
      );
      const body = response?.data || {};
      const item = Array.isArray(body) ? body[0] : body;
      const status = String(item?.refund_status || 'PENDING').toUpperCase();
      const mapped = status === 'SUCCESS' ? 'SUCCESS' : status === 'CANCELLED' ? 'CANCELLED' : status === 'FAILED' ? 'FAILED' : 'PENDING';

      await prisma.refund.update({
        where: { id: reserved.refund.id },
        data: {
          gatewayRefundId: item?.cf_refund_id ? String(item.cf_refund_id) : null,
          status: mapped,
          processedAt: mapped === 'SUCCESS' ? new Date() : null,
          failureReason: mapped === 'FAILED' ? String(item?.status_description || 'Refund failed').slice(0, 250) : null,
        },
      });

      let financialState = null;
      if (mapped === 'SUCCESS') financialState = await prisma.$transaction((tx) => synchronizeOrderRefundState(orderId, tx));
      await recordAudit({ userId: req.user.id, action: 'REFUND_GATEWAY_RESULT', entity: 'ORDER', entityId: orderId, details: { amount, refundId: reserved.merchantRefundId, status: mapped, financialState }, req });
      return res.status(201).json({ success: true, refundId: reserved.merchantRefundId, status: mapped, financialState });
    } catch (error) {
      const gatewayStatus = Number(error?.response?.status || 0);
      const uncertain = !gatewayStatus || gatewayStatus >= 500;
      await prisma.refund.update({ where: { id: reserved.refund.id }, data: { status: uncertain ? 'PENDING' : 'FAILED', failureReason: String(error?.response?.data?.message || error.message).slice(0, 250) } });
      await recordAudit({ userId: req.user.id, action: uncertain ? 'REFUND_GATEWAY_UNCERTAIN' : 'REFUND_GATEWAY_FAILED', entity: 'ORDER', entityId: orderId, details: { amount, refundId: reserved.merchantRefundId, gatewayStatus: gatewayStatus || null }, req });
      if (uncertain) return res.status(202).json({ success: true, refundId: reserved.merchantRefundId, status: 'PENDING', message: 'Refund confirmation is pending. Pluten will reconcile it before another refund can consume this amount.' });
      return res.status(502).json({ error: 'Cashfree rejected the refund request.' });
    }
  } catch (error) {
    console.error('[PAYMENT] Refund error:', { requestId: req.requestId, message: error.message });
    return res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Refund operation failed.' });
  }
};

const reconcilePending = async (req, res) => {
  try {
    const options = { limit: req.body?.limit || 50, olderThanMinutes: req.body?.olderThanMinutes || 3 };
    const [payments, refunds] = await Promise.all([reconcilePendingPayments(options), reconcilePendingRefunds(options)]);
    await recordAudit({ userId: req.user.id, action: 'RECONCILE_PAYMENTS', entity: 'PAYMENT', entityId: 'pending', details: { paymentsChecked: payments.length, refundsChecked: refunds.length }, req });
    return res.status(200).json({ success: true, payments, refunds, checked: payments.length + refunds.length });
  } catch (error) {
    console.error('[PAYMENT] Reconciliation error:', { requestId: req.requestId, message: error.message });
    return res.status(502).json({ error: 'Payment reconciliation could not complete.' });
  }
};

module.exports = { quoteOrder, createOrder, verifyPayment, webhookHandler, createRefund, reconcilePending };
