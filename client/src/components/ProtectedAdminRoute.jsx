import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const ProtectedAdminRoute = ({ children }) => {
  const { user, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidAdmin, setIsValidAdmin] = useState(false);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        const adminToken = localStorage.getItem('admin-token');

        if (!adminToken) {
          console.warn('[ADMIN ROUTE] No admin token found');
          setIsValidAdmin(false);
          setIsVerifying(false);
          return;
        }

        // Verify token with backend
        try {
          const response = await api.get('/admin-auth/verify');
          
          if (response.data.valid) {
            console.log('[ADMIN ROUTE] Admin access verified');
            setIsValidAdmin(true);
          } else {
            console.warn('[ADMIN ROUTE] Admin verification failed - invalid response');
            setIsValidAdmin(false);
          }
        } catch (apiError) {
          // Verification failed - token is invalid/expired
          console.log('[ADMIN ROUTE] Admin token verification failed:', apiError.response?.status);
          localStorage.removeItem('admin-token');
          setIsValidAdmin(false);
        }
      } catch (error) {
        console.error('[ADMIN ROUTE] Unexpected error:', error.message);
        localStorage.removeItem('admin-token');
        setIsValidAdmin(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdminAccess();
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isValidAdmin) {
    console.warn('[ADMIN ROUTE] Access denied - redirecting to admin login');
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
