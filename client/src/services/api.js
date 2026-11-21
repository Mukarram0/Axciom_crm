import axios from 'axios';

/**
 * Pre-configured Axios instance
 * Communicates with Express server via session cookies
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Crucial: Transmits session cookies with every request
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorPayload = {
      message: error.response?.data?.message || error.message || 'A network error occurred.',
      errors: error.response?.data?.errors || null,
      status: error.response?.status || 500,
    };
    return Promise.reject(errorPayload);
  }
);

export default api;
