const { sendError } = require('../utils/responseHandler');

/**
 * Centralized Application Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name || 'Application Error'}: ${err.message}`);

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    return sendError(res, `Resource not found with id: ${err.value}`, null, 404);
  }

  // Handle Mongoose Schema Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return sendError(res, messages[0]?.message || 'Validation failed.', messages, 400);
  }

  // Handle MongoDB Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    return sendError(
      res,
      `A record with this ${duplicatedField} ('${duplicatedValue}') already exists. Duplicate entries are not permitted.`,
      [{ field: duplicatedField, message: `${duplicatedField} must be unique.` }],
      409
    );
  }

  // Default Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred.' : err.message;
  return sendError(res, message, null, statusCode);
};

module.exports = errorHandler;
