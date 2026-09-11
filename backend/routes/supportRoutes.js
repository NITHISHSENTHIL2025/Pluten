const express = require('express');
const rateLimit = require('express-rate-limit');
const optionalAuth = require('../middleware/optionalAuth');
const { verifyToken, requireCapability } = require('../middleware/authMiddleware');
const { CAPABILITIES } = require('../config/permissions');
const { createSupportTicket, listSupportTickets, updateSupportTicket } = require('../controllers/supportController');

const router = express.Router();
const supportLimiter = rateLimit({ windowMs: 30 * 60 * 1000, max: 6, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many support requests. Please try again later.' } });

router.post('/', optionalAuth, supportLimiter, createSupportTicket);
router.get('/admin', verifyToken, requireCapability(CAPABILITIES.SUPPORT_VIEW), listSupportTickets);
router.patch('/admin/:id', verifyToken, requireCapability(CAPABILITIES.SUPPORT_MANAGE), updateSupportTicket);

module.exports = router;
