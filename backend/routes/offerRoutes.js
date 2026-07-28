const express = require('express');
const router = express.Router();
const { 
    createOffer, 
    getAllOffers, 
    getActiveOffers, 
    updateOffer, 
    deleteOffer 
} = require('../controllers/offerController');

const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { offerSchema } = require('../validators/adminValidator');

// --- Public Ecosystem Routes ---
router.get('/active', getActiveOffers);

// --- Secure Mission Control Routes (Admin Only) ---
router.post('/admin', verifyToken, requireAdmin(['SUPER_ADMIN', 'PRODUCT_MANAGER']), validate(offerSchema), createOffer);
router.get('/admin', verifyToken, requireAdmin(['SUPER_ADMIN', 'PRODUCT_MANAGER']), getAllOffers);
router.put('/admin/:id', verifyToken, requireAdmin(['SUPER_ADMIN', 'PRODUCT_MANAGER']), validate(offerSchema), updateOffer);
router.delete('/admin/:id', verifyToken, requireAdmin(['SUPER_ADMIN', 'PRODUCT_MANAGER']), deleteOffer);

module.exports = router;