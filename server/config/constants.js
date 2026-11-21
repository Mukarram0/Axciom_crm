/**
 * Application Constants and Business Rule Enums
 * Defines system roles, statuses, workflows, and validation boundaries.
 */

const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALES_EXECUTIVE: 'Sales Executive',
};

const CUSTOMER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  LEAD_CONVERTED: 'Lead-Converted',
};

const LEAD_STATUS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

// Permitted lead status workflow transitions
const VALID_LEAD_TRANSITIONS = {
  [LEAD_STATUS.NEW]: [LEAD_STATUS.CONTACTED, LEAD_STATUS.UNQUALIFIED, LEAD_STATUS.LOST],
  [LEAD_STATUS.CONTACTED]: [LEAD_STATUS.QUALIFIED, LEAD_STATUS.UNQUALIFIED, LEAD_STATUS.LOST],
  [LEAD_STATUS.QUALIFIED]: [LEAD_STATUS.CONVERTED, LEAD_STATUS.LOST],
  [LEAD_STATUS.UNQUALIFIED]: [LEAD_STATUS.CONTACTED, LEAD_STATUS.LOST],
  [LEAD_STATUS.CONVERTED]: [], // Terminal state
  [LEAD_STATUS.LOST]: [LEAD_STATUS.NEW, LEAD_STATUS.CONTACTED], // Re-opened if qualified
};

const LEAD_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const LEAD_SOURCE = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  COLD_CALL: 'Cold Call',
  ADVERTISEMENT: 'Advertisement',
  TRADE_SHOW: 'Trade Show',
  EMAIL_CAMPAIGN: 'Email Campaign',
  OTHER: 'Other',
};

const OPPORTUNITY_STAGE = {
  QUALIFICATION: 'Qualification',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

const OPPORTUNITY_STATUS = {
  OPEN: 'Open',
  WON: 'Won',
  LOST: 'Lost',
};

// Standard probability defaults per stage
const STAGE_DEFAULT_PROBABILITY = {
  [OPPORTUNITY_STAGE.QUALIFICATION]: 10,
  [OPPORTUNITY_STAGE.PROPOSAL]: 40,
  [OPPORTUNITY_STAGE.NEGOTIATION]: 70,
  [OPPORTUNITY_STAGE.WON]: 100,
  [OPPORTUNITY_STAGE.LOST]: 0,
};

const FOLLOWUP_TYPE = {
  CALL: 'Call',
  MEETING: 'Meeting',
  EMAIL: 'Email',
  TASK: 'Task',
};

const FOLLOWUP_STATUS = {
  PLANNED: 'Planned',
  COMPLETED: 'Completed',
  MISSED: 'Missed',
  CANCELLED: 'Cancelled',
};

const ACTIVITY_TYPE = {
  CALL: 'Call',
  MEETING: 'Meeting',
  EMAIL: 'Email',
  TASK: 'Task',
};

const ACTIVITY_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
};

const AUDIT_ACTION = {
  LOGIN: 'LOGIN',
  FAILED_LOGIN: 'FAILED_LOGIN',
  LOGOUT: 'LOGOUT',
  LOCKOUT: 'LOCKOUT',
  UNLOCK: 'UNLOCK',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  CONVERT: 'CONVERT',
  STATUS_CHANGE: 'STATUS_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
};

const AUDIT_ENTITY = {
  USER: 'User',
  CUSTOMER: 'Customer',
  LEAD: 'Lead',
  OPPORTUNITY: 'Opportunity',
  FOLLOWUP: 'FollowUp',
  ACTIVITY: 'Activity',
  AUTH: 'Auth',
};

// Validation standards
const VALIDATION_RULES = {
  PHONE_REGEX: /^[6-9]\d{9}$/, // 10-digit Indian Mobile Number standard
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 100,
  COMPANY_MAX_LENGTH: 120,
  MAX_EXPECTED_VALUE: 100000000, // 10 Crores
};

module.exports = {
  ROLES,
  CUSTOMER_STATUS,
  LEAD_STATUS,
  VALID_LEAD_TRANSITIONS,
  LEAD_PRIORITY,
  LEAD_SOURCE,
  OPPORTUNITY_STAGE,
  OPPORTUNITY_STATUS,
  STAGE_DEFAULT_PROBABILITY,
  FOLLOWUP_TYPE,
  FOLLOWUP_STATUS,
  ACTIVITY_TYPE,
  ACTIVITY_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY,
  VALIDATION_RULES,
};
