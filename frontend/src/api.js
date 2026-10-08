// Axios instance with base URL, token interceptor, and 401 handling
import axios from 'axios';

// Remove trailing slash from API URL if present
const defaultUrl = import.meta.env.PROD ? 'https://tpo-backend-616r.onrender.com' : 'http://localhost:5000';
const baseURL = (import.meta.env.VITE_API_URL || defaultUrl).replace(/\/$/, '');

const api = axios.create({
  baseURL,
  timeout: 60000  // 60 seconds (Render free tier can be slow to wake)
});

// Before every request, attach the JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If any response is 401, clear token and go to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
