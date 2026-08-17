const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const { getUserProfile, getUserLibrary, downloadAsset } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', verifyToken, getUserProfile);
router.get('/library', verifyToken, getUserLibrary);
router.get('/download/:productId', verifyToken, downloadAsset);

module.exports = router;
