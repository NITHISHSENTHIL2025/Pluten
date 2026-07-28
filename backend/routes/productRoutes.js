const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { 
    getPublicProducts, getSingleProduct, getAdminProducts,
    createProduct, updateProduct, deleteProduct 
} = require('../controllers/productController');

const validate = require('../middleware/validateMiddleware');
const { productSchema } = require('../validators/adminValidator');

const router = express.Router();

// --- Public Ecosystem Routes ---
router.get('/products', getPublicProducts);
router.get('/products/:id', getSingleProduct);

// --- Admin Endpoints (Auth & Clearance Required) ---
router.get('/admin/products', 
    verifyToken, 
    requireAdmin(['SUPER_ADMIN', 'PRODUCT_MANAGER']), 
    getAdminProducts
);

router.post('/admin/products', 
    verifyToken, 
    requireAdmin(['SUPER_ADMIN', 'PRODUCT_MANAGER']), 
    upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'assetFile', maxCount: 1 }]), 
    validate(productSchema), 
    createProduct
);

router.put('/admin/products/:id', 
    verifyToken, 
    requireAdmin(['SUPER_ADMIN', 'PRODUCT_MANAGER']), 
    upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'assetFile', maxCount: 1 }]), 
    validate(productSchema), 
    updateProduct
);

// Only highest clearance can delete products entirely
router.delete('/admin/products/:id', 
    verifyToken, 
    requireAdmin(['SUPER_ADMIN']), 
    deleteProduct
);

module.exports = router;