import api from './api';

export const leadService = {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  convert: (id, conversionData) => api.post(`/leads/${id}/convert`, conversionData),
  delete: (id) => api.delete(`/leads/${id}`),
};
