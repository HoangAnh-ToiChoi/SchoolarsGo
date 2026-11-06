import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserLayout from '~/layouts/userLayout';
import ProtectedRoute from '~/components/common/ProtectedRoute';
import { selectIsAdmin, selectIsAuthenticated } from '~/store/slices/authSlice';

// Mỗi trang là một thư mục pages/<tên>/index.jsx, tải lười để giảm dung lượng lần đầu
const HomePage = lazy(() => import('~/pages/home'));
const ScholarshipDetailPage = lazy(() => import('~/pages/scholarshipDetail'));
const LoginPage = lazy(() => import('~/pages/login'));
const RegisterPage = lazy(() => import('~/pages/register'));
const ForgotPasswordPage = lazy(() => import('~/pages/forgotPassword'));
const ResetPasswordPage = lazy(() => import('~/pages/resetPassword'));
const ApplicationsPage = lazy(() => import('~/pages/applications'));
const ApplicationDetailPage = lazy(() => import('~/pages/applicationDetail'));
const SavedPage = lazy(() => import('~/pages/saved'));
const DashboardPage = lazy(() => import('~/pages/dashboard'));
const DeadlinesPage = lazy(() => import('~/pages/deadlines'));
const RecommendPage = lazy(() => import('~/pages/recommend'));
const ComparePage = lazy(() => import('~/pages/compare'));
const ChatPage = lazy(() => import('~/pages/chat'));
const NewsPage = lazy(() => import('~/pages/news'));
const NotFoundPage = lazy(() => import('~/pages/notFound'));
const AdminLayout = lazy(() => import('~/layouts/adminLayout'));
const AdminDashboardPage = lazy(() => import('~/pages/admin/dashboard'));
const AdminUsersPage = lazy(() => import('~/pages/admin/users'));
const AdminScholarshipsPage = lazy(() => import('~/pages/admin/scholarships'));

function AdminRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Đang tải">
      <div className="size-8 animate-spin rounded-full border-2 border-line border-t-brand-600" />
    </div>
  );
}

// Link cũ /scholarships?search=… chuyển về trang chủ, giữ nguyên từ khóa và bộ lọc
function LegacySearchRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}

const guard = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Trang xác thực đứng riêng, không có header/sidebar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/resetPassword" element={<ResetPasswordPage />} />

        <Route element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="scholarships" element={<LegacySearchRedirect />} />
          <Route path="scholarships/:id" element={<ScholarshipDetailPage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="profile" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={guard(<DashboardPage />)} />
          <Route path="applications" element={guard(<ApplicationsPage />)} />
          <Route path="applications/:id" element={guard(<ApplicationDetailPage />)} />
          <Route path="deadlines" element={guard(<DeadlinesPage />)} />
          <Route path="recommend" element={guard(<RecommendPage />)} />
          <Route path="chat" element={guard(<ChatPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="scholarships" element={<AdminScholarshipsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
