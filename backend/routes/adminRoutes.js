const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { getTelemetry, getOrders, getCustomers } = require('../controllers/adminController');

const router = express.Router();
router.get('/telemetry', verifyToken, requireAdmin(['SUPER_ADMIN', 'FINANCE_MANAGER']), getTelemetry);
router.get('/orders', verifyToken, requireAdmin(['SUPER_ADMIN', 'FINANCE_MANAGER']), getOrders);
router.get('/customers', verifyToken, requireAdmin(['SUPER_ADMIN', 'CUSTOMER_SUPPORT']), getCustomers);

module.exports = router;
