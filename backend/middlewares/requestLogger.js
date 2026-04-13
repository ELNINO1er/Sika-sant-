const expressWinston = require('express-winston');
const logger = require('../config/logger');

const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) {
    return req.path.startsWith('/api/v1/docs');
  }
});

module.exports = requestLogger;
