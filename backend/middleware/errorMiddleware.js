// backend/middleware/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
    // If a route hasn't set a specific error status, default to 500 (Internal Server Error)
    let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    let message = err.message || "A critical system fault occurred.";

    // --- Enterprise Error Parsing ---

    // 1. Handle Prisma Database Errors (e.g., Unique constraint failed like a duplicate email)
    if (err.code === 'P2002') {
        statusCode = 400;
        message = `Duplicate entry detected for field: ${err.meta?.target?.join(', ')}`;
    }

    // 2. Handle Prisma Record Not Found
    if (err.code === 'P2025') {
        statusCode = 404;
        message = "The requested database record could not be located.";
    }

    // 3. Handle JWT Tampering/Expiration
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = "Secure session invalid or expired. Re-authentication required.";
    }

    // 4. Send the standardized response
    res.status(statusCode).json({
        success: false,
        error: message,
        // SECURITY: Never leak the stack trace in a production environment
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;