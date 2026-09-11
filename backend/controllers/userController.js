const prisma = require('../lib/prisma');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3 } = require('../middleware/uploadMiddleware');
const { recordAnalyticsEvent } = require('../utils/analytics');
const getClientIp = require('../utils/clientIp');
const { ensureLegacyEntitlement, findActiveEntitlement } = require('../services/entitlementService');

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
    return res.status(200).json(user);
  } catch (error) {
    console.error('[USER] Profile fetch error:', { requestId: req.requestId, message: error.message });
    return res.status(500).json({ error: 'Failed to retrieve your profile.' });
  }
};

const getUserLibrary = async (req, res) => {
  try {
    const entitlements = await prisma.entitlement.findMany({
      where: { userId: req.user.id, status: 'ACTIVE' },
      orderBy: { grantedAt: 'desc' },
      select: {
        grantedAt: true,
        sourceOrderId: true,
        product: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            category: true,
            updatedAt: true,
          },
        },
      },
    });

    return res.status(200).json(entitlements.map((entry) => ({
      ...entry.product,
      purchasedAt: entry.grantedAt,
      sourceOrderId: entry.sourceOrderId,
    })));
  } catch (error) {
    console.error('[USER] Library sync error:', { requestId: req.requestId, message: error.message });
    return res.status(500).json({ error: 'Failed to synchronize your library.' });
  }
};

const getProductOwnership = async (req, res) => {
  try {
    const { productId } = req.params;
    const entitlement = await ensureLegacyEntitlement(req.user.id, productId);
    return res.status(200).json({ owned: Boolean(entitlement), entitlement: entitlement ? { status: entitlement.status, grantedAt: entitlement.grantedAt } : null });
  } catch (error) {
    console.error('[USER] Ownership check failed:', { requestId: req.requestId, message: error.message });
    return res.status(500).json({ error: 'Unable to check product ownership.' });
  }
};

const downloadAsset = async (req, res) => {
  try {
    const { productId } = req.params;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    const entitlement = isSuperAdmin ? null : await ensureLegacyEntitlement(req.user.id, productId);
    if (!isSuperAdmin && !entitlement) {
      console.warn('[SECURITY ALERT] Unauthorized download attempt', {
        requestId: req.requestId,
        userId: req.user.id,
        productId,
      });
      return res.status(403).json({ error: 'You do not have access to this digital product.' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product?.assetUrl) return res.status(404).json({ error: 'Digital asset is unavailable.' });

    // Re-check entitlement immediately before signing so a just-revoked full refund cannot race a download.
    if (!isSuperAdmin) {
      const stillActive = await findActiveEntitlement(req.user.id, productId);
      if (!stillActive) return res.status(403).json({ error: 'Your access to this product is no longer active.' });
    }

    const fileExtension = product.assetUrl.includes('.') ? product.assetUrl.slice(product.assetUrl.lastIndexOf('.')) : '';
    const safeTitle = product.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || 'pluten-product';

    const command = new GetObjectCommand({
      Bucket: process.env.CLOUD_BUCKET_NAME,
      Key: product.assetUrl,
      ResponseContentDisposition: `attachment; filename="${safeTitle}${fileExtension}"`,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    await prisma.downloadLog.create({
      data: { userId: req.user.id, productId: product.id, ipAddress: getClientIp(req) },
    });

    await recordAnalyticsEvent({
      type: 'PRODUCT_DOWNLOADED',
      visitorId: String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim(),
      sessionKey: String(req.headers['x-analytics-session'] || '').trim() || null,
      userId: req.user.id,
      productId: product.id,
      metadata: { entitlementId: entitlement?.id || null },
    }).catch(() => null);

    return res.status(200).json({ downloadUrl: signedUrl });
  } catch (error) {
    console.error('[USER] Download gateway fault:', { requestId: req.requestId, message: error.message });
    return res.status(500).json({ error: 'Failed to prepare the secure download.' });
  }
};

module.exports = { getUserProfile, getUserLibrary, getProductOwnership, downloadAsset };
