const jwt = require('jsonwebtoken');

// 1. Verify if the user is authenticated (HttpOnly Cookie Check)
const verifyToken = (req, res, next) => {
    // Check the HttpOnly cookie first. Fallback to Bearer header for legacy/mobile support.
    const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ error: "Access Denied. Secure session token missing." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attaches the payload (id, role, email) to the request
        next();
    } catch (error) {
        return res.status(403).json({ error: "Invalid or expired session token." });
    }
};

// 2. Verify if the user has specific Mission Control clearance
const requireAdmin = (allowedRoles = ['SUPER_ADMIN']) => {
    return (req, res, next) => {
        
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required before role check." });
        }

        // Cross-reference the user's role against the endpoint's allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`[SECURITY ALERT] User ${req.user.email || req.user.id} attempted unauthorized access.`);
            return res.status(403).json({ 
                error: "Clearance Level Insufficient. This action has been logged." 
            });
        }

        next();
    };
};

module.exports = { verifyToken, requireAdmin };