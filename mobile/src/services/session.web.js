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

function readSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeSession(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
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

  if (typeof window === 'undefined') {
    return normalized;
  }

  if (!normalized) {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function restoreAuthSession() {
  if (memorySession) {
    return memorySession;
  }

  memorySession = readSession();
  return memorySession;
}

export async function clearAuthSession() {
  memorySession = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}
