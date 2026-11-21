const User = require('../models/User');
const { ROLES, AUDIT_ACTION, AUDIT_ENTITY, VALIDATION_RULES } = require('../config/constants');
const { logEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get all users (with search and role filter)
 * @route   GET /api/users
 * @access  Admin, Manager (restricted)
 */
const getUsers = async (req, res) => {
  try {
    const { search, role, isActive } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    // Manager can only view their subordinates and peers
    if (req.user.role === ROLES.MANAGER) {
      query.$or = [{ reportsTo: req.user._id }, { _id: req.user._id }];
    }

    const users = await User.find(query)
      .populate('reportsTo', 'name email role')
      .sort({ createdAt: -1 });

    // Append lockout status indicator to each user object
    const usersWithStatus = users.map((u) => {
      const obj = u.toObject();
      obj.isCurrentlyLocked = u.isLocked();
      return obj;
    });

    return sendSuccess(res, 'Users retrieved successfully.', { users: usersWithStatus });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Create new user with explicit role and hierarchy
 * @route   POST /api/users
 * @access  Admin only
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, reportsTo, phone } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'A user with this email address already exists.', null, 409);
    }

    // Validate password policy
    if (!password || password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return sendError(res, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long.`, null, 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || ROLES.SALES_EXECUTIVE,
      reportsTo: reportsTo || null,
      phone,
      isActive: true,
    });

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.USER,
      recordId: user._id.toString(),
      newValue: { email: user.email, role: user.role, reportsTo },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `User ${user.name} created with role ${user.role} by Administrator.`,
    });

    const populated = await User.findById(user._id).populate('reportsTo', 'name email');
    return sendSuccess(res, 'User created successfully.', { user: populated }, 201);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Update user details
 * @route   PUT /api/users/:id
 * @access  Admin only
 */
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found.', null, 404);
    }

    const { name, email, phone, reportsTo } = req.body;
    const oldValue = user.toObject();

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (reportsTo !== undefined) user.reportsTo = reportsTo || null;

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (emailExists) {
        return sendError(res, 'Another user with this email address already exists.', null, 409);
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityName: AUDIT_ENTITY.USER,
      recordId: user._id.toString(),
      oldValue: { name: oldValue.name, email: oldValue.email },
      newValue: { name: user.name, email: user.email },
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `User profile for ${user.email} updated by Administrator.`,
    });

    const populated = await User.findById(user._id).populate('reportsTo', 'name email');
    return sendSuccess(res, 'User updated successfully.', { user: populated });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Toggle user active/inactive status
 * @route   PATCH /api/users/:id/status
 * @access  Admin only
 */
const updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found.', null, 404);
    }

    // Prevent Admin from deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 'You cannot deactivate your own administrative account.', null, 400);
    }

    const { isActive } = req.body;
    const previousStatus = user.isActive;
    user.isActive = Boolean(isActive);
    await user.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.STATUS_CHANGE,
      entityName: AUDIT_ENTITY.USER,
      recordId: user._id.toString(),
      oldValue: { isActive: previousStatus },
      newValue: { isActive: user.isActive },
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `User ${user.email} status changed to ${user.isActive ? 'Active' : 'Deactivated'}.`,
    });

    return sendSuccess(res, `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`, { user });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Change user role (RBAC)
 * @route   PATCH /api/users/:id/role
 * @access  Admin only
 */
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found.', null, 404);
    }

    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 'You cannot alter your own administrative role.', null, 400);
    }

    const { role } = req.body;
    if (!Object.values(ROLES).includes(role)) {
      return sendError(res, 'Invalid role specified.', null, 400);
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityName: AUDIT_ENTITY.USER,
      recordId: user._id.toString(),
      oldValue: { role: previousRole },
      newValue: { role: user.role },
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `User ${user.email} role changed from ${previousRole} to ${user.role}.`,
    });

    return sendSuccess(res, `User role successfully updated to ${role}.`, { user });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Admin unlock for locked-out accounts
 * @route   PATCH /api/users/:id/unlock
 * @access  Admin only
 */
const unlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found.', null, 404);
    }

    await user.resetLockout();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.UNLOCK,
      entityName: AUDIT_ENTITY.USER,
      recordId: user._id.toString(),
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Account for ${user.email} was manually unlocked by Administrator.`,
    });

    return sendSuccess(res, `Account for ${user.email} has been unlocked successfully.`);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Admin reset user password
 * @route   PATCH /api/users/:id/reset-password
 * @access  Admin only
 */
const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found.', null, 404);
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return sendError(res, `New password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long.`, null, 400);
    }

    user.password = newPassword; // Pre-save hook will hash via bcrypt
    await user.resetLockout();
    await user.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.PASSWORD_RESET,
      entityName: AUDIT_ENTITY.USER,
      recordId: user._id.toString(),
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Password for ${user.email} was reset by Administrator.`,
    });

    return sendSuccess(res, `Password for ${user.email} has been reset successfully.`);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  unlockUser,
  resetUserPassword,
};
