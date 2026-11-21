const { body } = require('express-validator');
const { OPPORTUNITY_STAGE } = require('../config/constants');

const opportunityValidator = [
  body('opportunityName')
    .trim()
    .notEmpty()
    .withMessage('Opportunity Name is required.')
    .isLength({ max: 120 })
    .withMessage('Opportunity Name cannot exceed 120 characters.'),
  body('customerId')
    .notEmpty()
    .withMessage('Customer reference is required.')
    .isMongoId()
    .withMessage('Invalid Customer ID.'),
  body('amount')
    .notEmpty()
    .withMessage('Opportunity Amount is required.')
    .isFloat({ gt: 0 })
    .withMessage('Opportunity Amount must be greater than 0.'),
  body('probability')
    .notEmpty()
    .withMessage('Probability is required.')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100.'),
  body('stage')
    .notEmpty()
    .withMessage('Opportunity stage is required.')
    .isIn(Object.values(OPPORTUNITY_STAGE))
    .withMessage('Invalid opportunity stage.'),
  body('expectedCloseDate')
    .notEmpty()
    .withMessage('Expected Close Date is required.')
    .isISO8601()
    .withMessage('Invalid date format for Expected Close Date.')
    .custom((val, { req }) => {
      // Validate that active opportunities (not already won/lost) cannot have past close dates
      if (req.body.stage !== OPPORTUNITY_STAGE.WON && req.body.stage !== OPPORTUNITY_STAGE.LOST) {
        const inputDate = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (inputDate < today) {
          throw new Error('Expected Close Date cannot be in the past.');
        }
      }
      return true;
    }),
  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned owner is required.')
    .isMongoId()
    .withMessage('Invalid User ID.'),
];

module.exports = {
  opportunityValidator,
};
