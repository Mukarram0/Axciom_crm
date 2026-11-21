const mongoose = require('mongoose');
const { OPPORTUNITY_STAGE, OPPORTUNITY_STATUS } = require('../config/constants');

const opportunitySchema = new mongoose.Schema(
  {
    opportunityName: {
      type: String,
      required: [true, 'Opportunity Name is required.'],
      trim: true,
      maxlength: [120, 'Opportunity Name cannot exceed 120 characters.'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required.'],
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Opportunity Amount is required.'],
      min: [0, 'Amount cannot be negative.'],
      validate: {
        validator: function (val) {
          // If status is Open, Amount must be strictly greater than 0
          if (this.status === OPPORTUNITY_STATUS.OPEN && val <= 0) {
            return false;
          }
          return true;
        },
        message: 'Opportunity Amount must be greater than 0.',
      },
    },
    stage: {
      type: String,
      enum: Object.values(OPPORTUNITY_STAGE),
      default: OPPORTUNITY_STAGE.QUALIFICATION,
      index: true,
    },
    probability: {
      type: Number,
      required: [true, 'Probability is required.'],
      min: [0, 'Probability must be between 0 and 100.'],
      max: [100, 'Probability must be between 0 and 100.'],
    },
    weightedAmount: {
      type: Number,
      default: 0,
    },
    expectedCloseDate: {
      type: Date,
      required: [true, 'Expected Close Date is required.'],
    },
    status: {
      type: String,
      enum: Object.values(OPPORTUNITY_STATUS),
      default: OPPORTUNITY_STATUS.OPEN,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Opportunity must be assigned to an owner.'],
      index: true,
    },
    lossReason: {
      type: String,
      trim: true,
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

// Pre-save hook to calculate weighted amount and synchronize status
opportunitySchema.pre('save', function (next) {
  // Weighted Pipeline = Amount * Probability / 100
  this.weightedAmount = Math.round(((this.amount || 0) * (this.probability || 0)) / 100);

  if (this.stage === OPPORTUNITY_STAGE.WON) {
    this.status = OPPORTUNITY_STATUS.WON;
    this.probability = 100;
  } else if (this.stage === OPPORTUNITY_STAGE.LOST) {
    this.status = OPPORTUNITY_STATUS.LOST;
    this.probability = 0;
  } else {
    this.status = OPPORTUNITY_STATUS.OPEN;
  }
  next();
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);
module.exports = Opportunity;
