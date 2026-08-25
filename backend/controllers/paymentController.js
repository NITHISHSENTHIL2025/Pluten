const prisma = require('../lib/prisma');
const { Cashfree, CASHFREE_API_VERSION } = require('../utils/cashfree');
const { getActiveOffers, calculateProductPricing, normalizeCoupon } = require('../services/pricingService');
const crypto = require('crypto');

const API_VERSION = CASHFREE_API_VERSION;

function toMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(2));
}

const getCashfreeMode = () => (process.env.CASHFREE_MODE === 'production' ? 'production' : 'sandbox');

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
    return res.status(500).json({ error: 'Unable to calculate the current price.' });
  }
};

const createOrder = async (req, res) => {
  let internalOrderId = null;
  try {
    const { productId, customerPhone, clientRequestId, couponCode } = req.body || {};
    if (!productId || typeof productId !== 'string') return res.status(400).json({ error: 'Product ID is required.' });
    if (!/^\d{10}$/.test(String(customerPhone || ''))) return res.status(400).json({ error: 'A valid 10-digit customer phone number is required.' });
    if (!clientRequestId || typeof clientRequestId !== 'string' || clientRequestId.length > 100) return res.status(400).json({ error: 'Checkout request ID is required.' });

    const previousPurchase = await prisma.order.findFirst({ where: { userId: req.user.id, productId, status: 'SUCCESS' }, select: { id: true } });
    if (previousPurchase) return res.status(200).json({ success: true, alreadyPurchased: true, order_id: previousPurchase.id });

    const existingOrder = await prisma.order.findFirst({ where: { userId: req.user.id, clientRequestId }, select: { id: true, status: true, transactionId: true } });
    if (existingOrder?.status === 'SUCCESS') return res.status(200).json({ success: true, alreadyPurchased: true, order_id: existingOrder.id });
    if (existingOrder) return res.status(409).json({ error: existingOrder.transactionId === 'GATEWAY_CREATE_FAILED' ? 'This checkout attempt failed. Start checkout again to create a fresh payment session.' : 'A checkout attempt already exists for this request.', order_id: existingOrder.id });

    const product = await prisma.product.findFirst({ where: { id: productId, isArchived: false, isDigital: true } });
    if (!product) return res.status(404).json({ error: 'Digital product not found or unavailable.' });
    if (!product.assetUrl) return res.status(409).json({ error: 'This digital product is not ready for delivery yet.' });

    const offers = await getActiveOffers();
    const pricing = calculateProductPricing(product, offers, normalizeCoupon(couponCode));
    const finalPrice = pricing.finalPrice;
    if (finalPrice === null) return res.status(500).json({ error: 'Unable to calculate the secure product price.' });
    if (normalizeCoupon(couponCode) && !pricing.offer) return res.status(400).json({ error: 'That coupon is invalid or no longer available for this product.' });

    internalOrderId = `pluten_${req.user.id}_${crypto.randomUUID()}`;
    await prisma.order.create({
      data: { id: internalOrderId, userId: req.user.id, productId: product.id, totalAmount: finalPrice, status: 'PENDING', transactionId: 'AWAITING_PAYMENT', clientRequestId },
    });

    const frontendBaseUrl = process.env.FRONTEND_URL;
    if (!frontendBaseUrl) throw new Error('FRONTEND_URL is not configured.');

    const request = {
      order_id: internalOrderId,
      order_amount: finalPrice,
      order_currency: 'INR',
      customer_details: { customer_id: String(req.user.id), customer_phone: String(customerPhone), customer_email: req.user.email },
      order_meta: {
        return_url: `${frontendBaseUrl}/payment-success?order_id={order_id}`,
        ...(process.env.CASHFREE_WEBHOOK_URL ? { notify_url: process.env.CASHFREE_WEBHOOK_URL } : {}),
      },
    };

    const response = await Cashfree.PGCreateOrder(request);
    if (!response?.data?.payment_session_id) throw new Error('Cashfree did not return a payment session.');

    await prisma.order.update({ where: { id: internalOrderId }, data: { transactionId: String(response.data.cf_order_id || 'GATEWAY_SESSION_CREATED') } });
    return res.status(200).json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: internalOrderId,
      amount: finalPrice,
      pricing,
      cashfree_mode: getCashfreeMode(),
    });
  } catch (error) {
    console.error('[PAYMENT] Create order error:', { requestId: req.requestId, message: error.message, gateway: error?.response?.data });
    if (internalOrderId) {
      try { await prisma.order.updateMany({ where: { id: internalOrderId, status: 'PENDING' }, data: { status: 'FAILED', transactionId: 'GATEWAY_CREATE_FAILED' } }); }
      catch (updateError) { console.error('[PAYMENT] Failed to mark gateway create failure:', updateError.message); }
    }
    return res.status(502).json({ error: 'Payment could not be initialized. Please start checkout again.' });
  }
};

