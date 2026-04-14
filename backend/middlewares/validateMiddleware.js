const AppError = require('../utils/appError');

function validateRequest(schema) {
  return (req, res, next) => {
    const validated = {};

    for (const section of ['body', 'params', 'query']) {
      const sectionSchema = schema?.[section];
      if (!sectionSchema) {
        continue;
      }

      const { error, value } = sectionSchema.validate(req[section], {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const message = error.details.map(detail => detail.message).join(', ');
        return next(new AppError(message, 400));
      }

      validated[section] = value;
    }

    req.validated = validated;
    next();
  };
}

module.exports = {
  validateRequest
};
