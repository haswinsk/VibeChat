import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send cookies with requests
});

// Add a request interceptor to include the token in the Authorization header
api.interceptors.request.use(
  (config) => {
    try {
      // Try to get token from separate storage first
      let token = localStorage.getItem('auth-token');
      
      // Fallback to getting from auth-storage
      if (!token) {
        const authStorageStr = localStorage.getItem('auth-storage');
        if (authStorageStr) {
          const authStore = JSON.parse(authStorageStr);
          token = authStore?.state?.user?.token;
        }
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Authorization header set with token');
      } else {
        console.log('[API] No token found');
      }
    } catch (error) {
      console.error('[API] Error reading token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
