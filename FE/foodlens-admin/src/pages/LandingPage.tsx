import { Link } from 'react-router-dom';
import { Zap, Camera, Book, Target, Shield, BarChart3, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: 'FoodLens có thể nhận diện được những món ăn nào?', a: 'Hiện tại phiên bản demo hỗ trợ tập dữ liệu món Việt phổ biến bao gồm Phở bò, Cơm tấm, Bún chả... Quản trị viên có thể mở rộng mô hình.' },
    { q: 'Nếu AI nhận diện sai thì xử lý thế nào?', a: 'Hệ thống áp dụng ngưỡng đề xuất 0.70. Nếu dưới ngưỡng, ứng dụng cho phép chụp lại hoặc đổi món thủ công.' },
    { q: 'Tại sao hệ thống không tự đoán khối lượng gram?', a: 'Thị giác máy tính 2D không thể xác định chính xác chiều sâu. Để đảm bảo tính khoa học, hệ thống yêu cầu người dùng xác nhận số gram.' }
  ];

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col">
      {/* Chrome Header */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-line shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 font-black text-xl text-navy">
            <span className="text-accent text-2xl">💧</span> 
            <span>FoodLens<span className="block text-[10px] font-normal text-muted">Thủy x Anime · Dinh dưỡng AI</span></span>
          </div>
          <div className="flex gap-4">
            <Link to="/auth" className="px-5 py-2.5 text-sm font-bold text-navy hover:bg-bg-alt rounded-xl transition-colors">Đăng nhập</Link>
            <Link to="/auth?mode=register" className="px-5 py-2.5 text-sm font-bold bg-navy text-white hover:bg-navy/90 rounded-xl shadow-md transition-all">Đăng ký</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center px-6 py-20 bg-[radial-gradient(ellipse_at_top,#E1F2FE_0%,#F0F8FF_70%)] border-b border-line">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-chip border border-line text-secondary text-xs font-bold mb-6">
          <Zap size={14} fill="currentColor" /> FoodLens AI 2.0 · Đồ án HUIT
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-navy max-w-4xl mx-auto leading-tight mb-6">
          Hiểu bữa ăn, <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-cyan">chăm sóc chính mình</span> bằng thị giác máy tính
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
          Chụp ảnh món ăn Việt Nam, nhận diện tức thì trong 1 giây, tính toán chính xác Calo, Protein, Carbs và Fat theo đúng khẩu phần bạn đã ăn.
        </p>
        <Link to="/auth" className="inline-flex px-8 py-4 bg-navy text-white text-base font-bold rounded-2xl shadow-xl hover:-translate-y-1 transition-all items-center gap-2">
          <Camera size={20} /> Trải nghiệm ngay
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-b border-line border-dashed">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-secondary tracking-widest uppercase mb-2">Tính Năng Đột Phá</div>
          <h2 className="text-3xl font-black text-navy">Mọi thứ bạn cần cho một chế độ ăn chuẩn khoa học</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Camera size={24}/>, title: 'Nhận diện đa dạng', desc: 'Phân loại chuẩn xác các món ăn đặc trưng Việt Nam từ ảnh chụp.' },
            { icon: <BarChart3 size={24}/>, title: 'Bóc tách Macro', desc: 'Tính toán chính xác Protein, Carbs, Fat theo số gram thực tế tiêu thụ.' },
            { icon: <Book size={24}/>, title: 'Nhật ký 4 bữa', desc: 'Theo dõi Bữa sáng, Trưa, Tối, Phụ không lo trùng lặp dữ liệu.' },
            { icon: <Target size={24}/>, title: 'Mục tiêu cá nhân', desc: 'Thiết lập lộ trình Giảm cân, Tăng cơ hay Duy trì cân nặng trực quan.' },
            { icon: <Shield size={24}/>, title: 'Quản trị mô hình', desc: 'Dành riêng cho Admin: Theo dõi dataset, chỉ số mAP, ánh xạ nhãn AI.' },
            { icon: <Zap size={24}/>, title: 'Đồng bộ Web & App', desc: 'Sử dụng mượt mà trên trình duyệt máy tính và trải nghiệm chuẩn Mobile.' },
          ].map((f, i) => (
            <div key={i} className="bg-surface p-6 rounded-3xl border border-line shadow-sm hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-chip text-secondary rounded-xl flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-bg-alt border-b border-line">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-secondary tracking-widest uppercase mb-2">Quy Trình</div>
            <h2 className="text-3xl font-black text-navy">Chỉ với 4 bước đơn giản</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Chụp hoặc tải ảnh', desc: 'Chụp trực tiếp từ camera hoặc tải ảnh món ăn lên.' },
              { step: 2, title: 'AI phân tích', desc: 'Mô hình bóc tách đặc trưng và trả về kết quả món ăn.' },
              { step: 3, title: 'Xác nhận & nhập gram', desc: 'Nhập số gram bạn đã ăn thực tế để tính Kcal.' },
              { step: 4, title: 'Lưu nhật ký', desc: 'Hệ thống lưu lại và cập nhật biểu đồ mục tiêu ngày.' }
            ].map((s) => (
              <div key={s.step} className="bg-surface p-6 rounded-3xl border border-line relative">
                <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center font-bold mb-4">{s.step}</div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-secondary tracking-widest uppercase mb-2">Giải đáp</div>
          <h2 className="text-3xl font-black text-navy">Câu hỏi thường gặp</h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-surface border border-line rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left font-bold hover:bg-bg-alt transition-colors">
                {faq.q}
                <ChevronDown size={18} className={`text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <div className="px-5 pb-5 text-sm text-muted leading-relaxed">{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-text py-10 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-4 font-bold text-white text-lg">
          <span className="text-accent">💧</span> FoodLens Project
        </div>
        <p className="opacity-70">Đồ án tốt nghiệp sinh viên Trường ĐH Công Thương TP.HCM (HUIT).</p>
      </footer>
    </div>
  );
}