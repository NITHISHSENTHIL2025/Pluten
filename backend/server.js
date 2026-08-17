require('dotenv').config();

const validateEnvironment = require('./config/validateEnvironment');
validateEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const prisma = require('./lib/prisma');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Proxy / platform configuration
 */
app.set('trust proxy', 1);
app.disable('x-powered-by');

/**
 * Request correlation
 */
app.use(requestId);

/**
 * Security headers
 */
app.use(
  helmet({
    crossOriginOpenerPolicy: {
      policy: 'same-origin-allow-popups',
    },
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    hsts: isProduction ? undefined : false,
  })
);

/**
 * Cookies
 */
app.use(cookieParser());

/**
 * CORS
 *
 * Keep the allow-list explicit.
 * X-Client-Timezone is accepted because the current frontend
 * sends it as a custom request header.
 */
const allowedOrigins = [
  'http://localhost:3000',
  'https://pluten.site',
  'https://www.pluten.site',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/server-side requests that have no Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin not allowed.'));
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
      'X-Request-Id',
      'X-Client-Timezone',
    ],
  })
);

/**
 * JSON body parsing
 *
 * rawBody is retained because Cashfree webhook verification
 * depends on the original request body.
 */
app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || '1mb',

    verify(req, _res, buf) {
      req.rawBody = buf.toString();
    },
  })
);

/**
 * Global API rate limiting
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
  },
});

app.use('/api/v1', generalLimiter);

/**
 * API routes
 */
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1', require('./routes/productRoutes'));
app.use('/api/v1/user', require('./routes/userRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/offers', require('./routes/offerRoutes'));

/**
 * Health check
 *
 * Verifies both process health and database connectivity.
 */
app.get('/api/v1/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'ok',
      ecosystem: 'Pluten',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH] Readiness check failed:', {
      requestId: req.requestId,
      message: error.message,
    });

    return res.status(503).json({
      status: 'degraded',
      ecosystem: 'Pluten',
      requestId: req.requestId,
    });
  }
});

/**
 * Liveness probe
 *
 * Does not depend on the database.
 */
app.get('/api/v1/live', (_req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

/**
 * Readiness probe
 *
 * Confirms the API process can reach PostgreSQL.
 */
app.get('/api/v1/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: 'ready',
      requestId: req.requestId,
    });
  } catch (error) {
    console.error('[READY] Database readiness check failed:', {
      requestId: req.requestId,
      message: error.message,
    });

    return res.status(503).json({
      status: 'not_ready',
      requestId: req.requestId,
    });
  }
});

/**
 * Global error handler
 *
 * Must remain after all routes.
 */
app.use(errorHandler);

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`Pluten API listening on port ${PORT}`);
});

/**
 * Graceful shutdown
 */
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`[SERVER] ${signal} received. Shutting down gracefully.`);

  server.close(async () => {
    try {
      await prisma.$disconnect();

      console.log('[SERVER] Prisma disconnected.');
      process.exit(0);
    } catch (error) {
      console.error('[SERVER] Prisma disconnect failed:', error.message);
      process.exit(1);
    }
  });

  // Hard timeout so the process never hangs forever.
  setTimeout(() => {
    console.error('[SERVER] Graceful shutdown timed out.');
    process.exit(1);
  }, 15000).unref();
};

/**
 * Process lifecycle handlers
 */
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[PROCESS] Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[PROCESS] Uncaught exception:', error);
  shutdown('uncaughtException');
});