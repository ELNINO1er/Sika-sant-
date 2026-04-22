const crypto = require('crypto');
const AppError = require('../utils/appError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_LENGTH = 32;

function generateCsrfToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

function isMobileClient(req) {
  const platform = String(req.headers['x-client-platform'] || '').toLowerCase();
  return platform === 'mobile-app' || platform === 'expo-go' || platform === 'react-native';
}

function usesBearerToken(req) {
  const authHeader = String(req.headers.authorization || '');
  return authHeader.startsWith('Bearer ');
}

function csrfProtection(req, res, next) {
  let csrfToken = req.cookies['XSRF-TOKEN'];

  if (!csrfToken) {
    csrfToken = generateCsrfToken();
  }

  req.csrfToken = () => csrfToken;

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Mobile clients use explicit bearer tokens instead of browser cookies,
  // so CSRF protection is only kept for browser-style traffic.
  if (isMobileClient(req) || usesBearerToken(req)) {
    return next();
  }

  const providedToken = req.headers['x-xsrf-token'] || req.body?._csrf || req.query?._csrf;

  const providedBuf = Buffer.from(String(providedToken || ''), 'utf8');
  const expectedBuf = Buffer.from(csrfToken, 'utf8');

  if (!providedToken || providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return next(new AppError('invalid csrf token', 403));
  }

  return next();
}

module.exports = {
  csrfProtection
};
