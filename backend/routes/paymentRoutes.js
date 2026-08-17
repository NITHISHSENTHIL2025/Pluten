const express = require('express');
const rateLimit = require('express-rate-limit');
const { createOrder, verifyPayment, webhookHandler } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many checkout attempts. Please try again later.' },
});

router.post('/create', verifyToken, paymentLimiter, createOrder);
router.post('/verify', verifyToken, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

module.exports = router;
