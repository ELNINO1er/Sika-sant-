import { apiGet, apiPost } from './api.js';

export function listPatients(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiGet(`/patients${query ? `?${query}` : ''}`);
}

export function createPatient(payload) {
  return apiPost('/patients', payload);
}

export function listPatientConsultations(patientUserId) {
  return apiGet(`/patients/${patientUserId}/consultations`);
}

export function createPatientConsultation(patientUserId, payload) {
  return apiPost(`/patients/${patientUserId}/consultations`, payload);
}
