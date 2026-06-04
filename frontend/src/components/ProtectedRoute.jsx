import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthResolved } = useAuthStore();

  if (!isAuthResolved) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink-800 border-t-primary-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
