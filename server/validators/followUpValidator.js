const { body } = require('express-validator');
const { FOLLOWUP_TYPE, FOLLOWUP_STATUS } = require('../config/constants');

const followUpValidator = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required.')
    .isLength({ max: 150 })
    .withMessage('Subject cannot exceed 150 characters.'),
  body('followUpType')
    .notEmpty()
    .withMessage('Follow-Up Type is required.')
    .isIn(Object.values(FOLLOWUP_TYPE))
    .withMessage('Invalid Follow-Up Type.'),
  body('followUpDate')
    .notEmpty()
    .withMessage('Follow-up date is required.')
    .isISO8601()
    .withMessage('Invalid date format for follow-up date.')
    .custom((val, { req }) => {
      // Rule: Date cannot be earlier than today for planned/new activities
      if (!req.body.status || req.body.status === FOLLOWUP_STATUS.PLANNED) {
        const inputDate = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (inputDate < today) {
          throw new Error('Follow-up date cannot be earlier than today.');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(Object.values(FOLLOWUP_STATUS))
    .withMessage('Invalid follow-up status.'),
  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned user is required.')
    .isMongoId()
    .withMessage('Invalid User ID.'),
  body().custom((body) => {
    if (!body.customerId && !body.leadId && !body.opportunityId) {
      throw new Error('Follow-up must be associated with at least one Customer, Lead, or Opportunity.');
    }
    return true;
  }),
];

module.exports = {
  followUpValidator,
};
