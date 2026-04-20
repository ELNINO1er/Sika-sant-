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

module.exports = {
  listPatientsSchema,
  overviewSchema,
  createPatientSchema,
  patientIdParamsSchema,
  consultationDetailSchema,
  createConsultationSchema
};
