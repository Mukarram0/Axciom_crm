const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { sendError } = require('../utils/responseHandler');

/**
 * Authentication Middleware: Verifies active session and attaches logged-in user
 */
const authenticateSession = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return sendError(res, 'Authentication required. Please log in to proceed.', null, 401);
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy();
      return sendError(res, 'User session invalid. Please log in again.', null, 401);
    }

    if (!user.isActive) {
      req.session.destroy();
      return sendError(res, 'Your account has been deactivated. Please contact an administrator.', null, 403);
    }

    // Attach active user to request
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Session authentication error.', null, 500);
  }
};

/**
 * Role-Based Authorization Middleware: Restricts access to specified roles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access forbidden. You do not have permission for this resource.', null, 403);
    }
    next();
  };
};

/**
 * Scoped Data Filter Helper
 * Automatically computes MongoDB query filters based on user role and hierarchy:
 * - Admin: Unrestricted (sees all organizational records)
 * - Manager: Sees their own records + all subordinates reporting to them
 * - Sales Executive: Strictly sees their own assigned records
 */
const getAuthorizedScopeFilter = async (user, assignedField = 'assignedTo') => {
  if (user.role === ROLES.ADMIN) {
    return {};
  }

  if (user.role === ROLES.MANAGER) {
    // Find all sales executives who report to this manager
    const subordinates = await User.find({ reportsTo: user._id }, '_id');
    const allowedUserIds = [user._id, ...subordinates.map((s) => s._id)];
    return { [assignedField]: { $in: allowedUserIds } };
  }

  // Sales Executive: Own records only
  return { [assignedField]: user._id };
};

module.exports = {
  authenticateSession,
  authorizeRoles,
  getAuthorizedScopeFilter,
};
