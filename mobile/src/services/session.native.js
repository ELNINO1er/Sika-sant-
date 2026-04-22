import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'sika_mobile_session_v1';

let memorySession = null;

function normalizeSession(session) {
  if (!session?.accessToken && !session?.refreshToken) {
    return null;
  }

  return {
    isAuthenticated: Boolean(session?.isAuthenticated ?? session?.accessToken ?? session?.refreshToken),
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    refreshToken: session?.refreshToken || null,
  };
}

export function getCachedSession() {
  return memorySession;
}

export function getAccessToken() {
  return memorySession?.accessToken || null;
}

export function getRefreshToken() {
  return memorySession?.refreshToken || null;
}

export async function persistAuthSession(session) {
  const normalized = normalizeSession(session);
  memorySession = normalized;

  if (!normalized) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function restoreAuthSession() {
  if (memorySession) {
    return memorySession;
  }

  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    memorySession = normalizeSession(parsed);
    return memorySession;
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    memorySession = null;
    return null;
  }
}

export async function clearAuthSession() {
  memorySession = null;
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
