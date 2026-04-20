const logger = require('../config/logger');
const AppError = require('../utils/appError');
const patientService = require('../services/patientService');

async function listPatients(req, res, next) {
  try {
    const patients = await patientService.getAllPatients(req.validated.query);
    return res.formatResponse(patients, 'Liste des patients chargee');
  } catch (error) {
    logger.error('listPatients error: %o', error);
    return next(new AppError('Impossible de recuperer la liste des patients', 500));
  }
}

async function getOverview(req, res, next) {
  try {
    const overview = await patientService.getPatientOverview(req.user.id);
    return res.formatResponse(overview, 'Apercu sante charge');
  } catch (error) {
    logger.error('getOverview error: %o', error);
    return next(new AppError(error.message || 'Impossible de recuperer l\'apercu sante', error.statusCode || 500));
  }
}

async function getMedicalRecord(req, res, next) {
  try {
    const record = await patientService.getPatientMedicalRecord(req.user.id);
    return res.formatResponse(record, 'Dossier medical charge');
  } catch (error) {
    logger.error('getMedicalRecord error: %o', error);
    return next(new AppError(error.message || 'Impossible de recuperer le dossier medical', error.statusCode || 500));
  }
}

async function getConsultationDetails(req, res, next) {
  try {
    const { consultationId } = req.validated.params;
    const consultation = await patientService.getPatientConsultationDetails(req.user.id, consultationId);
    return res.formatResponse(consultation, 'Detail de consultation charge');
  } catch (error) {
    logger.error('getConsultationDetails error: %o', error);
    return next(new AppError(error.message || 'Impossible de recuperer le detail de consultation', error.statusCode || 500));
  }
}

async function createPatient(req, res, next) {
  try {
    const newPatient = await patientService.createPatient(req.validated.body);
    return res.formatResponse(newPatient, 'Patient cree avec succes');
  } catch (error) {
    logger.error('createPatient error: %o', error);
    return next(new AppError(error.message || 'Impossible de creer le patient', error.statusCode || 500));
  }
}

async function listConsultations(req, res, next) {
  try {
    const { patientUserId } = req.validated.params;
    const consultations = await patientService.getConsultationsForPatient(patientUserId);
    return res.formatResponse(consultations, 'Consultations patient chargees');
  } catch (error) {
    logger.error('listConsultations error: %o', error);
    return next(new AppError('Impossible de recuperer les consultations', 500));
  }
}

async function createConsultation(req, res, next) {
  try {
    const { patientUserId } = req.validated.params;
    const consultation = await patientService.createConsultation(
      patientUserId,
      req.user.id,
      req.validated.body
    );
    return res.formatResponse(consultation, 'Consultation enregistree');
  } catch (error) {
    logger.error('createConsultation error: %o', error);
    return next(new AppError('Impossible d\'enregistrer la consultation', 500));
  }
}

module.exports = {
  listPatients,
  getOverview,
  getMedicalRecord,
  getConsultationDetails,
  createPatient,
  listConsultations,
  createConsultation
};
