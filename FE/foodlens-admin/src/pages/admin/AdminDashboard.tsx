import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../api/client';
import type { Food, Category, AdminUser } from '../../api/types';
const card = 'rounded-2xl border border-line bg-white p-5';

export default function AdminDashboard() {
  const [data, setData] = useState<{foods: Food[]; categories: Category[]; users: AdminUser[]} | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError('');
    try {
      const [foods, categories, users] = await Promise.all([api<Food[]>('/foods'), api<Category[]>('/categories'), api<AdminUser[]>('/admin/users')]);
      setData({foods, categories, users});
    } catch(e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading) return <p>Đang tải tổng quan…</p>;
  if (error || !data) return <p role="alert">{error} <button className="underline" onClick={() => void load()}>Thử lại</button></p>;
  const groups = data?.categories.map(category => ({
    ...category,
    count: data.foods.filter(food => (food.category?.id) === category.id).length,
  })) ?? [];
  const categoryIds = new Set(data?.categories.map(category => category.id));
  const unassigned = data?.foods.filter(food => !categoryIds.has(food.category?.id ?? -1)).length ?? 0;
  if (unassigned) groups.push({ id: -1, name: 'Chưa có danh mục hợp lệ', description: null, count: unassigned });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-secondary">Tổng quan hệ thống</p><h2 className="mt-2 text-2xl font-bold text-navy">Dữ liệu tốt, nhận diện tốt hơn.</h2><p className="mt-2 text-sm text-muted">Theo dõi kho món ăn và chuẩn bị dữ liệu cho FoodLens.</p></div>
      </div>
      <button className="text-secondary underline" onClick={() => void load()}>Làm mới số liệu</button>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Món ăn', data?.foods.length, 'Món ăn đã lưu'],
          ['Danh mục', data?.categories.length, 'Danh mục đã lưu'],
          ['Người dùng', data.users.length, 'Tất cả tài khoản, gồm quản trị viên'],
          ['Lượt nhận diện', null, 'Chưa có dữ liệu thống kê'],
        ].map(([label, value, note]) => <section key={String(label)} className={card}><p className="text-sm text-muted">{label}</p><p className="my-3 text-3xl font-bold text-navy">{value == null ? '—' : value}</p><p className="text-xs text-muted">{note}</p></section>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${card} xl:col-span-2`}>
          <h3 className="font-semibold text-navy">Phân bố món theo danh mục</h3><p className="mb-6 mt-1 text-xs text-muted">Đơn vị: số bản ghi món ăn</p>
          {groups.length === 0 ? <p className="text-muted">Chưa có danh mục.</p> : groups.map(group => <div key={group.id} className="mb-4"><div className="mb-2 flex justify-between gap-3 text-sm"><span>{group.name}</span><strong>{group.count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-secondary" style={{ width: `${data.foods.length ? group.count / data.foods.length * 100 : 0}%` }} /></div></div>)}
        </section>
        <section className="rounded-2xl bg-navy p-6 text-white">
          <p className="text-xs uppercase tracking-widest text-accent">Công việc quản trị</p><h3 className="mb-6 mt-3 text-xl font-semibold">Bắt đầu từ kho món ăn</h3>
          {[['foods', 'Quản lý món & dinh dưỡng'], ['users', 'Quản lý người dùng'], ['model-test', 'Kiểm thử nhận diện']].map(([path, label]) => <Link key={path} to={`/admin/${path}`} className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm hover:bg-white/10">{label}<ArrowUpRight size={17} /></Link>)}
          <p className="mt-6 text-xs leading-6 text-white/65">Confidence của một ảnh không phải accuracy của toàn bộ mô hình.</p>
        </section>
      </div>
      <section className={card}>
        <div className="mb-5 flex items-center justify-between gap-3"><h3 className="font-semibold text-navy">Món ăn trong hệ thống</h3><Link className="text-sm text-secondary" to="/admin/foods">Xem tất cả →</Link></div>
        {data.foods.length === 0 ? <p className="text-sm text-muted">Chưa có món ăn. Thêm món đầu tiên trong mục quản lý món.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b border-line text-muted"><tr><th className="pb-3">Tên món</th><th>Danh mục</th><th>Khẩu phần</th><th>Năng lượng</th></tr></thead><tbody>{data.foods.slice(0, 5).map(food => <tr key={food.id} className="border-b border-line last:border-0"><td className="py-4 font-medium">{food.name}</td><td>{food.category?.name ?? data.categories.find(c => c.id === food.category?.id)?.name ?? 'Chưa phân loại'}</td><td>{food.baseServingG ?? '—'} g</td><td>{food.calories ?? '—'} kcal</td></tr>)}</tbody></table></div>}
        <p className="mt-4 text-xs text-muted">Hiển thị tối đa 5 món từ hệ thống. Dinh dưỡng tính theo khẩu phần chuẩn của từng món.</p>
      </section>
    </div>
  );
}
