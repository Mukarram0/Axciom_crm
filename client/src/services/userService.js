import api from './api';

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  unlock: (id) => api.patch(`/users/${id}/unlock`),
  resetPassword: (id, newPassword) => api.patch(`/users/${id}/reset-password`, { newPassword }),
};
