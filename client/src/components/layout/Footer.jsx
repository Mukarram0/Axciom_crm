import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-top py-3 px-4 text-center text-muted small">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <span>&copy; {new Date().getFullYear()} AcxiomCRM — Enterprise Sales & Customer Relationship Management.</span>
        <span className="badge bg-light text-secondary border">MERN Stack Architecture • Version 1.0</span>
      </div>
    </footer>
  );
};

export default Footer;
