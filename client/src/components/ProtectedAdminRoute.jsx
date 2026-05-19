import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';

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

        // Use fetch directly to avoid axios interceptors
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/admin-auth/verify`, {
          method: 'GET',
          credentials: 'include', // Include cookies
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[ADMIN ROUTE] Verify response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            console.log('[ADMIN ROUTE] Admin access verified successfully');
            setIsValidAdmin(true);
          } else {
            console.warn('[ADMIN ROUTE] Verification returned invalid');
            setIsValidAdmin(false);
          }
        } else {
          console.log('[ADMIN ROUTE] Verification failed with status:', response.status);
          localStorage.removeItem('admin-token');
          setIsValidAdmin(false);
        }
      } catch (error) {
        console.error('[ADMIN ROUTE] Verification error:', error.message);
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
