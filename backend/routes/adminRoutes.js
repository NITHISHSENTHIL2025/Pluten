const express = require('express');
const { verifyToken, requireCapability } = require('../middleware/authMiddleware');
const { CAPABILITIES } = require('../config/permissions');
const {
  getOverview,
  getLive,
  getProductAnalytics,
  getPortfolioAnalytics,
  getOrders,
  getCustomers,
  getCustomer,
  getAuditLogs,
  getDownloads,
  getHealth,
} = require('../controllers/adminController');

const router = express.Router();
const gate = (capability) => [verifyToken, requireCapability(capability)];

router.get('/overview', ...gate(CAPABILITIES.OVERVIEW_VIEW), getOverview);
router.get('/live', ...gate(CAPABILITIES.LIVE_VIEW), getLive);
router.get('/analytics/products', ...gate(CAPABILITIES.PRODUCT_ANALYTICS_VIEW), getProductAnalytics);
router.get('/analytics/portfolios', ...gate(CAPABILITIES.PORTFOLIO_ANALYTICS_VIEW), getPortfolioAnalytics);
router.get('/orders', ...gate(CAPABILITIES.ORDERS_VIEW), getOrders);
router.get('/customers', ...gate(CAPABILITIES.CUSTOMERS_VIEW), getCustomers);
router.get('/customers/:id', ...gate(CAPABILITIES.CUSTOMERS_VIEW), getCustomer);
router.get('/security/audit', ...gate(CAPABILITIES.AUDIT_VIEW), getAuditLogs);
router.get('/security/downloads', ...gate(CAPABILITIES.DOWNLOADS_VIEW), getDownloads);
router.get('/health', ...gate(CAPABILITIES.HEALTH_VIEW), getHealth);

module.exports = router;
