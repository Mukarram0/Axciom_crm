import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ text = 'Loading data...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5">
      <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <span className="mt-3 text-muted fw-medium">{text}</span>
    </div>
  );
};

export default LoadingSpinner;
