const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error('ErrorHandler: %s', err.stack || err);

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
