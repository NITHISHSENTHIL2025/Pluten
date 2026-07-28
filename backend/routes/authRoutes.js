// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); // THE FIX: Import rate limiter

const { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getMe, 
    verifyEmail, 
    resendOTP,
    googleLogin 
} = require('../controllers/authController');

const { verifyToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidator');

// --- THE FIX (Audit Item #16): Production-Grade Rate Limiters ---

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Strict 5 attempts per IP
    message: { error: "Security protocol triggered: Too many login attempts. Please wait 15 minutes." }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Prevent bot spam: Only 3 account creations per hour per IP
    message: { error: "Security protocol triggered: Too many registration attempts from this IP." }
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 OTP verification/resend attempts
    message: { error: "Security protocol triggered: Too many OTP requests. Please wait 15 minutes." }
});

// --- Primary Authentication Firewalls ---

// Apply strict limiters to the entry points
router.post('/register', registerLimiter, validate(registerSchema), registerUser);
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/google-login', loginLimiter, googleLogin);

// No limit needed for these internal session checks
router.post('/logout', logoutUser);
router.get('/me', verifyToken, getMe);

// --- OTP Verification Endpoints ---

// Protect the email system from being used for spam
router.post('/verify-email', otpLimiter, verifyEmail);
router.post('/resend-otp', otpLimiter, resendOTP);

module.exports = router;