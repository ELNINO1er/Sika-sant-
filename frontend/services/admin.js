import { apiGet } from './api.js';

export function listUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/users${query ? `?${query}` : ''}`);
}

export function listAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/audit-logs${query ? `?${query}` : ''}`);
}
