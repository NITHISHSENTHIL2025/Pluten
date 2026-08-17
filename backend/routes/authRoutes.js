const express = require('express');
const rateLimit = require('express-rate-limit');
const { googleLogin, logoutUser, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please try again later.' },
});

router.post('/google-login', loginLimiter, googleLogin);
router.post('/logout', logoutUser);
router.get('/me', verifyToken, getMe);

module.exports = router;
