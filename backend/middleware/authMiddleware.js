const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token;

    const authorization =
        req.headers.authorization;

    if (
        authorization &&
        /^Bearer\s+/i.test(
            authorization
        )
    ) {
        token =
            authorization
                .replace(
                    /^Bearer\s+/i,
                    ''
                )
                .trim();
    }

    if (
        !token &&
        req.cookies &&
        req.cookies.token
    ) {
        token =
            req.cookies.token;
    }

    if (
        !token ||
        token === 'undefined' ||
        token === 'null'
    ) {
        return res.status(401).json({
            error:
                'Access denied. Secure session token missing.',
        });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error(
                'JWT_SECRET is not configured.'
            );
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.user = decoded;

        next();
    } catch (error) {
        console.error(
            'Token verification failed:',
            error.message
        );

        return res.status(401).json({
            error:
                'Invalid or expired session token.',
        });
    }
};

const requireAdmin = (
    allowedRoles = ['SUPER_ADMIN']
) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error:
                    'Authentication required before role check.',
            });
        }

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {
            console.warn(
                `[SECURITY ALERT] User ${req.user.email} attempted unauthorized access.`
            );

            return res.status(403).json({
                error:
                    'Clearance level insufficient.',
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    requireAdmin,
};