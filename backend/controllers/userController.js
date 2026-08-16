const { PrismaClient } = require('@prisma/client');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3 } = require('../middleware/uploadMiddleware');

const prisma = new PrismaClient();

const getUserProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isPremium: true,
                createdAt: true,
            },
        });

        if (!user) return res.status(404).json({ error: 'User profile not found.' });
        res.status(200).json(user);
    } catch (error) {
        console.error('Profile Fetch Error:', error);
        res.status(500).json({ error: 'Failed to retrieve user profile.' });
    }
};

const getUserLibrary = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.id, status: 'SUCCESS' },
            select: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        thumbnail: true,
                        category: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const uniqueAssets = [];
        const seen = new Set();

        for (const order of orders) {
            const product = order.product;
            if (product && !seen.has(product.id)) {
                seen.add(product.id);
                uniqueAssets.push(product);
            }
        }

        res.status(200).json(uniqueAssets);
    } catch (error) {
        console.error('Library Sync Error:', error);
        res.status(500).json({ error: 'Failed to synchronize digital vault.' });
    }
};

const downloadAsset = async (req, res) => {
    try {
        const { productId } = req.params;
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

        const order = await prisma.order.findFirst({
            where: {
                userId: req.user.id,
                productId,
                status: 'SUCCESS',
            },
            include: { product: true },
        });

        if (!order && !isSuperAdmin) {
            console.warn(`[SECURITY ALERT] Unauthorized download attempt by User ID: ${req.user.id}`);
            return res.status(403).json({ error: 'Clearance denied. No valid purchase record found.' });
        }

        const product = order
            ? order.product
            : await prisma.product.findUnique({ where: { id: productId } });

        if (!product || !product.assetUrl) {
            return res.status(404).json({ error: 'Digital asset missing or unattached.' });
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await prisma.downloadLog.create({
            data: {
                userId: req.user.id,
                productId: product.id,
                ipAddress: String(clientIp),
            },
        });

        const fileExtension = product.assetUrl.includes('.')
            ? product.assetUrl.substring(product.assetUrl.lastIndexOf('.'))
            : '';
        const safeTitle = product.title.replace(/[^a-zA-Z0-9]/g, '_');

        const command = new GetObjectCommand({
            Bucket: process.env.CLOUD_BUCKET_NAME,
            Key: product.assetUrl,
            ResponseContentDisposition: `attachment; filename="${safeTitle}${fileExtension}"`,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
        res.status(200).json({ downloadUrl: signedUrl });
    } catch (error) {
        console.error('Presigned URL Generation Fault:', error);
        res.status(500).json({ error: 'Failed to generate secure download gateway.' });
    }
};

module.exports = { getUserProfile, getUserLibrary, downloadAsset };
