const { body } = require('express-validator');
const { CUSTOMER_STATUS, VALIDATION_RULES } = require('../config/constants');

const customerCreateValidator = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer Name is required.')
    .isLength({ max: VALIDATION_RULES.NAME_MAX_LENGTH })
    .withMessage(`Customer Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters.`),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Customer Email is required.')
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Customer Phone is required.')
    .matches(VALIDATION_RULES.PHONE_REGEX)
    .withMessage('Enter a valid 10-digit Indian mobile number (e.g. 9820011223).'),
  body('companyName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: VALIDATION_RULES.COMPANY_MAX_LENGTH })
    .withMessage(`Company Name cannot exceed ${VALIDATION_RULES.COMPANY_MAX_LENGTH} characters.`),
  body('status')
    .optional()
    .isIn(Object.values(CUSTOMER_STATUS))
    .withMessage('Invalid customer status provided.'),
  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned Sales Executive is required.')
    .isMongoId()
    .withMessage('Invalid user id format for assignment.'),
];

const customerUpdateValidator = [
  body('customerName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Customer Name cannot be empty.')
    .isLength({ max: VALIDATION_RULES.NAME_MAX_LENGTH })
    .withMessage(`Customer Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters.`),
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
  body('companyName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: VALIDATION_RULES.COMPANY_MAX_LENGTH })
    .withMessage(`Company Name cannot exceed ${VALIDATION_RULES.COMPANY_MAX_LENGTH} characters.`),
  body('status')
    .optional()
    .isIn(Object.values(CUSTOMER_STATUS))
    .withMessage('Invalid customer status provided.'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user id format for assignment.'),
];

module.exports = {
  customerValidator: customerCreateValidator,
  customerCreateValidator,
  customerUpdateValidator,
};
