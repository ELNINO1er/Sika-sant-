import { API_BASE } from '../config.js';
import { getAccessToken, getRefreshToken, removeTokens, setAccessToken, setRefreshToken, setLogoutTimer } from '../utils/storage.js';
import { showToast } from '../utils/helpers.js';

let csrfToken = null;
let isRefreshing = false;

async function fetchCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE}/csrf-token`, {
    credentials: 'include',
    method: 'GET'
  });
  const result = await response.json();
  csrfToken = result?.data?.csrfToken || null;
  return csrfToken;
}

async function refreshAccessToken() {
  if (isRefreshing) {
    return null;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  isRefreshing = true;
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    const result = await response.json();
    if (!response.ok) {
      return null;
    }

    setAccessToken(result.data.accessToken);
    setRefreshToken(result.data.refreshToken);
    setLogoutTimer(15 * 60);
    return result.data.accessToken;
  } finally {
    isRefreshing = false;
  }
}

async function request(path, options = {}, retry = true) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.method && options.method.toUpperCase() !== 'GET') {
    const tokenValue = await fetchCsrfToken();
    if (tokenValue) {
      headers['X-CSRF-Token'] = tokenValue;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Réponse serveur mal formée');
  }

  if (!response.ok) {
    if (response.status === 401 && retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request(path, options, false);
      }
      removeTokens();
      window.location.href = '/pages/connexion.html';
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    const message = payload?.message || 'Erreur serveur';
    if (response.status === 403) {
      throw new Error(message || 'Accès refusé');
    }
    if (response.status >= 500) {
      throw new Error('Erreur serveur, réessayez plus tard');
    }
    throw new Error(message);
  }

  return payload;
}

export async function apiGet(path) {
  return request(path, { method: 'GET' });
}

export async function apiPost(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function apiPut(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export async function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}

export function handleApiError(error) {
  showToast(error.message || 'Une erreur est survenue', 'danger');
  throw error;
}
