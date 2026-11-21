require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');
const Activity = require('../models/Activity');
const AuditLog = require('../models/AuditLog');
const { ROLES, CUSTOMER_STATUS, LEAD_STATUS, LEAD_PRIORITY, LEAD_SOURCE, OPPORTUNITY_STAGE, OPPORTUNITY_STATUS, FOLLOWUP_TYPE, FOLLOWUP_STATUS, ACTIVITY_TYPE, AUDIT_ACTION, AUDIT_ENTITY } = require('../config/constants');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/acxiom_crm';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB...');

    // Clear existing collections
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Lead.deleteMany({});
    await Opportunity.deleteMany({});
    await FollowUp.deleteMany({});
    await Activity.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('[Seeder] Existing CRM collections cleared.');

    // 1. Create Core Users
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@acxiomcrm.com',
      password: 'AdminPassword@123',
      role: ROLES.ADMIN,
      phone: '9876543210',
      isActive: true,
    });

    const managerUser = await User.create({
      name: 'Sales Manager (Vikram Sharma)',
      email: 'manager@acxiomcrm.com',
      password: 'ManagerPassword@123',
      role: ROLES.MANAGER,
      phone: '9876543211',
      isActive: true,
    });

    const salesExec1 = await User.create({
      name: 'Priya Patel (Senior Rep)',
      email: 'sales1@acxiomcrm.com',
      password: 'SalesPassword@123',
      role: ROLES.SALES_EXECUTIVE,
      reportsTo: managerUser._id,
      phone: '9876543212',
      isActive: true,
    });

    const salesExec2 = await User.create({
      name: 'Rahul Verma (Sales Rep)',
      email: 'sales2@acxiomcrm.com',
      password: 'SalesPassword@123',
      role: ROLES.SALES_EXECUTIVE,
      reportsTo: managerUser._id,
      phone: '9876543213',
      isActive: true,
    });

    console.log('[Seeder] Users created successfully.');

    // 2. Create Sample Customers
    const customer1 = await Customer.create({
      customerCode: 'CUST-1001',
      customerName: 'Tata Consultancy Services',
      email: 'procurement@tcs-demo.com',
      phone: '9820011223',
      companyName: 'Tata Consultancy Services Ltd.',
      address: 'TCS House, Raveline Street, Fort',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: CUSTOMER_STATUS.ACTIVE,
      assignedTo: salesExec1._id,
      createdBy: adminUser._id,
      notes: 'Strategic enterprise client for cloud data pipeline.',
    });

    const customer2 = await Customer.create({
      customerCode: 'CUST-1002',
      customerName: 'Infosys BPM',
      email: 'vendor.relations@infosys-demo.com',
      phone: '9845012345',
      companyName: 'Infosys Limited',
      address: 'Electronics City, Hosur Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: CUSTOMER_STATUS.ACTIVE,
      assignedTo: salesExec2._id,
      createdBy: managerUser._id,
      notes: 'Customer relationship started Q1 2026.',
    });

    const customer3 = await Customer.create({
      customerCode: 'CUST-1003',
      customerName: 'HDFC Securities',
      email: 'techleads@hdfcsec-demo.com',
      phone: '9819055443',
      companyName: 'HDFC Securities Ltd.',
      address: 'Trade World, Kamala Mills, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: CUSTOMER_STATUS.ACTIVE,
      assignedTo: salesExec1._id,
      createdBy: adminUser._id,
      notes: 'Interested in annual enterprise CRM support agreement.',
    });

    console.log('[Seeder] Customers created successfully.');

    // 3. Create Sample Leads
    const lead1 = await Lead.create({
      leadCode: 'LEAD-1001',
      leadName: 'Aarav Singhania',
      email: 'aarav@apextech.in',
      phone: '9811122233',
      companyName: 'Apex Technologies',
      source: LEAD_SOURCE.WEBSITE,
      status: LEAD_STATUS.QUALIFIED,
      priority: LEAD_PRIORITY.HIGH,
      expectedValue: 450000,
      assignedTo: salesExec1._id,
      notes: 'Qualified inbound inquiry looking to onboard 50 sales seats.',
    });

    const lead2 = await Lead.create({
      leadCode: 'LEAD-1002',
      leadName: 'Meera Iyer',
      email: 'meera@horizonlogistics.co.in',
      phone: '9833344455',
      companyName: 'Horizon Logistics',
      source: LEAD_SOURCE.REFERRAL,
      status: LEAD_STATUS.CONTACTED,
      priority: LEAD_PRIORITY.MEDIUM,
      expectedValue: 280000,
      assignedTo: salesExec2._id,
      notes: 'Demo meeting completed; awaiting budget approval.',
    });

    const lead3 = await Lead.create({
      leadCode: 'LEAD-1003',
      leadName: 'Kunal Deshmukh',
      email: 'kunal@zenithpharma.com',
      phone: '9844455566',
      companyName: 'Zenith Pharma Pvt Ltd',
      source: LEAD_SOURCE.TRADE_SHOW,
      status: LEAD_STATUS.NEW,
      priority: LEAD_PRIORITY.URGENT,
      expectedValue: 850000,
      assignedTo: salesExec1._id,
      notes: 'Met at India HealthTech Expo; high urgency requirement.',
    });

    console.log('[Seeder] Leads created successfully.');

    // 4. Create Sample Opportunities
    const closeDate1 = new Date();
    closeDate1.setDate(closeDate1.getDate() + 30); // 30 days ahead

    const closeDate2 = new Date();
    closeDate2.setDate(closeDate2.getDate() + 45); // 45 days ahead

    const closeDatePast = new Date();
    closeDatePast.setDate(closeDatePast.getDate() - 10); // Won last week

    const opp1 = await Opportunity.create({
      opportunityName: 'TCS Cloud Analytics Expansion',
      customerId: customer1._id,
      amount: 1200000,
      stage: OPPORTUNITY_STAGE.NEGOTIATION,
      probability: 70,
      expectedCloseDate: closeDate1,
      status: OPPORTUNITY_STATUS.OPEN,
      assignedTo: salesExec1._id,
      notes: 'Final contract terms being reviewed by legal.',
    });

    const opp2 = await Opportunity.create({
      opportunityName: 'Infosys Automation Suite',
      customerId: customer2._id,
      amount: 650000,
      stage: OPPORTUNITY_STAGE.PROPOSAL,
      probability: 40,
      expectedCloseDate: closeDate2,
      status: OPPORTUNITY_STATUS.OPEN,
      assignedTo: salesExec2._id,
      notes: 'Proposal submitted on May 10th.',
    });

    const opp3 = await Opportunity.create({
      opportunityName: 'HDFC Mobile Banking CRM Integration',
      customerId: customer3._id,
      amount: 950000,
      stage: OPPORTUNITY_STAGE.WON,
      probability: 100,
      expectedCloseDate: closeDatePast,
      status: OPPORTUNITY_STATUS.WON,
      assignedTo: salesExec1._id,
      notes: 'Won and closed successfully. Handover to implementation team.',
    });

    console.log('[Seeder] Opportunities created successfully.');

    // 5. Create Sample Follow-Ups
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);

    await FollowUp.create({
      customerId: customer1._id,
      opportunityId: opp1._id,
      followUpType: FOLLOWUP_TYPE.MEETING,
      subject: 'Contract Clarification Call with TCS Procurement',
      followUpDate: tomorrow,
      status: FOLLOWUP_STATUS.PLANNED,
      remarks: 'Prepare revised pricing schedule document.',
      assignedTo: salesExec1._id,
    });

    await FollowUp.create({
      leadId: lead1._id,
      followUpType: FOLLOWUP_TYPE.CALL,
      subject: 'Follow-up regarding custom CRM integrations',
      followUpDate: nextWeek,
      status: FOLLOWUP_STATUS.PLANNED,
      remarks: 'Walkthrough of REST API and webhook capabilities.',
      assignedTo: salesExec1._id,
    });

    console.log('[Seeder] Follow-ups created successfully.');

    // 6. Create Sample Activities
    await Activity.create({
      activityType: ACTIVITY_TYPE.CALL,
      subject: 'Initial discovery call with Tata Consultancy Services',
      description: 'Discussed high level requirements for 200 users.',
      activityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      customerId: customer1._id,
      assignedTo: salesExec1._id,
      status: 'Completed',
    });

    await Activity.create({
      activityType: ACTIVITY_TYPE.EMAIL,
      subject: 'Sent product brochure and whitepaper to Infosys',
      description: 'Shared security architecture paper and case studies.',
      activityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      customerId: customer2._id,
      assignedTo: salesExec2._id,
      status: 'Completed',
    });

    console.log('[Seeder] Activities created successfully.');

    // 7. Seed Initial Audit Logs
    await AuditLog.create({
      userId: adminUser._id,
      action: AUDIT_ACTION.LOGIN,
      entityName: AUDIT_ENTITY.AUTH,
      recordId: adminUser._id.toString(),
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
      details: 'Administrator initial login and database seeding session.',
      timestamp: new Date(),
    });

    await AuditLog.create({
      userId: adminUser._id,
      action: AUDIT_ACTION.CREATE,
      entityName: AUDIT_ENTITY.CUSTOMER,
      recordId: customer1._id.toString(),
      newValue: { customerCode: 'CUST-1001', customerName: 'Tata Consultancy Services' },
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
      details: 'Customer master record created.',
      timestamp: new Date(),
    });

    console.log('[Seeder] Audit logs created successfully.');
    console.log('\n=============================================');
    console.log('   ACXIOMCRM DATABASE SEEDED SUCCESSFULLY!   ');
    console.log('=============================================');
    console.log('Demo Accounts:');
    console.log('1. Admin:           admin@acxiomcrm.com     / AdminPassword@123');
    console.log('2. Manager:         manager@acxiomcrm.com   / ManagerPassword@123');
    console.log('3. Sales Exec 1:    sales1@acxiomcrm.com    / SalesPassword@123');
    console.log('4. Sales Exec 2:    sales2@acxiomcrm.com    / SalesPassword@123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
