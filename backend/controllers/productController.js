const { PrismaClient } = require('@prisma/client');
const recordAudit = require('../utils/auditLogger');
const { s3 } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

const prisma = new PrismaClient();

const publicProductSelect = {
    id: true,
    title: true,
    description: true,
    price: true,
    isDigital: true,
    category: true,
    thumbnail: true,
    createdAt: true,
    updatedAt: true,
};

const adminProductSelect = {
    id: true,
    title: true,
    description: true,
    price: true,
    isDigital: true,
    category: true,
    thumbnail: true,
    isArchived: true,
    createdAt: true,
    updatedAt: true,
};

const getPublicProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isArchived: false },
            orderBy: { createdAt: 'desc' },
            select: publicProductSelect,
        });
        res.status(200).json(products);
    } catch (error) {
        console.error('Storefront Sync Error:', error);
        res.status(500).json({ error: 'Failed to retrieve ecosystem assets.' });
    }
};

const getSingleProduct = async (req, res) => {
    try {
        const product = await prisma.product.findFirst({
            where: { id: req.params.id, isArchived: false },
            select: publicProductSelect,
        });

        if (!product) return res.status(404).json({ error: 'Asset not found in the ecosystem.' });
        res.status(200).json(product);
    } catch (error) {
        console.error('Single Product Sync Error:', error);
        res.status(500).json({ error: 'Failed to retrieve asset details.' });
    }
};

const getAdminProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where: { isArchived: false },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: adminProductSelect,
            }),
            prisma.product.count({ where: { isArchived: false } }),
        ]);

        res.status(200).json({
            data: products,
            pagination: {
                totalRecords: totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                limit,
            },
        });
    } catch (error) {
        console.error('Admin Fetch Error:', error);
        res.status(500).json({ error: 'Failed to retrieve paginated assets.' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { title, description, price, isDigital, category } = req.body;
        const thumbnailPath = req.files?.thumbnail?.[0]?.location || null;
        const assetPath = req.files?.assetFile?.[0]?.key || null;

        if (!assetPath) return res.status(400).json({ error: 'A digital asset file (PDF/ZIP/DOCX) is required.' });

        const newProduct = await prisma.product.create({
            data: {
                title: String(title).trim(),
                description: String(description || '').trim(),
                price: Number(price),
                isDigital: isDigital === true || isDigital === 'true',
                category: category || 'Uncategorized',
                thumbnail: thumbnailPath,
                assetUrl: assetPath,
                isArchived: false,
            },
        });

        await recordAudit({
            userId: req.user.id,
            action: 'CREATE_PRODUCT',
            entity: 'PRODUCT',
            entityId: newProduct.id,
            details: { title: newProduct.title, price: newProduct.price },
            req,
        });

        res.status(201).json({ message: 'Asset successfully provisioned.', product: newProduct });
    } catch (error) {
        console.error('Asset Injection Error:', error);
        res.status(500).json({ error: 'Failed to provision digital asset.' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, category } = req.body;
        const updateData = {
            title: String(title).trim(),
            description: String(description || '').trim(),
            price: Number(price),
            category: category || 'Uncategorized',
        };

        if (req.files?.thumbnail?.[0]) updateData.thumbnail = req.files.thumbnail[0].location;
        if (req.files?.assetFile?.[0]) updateData.assetUrl = req.files.assetFile[0].key;

        const updatedProduct = await prisma.product.update({ where: { id }, data: updateData });

        await recordAudit({
            userId: req.user.id,
            action: 'UPDATE_PRODUCT',
            entity: 'PRODUCT',
            entityId: id,
            details: updateData,
            req,
        });

        res.status(200).json({ message: 'Asset successfully updated.', product: updatedProduct });
    } catch (error) {
        console.error('Asset Update Error:', error);
        res.status(500).json({ error: 'Failed to update digital asset.' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ error: 'Asset not found.' });

        await prisma.product.update({ where: { id }, data: { isArchived: true } });

        await recordAudit({
            userId: req.user.id,
            action: 'ARCHIVE_PRODUCT',
            entity: 'PRODUCT',
            entityId: id,
            details: { archivedTitle: product.title },
            req,
        });

        res.status(200).json({ message: 'Asset securely archived. Past customers retain access.' });
    } catch (error) {
        console.error('Asset Archiving Error:', error);
        res.status(500).json({ error: 'Failed to archive digital asset.' });
    }
};

module.exports = {
    getPublicProducts,
    getSingleProduct,
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};
