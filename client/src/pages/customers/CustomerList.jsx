import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/customerService';
import { userService } from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { validateEmail, validateIndianPhone } from '../../utils/validation';
import { formatDate } from '../../utils/formatters';
import { BsPlusLg, BsEye, BsPencilSquare, BsTrash, BsPeople } from 'react-icons/bs';

const CustomerList = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    city: '',
    state: '',
    status: 'Active',
    assignedTo: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  useEffect(() => {
    loadCustomers();
    if (isAdmin || isManager) {
      loadAssignableUsers();
    }
  }, [currentPage, search, statusFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll({
        page: currentPage,
        limit: 10,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setCustomers(res.data.customers);
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
      console.warn('Could not load users for assignment');
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setModalForm({
      customerName: '',
      email: '',
      phone: '',
      companyName: '',
      address: '',
      city: '',
      state: '',
      status: 'Active',
      assignedTo: user._id,
      notes: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (customer) => {
    setIsEditing(true);
    setEditingId(customer._id);
    setModalForm({
      customerName: customer.customerName,
      email: customer.email,
      phone: customer.phone,
      companyName: customer.companyName || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      status: customer.status,
      assignedTo: customer.assignedTo?._id || user._id,
      notes: customer.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateModalForm = () => {
    const errors = {};
    if (!modalForm.customerName.trim()) {
      errors.customerName = 'Customer Name is required.';
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

    if (!modalForm.assignedTo) {
      errors.assignedTo = 'Please assign to a sales user.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await customerService.update(editingId, modalForm);
        setServerMessage({ type: 'success', text: 'Customer updated successfully.' });
      } else {
        await customerService.create(modalForm);
        setServerMessage({ type: 'success', text: 'Customer created successfully.' });
      }
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await customerService.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null, name: '' });
      setServerMessage({ type: 'success', text: 'Customer successfully deactivated.' });
      loadCustomers();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
      setDeleteModal({ show: false, id: null, name: '' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Directory"
        subtitle="Manage client master records, contact details, and account histories"
      >
        <Button variant="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-2">
          <BsPlusLg /> Add Customer
        </Button>
      </PageHeader>

      <AlertMessage
        variant={serverMessage.type}
        message={serverMessage.text}
        onClose={() => setServerMessage({ type: '', text: '' })}
      />

      <Card className="card-crm p-3">
        {/* Filters & Search Bar */}
        <Row className="g-2 mb-3 justify-content-between align-items-center">
          <Col xs={12} md={6}>
            <SearchBar onSearch={setSearch} placeholder="Search by name, code, email, company..." />
          </Col>
          <Col xs={12} md={3} className="d-flex gap-2 justify-content-md-end">
            <Form.Select
              size="sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead-Converted">Lead-Converted</option>
            </Form.Select>
          </Col>
        </Row>

        {loading ? (
          <LoadingSpinner text="Loading customers..." />
        ) : customers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BsPeople className="fs-1 mb-2 text-secondary" />
            <p className="mb-0">No customer records found matching the criteria.</p>
          </div>
        ) : (
          <Table responsive hover className="table-crm align-middle">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Assigned Rep</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <span className="badge bg-light text-dark border fw-bold">{c.customerCode}</span>
                  </td>
                  <td>
                    <NavLink to={`/customers/${c._id}`} className="fw-semibold text-decoration-none">
                      {c.customerName}
                    </NavLink>
                  </td>
                  <td className="text-secondary">{c.companyName || '—'}</td>
                  <td>
                    <div className="small">{c.email}</div>
                    <div className="small text-muted">{c.phone}</div>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="small">{c.assignedTo?.name || 'Unassigned'}</td>
                  <td className="small text-muted">{formatDate(c.createdAt)}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <Button
                        as={NavLink}
                        to={`/customers/${c._id}`}
                        variant="outline-secondary"
                        title="View Full History"
                      >
                        <BsEye />
                      </Button>
                      <Button
                        variant="outline-primary"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Customer"
                      >
                        <BsPencilSquare />
                      </Button>
                      {(isAdmin || isManager) && (
                        <Button
                          variant="outline-danger"
                          onClick={() => setDeleteModal({ show: true, id: c._id, name: c.customerName })}
                          title="Deactivate"
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

      {/* Create / Edit Customer Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">{isEditing ? 'Edit Customer' : 'Add New Customer'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveCustomer} noValidate>
          <Modal.Body>
            {formErrors.general && <div className="alert alert-danger py-2 small">{formErrors.general}</div>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Customer Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.customerName}
                    onChange={(e) => setModalForm({ ...modalForm, customerName: e.target.value })}
                    isInvalid={!!formErrors.customerName}
                    placeholder="e.g. Reliance Retail"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.customerName}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.companyName}
                    onChange={(e) => setModalForm({ ...modalForm, companyName: e.target.value })}
                    placeholder="e.g. Reliance Industries Ltd."
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
                    placeholder="contact@company.com"
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
                    placeholder="10-digit Indian mobile (9820011223)"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.phone}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.address}
                    onChange={(e) => setModalForm({ ...modalForm, address: e.target.value })}
                    placeholder="Street, Building, Floor"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">City</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.city}
                    onChange={(e) => setModalForm({ ...modalForm, city: e.target.value })}
                    placeholder="Mumbai"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">State</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.state}
                    onChange={(e) => setModalForm({ ...modalForm, state: e.target.value })}
                    placeholder="Maharashtra"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Account Status</Form.Label>
                  <Form.Select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Lead-Converted">Lead-Converted</option>
                  </Form.Select>
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
                  <Form.Label className="small fw-semibold">Notes & Background</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={modalForm.notes}
                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                    placeholder="Key account details, procurement cycle..."
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
              {submitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete / Deactivate Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Deactivate Customer"
        message={`Are you sure you want to deactivate customer '${deleteModal.name}'? Existing sales history and audit records will be retained.`}
        confirmText="Deactivate"
        confirmVariant="danger"
      />
    </div>
  );
};

export default CustomerList;
