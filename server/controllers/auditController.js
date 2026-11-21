const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get audit trail with multi-field filtering & pagination
 * @route   GET /api/audit-logs
 * @access  Admin only
 */
const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, entityName, result, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entityName) query.entityName = entityName;
    if (result) query.result = result;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [total, auditLogs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return sendSuccess(res, 'Audit logs retrieved successfully.', {
      auditLogs,
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

module.exports = {
  getAuditLogs,
};
