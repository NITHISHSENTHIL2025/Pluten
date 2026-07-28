// backend/utils/auditLogger.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const recordAudit = async ({ userId, action, entity, entityId, details, req }) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: details ? JSON.stringify(details) : null,
                ipAddress: String(ipAddress)
            }
        });
    } catch (error) {
        // Never crash the main request if audit logging fails, but log it to console
        console.error("[COMPLIANCE FAULT] Failed to record audit log:", error.message);
    }
};

module.exports = recordAudit;