const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'default_access_secret';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
const accessExpiry = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function signAccessToken(payload) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpiry });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiry });
}

function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
