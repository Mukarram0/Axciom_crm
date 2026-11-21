import api from './api';

export const reportService = {
  getCustomers: (params) => api.get('/reports/customers', { params }),
  getLeads: (params) => api.get('/reports/leads', { params }),
  getFollowUps: (params) => api.get('/reports/followups', { params }),
  getOpportunities: (params) => api.get('/reports/opportunities', { params }),
  getPipeline: (params) => api.get('/reports/pipeline', { params }),
  getConversion: (params) => api.get('/reports/conversion', { params }),
  getUserActivity: (params) => api.get('/reports/user-activity', { params }),
  getAudit: (params) => api.get('/reports/audit', { params }),
};
