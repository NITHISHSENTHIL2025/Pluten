const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cloudinary = require('../config/cloudinary');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.CLOUD_REGION,
  endpoint: process.env.CLOUD_ENDPOINT,
  credentials: { accessKeyId: process.env.CLOUD_ACCESS_KEY, secretAccessKey: process.env.CLOUD_SECRET_KEY },
});

const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const safeExtension = (filename) => path.extname(filename || '').toLowerCase();
const safeOriginalName = (filename) => {
  const ext = safeExtension(filename);
  const base = path.basename(filename || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'file';
  return `${base}${ext}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}-${safeOriginalName(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  const ext = safeExtension(file.originalname);
  const allowed = ALLOWED_MIME_TYPES[file.mimetype];
  if (allowed && allowed.includes(ext)) return cb(null, true);
  return cb(new Error(`Unsupported or suspicious file type: ${file.mimetype} ${ext}`), false);
};

const multerUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 2, fields: 20 },
  fileFilter,
});

const unlinkIfExists = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error('[UPLOAD] Temp cleanup failed:', error.message);
  }
};

const readHeader = async (filePath, length = 16) => {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const signatureMatches = (header, expected) => header.length >= expected.length && expected.every((byte, index) => header[index] === byte);

const validateContentSignature = async (file) => {
  const ext = safeExtension(file.originalname);
  const header = await readHeader(file.path, 16);
  if (ext === '.pdf') return header.subarray(0, 5).toString('ascii') === '%PDF-';
  if (ext === '.jpg' || ext === '.jpeg') return signatureMatches(header, [0xff, 0xd8, 0xff]);
  if (ext === '.png') return signatureMatches(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (ext === '.webp') return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  if (ext === '.zip' || ext === '.docx') return signatureMatches(header, [0x50, 0x4b, 0x03, 0x04]) || signatureMatches(header, [0x50, 0x4b, 0x05, 0x06]) || signatureMatches(header, [0x50, 0x4b, 0x07, 0x08]);
  return false;
};

const deleteUploadedS3Key = async (key) => {
  if (!key || !process.env.CLOUD_BUCKET_NAME) return;
  try { await s3.send(new DeleteObjectCommand({ Bucket: process.env.CLOUD_BUCKET_NAME, Key: key })); }
  catch (error) { console.error('[UPLOAD] S3 rollback cleanup failed:', { key, message: error.message }); }
};

const cloudinaryPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const marker = '/upload/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  let publicId = url.slice(index + marker.length).split('?')[0];
  publicId = publicId.replace(/^v\d+\//, '').replace(/\.[a-z0-9]+$/i, '');
  return publicId || null;
};

const destroyCloudinaryUrl = async (url) => {
  const publicId = cloudinaryPublicIdFromUrl(url);
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true }); }
  catch (error) { console.error('[UPLOAD] Cloudinary rollback cleanup failed:', { publicId, message: error.message }); }
};

const cleanupRequestUploads = async (req) => {
  const uploaded = req.uploadedAssets || { cloudinaryUrls: [], s3Keys: [] };
  await Promise.allSettled([
    ...(uploaded.cloudinaryUrls || []).map(destroyCloudinaryUrl),
    ...(uploaded.s3Keys || []).map(deleteUploadedS3Key),
  ]);
  for (const group of Object.values(req.files || {})) for (const file of group) unlinkIfExists(file.path);
};

const validateParsedFiles = async (req) => {
  for (const group of Object.values(req.files || {})) {
    for (const file of group) {
      const valid = await validateContentSignature(file);
      if (!valid) throw new Error(`File content does not match its declared type: ${file.originalname}`);
    }
  }
};

const upload = {
  fields(fields) {
    const middleware = multerUpload.fields(fields);
    return (req, res, next) => {
      middleware(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.files) return next();

        res.on('finish', () => {
          if (!req.uploadCommitted) {
            for (const group of Object.values(req.files || {})) for (const file of group) unlinkIfExists(file.path);
          }
        });

        try {
          await validateParsedFiles(req);
          next();
        } catch (error) {
          await cleanupRequestUploads(req);
          return res.status(400).json({ error: error.message });
        }
      });
    };
  },

  commit: async (req, res, next) => {
    if (!req.files || req.uploadCommitted) return next();

    const uploadedCloudinaryUrls = [];
    const uploadedS3Keys = [];
    try {
      if (req.files.thumbnail) {
        for (const file of req.files.thumbnail) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: process.env.CLOUDINARY_THUMBNAIL_FOLDER || 'pluten/thumbnails',
            resource_type: 'image',
            use_filename: false,
            unique_filename: true,
          });
          file.location = result.secure_url;
          uploadedCloudinaryUrls.push(result.secure_url);
          unlinkIfExists(file.path);
        }
      }

      if (req.files.assetFile) {
        for (const file of req.files.assetFile) {
          const key = `assets/${crypto.randomUUID()}${safeExtension(file.originalname)}`;
          await s3.send(new PutObjectCommand({
            Bucket: process.env.CLOUD_BUCKET_NAME,
            Key: key,
            Body: fs.createReadStream(file.path),
            ContentType: file.mimetype,
            Metadata: { 'uploaded-by': 'pluten-admin' },
          }));
          file.key = key;
          uploadedS3Keys.push(key);
          unlinkIfExists(file.path);
        }
      }

      req.uploadedAssets = { cloudinaryUrls: uploadedCloudinaryUrls, s3Keys: uploadedS3Keys };
      req.uploadCommitted = true;
      return next();
    } catch (error) {
      req.uploadedAssets = { cloudinaryUrls: uploadedCloudinaryUrls, s3Keys: uploadedS3Keys };
      await cleanupRequestUploads(req);
      console.error('[UPLOAD] Secure transfer fault:', { requestId: req.requestId, message: error.message });
      return res.status(502).json({ error: 'Cloud storage could not accept the uploaded asset.' });
    }
  },
};

module.exports = { upload, s3, safeExtension, validateContentSignature, cleanupRequestUploads };
