const Joi = require('joi');

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow('').optional()
});

const listPatientsSchema = {
  query: paginationQuery
};

const overviewSchema = {
  query: Joi.object({}).unknown(false)
};

const createPatientSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(3).max(150).required(),
    phone: Joi.string().trim().pattern(/^[0-9+\s-]{8,20}$/).required(),
    cmuNumber: Joi.string().trim().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(12).required()
  }).required()
};

const patientIdParamsSchema = {
  params: Joi.object({
    patientUserId: Joi.number().integer().min(1).required()
  }).required()
};

const consultationDetailSchema = {
  params: Joi.object({
    consultationId: Joi.number().integer().min(1).required()
  }).required()
};

const createConsultationSchema = {
  params: Joi.object({
    patientUserId: Joi.number().integer().min(1).required()
  }).required(),
  body: Joi.object({
    title: Joi.string().trim().min(3).max(120).required(),
    summary: Joi.string().trim().min(10).max(2000).required()
  }).required()
};

const updateProfileSchema = {
  body: Joi.object({
    phone: Joi.string().trim().pattern(/^[0-9+\s-]{8,20}$/).optional(),
    email: Joi.string().trim().email().optional(),
    address: Joi.string().trim().max(255).allow('').optional(),
    emergencyContactName: Joi.string().trim().max(150).allow('').optional(),
    emergencyContactPhone: Joi.string().trim().pattern(/^[0-9+\s-]{8,20}$/).allow('').optional()
  }).required().min(1)
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().min(1).required(),
    newPassword: Joi.string().min(12).required()
  }).required()
};

const createAppointmentSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(150).required(),
    date: Joi.string().isoDate().required(),
    durationMinutes: Joi.number().integer().min(10).max(180).default(30),
    location: Joi.string().trim().max(255).optional(),
    notes: Joi.string().trim().max(1000).allow('').optional()
  }).required()
};

const appointmentIdSchema = {
  params: Joi.object({
    appointmentId: Joi.number().integer().min(1).required()
  }).required()
};

const updateAppointmentStatusSchema = {
  params: Joi.object({
    appointmentId: Joi.number().integer().min(1).required()
  }).required(),
  body: Joi.object({
    status: Joi.string().valid('CONFIRME', 'ANNULE').required()
  }).required()
};

const uploadDocumentSchema = {
  body: Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    kind: Joi.string().valid('ORDONNANCE', 'RESULTAT', 'COMPTE_RENDU', 'IMAGERIE', 'AUTRE').default('AUTRE')
  }).required()
};

const documentIdSchema = {
  params: Joi.object({
    documentId: Joi.number().integer().min(1).required()
  }).required()
};

const messageIdSchema = {
  params: Joi.object({
    messageId: Joi.number().integer().min(1).required()
  }).required()
};

const updateSettingsSchema = {
  body: Joi.object({
    notifyAppointments: Joi.boolean().optional(),
    notifyTreatments: Joi.boolean().optional(),
    notifyDocuments: Joi.boolean().optional(),
    language: Joi.string().valid('fr', 'en').optional(),
    theme: Joi.string().valid('light', 'dark', 'system').optional()
  }).required().min(1)
};

const createSupportRequestSchema = {
  body: Joi.object({
    requestType: Joi.string().trim().min(2).max(50).required(),
    subject: Joi.string().trim().min(3).max(200).required(),
    message: Joi.string().trim().min(10).max(2000).required()
  }).required()
};

module.exports = {
  listPatientsSchema,
  overviewSchema,
  createPatientSchema,
  patientIdParamsSchema,
  consultationDetailSchema,
  createConsultationSchema,
  updateProfileSchema,
  changePasswordSchema,
  createAppointmentSchema,
  appointmentIdSchema,
  updateAppointmentStatusSchema,
  uploadDocumentSchema,
  documentIdSchema,
  messageIdSchema,
  updateSettingsSchema,
  createSupportRequestSchema,
  sendMessageSchema: {
    body: Joi.object({
      recipientUserId: Joi.number().integer().min(1).required(),
      subject: Joi.string().trim().min(3).max(200).required(),
      body: Joi.string().trim().min(5).max(2000).required()
    }).required()
  },
  createVaccinationSchema: {
    body: Joi.object({
      vaccineName: Joi.string().trim().min(2).max(200).required(),
      dose: Joi.string().trim().max(50).allow('').optional(),
      administeredAt: Joi.string().isoDate().required(),
      nextDoseAt: Joi.string().isoDate().allow('', null).optional(),
      location: Joi.string().trim().max(255).allow('').optional(),
      professionalName: Joi.string().trim().max(150).allow('').optional(),
      lotNumber: Joi.string().trim().max(100).allow('').optional(),
      notes: Joi.string().trim().max(1000).allow('').optional()
    }).required()
  },
  prescriptionIdSchema: {
    params: Joi.object({
      prescriptionId: Joi.number().integer().min(1).required()
    }).required()
  }
};
