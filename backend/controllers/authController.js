const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || (isProduction ? '.pluten.site' : undefined);

const sessionCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
};

const clearCookieOptions = {
    ...sessionCookieOptions,
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Google token is required.' });
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
            throw new Error('Google or JWT authentication configuration is missing.');
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name, email_verified } = payload || {};

        if (!email || !email_verified) {
            return res.status(403).json({ error: 'Google account is not verified.' });
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    firstName: given_name || null,
                    lastName: family_name || null,
                    authProvider: 'GOOGLE',
                },
            });
        }

        const jwtToken = jwt.sign(
            {
                id: user.id,
                role: user.role,
                isPremium: user.isPremium,
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        res.cookie('token', jwtToken, {
            ...sessionCookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        // Non-authoritative UX hints only. The signed token remains the authorization source.
        res.cookie('client_auth', 'true', {
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            ...(cookieDomain ? { domain: cookieDomain } : {}),
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.cookie('user_role', user.role, {
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            ...(cookieDomain ? { domain: cookieDomain } : {}),
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                isPremium: user.isPremium,
            },
        });
    } catch (error) {
        console.error('Google SSO Fault:', error);
        return res.status(500).json({ error: 'Google authorization sequence failed.' });
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

        if (!user) return res.status(404).json({ error: 'Identity not found.' });
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Session Verification Fault:', error.message);
        return res.status(500).json({ error: 'Failed to verify secure session.' });
    }
};

const logoutUser = (req, res) => {
    res.clearCookie('token', clearCookieOptions);
    res.clearCookie('client_auth', clearCookieOptions);
    res.clearCookie('user_role', clearCookieOptions);

    return res.status(200).json({ success: true, message: 'Secure session terminated.' });
};

module.exports = { googleLogin, getMe, logoutUser };
