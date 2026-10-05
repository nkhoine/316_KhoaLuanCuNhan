import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { api, ApiError, errorMessage } from '../api/client';
import type { AuthUser } from '../api/types';
type Auth = { user: AuthUser | null; loading: boolean; error: string; reload: () => Promise<void>; login: (email: string, password: string) => Promise<AuthUser>; logout: () => Promise<void> };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<AuthUser | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 async function reload() {
  setLoading(true); setError('');
  try { setUser(await api<AuthUser>('/auth/me')); }
  catch(e) { setUser(null); if (!(e instanceof ApiError && e.status === 401)) setError(errorMessage(e)); }
  finally { setLoading(false); }
 }
 useEffect(() => {
  void reload();
  const expire = () => setUser(null);
  window.addEventListener('foodlens:unauthorized', expire);
  return () => window.removeEventListener('foodlens:unauthorized', expire);
 }, []);
 async function login(email: string, password: string) {
  await api('/auth/login', 'POST', new URLSearchParams({ email, password }));
  const current = await api<AuthUser>('/auth/me');
  setUser(current); setError(''); return current;
 }
 async function logout() { await api('/auth/logout', 'POST'); setUser(null); setError(''); }
 return <Context.Provider value={{user, loading, error, reload, login, logout}}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('Thiếu AuthProvider'); return value; }
export function RequireAuth({ admin = false }: { admin?: boolean }) {
 const { user, loading, error, reload } = useAuth();
 if (loading) return <p className="p-8">Đang kiểm tra phiên đăng nhập…</p>;
 if (error) return <div className="p-8"><p role="alert">{error}</p><button onClick={() => void reload()} className="underline">Thử lại</button></div>;
 if (!user) return <Navigate to="/auth" replace />;
 if (admin && user.role !== 'ADMIN') return <div className="p-8">Tài khoản này không có quyền quản trị. <a href="/app/dashboard" className="underline">Về trang người dùng</a></div>;
 return <Outlet />;
}
