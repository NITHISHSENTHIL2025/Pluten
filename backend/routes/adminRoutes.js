const express = require('express');

const {
  verifyToken,
  requireAdmin,
} = require('../middleware/authMiddleware');

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

const ALL_ADMINS = [
  'SUPER_ADMIN',
  'FINANCE_MANAGER',
  'PRODUCT_MANAGER',
  'CUSTOMER_SUPPORT',
];

/*
|--------------------------------------------------------------------------
| OVERVIEW
|--------------------------------------------------------------------------
*/

router.get(
  '/overview',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
    'FINANCE_MANAGER',
  ]),
  getOverview,
);

/*
|--------------------------------------------------------------------------
| LIVE VISITORS
|--------------------------------------------------------------------------
*/

router.get(
  '/live',
  verifyToken,
  requireAdmin(ALL_ADMINS),
  getLive,
);

/*
|--------------------------------------------------------------------------
| PRODUCT ANALYTICS
|--------------------------------------------------------------------------
*/

router.get(
  '/analytics/products',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
    'FINANCE_MANAGER',
    'PRODUCT_MANAGER',
  ]),
  getProductAnalytics,
);

/*
|--------------------------------------------------------------------------
| PORTFOLIO ANALYTICS
|--------------------------------------------------------------------------
*/

router.get(
  '/analytics/portfolios',
  verifyToken,
  requireAdmin(ALL_ADMINS),
  getPortfolioAnalytics,
);

/*
|--------------------------------------------------------------------------
| ORDERS
|--------------------------------------------------------------------------
*/

router.get(
  '/orders',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
    'FINANCE_MANAGER',
  ]),
  getOrders,
);

/*
|--------------------------------------------------------------------------
| CUSTOMERS
|--------------------------------------------------------------------------
*/

router.get(
  '/customers',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
    'CUSTOMER_SUPPORT',
  ]),
  getCustomers,
);

router.get(
  '/customers/:id',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
    'CUSTOMER_SUPPORT',
  ]),
  getCustomer,
);

/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

router.get(
  '/security/audit',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
  ]),
  getAuditLogs,
);

router.get(
  '/security/downloads',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
    'CUSTOMER_SUPPORT',
  ]),
  getDownloads,
);

/*
|--------------------------------------------------------------------------
| ADMIN HEALTH
|--------------------------------------------------------------------------
*/

router.get(
  '/health',
  verifyToken,
  requireAdmin([
    'SUPER_ADMIN',
  ]),
  getHealth,
);

module.exports = router;