import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

const HomePage = lazy(() => import('./pages/HomePage'));
const ScholarshipsPage = lazy(() => import('./pages/ScholarshipsPage'));
const ScholarshipDetailPage = lazy(() => import('./pages/ScholarshipDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetailPage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DeadlineTrackerPage = lazy(() => import('./pages/DeadlineTrackerPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const RecommendPage = lazy(() => import('./pages/RecommendPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminScholarshipsPage = lazy(() => import('./pages/admin/AdminScholarshipsPage'));

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const PageLoader = () => (
  <div className="min-h-screen bg-ink-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-ink-800 border-t-primary-400 rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="scholarships" element={<ScholarshipsPage />} />
          <Route path="scholarships/:id" element={<ScholarshipDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
          <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="deadlines" element={<ProtectedRoute><DeadlineTrackerPage /></ProtectedRoute>} />
          <Route path="applications/:id" element={<ProtectedRoute><ApplicationDetailPage /></ProtectedRoute>} />
          <Route path="recommend" element={<ProtectedRoute><RecommendPage /></ProtectedRoute>} />
          <Route path="compare" element={<ComparisonPage />} />
          <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="news" element={<NewsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="scholarships" element={<AdminScholarshipsPage />} />
        </Route>
      </Routes>
        </Suspense>
    </>
  );
}

export default App;
