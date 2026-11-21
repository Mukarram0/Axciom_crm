const express = require('express');
const router = express.Router();
const {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} = require('../controllers/followUpController');
const { followUpValidator } = require('../validators/followUpValidator');
const validate = require('../middleware/validate');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);

router.get('/', getFollowUps);
router.get('/:id', getFollowUpById);
router.post('/', followUpValidator, validate, createFollowUp);
router.put('/:id', updateFollowUp);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), deleteFollowUp);

module.exports = router;
