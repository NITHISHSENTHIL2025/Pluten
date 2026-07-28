// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const cloudinary = require("../config/cloudinary");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: process.env.CLOUD_REGION,
    endpoint: process.env.CLOUD_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUD_ACCESS_KEY,
        secretAccessKey: process.env.CLOUD_SECRET_KEY,
    },
});

const storage = multer.memoryStorage();

// THE UPGRADE: Added DOCX support to match your frontend Template categories
const ALLOWED_MIME_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'], 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] 
};

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ALLOWED_MIME_TYPES[file.mimetype] && ALLOWED_MIME_TYPES[file.mimetype].includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`SECURITY_FAULT: Invalid file type (${file.mimetype}) or spoofed extension (${ext}).`), false);
    }
};

const multerUpload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter 
});

const upload = {
    fields(fields) {
        const middleware = multerUpload.fields(fields);

        return async (req, res, next) => {
            middleware(req, res, async (err) => {
                if (err) return res.status(400).json({ error: err.message });
                if (!req.files) return next();

                try {
                    // ---------- THUMBNAIL -> CLOUDINARY ----------
                    if (req.files.thumbnail) {
                        for (const file of req.files.thumbnail) {
                            const uploadResult = await new Promise((resolve, reject) => {
                                cloudinary.uploader.upload_stream(
                                    { folder: "isevens/thumbnails", resource_type: "image" },
                                    (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    }
                                ).end(file.buffer);
                            });
                            file.location = uploadResult.secure_url;
                        }
                    }

                    // ---------- PDF/ZIP/DOCX -> BACKBLAZE S3 ----------
                    if (req.files.assetFile) {
                        for (const file of req.files.assetFile) {
                            const filename = crypto.randomUUID() + "-" + file.originalname.replace(/\s+/g, "-");
                            const key = `assets/${filename}`;

                            await s3.send(
                                new PutObjectCommand({
                                    Bucket: process.env.CLOUD_BUCKET_NAME,
                                    Key: key,
                                    Body: file.buffer,
                                    ContentType: file.mimetype,
                                })
                            );
                            file.key = key;
                        }
                    }
                    next();
                } catch (e) {
                    console.error("Cloud Upload Fault:", e);
                    return res.status(500).json({ error: "Failed to transfer assets to cloud storage." });
                }
            });
        };
    },
};

module.exports = { upload, s3 };