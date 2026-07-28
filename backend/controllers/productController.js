// backend/controllers/productController.js
const { PrismaClient } = require('@prisma/client');
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const cloudinary = require('../config/cloudinary');
const { s3 } = require('../middleware/uploadMiddleware');
const recordAudit = require('../utils/auditLogger'); 

const prisma = new PrismaClient();

// --- Public Storefront Actions ---
const getPublicProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            // THE FIX: Hide archived assets from the public store
            where: { isArchived: false }, 
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(products);
    } catch (error) {
        console.error("Storefront Sync Error:", error);
        res.status(500).json({ error: "Failed to retrieve ecosystem assets." });
    }
};

const getSingleProduct = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id }
        });
        
        // THE FIX: Prevent new users from accessing direct links to archived products
        if (!product || product.isArchived) {
            return res.status(404).json({ error: "Asset not found in the ecosystem." });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error("Single Product Sync Error:", error);
        res.status(500).json({ error: "Failed to retrieve asset details." });
    }
};

// --- Admin Mission Control Actions ---
const getAdminProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where: { isArchived: false }, // Keep the admin dashboard clean
                skip: skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where: { isArchived: false } })
        ]);

        res.status(200).json({
            data: products,
            pagination: { 
                totalRecords: totalCount, 
                currentPage: page, 
                totalPages: Math.ceil(totalCount / limit), 
                limit: limit 
            }
        });
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        res.status(500).json({ error: "Failed to retrieve paginated assets." });
    }
};

const createProduct = async (req, res) => {
    try {
        const { title, description, price, isDigital, category } = req.body;
        
        const thumbnailPath = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0].location : null;
        const assetPath = req.files && req.files['assetFile'] ? req.files['assetFile'][0].key : null; 

        if (!assetPath) {
            return res.status(400).json({ error: "A digital asset file (PDF/ZIP/DOCX) is required." });
        }

        const newProduct = await prisma.product.create({
            data: {
                title,
                description,
                price: Number(price), 
                isDigital: isDigital === 'true',
                category: category || "Uncategorized",
                thumbnail: thumbnailPath,
                assetUrl: assetPath,
                isArchived: false
            }
        });

        await recordAudit({
            userId: req.user.id,
            action: 'CREATE_PRODUCT',
            entity: 'PRODUCT',
            entityId: newProduct.id,
            details: { title: newProduct.title, price: newProduct.price },
            req
        });

        res.status(201).json({ message: "Asset successfully provisioned.", product: newProduct });
    } catch (error) {
        console.error("Asset Injection Error:", error);
        res.status(500).json({ error: "Failed to provision digital asset." });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, category } = req.body;
        
        let updateData = {
            title, 
            description, 
            price: Number(price), 
            category: category || "Uncategorized"
        };

        if (req.files && req.files['thumbnail']) {
            updateData.thumbnail = req.files['thumbnail'][0].location;
        }
        if (req.files && req.files['assetFile']) {
            updateData.assetUrl = req.files['assetFile'][0].key;
        }
        
        const updatedProduct = await prisma.product.update({
            where: { id: id },
            data: updateData
        });

        await recordAudit({
            userId: req.user.id,
            action: 'UPDATE_PRODUCT',
            entity: 'PRODUCT',
            entityId: id,
            details: updateData,
            req
        });
        
        res.status(200).json({ message: "Asset successfully updated.", product: updatedProduct });
    } catch (error) {
        console.error("Asset Update Error:", error);
        res.status(500).json({ error: "Failed to update digital asset." });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) return res.status(404).json({ error: "Asset not found." });

        // THE FIX (Item #7 & #13): Soft Deletion Sequence
        // We NO LONGER delete cloud files, customer orders, or download logs.
        // The asset is securely hidden from the public, but preserved for past buyers.
        await prisma.product.update({
            where: { id: id },
            data: { isArchived: true }
        });

        await recordAudit({
            userId: req.user.id,
            action: 'ARCHIVE_PRODUCT',
            entity: 'PRODUCT',
            entityId: id,
            details: { archivedTitle: product.title },
            req
        });

        res.status(200).json({ message: "Asset securely archived. Past customers retain access." });
    } catch (error) {
        console.error("Asset Archiving Error:", error);
        res.status(500).json({ error: "Failed to archive digital asset." });
    }
};

module.exports = {
    getPublicProducts,
    getSingleProduct,
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct
};