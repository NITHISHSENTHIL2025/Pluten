const prisma = require('../lib/prisma');
const { revokeEntitlement } = require('./entitlementService');

const { asMoney, computeRefundState } = require('../utils/refundMath');

async function synchronizeOrderRefundState(orderId, client = prisma) {
  const order = await client.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, productId: true, totalAmount: true },
  });
  if (!order) return null;

  const aggregate = await client.refund.aggregate({
    where: { orderId, status: 'SUCCESS' },
    _sum: { amount: true },
  });

  const refundedAmount = asMoney(aggregate._sum.amount);
  const next = computeRefundState(order.totalAmount, refundedAmount);

  await client.order.update({
    where: { id: orderId },
    data: { status: next.orderStatus },
  });

  if (next.fullyRefunded) {
    await revokeEntitlement({
      userId: order.userId,
      productId: order.productId,
      reason: `Order ${orderId} fully refunded`,
      client,
    });
  }

  return {
    ...next,
    refundedAmount,
    totalAmount: asMoney(order.totalAmount),
  };
}

module.exports = { asMoney, computeRefundState, synchronizeOrderRefundState };
