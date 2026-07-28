// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const os = require("os");
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

// PRODUCTION UPGRADE: Use Ephemeral Disk Storage instead of RAM to prevent OOM crashes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir()); // Temporarily hold in the server's temp directory
    },
    filename: (req, file, cb) => {
        cb(null, crypto.randomUUID() + "-" + file.originalname.replace(/\s+/g, "-"));
    }
});

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
                            const uploadResult = await cloudinary.uploader.upload(file.path, {
                                folder: "isevens/thumbnails", 
                                resource_type: "image"
                            });
                            file.location = uploadResult.secure_url;
                            
                            // Clean up disk space immediately
                            fs.unlinkSync(file.path);
                        }
                    }

                    // ---------- PDF/ZIP/DOCX -> BACKBLAZE S3 ----------
                    if (req.files.assetFile) {
                        for (const file of req.files.assetFile) {
                            const fileStream = fs.createReadStream(file.path);
                            const key = `assets/${file.filename}`;

                            await s3.send(
                                new PutObjectCommand({
                                    Bucket: process.env.CLOUD_BUCKET_NAME,
                                    Key: key,
                                    Body: fileStream,
                                    ContentType: file.mimetype,
                                })
                            );
                            file.key = key;
                            
                            // Clean up disk space immediately
                            fs.unlinkSync(file.path);
                        }
                    }
                    next();
                } catch (e) {
                    console.error("Cloud Upload Fault:", e);
                    
                    // Fallback cleanup in case of a crash mid-upload
                    if (req.files.thumbnail) req.files.thumbnail.forEach(f => { if(fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                    if (req.files.assetFile) req.files.assetFile.forEach(f => { if(fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                    
                    return res.status(500).json({ error: "Failed to transfer assets to cloud storage." });
                }
            });
        };
    },
};

module.exports = { upload, s3 };