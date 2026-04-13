const bcrypt = require('bcrypt');
const patientModel = require('../models/patientModel');
const userModel = require('../models/userModel');

const SALT_ROUNDS = 10;

async function getAllPatients() {
  return patientModel.getAllPatients();
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
    role: 'PATIENT',
    email: null,
    phone,
    passwordHash
  });

  const patient = await patientModel.savePatientRecord(userId, cmuNumber);
  return {
    id: patient.id,
    name,
    phone,
    cmuNumber,
    role: 'PATIENT'
  };
}

module.exports = {
  getAllPatients,
  createPatient
};
