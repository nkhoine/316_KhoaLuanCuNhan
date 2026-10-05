import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Lấy parameter từ URL (nếu có ?mode=register thì mở form đăng ký)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    let registered = false;
    try {
      if (!isLogin) { await api('/auth/register', 'POST', { email: email.trim(), password, fullName: name.trim() }); registered = true; }
      const user = await login(email.trim(), password);
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/app/dashboard', { replace: true });
    } catch(e) {
      if (registered) { setIsLogin(true); setError('Đã tạo tài khoản. Vui lòng đăng nhập lại. ' + errorMessage(e)); }
      else setError(errorMessage(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-5xl bg-surface rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-line">
        
        {/* Cột trái (Banner) */}
        <div className="md:w-5/12 bg-gradient-to-br from-navy to-[#164a78] p-10 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 font-black text-2xl text-white mb-10 cursor-pointer">
              <span className="text-accent text-3xl drop-shadow-md">💧</span> FoodLens
            </Link>
            <h2 className="text-4xl font-black mb-4 leading-tight">Hiểu bữa ăn,<br/>chăm sóc chính mình.</h2>
            <p className="text-white/80 leading-relaxed text-sm">
              Nền tảng dinh dưỡng ứng dụng AI thị giác máy tính đầu tiên được tối ưu hóa chuyên sâu cho các món ăn Việt Nam.
            </p>
          </div>
          
          <div className="relative z-10 text-xs text-white/60 pt-6 border-t border-white/10">
            Đồ án tốt nghiệp HUIT 2026
          </div>
        </div>

        {/* Cột phải (Form) */}
        <div className="md:w-7/12 p-8 md:p-14 flex flex-col justify-center bg-surface">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-black text-navy mb-2">{isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}</h2>
            <p className="text-muted text-sm mb-8">
              {isLogin ? 'Chào mừng bạn trở lại với không gian dinh dưỡng FoodLens.' : 'Bắt đầu hành trình theo dõi dinh dưỡng cá nhân hóa ngay hôm nay.'}
            </p>

            {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wide">Họ và tên</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder="Nguyễn Văn A" />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wide">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder="name@huit.edu.vn" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-muted uppercase tracking-wide">Mật khẩu</label>
                  
                </div>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all" placeholder="••••••••" />
              </div>

              <button disabled={busy} type="submit" className="mt-4 w-full bg-navy text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:bg-navy/90 hover:shadow-lg transition-all">
                {busy ? 'Đang xử lý…' : isLogin ? <><CheckCircle2 size={20} /> Đăng nhập ngay</> : <>Đăng ký miễn phí <ArrowRight size={20} /></>}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-muted font-medium">
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-secondary font-bold hover:underline">
                {isLogin ? "Đăng ký thành viên" : "Đăng nhập ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}