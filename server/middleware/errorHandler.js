/**
 * Centralized Error-Handling Middleware
 * 
 * Express recognizes error-handling middleware by its 4 arguments: (err, req, res, next).
 * Maps specific Mongoose and database error types into standard HTTP status codes.
 */
export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose CastError (e.g. invalid 24-character hexadecimal ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': value '${err.value}' is not a valid ObjectId.`;
  }

  // Mongoose ValidationError (schema required / enum check failure)
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Database schema validation constraint violation.';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `Duplicate resource: A record with ${duplicatedField} '${duplicatedValue}' already exists.`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
