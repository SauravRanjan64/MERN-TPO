import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_BACKEND_URL;
if (import.meta.env.PROD && !rawBaseURL) {
  console.warn('VITE_BACKEND_URL is not set in production. API calls may fail.');
}
const baseURL = (rawBaseURL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const MAX_RETRIES = 5;
api.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new Event('server:awake'));
    return response;
  },
  async (error) => {
    const config = error.config;
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    if (!config || !error.isAxiosError) {
      return Promise.reject(error);
    }
    
    // Retry on network errors or 5xx
    if (!error.response || error.response.status >= 500) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        window.dispatchEvent(new Event('server:waking'));
        
        const delay = Math.min(1000 * Math.pow(2, config._retryCount), 10000); // 2s, 4s, 8s, 10s...
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }
    
    window.dispatchEvent(new Event('server:awake'));
    return Promise.reject(error);
  }
);

export default api;
