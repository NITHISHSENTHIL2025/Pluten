const test = require('node:test');
const assert = require('node:assert/strict');
const { CAPABILITIES, hasCapability } = require('../config/permissions');

test('super admin has every sensitive capability', () => {
  for (const capability of Object.values(CAPABILITIES)) assert.equal(hasCapability('SUPER_ADMIN', capability), true);
});

test('customer support can handle tickets and downloads but cannot refund or read audit log', () => {
  assert.equal(hasCapability('CUSTOMER_SUPPORT', CAPABILITIES.SUPPORT_MANAGE), true);
  assert.equal(hasCapability('CUSTOMER_SUPPORT', CAPABILITIES.DOWNLOADS_VIEW), true);
  assert.equal(hasCapability('CUSTOMER_SUPPORT', CAPABILITIES.REFUNDS_CREATE), false);
  assert.equal(hasCapability('CUSTOMER_SUPPORT', CAPABILITIES.AUDIT_VIEW), false);
});

test('finance can refund but cannot manage products', () => {
  assert.equal(hasCapability('FINANCE_MANAGER', CAPABILITIES.REFUNDS_CREATE), true);
  assert.equal(hasCapability('FINANCE_MANAGER', CAPABILITIES.PRODUCTS_MANAGE), false);
});
