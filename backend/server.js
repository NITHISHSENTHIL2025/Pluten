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

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(requestId);

app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: isProduction ? undefined : false,
}));

app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:3000',
  'https://pluten.site',
  'https://www.pluten.site',
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-Id'],
}));

app.use(express.json({
  limit: process.env.JSON_BODY_LIMIT || '1mb',
  verify(req, _res, buf) {
    req.rawBody = buf.toString();
  },
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/v1', generalLimiter);

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1', require('./routes/productRoutes'));
app.use('/api/v1/user', require('./routes/userRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/offers', require('./routes/offerRoutes'));

app.get('/api/v1/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', ecosystem: 'Pluten', requestId: req.requestId, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[HEALTH] readiness check failed:', error.message);
    res.status(503).json({ status: 'degraded', ecosystem: 'Pluten', requestId: req.requestId });
  }
});

app.get('/api/v1/live', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/v1/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', requestId: req.requestId });
  } catch {
    res.status(503).json({ status: 'not_ready', requestId: req.requestId });
  }
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Pluten API listening on port ${PORT}`);
});

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[SERVER] ${signal} received. Shutting down gracefully.`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      console.error('[SERVER] Prisma disconnect failed:', error.message);
      process.exit(1);
    }
  });

  setTimeout(() => process.exit(1), 15000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[PROCESS] unhandledRejection', reason));
process.on('uncaughtException', (error) => {
  console.error('[PROCESS] uncaughtException', error);
  shutdown('uncaughtException');
});
