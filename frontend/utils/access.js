export const ROLES = {
  PATIENT: 'PATIENT',
  PROFESSIONAL: 'PROFESSIONAL',
  ADMIN: 'ADMIN',
  INSTITUTION: 'INSTITUTION'
};

export const PERMISSIONS = {
  READ_PATIENT: 'read_patient',
  WRITE_PATIENT: 'write_patient',
  PRESCRIBE: 'prescribe',
  VIEW_AUDIT_LOGS: 'view_audit_logs'
};

export const ROLE_LABELS = {
  [ROLES.PATIENT]: 'Patient',
  [ROLES.PROFESSIONAL]: 'Professionnel',
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.INSTITUTION]: 'Institution'
};
