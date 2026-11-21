import api from './api';

export const activityService = {
  getAll: (params) => api.get('/activities', { params }),
  create: (data) => api.post('/activities', data),
  delete: (id) => api.delete(`/activities/${id}`),
};
