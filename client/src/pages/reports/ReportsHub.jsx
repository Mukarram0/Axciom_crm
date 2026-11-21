import React, { useState, useEffect } from 'react';
import { Card, Nav, Table, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { exportToCsv } from '../../utils/exportCsv';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  BsFileEarmarkBarGraph,
  BsDownload,
  BsFilter,
  BsPeople,
  BsFunnel,
  BsBriefcase,
  BsCalendarCheck,
  BsGraphUp,
  BsShieldCheck,
} from 'react-icons/bs';

const ReportsHub = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [activeReport, setActiveReport] = useState('customers');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const loadReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let res = null;
      switch (activeReport) {
        case 'customers':
          res = await reportService.getCustomers(params);
          break;
        case 'leads':
          res = await reportService.getLeads(params);
          break;
        case 'followups':
          res = await reportService.getFollowUps(params);
          break;
        case 'opportunities':
          res = await reportService.getOpportunities(params);
          break;
        case 'pipeline':
          res = await reportService.getPipeline(params);
          break;
        case 'conversion':
          res = await reportService.getConversion(params);
          break;
        case 'user-activity':
          res = await reportService.getUserActivity(params);
          break;
        case 'audit':
          res = await reportService.getAudit(params);
          break;
        default:
          break;
      }

      if (res && res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Report loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!reportData) return;

    if (activeReport === 'customers' && reportData.customers) {
      const exportRows = reportData.customers.map((c) => ({
        CustomerCode: c.customerCode,
        CustomerName: c.customerName,
        Email: c.email,
        Phone: c.phone,
        Company: c.companyName || '',
        City: c.city || '',
        State: c.state || '',
        Status: c.status,
        AssignedTo: c.assignedTo?.name || '',
        CreatedDate: formatDate(c.createdAt),
      }));
      exportToCsv('Customer_Report', exportRows);
    } else if (activeReport === 'leads' && reportData.leads) {
      const exportRows = reportData.leads.map((l) => ({
        LeadCode: l.leadCode,
        LeadName: l.leadName,
        Email: l.email,
        Phone: l.phone,
        Company: l.companyName || '',
        Source: l.source,
        Status: l.status,
        Priority: l.priority,
        ExpectedValue: l.expectedValue,
        AssignedTo: l.assignedTo?.name || '',
        ConvertedToCustomer: l.convertedCustomerId?.customerName || 'No',
        CreatedDate: formatDate(l.createdAt),
      }));
      exportToCsv('Lead_Report', exportRows);
    } else if (activeReport === 'followups' && reportData.followUps) {
      const exportRows = reportData.followUps.map((f) => ({
        Type: f.followUpType,
        Subject: f.subject,
        FollowUpDate: formatDate(f.followUpDate),
        Status: f.status,
        AssignedTo: f.assignedTo?.name || '',
        Remarks: f.remarks || '',
      }));
      exportToCsv('FollowUp_Report', exportRows);
    } else if (activeReport === 'opportunities' && reportData.opportunities) {
      const exportRows = reportData.opportunities.map((o) => ({
        OpportunityName: o.opportunityName,
        CustomerName: o.customerId?.customerName || '',
        Amount: o.amount,
        Probability: `${o.probability}%`,
        WeightedAmount: o.weightedAmount,
        Stage: o.stage,
        Status: o.status,
        ExpectedCloseDate: formatDate(o.expectedCloseDate),
        AssignedTo: o.assignedTo?.name || '',
      }));
      exportToCsv('Opportunity_Report', exportRows);
    } else if (activeReport === 'pipeline' && reportData.stageWise) {
      const exportRows = reportData.stageWise.map((s) => ({
        Stage: s._id,
        Count: s.count,
        TotalAmount: s.totalAmount,
        WeightedAmount: s.weightedAmount,
      }));
      exportToCsv('Pipeline_Stage_Report', exportRows);
    } else if (activeReport === 'conversion' && reportData.metrics) {
      const exportRows = [reportData.metrics];
      exportToCsv('Conversion_Metrics_Report', exportRows);
    } else if (activeReport === 'user-activity' && reportData.userActivities) {
      const exportRows = reportData.userActivities.map((u) => ({
        UserName: u.userName,
        UserEmail: u.userEmail,
        UserRole: u.userRole,
        ActivityType: u.activityType,
        ActivityCount: u.count,
      }));
      exportToCsv('User_Activity_Report', exportRows);
    } else if (activeReport === 'audit' && reportData.auditLogs) {
      const exportRows = reportData.auditLogs.map((a) => ({
        Timestamp: formatDateTime(a.timestamp),
        Actor: a.userId?.name || 'System',
        Action: a.action,
        Entity: a.entityName,
        Result: a.result,
        Details: a.details,
      }));
      exportToCsv('Audit_Events_Report', exportRows);
    }
  };

  return (
    <div>
      <PageHeader
        title="CRM Intelligence & Reporting Hub"
        subtitle="Role-governed reports, sales velocity analytics, pipeline tracking, and CSV data export"
      >
        <Button variant="success" onClick={handleExportCsv} className="d-flex align-items-center gap-2">
          <BsDownload /> Export Report to CSV
        </Button>
      </PageHeader>

      {/* Date Filter Form */}
      <Card className="card-crm p-3 mb-3">
        <Form onSubmit={handleFilterSubmit}>
          <Row className="g-2 align-items-center">
            <Col xs={12} sm="auto">
              <span className="small fw-semibold text-muted d-flex align-items-center gap-1">
                <BsFilter /> Date Boundaries:
              </span>
            </Col>
            <Col xs={12} sm={3}>
              <Form.Control
                type="date"
                size="sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Col>
            <Col xs={12} sm={3}>
              <Form.Control
                type="date"
                size="sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Col>
            <Col xs={12} sm="auto">
              <Button type="submit" size="sm" variant="primary">
                Update Report Data
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Report Category Navigation Pills */}
      <Nav
        variant="tabs"
        activeKey={activeReport}
        onSelect={(k) => setActiveReport(k)}
        className="mb-3 border-bottom"
      >
        <Nav.Item>
          <Nav.Link eventKey="customers" className="small fw-medium">
            1. Customers
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="leads" className="small fw-medium">
            2. Leads
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="followups" className="small fw-medium">
            3. Follow-Ups
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="opportunities" className="small fw-medium">
            4. Opportunities
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="pipeline" className="small fw-medium">
            5. Sales Pipeline
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="conversion" className="small fw-medium">
            6. Sales & Conversion
          </Nav.Link>
        </Nav.Item>
        {(isAdmin || isManager) && (
          <Nav.Item>
            <Nav.Link eventKey="user-activity" className="small fw-medium">
              7. User Activity
            </Nav.Link>
          </Nav.Item>
        )}
        {isAdmin && (
          <Nav.Item>
            <Nav.Link eventKey="audit" className="small fw-medium">
              8. Audit Report
            </Nav.Link>
          </Nav.Item>
        )}
      </Nav>

      {/* Report Table Display */}
      <Card className="card-crm p-3">
        {loading ? (
          <LoadingSpinner text="Compiling report data..." />
        ) : !reportData ? (
          <div className="text-center py-5 text-muted">No report data generated.</div>
        ) : (
          <div>
            {/* 1. Customer Report */}
            {activeReport === 'customers' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0">Customer Master Summary</h6>
                  <span className="badge bg-light text-dark border">Total Records: {reportData.count}</span>
                </div>
                <Table responsive hover className="table-crm align-middle">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Customer Name</th>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Assigned Owner</th>
                      <th>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customers.map((c) => (
                      <tr key={c._id}>
                        <td><span className="badge bg-light text-dark border">{c.customerCode}</span></td>
                        <td className="fw-medium">{c.customerName}</td>
                        <td className="text-secondary">{c.companyName || '—'}</td>
                        <td>{c.email}</td>
                        <td>{c.phone}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td className="small">{c.assignedTo?.name}</td>
                        <td className="small text-muted">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* 2. Lead Report */}
            {activeReport === 'leads' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0">Lead Generation & Conversion Log</h6>
                  <span className="badge bg-light text-dark border">Total Leads: {reportData.count}</span>
                </div>
                <Table responsive hover className="table-crm align-middle">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Lead Name</th>
                      <th>Company</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Expected Value</th>
                      <th>Assigned Owner</th>
                      <th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.leads.map((l) => (
                      <tr key={l._id}>
                        <td><span className="badge bg-light text-dark border">{l.leadCode}</span></td>
                        <td className="fw-medium">{l.leadName}</td>
                        <td>{l.companyName || '—'}</td>
                        <td>{l.source}</td>
                        <td><StatusBadge status={l.status} /></td>
                        <td><StatusBadge status={l.priority} /></td>
                        <td className="fw-semibold">{formatCurrency(l.expectedValue)}</td>
                        <td className="small">{l.assignedTo?.name}</td>
                        <td className="small">
                          {l.convertedCustomerId ? (
                            <span className="badge bg-success">Converted: {l.convertedCustomerId.customerName}</span>
                          ) : (
                            <span className="text-muted">In Progress</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* 3. Follow-Up Report */}
            {activeReport === 'followups' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0">Follow-Up Completion & Reminder Analysis</h6>
                  <span className="badge bg-light text-dark border">Total Activities: {reportData.count}</span>
                </div>
                <Table responsive hover className="table-crm align-middle">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Contact Entity</th>
                      <th>Scheduled Date</th>
                      <th>Status</th>
                      <th>Assigned Rep</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.followUps.map((f) => (
                      <tr key={f._id}>
                        <td><StatusBadge status={f.followUpType} /></td>
                        <td className="fw-medium">{f.subject}</td>
                        <td>{f.customerId?.customerName || f.leadId?.leadName || '—'}</td>
                        <td>{formatDate(f.followUpDate)}</td>
                        <td><StatusBadge status={f.status} /></td>
                        <td className="small">{f.assignedTo?.name}</td>
                        <td className="small text-muted">{f.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* 4. Opportunity Report */}
            {activeReport === 'opportunities' && (
              <div>
                <Row className="g-2 mb-3">
                  <Col sm={4}>
                    <div className="p-2 border rounded bg-light">
                      <span className="small text-muted d-block">TOTAL DEAL VOLUME</span>
                      <strong className="fs-5">{reportData.count} Opportunities</strong>
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="p-2 border rounded bg-light">
                      <span className="small text-muted d-block">AGGREGATE AMOUNT</span>
                      <strong className="fs-5 text-primary">{formatCurrency(reportData.totalAmount)}</strong>
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="p-2 border rounded bg-light">
                      <span className="small text-muted d-block">WEIGHTED FORECAST</span>
                      <strong className="fs-5 text-success">{formatCurrency(reportData.totalWeightedAmount)}</strong>
                    </div>
                  </Col>
                </Row>

                <Table responsive hover className="table-crm align-middle">
                  <thead>
                    <tr>
                      <th>Opportunity Name</th>
                      <th>Customer</th>
                      <th>Amount (₹)</th>
                      <th>Probability</th>
                      <th>Weighted Value</th>
                      <th>Stage</th>
                      <th>Expected Close</th>
                      <th>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.opportunities.map((o) => (
                      <tr key={o._id}>
                        <td className="fw-medium">{o.opportunityName}</td>
                        <td>{o.customerId?.customerName || '—'}</td>
                        <td className="fw-bold">{formatCurrency(o.amount)}</td>
                        <td>{o.probability}%</td>
                        <td className="fw-semibold text-primary">{formatCurrency(o.weightedAmount)}</td>
                        <td><StatusBadge status={o.stage} /></td>
                        <td className="small text-muted">{formatDate(o.expectedCloseDate)}</td>
                        <td className="small">{o.assignedTo?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* 5. Sales Pipeline Report */}
            {activeReport === 'pipeline' && (
              <div>
                <h6 className="fw-bold text-secondary mb-3">Stage-Wise Pipeline Breakdown</h6>
                <Table responsive hover className="table-crm align-middle mb-4">
                  <thead>
                    <tr>
                      <th>Pipeline Stage</th>
                      <th>Deal Count</th>
                      <th>Total Pipeline Amount (₹)</th>
                      <th>Weighted Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.stageWise.map((s) => (
                      <tr key={s._id}>
                        <td><StatusBadge status={s._id} /></td>
                        <td className="fw-semibold">{s.count}</td>
                        <td className="fw-bold text-dark">{formatCurrency(s.totalAmount)}</td>
                        <td className="fw-semibold text-primary">{formatCurrency(s.weightedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <h6 className="fw-bold text-secondary mb-3">Owner-Wise Pipeline Distribution</h6>
                <Table responsive hover className="table-crm align-middle">
                  <thead>
                    <tr>
                      <th>Representative</th>
                      <th>Email</th>
                      <th>Total Assigned Deals</th>
                      <th>Won Deals</th>
                      <th>Total Amount (₹)</th>
                      <th>Weighted Forecast (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.ownerWise.map((o) => (
                      <tr key={o._id}>
                        <td className="fw-medium">{o.ownerName}</td>
                        <td className="small text-muted">{o.ownerEmail}</td>
                        <td>{o.count}</td>
                        <td className="text-success fw-bold">{o.wonCount}</td>
                        <td className="fw-bold">{formatCurrency(o.totalAmount)}</td>
                        <td className="fw-semibold text-primary">{formatCurrency(o.weightedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* 6. Conversion Report */}
            {activeReport === 'conversion' && (
              <div>
                <h6 className="fw-bold text-secondary mb-3">Sales Conversion & Win Rates</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="p-3 border shadow-sm">
                      <span className="small text-muted fw-bold d-block mb-1">LEAD CONVERSION METRICS</span>
                      <div className="display-6 fw-bold text-primary mb-2">
                        {reportData.metrics.leadConversionRate}
                      </div>
                      <div className="small text-muted">
                        Total Captured Leads: <strong>{reportData.metrics.totalLeads}</strong>
                        <br />
                        Successfully Converted: <strong>{reportData.metrics.convertedLeads}</strong>
                        <br />
                        Lost / Disqualified: <strong>{reportData.metrics.lostLeads}</strong>
                      </div>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card className="p-3 border shadow-sm">
                      <span className="small text-muted fw-bold d-block mb-1">OPPORTUNITY WIN RATE</span>
                      <div className="display-6 fw-bold text-success mb-2">
                        {reportData.metrics.oppWinRate}
                      </div>
                      <div className="small text-muted">
                        Total Deals in Pipeline: <strong>{reportData.metrics.totalOpportunities}</strong>
                        <br />
                        Deals Won: <strong>{reportData.metrics.wonOpportunities}</strong>
                        <br />
                        Deals Lost: <strong>{reportData.metrics.lostOpportunities}</strong>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}

            {/* 7. User Activity Report */}
            {activeReport === 'user-activity' && reportData.userActivities && (
              <div>
                <h6 className="fw-bold text-secondary mb-3">Representative Touchpoint Activity Counts</h6>
                <Table responsive hover className="table-crm align-middle">
                  <thead>
                    <tr>
                      <th>Sales Representative</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Activity Type</th>
                      <th>Action Volume Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.userActivities.map((act, idx) => (
                      <tr key={idx}>
                        <td className="fw-medium">{act.userName}</td>
                        <td className="small text-muted">{act.userEmail}</td>
                        <td><Badge bg="secondary">{act.userRole}</Badge></td>
                        <td><StatusBadge status={act.activityType} /></td>
                        <td className="fw-bold text-primary">{act.count} logged</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {/* 8. Audit Report */}
            {activeReport === 'audit' && reportData.auditLogs && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0">System Audit Trail Snapshot</h6>
                  <span className="badge bg-light text-dark border">Recent Entries: {reportData.count}</span>
                </div>
                <Table responsive hover className="table-crm align-middle">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Module</th>
                      <th>Result</th>
                      <th>Operational Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.auditLogs.map((a) => (
                      <tr key={a._id}>
                        <td className="small text-muted">{formatDateTime(a.timestamp)}</td>
                        <td className="small fw-medium">{a.userId?.name || 'System'}</td>
                        <td><Badge bg="info">{a.action}</Badge></td>
                        <td><span className="badge bg-light text-dark border">{a.entityName}</span></td>
                        <td><StatusBadge status={a.result} /></td>
                        <td className="small text-dark">{a.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsHub;
