const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { customerCreateValidator, customerUpdateValidator } = require('../validators/customerValidator');
const validate = require('../middleware/validate');
const { authenticateSession, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticateSession);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', customerCreateValidator, validate, createCustomer);
router.put('/:id', customerUpdateValidator, validate, updateCustomer);
router.delete('/:id', authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), deleteCustomer);

module.exports = router;
