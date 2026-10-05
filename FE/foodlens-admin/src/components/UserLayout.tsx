import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';
import { useUserTheme } from './user/theme';
import './user/user.css';
const menus = [['/app/dashboard', 'Tổng quan'], ['/app/recognize', 'Nhận diện món ăn'], ['/app/recognize?mode=search', 'Tra cứu món ăn'], ['/app/diary', 'Nhật ký'], ['/app/goals', 'Mục tiêu'], ['/app/onboarding', 'Khởi tạo hồ sơ'], ['/app/profile', 'Hồ sơ']];
export default function UserLayout() {
    const location = useLocation(); const { user, logout } = useAuth(); const { resolved } = useUserTheme(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    const current = location.pathname === '/app/recognize' && new URLSearchParams(location.search).get('mode') === 'search' ? '/app/recognize?mode=search' : location.pathname;
    async function leave() { if (busy || !confirm('Đăng xuất khỏi tài khoản?')) return; setBusy(true); setError(''); try { await logout(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
    return <div data-user-theme={resolved} className="flex min-h-screen font-sans"><aside className="hidden w-60 shrink-0 flex-col gap-2 bg-sidebar p-4 text-sidebar-text md:flex"><Link to="/app/dashboard" className="px-3 py-5 text-2xl font-bold text-white">💧 FoodLens</Link>{menus.map(([url, name]) => <Link key={url} to={url} className={`rounded-xl px-3 py-3 text-sm ${current === url ? 'bg-white/15 font-bold text-white' : 'hover:bg-white/10'}`}>{name}</Link>)}<button disabled={busy} className="mt-auto rounded-xl px-3 py-3 text-left hover:bg-white/10" onClick={() => void leave()}>Đăng xuất</button></aside><main className="min-w-0 flex-1"><header className="u-card border-b px-5 py-4"><h1 className="text-xl font-bold">{menus.find(([url]) => url === current)?.[1] || 'FoodLens'}</h1><p className="u-muted mt-1 break-all text-sm">{user?.fullName} · {user?.email}</p><nav className="mt-4 flex flex-wrap gap-2 md:hidden">{menus.map(([url, name]) => <Link key={url} to={url} className={`rounded-lg px-3 py-2 text-xs ${current === url ? 'u-primary' : 'u-soft'}`}>{name}</Link>)}<button disabled={busy} className="u-secondary rounded-lg border px-3 py-2 text-xs" onClick={() => void leave()}>Đăng xuất</button></nav></header>{error && <p role="alert" className="u-error m-4 rounded-xl p-3">{error}</p>}<div className="mx-auto max-w-6xl p-4 md:p-6"><Outlet /></div></main></div>;
}
