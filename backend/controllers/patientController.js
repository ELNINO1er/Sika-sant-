const logger = require('../config/logger');
const AppError = require('../utils/appError');
const patientService = require('../services/patientService');

async function listPatients(req, res, next) {
  try {
    const patients = await patientService.getAllPatients();
    return res.formatResponse(patients, 'Liste des patients chargée');
  } catch (error) {
    logger.error('listPatients error: %o', error);
    return next(new AppError('Impossible de récupérer la liste des patients', 500));
  }
}

async function createPatient(req, res, next) {
  try {
    const newPatient = await patientService.createPatient(req.validated.body);
    return res.formatResponse(newPatient, 'Patient créé avec succès');
  } catch (error) {
    logger.error('createPatient error: %o', error);
    return next(new AppError(error.message || 'Impossible de créer le patient', error.statusCode || 500));
  }
}

module.exports = {
  listPatients,
  createPatient
};
