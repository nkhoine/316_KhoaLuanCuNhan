import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, Cpu, Database, FlaskConical, LayoutDashboard, LogOut, Menu, Tags, Users, Utensils, X } from 'lucide-react';

const menu = [
  ['dashboard', 'Tổng quan', LayoutDashboard],
  ['users', 'Người dùng', Users],
  ['foods', 'Món ăn & dinh dưỡng', Utensils],
  ['datasets', 'Dataset', Database],
  ['models', 'Mô hình AI', Cpu],
  ['mappings', 'Ánh xạ nhãn', Tags],
  ['model-test', 'Kiểm thử mô hình', FlaskConical],
  ['reports', 'Báo cáo', BarChart3],
  ['activity', 'Hoạt động', Activity],
] as const;

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = menu.find(([path]) => pathname === `/admin/${path}`)?.[1] ?? 'Quản trị';

  function logout() {
    if (!window.confirm('Bạn muốn đăng xuất?')) return;
    localStorage.removeItem('user');
    navigate('/auth', { replace: true });
  }

  return (
    <div className="min-h-screen bg-bg text-text md:flex">
      <aside className="shrink-0 bg-navy text-white md:sticky md:top-0 md:h-screen md:w-64 md:overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-6">
          <NavLink to="/admin/dashboard" onClick={() => setOpen(false)} className="text-xl font-bold">FoodLens <span className="text-xs text-accent">ADMIN</span></NavLink>
          <button type="button" aria-label={open ? 'Đóng menu' : 'Mở menu'} aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-white/10 md:hidden">{open ? <X /> : <Menu />}</button>
        </div>
        <nav id="admin-navigation" aria-label="Điều hướng quản trị" className={`${open ? 'block' : 'hidden'} px-3 pb-6 md:block`}>
          <p className="px-3 py-3 text-xs uppercase tracking-widest text-white/50">Không gian quản trị</p>
          {menu.map(([path, label, Icon]) => (
            <NavLink key={path} to={`/admin/${path}`} onClick={() => setOpen(false)} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-accent/15 font-semibold text-accent' : 'text-white/75 hover:bg-white/10'}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
          <div className="mt-8 border-t border-white/10 pt-4">
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 hover:bg-white/10"><LogOut size={18} />Đăng xuất</button>
          </div>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-5 md:px-8">
          <div><p className="text-xs text-muted">FoodLens / Quản trị</p><h1 className="mt-1 font-semibold">{title}</h1></div>
          <span className="rounded-full bg-chip px-3 py-2 text-xs text-navy">Giao diện đồ án</span>
        </header>
        <main className="mx-auto max-w-[1440px] p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
