import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validateIndianPhone, validatePasswordPolicy } from '../../utils/validation';
import { BsPersonPlus, BsArrowRight } from 'react-icons/bs';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (formData.phone && !validateIndianPhone(formData.phone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9820011223).';
    }

    const passwordCheck = validatePasswordPolicy(formData.password);
    if (!passwordCheck.valid) {
      errors.password = passwordCheck.message;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setSubmitting(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.message);
    }
  };

  return (
    <Card className="auth-card border-0" style={{ maxWidth: '480px' }}>
      <div className="text-center mb-3">
        <div className="d-inline-flex p-3 bg-success bg-opacity-10 text-success rounded-circle mb-2">
          <BsPersonPlus className="fs-2" />
        </div>
        <h3 className="fw-bold text-dark mb-1">Join AcxiomCRM</h3>
        <p className="text-muted small">Register as a new Sales Representative</p>
      </div>

      {serverError && (
        <Alert variant="danger" className="py-2 small">
          {serverError}
        </Alert>
      )}

      <div className="alert alert-info py-2 small mb-3">
        <strong>Security Policy:</strong> Self-registration automatically creates a <strong>Sales Executive</strong> account. Administrative roles must be assigned by existing Admins.
      </div>

      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-2">
          <Form.Label className="small fw-semibold text-secondary">Full Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            isInvalid={!!formErrors.name}
          />
          <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={handleChange}
            isInvalid={!!formErrors.email}
          />
          <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label className="small fw-semibold text-secondary">Phone Number (10 Digits)</Form.Label>
          <Form.Control
            type="text"
            name="phone"
            placeholder="9820011223"
            value={formData.phone}
            onChange={handleChange}
            isInvalid={!!formErrors.phone}
          />
          <Form.Control.Feedback type="invalid">{formErrors.phone}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label className="small fw-semibold text-secondary">Password (Min 8 chars, 1 Upper, 1 Special)</Form.Label>
          <Form.Control
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            isInvalid={!!formErrors.password}
          />
          <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Confirm Password</Form.Label>
          <Form.Control
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            isInvalid={!!formErrors.confirmPassword}
          />
          <Form.Control.Feedback type="invalid">{formErrors.confirmPassword}</Form.Control.Feedback>
        </Form.Group>

        <Button variant="success" type="submit" className="w-100 py-2 fw-semibold" disabled={submitting}>
          {submitting ? 'Registering...' : 'Create Sales Account'} <BsArrowRight className="ms-1" />
        </Button>
      </Form>

      <div className="text-center mt-3 small text-muted">
        Already have an account?{' '}
        <NavLink to="/login" className="fw-semibold text-decoration-none">
          Sign In
        </NavLink>
      </div>
    </Card>
  );
};

export default Register;
