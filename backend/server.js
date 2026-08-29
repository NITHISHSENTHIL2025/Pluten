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
const isProduction =
  process.env.NODE_ENV === 'production';

/*
|--------------------------------------------------------------------------
| BASIC SERVER CONFIG
|--------------------------------------------------------------------------
*/

app.set('trust proxy', 1);
app.disable('x-powered-by');

/*
|--------------------------------------------------------------------------
| REQUEST ID
|--------------------------------------------------------------------------
*/

app.use(requestId);

/*
|--------------------------------------------------------------------------
| SECURITY HEADERS
|--------------------------------------------------------------------------
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

    hsts: isProduction
      ? undefined
      : false,
  }),
);

/*
|--------------------------------------------------------------------------
| COOKIES
|--------------------------------------------------------------------------
*/

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  ...(isProduction
    ? ['https://pluten.site', 'https://www.pluten.site']
    : ['http://localhost:3000']),
].filter(
  (origin, index, values) =>
    values.indexOf(origin) === index,
);

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Requests without an Origin header can occur from:
       * - server-to-server requests
       * - health checks
       * - command line clients
       */

      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          'CORS origin not allowed.',
        ),
      );
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
    ],
  }),
);

/*
|--------------------------------------------------------------------------
| JSON BODY
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit:
      process.env.JSON_BODY_LIMIT ||
      '1mb',

    verify(req, _res, buf) {
      req.rawBody =
        buf.toString();
    },
  }),
);

/*
|--------------------------------------------------------------------------
| GLOBAL API RATE LIMIT
|--------------------------------------------------------------------------
*/

const generalLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 600,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      error:
        'Too many requests. Please try again later.',
    },
  });

app.use(
  '/api/v1',
  generalLimiter,
);

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

app.use(
  '/api/v1/auth',
  require('./routes/authRoutes'),
);

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

app.use(
  '/api/v1',
  require('./routes/productRoutes'),
);

/*
|--------------------------------------------------------------------------
| USER
|--------------------------------------------------------------------------
*/

app.use(
  '/api/v1/user',
  require('./routes/userRoutes'),
);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

app.use(
  '/api/v1/admin',
  require('./routes/adminRoutes'),
);

/*
|--------------------------------------------------------------------------
| PAYMENTS
|--------------------------------------------------------------------------
*/

app.use(
  '/api/v1/payments',
  require('./routes/paymentRoutes'),
);

/*
|--------------------------------------------------------------------------
| OFFERS
|--------------------------------------------------------------------------
*/

app.use(
  '/api/v1/offers',
  require('./routes/offerRoutes'),
);

/*
|--------------------------------------------------------------------------
| PORTFOLIO PLATFORM
|--------------------------------------------------------------------------
|
| Authenticated routes:
|
| GET    /api/v1/portfolio
| POST   /api/v1/portfolio
| GET    /api/v1/portfolio/:id
| PUT    /api/v1/portfolio/:id
| DELETE /api/v1/portfolio/:id
|
| POST   /api/v1/portfolio/:id/publish
| POST   /api/v1/portfolio/:id/unpublish
|
| Public:
|
| GET /api/v1/portfolio/public/:username
|
|--------------------------------------------------------------------------
*/

app.use(
  '/api/v1/portfolio',
  require('./routes/portfolioRoutes'),
);

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
  '/api/v1/health',
  async (req, res) => {
    try {
      await prisma.$queryRaw`
        SELECT 1
      `;

      return res.status(200).json({
        status: 'ok',
        ecosystem: 'Pluten',
        requestId:
          req.requestId,
        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        '[HEALTH] readiness check failed:',
        error.message,
      );

      return res
        .status(503)
        .json({
          status: 'degraded',
          ecosystem: 'Pluten',
          requestId:
            req.requestId,
        });
    }
  },
);

/*
|--------------------------------------------------------------------------
| LIVENESS CHECK
|--------------------------------------------------------------------------
*/

app.get(
  '/api/v1/live',
  (_req, res) => {
    return res.status(200).json({
      status: 'ok',
    });
  },
);

/*
|--------------------------------------------------------------------------
| READINESS CHECK
|--------------------------------------------------------------------------
*/

app.get(
  '/api/v1/ready',
  async (req, res) => {
    try {
      await prisma.$queryRaw`
        SELECT 1
      `;

      return res.status(200).json({
        status: 'ready',
        requestId:
          req.requestId,
      });
    } catch {
      return res
        .status(503)
        .json({
          status: 'not_ready',
          requestId:
            req.requestId,
        });
    }
  },
);

/*
|--------------------------------------------------------------------------
| 404 FALLBACK
|--------------------------------------------------------------------------
|
| Keep this before the central error handler.
|
|--------------------------------------------------------------------------
*/

app.use(
  (req, res, next) => {
    if (
      req.path.startsWith(
        '/api/',
      )
    ) {
      return res
        .status(404)
        .json({
          error:
            'API endpoint not found.',
          requestId:
            req.requestId,
        });
    }

    next();
  },
);

/*
|--------------------------------------------------------------------------
| CENTRAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        `Pluten API listening on port ${PORT}`,
      );
    },
  );

/*
|--------------------------------------------------------------------------
| GRACEFUL SHUTDOWN
|--------------------------------------------------------------------------
*/

let shuttingDown =
  false;

const shutdown =
  async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    console.log(
      `[SERVER] ${signal} received. Shutting down gracefully.`,
    );

    server.close(
      async () => {
        try {
          await prisma.$disconnect();

          console.log(
            '[SERVER] Prisma disconnected.',
          );

          process.exit(0);
        } catch (error) {
          console.error(
            '[SERVER] Prisma disconnect failed:',
            error.message,
          );

          process.exit(1);
        }
      },
    );

    setTimeout(() => {
      console.error(
        '[SERVER] Forced shutdown after timeout.',
      );

      process.exit(1);
    }, 15000).unref();
  };

/*
|--------------------------------------------------------------------------
| PROCESS SIGNALS
|--------------------------------------------------------------------------
*/

process.on(
  'SIGTERM',
  () =>
    shutdown('SIGTERM'),
);

process.on(
  'SIGINT',
  () =>
    shutdown('SIGINT'),
);

/*
|--------------------------------------------------------------------------
| UNHANDLED ERRORS
|--------------------------------------------------------------------------
*/

process.on(
  'unhandledRejection',
  (reason) => {
    console.error(
      '[PROCESS] unhandledRejection',
      reason,
    );
  },
);

process.on(
  'uncaughtException',
  (error) => {
    console.error(
      '[PROCESS] uncaughtException',
      error,
    );

    shutdown(
      'uncaughtException',
    );
  },
);