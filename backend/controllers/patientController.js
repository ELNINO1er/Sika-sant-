const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const AppError = require('../utils/appError');
const patientService = require('../services/patientService');
const userModel = require('../models/userModel');
const appointmentModel = require('../models/appointmentModel');
const documentModel = require('../models/documentModel');
const messageModel = require('../models/messageModel');
const settingsModel = require('../models/settingsModel');
const supportRequestModel = require('../models/supportRequestModel');
const prescriptionModel = require('../models/prescriptionModel');
const vaccinationModel = require('../models/vaccinationModel');
const { generateMedicalRecordPdf } = require('../utils/pdfExport');

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

// ── Profile ──

async function updateProfile(req, res, next) {
  try {
    const { phone, email, address, emergencyContactName, emergencyContactPhone } = req.validated.body;
    const fields = {};
    if (phone !== undefined) fields.phone = phone;
    if (email !== undefined) fields.email = email;
    if (address !== undefined) fields.address = address;
    if (emergencyContactName !== undefined) fields.emergency_contact_name = emergencyContactName;
    if (emergencyContactPhone !== undefined) fields.emergency_contact_phone = emergencyContactPhone;

    await userModel.updateUser(req.user.id, fields);
    const updated = await userModel.findUserById(req.user.id);
    return res.formatResponse({
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      address: updated.address,
      emergencyContactName: updated.emergency_contact_name,
      emergencyContactPhone: updated.emergency_contact_phone
    }, 'Profil mis a jour');
  } catch (error) {
    logger.error('updateProfile error: %o', error);
    return next(new AppError('Impossible de mettre a jour le profil', 500));
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validated.body;
    const user = await userModel.findUserById(req.user.id);
    if (!user || !user.password_hash) {
      return next(new AppError('Utilisateur introuvable', 404));
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return next(new AppError('Mot de passe actuel incorrect', 400));
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await userModel.updateUser(req.user.id, { password_hash: newHash });
    return res.formatResponse(null, 'Mot de passe mis a jour');
  } catch (error) {
    logger.error('changePassword error: %o', error);
    return next(new AppError('Impossible de changer le mot de passe', 500));
  }
}

// ── Appointments ──

async function getAppointments(req, res, next) {
  try {
    const [upcoming, past] = await Promise.all([
      appointmentModel.getUpcoming(req.user.id),
      appointmentModel.getPast(req.user.id)
    ]);
    return res.formatResponse({ upcoming, past }, 'Rendez-vous charges');
  } catch (error) {
    logger.error('getAppointments error: %o', error);
    return next(new AppError('Impossible de charger les rendez-vous', 500));
  }
}

async function createAppointment(req, res, next) {
  try {
    const appointment = await appointmentModel.create({
      patientUserId: req.user.id,
      ...req.validated.body
    });
    return res.formatResponse(appointment, 'Rendez-vous cree');
  } catch (error) {
    logger.error('createAppointment error: %o', error);
    return next(new AppError('Impossible de creer le rendez-vous', 500));
  }
}

async function updateAppointmentStatus(req, res, next) {
  try {
    const { appointmentId } = req.validated.params;
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment || appointment.patient_user_id !== req.user.id) {
      return next(new AppError('Rendez-vous introuvable', 404));
    }
    await appointmentModel.updateStatus(appointmentId, req.validated.body.status);
    return res.formatResponse(null, 'Statut du rendez-vous mis a jour');
  } catch (error) {
    logger.error('updateAppointmentStatus error: %o', error);
    return next(new AppError('Impossible de modifier le rendez-vous', 500));
  }
}

// ── Documents ──

async function getDocuments(req, res, next) {
  try {
    const documents = await documentModel.getByPatientUserId(req.user.id);
    return res.formatResponse(documents, 'Documents charges');
  } catch (error) {
    logger.error('getDocuments error: %o', error);
    return next(new AppError('Impossible de charger les documents', 500));
  }
}

async function uploadDocument(req, res, next) {
  try {
    const title = req.body.title || (req.file ? req.file.originalname : 'Document sans titre');
    const kind = req.body.kind || 'AUTRE';
    const filePath = req.file ? req.file.path : null;
    const fileSize = req.file ? req.file.size : 0;
    const mimeType = req.file ? req.file.mimetype : 'application/pdf';

    const doc = await documentModel.create({
      patientUserId: req.user.id,
      title,
      kind,
      filePath,
      fileSize,
      mimeType,
      uploadedByUserId: req.user.id
    });
    return res.formatResponse(doc, 'Document enregistre');
  } catch (error) {
    logger.error('uploadDocument error: %o', error);
    return next(new AppError('Impossible d\'enregistrer le document', 500));
  }
}

async function downloadDocument(req, res, next) {
  try {
    const { documentId } = req.validated.params;
    const doc = await documentModel.findById(documentId);
    if (!doc || doc.patient_user_id !== req.user.id) {
      return next(new AppError('Document introuvable', 404));
    }
    if (!doc.file_path) {
      return res.formatResponse({ id: doc.id, title: doc.title }, 'Document sans fichier physique');
    }
    return res.download(doc.file_path, doc.title);
  } catch (error) {
    logger.error('downloadDocument error: %o', error);
    return next(new AppError('Impossible de telecharger le document', 500));
  }
}

// ── Messages ──

async function getMessages(req, res, next) {
  try {
    const [messages, unreadCount] = await Promise.all([
      messageModel.getByRecipientUserId(req.user.id),
      messageModel.countUnread(req.user.id)
    ]);
    return res.formatResponse({ messages, unreadCount }, 'Messages charges');
  } catch (error) {
    logger.error('getMessages error: %o', error);
    return next(new AppError('Impossible de charger les messages', 500));
  }
}

