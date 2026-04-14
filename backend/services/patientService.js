const bcrypt = require('bcryptjs');
const patientModel = require('../models/patientModel');
const userModel = require('../models/userModel');
const consultationModel = require('../models/consultationModel');
const { ROLES } = require('../constants/access');

const SALT_ROUNDS = 10;

async function getAllPatients(options) {
  return patientModel.getAllPatients(options);
}

async function createPatient(patientData) {
  const { name, phone, cmuNumber, password } = patientData;

  const existingUser = await userModel.findUserByPhone(phone);
  if (existingUser) {
    const error = new Error('Un utilisateur existe déjà avec ce numéro');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await userModel.saveNewUser({
    name,
    role: ROLES.PATIENT,
    email: null,
    phone,
    passwordHash
  });

  const patient = await patientModel.savePatientRecord(userId, cmuNumber);
  return {
    id: patient.id,
    userId,
    name,
    phone,
    cmuNumber,
    role: ROLES.PATIENT
  };
}

async function getConsultationsForPatient(patientUserId) {
  return consultationModel.getConsultationsByPatientUserId(patientUserId);
}

async function createConsultation(patientUserId, professionalUserId, consultationData) {
  return consultationModel.createConsultation({
    patientUserId,
    professionalUserId,
    title: consultationData.title,
    summary: consultationData.summary
  });
}

module.exports = {
  getAllPatients,
  createPatient,
  getConsultationsForPatient,
  createConsultation
};
