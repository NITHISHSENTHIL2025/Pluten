const express = require('express');

const {
  verifyToken,
} = require('../middleware/authMiddleware');

const {
  listPortfolios,
  createPortfolio,
  getPortfolio,
  updatePortfolio,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio,
} = require('../controllers/portfolioController');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public portfolio
|--------------------------------------------------------------------------
|
| Must stay above /:id so "public" is not treated as a portfolio ID.
|
*/
router.get(
  '/public/:username',
  getPublicPortfolio,
);

/*
|--------------------------------------------------------------------------
| Authenticated portfolio management
|--------------------------------------------------------------------------
*/

router.get(
  '/',
  verifyToken,
  listPortfolios,
);

router.post(
  '/',
  verifyToken,
  createPortfolio,
);

router.get(
  '/:id',
  verifyToken,
  getPortfolio,
);

router.put(
  '/:id',
  verifyToken,
  updatePortfolio,
);

router.delete(
  '/:id',
  verifyToken,
  deletePortfolio,
);

router.post(
  '/:id/publish',
  verifyToken,
  publishPortfolio,
);

router.post(
  '/:id/unpublish',
  verifyToken,
  unpublishPortfolio,
);

module.exports = router;