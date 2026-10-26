import { validationResult } from 'express-validator';

/**
 * Validation Middleware Result Handler
 * 
 * Inspects express-validator results on the request.
 * If validation fails, responds with 422 Unprocessable Entity and detailed field errors.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed for one or more fields.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
}
