// backend/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const offerRoutes = require('./routes/offerRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------------------------------------------
   TRUST PROXY
--------------------------------------------------- */

app.set('trust proxy', 1);

/* ---------------------------------------------------
   SECURITY
--------------------------------------------------- */

app.use(
    helmet({
        crossOriginOpenerPolicy: {
            policy: 'same-origin-allow-popups',
        },
        crossOriginResourcePolicy: {
            policy: 'cross-origin',
        },
    })
);

/* ---------------------------------------------------
   COOKIES
--------------------------------------------------- */

app.use(cookieParser());

/* ---------------------------------------------------
   CORS
--------------------------------------------------- */

const allowedOrigins = [
    'http://localhost:3000',
    'https://pluten.site',
    'https://www.pluten.site',
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow Postman, curl, server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked: ${origin}`));
        },

        credentials: true,

        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
        ],

        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
        ],
    })
);

/* ---------------------------------------------------
   BODY PARSER
--------------------------------------------------- */

app.use(
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        },
    })
);

/* ---------------------------------------------------
   STATIC FILES
--------------------------------------------------- */

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------------------------------------------------
   RATE LIMITER
--------------------------------------------------- */

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many login attempts. Please try again later.',
    },
});

/* ---------------------------------------------------
   ROUTES
--------------------------------------------------- */

app.use('/api/v1/auth', authLimiter, require('./routes/authRoutes'));

app.use('/api/v1', require('./routes/productRoutes'));

app.use('/api/v1/user', require('./routes/userRoutes'));

app.use('/api/v1/admin', require('./routes/adminRoutes'));

app.use('/api/v1/payments', require('./routes/paymentRoutes'));

app.use('/api/v1/offers', offerRoutes);

/* ---------------------------------------------------
   HEALTH CHECK
--------------------------------------------------- */

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        ecosystem: 'Pluten',
        timestamp: new Date().toISOString(),
    });
});

/* ---------------------------------------------------
   ERROR HANDLER
--------------------------------------------------- */

app.use(errorHandler);

/* ---------------------------------------------------
   START SERVER
--------------------------------------------------- */

app.listen(PORT, () => {
    console.log(`🚀 Pluten API running on port ${PORT}`);
});