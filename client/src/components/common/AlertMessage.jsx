import React from 'react';
import { Alert } from 'react-bootstrap';

const AlertMessage = ({ variant = 'danger', message, onClose }) => {
  if (!message) return null;

  return (
    <Alert variant={variant} dismissible={!!onClose} onClose={onClose} className="border-0 shadow-sm mb-3">
      {message}
    </Alert>
  );
};

export default AlertMessage;
