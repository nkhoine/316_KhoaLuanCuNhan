import { AuthProvider, RequireAuth } from './auth/AuthContext';
import MappingsPage from './pages/admin/MappingsPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import các Layout và Page
import AdminLayout from './components/AdminLayout';
import FoodsPage from './pages/admin/FoodsPage';
import ModelTestPage from './pages/admin/ModelTestPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';

import UserLayout from './components/UserLayout';
import UserRecognizePage from './pages/user/UserRecognizePage';
import UserDashboardPage from './pages/user/UserDashboardPage';
import UserDiaryPage from './pages/user/UserDiaryPage';
import UserGoalsPage from './pages/user/UserGoalsPage';
import UserProfilePage from './pages/user/UserProfilePage';
import UserOnboardingPage from './pages/user/UserOnboardingPage';

// Import 2 trang mới
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider><Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Private Routes cho User */}
        <Route element={<RequireAuth />}><Route path="/app" element={<UserLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="recognize" element={<UserRecognizePage />} />
          <Route path="dashboard" element={<UserDashboardPage />} />
          <Route path="diary" element={<UserDiaryPage />} />
          <Route path="goals" element={<UserGoalsPage />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="onboarding" element={<UserOnboardingPage />} />
        </Route>

        </Route>
        {/* Private Routes cho Admin */}
        <Route element={<RequireAuth admin />}><Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          {['datasets', 'models', 'reports', 'activity'].map(path => (
            <Route key={path} path={path} element={
              <section className="rounded-2xl border border-line bg-white p-8">
                <h2 className="text-xl font-semibold text-navy">Chức năng đang phát triển</h2>
                <p className="mt-3 text-sm text-muted">Module này chưa được kết nối dữ liệu. Bạn có thể sử dụng Tổng quan, Người dùng, Món ăn & dinh dưỡng hoặc Kiểm thử mô hình.</p>
              </section>
            } />
          ))}
          <Route path="mappings" element={<MappingsPage />} />
          <Route path="foods" element={<FoodsPage />} />
          <Route path="model-test" element={<ModelTestPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route></Routes></AuthProvider>
    </BrowserRouter>
  );
}

export default App;