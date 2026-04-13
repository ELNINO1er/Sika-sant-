const Joi = require('joi');

const createPatientSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(3).max(150).required(),
    phone: Joi.string().trim().pattern(/^[0-9+\s-]{8,20}$/).required(),
    cmuNumber: Joi.string().trim().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(12).required()
  }).required()
});

module.exports = {
  createPatientSchema
};
