import { getAccessToken, getUserData, getRefreshToken, isTokenExpired, removeTokens, setAccessToken, setRefreshToken, setLogoutTimer } from './storage.js';
import { apiPost } from '../services/api.js';

export async function authGuard() {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  const tokenExpired = token ? isTokenExpired() : true;

  if ((!token || tokenExpired) && refreshToken) {
    try {
      const payload = await apiPost('/auth/refresh', { refreshToken });
      setAccessToken(payload.data.accessToken);
      setRefreshToken(payload.data.refreshToken);
      setLogoutTimer(15 * 60);
      return true;
    } catch {
      removeTokens();
      window.location.href = '/pages/connexion.html';
      return false;
    }
  }

  if (!token || tokenExpired) {
    removeTokens();
    window.location.href = '/pages/connexion.html';
    return false;
  }

  return true;
}

export function roleGuard(role) {
  const user = getUserData();
  if (!user || user.role !== role) {
    window.location.href = '/pages/connexion.html';
    return false;
  }
  return true;
}
