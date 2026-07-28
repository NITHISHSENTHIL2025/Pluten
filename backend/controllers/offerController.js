// backend/controllers/offerController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Create a new offer
// @route   POST /api/admin/offers
const createOffer = async (req, res) => {
    try {
        const { name, type, value, applyTo, minOrderAmount, couponCode, autoApply, status, startAt, endAt, productIds } = req.body;

        const offerData = {
            name,
            type,
            value: parseFloat(value),
            applyTo,
            minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
            couponCode: couponCode || null,
            autoApply: Boolean(autoApply),
            status,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
        };

        // If applyTo is 'SELECTED', connect the specific products
        if (applyTo === 'SELECTED' && productIds && productIds.length > 0) {
            offerData.products = {
                connect: productIds.map(id => ({ id }))
            };
        }

        const offer = await prisma.offer.create({
            data: offerData,
            include: { products: true }
        });

        res.status(201).json(offer);
    } catch (error) {
        console.error("Create Offer Error:", error);
        res.status(500).json({ error: "Failed to create offer." });
    }
};

// @desc    Get all offers (Admin)
// @route   GET /api/admin/offers
const getAllOffers = async (req, res) => {
    try {
        const offers = await prisma.offer.findMany({
            orderBy: { createdAt: 'desc' },
            include: { products: { select: { id: true, title: true } } }
        });
        res.json(offers);
    } catch (error) {
        console.error("Fetch Offers Error:", error);
        res.status(500).json({ error: "Failed to fetch offers." });
    }
};

// @desc    Get active offers (Frontend)
// @route   GET /api/offers/active
const getActiveOffers = async (req, res) => {
    try {
        const now = new Date();
        const activeOffers = await prisma.offer.findMany({
            where: {
                status: 'ACTIVE',
                startAt: { lte: now },
                endAt: { gte: now }
            },
            include: { products: { select: { id: true } } }
        });
        res.json(activeOffers);
    } catch (error) {
        console.error("Fetch Active Offers Error:", error);
        res.status(500).json({ error: "Failed to fetch active offers." });
    }
};

// @desc    Update an offer
// @route   PUT /api/admin/offers/:id
const updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, value, applyTo, minOrderAmount, couponCode, autoApply, status, startAt, endAt, productIds } = req.body;

        const updateData = {
            name,
            type,
            value: parseFloat(value),
            applyTo,
            minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
            couponCode: couponCode || null,
            autoApply: Boolean(autoApply),
            status,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
        };

        // Handle updating product connections
        if (applyTo === 'SELECTED' && productIds) {
            updateData.products = {
                set: productIds.map(prodId => ({ id: prodId })) // Replaces existing connections
            };
        } else if (applyTo === 'ALL') {
            updateData.products = { set: [] }; // Clear connections if changing to ALL
        }

        const offer = await prisma.offer.update({
            where: { id },
            data: updateData,
            include: { products: true }
        });

        res.json(offer);
    } catch (error) {
        console.error("Update Offer Error:", error);
        res.status(500).json({ error: "Failed to update offer." });
    }
};

// @desc    Delete an offer
// @route   DELETE /api/admin/offers/:id
const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.offer.delete({ where: { id } });
        res.json({ message: "Offer deleted successfully" });
    } catch (error) {
        console.error("Delete Offer Error:", error);
        res.status(500).json({ error: "Failed to delete offer." });
    }
};

module.exports = {
    createOffer,
    getAllOffers,
    getActiveOffers,
    updateOffer,
    deleteOffer
};