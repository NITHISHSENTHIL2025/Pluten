const test = require('node:test');
const assert = require('node:assert/strict');
const { asMoney, computeRefundState } = require('../utils/refundMath');

test('money is normalized to two decimals', () => {
  assert.equal(asMoney(10.126), 10.13);
  assert.equal(asMoney('499'), 499);
});

test('no refund preserves successful paid state', () => {
  assert.deepEqual(computeRefundState(499, 0), { orderStatus: 'SUCCESS', fullyRefunded: false });
});

test('partial refund preserves entitlement state', () => {
  assert.deepEqual(computeRefundState(499, 100), { orderStatus: 'PARTIALLY_REFUNDED', fullyRefunded: false });
});

test('full refund becomes fully refunded', () => {
  assert.deepEqual(computeRefundState(499, 499), { orderStatus: 'REFUNDED', fullyRefunded: true });
});
