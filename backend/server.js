    // backend/server.js
    require('dotenv').config();
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const cookieParser = require('cookie-parser');
    const rateLimit = require('express-rate-limit');
    const path = require('path');
    const offerRoutes = require('./routes/offerRoutes');

    // Import the Global Error Pipeline
    const errorHandler = require('./middleware/errorMiddleware');

    const app = express();
    const PORT = process.env.PORT || 5000;

    // THE FIX (Audit Issue #14): Enable Trust Proxy for accurate IP logging
    // This is critical for the DownloadLog anti-piracy tracking to work behind a reverse proxy.
    app.set('trust proxy', 1);

    // --- Enterprise Security Middleware ---
    // THE FIX: Override Helmet's default policy so the Google OAuth popup doesn't crash
    // --- Enterprise Security Middleware ---
    app.use(helmet({
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
        // THE FIX: You MUST tell Helmet to allow your Vercel frontend to read the data
        crossOriginResourcePolicy: { policy: "cross-origin" } 
    })); 

    // 1. MUST BE FIRST: Parse cookies before anything else tries to read them
    app.use(cookieParser());

    // 2. MUST BE SECOND: Allow cross-origin credentials
    app.use(cors({
        origin: ['http://localhost:3000', 'https://i-seven-xi.vercel.app'],
        credentials: true,
        // THE FIX: Explicitly tell CORS to accept the Bearer token header from Vercel
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'] 
    }));

    // 3. MUST BE THIRD: Parse JSON bodies and capture raw buffers for Cashfree Webhooks
    app.use(express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        }
    }));

    // Expose local file uploads to the frontend
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // --- Rate Limiting (Brute Force Protection) ---
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: { error: "Security protocol triggered: Too many login attempts." }
    });

    // --- Enterprise Routing Matrix (API v1) ---
    app.use('/api/v1/auth', authLimiter, require('./routes/authRoutes'));
    app.use('/api/v1', require('./routes/productRoutes'));
    app.use('/api/v1/user', require('./routes/userRoutes'));
    app.use('/api/v1/admin', require('./routes/adminRoutes'));
    app.use('/api/v1/payments', require('./routes/paymentRoutes'));
    app.use('/api/v1/offers', offerRoutes);

    // --- Ecosystem Health Check ---
    app.get('/api/v1/health', (req, res) => {
        res.status(200).json({ 
            status: 'online', 
            ecosystem: 'iSevens Premium',
            timestamp: new Date().toISOString()
        });
    });

    // Inject the Global Error Pipeline
    // This MUST be the very last app.use() before app.listen to catch all routing faults!
    app.use(errorHandler);

    // --- Boot Sequence ---
    app.listen(PORT, () => {
        console.log(`[iSevens Core] Mission Control active on port ${PORT}`);
    });