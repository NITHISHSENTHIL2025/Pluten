const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { hasCapability } = require('../config/permissions');

const verifyToken = async (req, res, next) => {
  let token = null;
  const authorization = req.headers.authorization;

  if (authorization && /^Bearer\s+/i.test(authorization)) {
    token = authorization.replace(/^Bearer\s+/i, '').trim();
  }
  if (!token && req.cookies?.token) token = req.cookies.token;

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ error: 'Secure session required.' });
  }

  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return res.status(401).json({ error: 'Invalid secure session.' });

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isPremium: true },
    });
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });

    req.user = user;
    return next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired secure session.' });
  }
};

const deny = (req, res, detail) => {
  console.warn('[SECURITY ALERT] Unauthorized admin access attempt', {
    requestId: req.requestId,
    userId: req.user?.id,
    email: req.user?.email,
    role: req.user?.role,
    path: req.originalUrl,
    ...detail,
  });
  return res.status(403).json({ error: 'You do not have permission to access this area.' });
};

const requireAdmin = (allowedRoles = ['SUPER_ADMIN']) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!allowedRoles.includes(req.user.role)) return deny(req, res, { allowedRoles });
  return next();
};

const requireCapability = (capability) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!hasCapability(req.user.role, capability)) return deny(req, res, { capability });
  return next();
};

module.exports = { verifyToken, requireAdmin, requireCapability };
