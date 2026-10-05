// Axios instance configured with default credentials for session cookies
import axios from 'axios';

// Create and export configured Axios client with credentials enabled
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '',
  withCredentials: true,
});

export default api;
