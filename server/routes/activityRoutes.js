const express = require('express');
const router = express.Router();
const { getActivities, createActivity, deleteActivity } = require('../controllers/activityController');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);

router.get('/', getActivities);
router.post('/', createActivity);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), deleteActivity);

module.exports = router;
