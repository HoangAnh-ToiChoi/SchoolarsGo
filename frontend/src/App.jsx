import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ScholarshipsPage from './pages/ScholarshipsPage';
import ScholarshipDetailPage from './pages/ScholarshipDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ApplicationsPage from './pages/ApplicationsPage';
import SavedPage from './pages/SavedPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="scholarships" element={<ScholarshipsPage />} />
        <Route path="scholarships/:id" element={<ScholarshipDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="applications" element={<ProtectedRoute><ApplicationsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
