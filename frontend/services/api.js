import { API_BASE } from '../config.js';
import { getAccessToken, getRefreshToken, removeTokens, setAccessToken, setRefreshToken } from '../utils/storage.js';

let csrfToken = null;
let isRefreshing = false;

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error('Réponse serveur mal formée');
  }
}

async function fetchCsrfToken(force = false) {
  if (csrfToken && !force) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE}/csrf-token`, {
    credentials: 'include',
    method: 'GET'
  });
  const result = await parseJson(response);
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
    const xsrfToken = await fetchCsrfToken(true);
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-xsrf-token': xsrfToken || ''
      },
      body: JSON.stringify({ refreshToken })
    });

    const result = await parseJson(response);
    if (!response.ok) {
      return null;
    }

    setAccessToken(result.data.accessToken);
    setRefreshToken(result.data.refreshToken);
    return result.data.accessToken;
  } finally {
    isRefreshing = false;
  }
}

async function request(path, options = {}, retry = true) {
  const token = getAccessToken();
  const method = options.method || 'GET';
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (method.toUpperCase() !== 'GET') {
    const tokenValue = await fetchCsrfToken();
    if (tokenValue) {
      headers['x-xsrf-token'] = tokenValue;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    method,
    headers
  });

  const payload = await parseJson(response);
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

    if (response.status === 403) {
      throw new Error(payload?.message || 'Accès refusé');
    }

    if (response.status >= 500) {
      throw new Error('Erreur serveur, réessayez plus tard.');
    }

    throw new Error(payload?.message || 'Erreur de requête');
  }

  return payload;
}

export function apiGet(path) {
  return request(path, { method: 'GET' });
}

export function apiPost(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path, body = null) {
  return request(path, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}
