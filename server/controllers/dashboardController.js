const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');
const Activity = require('../models/Activity');
const { ROLES, LEAD_STATUS, OPPORTUNITY_STATUS, OPPORTUNITY_STAGE } = require('../config/constants');
const { getAuthorizedScopeFilter } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Compute date boundary query based on filter
 */
const getDateFilterQuery = (dateFilter, customStart, customEnd) => {
  const now = new Date();
  let start = null;
  let end = new Date();

  if (dateFilter === 'today') {
    start = new Date();
    start.setHours(0, 0, 0, 0);
  } else if (dateFilter === 'this_week') {
    start = new Date();
    const day = start.getDay() || 7; // Get current day of week (1=Mon, 7=Sun)
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
  } else if (dateFilter === 'this_month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (dateFilter === 'custom' && customStart && customEnd) {
    start = new Date(customStart);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
  }

  if (start) {
    return { createdAt: { $gte: start, $lte: end } };
  }
  return {};
};

/**
 * @desc    Get 8 mandatory KPI summary cards
 * @route   GET /api/dashboard/summary
 * @access  Authenticated (Role-scoped)
 */
const getDashboardSummary = async (req, res) => {
  try {
    const { dateFilter, startDate, endDate } = req.query;
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const dateQuery = getDateFilterQuery(dateFilter, startDate, endDate);

    const baseCustomerQuery = { isDeleted: false, ...scopeFilter, ...dateQuery };
    const baseLeadQuery = { isDeleted: false, ...scopeFilter, ...dateQuery };
    const baseOppQuery = { isDeleted: false, ...scopeFilter, ...dateQuery };

    const [
      totalCustomers,
      totalLeads,
      openLeads,
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      pipelineValueAgg,
    ] = await Promise.all([
      Customer.countDocuments(baseCustomerQuery),
      Lead.countDocuments(baseLeadQuery),
      Lead.countDocuments({
        ...baseLeadQuery,
        status: { $nin: [LEAD_STATUS.CONVERTED, LEAD_STATUS.LOST] },
      }),
      Opportunity.countDocuments(baseOppQuery),
      Opportunity.countDocuments({ ...baseOppQuery, status: OPPORTUNITY_STATUS.OPEN }),
      Opportunity.countDocuments({ ...baseOppQuery, status: OPPORTUNITY_STATUS.WON }),
      Opportunity.countDocuments({ ...baseOppQuery, status: OPPORTUNITY_STATUS.LOST }),
      Opportunity.aggregate([
        { $match: { ...baseOppQuery, status: OPPORTUNITY_STATUS.OPEN } },
        { $group: { _id: null, totalValue: { $sum: '$amount' }, weightedValue: { $sum: '$weightedAmount' } } },
      ]),
    ]);

    const totalPipelineValue = pipelineValueAgg[0]?.totalValue || 0;
    const weightedPipelineValue = pipelineValueAgg[0]?.weightedValue || 0;

    return sendSuccess(res, 'Dashboard summary loaded.', {
      kpiCards: {
        totalCustomers,
        totalLeads,
        openLeads,
        totalOpportunities,
        openOpportunities,
        wonOpportunities,
        lostOpportunities,
        totalPipelineValue,
        weightedPipelineValue,
      },
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Get chart analytics data (Lead status, Opportunity pipeline, Monthly sales)
 * @route   GET /api/dashboard/charts
 * @access  Authenticated (Role-scoped)
 */
const getDashboardCharts = async (req, res) => {
  try {
    const { dateFilter, startDate, endDate } = req.query;
    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const dateQuery = getDateFilterQuery(dateFilter, startDate, endDate);

    // 1. Lead Status Breakdown
    const leadStatusAgg = await Lead.aggregate([
      { $match: { isDeleted: false, ...scopeFilter, ...dateQuery } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const leadStatusMap = {
      [LEAD_STATUS.NEW]: 0,
      [LEAD_STATUS.CONTACTED]: 0,
      [LEAD_STATUS.QUALIFIED]: 0,
      [LEAD_STATUS.UNQUALIFIED]: 0,
      [LEAD_STATUS.LOST]: 0,
      [LEAD_STATUS.CONVERTED]: 0,
    };
    leadStatusAgg.forEach((item) => {
      if (item._id in leadStatusMap) leadStatusMap[item._id] = item.count;
    });

    // 2. Opportunity Pipeline Stage Breakdown
    const pipelineStageAgg = await Opportunity.aggregate([
      { $match: { isDeleted: false, ...scopeFilter, ...dateQuery } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          weightedAmount: { $sum: '$weightedAmount' },
        },
      },
    ]);

    const pipelineMap = {
      [OPPORTUNITY_STAGE.QUALIFICATION]: { count: 0, amount: 0 },
      [OPPORTUNITY_STAGE.PROPOSAL]: { count: 0, amount: 0 },
      [OPPORTUNITY_STAGE.NEGOTIATION]: { count: 0, amount: 0 },
      [OPPORTUNITY_STAGE.WON]: { count: 0, amount: 0 },
      [OPPORTUNITY_STAGE.LOST]: { count: 0, amount: 0 },
    };
    pipelineStageAgg.forEach((item) => {
      if (item._id in pipelineMap) {
        pipelineMap[item._id] = { count: item.count, amount: item.totalAmount };
      }
    });

    // 3. Monthly Sales (Won revenue past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySalesAgg = await Opportunity.aggregate([
      {
        $match: {
          isDeleted: false,
          ...scopeFilter,
          status: OPPORTUNITY_STATUS.WON,
          updatedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          totalWon: { $sum: '$amount' },
          countWon: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format monthly labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalesLabels = [];
    const monthlySalesData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-12
      const label = `${monthNames[month - 1]} ${year}`;
      monthlySalesLabels.push(label);

      const found = monthlySalesAgg.find((item) => item._id.year === year && item._id.month === month);
      monthlySalesData.push(found ? found.totalWon : 0);
    }

    // 4. Upcoming Follow-ups (Next 5) & Recent Activities (Last 5)
    const [upcomingFollowUps, recentActivities] = await Promise.all([
      FollowUp.find({
        isDeleted: false,
        ...scopeFilter,
        status: 'Planned',
        followUpDate: { $gte: new Date() },
      })
        .populate('customerId', 'customerName')
        .populate('leadId', 'leadName')
        .populate('assignedTo', 'name')
        .sort({ followUpDate: 1 })
        .limit(5),
      Activity.find({
        ...scopeFilter,
      })
        .populate('customerId', 'customerName')
        .populate('leadId', 'leadName')
        .populate('assignedTo', 'name')
        .sort({ activityDate: -1 })
        .limit(5),
    ]);

    return sendSuccess(res, 'Dashboard charts data loaded.', {
      charts: {
        leadStatus: {
          labels: Object.keys(leadStatusMap),
          data: Object.values(leadStatusMap),
        },
        pipeline: {
          labels: Object.keys(pipelineMap),
          counts: Object.values(pipelineMap).map((p) => p.count),
          amounts: Object.values(pipelineMap).map((p) => p.amount),
        },
        monthlySales: {
          labels: monthlySalesLabels,
          data: monthlySalesData,
        },
      },
      widgets: {
        upcomingFollowUps,
        recentActivities,
      },
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardCharts,
};
