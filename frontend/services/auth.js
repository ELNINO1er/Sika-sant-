import { apiGet, apiPost } from './api.js';
import { getAccessToken, getRefreshToken, getUserData, hasFreshUserData, isTokenExpired, removeTokens, setAccessToken, setRefreshToken, setUserData } from '../utils/storage.js';

export function isAuthenticated() {
  const token = getAccessToken();
  return Boolean(token && !isTokenExpired());
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiPost('/auth/logout', { refreshToken });
    }
  } catch {
    // Local cleanup is the fallback.
  } finally {
    removeTokens();
    window.location.href = '/pages/connexion.html';
  }
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
      await logout();
      return false;
    }
  }

  if (!isAuthenticated()) {
    await logout();
    return false;
  }

  return true;
}

export function roleGuard(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const user = getUserData();
  if (!user || !roles.includes(user.role)) {
    removeTokens();
    window.location.href = '/pages/connexion.html';
    return false;
  }
  return true;
}

export async function loadUserProfile({ force = false, maxAgeMs = 300000 } = {}) {
  if (!force && hasFreshUserData(maxAgeMs)) {
    return getUserData();
  }

  const response = await apiGet('/user/profile');
  if (!response.data) {
    throw new Error('Profil introuvable');
  }
  setUserData(response.data);
  return response.data;
}

export function requestOtp(cmuNumber) {
  return apiPost('/auth/request-otp', { cmuNumber });
}

export function verifyOtp(otpRequestId, otpCode) {
  return apiPost('/auth/verify-otp', { otpRequestId, otpCode });
}

export function loginProfessional(email, password) {
  return apiPost('/auth/login', { loginType: 'professional', email, password });
}

export function loginAdmin(email, password) {
  return apiPost('/auth/login', { loginType: 'admin', email, password });
}

export function loginInstitution(institutionId, password) {
  return apiPost('/auth/login', { loginType: 'institution', institutionId, password });
}

export function resendMfa(mfaRequestId) {
  return apiPost('/auth/resend-mfa', { mfaRequestId });
}

export function verifyMfa(mfaRequestId, mfaCode) {
  return apiPost('/auth/verify-mfa', { mfaRequestId, mfaCode });
}
