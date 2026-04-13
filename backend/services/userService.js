const userModel = require('../models/userModel');
const patientModel = require('../models/patientModel');
const professionalModel = require('../models/professionalModel');
const institutionModel = require('../models/institutionModel');

async function getUserProfile(userId) {
  const user = await userModel.findUserById(userId);
  if (!user) {
    return null;
  }

  const profile = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone
  };

  if (user.role === 'PATIENT') {
    const patientRow = await patientModel.findPatientByUserId(user.id);
    profile.cmuNumber = patientRow ? patientRow.cmu_number : null;
  }

  if (user.role === 'PROFESSIONAL') {
    const proRow = await professionalModel.findProfessionalByUserId(user.id);
    profile.specialty = proRow ? proRow.specialty : null;
    profile.license = proRow ? proRow.license : null;
  }

  if (user.role === 'INSTITUTION') {
    const institutionRow = await institutionModel.findInstitutionByUserId(user.id);
    profile.institutionId = institutionRow ? institutionRow.institution_id : null;
    profile.institutionType = institutionRow ? institutionRow.institution_type : null;
  }

  return profile;
}

module.exports = {
  getUserProfile
};
