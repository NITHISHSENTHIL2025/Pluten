const prisma = require('../lib/prisma');
const getClientIp = require('./clientIp');

const recordAudit = async ({ userId, action, entity, entityId, details, req }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req ? getClientIp(req) : null,
      },
    });
  } catch (error) {
    console.error('[COMPLIANCE] Failed to record audit log:', {
      requestId: req?.requestId,
      error: error.message,
    });
  }
};

module.exports = recordAudit;
