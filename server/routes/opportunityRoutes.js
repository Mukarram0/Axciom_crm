const express = require('express');
const router = express.Router();
const {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} = require('../controllers/opportunityController');
const { opportunityValidator } = require('../validators/opportunityValidator');
const validate = require('../middleware/validate');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);

router.get('/', getOpportunities);
router.get('/:id', getOpportunityById);
router.post('/', opportunityValidator, validate, createOpportunity);
router.put('/:id', updateOpportunity);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), deleteOpportunity);

module.exports = router;
