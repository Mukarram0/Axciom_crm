import api from './api';

export const dashboardService = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
  getCharts: (params) => api.get('/dashboard/charts', { params }),
};
