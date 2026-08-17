const prisma = require('../lib/prisma');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
};

const recordAudit = async ({ userId, action, entity, entityId, details, req }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
        ipAddress: getClientIp(req),
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
