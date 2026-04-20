const TOKEN_KEY = 'sika_access_token';
const REFRESH_TOKEN_KEY = 'sika_refresh_token';
const USER_KEY = 'sika_user_data';
const USER_CACHE_TIMESTAMP_KEY = 'sika_user_data_cached_at';
const DARK_MODE_KEY = 'sika_dark_mode';
const EXPIRATION_KEY = 'sika_token_expiration';

function decodeTokenPayload(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  const payload = decodeTokenPayload(token);
  if (payload?.exp) {
    localStorage.setItem(EXPIRATION_KEY, String(payload.exp * 1000));
  }
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
  localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
  localStorage.removeItem(EXPIRATION_KEY);
}

export function getUserData() {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
    return null;
  }
}

export function setUserData(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, String(Date.now()));
}

export function hasFreshUserData(maxAgeMs = 300000) {
  const raw = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
  if (!raw || !getUserData()) {
    return false;
  }

  return Date.now() - Number(raw) <= maxAgeMs;
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
