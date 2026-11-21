const FollowUp = require('../models/FollowUp');
const { ROLES, FOLLOWUP_STATUS, AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');
const { getAuthorizedScopeFilter } = require('../middleware/auth');
const { logEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get paginated follow-ups with upcoming/overdue support
 * @route   GET /api/followups
 * @access  Authenticated (Role-scoped)
 */
const getFollowUps = async (req, res) => {
  try {
    const { status, type, filterMode, page = 1, limit = 10, sortBy = 'followUpDate', sortOrder = 'asc' } = req.query;

    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const query = { isDeleted: false, ...scopeFilter };

    if (status) query.status = status;
    if (type) query.followUpType = type;

    const now = new Date();

    // Special filters for dashboard & operational views
    if (filterMode === 'overdue') {
      query.status = FOLLOWUP_STATUS.PLANNED;
      query.followUpDate = { $lt: now };
    } else if (filterMode === 'upcoming') {
      query.status = FOLLOWUP_STATUS.PLANNED;
      query.followUpDate = { $gte: now };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [total, followUps] = await Promise.all([
      FollowUp.countDocuments(query),
      FollowUp.find(query)
        .populate('customerId', 'customerCode customerName phone email')
        .populate('leadId', 'leadCode leadName phone email')
        .populate('opportunityId', 'opportunityName amount stage')
        .populate('assignedTo', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
    ]);

    return sendSuccess(res, 'Follow-ups retrieved successfully.', {
      followUps,
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
 * @desc    Get single follow-up by ID
 * @route   GET /api/followups/:id
 * @access  Authenticated (Role-scoped)
 */
const getFollowUpById = async (req, res) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customerId', 'customerCode customerName phone')
      .populate('leadId', 'leadCode leadName phone')
      .populate('opportunityId', 'opportunityName')
      .populate('assignedTo', 'name email');

    if (!followUp) {
      return sendError(res, 'Follow-up not found.', null, 404);
    }

    if (req.user.role === ROLES.SALES_EXECUTIVE && followUp.assignedTo._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only view follow-ups assigned to you.', null, 403);
    }

    return sendSuccess(res, 'Follow-up details retrieved.', { followUp });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Create new follow-up
 * @route   POST /api/followups
 * @access  Authenticated
 */
const createFollowUp = async (req, res) => {
  try {
    const { customerId, leadId, opportunityId, followUpType, subject, followUpDate, status, remarks, assignedTo } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    let finalAssignedTo = assignedTo;
    if (req.user.role === ROLES.SALES_EXECUTIVE) {
      finalAssignedTo = req.user._id;
    }

    const newFollowUp = await FollowUp.create({
      customerId: customerId || null,
      leadId: leadId || null,
      opportunityId: opportunityId || null,
      followUpType,
      subject,
      followUpDate: new Date(followUpDate),
      status: status || FOLLOWUP_STATUS.PLANNED,
      remarks,
      assignedTo: finalAssignedTo,
    });

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.FOLLOWUP,
      recordId: newFollowUp._id.toString(),
      newValue: { subject, followUpType, followUpDate: newFollowUp.followUpDate, status: newFollowUp.status },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `Follow-Up '${subject}' scheduled for ${new Date(followUpDate).toLocaleDateString()}.`,
    });

    const populated = await FollowUp.findById(newFollowUp._id)
      .populate('customerId', 'customerCode customerName')
      .populate('leadId', 'leadCode leadName')
      .populate('assignedTo', 'name');

    return sendSuccess(res, 'Follow-up created successfully.', { followUp: populated }, 201);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Update / Complete / Reschedule follow-up
 * @route   PUT /api/followups/:id
 * @access  Authenticated (Role-scoped)
 */
const updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, isDeleted: false });
    if (!followUp) {
      return sendError(res, 'Follow-up not found.', null, 404);
    }

    if (req.user.role === ROLES.SALES_EXECUTIVE && followUp.assignedTo.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only update follow-ups assigned to you.', null, 403);
    }

    const { subject, followUpType, followUpDate, status, remarks, assignedTo } = req.body;
    const oldValue = followUp.toObject();

    if (subject) followUp.subject = subject;
    if (followUpType) followUp.followUpType = followUpType;
    if (remarks !== undefined) followUp.remarks = remarks;

    // Handle rescheduling
    if (followUpDate && new Date(followUpDate).getTime() !== new Date(followUp.followUpDate).getTime()) {
      const newDate = new Date(followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today && status === FOLLOWUP_STATUS.PLANNED) {
        return sendError(res, 'Follow-up date cannot be earlier than today.', null, 400);
      }
      followUp.followUpDate = newDate;

      await logEvent({
        userId: req.user._id,
        action: AUDIT_ACTION.UPDATE,
        entityName: AUDIT_ENTITY.FOLLOWUP,
        recordId: followUp._id.toString(),
        oldValue: { followUpDate: oldValue.followUpDate },
        newValue: { followUpDate: followUp.followUpDate },
        ipAddress: req.ip,
        result: 'SUCCESS',
        details: `Follow-up '${followUp.subject}' rescheduled to ${newDate.toLocaleDateString()}.`,
      });
    }

    // Handle status change
    if (status && status !== followUp.status) {
      followUp.status = status;
      if (status === FOLLOWUP_STATUS.COMPLETED) {
        followUp.completedAt = new Date();
      }
      await logEvent({
        userId: req.user._id,
        action: AUDIT_ACTION.STATUS_CHANGE,
        entityName: AUDIT_ENTITY.FOLLOWUP,
        recordId: followUp._id.toString(),
        oldValue: { status: oldValue.status },
        newValue: { status: followUp.status },
        ipAddress: req.ip,
        result: 'SUCCESS',
        details: `Follow-up '${followUp.subject}' marked as ${status}.`,
      });
    }

    if (assignedTo && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER)) {
      followUp.assignedTo = assignedTo;
    }

    await followUp.save();

    const populated = await FollowUp.findById(followUp._id)
      .populate('customerId', 'customerCode customerName')
      .populate('leadId', 'leadCode leadName')
      .populate('assignedTo', 'name');

    return sendSuccess(res, 'Follow-up updated successfully.', { followUp: populated });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Soft-delete follow-up
 * @route   DELETE /api/followups/:id
 * @access  Admin, Manager
 */
const deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findOne({ _id: req.params.id, isDeleted: false });
    if (!followUp) {
      return sendError(res, 'Follow-up not found.', null, 404);
    }

    followUp.isDeleted = true;
    await followUp.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.DELETE,
      entityName: AUDIT_ENTITY.FOLLOWUP,
      recordId: followUp._id.toString(),
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Follow-up '${followUp.subject}' soft-deleted.`,
    });

    return sendSuccess(res, 'Follow-up successfully removed.');
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
};
