const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Google token is required." });

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, given_name, family_name, email_verified } = payload;

        if (!email_verified) return res.status(403).json({ error: "Google account is unverified." });

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    firstName: given_name,
                    lastName: family_name,
                    isVerified: true, 
                    authProvider: 'GOOGLE'
                }
            });
        }

        const jwtToken = jwt.sign(
            { id: user.id, role: user.role, isPremium: user.isPremium, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // THE FIX 1: Allow cross-domain cookies from Render to Vercel
        res.cookie('token', jwtToken, {
            httpOnly: true, 
            secure: true, // Must strictly be true in production
            sameSite: 'none', // Crucial for cross-origin APIs
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(200).json({
            success: true,
            token: jwtToken, // THE FIX 2: Send the token in the JSON body
            user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName }
        });

    } catch (error) {
        console.error("Google SSO Fault:", error);
        res.status(500).json({ error: "Google authorization sequence failed." });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, firstName: true, lastName: true, isPremium: true, isVerified: true }
        });

        if (!user) return res.status(404).json({ error: "Identity not found." });

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Session Verification Fault:", error);
        res.status(500).json({ error: "Failed to verify secure session." });
    }
};

const logoutUser = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ success: true, message: "Secure session terminated." });
};

// Export only the routes we need
module.exports = { googleLogin, getMe, logoutUser };