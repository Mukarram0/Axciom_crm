const mongoose = require('mongoose');
const { ACTIVITY_TYPE, ACTIVITY_STATUS } = require('../config/constants');

const activitySchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      enum: Object.values(ACTIVITY_TYPE),
      required: [true, 'Activity Type is required.'],
    },
    subject: {
      type: String,
      required: [true, 'Activity Subject is required.'],
      trim: true,
      maxlength: [150, 'Subject cannot exceed 150 characters.'],
    },
    description: {
      type: String,
      trim: true,
    },
    activityDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
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
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity must be assigned to an authorized user.'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ACTIVITY_STATUS),
      default: ACTIVITY_STATUS.COMPLETED,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
