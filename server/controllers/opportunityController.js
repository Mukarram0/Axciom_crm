const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');
const { ROLES, OPPORTUNITY_STAGE, OPPORTUNITY_STATUS, AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');
const { getAuthorizedScopeFilter } = require('../middleware/auth');
const { logEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get paginated opportunities with pipeline summaries
 * @route   GET /api/opportunities
 * @access  Authenticated (Role-scoped)
 */
const getOpportunities = async (req, res) => {
  try {
    const { search, stage, status, customerId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const query = { isDeleted: false, ...scopeFilter };

    if (stage) query.stage = stage;
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    if (search) {
      query.opportunityName = new RegExp(search.trim(), 'i');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [total, opportunities, summaryAgg] = await Promise.all([
      Opportunity.countDocuments(query),
      Opportunity.find(query)
        .populate('customerId', 'customerCode customerName companyName')
        .populate('leadId', 'leadCode leadName')
        .populate('assignedTo', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      // Aggregate pipeline metrics for the filtered scope
      Opportunity.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalPipelineAmount: {
              $sum: { $cond: [{ $eq: ['$status', OPPORTUNITY_STATUS.OPEN] }, '$amount', 0] },
            },
            totalWeightedPipeline: {
              $sum: { $cond: [{ $eq: ['$status', OPPORTUNITY_STATUS.OPEN] }, '$weightedAmount', 0] },
            },
            wonAmount: {
              $sum: { $cond: [{ $eq: ['$status', OPPORTUNITY_STATUS.WON] }, '$amount', 0] },
            },
            countOpen: { $sum: { $cond: [{ $eq: ['$status', OPPORTUNITY_STATUS.OPEN] }, 1, 0] } },
            countWon: { $sum: { $cond: [{ $eq: ['$status', OPPORTUNITY_STATUS.WON] }, 1, 0] } },
            countLost: { $sum: { $cond: [{ $eq: ['$status', OPPORTUNITY_STATUS.LOST] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const summary = summaryAgg[0] || {
      totalPipelineAmount: 0,
      totalWeightedPipeline: 0,
      wonAmount: 0,
      countOpen: 0,
      countWon: 0,
      countLost: 0,
    };

    return sendSuccess(res, 'Opportunities retrieved successfully.', {
      opportunities,
      summary,
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
 * @desc    Get opportunity by ID
 * @route   GET /api/opportunities/:id
 * @access  Authenticated (Role-scoped)
 */
const getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customerId', 'customerCode customerName email phone companyName address city state')
      .populate('leadId', 'leadCode leadName source')
      .populate('assignedTo', 'name email role');

    if (!opportunity) {
      return sendError(res, 'Opportunity not found.', null, 404);
    }

    if (req.user.role === ROLES.SALES_EXECUTIVE && opportunity.assignedTo._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only view opportunities assigned to you.', null, 403);
    }

    const followUps = await FollowUp.find({ opportunityId: opportunity._id, isDeleted: false })
      .populate('assignedTo', 'name')
      .sort({ followUpDate: -1 });

    return sendSuccess(res, 'Opportunity details retrieved.', {
      opportunity,
      followUps,
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Create new opportunity
 * @route   POST /api/opportunities
 * @access  Authenticated
 */
const createOpportunity = async (req, res) => {
  try {
    const { opportunityName, customerId, leadId, amount, stage, probability, expectedCloseDate, assignedTo, notes } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    let finalAssignedTo = assignedTo;
    if (req.user.role === ROLES.SALES_EXECUTIVE) {
      finalAssignedTo = req.user._id;
    }

    const newOpportunity = await Opportunity.create({
      opportunityName,
      customerId,
      leadId: leadId || null,
      amount: parseFloat(amount),
      stage: stage || OPPORTUNITY_STAGE.QUALIFICATION,
      probability: parseFloat(probability),
      expectedCloseDate: new Date(expectedCloseDate),
      assignedTo: finalAssignedTo,
      notes,
    });

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.OPPORTUNITY,
      recordId: newOpportunity._id.toString(),
      newValue: {
        opportunityName,
        amount: newOpportunity.amount,
        stage: newOpportunity.stage,
        probability: newOpportunity.probability,
      },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `Opportunity '${opportunityName}' created for ₹${newOpportunity.amount}.`,
    });

    const populated = await Opportunity.findById(newOpportunity._id)
      .populate('customerId', 'customerCode customerName')
      .populate('assignedTo', 'name email');

    return sendSuccess(res, 'Opportunity created successfully.', { opportunity: populated }, 201);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Update opportunity details & pipeline stage
 * @route   PUT /api/opportunities/:id
 * @access  Authenticated (Role-scoped)
 */
const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, isDeleted: false });
    if (!opportunity) {
      return sendError(res, 'Opportunity not found.', null, 404);
    }

    if (req.user.role === ROLES.SALES_EXECUTIVE && opportunity.assignedTo.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only update opportunities assigned to you.', null, 403);
    }

    const { opportunityName, amount, stage, probability, expectedCloseDate, assignedTo, lossReason, notes } = req.body;
    const oldValue = opportunity.toObject();

    if (opportunityName) opportunity.opportunityName = opportunityName;
    if (amount !== undefined) opportunity.amount = parseFloat(amount);
    if (stage) opportunity.stage = stage;
    if (probability !== undefined) opportunity.probability = parseFloat(probability);
    if (expectedCloseDate) opportunity.expectedCloseDate = new Date(expectedCloseDate);
    if (lossReason !== undefined) opportunity.lossReason = lossReason;
    if (notes !== undefined) opportunity.notes = notes;

    if (assignedTo && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER)) {
      opportunity.assignedTo = assignedTo;
    }

    await opportunity.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityName: AUDIT_ENTITY.OPPORTUNITY,
      recordId: opportunity._id.toString(),
      oldValue: { stage: oldValue.stage, amount: oldValue.amount, status: oldValue.status },
      newValue: { stage: opportunity.stage, amount: opportunity.amount, status: opportunity.status },
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Opportunity '${opportunity.opportunityName}' updated. Stage: ${opportunity.stage}.`,
    });

    const populated = await Opportunity.findById(opportunity._id)
      .populate('customerId', 'customerCode customerName')
      .populate('assignedTo', 'name email');

    return sendSuccess(res, 'Opportunity updated successfully.', { opportunity: populated });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Soft-delete opportunity
 * @route   DELETE /api/opportunities/:id
 * @access  Admin, Manager
 */
const deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, isDeleted: false });
    if (!opportunity) {
      return sendError(res, 'Opportunity not found.', null, 404);
    }

    opportunity.isDeleted = true;
    await opportunity.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.DELETE,
      entityName: AUDIT_ENTITY.OPPORTUNITY,
      recordId: opportunity._id.toString(),
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Opportunity '${opportunity.opportunityName}' soft-deleted.`,
    });

    return sendSuccess(res, 'Opportunity successfully removed.');
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
};
