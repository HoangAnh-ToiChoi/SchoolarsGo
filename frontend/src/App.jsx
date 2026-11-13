import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserLayout from '~/layouts/userLayout';
import ProtectedRoute from '~/components/common/ProtectedRoute';
import PageLoader from '~/components/common/pageLoader';
import { selectAuthLoading, selectIsAdmin, selectIsAuthenticated } from '~/store/slices/authSlice';
import { PAGE_LOADERS } from '~/pageLoaders';
import { useSessionBootstrap } from '~/hooks/useAuth';

// Mỗi trang là một thư mục pages/<tên>/index.jsx, tải lười để giảm dung lượng lần đầu (hàm tải ở pageLoaders.js)
const HomePage = lazy(PAGE_LOADERS.home);
const ScholarshipDetailPage = lazy(PAGE_LOADERS.scholarshipDetail);
const LoginPage = lazy(PAGE_LOADERS.login);
const RegisterPage = lazy(PAGE_LOADERS.register);
const ForgotPasswordPage = lazy(PAGE_LOADERS.forgotPassword);
const ResetPasswordPage = lazy(PAGE_LOADERS.resetPassword);
const ApplicationsPage = lazy(PAGE_LOADERS.applications);
const ApplicationDetailPage = lazy(PAGE_LOADERS.applicationDetail);
const SavedPage = lazy(PAGE_LOADERS.saved);
const DashboardPage = lazy(PAGE_LOADERS.dashboard);
const DeadlinesPage = lazy(PAGE_LOADERS.deadlines);
const RecommendPage = lazy(PAGE_LOADERS.recommend);
const ComparePage = lazy(PAGE_LOADERS.compare);
const ChatPage = lazy(PAGE_LOADERS.chat);
const NewsPage = lazy(PAGE_LOADERS.news);
const NotFoundPage = lazy(PAGE_LOADERS.notFound);
const AdminLayout = lazy(PAGE_LOADERS.adminLayout);
const AdminDashboardPage = lazy(PAGE_LOADERS.adminDashboard);
const AdminUsersPage = lazy(PAGE_LOADERS.adminUsers);
const AdminScholarshipsPage = lazy(PAGE_LOADERS.adminScholarships);

function AdminRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const isLoading = useSelector(selectAuthLoading);
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// Link cũ /scholarships?search=… chuyển về trang chủ, giữ nguyên từ khóa và bộ lọc
function LegacySearchRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}

const guard = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function App() {
  useSessionBootstrap();
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
          <Route path="scholarships/:slug" element={<ScholarshipDetailPage />} />
          <Route path="saved" element={guard(<SavedPage />)} />
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