async function markMessageRead(req, res, next) {
  try {
    const { messageId } = req.validated.params;
    const message = await messageModel.findById(messageId);
    if (!message || message.recipient_user_id !== req.user.id) {
      return next(new AppError('Message introuvable', 404));
    }
    await messageModel.markAsRead(messageId);
    return res.formatResponse(null, 'Message marque comme lu');
  } catch (error) {
    logger.error('markMessageRead error: %o', error);
    return next(new AppError('Impossible de marquer le message', 500));
  }
}

async function sendMessage(req, res, next) {
  try {
    const { recipientUserId, subject, body } = req.validated.body;
    const message = await messageModel.create({
      senderUserId: req.user.id,
      recipientUserId,
      subject,
      body
    });
    return res.formatResponse(message, 'Message envoye');
  } catch (error) {
    logger.error('sendMessage error: %o', error);
    return next(new AppError('Impossible d\'envoyer le message', 500));
  }
}

// ── Settings ──

async function getSettings(req, res, next) {
  try {
    const settings = await settingsModel.getByUserId(req.user.id);
    return res.formatResponse(settings || {
      notifyAppointments: true,
      notifyTreatments: true,
      notifyDocuments: true,
      language: 'fr',
      theme: 'light'
    }, 'Parametres charges');
  } catch (error) {
    logger.error('getSettings error: %o', error);
    return next(new AppError('Impossible de charger les parametres', 500));
  }
}

async function updateSettings(req, res, next) {
  try {
    await settingsModel.upsert(req.user.id, req.validated.body);
    return res.formatResponse(null, 'Parametres mis a jour');
  } catch (error) {
    logger.error('updateSettings error: %o', error);
    return next(new AppError('Impossible de sauvegarder les parametres', 500));
  }
}

// ── Support ──

async function createSupportRequest(req, res, next) {
  try {
    const ticket = await supportRequestModel.create({
      userId: req.user.id,
      ...req.validated.body
    });
    return res.formatResponse(ticket, 'Demande de support enregistree');
  } catch (error) {
    logger.error('createSupportRequest error: %o', error);
    return next(new AppError('Impossible d\'enregistrer la demande', 500));
  }
}

// ── Export ──

async function exportMedicalRecord(req, res, next) {
  try {
    const record = await patientService.getPatientMedicalRecord(req.user.id);
    const filename = `dossier-medical-${record.patient?.cmuNumber || 'patient'}-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const doc = generateMedicalRecordPdf(record);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    logger.error('exportMedicalRecord error: %o', error);
    return next(new AppError('Impossible de generer l\'export du dossier', 500));
  }
}

// ── Prescriptions ──

async function getPrescriptions(req, res, next) {
  try {
    const prescriptions = await prescriptionModel.getByPatientUserId(req.user.id);
    const active = prescriptions.filter(p => p.status === 'ACTIF');
    const finished = prescriptions.filter(p => p.status !== 'ACTIF');
    return res.formatResponse({ prescriptions, active, finished, total: prescriptions.length }, 'Traitements charges');
  } catch (error) {
    logger.error('getPrescriptions error: %o', error);
    return next(new AppError('Impossible de charger les traitements', 500));
  }
}

async function requestRefill(req, res, next) {
  try {
    const { prescriptionId } = req.validated.params;
    const prescription = await prescriptionModel.findById(prescriptionId);
    if (!prescription || prescription.patient_user_id !== req.user.id) {
      return next(new AppError('Traitement introuvable', 404));
    }
    // Create a support request for the refill
    const ticket = await supportRequestModel.create({
      userId: req.user.id,
      requestType: 'renouvellement',
      subject: `Renouvellement: ${prescription.label}`,
      message: `Demande de renouvellement pour le traitement "${prescription.label}" (ID: ${prescriptionId}). Posologie: ${prescription.dosage || 'Non renseignee'}.`
    });
    return res.formatResponse(ticket, 'Demande de renouvellement enregistree');
  } catch (error) {
    logger.error('requestRefill error: %o', error);
    return next(new AppError('Impossible d\'enregistrer la demande de renouvellement', 500));
  }
}

module.exports = {
  listPatients,
  getOverview,
  getMedicalRecord,
  getConsultationDetails,
  createPatient,
  listConsultations,
  createConsultation,
  updateProfile,
  changePassword,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  getDocuments,
  uploadDocument,
  downloadDocument,
  getMessages,
  markMessageRead,
  getSettings,
  updateSettings,
  createSupportRequest,
  getPrescriptions,
  requestRefill,
  exportMedicalRecord,
  sendMessage,
  getVaccinations,
  createVaccination
};

// ── Vaccinations ──

async function getVaccinations(req, res, next) {
  try {
    const [vaccinations, upcoming] = await Promise.all([
      vaccinationModel.getByPatientUserId(req.user.id),
      vaccinationModel.getUpcoming(req.user.id)
    ]);
    return res.formatResponse({ vaccinations, upcoming, total: vaccinations.length }, 'Carnet de vaccination charge');
  } catch (error) {
    logger.error('getVaccinations error: %o', error);
    return next(new AppError('Impossible de charger le carnet de vaccination', 500));
  }
}

async function createVaccination(req, res, next) {
  try {
    const vaccination = await vaccinationModel.create({
      patientUserId: req.user.id,
      ...req.validated.body
    });
    return res.formatResponse(vaccination, 'Vaccination enregistree');
  } catch (error) {
    logger.error('createVaccination error: %o', error);
    return next(new AppError('Impossible d\'enregistrer la vaccination', 500));
  }
}
