import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { leadService } from '../../services/leadService';
import { followUpService } from '../../services/followUpService';
import { activityService } from '../../services/activityService';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import LeadConvertModal from './LeadConvertModal';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import {
  BsArrowLeft,
  BsBuildings,
  BsEnvelope,
  BsTelephone,
  BsPersonBadge,
  BsArrowRightCircle,
  BsCalendarPlus,
  BsCheckCircle,
  BsXCircle,
  BsPlusCircle,
} from 'react-icons/bs';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  // Conversion Modal state
  const [showConvertModal, setShowConvertModal] = useState(false);

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
    loadLeadDetails();
  }, [id]);

  const loadLeadDetails = async () => {
    try {
      setLoading(true);
      const res = await leadService.getById(id);
      if (res.success) {
        setLead(res.data.lead);
        setFollowUps(res.data.followUps);
        setActivities(res.data.activities);
      }
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await leadService.update(lead._id, { status: newStatus });
      setServerMessage({ type: 'success', text: `Lead status updated to ${newStatus}.` });
      loadLeadDetails();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    }
  };

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    try {
      await followUpService.create({
        ...followUpForm,
        leadId: lead._id,
        assignedTo: lead.assignedTo._id,
      });
      setShowFollowUpModal(false);
      setFollowUpForm({ subject: '', followUpType: 'Call', followUpDate: '', remarks: '' });
      setServerMessage({ type: 'success', text: 'Follow-up scheduled.' });
      loadLeadDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await activityService.create({
        ...activityForm,
        leadId: lead._id,
        assignedTo: lead.assignedTo._id,
      });
      setShowActivityModal(false);
      setActivityForm({ subject: '', activityType: 'Call', description: '' });
      setServerMessage({ type: 'success', text: 'Activity recorded.' });
      loadLeadDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading lead details..." />;
  }

  if (!lead) {
    return (
      <div className="text-center py-5">
        <h5>Lead not found.</h5>
        <Button variant="primary" onClick={() => navigate('/leads')}>
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={lead.leadName}
        subtitle={`Lead Code: ${lead.leadCode} • Source: ${lead.source} • Priority: ${lead.priority}`}
      >
        <Button variant="outline-secondary" onClick={() => navigate('/leads')} className="d-flex align-items-center gap-1">
          <BsArrowLeft /> Back to Leads
        </Button>

        {lead.status === 'Qualified' && (
          <Button variant="success" onClick={() => setShowConvertModal(true)} className="d-flex align-items-center gap-1">
            <BsArrowRightCircle /> Convert to Customer
          </Button>
        )}

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

      {/* Status Workflow Action Bar */}
      {lead.status !== 'Converted' && (
        <Card className="card-crm p-3 mb-4 bg-light border-0">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <span className="small text-muted fw-bold d-block">LIFECYCLE STATUS TRANSITION</span>
              <span className="small">Current Status: <StatusBadge status={lead.status} /></span>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              {lead.status === 'New' && (
                <Button size="sm" variant="info" className="text-white" onClick={() => handleUpdateStatus('Contacted')}>
                  <BsCheckCircle className="me-1" /> Advance to Contacted
                </Button>
              )}

              {lead.status === 'Contacted' && (
                <>
                  <Button size="sm" variant="success" onClick={() => handleUpdateStatus('Qualified')}>
                    <BsCheckCircle className="me-1" /> Mark Qualified
                  </Button>
                  <Button size="sm" variant="warning" onClick={() => handleUpdateStatus('Unqualified')}>
                    <BsXCircle className="me-1" /> Mark Unqualified
                  </Button>
                </>
              )}

              {lead.status === 'Unqualified' && (
                <Button size="sm" variant="outline-info" onClick={() => handleUpdateStatus('Contacted')}>
                  Re-contact Lead
                </Button>
              )}

              {lead.status !== 'Lost' && (
                <Button size="sm" variant="outline-danger" onClick={() => handleUpdateStatus('Lost')}>
                  Mark Lost
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Lead Details Info */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <Card className="card-crm p-3 h-100">
            <h6 className="fw-bold text-secondary mb-3">Prospect Information</h6>
            <Row className="g-3">
              <Col sm={6}>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <BsBuildings /> Company Name
                </div>
                <div className="fw-semibold">{lead.companyName || '—'}</div>
              </Col>
              <Col sm={6}>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <BsEnvelope /> Email Address
                </div>
                <div>{lead.email}</div>
              </Col>
              <Col sm={6}>
                <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                  <BsTelephone /> Phone Number
                </div>
                <div>{lead.phone}</div>
              </Col>
              <Col sm={6}>
                <div className="text-muted small mb-1">Expected Deal Value</div>
                <div className="fw-bold text-primary fs-5">{formatCurrency(lead.expectedValue)}</div>
              </Col>
              {lead.notes && (
                <Col sm={12}>
                  <div className="text-muted small mb-1">Lead Notes & Context</div>
                  <div className="p-2 bg-light rounded small">{lead.notes}</div>
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="card-crm p-3 h-100">
            <h6 className="fw-bold text-secondary mb-3">Assignment & Metadata</h6>
            <div className="mb-2">
              <span className="text-muted small d-block">Lead Status</span>
              <StatusBadge status={lead.status} />
            </div>
            <div className="mb-2">
              <span className="text-muted small d-block">Lead Priority</span>
              <StatusBadge status={lead.priority} />
            </div>
            <div className="mb-2">
              <span className="text-muted small d-block">Assigned Representative</span>
              <div className="fw-semibold d-flex align-items-center gap-1">
                <BsPersonBadge className="text-primary" /> {lead.assignedTo?.name || 'Unassigned'}
              </div>
            </div>
            <div className="mb-2">
              <span className="text-muted small d-block">Captured On</span>
              <div className="small text-muted">{formatDateTime(lead.createdAt)}</div>
            </div>

            {lead.convertedCustomerId && (
              <div className="mt-3 p-2 border border-success bg-success bg-opacity-10 rounded small">
                <strong className="text-success d-block">Converted Account</strong>
                <NavLink to={`/customers/${lead.convertedCustomerId._id}`} className="fw-bold text-decoration-none">
                  {lead.convertedCustomerId.customerName} ({lead.convertedCustomerId.customerCode})
                </NavLink>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Follow-Ups & Activities */}
      <Row className="g-3">
        <Col md={6}>
          <Card className="card-crm p-3 h-100">
            <h6 className="fw-bold text-secondary mb-3">Scheduled Follow-Ups</h6>
            {followUps.length === 0 ? (
              <div className="text-muted small text-center py-4">No follow-ups scheduled for this lead.</div>
            ) : (
              <Table responsive hover size="sm" className="align-middle">
                <thead>
                  <tr className="small text-muted">
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((fu) => (
                    <tr key={fu._id}>
                      <td><StatusBadge status={fu.followUpType} /></td>
                      <td className="fw-medium">{fu.subject}</td>
                      <td className="small">{formatDate(fu.followUpDate)}</td>
                      <td><StatusBadge status={fu.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Col>

        <Col md={6}>
          <Card className="card-crm p-3 h-100">
            <h6 className="fw-bold text-secondary mb-3">Recorded Activities</h6>
            {activities.length === 0 ? (
              <div className="text-muted small text-center py-4">No interaction activities logged yet.</div>
            ) : (
              <Table responsive hover size="sm" className="align-middle">
                <thead>
                  <tr className="small text-muted">
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Logged Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act) => (
                    <tr key={act._id}>
                      <td><StatusBadge status={act.activityType} /></td>
                      <td className="fw-medium">{act.subject}</td>
                      <td className="small text-muted">{formatDate(act.activityDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Col>
      </Row>

      {/* Conversion Modal */}
      <LeadConvertModal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        lead={lead}
        onConverted={() => {
          setServerMessage({ type: 'success', text: 'Lead converted successfully!' });
          loadLeadDetails();
        }}
      />

      {/* Schedule Follow-Up Modal */}
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
                placeholder="Product demo call"
              />
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Type</Form.Label>
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
                  <Form.Label className="small fw-semibold">Follow-Up Date *</Form.Label>
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
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowFollowUpModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Schedule</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Log Activity Modal */}
      <Modal show={showActivityModal} onHide={() => setShowActivityModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Log Interaction Activity</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateActivity}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Subject *</Form.Label>
              <Form.Control
                type="text"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                required
                placeholder="Discovery inquiry call"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Type</Form.Label>
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
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowActivityModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Log</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadDetail;