const verifyPayment = async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== 'string') return res.status(400).json({ error: 'Order ID is required.' });
  try {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id } });
    if (!order) return res.status(404).json({ error: 'Order not found for the authenticated account.' });
    if (order.status === 'SUCCESS') return res.status(200).json({ success: true, message: 'Asset already secured.', order });

    const cfResponse = await Cashfree.PGOrderFetchPayments(orderId);
    const successfulPayment = Array.isArray(cfResponse?.data) ? cfResponse.data.find((payment) => payment.payment_status === 'SUCCESS') : null;
    if (!successfulPayment) return res.status(409).json({ error: 'Payment has not been confirmed yet.', status: 'PENDING' });

    const gatewayAmount = toMoney(successfulPayment.payment_amount);
    const expectedAmount = toMoney(order.totalAmount);
    if (gatewayAmount === null || expectedAmount === null || gatewayAmount !== expectedAmount) {
      console.error('[SECURITY] Payment amount mismatch', { requestId: req.requestId, orderId, expectedAmount, gatewayAmount });
      await prisma.order.update({ where: { id: orderId }, data: { status: 'FAILED', transactionId: 'GATEWAY_AMOUNT_MISMATCH' } });
      return res.status(400).json({ error: 'Payment verification failed due to a monetary mismatch.' });
    }

    const updated = await prisma.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'SUCCESS', transactionId: String(successfulPayment.cf_payment_id) } });
    if (!updated.count) {
      const current = await prisma.order.findUnique({ where: { id: orderId } });
      if (current?.status === 'SUCCESS') return res.status(200).json({ success: true, message: 'Asset already secured.', order: current });
      return res.status(409).json({ error: 'Payment confirmation is already being processed. Please try again.' });
    }
    const fulfilled = await prisma.order.findUnique({ where: { id: orderId } });
    return res.status(200).json({ success: true, order: fulfilled });
  } catch (error) {
    if (error?.code === 'P2025') return res.status(409).json({ error: 'Payment confirmation is already being processed. Please try again.' });
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
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      console.warn('[SECURITY ALERT] Invalid Cashfree webhook signature');
      return res.status(401).send('Signature mismatch');
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload?.event;
    const orderId = payload?.data?.order?.order_id;
    if (!orderId) return res.status(200).send('WEBHOOK_RECEIVED');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(200).send('WEBHOOK_RECEIVED');
    if (order.status === 'SUCCESS') return res.status(200).send('WEBHOOK_RECEIVED');

    if (event === 'PAYMENT_SUCCESS_WEBHOOK') {
      const gatewayAmount = toMoney(payload?.data?.payment?.payment_amount);
      const expectedAmount = toMoney(order.totalAmount);
      const cfPaymentId = payload?.data?.payment?.cf_payment_id;
      if (gatewayAmount === null || expectedAmount === null || gatewayAmount !== expectedAmount) {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'FAILED', transactionId: 'GATEWAY_AMOUNT_MISMATCH' } });
        return res.status(200).send('WEBHOOK_RECEIVED');
      }
      if (!cfPaymentId) return res.status(400).send('Malformed payment webhook.');
      await prisma.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'SUCCESS', transactionId: String(cfPaymentId) } });
    } else if (event && /FAILED|CANCELLED|USER_DROPPED|EXPIRED/i.test(event)) {
      await prisma.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'FAILED', transactionId: `GATEWAY_${String(event).slice(0, 50)}` } });
    }

    return res.status(200).send('WEBHOOK_RECEIVED');
  } catch (error) {
    console.error('[PAYMENT] Webhook processing fault:', { message: error.message });
    return res.status(500).send('WEBHOOK_FAULT');
  }
};

module.exports = { quoteOrder, createOrder, verifyPayment, webhookHandler };
