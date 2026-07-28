// backend/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library'); 

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

const registerUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Identity already registered in the ecosystem." });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); 

        const user = await prisma.user.create({
            data: { 
                email, 
                passwordHash, 
                firstName, 
                lastName,
                isVerified: false,
                otp,
                otpExpires,
                otpAttempts: 0 
            }
        });

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0a0a0a; color: #ffffff; border: 1px solid #222222; border-radius: 12px;">
                <h1 style="color: #dc2626; text-align: center; margin-bottom: 24px; letter-spacing: -0.05em; font-size: 28px;">iSEVENS NETWORK</h1>
                <p style="color: #d4d4d4; font-size: 16px; line-height: 1.5;">Hello ${firstName || 'User'},</p>
                <p style="color: #a3a3a3; font-size: 15px; line-height: 1.5;">To complete your account provision and authorize access to your digital vault, please enter the single-use verification code below:</p>
                
                <div style="background-color: #111111; border: 1px solid #333333; padding: 20px; text-align: center; border-radius: 8px; margin: 28px 0;">
                    <span style="letter-spacing: 8px; font-size: 36px; font-weight: bold; color: #ffffff; font-family: monospace;">${otp}</span>
                </div>

                <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 24px;">This security code self-destructs in 15 minutes.</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'iSevens Network - Authorization Code',
            html: emailHtml
        });

        res.status(201).json({
            success: true,
            message: "Identity provisioned. Authorization code dispatched to email.",
            email: user.email
        });
    } catch (error) {
        console.error("Registration Fault:", error);
        res.status(500).json({ error: "Failed to provision new identity." });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            return res.status(401).json({ error: "Invalid authorization credentials." });
        }

        if (!user.passwordHash && user.authProvider === 'GOOGLE') {
            return res.status(401).json({ error: "This identity is secured via Google SSO. Please use 'Continue with Google'." });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid authorization credentials." });
        }

        if (!user.isVerified) {
            return res.status(403).json({ 
                error: "Identity unverified. Please authorize your email to access the network.",
                requiresVerification: true,
                email: user.email 
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, isPremium: user.isPremium, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'none', 
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(200).json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName },
            token 
        });
    } catch (error) {
        console.error("Authentication Fault:", error);
        res.status(500).json({ error: "Secure login sequence failed." });
    }
};

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

        res.cookie('token', jwtToken, {
            httpOnly: true, 
            secure: true, 
            sameSite: 'none', 
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(200).json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName },
            token: jwtToken 
        });

    } catch (error) {
        console.error("Google SSO Fault:", error);
        res.status(500).json({ error: "Google authorization sequence failed." });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and authorization code are required." });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "Identity not found." });

        if (user.isVerified) {
            return res.status(400).json({ error: "Identity is already fully authorized." });
        }

        if (user.otpAttempts >= 5) {
            await prisma.user.update({
                where: { id: user.id },
                data: { otp: null, otpExpires: null, otpAttempts: 0 }
            });
            return res.status(429).json({ error: "Security Alert: Too many invalid attempts. Code destroyed. Please request a new one." });
        }

        if (new Date() > new Date(user.otpExpires)) {
            return res.status(400).json({ error: "Authorization code expired. Request a new code." });
        }

        if (user.otp !== otp) {
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { otpAttempts: { increment: 1 } }
            });
            const attemptsLeft = 5 - updatedUser.otpAttempts;
            return res.status(400).json({ error: `Invalid code. You have ${attemptsLeft} attempts remaining.` });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otp: null,
                otpExpires: null,
                otpAttempts: 0
            }
        });

        res.status(200).json({
            success: true,
            message: "Identity authorization complete. You may now Access Securely."
        });
    } catch (error) {
        console.error("Verification Fault:", error);
        res.status(500).json({ error: "Verification sequence failed." });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required." });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "Identity not found." });

        if (user.isVerified) {
            return res.status(400).json({ error: "Identity is already verified." });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: { 
                otp, 
                otpExpires,
                otpAttempts: 0 
            }
        });

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0a0a0a; color: #ffffff; border: 1px solid #222222; border-radius: 12px;">
                <h1 style="color: #dc2626; text-align: center; margin-bottom: 24px; letter-spacing: -0.05em; font-size: 28px;">iSEVENS NETWORK</h1>
                <p style="color: #d4d4d4; font-size: 16px; line-height: 1.5;">Hello ${user.firstName || 'User'},</p>
                <p style="color: #a3a3a3; font-size: 15px; line-height: 1.5;">Here is your newly requested authorization code:</p>
                
                <div style="background-color: #111111; border: 1px solid #333333; padding: 20px; text-align: center; border-radius: 8px; margin: 28px 0;">
                    <span style="letter-spacing: 8px; font-size: 36px; font-weight: bold; color: #ffffff; font-family: monospace;">${otp}</span>
                </div>

                <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 24px;">This security code self-destructs in 15 minutes.</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'iSevens Network - New Authorization Code',
            html: emailHtml
        });

        res.status(200).json({
            success: true,
            message: "New authorization code dispatched."
        });
    } catch (error) {
        console.error("Resend OTP Fault:", error);
        res.status(500).json({ error: "Failed to dispatch new authorization code." });
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
        secure: true,
        sameSite: 'none',
        expires: new Date(0)
    });
    res.status(200).json({ success: true, message: "Secure session terminated." });
};

module.exports = { registerUser, loginUser, logoutUser, getMe, verifyEmail, resendOTP, googleLogin };