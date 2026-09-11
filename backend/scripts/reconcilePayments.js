require('dotenv').config();
const { reconcilePendingPayments } = require('../services/paymentReconciliationService');
const { reconcilePendingRefunds } = require('../services/refundReconciliationService');
const prisma = require('../lib/prisma');

(async () => {
  try {
    const [payments, refunds] = await Promise.all([
      reconcilePendingPayments({ limit: 100, olderThanMinutes: 3 }),
      reconcilePendingRefunds({ limit: 100, olderThanMinutes: 3 }),
    ]);
    console.log(JSON.stringify({ ok: true, payments, refunds }, null, 2));
    process.exitCode = 0;
  } catch (error) {
    console.error('[RECONCILIATION FAILED]', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
