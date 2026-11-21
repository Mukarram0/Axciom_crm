import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { leadService } from '../../services/leadService';
import { userService } from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import LeadConvertModal from './LeadConvertModal';
import { validateEmail, validateIndianPhone } from '../../utils/validation';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  BsPlusLg,
  BsEye,
  BsPencilSquare,
  BsTrash,
  BsFunnel,
  BsArrowRightCircle,
} from 'react-icons/bs';

const LeadList = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [leads, setLeads] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState({
    leadName: '',
    email: '',
    phone: '',
    companyName: '',
    source: 'Website',
    status: 'New',
    priority: 'Medium',
    expectedValue: '',
    assignedTo: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  // Lead Conversion Modal state
  const [convertModal, setConvertModal] = useState({ show: false, lead: null });

  useEffect(() => {
    loadLeads();
    if (isAdmin || isManager) {
      loadAssignableUsers();
    }
  }, [currentPage, search, statusFilter, priorityFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await leadService.getAll({
        page: currentPage,
        limit: 10,
        search,
        status: statusFilter,
        priority: priorityFilter,
      });
      if (res.success) {
        setLeads(res.data.leads);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignableUsers = async () => {
    try {
      const res = await userService.getAll();
      if (res.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      console.warn('Could not load users for lead assignment');
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setModalForm({
      leadName: '',
      email: '',
      phone: '',
      companyName: '',
      source: 'Website',
      status: 'New',
      priority: 'Medium',
      expectedValue: 50000,
      assignedTo: user._id,
      notes: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (lead) => {
    setIsEditing(true);
    setEditingId(lead._id);
    setModalForm({
      leadName: lead.leadName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName || '',
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      expectedValue: lead.expectedValue,
      assignedTo: lead.assignedTo?._id || user._id,
      notes: lead.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateModalForm = () => {
    const errors = {};
    if (!modalForm.leadName.trim()) {
      errors.leadName = 'Lead Name is mandatory.';
    }

    if (!modalForm.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!validateEmail(modalForm.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!modalForm.phone.trim()) {
      errors.phone = 'Phone is required.';
    } else if (!validateIndianPhone(modalForm.phone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (modalForm.expectedValue && parseFloat(modalForm.expectedValue) < 0) {
      errors.expectedValue = 'Expected value cannot be negative.';
    }

    if (!modalForm.assignedTo) {
      errors.assignedTo = 'Lead must be assigned to an authorized rep.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await leadService.update(editingId, modalForm);
        setServerMessage({ type: 'success', text: 'Lead updated successfully.' });
      } else {
        await leadService.create(modalForm);
        setServerMessage({ type: 'success', text: 'Lead created successfully.' });
      }
      setShowModal(false);
      loadLeads();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await leadService.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null, name: '' });
      setServerMessage({ type: 'success', text: 'Lead removed successfully.' });
      loadLeads();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
      setDeleteModal({ show: false, id: null, name: '' });
    }
  };

  const handleLeadConvertedCallback = (resultData) => {
    setServerMessage({
      type: 'success',
      text: `Lead converted successfully into customer '${resultData.customer.customerName}'!`,
    });
    loadLeads();
  };

  return (
    <div>
      <PageHeader
        title="Lead Pipeline"
        subtitle="Capture prospects, advance qualification status, and convert into paying customers"
      >
        <Button variant="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-2">
          <BsPlusLg /> Add Lead
        </Button>
      </PageHeader>

      <AlertMessage
        variant={serverMessage.type}
        message={serverMessage.text}
        onClose={() => setServerMessage({ type: '', text: '' })}
      />

      <Card className="card-crm p-3">
        {/* Search and Filters */}
        <Row className="g-2 mb-3 justify-content-between align-items-center">
          <Col xs={12} md={5}>
            <SearchBar onSearch={setSearch} placeholder="Search by name, lead code, email, company..." />
          </Col>
          <Col xs={12} md={5} className="d-flex gap-2 justify-content-md-end flex-wrap">
            <Form.Select
              size="sm"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </Form.Select>

            <Form.Select
              size="sm"
              style={{ width: '140px' }}
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </Form.Select>
          </Col>
        </Row>

        {loading ? (
          <LoadingSpinner text="Loading leads..." />
        ) : leads.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BsFunnel className="fs-1 mb-2 text-secondary" />
            <p className="mb-0">No lead records found matching the criteria.</p>
          </div>
        ) : (
          <Table responsive hover className="table-crm align-middle">
            <thead>
              <tr>
                <th>Code</th>
                <th>Lead Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Expected Value</th>
                <th>Assigned Rep</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l._id}>
                  <td>
                    <span className="badge bg-light text-dark border fw-bold">{l.leadCode}</span>
                  </td>
                  <td>
                    <NavLink to={`/leads/${l._id}`} className="fw-semibold text-decoration-none">
                      {l.leadName}
                    </NavLink>
                  </td>
                  <td className="text-secondary">{l.companyName || '—'}</td>
                  <td>
                    <div className="small">{l.email}</div>
                    <div className="small text-muted">{l.phone}</div>
                  </td>
                  <td>
                    <StatusBadge status={l.status} />
                  </td>
                  <td>
                    <StatusBadge status={l.priority} />
                  </td>
                  <td className="fw-semibold">{formatCurrency(l.expectedValue)}</td>
                  <td className="small">{l.assignedTo?.name || 'Unassigned'}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {/* Convert Button active only for Qualified unconverted leads */}
                      {l.status === 'Qualified' && (
                        <Button
                          variant="outline-success"
                          onClick={() => setConvertModal({ show: true, lead: l })}
                          title="Convert to Customer"
                        >
                          <BsArrowRightCircle /> Convert
                        </Button>
                      )}
                      <Button as={NavLink} to={`/leads/${l._id}`} variant="outline-secondary" title="View Details">
                        <BsEye />
                      </Button>
                      {l.status !== 'Converted' && (
                        <Button variant="outline-primary" onClick={() => handleOpenEdit(l)} title="Edit Lead">
                          <BsPencilSquare />
                        </Button>
                      )}
                      {(isAdmin || isManager) && (
                        <Button
                          variant="outline-danger"
                          onClick={() => setDeleteModal({ show: true, id: l._id, name: l.leadName })}
                          title="Delete Lead"
                        >
                          <BsTrash />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {/* Create / Edit Lead Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">{isEditing ? 'Edit Lead' : 'Add New Prospect Lead'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveLead} noValidate>
          <Modal.Body>
            {formErrors.general && <div className="alert alert-danger py-2 small">{formErrors.general}</div>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Lead Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.leadName}
                    onChange={(e) => setModalForm({ ...modalForm, leadName: e.target.value })}
                    isInvalid={!!formErrors.leadName}
                    placeholder="e.g. Ramesh Chandra"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.leadName}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.companyName}
                    onChange={(e) => setModalForm({ ...modalForm, companyName: e.target.value })}
                    placeholder="e.g. Chandra Engineering"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    isInvalid={!!formErrors.email}
                    placeholder="ramesh@company.com"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Phone Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                    isInvalid={!!formErrors.phone}
                    placeholder="10-digit Indian mobile (9811122233)"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.phone}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Lead Source</Form.Label>
                  <Form.Select
                    value={modalForm.source}
                    onChange={(e) => setModalForm({ ...modalForm, source: e.target.value })}
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Email Campaign">Email Campaign</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Priority</Form.Label>
                  <Form.Select
                    value={modalForm.priority}
                    onChange={(e) => setModalForm({ ...modalForm, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Status</Form.Label>
                  <Form.Select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Unqualified">Unqualified</option>
                    <option value="Lost">Lost</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Expected Deal Value (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={modalForm.expectedValue}
                    onChange={(e) => setModalForm({ ...modalForm, expectedValue: e.target.value })}
                    isInvalid={!!formErrors.expectedValue}
                    placeholder="50000"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.expectedValue}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              {(isAdmin || isManager) && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Assign Sales Executive *</Form.Label>
                    <Form.Select
                      value={modalForm.assignedTo}
                      onChange={(e) => setModalForm({ ...modalForm, assignedTo: e.target.value })}
                      isInvalid={!!formErrors.assignedTo}
                    >
                      <option value="">Select Representative...</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.assignedTo}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Lead Notes & Qualifications</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={modalForm.notes}
                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                    placeholder="Customer needs, pain points, timeline..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update Lead' : 'Save Lead'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Lead Conversion Modal */}
      <LeadConvertModal
        show={convertModal.show}
        onHide={() => setConvertModal({ show: false, lead: null })}
        lead={convertModal.lead}
        onConverted={handleLeadConvertedCallback}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead"
        message={`Are you sure you want to remove lead '${deleteModal.name}'?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default LeadList;
