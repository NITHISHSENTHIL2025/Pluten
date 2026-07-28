const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createOrder, verifyPayment, webhookHandler } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Strict 5-request limit per 15 minutes for checkouts
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: { error: "Security protocol triggered: Too many checkout attempts. Please wait 15 minutes." }
});

router.post('/create', verifyToken, paymentLimiter, createOrder);
router.post('/verify', verifyToken, verifyPayment);

// Webhooks skip limiting to prevent blocking legitimate Cashfree pings
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

module.exports = router;