import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { toastError } from '../components/ToastProvider';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send cookies with requests
});

// Add a request interceptor to include the token in the Authorization header
api.interceptors.request.use(
  (config) => {
    try {
      // Check if this is an admin request
      const isAdminRequest = config.url.includes('/admin');
      
      let token;
      
      if (isAdminRequest) {
        // Use admin token for admin endpoints
        token = localStorage.getItem('admin-token');
      }
      
      // Use regular auth token for other endpoints
      if (!token) {
        token = localStorage.getItem('auth-token');
      }
      
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
        console.log(`[API] Authorization header set ${isAdminRequest ? '(admin)' : '(auth)'}`);
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

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Exclude these routes from auto-logout redirect
      const excludedRoutes = [
        '/auth/login',
        '/auth/signup',
        '/admin-auth/verify', // Admin verification should just return 401, not redirect
      ];
      
      const isExcludedRoute = excludedRoutes.some(route => error.config.url.includes(route));
      
      if (!isExcludedRoute) {
        const message = error.response.data.message || 'Your session has expired. Please log in again.';
        toastError(message);
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
