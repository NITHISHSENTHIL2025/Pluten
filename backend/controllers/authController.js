const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || (isProduction ? '.pluten.site' : undefined);
const sessionMinutes = Math.max(15, Number(process.env.JWT_EXPIRES_MINUTES || 30));
const sessionMaxAge = sessionMinutes * 60 * 1000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

const uxCookieOptions = {
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  firstName: user.firstName,
  lastName: user.lastName,
  isPremium: user.isPremium,
});

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Google token is required.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      throw new Error('Authentication configuration missing.');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload() || {};
    const normalizedEmail = String(payload.email || '').trim().toLowerCase();

    if (!normalizedEmail || payload.email_verified !== true) {
      return res.status(403).json({ error: 'Google account is not verified.' });
    }

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          firstName: payload.given_name || null,
          lastName: payload.family_name || null,
          authProvider: 'GOOGLE',
        },
      });
    } else if (user.authProvider !== 'GOOGLE') {
      // Preserve an existing account instead of silently creating a second identity.
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName || payload.given_name || null,
          lastName: user.lastName || payload.family_name || null,
        },
      });
    }

    const jwtToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: `${sessionMinutes}m` },
    );

    res.cookie('token', jwtToken, { ...sessionCookieOptions, maxAge: sessionMaxAge });
    res.cookie('client_auth', 'true', { ...uxCookieOptions, maxAge: 24 * 60 * 60 * 1000 });
    res.cookie('user_role', user.role, { ...uxCookieOptions, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('[AUTH] Google SSO fault:', {
      requestId: req.requestId,
      message: error.message,
    });
    return res.status(500).json({ error: 'Google sign-in could not be completed.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isPremium: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'Account not found.' });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('[AUTH] Session verification fault:', {
      requestId: req.requestId,
      message: error.message,
    });
    return res.status(500).json({ error: 'Failed to verify your account session.' });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('token', sessionCookieOptions);
  res.clearCookie('client_auth', uxCookieOptions);
  res.clearCookie('user_role', uxCookieOptions);
  return res.status(200).json({ success: true, message: 'Secure session terminated.' });
};

module.exports = { googleLogin, getMe, logoutUser };
