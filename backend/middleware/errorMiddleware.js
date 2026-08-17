const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  let statusCode = Number.isInteger(res.statusCode) && res.statusCode >= 400 ? res.statusCode : 500;
  let publicMessage = 'Something went wrong. Please try again.';

  if (err?.code === 'P2002') {
    statusCode = 409;
    publicMessage = 'A record with these details already exists.';
  } else if (err?.code === 'P2025') {
    statusCode = 404;
    publicMessage = 'The requested record could not be found.';
  } else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    statusCode = 401;
    publicMessage = 'Your secure session is invalid or expired. Please sign in again.';
  } else if (err?.statusCode && Number.isInteger(err.statusCode)) {
    statusCode = err.statusCode;
    publicMessage = err.publicMessage || publicMessage;
  }

  console.error('[PLUTEN ERROR]', {
    requestId,
    statusCode,
    name: err?.name,
    code: err?.code,
    message: err?.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: publicMessage,
    requestId,
  });
};

module.exports = errorHandler;
