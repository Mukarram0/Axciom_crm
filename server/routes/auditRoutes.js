const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);
router.get('/', authorizeRoles(ROLES.ADMIN), getAuditLogs);

module.exports = router;
