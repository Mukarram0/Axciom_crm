const AuditLog = require('../models/AuditLog');

/**
 * Filter out sensitive fields like passwords, secrets, or internal hashes
 */
const sanitizePayload = (data) => {
  if (!data || typeof data !== 'object') return data;
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'session'];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }
  return sanitized;
};

/**
 * Append-only audit logger
 */
const logEvent = async ({
  userId = null,
  action,
  entityName,
  recordId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  result = 'SUCCESS',
  details = '',
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityName,
      recordId: recordId ? recordId.toString() : null,
      oldValue: sanitizePayload(oldValue),
      newValue: sanitizePayload(newValue),
      ipAddress,
      result,
      details,
    });
  } catch (error) {
    // Crucial: Logging failures should not bring down the main user request, but should be logged to stderr
    console.error(`[Audit Log Failure] Could not record audit log: ${error.message}`);
  }
};

module.exports = {
  logEvent,
};
