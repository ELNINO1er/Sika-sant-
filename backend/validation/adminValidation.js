const Joi = require('joi');

const paginationSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(5).max(100).default(20)
  }).required()
});

module.exports = {
  paginationSchema
};
