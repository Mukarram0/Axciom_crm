const mongoose = require('mongoose');
const { LEAD_STATUS, LEAD_PRIORITY, LEAD_SOURCE, VALIDATION_RULES } = require('../config/constants');

const leadSchema = new mongoose.Schema(
  {
    leadCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    leadName: {
      type: String,
      required: [true, 'Lead Name is mandatory.'],
      trim: true,
      maxlength: [VALIDATION_RULES.NAME_MAX_LENGTH, `Lead Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters.`],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Lead Email is required.'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Lead Phone is required.'],
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
    source: {
      type: String,
      enum: Object.values(LEAD_SOURCE),
      default: LEAD_SOURCE.WEBSITE,
    },
    status: {
      type: String,
      enum: Object.values(LEAD_STATUS),
      default: LEAD_STATUS.NEW,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(LEAD_PRIORITY),
      default: LEAD_PRIORITY.MEDIUM,
      index: true,
    },
    expectedValue: {
      type: Number,
      default: 0,
      min: [0, 'Expected Value cannot be negative.'],
      max: [VALIDATION_RULES.MAX_EXPECTED_VALUE, 'Expected Value exceeds allowable limit.'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Lead must be assigned to a Sales Executive or Manager.'],
      index: true,
    },
    convertedCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    convertedOpportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },
    convertedAt: {
      type: Date,
      default: null,
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

leadSchema.index({ leadName: 'text', companyName: 'text', email: 'text', phone: 'text' });

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;
