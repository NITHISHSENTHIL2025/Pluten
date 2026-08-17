const express = require('express');
const rateLimit = require('express-rate-limit');
const { quoteOrder, createOrder, verifyPayment, webhookHandler } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many checkout attempts. Please try again later.' },
});

const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many pricing requests. Please try again later.' },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification requests. Please try again later.' },
});

router.post('/quote', quoteLimiter, quoteOrder);
router.post('/create', verifyToken, paymentLimiter, createOrder);
router.post('/verify', verifyToken, verifyLimiter, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

module.exports = router;
