const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { createPatientSchema } = require('../validation/patientValidation');

router.get('/', verifyToken, authorizeRoles('PROFESSIONAL', 'INSTITUTION'), patientController.listPatients);
router.post('/', verifyToken, authorizeRoles('INSTITUTION'), validateRequest(createPatientSchema), patientController.createPatient);

module.exports = router;
