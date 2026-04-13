import { apiGet, apiPost } from './api.js';
import { getAccessToken, getRefreshToken, getUserData, getDarkMode, isTokenExpired, removeTokens, setAccessToken, setRefreshToken, setLogoutTimer, setUserData } from '../utils/storage.js';
import { showToast } from '../utils/helpers.js';

export function isAuthenticated() {
  const token = getAccessToken();
  return Boolean(token && !isTokenExpired());
}

export function logout() {
  removeTokens();
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
      setLogoutTimer(15 * 60);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }

  if (!isAuthenticated()) {
    logout();
    return false;
  }

  return true;
}

export function roleGuard(requiredRole) {
  const user = getUserData();
  if (!user || user.role !== requiredRole) {
    logout();
    return false;
  }
  return true;
}

export async function loadUserProfile() {
  try {
    const response = await apiGet('/user/profile');
    const { data } = response;
    if (!data) {
      throw new Error('Profil introuvable');
    }
    setUserData(data);
    setLogoutTimer(15 * 60);
    return data;
  } catch (error) {
    showToast(error.message, 'danger');
    throw error;
  }
}

export async function requestOtp(cmuNumber) {
  return apiPost('/auth/request-otp', { cmuNumber });
}

export async function verifyOtp(otpRequestId, otpCode) {
  return apiPost('/auth/verify-otp', { otpRequestId, otpCode });
}

export async function loginProfessional(email, password) {
  return apiPost('/auth/login', { loginType: 'professional', email, password });
}

export async function loginInstitution(institutionId, password) {
  return apiPost('/auth/login', { loginType: 'institution', institutionId, password });
}

export async function resendMfa(mfaRequestId) {
  return apiPost('/auth/resend-mfa', { mfaRequestId });
}

export async function verifyMfa(mfaRequestId, mfaCode) {
  return apiPost('/auth/verify-mfa', { mfaRequestId, mfaCode });
}
