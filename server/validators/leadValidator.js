const { body } = require('express-validator');
const { LEAD_STATUS, LEAD_PRIORITY, LEAD_SOURCE, VALIDATION_RULES } = require('../config/constants');

const leadCreateValidator = [
  body('leadName')
    .trim()
    .notEmpty()
    .withMessage('Lead Name is mandatory.')
    .isLength({ max: VALIDATION_RULES.NAME_MAX_LENGTH })
    .withMessage(`Lead Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters.`),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Lead Email is required.')
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Lead Phone is required.')
    .matches(VALIDATION_RULES.PHONE_REGEX)
    .withMessage('Enter a valid 10-digit Indian mobile number.'),
  body('companyName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: VALIDATION_RULES.COMPANY_MAX_LENGTH })
    .withMessage(`Company Name cannot exceed ${VALIDATION_RULES.COMPANY_MAX_LENGTH} characters.`),
  body('expectedValue')
    .optional()
    .isFloat({ min: 0, max: VALIDATION_RULES.MAX_EXPECTED_VALUE })
    .withMessage(`Expected Value must be a positive number up to ₹${VALIDATION_RULES.MAX_EXPECTED_VALUE}.`),
  body('source')
    .optional()
    .isIn(Object.values(LEAD_SOURCE))
    .withMessage('Invalid lead source.'),
  body('status')
    .optional()
    .isIn(Object.values(LEAD_STATUS))
    .withMessage('Invalid lead status.'),
  body('priority')
    .optional()
    .isIn(Object.values(LEAD_PRIORITY))
    .withMessage('Invalid lead priority.'),
  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned Sales Executive is required.')
    .isMongoId()
    .withMessage('Invalid user identifier.'),
];

const leadUpdateValidator = [
  body('leadName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Lead Name cannot be empty.')
    .isLength({ max: VALIDATION_RULES.NAME_MAX_LENGTH })
    .withMessage(`Lead Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters.`),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(VALIDATION_RULES.PHONE_REGEX)
    .withMessage('Enter a valid 10-digit Indian mobile number.'),
  body('expectedValue')
    .optional()
    .isFloat({ min: 0, max: VALIDATION_RULES.MAX_EXPECTED_VALUE })
    .withMessage(`Expected Value must be a positive number up to ₹${VALIDATION_RULES.MAX_EXPECTED_VALUE}.`),
  body('source')
    .optional()
    .isIn(Object.values(LEAD_SOURCE))
    .withMessage('Invalid lead source.'),
  body('status')
    .optional()
    .isIn(Object.values(LEAD_STATUS))
    .withMessage('Invalid lead status.'),
  body('priority')
    .optional()
    .isIn(Object.values(LEAD_PRIORITY))
    .withMessage('Invalid lead priority.'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user identifier.'),
];

module.exports = {
  leadValidator: leadCreateValidator,
  leadCreateValidator,
  leadUpdateValidator,
};
