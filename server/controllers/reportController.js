const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');
const Activity = require('../models/Activity');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { ROLES, LEAD_STATUS, OPPORTUNITY_STATUS, OPPORTUNITY_STAGE } = require('../config/constants');
const { getAuthorizedScopeFilter } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const buildDateRangeQuery = (startDate, endDate, dateField = 'createdAt') => {
  if (!startDate && !endDate) return {};
  const query = {};
  query[dateField] = {};
  if (startDate) query[dateField].$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query[dateField].$lte = end;
  }
  return query;
};

/**
 * 1. Customer Report
 */
const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const dateQuery = buildDateRangeQuery(startDate, endDate);
    const query = { isDeleted: false, ...scopeFilter, ...dateQuery };
    if (status) query.status = status;

    const customers = await Customer.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Customer report generated.', { customers, count: customers.length });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * 2. Lead Report
 */
const getLeadReport = async (req, res) => {
  try {
    const { startDate, endDate, status, source } = req.query;
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const dateQuery = buildDateRangeQuery(startDate, endDate);
    const query = { isDeleted: false, ...scopeFilter, ...dateQuery };
    if (status) query.status = status;
    if (source) query.source = source;

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('convertedCustomerId', 'customerCode customerName')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Lead report generated.', { leads, count: leads.length });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * 3. Follow-Up Report
 */
const getFollowUpReport = async (req, res) => {
  try {
    const { startDate, endDate, status, followUpType } = req.query;
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const dateQuery = buildDateRangeQuery(startDate, endDate, 'followUpDate');
    const query = { isDeleted: false, ...scopeFilter, ...dateQuery };
    if (status) query.status = status;
    if (followUpType) query.followUpType = followUpType;

    const followUps = await FollowUp.find(query)
      .populate('customerId', 'customerCode customerName')
      .populate('leadId', 'leadCode leadName')
      .populate('assignedTo', 'name email')
      .sort({ followUpDate: -1 });

    return sendSuccess(res, 'Follow-up report generated.', { followUps, count: followUps.length });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * 4. Opportunity Report
 */
const getOpportunityReport = async (req, res) => {
  try {
    const { startDate, endDate, stage, status } = req.query;
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const dateQuery = buildDateRangeQuery(startDate, endDate);
    const query = { isDeleted: false, ...scopeFilter, ...dateQuery };
    if (stage) query.stage = stage;
    if (status) query.status = status;

    const opportunities = await Opportunity.find(query)
      .populate('customerId', 'customerCode customerName companyName')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const totalAmount = opportunities.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalWeightedAmount = opportunities.reduce((acc, curr) => acc + (curr.weightedAmount || 0), 0);

    return sendSuccess(res, 'Opportunity report generated.', {
      opportunities,
      count: opportunities.length,
      totalAmount,
      totalWeightedAmount,
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * 5. Sales Pipeline Report (Stage-wise & Owner-wise)
 */
const getPipelineReport = async (req, res) => {
  try {
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const query = { isDeleted: false, ...scopeFilter };

    const [stageWise, ownerWise] = await Promise.all([
      Opportunity.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            weightedAmount: { $sum: '$weightedAmount' },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
      Opportunity.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$assignedTo',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            weightedAmount: { $sum: '$weightedAmount' },
            wonCount: { $sum: { $cond: [{ $eq: ['$status', OPPORTUNITY_STATUS.WON] }, 1, 0] } },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'owner',
          },
        },
        { $unwind: '$owner' },
        {
          $project: {
            _id: 1,
            ownerName: '$owner.name',
            ownerEmail: '$owner.email',
            count: 1,
            totalAmount: 1,
            weightedAmount: 1,
            wonCount: 1,
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
    ]);

    return sendSuccess(res, 'Sales pipeline report generated.', { stageWise, ownerWise });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * 6. Sales and Conversion Report
 */
const getConversionReport = async (req, res) => {
  try {
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const baseLeadQuery = { isDeleted: false, ...scopeFilter };
    const baseOppQuery = { isDeleted: false, ...scopeFilter };

    const [totalLeads, convertedLeads, lostLeads, totalOpportunities, wonOpportunities, lostOpportunities] = await Promise.all([
      Lead.countDocuments(baseLeadQuery),
      Lead.countDocuments({ ...baseLeadQuery, status: LEAD_STATUS.CONVERTED }),
      Lead.countDocuments({ ...baseLeadQuery, status: LEAD_STATUS.LOST }),
      Opportunity.countDocuments(baseOppQuery),
      Opportunity.countDocuments({ ...baseOppQuery, status: OPPORTUNITY_STATUS.WON }),
      Opportunity.countDocuments({ ...baseOppQuery, status: OPPORTUNITY_STATUS.LOST }),
    ]);

    const leadConversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;
    const oppWinRate = totalOpportunities > 0 ? ((wonOpportunities / totalOpportunities) * 100).toFixed(1) : 0;

    return sendSuccess(res, 'Conversion report generated.', {
      metrics: {
        totalLeads,
        convertedLeads,
        lostLeads,
        leadConversionRate: `${leadConversionRate}%`,
        totalOpportunities,
        wonOpportunities,
        lostOpportunities,
        oppWinRate: `${oppWinRate}%`,
      },
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * 7. User Activity Report
 */
const getUserActivityReport = async (req, res) => {
  try {
    const userActivities = await Activity.aggregate([
      {
        $group: {
          _id: {
            assignedTo: '$assignedTo',
            type: '$activityType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.assignedTo',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id.assignedTo',
          userName: '$user.name',
          userEmail: '$user.email',
          userRole: '$user.role',
          activityType: '$_id.type',
          count: 1,
        },
      },
      { $sort: { userName: 1 } },
    ]);

    return sendSuccess(res, 'User activity report generated.', { userActivities });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * 8. Audit Report
 */
const getAuditReport = async (req, res) => {
  try {
    const { startDate, endDate, action, entityName } = req.query;
    const dateQuery = buildDateRangeQuery(startDate, endDate, 'timestamp');
    const query = { ...dateQuery };
    if (action) query.action = action;
    if (entityName) query.entityName = entityName;

    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(200);

    return sendSuccess(res, 'Audit report generated.', { auditLogs, count: auditLogs.length });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getCustomerReport,
  getLeadReport,
  getFollowUpReport,
  getOpportunityReport,
  getPipelineReport,
  getConversionReport,
  getUserActivityReport,
  getAuditReport,
};
