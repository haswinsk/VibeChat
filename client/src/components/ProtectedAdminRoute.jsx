import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedAdminRoute = ({ children }) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // Not admin - redirect to admin login for verification
  if (!user.isAdmin) {
    console.warn('[ADMIN] Unauthorized access attempt by:', user.email);
    return <Navigate to="/admin-login" replace />;
  }

  // Admin authenticated
  return children;
};

export default ProtectedAdminRoute;
