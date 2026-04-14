const crypto = require('crypto');
const AppError = require('../utils/appError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function ensureCsrfToken(req) {
  const existingToken = req.cookies['XSRF-TOKEN'];
  const csrfToken = existingToken || crypto.randomBytes(32).toString('hex');
  req.csrfToken = () => csrfToken;
  return csrfToken;
}

function csrfProtection(req, res, next) {
  const csrfToken = ensureCsrfToken(req);

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const providedToken = req.headers['x-xsrf-token'] || req.body?._csrf || req.query?._csrf;
  if (!providedToken || providedToken !== csrfToken) {
    return next(new AppError('invalid csrf token', 403));
  }

  return next();
}

module.exports = {
  csrfProtection
};
