const express = require('express');
const router = express.Router();
const { getDashboardSummary, getDashboardCharts } = require('../controllers/dashboardController');
const { authenticateSession } = require('../middleware/auth');

router.use(authenticateSession);

router.get('/summary', getDashboardSummary);
router.get('/charts', getDashboardCharts);

module.exports = router;
