import { getAccessToken, getRefreshToken, getUserData, isTokenExpired, removeTokens, setAccessToken, setRefreshToken } from './storage.js';
import { apiPost } from '../services/api.js';

function redirectToLogin() {
  window.location.href = '/pages/connexion.html';
}

export async function authGuard() {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  const tokenExpired = token ? isTokenExpired() : true;

  if ((!token || tokenExpired) && refreshToken) {
    try {
      const payload = await apiPost('/auth/refresh', { refreshToken });
      setAccessToken(payload.data.accessToken);
      setRefreshToken(payload.data.refreshToken);
      return true;
    } catch {
      removeTokens();
      redirectToLogin();
      return false;
    }
  }

  if (!token || tokenExpired) {
    removeTokens();
    redirectToLogin();
    return false;
  }

  return true;
}

export function roleGuard(requiredRoles) {
  const user = getUserData();
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  if (!user || !roles.includes(user.role)) {
    removeTokens();
    redirectToLogin();
    return false;
  }
  return true;
}
