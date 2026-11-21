import React from 'react';

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h2 className="fs-4 fw-bold text-dark mb-1">{title}</h2>
        {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
      </div>
      {children && <div className="d-flex align-items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
};

export default PageHeader;
