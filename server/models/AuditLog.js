const mongoose = require('mongoose');
const { AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTION),
      required: true,
      index: true,
    },
    entityName: {
      type: String,
      enum: Object.values(AUDIT_ENTITY),
      required: true,
      index: true,
    },
    recordId: {
      type: String,
      default: null,
      index: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
      index: true,
    },
    details: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Explicit timestamp index used
    versionKey: false,
  }
);

// Never allow modification or updates to audit logs (Append-only)
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit log entries are immutable and cannot be updated.'));
  }
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
