const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');
const Activity = require('../models/Activity');
const { ROLES, LEAD_STATUS, VALID_LEAD_TRANSITIONS, CUSTOMER_STATUS, OPPORTUNITY_STAGE, OPPORTUNITY_STATUS, AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');
const { getAuthorizedScopeFilter } = require('../middleware/auth');
const { generateLeadCode, generateCustomerCode } = require('../utils/codeGenerator');
const { logEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get paginated and filtered leads
 * @route   GET /api/leads
 * @access  Authenticated (Role-scoped)
 */
const getLeads = async (req, res) => {
  try {
    const { search, status, priority, source, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const query = { isDeleted: false, ...scopeFilter };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { leadName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { companyName: searchRegex },
        { leadCode: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [total, leads] = await Promise.all([
      Lead.countDocuments(query),
      Lead.find(query)
        .populate('assignedTo', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
    ]);

    return sendSuccess(res, 'Leads retrieved successfully.', {
      leads,
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
 * @desc    Get lead by ID with activity & follow-up history
 * @route   GET /api/leads/:id
 * @access  Authenticated (Role-scoped)
 */
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'name email role')
      .populate('convertedCustomerId', 'customerCode customerName email phone')
      .populate('convertedOpportunityId', 'opportunityName amount stage');

    if (!lead) {
      return sendError(res, 'Lead not found.', null, 404);
    }

    if (req.user.role === ROLES.SALES_EXECUTIVE && lead.assignedTo._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only view leads assigned to you.', null, 403);
    }

    const [followUps, activities] = await Promise.all([
      FollowUp.find({ leadId: lead._id, isDeleted: false }).populate('assignedTo', 'name').sort({ followUpDate: -1 }),
      Activity.find({ leadId: lead._id }).populate('assignedTo', 'name').sort({ activityDate: -1 }),
    ]);

    return sendSuccess(res, 'Lead details retrieved.', {
      lead,
      followUps,
      activities,
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Create new lead
 * @route   POST /api/leads
 * @access  Authenticated
 */
const createLead = async (req, res) => {
  try {
    const { leadName, email, phone, companyName, source, status, priority, expectedValue, assignedTo, notes } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    let finalAssignedTo = assignedTo;
    if (req.user.role === ROLES.SALES_EXECUTIVE) {
      finalAssignedTo = req.user._id;
    }

    const leadCode = await generateLeadCode();

    const newLead = await Lead.create({
      leadCode,
      leadName,
      email,
      phone,
      companyName,
      source: source || 'Website',
      status: status || LEAD_STATUS.NEW,
      priority: priority || 'Medium',
      expectedValue: expectedValue || 0,
      assignedTo: finalAssignedTo,
      notes,
    });

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.LEAD,
      recordId: newLead._id.toString(),
      newValue: { leadCode, leadName, email, status: newLead.status },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `Lead ${leadName} (${leadCode}) created.`,
    });

    const populated = await Lead.findById(newLead._id).populate('assignedTo', 'name email');
    return sendSuccess(res, 'Lead created successfully.', { lead: populated }, 201);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Update lead details & manage status transitions
 * @route   PUT /api/leads/:id
 * @access  Authenticated (Role-scoped)
 */
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false });
    if (!lead) {
      return sendError(res, 'Lead not found.', null, 404);
    }

    if (req.user.role === ROLES.SALES_EXECUTIVE && lead.assignedTo.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only update leads assigned to you.', null, 403);
    }

    const { leadName, email, phone, companyName, source, status, priority, expectedValue, assignedTo, notes } = req.body;

    // Validate Status Transition Workflow
    if (status && status !== lead.status) {
      // Cannot manually transition to Converted via edit - must use conversion workflow endpoint
      if (status === LEAD_STATUS.CONVERTED) {
        return sendError(res, 'Leads cannot be marked as Converted manually. Please use the Lead Conversion workflow.', null, 400);
      }

      const permittedTransitions = VALID_LEAD_TRANSITIONS[lead.status] || [];
      if (!permittedTransitions.includes(status)) {
        return sendError(
          res,
          `Invalid status transition from '${lead.status}' to '${status}'. Permitted next statuses: ${permittedTransitions.join(', ') || 'None'}.`,
          null,
          400
        );
      }
    }

    const oldValue = lead.toObject();

    lead.leadName = leadName || lead.leadName;
    lead.email = email ? email.toLowerCase() : lead.email;
    lead.phone = phone || lead.phone;
    lead.companyName = companyName !== undefined ? companyName : lead.companyName;
    lead.source = source || lead.source;
    lead.priority = priority || lead.priority;
    lead.expectedValue = expectedValue !== undefined ? expectedValue : lead.expectedValue;
    lead.notes = notes !== undefined ? notes : lead.notes;

    if (status && status !== lead.status) {
      lead.status = status;
    }

    if (assignedTo && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER)) {
      lead.assignedTo = assignedTo;
    }

    await lead.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityName: AUDIT_ENTITY.LEAD,
      recordId: lead._id.toString(),
      oldValue: { leadName: oldValue.leadName, status: oldValue.status, assignedTo: oldValue.assignedTo },
      newValue: { leadName: lead.leadName, status: lead.status, assignedTo: lead.assignedTo },
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Lead ${lead.leadCode} updated. Status: ${lead.status}.`,
    });

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'name email');
    return sendSuccess(res, 'Lead updated successfully.', { lead: populated });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Lead Conversion Workflow: Converts Qualified Lead into Customer & optional Opportunity
 * @route   POST /api/leads/:id/convert
 * @access  Authenticated (Role-scoped)
 */
const convertLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false });
    if (!lead) {
      return sendError(res, 'Lead not found.', null, 404);
    }

    // Role ownership check
    if (req.user.role === ROLES.SALES_EXECUTIVE && lead.assignedTo.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only convert leads assigned to you.', null, 403);
    }

    // Workflow Check 1: Prevent duplicate conversion
    if (lead.status === LEAD_STATUS.CONVERTED || lead.convertedCustomerId) {
      return sendError(res, 'This lead has already been converted into a customer. Duplicate conversion is not allowed.', null, 409);
    }

    // Workflow Check 2: Lead must be Qualified before conversion
    if (lead.status !== LEAD_STATUS.QUALIFIED) {
      return sendError(res, `Only Qualified leads can be converted. Current lead status is '${lead.status}'. Please qualify the lead first.`, null, 400);
    }

    const { createOpportunity = false, opportunityName, amount, expectedCloseDate, notes } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Step A: Find existing customer or create new Customer
    let customer = await Customer.findOne({
      $or: [{ email: lead.email.toLowerCase() }, { phone: lead.phone }],
      isDeleted: false,
    });

    if (!customer) {
      const customerCode = await generateCustomerCode();
      customer = await Customer.create({
        customerCode,
        customerName: lead.leadName,
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        companyName: lead.companyName,
        status: CUSTOMER_STATUS.LEAD_CONVERTED,
        assignedTo: lead.assignedTo,
        createdBy: req.user._id,
        notes: `Converted from Lead ${lead.leadCode}. ${lead.notes || ''}`,
      });

      await logEvent({
        userId: req.user._id,
        action: AUDIT_ACTION.CREATE,
        entityName: AUDIT_ENTITY.CUSTOMER,
        recordId: customer._id.toString(),
        newValue: { customerCode, customerName: customer.customerName },
        ipAddress: clientIp,
        result: 'SUCCESS',
        details: `Customer created during conversion of Lead ${lead.leadCode}.`,
      });
    }

    // Step B: Optionally create an Opportunity
    let opportunity = null;
    if (createOpportunity) {
      const oppAmount = parseFloat(amount) || lead.expectedValue || 10000;
      if (oppAmount <= 0) {
        return sendError(res, 'Opportunity Amount must be greater than 0.', null, 400);
      }

      let closeDate = expectedCloseDate ? new Date(expectedCloseDate) : new Date();
      if (!expectedCloseDate) {
        closeDate.setDate(closeDate.getDate() + 30); // Default 30 days
      }

      opportunity = await Opportunity.create({
        opportunityName: opportunityName || `${customer.customerName} - New Business Opportunity`,
        customerId: customer._id,
        leadId: lead._id,
        amount: oppAmount,
        stage: OPPORTUNITY_STAGE.QUALIFICATION,
        probability: 20,
        expectedCloseDate: closeDate,
        status: OPPORTUNITY_STATUS.OPEN,
        assignedTo: lead.assignedTo,
        notes: notes || `Created automatically during lead conversion from ${lead.leadCode}.`,
      });

      await logEvent({
        userId: req.user._id,
        action: AUDIT_ACTION.CREATE,
        entityName: AUDIT_ENTITY.OPPORTUNITY,
        recordId: opportunity._id.toString(),
        newValue: { opportunityName: opportunity.opportunityName, amount: opportunity.amount },
        ipAddress: clientIp,
        result: 'SUCCESS',
        details: `Opportunity created via lead conversion of ${lead.leadCode}.`,
      });
    }

    // Step C: Update Lead to Converted
    lead.status = LEAD_STATUS.CONVERTED;
    lead.convertedCustomerId = customer._id;
    lead.convertedOpportunityId = opportunity ? opportunity._id : null;
    lead.convertedAt = new Date();
    await lead.save();

    // Step D: Record Conversion in Audit Log
    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.CONVERT,
      entityName: AUDIT_ENTITY.LEAD,
      recordId: lead._id.toString(),
      newValue: {
        status: LEAD_STATUS.CONVERTED,
        customerId: customer._id,
        opportunityId: opportunity ? opportunity._id : null,
      },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `Lead ${lead.leadCode} converted into Customer ${customer.customerCode}${opportunity ? ' and Opportunity ' + opportunity.opportunityName : ''}.`,
    });

    return sendSuccess(res, 'Lead converted successfully.', {
      lead,
      customer,
      opportunity,
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Soft delete lead
 * @route   DELETE /api/leads/:id
 * @access  Admin, Manager
 */
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false });
    if (!lead) {
      return sendError(res, 'Lead not found.', null, 404);
    }

    lead.isDeleted = true;
    await lead.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.DELETE,
      entityName: AUDIT_ENTITY.LEAD,
      recordId: lead._id.toString(),
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Lead ${lead.leadCode} soft-deleted.`,
    });

    return sendSuccess(res, 'Lead successfully removed.');
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLead,
  deleteLead,
};
