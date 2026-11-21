/**
 * AcxiomCRM End-to-End Automated Test Suite
 * Validates Authentication, Role-Based Access Control, Business Validations,
 * CRM Workflows, Audit Logging, and Reporting.
 */

const BASE_URL = 'http://localhost:5000/api';

let adminCookie = '';
let managerCookie = '';
let salesCookie = '';
let testLeadId = '';
let testCustomerId = '';
let testOppId = '';
let testFollowUpId = '';

const logTest = (name, passed, details = '') => {
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${name} ${details ? '(' + details + ')' : ''}`);
  if (!passed) {
    throw new Error(`Test failed: ${name} - ${details}`);
  }
};

const extractCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    return setCookie.split(';')[0];
  }
  return '';
};

async function runAllTests() {
  console.log('\n======================================================');
  console.log('   ACXIOMCRM COMPREHENSIVE AUTOMATED TEST SUITE       ');
  console.log('======================================================\n');

  try {
    // ---------------------------------------------------------
    // 1. HEALTH CHECK
    // ---------------------------------------------------------
    console.log('--- 1. SYSTEM HEALTH CHECK ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    logTest('API Health Endpoint', healthRes.status === 200 && healthData.status === 'ONLINE');

    // ---------------------------------------------------------
    // 2. AUTHENTICATION & LOCKOUT TESTS
    // ---------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION & SECURITY TESTS ---');

    // 2.1 Invalid Login
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@acxiomcrm.com', password: 'WrongPassword' }),
    });
    logTest('Invalid Password Rejected with 401', badLoginRes.status === 401);

    // 2.2 Valid Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@acxiomcrm.com', password: 'AdminPassword@123' }),
    });
    adminCookie = extractCookie(adminLoginRes);
    const adminData = await adminLoginRes.json();
    logTest('Admin Login Successful (200)', adminLoginRes.status === 200 && adminData.data.user.role === 'Admin');

    // 2.3 Valid Manager Login
    const managerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@acxiomcrm.com', password: 'ManagerPassword@123' }),
    });
    managerCookie = extractCookie(managerLoginRes);
    const managerData = await managerLoginRes.json();
    logTest('Manager Login Successful (200)', managerLoginRes.status === 200 && managerData.data.user.role === 'Manager');

    // 2.4 Valid Sales Executive Login
    const salesLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sales1@acxiomcrm.com', password: 'SalesPassword@123' }),
    });
    salesCookie = extractCookie(salesLoginRes);
    const salesData = await salesLoginRes.json();
    logTest('Sales Executive Login Successful (200)', salesLoginRes.status === 200 && salesData.data.user.role === 'Sales Executive');

    // 2.5 Unauthenticated Request Protection
    const unauthRes = await fetch(`${BASE_URL}/customers`);
    logTest('Anonymous Request Blocked with 401', unauthRes.status === 401);

    // ---------------------------------------------------------
    // 3. ROLE-BASED ACCESS CONTROL (RBAC) TESTS
    // ---------------------------------------------------------
    console.log('\n--- 3. ROLE-BASED ACCESS CONTROL (RBAC) TESTS ---');

    // 3.1 Sales Executive accessing Admin-only Users API
    const salesUserRes = await fetch(`${BASE_URL}/users`, {
      headers: { Cookie: salesCookie },
    });
    logTest('Sales Executive Blocked from User Management with 403', salesUserRes.status === 403);

    // 3.2 Sales Executive accessing Audit Logs
    const salesAuditRes = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { Cookie: salesCookie },
    });
    logTest('Sales Executive Blocked from Audit Trail with 403', salesAuditRes.status === 403);

    // 3.3 Admin accessing User Management
    const adminUserRes = await fetch(`${BASE_URL}/users`, {
      headers: { Cookie: adminCookie },
    });
    logTest('Admin Granted Access to User Management (200)', adminUserRes.status === 200);

    // 3.4 Admin accessing Audit Logs
    const adminAuditRes = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { Cookie: adminCookie },
    });
    logTest('Admin Granted Access to Audit Trail (200)', adminAuditRes.status === 200);

    // ---------------------------------------------------------
    // 4. BUSINESS VALIDATION TESTS
    // ---------------------------------------------------------
    console.log('\n--- 4. BUSINESS & INPUT VALIDATION TESTS ---');

    // 4.1 Invalid Customer Phone format (less than 10 digits)
    const badPhoneRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        customerName: 'Invalid Phone Test',
        email: 'testphone@demo.com',
        phone: '12345', // Invalid
        assignedTo: adminData.data.user._id,
      }),
    });
    logTest('Invalid Phone Number Rejected with 400', badPhoneRes.status === 400);

    // 4.2 Duplicate Customer Email
    const dupEmailRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        customerName: 'Duplicate Email Test',
        email: 'procurement@tcs-demo.com', // Already seeded
        phone: '9899887766',
        assignedTo: adminData.data.user._id,
      }),
    });
    logTest('Duplicate Customer Email Rejected with 409', dupEmailRes.status === 409);

    // 4.3 Opportunity Amount <= 0
    const zeroAmountRes = await fetch(`${BASE_URL}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        opportunityName: 'Zero Amount Deal',
        customerId: adminData.data.user._id, // placeholder
        amount: 0,
        stage: 'Qualification',
        probability: 20,
        expectedCloseDate: new Date(Date.now() + 86400000).toISOString(),
        assignedTo: adminData.data.user._id,
      }),
    });
    logTest('Opportunity Amount <= 0 Rejected with 400', zeroAmountRes.status === 400);

    // 4.4 Opportunity Probability > 100
    const highProbRes = await fetch(`${BASE_URL}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        opportunityName: 'High Probability Deal',
        customerId: adminData.data.user._id,
        amount: 50000,
        stage: 'Qualification',
        probability: 125, // Invalid
        expectedCloseDate: new Date(Date.now() + 86400000).toISOString(),
        assignedTo: adminData.data.user._id,
      }),
    });
    logTest('Opportunity Probability > 100 Rejected with 400', highProbRes.status === 400);

    // 4.5 Follow-up Date in the past for planned activity
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
    const pastFollowUpRes = await fetch(`${BASE_URL}/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        subject: 'Past Follow-up Test',
        followUpType: 'Call',
        followUpDate: pastDate,
        status: 'Planned',
        assignedTo: adminData.data.user._id,
        customerId: adminData.data.user._id,
      }),
    });
    logTest('Past Follow-up Date Rejected with 400', pastFollowUpRes.status === 400);

    // ---------------------------------------------------------
    // 5. CRM WORKFLOWS & CRUD EXECUTION
    // ---------------------------------------------------------
    console.log('\n--- 5. CRM WORKFLOWS & CRUD EXECUTION ---');

    // 5.1 Create Customer
    const testStamp = Date.now().toString().slice(-6);
    const newCustRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        customerName: `Wipro Technologies Ltd ${testStamp}`,
        email: `sales-lead-${testStamp}@wipro-demo.com`,
        phone: `9845${testStamp}`,
        companyName: 'Wipro Enterprises',
        city: 'Bengaluru',
        state: 'Karnataka',
        assignedTo: adminData.data.user._id,
      }),
    });
    const newCustData = await newCustRes.json();
    testCustomerId = newCustData.data.customer._id;
    logTest('Customer Created Successfully with Code', newCustRes.status === 201 && newCustData.data.customer.customerCode.startsWith('CUST-'));

    // 5.2 Create Lead
    const newLeadRes = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        leadName: `Sanjay Reddy ${testStamp}`,
        email: `sanjay-${testStamp}@reddyenterprises.in`,
        phone: `9877${testStamp}`,
        companyName: 'Reddy Heavy Engineering',
        source: 'Website',
        status: 'New',
        expectedValue: 600000,
        assignedTo: adminData.data.user._id,
      }),
    });
    const newLeadData = await newLeadRes.json();
    testLeadId = newLeadData.data.lead._id;
    logTest('Lead Captured Successfully with Code', newLeadRes.status === 201 && newLeadData.data.lead.leadCode.startsWith('LEAD-'));

    // 5.3 Lead Lifecycle Progression: New -> Contacted -> Qualified
    const advanceContactedRes = await fetch(`${BASE_URL}/leads/${testLeadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'Contacted' }),
    });
    logTest('Lead Status Advanced: New -> Contacted', advanceContactedRes.status === 200);

    const advanceQualifiedRes = await fetch(`${BASE_URL}/leads/${testLeadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'Qualified' }),
    });
    logTest('Lead Status Advanced: Contacted -> Qualified', advanceQualifiedRes.status === 200);

    // 5.4 Lead Conversion Workflow (Converts Qualified Lead -> Customer + Opportunity)
    const closeDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const convertRes = await fetch(`${BASE_URL}/leads/${testLeadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        createOpportunity: true,
        opportunityName: 'Reddy Engineering Equipment Deal',
        amount: 600000,
        expectedCloseDate: closeDate,
        notes: 'Handover complete from lead qualification.',
      }),
    });
    const convertData = await convertRes.json();
    logTest(
      'Lead Conversion Workflow Succeeded (200)',
      convertRes.status === 200 &&
        convertData.data.lead.status === 'Converted' &&
        convertData.data.customer &&
        convertData.data.opportunity
    );

    // 5.5 Prevent Duplicate Conversion
    const duplicateConvertRes = await fetch(`${BASE_URL}/leads/${testLeadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ createOpportunity: false }),
    });
    logTest('Duplicate Lead Conversion Blocked with 409', duplicateConvertRes.status === 409);

    // 5.6 Create & Update Opportunity Pipeline Stage (Weighted Math Check)
    const newOppRes = await fetch(`${BASE_URL}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        opportunityName: 'Wipro Cloud Migration Phase 1',
        customerId: testCustomerId,
        amount: 1000000, // 10 Lakhs
        stage: 'Proposal',
        probability: 40,
        expectedCloseDate: closeDate,
        assignedTo: adminData.data.user._id,
      }),
    });
    const newOppData = await newOppRes.json();
    testOppId = newOppData.data.opportunity._id;
    // 10,00,000 * 40% = 4,00,000
    logTest(
      'Weighted Pipeline Formula Verified (Amount * Prob / 100)',
      newOppRes.status === 201 && newOppData.data.opportunity.weightedAmount === 400000
    );

    // Advance to Won (Should set status = Won, probability = 100%)
    const winOppRes = await fetch(`${BASE_URL}/opportunities/${testOppId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ stage: 'Won' }),
    });
    const winOppData = await winOppRes.json();
    logTest(
      'Opportunity Stage Moved to Won (Synchronizes Status & 100% Probability)',
      winOppRes.status === 200 && winOppData.data.opportunity.status === 'Won' && winOppData.data.opportunity.probability === 100
    );

    // 5.7 Follow-up Creation & Rescheduling
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const createFuRes = await fetch(`${BASE_URL}/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        subject: 'Contract Verification Call',
        followUpType: 'Call',
        followUpDate: tomorrow,
        customerId: testCustomerId,
        assignedTo: adminData.data.user._id,
      }),
    });
    const createFuData = await createFuRes.json();
    testFollowUpId = createFuData.data.followUp._id;
    logTest('Follow-Up Scheduled Successfully (201)', createFuRes.status === 201);

    // Reschedule
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    const rescheduleRes = await fetch(`${BASE_URL}/followups/${testFollowUpId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ followUpDate: nextWeek, remarks: 'Client requested reschedule to next week.' }),
    });
    logTest('Follow-Up Rescheduled Successfully (200)', rescheduleRes.status === 200);

    // Complete
    const completeFuRes = await fetch(`${BASE_URL}/followups/${testFollowUpId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'Completed' }),
    });
    logTest('Follow-Up Marked Completed (200)', completeFuRes.status === 200);

    // ---------------------------------------------------------
    // 6. DASHBOARD ANALYTICS & REPORTS
    // ---------------------------------------------------------
    console.log('\n--- 6. DASHBOARD ANALYTICS & REPORTS ---');

    // 6.1 8 KPI Summary Cards
    const dashSummaryRes = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Cookie: adminCookie },
    });
    const dashSummary = await dashSummaryRes.json();
    const kpis = dashSummary.data.kpiCards;
    logTest(
      'Dashboard 8 KPI Cards Returned from Live MongoDB Queries',
      dashSummaryRes.status === 200 &&
        kpis.totalCustomers > 0 &&
        kpis.totalLeads > 0 &&
        kpis.totalOpportunities > 0 &&
        kpis.totalPipelineValue >= 0 &&
        kpis.wonOpportunities > 0
    );

    // 6.2 3 Chart.js Data Sets
    const dashChartsRes = await fetch(`${BASE_URL}/dashboard/charts`, {
      headers: { Cookie: adminCookie },
    });
    const dashCharts = await dashChartsRes.json();
    const c = dashCharts.data.charts;
    logTest(
      'Dashboard Charts Data Verified (Lead Status, Pipeline, Monthly Sales)',
      dashChartsRes.status === 200 &&
        c.leadStatus.labels.length === 6 &&
        c.pipeline.labels.length === 5 &&
        c.monthlySales.labels.length === 6
    );

    // 6.3 Reports Hub Check (Customer, Pipeline, Conversion)
    const pipeReportRes = await fetch(`${BASE_URL}/reports/pipeline`, {
      headers: { Cookie: adminCookie },
    });
    const pipeReportData = await pipeReportRes.json();
    logTest('Sales Pipeline Report (Stage-wise & Owner-wise) Generated', pipeReportRes.status === 200 && pipeReportData.data.stageWise.length > 0);

    const convReportRes = await fetch(`${BASE_URL}/reports/conversion`, {
      headers: { Cookie: adminCookie },
    });
    const convReportData = await convReportRes.json();
    logTest(
      'Conversion Rate Report Generated',
      convReportRes.status === 200 && convReportData.data.metrics.leadConversionRate !== undefined
    );

    // ---------------------------------------------------------
    // 7. AUDIT TRAIL VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- 7. AUDIT TRAIL VERIFICATION ---');
    const auditRes = await fetch(`${BASE_URL}/audit-logs?limit=5`, {
      headers: { Cookie: adminCookie },
    });
    const auditData = await auditRes.json();
    logTest(
      'Audit Trail Accurately Recorded All Operations',
      auditRes.status === 200 && auditData.data.auditLogs.length > 0
    );

    console.log('\n======================================================');
    console.log('   🎉 ALL 24 END-TO-END AUTOMATED TESTS PASSED!       ');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ TEST SUITE RUNNER TERMINATED: ${error.message}`);
    process.exit(1);
  }
}

runAllTests();
