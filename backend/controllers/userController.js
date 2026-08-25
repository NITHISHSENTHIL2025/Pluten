const prisma = require('../lib/prisma');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3 } = require('../middleware/uploadMiddleware');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];

  if (
    typeof forwarded === 'string' &&
    forwarded.trim()
  ) {
    return forwarded
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)[0] || 'unknown';
  }

  return req.socket?.remoteAddress || 'unknown';
};

const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isPremium: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User profile not found.',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('[USER] Profile fetch error:', {
      requestId: req.requestId,
      message: error.message,
    });

    return res.status(500).json({
      error: 'Failed to retrieve your profile.',
    });
  }
};

const getUserLibrary = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
        status: 'SUCCESS',
      },
      select: {
        createdAt: true,
        product: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const uniqueAssets = [];
    const seen = new Set();

    for (const order of orders) {
      const product = order.product;

      if (
        product &&
        !seen.has(product.id)
      ) {
        seen.add(product.id);
        uniqueAssets.push(product);
      }
    }

    return res.status(200).json(uniqueAssets);
  } catch (error) {
    console.error('[USER] Library sync error:', {
      requestId: req.requestId,
      message: error.message,
    });

    return res.status(500).json({
      error: 'Failed to synchronize your library.',
    });
  }
};

const downloadAsset = async (req, res) => {
  try {
    const { productId } = req.params;
    const isSuperAdmin =
      req.user.role === 'SUPER_ADMIN';

    const order = await prisma.order.findFirst({
      where: {
        userId: req.user.id,
        productId,
        status: 'SUCCESS',
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!order && !isSuperAdmin) {
      console.warn(
        '[SECURITY ALERT] Unauthorized download attempt',
        {
          requestId: req.requestId,
          userId: req.user.id,
          productId,
        },
      );

      return res.status(403).json({
        error:
          'You do not have access to this digital product.',
      });
    }

    const product = order
      ? order.product
      : await prisma.product.findUnique({
          where: {
            id: productId,
          },
        });

    if (!product?.assetUrl) {
      return res.status(404).json({
        error:
          'Digital asset is unavailable.',
      });
    }

    const fileExtension = product.assetUrl.includes('.')
      ? product.assetUrl.slice(
          product.assetUrl.lastIndexOf('.'),
        )
      : '';

    const safeTitle =
      product.title
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 100) ||
      'pluten-product';

    const command =
      new GetObjectCommand({
        Bucket:
          process.env.CLOUD_BUCKET_NAME,
        Key: product.assetUrl,
        ResponseContentDisposition:
          `attachment; filename="${safeTitle}${fileExtension}"`,
      });

    // Generate the signed URL FIRST.
    // Only record the download after signing succeeds.
    const signedUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 900,
      },
    );

    await prisma.downloadLog.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        ipAddress: getClientIp(req),
      },
    });

    return res.status(200).json({
      downloadUrl: signedUrl,
    });
  } catch (error) {
    console.error(
      '[USER] Download gateway fault:',
      {
        requestId: req.requestId,
        message: error.message,
      },
    );

    return res.status(500).json({
      error:
        'Failed to prepare the secure download.',
    });
  }
};

module.exports = {
  getUserProfile,
  getUserLibrary,
  downloadAsset,
};