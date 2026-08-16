const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const isProduction =
    process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                error: 'Google token is required.',
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            throw new Error(
                'GOOGLE_CLIENT_ID is not configured.'
            );
        }

        if (!process.env.JWT_SECRET) {
            throw new Error(
                'JWT_SECRET is not configured.'
            );
        }

        const ticket =
            await googleClient.verifyIdToken({
                idToken: token,
                audience:
                    process.env.GOOGLE_CLIENT_ID,
            });

        const payload = ticket.getPayload();

        const {
            email,
            given_name,
            family_name,
            email_verified,
        } = payload;

        if (
            !email ||
            !email_verified
        ) {
            return res.status(403).json({
                error:
                    'Google account is not verified.',
            });
        }

        let user =
            await prisma.user.findUnique({
                where: { email },
            });

        if (!user) {
            user =
                await prisma.user.create({
                    data: {
                        email,
                        firstName:
                            given_name || null,
                        lastName:
                            family_name || null,
                        authProvider: 'GOOGLE',
                    },
                });
        }

        const jwtToken =
            jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    isPremium:
                        user.isPremium,
                    email: user.email,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN ||
                        '15m',
                }
            );

        res.cookie(
            'token',
            jwtToken,
            {
                ...cookieOptions,
                maxAge:
                    15 * 60 * 1000,
            }
        );

        // These two are ONLY UI/middleware hints.
        // Backend authorization must always use the signed token.
        res.cookie(
            'client_auth',
            'true',
            {
                secure: true,
                sameSite: 'lax',
                path: '/',
                maxAge:
                    24 * 60 * 60 * 1000,
            }
        );

        res.cookie(
            'user_role',
            user.role,
            {
                secure: true,
                sameSite: 'lax',
                path: '/',
                maxAge:
                    24 * 60 * 60 * 1000,
            }
        );

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                isPremium:
                    user.isPremium,
            },
        });
    } catch (error) {
        console.error(
            'Google SSO Fault:',
            error
        );

        return res.status(500).json({
            error:
                'Google authorization sequence failed.',
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user =
            await prisma.user.findUnique({
                where: {
                    id: req.user.id,
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    isPremium: true,
                },
            });

        if (!user) {
            return res.status(404).json({
                error:
                    'Identity not found.',
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error(
            'Session Verification Fault:',
            error.message
        );

        return res.status(500).json({
            error:
                'Failed to verify secure session.',
        });
    }
};

const logoutUser = (req, res) => {
    res.clearCookie(
        'token',
        cookieOptions
    );

    res.clearCookie(
        'client_auth',
        {
            secure: true,
            sameSite: 'lax',
            path: '/',
        }
    );

    res.clearCookie(
        'user_role',
        {
            secure: true,
            sameSite: 'lax',
            path: '/',
        }
    );

    return res.status(200).json({
        success: true,
        message:
            'Secure session terminated.',
    });
};

module.exports = {
    googleLogin,
    getMe,
    logoutUser,
};