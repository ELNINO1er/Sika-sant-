const Joi = require('joi');
const AppError = require('../utils/appError');

function validateRequest(schema) {
  return (req, res, next) => {
    const options = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true
    };

    const validationTarget = {
      body: req.body,
      params: req.params,
      query: req.query
    };

    const { error, value } = schema.validate(validationTarget, options);
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400));
    }

    req.validated = value;
    next();
  };
}

module.exports = {
  validateRequest
};
