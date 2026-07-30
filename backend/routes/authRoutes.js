// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); 

const { 
    googleLogin,
    logoutUser, 
    getMe 
} = require('../controllers/authController');

const { verifyToken } = require('../middleware/authMiddleware');

// --- Enterprise Rate Limiting ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Adjusted for frictionless Google SSO
    message: { error: "Security protocol triggered: Too many login attempts. Please wait 15 minutes." }
});

// --- Unified Authentication Firewall ---
router.post('/google-login', loginLimiter, googleLogin);
router.post('/logout', logoutUser);
router.get('/me', verifyToken, getMe);

module.exports = router;