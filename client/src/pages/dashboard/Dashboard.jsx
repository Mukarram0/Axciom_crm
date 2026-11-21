import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  BsPeople,
  BsFunnel,
  BsBriefcase,
  BsCheckCircle,
  BsXCircle,
  BsCurrencyRupee,
  BsClockHistory,
  BsFilter,
  BsCalendarCheck,
} from 'react-icons/bs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    totalLeads: 0,
    openLeads: 0,
    totalOpportunities: 0,
    openOpportunities: 0,
    wonOpportunities: 0,
    lostOpportunities: 0,
    totalPipelineValue: 0,
    weightedPipelineValue: 0,
  });

  const [charts, setCharts] = useState(null);
  const [widgets, setWidgets] = useState({ upcomingFollowUps: [], recentActivities: [] });

  useEffect(() => {
    loadDashboardData();
  }, [dateFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFilter !== 'all') {
        params.dateFilter = dateFilter;
        if (dateFilter === 'custom') {
          params.startDate = customStart;
          params.endDate = customEnd;
        }
      }

      const [summaryRes, chartsRes] = await Promise.all([
        dashboardService.getSummary(params),
        dashboardService.getCharts(params),
      ]);

      if (summaryRes.success) {
        setKpis(summaryRes.data.kpiCards);
      }
      if (chartsRes.success) {
        setCharts(chartsRes.data.charts);
        setWidgets(chartsRes.data.widgets);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      loadDashboardData();
    }
  };

  // Chart data configurations
  const leadStatusChartData = charts
    ? {
        labels: charts.leadStatus.labels,
        datasets: [
          {
            data: charts.leadStatus.data,
            backgroundColor: [
              '#0d6efd', // New
              '#0dcaf0', // Contacted
              '#198754', // Qualified
              '#ffc107', // Unqualified
              '#dc3545', // Lost
              '#6f42c1', // Converted
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const pipelineChartData = charts
    ? {
        labels: charts.pipeline.labels,
        datasets: [
          {
            label: 'Total Opportunity Value (₹)',
            data: charts.pipeline.amounts,
            backgroundColor: 'rgba(13, 110, 253, 0.75)',
            borderColor: '#0d6efd',
            borderWidth: 1,
          },
        ],
      }
    : null;

  const monthlySalesChartData = charts
    ? {
        labels: charts.monthlySales.labels,
        datasets: [
          {
            label: 'Won Revenue (₹)',
            data: charts.monthlySales.data,
            fill: true,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.15)',
            tension: 0.3,
            pointRadius: 5,
          },
        ],
      }
    : null;

  return (
    <div>
      {/* Page Header with Role Greeting */}
      <PageHeader
        title={`Welcome back, ${user?.name}`}
        subtitle={`Scope: ${user?.role} Portal • Real-time operational intelligence and sales analytics`}
      >
        {/* Date Filter Bar */}
        <div className="d-flex align-items-center gap-2 bg-white p-2 rounded border shadow-sm flex-wrap">
          <span className="small text-muted fw-semibold d-flex align-items-center gap-1">
            <BsFilter /> Date Filter:
          </span>
          <Form.Select
            size="sm"
            style={{ width: '140px' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </Form.Select>

          {dateFilter === 'custom' && (
            <Form onSubmit={handleApplyCustomFilter} className="d-flex align-items-center gap-1">
              <Form.Control
                type="date"
                size="sm"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                required
              />
              <span className="text-muted small">to</span>
              <Form.Control
                type="date"
                size="sm"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                required
              />
              <Button type="submit" size="sm" variant="primary">
                Apply
              </Button>
            </Form>
          )}
        </div>
      </PageHeader>

      {loading ? (
        <LoadingSpinner text="Calculating live CRM metrics..." />
      ) : (
        <>
          {/* 8 Mandatory KPI Cards */}
          <Row className="g-3 mb-4">
            {/* Card 1: Total Customers */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-primary">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Total Customers</span>
                    <BsPeople className="text-primary fs-5" />
                  </div>
                  <div className="kpi-value">{kpis.totalCustomers}</div>
                </div>
                <div className="kpi-subtitle">Active customer accounts</div>
              </div>
            </Col>

            {/* Card 2: Total Leads */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-info">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Total Leads</span>
                    <BsFunnel className="text-info fs-5" />
                  </div>
                  <div className="kpi-value">{kpis.totalLeads}</div>
                </div>
                <div className="kpi-subtitle">Prospective opportunities</div>
              </div>
            </Col>

            {/* Card 3: Open Leads */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-warning">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Open Leads</span>
                    <BsClockHistory className="text-warning fs-5" />
                  </div>
                  <div className="kpi-value">{kpis.openLeads}</div>
                </div>
                <div className="kpi-subtitle">In active qualification</div>
              </div>
            </Col>

            {/* Card 4: Total Opportunities */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-secondary">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Total Opportunities</span>
                    <BsBriefcase className="text-secondary fs-5" />
                  </div>
                  <div className="kpi-value">{kpis.totalOpportunities}</div>
                </div>
                <div className="kpi-subtitle">All pipeline stages</div>
              </div>
            </Col>

            {/* Card 5: Open Opportunities */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-primary">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Open Deals</span>
                    <BsBriefcase className="text-primary fs-5" />
                  </div>
                  <div className="kpi-value">{kpis.openOpportunities}</div>
                </div>
                <div className="kpi-subtitle">Active negotiation & proposals</div>
              </div>
            </Col>

            {/* Card 6: Won Opportunities */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-success">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Won Deals</span>
                    <BsCheckCircle className="text-success fs-5" />
                  </div>
                  <div className="kpi-value text-success">{kpis.wonOpportunities}</div>
                </div>
                <div className="kpi-subtitle">Successfully closed revenue</div>
              </div>
            </Col>

            {/* Card 7: Lost Opportunities */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-danger">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Lost Deals</span>
                    <BsXCircle className="text-danger fs-5" />
                  </div>
                  <div className="kpi-value text-danger">{kpis.lostOpportunities}</div>
                </div>
                <div className="kpi-subtitle">Unsuccessful negotiations</div>
              </div>
            </Col>

            {/* Card 8: Total Pipeline Value */}
            <Col xs={12} sm={6} md={3}>
              <div className="kpi-card shadow-sm border-start border-4 border-success">
                <div>
                  <div className="kpi-title d-flex justify-content-between align-items-center">
                    <span>Pipeline Value</span>
                    <BsCurrencyRupee className="text-success fs-5" />
                  </div>
                  <div className="kpi-value fs-5">{formatCurrency(kpis.totalPipelineValue)}</div>
                </div>
                <div className="kpi-subtitle">
                  Weighted: <strong>{formatCurrency(kpis.weightedPipelineValue)}</strong>
                </div>
              </div>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row className="g-3 mb-4">
            {/* Chart 1: Lead Status Chart */}
            <Col xs={12} lg={4}>
              <Card className="card-crm h-100 p-3">
                <Card.Title className="fs-6 fw-bold text-secondary mb-3">Lead Status Distribution</Card.Title>
                <div style={{ height: '260px' }} className="d-flex justify-content-center align-items-center">
                  {leadStatusChartData && <Doughnut data={leadStatusChartData} options={{ maintainAspectRatio: false }} />}
                </div>
              </Card>
            </Col>

            {/* Chart 2: Opportunity Pipeline Chart */}
            <Col xs={12} lg={4}>
              <Card className="card-crm h-100 p-3">
                <Card.Title className="fs-6 fw-bold text-secondary mb-3">Pipeline Stage Value (₹)</Card.Title>
                <div style={{ height: '260px' }}>
                  {pipelineChartData && (
                    <Bar
                      data={pipelineChartData}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  )}
                </div>
              </Card>
            </Col>

            {/* Chart 3: Monthly Sales Trend */}
            <Col xs={12} lg={4}>
              <Card className="card-crm h-100 p-3">
                <Card.Title className="fs-6 fw-bold text-secondary mb-3">Monthly Closed Sales Trend</Card.Title>
                <div style={{ height: '260px' }}>
                  {monthlySalesChartData && (
                    <Line
                      data={monthlySalesChartData}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Operational Widgets Row: Upcoming Follow-ups & Recent Activities */}
          <Row className="g-3">
            <Col xs={12} lg={6}>
              <Card className="card-crm h-100 p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center gap-2">
                    <BsCalendarCheck className="text-primary" /> Upcoming Follow-Ups
                  </h6>
                  <span className="badge bg-light text-dark border">{widgets.upcomingFollowUps.length} Pending</span>
                </div>

                {widgets.upcomingFollowUps.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No upcoming follow-ups scheduled.</div>
                ) : (
                  <Table responsive hover size="sm" className="align-middle mb-0">
                    <thead>
                      <tr className="text-muted small">
                        <th>Subject</th>
                        <th>Associated Contact</th>
                        <th>Scheduled For</th>
                        <th>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {widgets.upcomingFollowUps.map((fu) => (
                        <tr key={fu._id}>
                          <td className="fw-medium">{fu.subject}</td>
                          <td>{fu.customerId?.customerName || fu.leadId?.leadName || '—'}</td>
                          <td className="small text-muted">{formatDate(fu.followUpDate)}</td>
                          <td className="small">{fu.assignedTo?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Col>

            <Col xs={12} lg={6}>
              <Card className="card-crm h-100 p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-secondary mb-0 d-flex align-items-center gap-2">
                    <BsClockHistory className="text-info" /> Recent Activities
                  </h6>
                  <span className="badge bg-light text-dark border">{widgets.recentActivities.length} Recent</span>
                </div>

                {widgets.recentActivities.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No recent customer activities recorded.</div>
                ) : (
                  <Table responsive hover size="sm" className="align-middle mb-0">
                    <thead>
                      <tr className="text-muted small">
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Associated Contact</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {widgets.recentActivities.map((act) => (
                        <tr key={act._id}>
                          <td>
                            <StatusBadge status={act.activityType} />
                          </td>
                          <td className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>
                            {act.subject}
                          </td>
                          <td>{act.customerId?.customerName || act.leadId?.leadName || '—'}</td>
                          <td className="small text-muted">{formatDateTime(act.activityDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
