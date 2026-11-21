const User = require('../models/User');
const { ROLES, AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');
const { logEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Authenticate user & establish session
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Retrieve user including password hash for authentication
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await logEvent({
        action: AUDIT_ACTION.FAILED_LOGIN,
        entityName: AUDIT_ENTITY.AUTH,
        ipAddress: clientIp,
        result: 'FAILURE',
        details: `Login attempt failed for non-existent email: ${email}`,
      });
      return sendError(res, 'Invalid email or password.', null, 401);
    }

    // Check if account is deactivated
    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact an administrator.', null, 403);
    }

    // Check account lockout
    if (user.isLocked()) {
      const minutesRemaining = Math.ceil((new Date(user.lockoutUntil) - Date.now()) / (60 * 1000));
      await logEvent({
        userId: user._id,
        action: AUDIT_ACTION.LOCKOUT,
        entityName: AUDIT_ENTITY.AUTH,
        recordId: user._id.toString(),
        ipAddress: clientIp,
        result: 'FAILURE',
        details: `Login blocked by lockout policy. ${minutesRemaining} minutes remaining.`,
      });
      return sendError(
        res,
        `Account is temporarily locked due to multiple failed attempts. Try again in ${minutesRemaining} minutes or contact an Administrator.`,
        null,
        423 // Locked
      );
    }

    // Verify password hash
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await user.incrementFailedLogins();
      const isNowLocked = user.isLocked();

      await logEvent({
        userId: user._id,
        action: isNowLocked ? AUDIT_ACTION.LOCKOUT : AUDIT_ACTION.FAILED_LOGIN,
        entityName: AUDIT_ENTITY.AUTH,
        recordId: user._id.toString(),
        ipAddress: clientIp,
        result: 'FAILURE',
        details: isNowLocked ? 'Account locked after reaching max failed login threshold.' : `Failed login attempt #${user.failedLoginCount}`,
      });

      if (isNowLocked) {
        return sendError(res, 'Maximum failed login attempts reached. Your account is temporarily locked for 15 minutes.', null, 423);
      }

      return sendError(res, 'Invalid email or password.', null, 401);
    }

    // Success: Reset lockout counters
    await user.resetLockout();
    user.lastLoginAt = new Date();
    await user.save();

    // Establish express-session
    req.session.userId = user._id;

    // Record audit log
    await logEvent({
      userId: user._id,
      action: AUDIT_ACTION.LOGIN,
      entityName: AUDIT_ENTITY.AUTH,
      recordId: user._id.toString(),
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `User ${user.email} logged in successfully as ${user.role}.`,
    });

    return sendSuccess(res, 'Login successful.', { user });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Register a new Sales Executive account
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', null, 409);
    }

    // Strict Security Rule: Public self-registration ALWAYS provisions Sales Executive role
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      role: ROLES.SALES_EXECUTIVE,
      isActive: true,
    });

    // Establish session immediately
    req.session.userId = newUser._id;

    await logEvent({
      userId: newUser._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.USER,
      recordId: newUser._id.toString(),
      newValue: { email: newUser.email, role: newUser.role },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: 'New user self-registered with default Sales Executive role.',
    });

    return sendSuccess(res, 'Registration successful. Welcome to AcxiomCRM!', { user: newUser }, 201);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Terminate session & logout
 * @route   POST /api/auth/logout
 * @access  Authenticated
 */
const logout = async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress;
    const userId = req.session ? req.session.userId : null;

    if (userId) {
      await logEvent({
        userId,
        action: AUDIT_ACTION.LOGOUT,
        entityName: AUDIT_ENTITY.AUTH,
        recordId: userId.toString(),
        ipAddress: clientIp,
        result: 'SUCCESS',
        details: 'User logged out and session terminated.',
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return sendError(res, 'Failed to clear session during logout.', null, 500);
      }
      res.clearCookie('acxiom_crm_sid');
      return sendSuccess(res, 'Logged out successfully.');
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Get currently logged in user info
 * @route   GET /api/auth/me
 * @access  Authenticated
 */
const getMe = async (req, res) => {
  return sendSuccess(res, 'Current user profile loaded.', { user: req.user });
};

module.exports = {
  login,
  register,
  logout,
  getMe,
};
