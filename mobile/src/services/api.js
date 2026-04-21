import { API_URL } from '../config/env';

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error('Reponse serveur invalide');
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || 'Erreur API');
  }

  return payload;
}

export function getHealth() {
  return apiRequest('/health', { method: 'GET' });
}
