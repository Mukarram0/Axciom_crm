const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const leadRoutes = require('./leadRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const followUpRoutes = require('./followUpRoutes');
const activityRoutes = require('./activityRoutes');
const userRoutes = require('./userRoutes');
const auditRoutes = require('./auditRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');

// API Route Registration
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/leads', leadRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/followups', followUpRoutes);
router.use('/activities', activityRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'AcxiomCRM REST API Engine',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
