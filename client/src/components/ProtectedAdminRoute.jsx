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
    return <Navigate to="/login" replace />;
  }

  // Not admin
  if (!user.isAdmin) {
    console.warn('[ADMIN] Unauthorized access attempt by:', user.email);
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You do not have permission to access this resource.</p>
          <a
            href="/dashboard"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Admin authenticated
  return children;
};

export default ProtectedAdminRoute;
