import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000', // backend URL
  timeout: 30000, // 30 second timeout for PDF generation
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

    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn('Request timeout, API might not be available');
    }

    return Promise.reject(error);
  }
);

export default api;
