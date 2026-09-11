const prisma = require('../lib/prisma');
const { fetchPayments } = require('../utils/cashfree');
const { money, fulfillPaidOrder } = require('./orderFulfillmentService');

async function reconcileOrder(order) {
  const response = await fetchPayments(order.id);
  const payments = Array.isArray(response?.data) ? response.data : [];
  const success = payments.find((item) => String(item.payment_status).toUpperCase() === 'SUCCESS');

  if (success) {
    const result = await fulfillPaidOrder(order.id, {
      amount: money(success.payment_amount),
      paymentId: success.cf_payment_id,
      gatewayOrderId: order.gatewayOrderId || order.id,
      method: success.payment_group || success.payment_method || '',
    });
    return { orderId: order.id, action: result.state };
  }

  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  if (ageMs >= 45 * 60 * 1000) {
    await prisma.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: {
        status: 'FAILED',
        transactionId: 'RECONCILED_EXPIRED',
        paymentFailureReason: 'No successful Cashfree payment found during reconciliation.',
      },
    });
    return { orderId: order.id, action: 'EXPIRED' };
  }

  return { orderId: order.id, action: 'STILL_PENDING' };
}

async function reconcilePendingPayments({ limit = 50, olderThanMinutes = 3 } = {}) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: { status: 'PENDING', gateway: 'CASHFREE', createdAt: { lte: cutoff } },
    orderBy: { createdAt: 'asc' },
    take: Math.min(Math.max(Number(limit) || 50, 1), 200),
  });

  const results = [];
  for (const order of orders) {
    try {
      results.push(await reconcileOrder(order));
    } catch (error) {
      console.error('[PAYMENT] Reconciliation failed:', { orderId: order.id, message: error.message });
      results.push({ orderId: order.id, action: 'ERROR', error: error.message });
    }
  }
  return results;
}

module.exports = { reconcileOrder, reconcilePendingPayments };
