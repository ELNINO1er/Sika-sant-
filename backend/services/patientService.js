const bcrypt = require('bcryptjs');
const patientModel = require('../models/patientModel');
const professionalModel = require('../models/professionalModel');
const userModel = require('../models/userModel');
const consultationModel = require('../models/consultationModel');
const { ROLES } = require('../constants/access');

const SALT_ROUNDS = 10;
const OVERVIEW_HISTORY_LIMIT = 6;
const UPCOMING_APPOINTMENT_DELAY_DAYS = 21;

function cleanText(value, fallback = '') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  return value
    .replace(/g\?\?n\?\?rale/gi, 'generale')
    .replace(/contr\?\?le/gi, 'controle')
    .replace(/r\?\?sum\?\?/gi, 'resume')
    .replace(/Ã©/g, 'e')
    .replace(/Ã¨/g, 'e')
    .replace(/Ãª/g, 'e')
    .replace(/Ã /g, 'a')
    .replace(/Ã§/g, 'c')
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/\?\?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toIsoDateOnly(value) {
  const isoDate = toIsoDate(value);
  return isoDate ? isoDate.slice(0, 10) : null;
}

function addDays(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setDate(date.getDate() + days);
  return date;
}

function inferTreatmentType(title = '') {
  const normalized = cleanText(title).toLowerCase();
  if (normalized.includes('cardio')) {
    return 'cardio';
  }
  if (normalized.includes('general')) {
    return 'general';
  }
  return 'suivi';
}

function inferHealthStatus({ activeTreatments, unreadMessages, upcomingAlerts }) {
  if (upcomingAlerts > 0) {
    return {
      label: 'A surveiller',
      tone: 'critical',
      description: 'Une action proche ou un suivi prioritaire merite votre attention.'
    };
  }

  if (activeTreatments > 0 || unreadMessages > 0) {
    return {
      label: 'Suivi',
      tone: 'info',
      description: 'Votre suivi est actif avec des traitements ou messages a consulter.'
    };
  }

  return {
    label: 'Stable',
    tone: 'success',
    description: 'Aucune action urgente n\'est detectee dans votre espace patient.'
  };
}

function buildCurrentTreatments(consultations) {
  return consultations.slice(0, 2).map((consultation, index) => ({
    id: `treatment-${consultation.id}`,
    label: cleanText(consultation.title, `Traitement ${index + 1}`),
    description: cleanText(consultation.summary, 'Suivi a consulter dans votre espace patient.'),
    type: inferTreatmentType(consultation.title),
    status: 'ACTIF',
    startedAt: toIsoDate(consultation.created_at),
    startedDate: toIsoDateOnly(consultation.created_at),
    duration: null
  }));
}

function buildRecentMessages(consultations) {
  return consultations.slice(0, 2).map(consultation => ({
    id: `message-${consultation.id}`,
    sender: cleanText(consultation.professionalName, 'Centre de sante'),
    subject: cleanText(consultation.title, 'Mise a jour medicale'),
    preview: cleanText(consultation.summary, 'Un nouveau message medical est disponible.'),
    date: toIsoDate(consultation.created_at),
    unread: true,
    attachment: {
      name: `Compte rendu - ${cleanText(consultation.title, 'Consultation')}.pdf`,
      type: 'application/pdf'
    }
  }));
}

function buildRecentHistory(consultations) {
  return consultations.slice(0, 4).map(consultation => ({
    id: consultation.id,
    professionalName: cleanText(consultation.professionalName, 'Professionnel non renseigne'),
    consultationType: cleanText(consultation.title, 'Consultation'),
    date: toIsoDate(consultation.created_at),
    summary: cleanText(consultation.summary, 'Resume non disponible'),
    status: 'DISPONIBLE'
  }));
}

async function buildNextAppointment(consultations) {
  const reference = consultations[0];
  if (!reference) {
    return null;
  }

  const appointmentDate = addDays(reference.created_at, UPCOMING_APPOINTMENT_DELAY_DAYS);
  const professional = reference.professionalUserId
    ? await professionalModel.findProfessionalByUserId(reference.professionalUserId)
    : null;

  return {
    id: `appointment-${reference.id}`,
    date: appointmentDate ? appointmentDate.toISOString() : null,
    dateOnly: appointmentDate ? appointmentDate.toISOString().slice(0, 10) : null,
    time: '10:30',
    durationMinutes: 30,
    location: 'Centre Sika-Sante, Abidjan',
    professionalName: cleanText(reference.professionalName, 'Professionnel de sante'),
    specialty: cleanText(professional?.specialty, 'Suivi clinique'),
    status: 'A_PLANIFIER'
  };
}

function buildAlerts({ activeTreatments, unreadMessages, nextAppointment }) {
  const alerts = [];

  if (activeTreatments > 0) {
    alerts.push({
      id: 'treatments-active',
      type: 'traitement',
      label: 'Traitements a suivre',
      description: `${activeTreatments} traitement(s) sont actuellement actifs.`
    });
  }

  if (unreadMessages > 0) {
    alerts.push({
      id: 'messages-unread',
      type: 'message',
      label: 'Messages non lus',
      description: `${unreadMessages} message(s) recent(s) sont en attente de lecture.`
    });
  }

  if (nextAppointment?.dateOnly) {
    alerts.push({
      id: 'upcoming-appointment',
      type: 'rendez-vous',
      label: 'Rendez-vous a planifier',
      description: `Un suivi est estime pour le ${nextAppointment.dateOnly}.`
    });
  }

  return alerts;
}

async function getAllPatients(options) {
  return patientModel.getAllPatients(options);
}

async function getPatientOverview(patientUserId) {
  const [user, patient, consultations] = await Promise.all([
    userModel.findUserById(patientUserId),
    patientModel.findPatientByUserId(patientUserId),
    consultationModel.getConsultationsByPatientUserId(patientUserId, {
      limit: OVERVIEW_HISTORY_LIMIT
    })
  ]);

  if (!user || user.role !== ROLES.PATIENT || !patient) {
    const error = new Error('Patient introuvable');
    error.statusCode = 404;
    throw error;
  }

  const currentTreatments = buildCurrentTreatments(consultations);
  const recentMessages = buildRecentMessages(consultations);
  const recentHistory = buildRecentHistory(consultations);
  const nextAppointment = await buildNextAppointment(consultations);
  const alerts = buildAlerts({
    activeTreatments: currentTreatments.length,
    unreadMessages: recentMessages.length,
    nextAppointment
  });
  const healthStatus = inferHealthStatus({
    activeTreatments: currentTreatments.length,
    unreadMessages: recentMessages.length,
    upcomingAlerts: alerts.length
  });

  return {
    patient: {
      id: user.id,
      name: cleanText(user.name, 'Patient'),
      cmuNumber: patient.cmu_number,
      phone: user.phone || null,
      email: user.email || null,
      avatarUrl: null
    },
    summary: {
      activeTreatments: currentTreatments.length,
      unreadMessages: recentMessages.length,
      nextAppointmentDate: nextAppointment?.dateOnly || null,
      globalStatus: healthStatus.label
    },
    currentTreatments,
    nextAppointment,
    recentMessages,
    recentHistory,
    healthStatus,
    alerts
  };
}

async function createPatient(patientData) {
  const { name, phone, cmuNumber, password } = patientData;

  const existingUser = await userModel.findUserByPhone(phone);
  if (existingUser) {
    const error = new Error('Un utilisateur existe deja avec ce numero');
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
  getPatientOverview,
  createPatient,
  getConsultationsForPatient,
  createConsultation
};
