import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const badgeClass = getStatusBadgeClass(status);

  return <span className={`badge badge-pill-custom ${badgeClass}`}>{status}</span>;
};

export default StatusBadge;
