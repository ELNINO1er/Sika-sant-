const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles, authorizePermissions } = require('../middlewares/roleMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const {
  listPatientsSchema,
  overviewSchema,
  createPatientSchema,
  patientIdParamsSchema,
  consultationDetailSchema,
  createConsultationSchema,
  updateProfileSchema,
  changePasswordSchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  uploadDocumentSchema,
  documentIdSchema,
  messageIdSchema,
  updateSettingsSchema,
  createSupportRequestSchema,
  sendMessageSchema,
  createVaccinationSchema,
  prescriptionIdSchema
} = require('../validation/patientValidation');
const { ROLES, PERMISSIONS } = require('../constants/access');
const { uploadSingle } = require('../middlewares/uploadMiddleware');

router.get(
  '/overview',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(overviewSchema),
  patientController.getOverview
);

router.get(
  '/medical-record',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(overviewSchema),
  patientController.getMedicalRecord
);

router.get(
  '/consultations/:consultationId',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(consultationDetailSchema),
  patientController.getConsultationDetails
);

// ── Patient profile ──
router.patch(
  '/profile',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(updateProfileSchema),
  patientController.updateProfile
);

router.post(
  '/change-password',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(changePasswordSchema),
  patientController.changePassword
);

// ── Appointments ──
router.get(
  '/appointments',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  patientController.getAppointments
);

router.post(
  '/appointments',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(createAppointmentSchema),
  patientController.createAppointment
);

router.patch(
  '/appointments/:appointmentId',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(updateAppointmentStatusSchema),
  patientController.updateAppointmentStatus
);

// ── Documents ──
router.get(
  '/documents',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  patientController.getDocuments
);

router.post(
  '/documents',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  uploadSingle,
  patientController.uploadDocument
);

router.get(
  '/documents/:documentId/download',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(documentIdSchema),
  patientController.downloadDocument
);

// ── Messages ──
router.get(
  '/messages',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  patientController.getMessages
);

router.patch(
  '/messages/:messageId/read',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(messageIdSchema),
  patientController.markMessageRead
);

router.post(
  '/messages',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(sendMessageSchema),
  patientController.sendMessage
);

// ── Settings ──
router.get(
  '/settings',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  patientController.getSettings
);

router.patch(
  '/settings',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(updateSettingsSchema),
  patientController.updateSettings
);

// ── Support ──
router.post(
  '/support-requests',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(createSupportRequestSchema),
  patientController.createSupportRequest
);

// ── Vaccinations ──
router.get(
  '/vaccinations',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  patientController.getVaccinations
);

router.post(
  '/vaccinations',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(createVaccinationSchema),
  patientController.createVaccination
);

// ── Export ──
router.get(
  '/medical-record/export',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  patientController.exportMedicalRecord
);

// ── Prescriptions ──
router.get(
  '/prescriptions',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  patientController.getPrescriptions
);

router.post(
  '/prescriptions/:prescriptionId/refill',
  verifyToken,
  authorizeRoles(ROLES.PATIENT),
  validateRequest(prescriptionIdSchema),
  patientController.requestRefill
);

// ── Admin/Professional endpoints ──
router.get(
  '/',
  verifyToken,
  authorizePermissions(PERMISSIONS.READ_PATIENT),
  validateRequest(listPatientsSchema),
  patientController.listPatients
);
router.post(
  '/',
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  authorizePermissions(PERMISSIONS.WRITE_PATIENT),
  validateRequest(createPatientSchema),
  patientController.createPatient
);
router.get(
  '/:patientUserId/consultations',
  verifyToken,
  authorizePermissions(PERMISSIONS.READ_PATIENT),
  validateRequest(patientIdParamsSchema),
  patientController.listConsultations
);
router.post(
  '/:patientUserId/consultations',
  verifyToken,
  authorizeRoles(ROLES.PROFESSIONAL, ROLES.ADMIN),
  authorizePermissions(PERMISSIONS.WRITE_PATIENT),
  validateRequest(createConsultationSchema),
  patientController.createConsultation
);

module.exports = router;
