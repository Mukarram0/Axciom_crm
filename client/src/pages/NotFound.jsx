import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { BsExclamationOctagon, BsArrowLeft } from 'react-icons/bs';

const NotFound = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-75 py-5">
      <Card className="text-center p-5 border-0 shadow-sm" style={{ maxWidth: '480px' }}>
        <div className="mb-3 text-warning">
          <BsExclamationOctagon className="display-1" />
        </div>
        <h2 className="fw-bold mb-2">404 - Page Not Found</h2>
        <p className="text-muted small mb-4">
          The requested CRM resource or page does not exist or you may not possess the required authorization to view it.
        </p>
        <Button as={NavLink} to="/dashboard" variant="primary" className="d-inline-flex align-items-center justify-content-center gap-2">
          <BsArrowLeft /> Return to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default NotFound;
