import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { validateEmail, validatePasswordPolicy } from '../../utils/validation';
import { formatDate } from '../../utils/formatters';
import {
  BsPlusLg,
  BsShieldLock,
  BsPencilSquare,
  BsUnlock,
  BsKey,
  BsCheckCircle,
  BsXCircle,
} from 'react-icons/bs';

const UserList = () => {
  const { user: currentUser, isAdmin } = useAuth();

  const [users, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  // Modal: Create / Edit User
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Sales Executive',
    reportsTo: '',
    phone: '',
  });

  // Modal: Password Reset
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll({ search, role: roleFilter });
      if (res.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'Sales Executive',
      reportsTo: '',
      phone: '',
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleOpenEdit = (u) => {
    setIsEditing(true);
    setEditingId(u._id);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      reportsTo: u.reportsTo?._id || '',
      phone: u.phone || '',
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const validateUserForm = () => {
    const errors = {};
    if (!userForm.name.trim()) errors.name = 'Full name is required.';
    if (!userForm.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!validateEmail(userForm.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!isEditing) {
      const pwCheck = validatePasswordPolicy(userForm.password);
      if (!pwCheck.valid) errors.password = pwCheck.message;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await userService.update(editingId, userForm);
        if (userForm.role) {
          await userService.updateRole(editingId, userForm.role);
        }
        setServerMessage({ type: 'success', text: 'User details updated successfully.' });
      } else {
        await userService.create(userForm);
        setServerMessage({ type: 'success', text: 'New user created successfully.' });
      }
      setShowUserModal(false);
      loadUsers();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    try {
      await userService.updateStatus(userObj._id, !userObj.isActive);
      setServerMessage({
        type: 'success',
        text: `User ${userObj.email} ${!userObj.isActive ? 'activated' : 'deactivated'}.`,
      });
      loadUsers();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    }
  };

  const handleUnlockUser = async (userObj) => {
    try {
      await userService.unlock(userObj._id);
      setServerMessage({ type: 'success', text: `Account for ${userObj.email} unlocked successfully.` });
      loadUsers();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const pwCheck = validatePasswordPolicy(newPassword);
    if (!pwCheck.valid) {
      setFormErrors({ password: pwCheck.message });
      return;
    }

    setSubmitting(true);
    try {
      await userService.resetPassword(passwordTargetUser._id, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setServerMessage({
        type: 'success',
        text: `Password for ${passwordTargetUser.email} has been reset successfully.`,
      });
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const managersList = users.filter((u) => u.role === 'Manager' || u.role === 'Admin');

  return (
    <div>
      <PageHeader
        title="User & Access Administration"
        subtitle="Manage CRM users, role-based authorization, reporting hierarchy, and account security"
      >
        {isAdmin && (
          <Button variant="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-2">
            <BsPlusLg /> Add New User
          </Button>
        )}
      </PageHeader>

      <AlertMessage
        variant={serverMessage.type}
        message={serverMessage.text}
        onClose={() => setServerMessage({ type: '', text: '' })}
      />

      <Card className="card-crm p-3">
        {/* Filters */}
        <Row className="g-2 mb-3 justify-content-between align-items-center">
          <Col xs={12} md={6}>
            <SearchBar onSearch={setSearch} placeholder="Search by user name, email, phone..." />
          </Col>
          <Col xs={12} md={3} className="d-flex justify-content-md-end">
            <Form.Select
              size="sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Sales Executive">Sales Executive</option>
            </Form.Select>
          </Col>
        </Row>

        {loading ? (
          <LoadingSpinner text="Loading users..." />
        ) : (
          <Table responsive hover className="table-crm align-middle">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Reports To</th>
                <th>Account Status</th>
                <th>Lockout State</th>
                <th>Registered</th>
                {isAdmin && <th className="text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="fw-semibold text-dark">{u.name}</div>
                    <div className="small text-muted">{u.email}</div>
                  </td>
                  <td>
                    <Badge
                      bg={u.role === 'Admin' ? 'danger' : u.role === 'Manager' ? 'primary' : 'success'}
                      className="px-2 py-1"
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="small">{u.reportsTo?.name || '—'}</td>
                  <td>
                    {u.isActive ? (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success">
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td>
                    {u.isCurrentlyLocked ? (
                      <div className="d-flex align-items-center gap-1">
                        <span className="badge bg-danger">Locked Out</span>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline-warning"
                            className="py-0 px-1"
                            onClick={() => handleUnlockUser(u)}
                            title="Unlock Account"
                          >
                            <BsUnlock /> Unlock
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted small">Normal ({u.failedLoginCount || 0} failed)</span>
                    )}
                  </td>
                  <td className="small text-muted">{formatDate(u.createdAt)}</td>

                  {isAdmin && (
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Details"
                        >
                          <BsPencilSquare />
                        </Button>

                        {u._id !== currentUser._id && (
                          <Button
                            variant={u.isActive ? 'outline-warning' : 'outline-success'}
                            onClick={() => handleToggleStatus(u)}
                            title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.isActive ? <BsXCircle /> : <BsCheckCircle />}
                          </Button>
                        )}

                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setPasswordTargetUser(u);
                            setNewPassword('');
                            setFormErrors({});
                            setShowPasswordModal(true);
                          }}
                          title="Reset Password"
                        >
                          <BsKey />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal: Create / Edit User */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">{isEditing ? 'Edit User Profile & Role' : 'Create New CRM User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveUser} noValidate>
          <Modal.Body>
            {formErrors.general && <div className="alert alert-danger py-2 small">{formErrors.general}</div>}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    isInvalid={!!formErrors.name}
                    placeholder="e.g. Anand Mahindra"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    isInvalid={!!formErrors.email}
                    placeholder="user@company.com"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              {!isEditing && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Initial Password *</Form.Label>
                    <Form.Control
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      isInvalid={!!formErrors.password}
                      placeholder="Min 8 chars, 1 upper, 1 special"
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Contact Phone</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Role *</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Reports To (Supervising Manager)</Form.Label>
                  <Form.Select
                    value={userForm.reportsTo}
                    onChange={(e) => setUserForm({ ...userForm, reportsTo: e.target.value })}
                  >
                    <option value="">None / Top Level</option>
                    {managersList
                      .filter((m) => m._id !== editingId)
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowUserModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal: Password Reset */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 d-flex align-items-center gap-2 text-danger">
            <BsKey /> Reset Password: {passwordTargetUser?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleResetPassword}>
          <Modal.Body>
            {formErrors.general && <div className="alert alert-danger py-2 small">{formErrors.general}</div>}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">New Password *</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                isInvalid={!!formErrors.password}
                placeholder="Min 8 chars, 1 uppercase, 1 special char"
                required
              />
              <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
              <Form.Text className="text-muted">
                Must satisfy complexity rules (e.g. <code>NewPassword@2026</code>)
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowPasswordModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={submitting}>
              {submitting ? 'Resetting...' : 'Confirm Reset Password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
