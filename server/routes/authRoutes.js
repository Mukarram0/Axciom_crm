const express = require('express');
const router = express.Router();
const { login, register, logout, getMe } = require('../controllers/authController');
const { loginValidator, registerValidator } = require('../validators/authValidator');
const validate = require('../middleware/validate');
const { authenticateSession } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', authRateLimiter, loginValidator, validate, login);
router.post('/register', authRateLimiter, registerValidator, validate, register);

// Authenticated routes
router.post('/logout', authenticateSession, logout);
router.get('/me', authenticateSession, getMe);

module.exports = router;
