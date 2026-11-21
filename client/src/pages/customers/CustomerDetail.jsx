import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tabs, Tab, Table, Button, Badge, Modal, Form } from 'react-bootstrap';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { followUpService } from '../../services/followUpService';
import { activityService } from '../../services/activityService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  BsArrowLeft,
  BsBuildings,
  BsEnvelope,
  BsTelephone,
  BsGeoAlt,
  BsPersonBadge,
  BsCalendarPlus,
  BsPlusCircle,
} from 'react-icons/bs';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  // Quick Action Modal states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    subject: '',
    followUpType: 'Call',
    followUpDate: '',
    remarks: '',
  });

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    subject: '',
    activityType: 'Call',
    description: '',
  });

  useEffect(() => {
    loadCustomerDetails();
  }, [id]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await customerService.getById(id);
      if (res.success) {
        setCustomer(res.data.customer);
        setOpportunities(res.data.opportunities);
        setFollowUps(res.data.followUps);
        setActivities(res.data.activities);
      }
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    try {
      await followUpService.create({
        ...followUpForm,
        customerId: customer._id,
        assignedTo: customer.assignedTo._id,
      });
      setShowFollowUpModal(false);
      setFollowUpForm({ subject: '', followUpType: 'Call', followUpDate: '', remarks: '' });
      setServerMessage({ type: 'success', text: 'Follow-up scheduled successfully.' });
      loadCustomerDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await activityService.create({
        ...activityForm,
        customerId: customer._id,
        assignedTo: customer.assignedTo._id,
      });
      setShowActivityModal(false);
      setActivityForm({ subject: '', activityType: 'Call', description: '' });
      setServerMessage({ type: 'success', text: 'Activity logged successfully.' });
      loadCustomerDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading customer profile & history..." />;
  }

  if (!customer) {
    return (
      <div className="text-center py-5">
        <h5>Customer not found or unauthorized.</h5>
        <Button variant="primary" onClick={() => navigate('/customers')}>
          Return to Customers
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={customer.customerName}
        subtitle={`Account Code: ${customer.customerCode} • Status: ${customer.status}`}
      >
        <Button variant="outline-secondary" onClick={() => navigate('/customers')} className="d-flex align-items-center gap-1">
          <BsArrowLeft /> Back to Directory
        </Button>
        <Button variant="outline-primary" onClick={() => setShowFollowUpModal(true)} className="d-flex align-items-center gap-1">
          <BsCalendarPlus /> Schedule Follow-Up
        </Button>
        <Button variant="primary" onClick={() => setShowActivityModal(true)} className="d-flex align-items-center gap-1">
          <BsPlusCircle /> Log Activity
        </Button>
      </PageHeader>

      <AlertMessage
        variant={serverMessage.type}
        message={serverMessage.text}
        onClose={() => setServerMessage({ type: '', text: '' })}
      />

      {/* Customer Master Info Cards */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <Card className="card-crm p-3 h-100">
            <h6 className="fw-bold text-secondary mb-3">Company & Contact Information</h6>
            <Row className="g-3">
              <Col sm={6}>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <BsBuildings /> Company Name
                </div>
                <div className="fw-semibold">{customer.companyName || '—'}</div>
              </Col>
              <Col sm={6}>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <BsEnvelope /> Email Address
                </div>
                <div>{customer.email}</div>
              </Col>
              <Col sm={6}>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <BsTelephone /> Phone Number
                </div>
                <div>{customer.phone}</div>
              </Col>
              <Col sm={6}>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <BsGeoAlt /> Location
                </div>
                <div>
                  {[customer.address, customer.city, customer.state].filter(Boolean).join(', ') || '—'}
                </div>
              </Col>
              {customer.notes && (
                <Col sm={12}>
                  <div className="text-muted small mb-1">Account Notes</div>
                  <div className="p-2 bg-light rounded small">{customer.notes}</div>
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-crm p-3 h-100">
            <h6 className="fw-bold text-secondary mb-3">Account Administration</h6>
            <div className="mb-3">
              <span className="text-muted small d-block">Account Status</span>
              <StatusBadge status={customer.status} />
            </div>
            <div className="mb-3">
              <span className="text-muted small d-block">Assigned Representative</span>
              <div className="fw-semibold d-flex align-items-center gap-1">
                <BsPersonBadge className="text-primary" /> {customer.assignedTo?.name || 'Unassigned'}
              </div>
              <div className="text-muted small">{customer.assignedTo?.email}</div>
            </div>
            <div className="mb-2">
              <span className="text-muted small d-block">Created On</span>
              <div className="small">{formatDateTime(customer.createdAt)}</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tabbed History Section: Opportunities, Follow-Ups, Activities */}
      <Card className="card-crm p-3">
        <Tabs defaultActiveKey="opportunities" id="customer-history-tabs" className="mb-3">
          {/* Tab 1: Opportunities */}
          <Tab eventKey="opportunities" title={`Opportunities (${opportunities.length})`}>
            {opportunities.length === 0 ? (
              <div className="text-center py-4 text-muted small">No sales opportunities created for this customer yet.</div>
            ) : (
              <Table responsive hover className="table-crm align-middle">
                <thead>
                  <tr>
                    <th>Opportunity Name</th>
                    <th>Stage</th>
                    <th>Amount</th>
                    <th>Probability</th>
                    <th>Expected Close</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr key={opp._id}>
                      <td>
                        <NavLink to={`/opportunities`} className="fw-semibold text-decoration-none">
                          {opp.opportunityName}
                        </NavLink>
                      </td>
                      <td>
                        <StatusBadge status={opp.stage} />
                      </td>
                      <td className="fw-semibold">{formatCurrency(opp.amount)}</td>
                      <td>{opp.probability}%</td>
                      <td>{formatDate(opp.expectedCloseDate)}</td>
                      <td>
                        <StatusBadge status={opp.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Tab>

          {/* Tab 2: Follow-Ups */}
          <Tab eventKey="followups" title={`Follow-Ups (${followUps.length})`}>
            {followUps.length === 0 ? (
              <div className="text-center py-4 text-muted small">No scheduled follow-ups for this customer.</div>
            ) : (
              <Table responsive hover className="table-crm align-middle">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((fu) => (
                    <tr key={fu._id}>
                      <td>
                        <StatusBadge status={fu.followUpType} />
                      </td>
                      <td className="fw-medium">{fu.subject}</td>
                      <td>{formatDate(fu.followUpDate)}</td>
                      <td>
                        <StatusBadge status={fu.status} />
                      </td>
                      <td className="small">{fu.assignedTo?.name}</td>
                      <td className="text-muted small">{fu.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Tab>

          {/* Tab 3: Activities */}
          <Tab eventKey="activities" title={`Activities Log (${activities.length})`}>
            {activities.length === 0 ? (
              <div className="text-center py-4 text-muted small">No customer interaction activities recorded.</div>
            ) : (
              <Table responsive hover className="table-crm align-middle">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Description</th>
                    <th>Logged By</th>
                    <th>Activity Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act) => (
                    <tr key={act._id}>
                      <td>
                        <StatusBadge status={act.activityType} />
                      </td>
                      <td className="fw-medium">{act.subject}</td>
                      <td className="text-secondary small">{act.description || '—'}</td>
                      <td className="small">{act.assignedTo?.name}</td>
                      <td className="small text-muted">{formatDateTime(act.activityDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Tab>
        </Tabs>
      </Card>

      {/* Modal: Schedule Follow-Up */}
      <Modal show={showFollowUpModal} onHide={() => setShowFollowUpModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Schedule Follow-Up</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateFollowUp}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Subject *</Form.Label>
              <Form.Control
                type="text"
                value={followUpForm.subject}
                onChange={(e) => setFollowUpForm({ ...followUpForm, subject: e.target.value })}
                required
                placeholder="e.g. Contract Clarification Call"
              />
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Follow-Up Type</Form.Label>
                  <Form.Select
                    value={followUpForm.followUpType}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, followUpType: e.target.value })}
                  >
                    <option value="Call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Email">Email</option>
                    <option value="Task">Task</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Date & Time *</Form.Label>
                  <Form.Control
                    type="date"
                    value={followUpForm.followUpDate}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="small fw-semibold">Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={followUpForm.remarks}
                onChange={(e) => setFollowUpForm({ ...followUpForm, remarks: e.target.value })}
                placeholder="Objectives or agenda..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowFollowUpModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Follow-Up
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal: Log Activity */}
      <Modal show={showActivityModal} onHide={() => setShowActivityModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Log Interaction Activity</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateActivity}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Activity Subject *</Form.Label>
              <Form.Control
                type="text"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                required
                placeholder="e.g. Pricing negotiation phone call"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Activity Type</Form.Label>
              <Form.Select
                value={activityForm.activityType}
                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
              >
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Task">Task</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Details of the interaction, client feedback, next steps..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowActivityModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Log Activity
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerDetail;
