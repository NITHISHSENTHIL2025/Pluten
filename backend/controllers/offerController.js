const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createOffer = async (req, res) => {
    try {
        const {
            name,
            type,
            value,
            applyTo,
            minOrderAmount,
            couponCode,
            autoApply,
            status,
            startAt,
            endAt,
            productIds,
        } = req.body;

        const offerData = {
            name: name.trim(),
            type,
            value: Number(value),
            applyTo,
            minOrderAmount:
                minOrderAmount !== undefined &&
                minOrderAmount !== null
                    ? Number(minOrderAmount)
                    : null,
            couponCode:
                couponCode?.trim() || null,
            autoApply: Boolean(
                autoApply
            ),
            status: status || 'DRAFT',
            startAt: new Date(startAt),
            endAt: new Date(endAt),
        };

        if (
            offerData.type ===
                'PERCENTAGE' &&
            offerData.value > 100
        ) {
            return res.status(400).json({
                error:
                    'Percentage discount cannot exceed 100%.',
            });
        }

        if (
            offerData.endAt <=
            offerData.startAt
        ) {
            return res.status(400).json({
                error:
                    'End date must be after the start date.',
            });
        }

        if (
            offerData.applyTo ===
                'SELECTED' &&
            (!Array.isArray(productIds) ||
                productIds.length === 0)
        ) {
            return res.status(400).json({
                error:
                    'Selected-product offers require at least one product.',
            });
        }

        if (
            offerData.autoApply &&
            offerData.status === 'ACTIVE'
        ) {
            await prisma.offer.updateMany({
                where: {
                    autoApply: true,
                    status: 'ACTIVE',
                },
                data: {
                    autoApply: false,
                },
            });
        }

        if (
            offerData.applyTo ===
            'SELECTED'
        ) {
            offerData.products = {
                connect: productIds.map(
                    (id) => ({ id })
                ),
            };
        }

        const offer =
            await prisma.offer.create({
                data: offerData,
                include: {
                    products: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

        res.status(201).json(offer);
    } catch (error) {
        console.error(
            'Create Offer Error:',
            error
        );

        res.status(500).json({
            error:
                'Failed to create offer.',
        });
    }
};

const getAllOffers = async (
    req,
    res
) => {
    try {
        const offers =
            await prisma.offer.findMany({
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    products: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

        res.json(offers);
    } catch (error) {
        console.error(
            'Fetch Offers Error:',
            error
        );

        res.status(500).json({
            error:
                'Failed to fetch offers.',
        });
    }
};

const getActiveOffers = async (
    req,
    res
) => {
    try {
        const now = new Date();

        const offers =
            await prisma.offer.findMany({
                where: {
                    status: 'ACTIVE',
                    startAt: {
                        lte: now,
                    },
                    endAt: {
                        gte: now,
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    products: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

        res.json(offers);
    } catch (error) {
        console.error(
            'Fetch Active Offers Error:',
            error
        );

        res.status(500).json({
            error:
                'Failed to fetch active offers.',
        });
    }
};

const updateOffer = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        const {
            name,
            type,
            value,
            applyTo,
            minOrderAmount,
            couponCode,
            autoApply,
            status,
            startAt,
            endAt,
            productIds,
        } = req.body;

        const updateData = {
            name: name.trim(),
            type,
            value: Number(value),
            applyTo,
            minOrderAmount:
                minOrderAmount !== undefined &&
                minOrderAmount !== null
                    ? Number(minOrderAmount)
                    : null,
            couponCode:
                couponCode?.trim() || null,
            autoApply: Boolean(
                autoApply
            ),
            status,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
        };

        if (
            updateData.type ===
                'PERCENTAGE' &&
            updateData.value > 100
        ) {
            return res.status(400).json({
                error:
                    'Percentage discount cannot exceed 100%.',
            });
        }

        if (
            updateData.endAt <=
            updateData.startAt
        ) {
            return res.status(400).json({
                error:
                    'End date must be after the start date.',
            });
        }

        if (
            updateData.applyTo ===
            'SELECTED'
        ) {
            if (
                !Array.isArray(
                    productIds
                ) ||
                productIds.length === 0
            ) {
                return res.status(400).json({
                    error:
                        'Selected-product offers require at least one product.',
                });
            }

            updateData.products = {
                set: productIds.map(
                    (prodId) => ({
                        id: prodId,
                    })
                ),
            };
        }

        if (
            updateData.applyTo ===
            'ALL'
        ) {
            updateData.products = {
                set: [],
            };
        }

        if (
            updateData.autoApply &&
            updateData.status === 'ACTIVE'
        ) {
            await prisma.offer.updateMany({
                where: {
                    id: {
                        not: id,
                    },
                    autoApply: true,
                    status: 'ACTIVE',
                },
                data: {
                    autoApply: false,
                },
            });
        }

        const offer =
            await prisma.offer.update({
                where: { id },
                data: updateData,
                include: {
                    products: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

        res.json(offer);
    } catch (error) {
        console.error(
            'Update Offer Error:',
            error
        );

        res.status(500).json({
            error:
                'Failed to update offer.',
        });
    }
};

const deleteOffer = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;

        await prisma.offer.delete({
            where: { id },
        });

        res.json({
            message:
                'Offer deleted successfully.',
        });
    } catch (error) {
        console.error(
            'Delete Offer Error:',
            error
        );

        res.status(500).json({
            error:
                'Failed to delete offer.',
        });
    }
};

module.exports = {
    createOffer,
    getAllOffers,
    getActiveOffers,
    updateOffer,
    deleteOffer,
};