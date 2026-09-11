const prisma = require('../lib/prisma');

const PAID_ORDER_STATES = ['SUCCESS', 'PARTIALLY_REFUNDED'];

async function findActiveEntitlement(userId, productId, client = prisma) {
  return client.entitlement.findFirst({
    where: { userId, productId, status: 'ACTIVE' },
  });
}

async function grantEntitlement({ userId, productId, orderId, client = prisma }) {
  return client.entitlement.upsert({
    where: { userId_productId: { userId, productId } },
    create: {
      userId,
      productId,
      sourceOrderId: orderId || null,
      status: 'ACTIVE',
      grantedAt: new Date(),
    },
    update: {
      sourceOrderId: orderId || undefined,
      status: 'ACTIVE',
      grantedAt: new Date(),
      revokedAt: null,
      revokeReason: null,
    },
  });
}

async function revokeEntitlement({ userId, productId, reason, client = prisma }) {
  return client.entitlement.updateMany({
    where: { userId, productId, status: 'ACTIVE' },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokeReason: String(reason || 'Entitlement revoked').slice(0, 250),
    },
  });
}

async function ensureLegacyEntitlement(userId, productId) {
  const existing = await findActiveEntitlement(userId, productId);
  if (existing) return existing;

  const legacyOrder = await prisma.order.findFirst({
    where: {
      userId,
      productId,
      status: { in: PAID_ORDER_STATES },
    },
    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    select: { id: true },
  });

  if (!legacyOrder) return null;

  return grantEntitlement({ userId, productId, orderId: legacyOrder.id });
}

module.exports = {
  PAID_ORDER_STATES,
  findActiveEntitlement,
  grantEntitlement,
  revokeEntitlement,
  ensureLegacyEntitlement,
};
