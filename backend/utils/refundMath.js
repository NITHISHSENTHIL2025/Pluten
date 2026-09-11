function asMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

function computeRefundState(orderAmount, successfulRefundAmount) {
  const total = asMoney(orderAmount);
  const refunded = asMoney(successfulRefundAmount);
  if (refunded <= 0) return { orderStatus: 'SUCCESS', fullyRefunded: false };
  if (refunded + 0.00001 >= total) return { orderStatus: 'REFUNDED', fullyRefunded: true };
  return { orderStatus: 'PARTIALLY_REFUNDED', fullyRefunded: false };
}

module.exports = { asMoney, computeRefundState };
