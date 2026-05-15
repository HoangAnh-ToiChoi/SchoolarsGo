import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ScholarshipsPage from './pages/ScholarshipsPage';
import ScholarshipDetailPage from './pages/ScholarshipDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import SavedPage from './pages/SavedPage';
import DashboardPage from './pages/DashboardPage';
import DeadlineTrackerPage from './pages/DeadlineTrackerPage';
import NotFoundPage from './pages/NotFoundPage';
import RecommendPage from './pages/RecommendPage';
import ProtectedRoute from './components/ProtectedRoute';
import ComparisonPage from './pages/ComparisonPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminScholarshipsPage from './pages/admin/AdminScholarshipsPage';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  const location = useLocation();
  // Admin sub-routes share one key so the sidebar doesn't remount between /admin pages.
  // Each individual admin page animates via AdminLayout's inner AnimatePresence.
  const routeKey = location.pathname.startsWith('/admin') ? '/admin' : location.pathname;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={routeKey}>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="scholarships" element={<ScholarshipsPage />} />
        <Route path="scholarships/:id" element={<ScholarshipDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="deadlines" element={<ProtectedRoute><DeadlineTrackerPage /></ProtectedRoute>} />
        <Route path="applications/:id" element={<ProtectedRoute><ApplicationDetailPage /></ProtectedRoute>} />
        <Route path="recommend" element={<ProtectedRoute><RecommendPage /></ProtectedRoute>} />
        <Route path="compare" element={<ComparisonPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="scholarships" element={<AdminScholarshipsPage />} />
      </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
