const Joi = require('joi');

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20)
});

const listUsersSchema = {
  query: paginationQuery
};

const listAuditLogsSchema = {
  query: paginationQuery
};

module.exports = {
  listUsersSchema,
  listAuditLogsSchema
};
