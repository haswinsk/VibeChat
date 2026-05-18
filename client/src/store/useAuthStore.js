import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/profile');
      set({ user: data, isAuthenticated: true, error: null });
    } catch (error) {
      set({ user: null, isAuthenticated: false, error: null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      set({ user: data, isAuthenticated: true });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Login failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/signup', { name, email, password });
      set({ user: data, isAuthenticated: true });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Signup failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout');
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
