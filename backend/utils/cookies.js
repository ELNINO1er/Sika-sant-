const env = require('../config/env');

const isProduction = env.nodeEnv === 'production';

const ACCESS_TOKEN_COOKIE = 'sika_access_token';
const REFRESH_TOKEN_COOKIE = 'sika_refresh_token';

const cookieDefaults = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/'
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieDefaults,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieDefaults,
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...cookieDefaults });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...cookieDefaults, path: '/api/v1/auth' });
}

module.exports = { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, setAuthCookies, clearAuthCookies };
