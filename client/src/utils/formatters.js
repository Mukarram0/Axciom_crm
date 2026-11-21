/**
 * Currency, Date and Badge formatters
 */

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Active':
    case 'Qualified':
    case 'Won':
    case 'Completed':
    case 'SUCCESS':
      return 'bg-success text-white';

    case 'New':
    case 'Planned':
    case 'Qualification':
      return 'bg-primary text-white';

    case 'Contacted':
    case 'Proposal':
    case 'Negotiation':
    case 'Lead-Converted':
      return 'bg-info text-dark';

    case 'Inactive':
    case 'Unqualified':
    case 'Missed':
    case 'Cancelled':
    case 'Lost':
    case 'FAILURE':
      return 'bg-danger text-white';

    case 'High':
    case 'Urgent':
      return 'bg-warning text-dark';

    case 'Low':
    case 'Medium':
      return 'bg-secondary text-white';

    default:
      return 'bg-secondary text-white';
  }
};
