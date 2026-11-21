const Activity = require('../models/Activity');
const { ROLES, AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');
const { getAuthorizedScopeFilter } = require('../middleware/auth');
const { logEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get paginated activities
 * @route   GET /api/activities
 * @access  Authenticated (Role-scoped)
 */
const getActivities = async (req, res) => {
  try {
    const { activityType, customerId, leadId, page = 1, limit = 10 } = req.query;

    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const query = { ...scopeFilter };

    if (activityType) query.activityType = activityType;
    if (customerId) query.customerId = customerId;
    if (leadId) query.leadId = leadId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, activities] = await Promise.all([
      Activity.countDocuments(query),
      Activity.find(query)
        .populate('customerId', 'customerCode customerName')
        .populate('leadId', 'leadCode leadName')
        .populate('assignedTo', 'name email role')
        .sort({ activityDate: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return sendSuccess(res, 'Activities retrieved successfully.', {
      activities,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Log a new activity (Call, Meeting, Email, Task)
 * @route   POST /api/activities
 * @access  Authenticated
 */
const createActivity = async (req, res) => {
  try {
    const { activityType, subject, description, activityDate, customerId, leadId, assignedTo, status } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    let finalAssignedTo = assignedTo;
    if (req.user.role === ROLES.SALES_EXECUTIVE) {
      finalAssignedTo = req.user._id;
    }

    const activity = await Activity.create({
      activityType,
      subject,
      description,
      activityDate: activityDate ? new Date(activityDate) : new Date(),
      customerId: customerId || null,
      leadId: leadId || null,
      assignedTo: finalAssignedTo,
      status: status || 'Completed',
    });

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.ACTIVITY,
      recordId: activity._id.toString(),
      newValue: { activityType, subject, status: activity.status },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `Activity '${subject}' (${activityType}) logged.`,
    });

    const populated = await Activity.findById(activity._id)
      .populate('customerId', 'customerCode customerName')
      .populate('leadId', 'leadCode leadName')
      .populate('assignedTo', 'name');

    return sendSuccess(res, 'Activity recorded successfully.', { activity: populated }, 201);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Delete activity
 * @route   DELETE /api/activities/:id
 * @access  Admin, Manager
 */
const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return sendError(res, 'Activity not found.', null, 404);
    }

    await Activity.findByIdAndDelete(req.params.id);

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.DELETE,
      entityName: AUDIT_ENTITY.ACTIVITY,
      recordId: req.params.id,
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Activity '${activity.subject}' deleted.`,
    });

    return sendSuccess(res, 'Activity deleted successfully.');
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getActivities,
  createActivity,
  deleteActivity,
};
