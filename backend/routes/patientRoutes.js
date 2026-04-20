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
  createConsultationSchema
} = require('../validation/patientValidation');
const { ROLES, PERMISSIONS } = require('../constants/access');

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
