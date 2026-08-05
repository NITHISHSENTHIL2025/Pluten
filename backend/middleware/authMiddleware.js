// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token;

    // THE FIX: Prioritize the explicit Header token over the Cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token || token === 'undefined') {
        return res.status(401).json({ error: "Access Denied. Secure session token missing." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return res.status(403).json({ error: "Invalid or expired session token." });
    }
};

const requireAdmin = (allowedRoles = ['SUPER_ADMIN']) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required before role check." });
        }
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`[SECURITY ALERT] User ${req.user.email} attempted unauthorized access.`);
            return res.status(403).json({ error: "Clearance Level Insufficient." });
        }
        next();
    };
};

module.exports = { verifyToken, requireAdmin }; 