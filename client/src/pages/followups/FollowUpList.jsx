import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card, Nav } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { followUpService } from '../../services/followUpService';
import { customerService } from '../../services/customerService';
import { leadService } from '../../services/leadService';
import { userService } from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatDate } from '../../utils/formatters';
import {
  BsPlusLg,
  BsCheckCircle,
  BsCalendarCheck,
  BsClockHistory,
  BsExclamationCircle,
  BsTrash,
  BsArrowRepeat,
} from 'react-icons/bs';

const FollowUpList = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [followUps, setFollowUps] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'upcoming' | 'overdue'
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State for Create / Reschedule
  const [showModal, setShowModal] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  const [modalForm, setModalForm] = useState({
    subject: '',
    followUpType: 'Call',
    followUpDate: '',
    contactType: 'customer', // 'customer' | 'lead'
    customerId: '',
    leadId: '',
    remarks: '',
    assignedTo: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, subject: '' });

  useEffect(() => {
    loadFollowUps();
  }, [currentPage, filterMode, typeFilter, statusFilter]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        type: typeFilter,
        status: statusFilter,
      };
      if (filterMode !== 'all') {
        params.filterMode = filterMode;
      }

      const res = await followUpService.getAll(params);
      if (res.success) {
        setFollowUps(res.data.followUps);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [custRes, leadRes, userRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        leadService.getAll({ limit: 100 }),
        userService.getAll(),
      ]);
      if (custRes.success) setCustomersList(custRes.data.customers);
      if (leadRes.success) setLeadsList(leadRes.data.leads);
      if (userRes.success) setUsersList(userRes.data.users);
    } catch (err) {
      console.warn('Metadata error:', err);
    }
  };

  const handleOpenCreate = () => {
    setIsRescheduling(false);
    setSelectedFollowUp(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setModalForm({
      subject: '',
      followUpType: 'Call',
      followUpDate: tomorrow.toISOString().slice(0, 10),
      contactType: 'customer',
      customerId: customersList[0]?._id || '',
      leadId: '',
      remarks: '',
      assignedTo: user._id,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenReschedule = (fu) => {
    setIsRescheduling(true);
    setSelectedFollowUp(fu);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    setModalForm({
      subject: fu.subject,
      followUpType: fu.followUpType,
      followUpDate: futureDate.toISOString().slice(0, 10),
      contactType: fu.customerId ? 'customer' : 'lead',
      customerId: fu.customerId?._id || '',
      leadId: fu.leadId?._id || '',
      remarks: fu.remarks || '',
      assignedTo: fu.assignedTo?._id || user._id,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateModalForm = () => {
    const errors = {};
    if (!modalForm.subject.trim()) {
      errors.subject = 'Subject is required.';
    }

    if (!modalForm.followUpDate) {
      errors.followUpDate = 'Follow-up date is required.';
    } else {
      const dateVal = new Date(modalForm.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateVal < today) {
        errors.followUpDate = 'Follow-up date cannot be earlier than today.';
      }
    }

    if (!isRescheduling && modalForm.contactType === 'customer' && !modalForm.customerId) {
      errors.customerId = 'Customer reference is required.';
    }
    if (!isRescheduling && modalForm.contactType === 'lead' && !modalForm.leadId) {
      errors.leadId = 'Lead reference is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    setSubmitting(true);
    try {
      if (isRescheduling) {
        await followUpService.update(selectedFollowUp._id, {
          followUpDate: modalForm.followUpDate,
          remarks: modalForm.remarks,
          status: 'Planned',
        });
        setServerMessage({ type: 'success', text: 'Follow-up rescheduled successfully.' });
      } else {
        const payload = {
          subject: modalForm.subject,
          followUpType: modalForm.followUpType,
          followUpDate: modalForm.followUpDate,
          remarks: modalForm.remarks,
          assignedTo: modalForm.assignedTo || user._id,
        };
        if (modalForm.contactType === 'customer') payload.customerId = modalForm.customerId;
        if (modalForm.contactType === 'lead') payload.leadId = modalForm.leadId;

        await followUpService.create(payload);
        setServerMessage({ type: 'success', text: 'Follow-up scheduled successfully.' });
      }
      setShowModal(false);
      loadFollowUps();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkStatus = async (fuId, newStatus) => {
    try {
      await followUpService.update(fuId, { status: newStatus });
      setServerMessage({ type: 'success', text: `Follow-up marked as ${newStatus}.` });
      loadFollowUps();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await followUpService.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null, subject: '' });
      setServerMessage({ type: 'success', text: 'Follow-up removed.' });
      loadFollowUps();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
      setDeleteModal({ show: false, id: null, subject: '' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Follow-Up Schedule & Reminders"
        subtitle="Manage customer touchpoints, meetings, calls, and follow-up activities"
      >
        <Button variant="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-2">
          <BsPlusLg /> Schedule Follow-Up
        </Button>
      </PageHeader>

      <AlertMessage
        variant={serverMessage.type}
        message={serverMessage.text}
        onClose={() => setServerMessage({ type: '', text: '' })}
      />

      <Card className="card-crm p-3">
        {/* Navigation Tabs for Upcoming / Overdue */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <Nav variant="pills" activeKey={filterMode} onSelect={(k) => setFilterMode(k)} className="bg-light p-1 rounded">
            <Nav.Item>
              <Nav.Link eventKey="all" className="py-1 px-3 small">
                All Follow-Ups
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="upcoming" className="py-1 px-3 small d-flex align-items-center gap-1">
                <BsCalendarCheck /> Upcoming Activities
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="overdue" className="py-1 px-3 small d-flex align-items-center gap-1 text-danger">
                <BsExclamationCircle /> Overdue
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <div className="d-flex gap-2">
            <Form.Select
              size="sm"
              style={{ width: '130px' }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Email">Email</option>
              <option value="Task">Task</option>
            </Form.Select>

            <Form.Select
              size="sm"
              style={{ width: '140px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
              <option value="Cancelled">Cancelled</option>
            </Form.Select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading follow-up schedule..." />
        ) : followUps.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BsClockHistory className="fs-1 mb-2 text-secondary" />
            <p className="mb-0">No follow-up items found for this filter.</p>
          </div>
        ) : (
          <Table responsive hover className="table-crm align-middle">
            <thead>
              <tr>
                <th>Type</th>
                <th>Subject</th>
                <th>Associated Entity</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Assigned Rep</th>
                <th>Remarks</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((fu) => {
                const isOverdue = fu.status === 'Planned' && new Date(fu.followUpDate) < new Date();

                return (
                  <tr key={fu._id} className={isOverdue ? 'table-warning' : ''}>
                    <td>
                      <StatusBadge status={fu.followUpType} />
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{fu.subject}</span>
                    </td>
                    <td>
                      {fu.customerId ? (
                        <div>
                          <span className="small text-muted d-block">Customer</span>
                          <span className="fw-medium">{fu.customerId.customerName}</span>
                        </div>
                      ) : fu.leadId ? (
                        <div>
                          <span className="small text-muted d-block">Lead</span>
                          <span className="fw-medium">{fu.leadId.leadName}</span>
                        </div>
                      ) : fu.opportunityId ? (
                        <div>
                          <span className="small text-muted d-block">Opportunity</span>
                          <span className="fw-medium">{fu.opportunityId.opportunityName}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className={isOverdue ? 'text-danger fw-bold' : ''}>{formatDate(fu.followUpDate)}</div>
                      {isOverdue && <span className="badge bg-danger">Overdue</span>}
                    </td>
                    <td>
                      <StatusBadge status={fu.status} />
                    </td>
                    <td className="small">{fu.assignedTo?.name}</td>
                    <td className="small text-muted text-truncate" style={{ maxWidth: '180px' }}>
                      {fu.remarks || '—'}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {fu.status === 'Planned' && (
                          <>
                            <Button
                              variant="outline-success"
                              onClick={() => handleMarkStatus(fu._id, 'Completed')}
                              title="Mark Completed"
                            >
                              <BsCheckCircle />
                            </Button>
                            <Button
                              variant="outline-primary"
                              onClick={() => handleOpenReschedule(fu)}
                              title="Reschedule"
                            >
                              <BsArrowRepeat />
                            </Button>
                            <Button
                              variant="outline-warning"
                              onClick={() => handleMarkStatus(fu._id, 'Missed')}
                              title="Mark Missed"
                            >
                              <BsClockHistory />
                            </Button>
                          </>
                        )}
                        {(isAdmin || isManager) && (
                          <Button
                            variant="outline-danger"
                            onClick={() => setDeleteModal({ show: true, id: fu._id, subject: fu.subject })}
                            title="Delete"
                          >
                            <BsTrash />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {/* Create / Reschedule Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">{isRescheduling ? 'Reschedule Follow-Up' : 'Schedule New Follow-Up'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveFollowUp} noValidate>
          <Modal.Body>
            {formErrors.general && <div className="alert alert-danger py-2 small">{formErrors.general}</div>}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Subject *</Form.Label>
              <Form.Control
                type="text"
                value={modalForm.subject}
                onChange={(e) => setModalForm({ ...modalForm, subject: e.target.value })}
                isInvalid={!!formErrors.subject}
                disabled={isRescheduling}
                placeholder="e.g. Contract Clarification Call"
              />
              <Form.Control.Feedback type="invalid">{formErrors.subject}</Form.Control.Feedback>
            </Form.Group>

            <Row className="g-2 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Type</Form.Label>
                  <Form.Select
                    value={modalForm.followUpType}
                    onChange={(e) => setModalForm({ ...modalForm, followUpType: e.target.value })}
                    disabled={isRescheduling}
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
                  <Form.Label className="small fw-semibold">Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={modalForm.followUpDate}
                    onChange={(e) => setModalForm({ ...modalForm, followUpDate: e.target.value })}
                    isInvalid={!!formErrors.followUpDate}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.followUpDate}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {!isRescheduling && (
              <>
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-semibold">Link Activity To</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="link-customer"
                      name="contactType"
                      label="Customer Account"
                      checked={modalForm.contactType === 'customer'}
                      onChange={() => setModalForm({ ...modalForm, contactType: 'customer', leadId: '' })}
                    />
                    <Form.Check
                      type="radio"
                      id="link-lead"
                      name="contactType"
                      label="Prospective Lead"
                      checked={modalForm.contactType === 'lead'}
                      onChange={() => setModalForm({ ...modalForm, contactType: 'lead', customerId: '' })}
                    />
                  </div>
                </Form.Group>

                {modalForm.contactType === 'customer' ? (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Select Customer *</Form.Label>
                    <Form.Select
                      value={modalForm.customerId}
                      onChange={(e) => setModalForm({ ...modalForm, customerId: e.target.value })}
                      isInvalid={!!formErrors.customerId}
                    >
                      <option value="">Select Customer...</option>
                      {customersList.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.customerName} ({c.customerCode})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.customerId}</Form.Control.Feedback>
                  </Form.Group>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Select Lead *</Form.Label>
                    <Form.Select
                      value={modalForm.leadId}
                      onChange={(e) => setModalForm({ ...modalForm, leadId: e.target.value })}
                      isInvalid={!!formErrors.leadId}
                    >
                      <option value="">Select Lead...</option>
                      {leadsList.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.leadName} ({l.leadCode})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.leadId}</Form.Control.Feedback>
                  </Form.Group>
                )}

                {(isAdmin || isManager) && (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-semibold">Assigned Representative</Form.Label>
                    <Form.Select
                      value={modalForm.assignedTo}
                      onChange={(e) => setModalForm({ ...modalForm, assignedTo: e.target.value })}
                    >
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
              </>
            )}

            <Form.Group>
              <Form.Label className="small fw-semibold">Remarks & Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={modalForm.remarks}
                onChange={(e) => setModalForm({ ...modalForm, remarks: e.target.value })}
                placeholder="Reason for call, reschedule justification..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isRescheduling ? 'Confirm Reschedule' : 'Save Follow-Up'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, subject: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Follow-Up"
        message={`Are you sure you want to remove follow-up '${deleteModal.subject}'?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default FollowUpList;
