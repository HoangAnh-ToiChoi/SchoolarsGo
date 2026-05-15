import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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

function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
      </Routes>
    </AnimatePresence>
  );
}

export default App;
