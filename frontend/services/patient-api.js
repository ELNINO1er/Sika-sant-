import { apiGet, apiPost, apiPatch } from './api.js';

// ── Profile ──
export function updateProfile(data) {
  return apiPatch('/patient/profile', data);
}

export function changePassword(currentPassword, newPassword) {
  return apiPost('/patient/change-password', { currentPassword, newPassword });
}

// ── Appointments ──
export function getAppointments() {
  return apiGet('/patient/appointments');
}

export function createAppointment(data) {
  return apiPost('/patient/appointments', data);
}

export function updateAppointmentStatus(appointmentId, status) {
  return apiPatch(`/patient/appointments/${appointmentId}`, { status });
}

// ── Documents ──
export function getDocuments() {
  return apiGet('/patient/documents');
}

export function uploadDocument(data) {
  return apiPost('/patient/documents', data);
}

export function getDocumentDownloadUrl(documentId) {
  return `/api/v1/patient/documents/${documentId}/download`;
}

// ── Messages ──
export function getMessages() {
  return apiGet('/patient/messages');
}

export function markMessageRead(messageId) {
  return apiPatch(`/patient/messages/${messageId}/read`, {});
}

// ── Settings ──
export function getSettings() {
  return apiGet('/patient/settings');
}

export function updateSettings(data) {
  return apiPatch('/patient/settings', data);
}

export function sendMessage(recipientUserId, subject, body) {
  return apiPost('/patient/messages', { recipientUserId, subject, body });
}

// ── Prescriptions ──
export function getPrescriptions() {
  return apiGet('/patient/prescriptions');
}

export function requestRefill(prescriptionId) {
  return apiPost(`/patient/prescriptions/${prescriptionId}/refill`, {});
}

// ── Export ──
export function getMedicalRecordExportUrl() {
  return '/api/v1/patient/medical-record/export';
}

// ── Vaccinations ──
export function getVaccinations() {
  return apiGet('/patient/vaccinations');
}

export function createVaccination(data) {
  return apiPost('/patient/vaccinations', data);
}

// ── Support ──
export function createSupportRequest(data) {
  return apiPost('/patient/support-requests', data);
}
