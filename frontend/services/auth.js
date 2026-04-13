import { apiGet } from './api.js';
import { getAccessToken, getUserData, isTokenExpired, removeTokens, setLogoutTimer, setUserData } from '../utils/storage.js';
import { showToast } from '../utils/helpers.js';

export function isAuthenticated() {
  const token = getAccessToken();
  return Boolean(token && !isTokenExpired());
}

export function logout() {
  removeTokens();
  window.location.href = '/connexion.html';
}

export function authGuard() {
  if (!isAuthenticated()) {
    logout();
  }
}

export async function loadUserProfile() {
  try {
    const response = await apiGet('/user/profile');
    const { data } = response;
    if (!data) {
      throw new Error('Profil introuvable');
    }
    setUserData(data);
    setLogoutTimer();
    return data;
  } catch (error) {
    showToast(error.message, 'danger');
    throw error;
  }
}
