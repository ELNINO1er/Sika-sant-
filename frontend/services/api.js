import { getAccessToken, removeTokens } from '../utils/storage.js';

const API_BASE = 'http://localhost:4000/api';

async function request(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      removeTokens();
      window.location.href = '/connexion.html';
    }
    throw new Error(payload.message || 'Une erreur est survenue');
  }

  return payload;
}

export async function apiGet(path) {
  return request(path, { method: 'GET' });
}

export async function apiPost(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function refreshToken(token) {
  return apiPost('/auth/refresh', { refreshToken: token });
}
