const prisma = require('../lib/prisma');
const { fetchRefund } = require('../utils/cashfree');
const { synchronizeOrderRefundState } = require('./refundStateService');

function mapRefundStatus(value) {
  const status = String(value || '').toUpperCase();
  if (status === 'SUCCESS') return 'SUCCESS';
  if (status === 'FAILED') return 'FAILED';
  if (status === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
}

async function reconcileRefund(refund) {
  const orderId = refund.order.gatewayOrderId || refund.order.id;
  const response = await fetchRefund(orderId, refund.refundId);
  const body = response?.data || {};
  const mapped = mapRefundStatus(body.refund_status);
  await prisma.refund.update({
    where: { id: refund.id },
    data: {
      gatewayRefundId: body.cf_refund_id ? String(body.cf_refund_id) : refund.gatewayRefundId,
      status: mapped,
      processedAt: mapped === 'SUCCESS' ? (refund.processedAt || new Date()) : refund.processedAt,
      failureReason: mapped === 'FAILED' ? String(body.status_description || 'Refund failed').slice(0, 250) : null,
    },
  });
  if (mapped === 'SUCCESS') await prisma.$transaction((tx) => synchronizeOrderRefundState(refund.orderId, tx));
  return { refundId: refund.refundId, orderId: refund.orderId, action: mapped };
}

async function reconcilePendingRefunds({ limit = 50, olderThanMinutes = 3 } = {}) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const refunds = await prisma.refund.findMany({
    where: { status: 'PENDING', createdAt: { lte: cutoff } },
    include: { order: { select: { id: true, gatewayOrderId: true } } },
    orderBy: { createdAt: 'asc' },
    take: Math.min(Math.max(Number(limit) || 50, 1), 200),
  });
  const results = [];
  for (const refund of refunds) {
    try { results.push(await reconcileRefund(refund)); }
    catch (error) {
      console.error('[REFUND] Reconciliation failed:', { refundId: refund.refundId, message: error.message });
      results.push({ refundId: refund.refundId, orderId: refund.orderId, action: 'ERROR', error: error.message });
    }
  }
  return results;
}

module.exports = { mapRefundStatus, reconcileRefund, reconcilePendingRefunds };
