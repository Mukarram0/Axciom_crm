const express = require('express');
const router = express.Router();
const {
  getCustomerReport,
  getLeadReport,
  getFollowUpReport,
  getOpportunityReport,
  getPipelineReport,
  getConversionReport,
  getUserActivityReport,
  getAuditReport,
} = require('../controllers/reportController');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);

router.get('/customers', getCustomerReport);
router.get('/leads', getLeadReport);
router.get('/followups', getFollowUpReport);
router.get('/opportunities', getOpportunityReport);
router.get('/pipeline', getPipelineReport);
router.get('/conversion', getConversionReport);
router.get('/user-activity', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getUserActivityReport);
router.get('/audit', authorizeRoles(ROLES.ADMIN), getAuditReport);

module.exports = router;
