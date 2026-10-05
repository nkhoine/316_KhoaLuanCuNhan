import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Utensils, Database, Cpu, Tags, FlaskConical, BarChart3, Activity, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const currentPath = location.pathname;

  const NAV_A = [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Người dùng', icon: Users },
    { path: '/admin/foods', label: 'Món ăn & dinh dưỡng', icon: Utensils },
    { path: '/admin/datasets', label: 'Dataset', icon: Database },
    { path: '/admin/models', label: 'Mô hình AI', icon: Cpu },
    { path: '/admin/mappings', label: 'Ánh xạ nhãn', icon: Tags },
    { path: '/admin/model-test', label: 'Kiểm thử mô hình', icon: FlaskConical },
    { path: '/admin/reports', label: 'Báo cáo', icon: BarChart3 },
    { path: '/admin/activity', label: 'Hoạt động', icon: Activity },
  ];
  const handleLogout = async () => {
    if (leaving || !window.confirm('Đăng xuất khỏi tài khoản?')) return;
    setLeaving(true);
    try { await logout(); } catch(e) { alert(errorMessage(e)); } finally { setLeaving(false); }
  };
  return (
    <div className="flex h-screen bg-bg text-text font-sans">
      {/* Sidebar */}
      <nav className="w-60 bg-sidebar text-sidebar-text p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 pb-6 pt-2 font-bold text-white">
          <span className="text-accent">💧</span>
          <span className="text-lg">FoodLens <small className="text-[10px] opacity-60 font-bold">ADMIN</small></span>
        </div>

        {NAV_A.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-[rgba(127,219,255,0.16)] text-white font-semibold opacity-100' : 'opacity-80 hover:bg-white/10 hover:opacity-100'
                }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="flex-1"></div>
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm opacity-70 hover:opacity-100 hover:text-red-400 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-line">
          <div>
            <h1 className="text-lg font-semibold m-0">Quản trị hệ thống</h1>
            <div className="text-sm text-muted">{user?.fullName} · {user?.email}</div>
          </div>
          <div className="flex-1"></div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-cyan text-white flex items-center justify-center font-bold">
            A
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 overflow-auto flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}