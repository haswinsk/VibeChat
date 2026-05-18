import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedAdminRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();

  // Check if admin token exists in localStorage
  const adminToken = localStorage.getItem('admin-token');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // No admin token - not authenticated as admin
  if (!adminToken) {
    console.warn('[ADMIN ROUTE] No admin token found');
    return <Navigate to="/admin-login" replace />;
  }

  // Admin authenticated - let backend middleware verify the actual permissions
  return children;
};

export default ProtectedAdminRoute;
