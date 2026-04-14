const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const logPayload = err.stack || err;
  if (statusCode >= 500) {
    logger.error('ErrorHandler: %s', logPayload);
  } else {
    logger.warn('Handled error %s: %s', statusCode, message);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message
  });
}

module.exports = errorHandler;
