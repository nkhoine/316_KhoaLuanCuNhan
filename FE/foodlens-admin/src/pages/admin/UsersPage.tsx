import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, errorMessage } from '../../api/client';
import type { AdminUser, DailySummary } from '../../api/types';
const field = 'rounded-xl border border-line bg-white px-3 py-2';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
function Diary({ user }: { user: AdminUser }) {
 const [date, setDate] = useState(today);
 const [data, setData] = useState<DailySummary | null>(null);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 useEffect(() => {
  let active = true; setData(null); setError('');
  if (!date) { setLoading(false); return; }
  setLoading(true);
  api<DailySummary>(`/admin/users/${user.id}/meal-logs?date=${encodeURIComponent(date)}`)
   .then(value => { if(active) setData(value); }).catch(e => { if(active) setError(errorMessage(e)); })
   .finally(() => { if(active) setLoading(false); });
  return () => { active = false; };
 }, [user.id, date]);
 return <section className="mt-5 rounded-xl border border-line p-5">
  <h3 className="font-bold">Nhật ký của {user.fullName}</h3>
  <label className="my-3 block">Ngày <input aria-label="Ngày nhật ký" type="date" className={field} value={date} onChange={e => setDate(e.target.value)} /></label>
  {loading && <p>Đang tải nhật ký…</p>}{error && <p role="alert" className="text-red-700">{error}</p>}
  {data && <><p className="mb-4">Tổng: {data.totalDailyCalories} kcal · Protein {data.totalDailyProtein} g · Carb {data.totalDailyCarbs} g · Fat {data.totalDailyFat} g · Xơ {data.totalDailyFiber ?? 'Chưa có'}{data.totalDailyFiber != null && ' g'}{!data.fiberComplete && ' (thiếu dữ liệu chất xơ)'}</p>
   {!data.meals?.length && <p>Chưa có nhật ký trong ngày này.</p>}
   {data.meals?.map(meal => <div key={meal.mealLogId} className="mb-4 overflow-auto"><h4 className="font-semibold">{meal.mealType} · {meal.mealCalories} kcal</h4>
    <table className="w-full min-w-[600px] text-left text-sm"><thead><tr>{['Món','Gram','Kcal','Protein','Carb','Fat','Xơ'].map(x => <th key={x} className="py-2">{x}</th>)}</tr></thead>
    <tbody>{meal.items.map(item => <tr key={item.id} className="border-t border-line"><td className="py-2">{item.foodName}</td><td>{item.consumedWeightG}</td><td>{item.actualCalories}</td><td>{item.actualProtein}</td><td>{item.actualCarbs}</td><td>{item.actualFat}</td><td>{item.actualFiber ?? 'Chưa có'}</td></tr>)}</tbody></table>
   </div>)}
  </>}
 </section>;
}
export default function UsersPage() {
 const [users, setUsers] = useState<AdminUser[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(''); const [message, setMessage] = useState('');
 const [busy, setBusy] = useState(false); const [query, setQuery] = useState('');
 const [selected, setSelected] = useState<AdminUser | null>(null); const [name, setName] = useState('');
 const [status, setStatus] = useState('ALL'); const [page, setPage] = useState(1);
 async function load() { setLoading(true); setError(''); try {setUsers(await api<AdminUser[]>('/admin/users'));} catch(e){setError(errorMessage(e));} finally{setLoading(false);} }
 useEffect(() => { void load(); }, []);
 async function update(user: AdminUser, toggle: boolean) {
  if (busy) return;
  if(toggle && !confirm(`${user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'} tài khoản ${user.email}?`)) return;
  setBusy(true); setError(''); setMessage('');
  try {
   const next = await api<AdminUser>(`/admin/users/${user.id}${toggle ? '/status' : ''}`, 'PATCH', toggle ? {status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'} : {fullName: name.trim()});
   setUsers(old => old.map(u => u.id === next.id ? next : u));
   if(selected?.id === next.id) setSelected(next);
   setMessage('Đã cập nhật tài khoản.');
  } catch(e) {setError(errorMessage(e));} finally {setBusy(false);}
 }
 function save(e: FormEvent) {e.preventDefault(); if(selected && name.trim()) void update(selected, false);}
 const filtered = users.filter(u => `${u.fullName} ${u.email}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')) && (status === 'ALL' || u.status === status));
 const pages = Math.max(1, Math.ceil(filtered.length/10)); const current = Math.min(page,pages);
 return <div className="space-y-5"><h2 className="text-2xl font-bold text-navy">Quản lý người dùng</h2>
  {error && <p role="alert" className="bg-red-50 p-3 text-red-700">{error}</p>}{message && <p role="status" className="bg-green-50 p-3">{message}</p>}
  <div className="flex flex-wrap gap-3"><input aria-label="Tìm người dùng" className={field} placeholder="Tên hoặc email…" value={query} onChange={e => {setQuery(e.target.value);setPage(1);}} />
   <select aria-label="Trạng thái" className={field} value={status} onChange={e => {setStatus(e.target.value);setPage(1);}}><option value="ALL">Mọi trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Đã khóa</option></select>
   <button disabled={busy} className={field} onClick={() => void load()}>Làm mới</button></div>
  {loading ? <p>Đang tải…</p> : <section className="rounded-2xl border border-line bg-white p-5 overflow-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr><th>Họ tên / Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
   {filtered.slice((current-1)*10,current*10).map(user => <tr key={user.id} className="border-b border-line"><td className="py-4">{user.fullName}<p className="text-muted">{user.email}</p></td><td>{user.role}</td><td>{user.status}</td><td className="space-x-3"><button disabled={busy} className="text-secondary underline" onClick={() => {setSelected(user);setName(user.fullName);}}>Sửa / Nhật ký</button><button disabled={busy || user.role === 'ADMIN'} className="text-red-700 disabled:opacity-40" onClick={() => void update(user,true)}>{user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</button></td></tr>)}
   {!filtered.length && <tr><td colSpan={4} className="py-8">Không có người dùng phù hợp.</td></tr>}
  </tbody></table><div className="mt-4 flex gap-4"><button disabled={current===1} onClick={() => setPage(current-1)}>Trước</button><span>{current}/{pages} · {filtered.length} tài khoản</span><button disabled={current===pages} onClick={() => setPage(current+1)}>Sau</button></div></section>}
  {selected && <section className="rounded-2xl bg-white border border-line p-5"><form onSubmit={save} className="flex flex-wrap items-end gap-3"><label>Họ tên<input required maxLength={100} className={`${field} block`} value={name} onChange={e => setName(e.target.value)} /></label><button disabled={busy} className={field}>Lưu họ tên</button><button type="button" disabled={busy} className={field} onClick={() => setSelected(null)}>Đóng</button></form><Diary key={selected.id} user={selected} /></section>}
 </div>;
}
