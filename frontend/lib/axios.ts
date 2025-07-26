import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', // backend URL
  timeout: 10000, // 10 second timeout
});

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
