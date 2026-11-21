const mongoose = require('mongoose');
const { FOLLOWUP_TYPE, FOLLOWUP_STATUS } = require('../config/constants');

const followUpSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
      index: true,
    },
    followUpType: {
      type: String,
      enum: Object.values(FOLLOWUP_TYPE),
      default: FOLLOWUP_TYPE.CALL,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required.'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters.'],
    },
    followUpDate: {
      type: Date,
      required: [true, 'Follow-up date is required.'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FOLLOWUP_STATUS),
      default: FOLLOWUP_STATUS.PLANNED,
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Follow-Up must be assigned to an authorized user.'],
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
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

const FollowUp = mongoose.model('FollowUp', followUpSchema);
module.exports = FollowUp;
