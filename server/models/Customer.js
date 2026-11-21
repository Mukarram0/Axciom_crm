const mongoose = require('mongoose');
const { CUSTOMER_STATUS, VALIDATION_RULES } = require('../config/constants');

const customerSchema = new mongoose.Schema(
  {
    customerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer Name is required.'],
      trim: true,
      maxlength: [VALIDATION_RULES.NAME_MAX_LENGTH, `Customer Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters.`],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Customer Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Customer Phone is required.'],
      unique: true,
      trim: true,
      match: [VALIDATION_RULES.PHONE_REGEX, 'Enter a valid 10-digit Indian mobile number.'],
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [VALIDATION_RULES.COMPANY_MAX_LENGTH, `Company Name cannot exceed ${VALIDATION_RULES.COMPANY_MAX_LENGTH} characters.`],
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CUSTOMER_STATUS),
      default: CUSTOMER_STATUS.ACTIVE,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned Sales Executive is required.'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient search & query
customerSchema.index({ customerName: 'text', email: 'text', phone: 'text', companyName: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
