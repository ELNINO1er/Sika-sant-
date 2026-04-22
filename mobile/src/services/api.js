import { API_URL } from '../config/env';
import { clearAuthSession, getAccessToken, getRefreshToken, persistAuthSession, restoreAuthSession } from './session';

async function parseJson(response) {
  if (response.status === 204) {
    return { success: true, data: null, message: null };
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Reponse serveur invalide');
  }
}

let refreshPromise = null;

async function rawRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-client-platform': 'mobile-app',
      ...(options.headers || {}),
    },
    ...options,
  });

  return {
    response,
    payload: await parseJson(response),
  };
}

export async function refreshAccessSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshPromise = (async () => {
    const { response, payload } = await rawRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearAuthSession();
      return null;
    }

    const current = await restoreAuthSession();
    return persistAuthSession({
      isAuthenticated: true,
      user: current?.user || null,
      accessToken: payload?.data?.accessToken || null,
      refreshToken: payload?.data?.refreshToken || refreshToken,
    });
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest(path, options = {}, config = {}) {
  const requiresAuth = Boolean(config.requiresAuth);
  const allowRefresh = config.allowRefresh !== false;
  const accessToken = requiresAuth ? getAccessToken() : null;

  const headers = {
    ...(options.headers || {}),
  };

  if (requiresAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const { response, payload } = await rawRequest(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && requiresAuth && allowRefresh) {
      const refreshed = await refreshAccessSession();
      if (refreshed?.accessToken) {
        return apiRequest(path, options, { ...config, allowRefresh: false });
      }
    }

    throw new Error(payload?.message || 'Erreur API');
  }

  return payload;
}

export function apiGet(path, config = {}) {
  return apiRequest(path, { method: 'GET' }, config);
}

export function apiPost(path, body, config = {}) {
  return apiRequest(path, { method: 'POST', body: JSON.stringify(body) }, config);
}

export function getHealth() {
  return apiGet('/health');
}

export function getUserProfile() {
  return apiGet('/user/profile', { requiresAuth: true });
}
