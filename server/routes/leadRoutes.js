const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLead,
  deleteLead,
} = require('../controllers/leadController');
const { leadCreateValidator, leadUpdateValidator } = require('../validators/leadValidator');
const validate = require('../middleware/validate');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', leadCreateValidator, validate, createLead);
router.put('/:id', leadUpdateValidator, validate, updateLead);
router.post('/:id/convert', convertLead);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), deleteLead);

module.exports = router;
