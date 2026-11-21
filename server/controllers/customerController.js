const Customer = require('../models/Customer');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');
const Activity = require('../models/Activity');
const { ROLES, AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');
const { getAuthorizedScopeFilter } = require('../middleware/auth');
const { generateCustomerCode } = require('../utils/codeGenerator');
const { logEvent } = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get paginated and filtered customers
 * @route   GET /api/customers
 * @access  Authenticated (Role-scoped)
 */
const getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const scopeFilter = await getAuthorizedScopeFilter(req.user, 'assignedTo');
    const query = { isDeleted: false, ...scopeFilter };

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { companyName: searchRegex },
        { customerCode: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [total, customers] = await Promise.all([
      Customer.countDocuments(query),
      Customer.find(query)
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
    ]);

    return sendSuccess(res, 'Customers fetched successfully.', {
      customers,
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
 * @desc    Get customer by ID with full CRM history
 * @route   GET /api/customers/:id
 * @access  Authenticated (Role-scoped)
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    if (!customer) {
      return sendError(res, 'Customer not found.', null, 404);
    }

    // Role-based record ownership check
    if (req.user.role === ROLES.SALES_EXECUTIVE && customer.assignedTo._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only view customers assigned to you.', null, 403);
    }

    // Load related CRM history: Opportunities, Follow-ups, Activities
    const [opportunities, followUps, activities] = await Promise.all([
      Opportunity.find({ customerId: customer._id, isDeleted: false }).sort({ createdAt: -1 }),
      FollowUp.find({ customerId: customer._id, isDeleted: false }).populate('assignedTo', 'name').sort({ followUpDate: -1 }),
      Activity.find({ customerId: customer._id }).populate('assignedTo', 'name').sort({ activityDate: -1 }),
    ]);

    return sendSuccess(res, 'Customer details retrieved.', {
      customer,
      opportunities,
      followUps,
      activities,
    });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Authenticated
 */
const createCustomer = async (req, res) => {
  try {
    const { customerName, email, phone, companyName, address, city, state, status, assignedTo, notes } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check duplicate email
    const duplicateEmail = await Customer.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (duplicateEmail) {
      return sendError(res, 'A customer with this email address already exists.', null, 409);
    }

    // Check duplicate phone
    const duplicatePhone = await Customer.findOne({ phone, isDeleted: false });
    if (duplicatePhone) {
      return sendError(res, 'A customer with this phone number already exists.', null, 409);
    }

    // Sales Executive can only assign to themselves unless Admin/Manager
    let finalAssignedTo = assignedTo;
    if (req.user.role === ROLES.SALES_EXECUTIVE) {
      finalAssignedTo = req.user._id;
    }

    const customerCode = await generateCustomerCode();

    const newCustomer = await Customer.create({
      customerCode,
      customerName,
      email,
      phone,
      companyName,
      address,
      city,
      state,
      status: status || 'Active',
      assignedTo: finalAssignedTo,
      createdBy: req.user._id,
      notes,
    });

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.CUSTOMER,
      recordId: newCustomer._id.toString(),
      newValue: { customerCode, customerName, email, phone, companyName },
      ipAddress: clientIp,
      result: 'SUCCESS',
      details: `Customer ${customerName} (${customerCode}) created.`,
    });

    const populated = await Customer.findById(newCustomer._id).populate('assignedTo', 'name email');

    return sendSuccess(res, 'Customer created successfully.', { customer: populated }, 201);
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Update existing customer
 * @route   PUT /api/customers/:id
 * @access  Authenticated (Role-scoped)
 */
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) {
      return sendError(res, 'Customer not found.', null, 404);
    }

    // Ownership check for Sales Executives
    if (req.user.role === ROLES.SALES_EXECUTIVE && customer.assignedTo.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied. You can only update customers assigned to you.', null, 403);
    }

    const { customerName, email, phone, companyName, address, city, state, status, assignedTo, notes } = req.body;

    // Check uniqueness if email or phone changed
    if (email && email.toLowerCase() !== customer.email) {
      const duplicateEmail = await Customer.findOne({ email: email.toLowerCase(), _id: { $ne: customer._id }, isDeleted: false });
      if (duplicateEmail) {
        return sendError(res, 'Another customer with this email address already exists.', null, 409);
      }
    }

    if (phone && phone !== customer.phone) {
      const duplicatePhone = await Customer.findOne({ phone, _id: { $ne: customer._id }, isDeleted: false });
      if (duplicatePhone) {
        return sendError(res, 'Another customer with this phone number already exists.', null, 409);
      }
    }

    const oldValue = customer.toObject();

    customer.customerName = customerName || customer.customerName;
    customer.email = email ? email.toLowerCase() : customer.email;
    customer.phone = phone || customer.phone;
    customer.companyName = companyName !== undefined ? companyName : customer.companyName;
    customer.address = address !== undefined ? address : customer.address;
    customer.city = city !== undefined ? city : customer.city;
    customer.state = state !== undefined ? state : customer.state;
    customer.status = status || customer.status;
    customer.notes = notes !== undefined ? notes : customer.notes;

    if (assignedTo && (req.user.role === ROLES.ADMIN || req.user.role === ROLES.MANAGER)) {
      customer.assignedTo = assignedTo;
    }

    await customer.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.UPDATE,
      entityName: AUDIT_ENTITY.CUSTOMER,
      recordId: customer._id.toString(),
      oldValue: { customerName: oldValue.customerName, email: oldValue.email, status: oldValue.status },
      newValue: { customerName: customer.customerName, email: customer.email, status: customer.status },
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Customer ${customer.customerCode} updated.`,
    });

    const populated = await Customer.findById(customer._id).populate('assignedTo', 'name email');
    return sendSuccess(res, 'Customer updated successfully.', { customer: populated });
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

/**
 * @desc    Soft-delete / deactivate customer
 * @route   DELETE /api/customers/:id
 * @access  Admin, Manager
 */
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) {
      return sendError(res, 'Customer not found.', null, 404);
    }

    // Soft delete
    customer.isDeleted = true;
    customer.status = 'Inactive';
    await customer.save();

    await logEvent({
      userId: req.user._id,
      action: AUDIT_ACTION.DELETE,
      entityName: AUDIT_ENTITY.CUSTOMER,
      recordId: customer._id.toString(),
      ipAddress: req.ip,
      result: 'SUCCESS',
      details: `Customer ${customer.customerCode} deactivated/soft-deleted.`,
    });

    return sendSuccess(res, 'Customer successfully deactivated.');
  } catch (error) {
    return sendError(res, error.message, null, 500);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
