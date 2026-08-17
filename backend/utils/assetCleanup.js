const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const cloudinary = require('../config/cloudinary');
const { s3 } = require('../middleware/uploadMiddleware');

const deleteS3Asset = async (key) => {
  if (!key || !process.env.CLOUD_BUCKET_NAME) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.CLOUD_BUCKET_NAME, Key: key }));
  } catch (error) {
    console.error('[ASSET] S3 cleanup failed:', { key, message: error.message });
  }
};

const cloudinaryPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const marker = '/upload/';
  const index = url.indexOf(marker);
  if (index === -1) return null;

  let path = url.slice(index + marker.length);
  path = path.replace(/^v\d+\//, '');
  path = path.split('?')[0];
  path = path.replace(/\.[a-z0-9]+$/i, '');
  return path || null;
};

const deleteCloudinaryAsset = async (url) => {
  const publicId = cloudinaryPublicIdFromUrl(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (error) {
    console.error('[ASSET] Cloudinary cleanup failed:', { publicId, message: error.message });
  }
};

const cleanupReplacedAssets = async ({ oldThumbnail, oldAssetUrl, newThumbnail, newAssetUrl }) => {
  const tasks = [];

  if (oldThumbnail && oldThumbnail !== newThumbnail) tasks.push(deleteCloudinaryAsset(oldThumbnail));
  if (oldAssetUrl && oldAssetUrl !== newAssetUrl) tasks.push(deleteS3Asset(oldAssetUrl));

  await Promise.allSettled(tasks);
};

module.exports = { deleteS3Asset, deleteCloudinaryAsset, cleanupReplacedAssets };
