const prisma = require('../lib/prisma');
const { grantEntitlement } = require('./entitlementService');

function money(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Number(number.toFixed(2));
}

async function fulfillPaidOrder(orderId, payment = {}, client = prisma) {
  return client.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id"=${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return { state: 'MISSING', order: null };

    if (order.status === 'REFUNDED') return { state: 'REFUNDED', order };

    const expectedAmount = money(order.totalAmount);
    const gatewayAmount = money(payment.amount ?? order.totalAmount);
    if (expectedAmount === null || gatewayAmount === null || expectedAmount !== gatewayAmount) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'FAILED',
          transactionId: 'GATEWAY_AMOUNT_MISMATCH',
          paymentFailureReason: 'Gateway amount mismatch',
        },
      });
      return { state: 'AMOUNT_MISMATCH', order };
    }

    if (order.status !== 'SUCCESS' && order.status !== 'PARTIALLY_REFUNDED') {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'SUCCESS',
          transactionId: payment.paymentId ? String(payment.paymentId) : order.transactionId,
          gatewayPaymentId: payment.paymentId ? String(payment.paymentId) : order.gatewayPaymentId,
          gatewayOrderId: payment.gatewayOrderId ? String(payment.gatewayOrderId) : order.gatewayOrderId,
          paymentMethod: payment.method ? String(payment.method).slice(0, 100) : order.paymentMethod,
          paymentFailureReason: null,
          paidAt: order.paidAt || new Date(),
        },
      });
    }

    await grantEntitlement({ userId: order.userId, productId: order.productId, orderId, client: tx });
    const fulfilled = await tx.order.findUnique({ where: { id: orderId } });
    return { state: 'SUCCESS', order: fulfilled };
  });
}

module.exports = { money, fulfillPaidOrder };
