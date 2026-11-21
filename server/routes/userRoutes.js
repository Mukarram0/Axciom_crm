const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  unlockUser,
  resetUserPassword,
} = require('../controllers/userController');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);

// Admin & Manager can list users
router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), getUsers);

// Administrative operations strictly reserved for Admin
router.post('/', authorizeRoles(ROLES.ADMIN), createUser);
router.put('/:id', authorizeRoles(ROLES.ADMIN), updateUser);
router.patch('/:id/status', authorizeRoles(ROLES.ADMIN), updateUserStatus);
router.patch('/:id/role', authorizeRoles(ROLES.ADMIN), updateUserRole);
router.patch('/:id/unlock', authorizeRoles(ROLES.ADMIN), unlockUser);
router.patch('/:id/reset-password', authorizeRoles(ROLES.ADMIN), resetUserPassword);

module.exports = router;
