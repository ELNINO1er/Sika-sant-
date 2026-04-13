const TOKEN_KEY = 'sika_access_token';
const REFRESH_TOKEN_KEY = 'sika_refresh_token';
const USER_KEY = 'sika_user_data';
const DARK_MODE_KEY = 'sika_dark_mode';
const EXPIRATION_KEY = 'sika_token_expiration';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRATION_KEY);
}

export function getUserData() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setUserData(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getDarkMode() {
  return localStorage.getItem(DARK_MODE_KEY) === 'true';
}

export function setDarkMode(enabled) {
  localStorage.setItem(DARK_MODE_KEY, enabled ? 'true' : 'false');
}

export function setLogoutTimer(expiresInSeconds = 900) {
  const expiration = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(EXPIRATION_KEY, expiration.toString());
}

export function isTokenExpired() {
  const raw = localStorage.getItem(EXPIRATION_KEY);
  return raw ? Date.now() > Number(raw) : true;
}
