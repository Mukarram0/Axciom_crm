import React, { useState } from 'react';
import { Form, Button, Card, Badge, Alert } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';
import { BsShieldLock, BsPersonBadge, BsKey, BsArrowRight } from 'react-icons/bs';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!validateEmail(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.message);
    }
  };

  // Quick Demo Auto-fill Helper
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormErrors({});
    setServerError('');
  };

  return (
    <Card className="auth-card border-0">
      <div className="text-center mb-4">
        <div className="d-inline-flex p-3 bg-primary bg-opacity-10 text-primary rounded-circle mb-2">
          <BsShieldLock className="fs-2" />
        </div>
        <h3 className="fw-bold text-dark mb-1">AcxiomCRM</h3>
        <p className="text-muted small">Sign in to your authorized CRM account</p>
      </div>

      {serverError && (
        <Alert variant="danger" className="py-2 small">
          {serverError}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
          <Form.Control
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isInvalid={!!formErrors.email}
          />
          <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="small fw-semibold text-secondary">Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isInvalid={!!formErrors.password}
          />
          <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100 py-2 fw-semibold" disabled={submitting}>
          {submitting ? 'Authenticating...' : 'Sign In to CRM'} <BsArrowRight className="ms-1" />
        </Button>
      </Form>

      {/* Quick Demo Credentials Bar for Viva & Demonstration */}
      <div className="mt-4 pt-3 border-top">
        <div className="text-muted small fw-semibold mb-2 text-center">Quick Demo Login:</div>
        <div className="d-flex flex-column gap-1">
          <Button
            variant="outline-danger"
            size="sm"
            className="text-start d-flex justify-content-between align-items-center"
            onClick={() => fillCredentials('admin@acxiomcrm.com', 'AdminPassword@123')}
          >
            <span><BsPersonBadge className="me-1" /> Admin (Full Scope)</span>
            <Badge bg="danger">Click to fill</Badge>
          </Button>

          <Button
            variant="outline-primary"
            size="sm"
            className="text-start d-flex justify-content-between align-items-center"
            onClick={() => fillCredentials('manager@acxiomcrm.com', 'ManagerPassword@123')}
          >
            <span><BsPersonBadge className="me-1" /> Manager (Team Scope)</span>
            <Badge bg="primary">Click to fill</Badge>
          </Button>

          <Button
            variant="outline-success"
            size="sm"
            className="text-start d-flex justify-content-between align-items-center"
            onClick={() => fillCredentials('sales1@acxiomcrm.com', 'SalesPassword@123')}
          >
            <span><BsPersonBadge className="me-1" /> Sales Executive (Assigned)</span>
            <Badge bg="success">Click to fill</Badge>
          </Button>
        </div>
      </div>

      <div className="text-center mt-3 small text-muted">
        Need an executive account?{' '}
        <NavLink to="/register" className="fw-semibold text-decoration-none">
          Register here
        </NavLink>
      </div>
    </Card>
  );
};

export default Login;
