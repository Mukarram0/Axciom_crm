import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { activityService } from '../../services/activityService';
import { customerService } from '../../services/customerService';
import { leadService } from '../../services/leadService';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatDateTime } from '../../utils/formatters';
import { BsPlusLg, BsListCheck, BsTrash } from 'react-icons/bs';

const ActivityList = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [activities, setActivities] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State for Log Activity
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    subject: '',
    activityType: 'Call',
    contactType: 'customer',
    customerId: '',
    leadId: '',
    description: '',
    status: 'Completed',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, subject: '' });

  useEffect(() => {
    loadActivities();
  }, [currentPage, typeFilter]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await activityService.getAll({
        page: currentPage,
        limit: 10,
        activityType: typeFilter,
      });
      if (res.success) {
        setActivities(res.data.activities);
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
      const [custRes, leadRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        leadService.getAll({ limit: 100 }),
      ]);
      if (custRes.success) setCustomersList(custRes.data.customers);
      if (leadRes.success) setLeadsList(leadRes.data.leads);
    } catch (err) {
      console.warn('Metadata error:', err);
    }
  };

  const handleOpenCreate = () => {
    setModalForm({
      subject: '',
      activityType: 'Call',
      contactType: 'customer',
      customerId: customersList[0]?._id || '',
      leadId: '',
      description: '',
      status: 'Completed',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateModalForm = () => {
    const errors = {};
    if (!modalForm.subject.trim()) {
      errors.subject = 'Subject is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        subject: modalForm.subject,
        activityType: modalForm.activityType,
        description: modalForm.description,
        status: modalForm.status,
        assignedTo: user._id,
      };
      if (modalForm.contactType === 'customer') payload.customerId = modalForm.customerId;
      if (modalForm.contactType === 'lead') payload.leadId = modalForm.leadId;

      await activityService.create(payload);
      setServerMessage({ type: 'success', text: 'Activity logged successfully.' });
      setShowModal(false);
      loadActivities();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await activityService.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null, subject: '' });
      setServerMessage({ type: 'success', text: 'Activity log entry removed.' });
      loadActivities();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
      setDeleteModal({ show: false, id: null, subject: '' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Activity Log & Communications"
        subtitle="Chronological audit of calls, meetings, emails, and sales touchpoints"
      >
        <Button variant="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-2">
          <BsPlusLg /> Log Activity
        </Button>
      </PageHeader>

      <AlertMessage
        variant={serverMessage.type}
        message={serverMessage.text}
        onClose={() => setServerMessage({ type: '', text: '' })}
      />

      <Card className="card-crm p-3">
        {/* Type Filter */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-secondary mb-0">Recorded Sales Touchpoints</h6>
          <Form.Select
            size="sm"
            style={{ width: '150px' }}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All Activity Types</option>
            <option value="Call">Calls</option>
            <option value="Meeting">Meetings</option>
            <option value="Email">Emails</option>
            <option value="Task">Tasks</option>
          </Form.Select>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading activity history..." />
        ) : activities.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BsListCheck className="fs-1 mb-2 text-secondary" />
            <p className="mb-0">No activities recorded matching criteria.</p>
          </div>
        ) : (
          <Table responsive hover className="table-crm align-middle">
            <thead>
              <tr>
                <th>Type</th>
                <th>Subject</th>
                <th>Associated Entity</th>
                <th>Recorded By</th>
                <th>Timestamp</th>
                <th>Description</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act._id}>
                  <td>
                    <StatusBadge status={act.activityType} />
                  </td>
                  <td>
                    <span className="fw-semibold text-dark">{act.subject}</span>
                  </td>
                  <td>
                    {act.customerId ? (
                      <span className="small text-primary">{act.customerId.customerName}</span>
                    ) : act.leadId ? (
                      <span className="small text-info">{act.leadId.leadName}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="small">{act.assignedTo?.name}</td>
                  <td className="small text-muted">{formatDateTime(act.activityDate)}</td>
                  <td className="small text-muted text-truncate" style={{ maxWidth: '240px' }}>
                    {act.description || '—'}
                  </td>
                  <td className="text-end">
                    {(isAdmin || isManager) && (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => setDeleteModal({ show: true, id: act._id, subject: act.subject })}
                        title="Delete"
                      >
                        <BsTrash />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {/* Modal: Log Activity */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Log Communication Activity</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveActivity} noValidate>
          <Modal.Body>
            {formErrors.general && <div className="alert alert-danger py-2 small">{formErrors.general}</div>}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Activity Subject *</Form.Label>
              <Form.Control
                type="text"
                value={modalForm.subject}
                onChange={(e) => setModalForm({ ...modalForm, subject: e.target.value })}
                isInvalid={!!formErrors.subject}
                placeholder="e.g. Inbound inquiry phone call"
              />
              <Form.Control.Feedback type="invalid">{formErrors.subject}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Activity Type</Form.Label>
              <Form.Select
                value={modalForm.activityType}
                onChange={(e) => setModalForm({ ...modalForm, activityType: e.target.value })}
              >
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
                <option value="Email">Email</option>
                <option value="Task">Task</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Link Activity To</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="act-customer"
                  name="contactType"
                  label="Customer Account"
                  checked={modalForm.contactType === 'customer'}
                  onChange={() => setModalForm({ ...modalForm, contactType: 'customer', leadId: '' })}
                />
                <Form.Check
                  type="radio"
                  id="act-lead"
                  name="contactType"
                  label="Prospective Lead"
                  checked={modalForm.contactType === 'lead'}
                  onChange={() => setModalForm({ ...modalForm, contactType: 'lead', customerId: '' })}
                />
              </div>
            </Form.Group>

            {modalForm.contactType === 'customer' ? (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Select Customer</Form.Label>
                <Form.Select
                  value={modalForm.customerId}
                  onChange={(e) => setModalForm({ ...modalForm, customerId: e.target.value })}
                >
                  <option value="">Select Customer...</option>
                  {customersList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.customerName} ({c.customerCode})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Select Lead</Form.Label>
                <Form.Select
                  value={modalForm.leadId}
                  onChange={(e) => setModalForm({ ...modalForm, leadId: e.target.value })}
                >
                  <option value="">Select Lead...</option>
                  {leadsList.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.leadName} ({l.leadCode})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group>
              <Form.Label className="small fw-semibold">Notes & Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={modalForm.description}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                placeholder="Interaction outcome, customer feedback..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Recording...' : 'Save Activity'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, subject: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Activity"
        message={`Are you sure you want to remove activity '${deleteModal.subject}'?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ActivityList;
