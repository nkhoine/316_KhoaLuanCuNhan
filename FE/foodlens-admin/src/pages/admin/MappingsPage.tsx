import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import type { Food } from '../../api/types';

type LabelRow = {
  label: string; index: number; active: boolean; syncedAt: string;
  foods: { id: number; name: string }[];
};
type SyncResult = { total: number; added: number; existing: number; inactive: number };
const field = 'rounded-lg border border-line bg-white px-3 py-2 text-sm';

export default function MappingsPage() {
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true); setError('');
    try {
      const [nextLabels, nextFoods] = await Promise.all([
        api<LabelRow[]>('/admin/ai-labels'), api<Food[]>('/foods'),
      ]);
      setLabels(nextLabels); setFoods(nextFoods);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function sync() {
    if (busy || loading) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api<SyncResult>('/admin/ai-labels/sync', 'POST');
      setMessage(`Đã đồng bộ ${result.total} nhãn: ${result.added} mới, ${result.existing} đã có. ${result.inactive} nhãn không còn trong mô hình hiện tại.`);
      await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  async function assign(row: LabelRow) {
    const food = foods.find(f => String(f.id) === selected[row.label]);
    if (!food || busy) return;
    if (food.aiLabel && food.aiLabel !== row.label
        && !window.confirm(`${food.name} đang có nhãn ${food.aiLabel}. Đổi sang ${row.label}?`)) return;
    if (row.foods.length && !row.foods.some(f => f.id === food.id)
        && !window.confirm(`Nhãn ${row.label} đã gắn với món khác. Thêm món này sẽ khiến nhận diện trả nhiều ứng viên. Tiếp tục?`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await api(`/admin/ai-labels/${encodeURIComponent(row.label)}/foods/${food.id}`, 'PUT');
      setMessage(`Đã gắn ${row.label} với ${food.name}. Hãy nhận diện lại ảnh để kiểm tra.`);
      setSelected(old => ({...old, [row.label]: ''}));
      await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  async function detach(row: LabelRow, foodId: number) {
    if (busy || !window.confirm('Bỏ ánh xạ này? Món ăn và dinh dưỡng vẫn được giữ.')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await api(`/admin/ai-labels/${encodeURIComponent(row.label)}/foods/${foodId}`, 'DELETE');
      setMessage('Đã bỏ ánh xạ.'); await load();
    } catch(e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  const active = labels.filter(l => l.active);
  const unmapped = active.filter(l => !l.foods.length).length;
  const unknownFoods = foods.filter(f => f.aiLabel && !labels.some(l => l.label === f.aiLabel));
  const rows = labels.filter(l => `${l.label} ${l.foods.map(f => f.name).join(' ')}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))
    && (filter === 'ALL' || (filter === 'UNMAPPED' && l.active && !l.foods.length)
      || (filter === 'MAPPED' && l.active && l.foods.length > 0) || (filter === 'INACTIVE' && !l.active)));
  const pages = Math.max(1, Math.ceil(rows.length / 15));
  const current = Math.min(page, pages);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-bold text-navy">Ánh xạ nhãn AI</h2>
        <p className="mt-2 text-sm text-muted">Đồng bộ nhãn từ mô hình, sau đó chọn món có dữ liệu dinh dưỡng tương ứng.</p></div>
      <div className="flex gap-2">
        <button disabled={busy || loading} className={field} onClick={() => void load()}>Tải lại</button>
        <button disabled={busy || loading} className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" onClick={() => void sync()}>{busy ? 'Đang xử lý…' : 'Đồng bộ nhãn AI'}</button>
      </div>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">{message}</p>}
    {loading ? <p>Đang tải nhãn và món ăn…</p> : <>
      <div className="grid gap-3 sm:grid-cols-3">{[['Nhãn đang dùng', active.length], ['Đã gắn món', active.length-unmapped], ['Chưa gắn món', unmapped]].map(([name, count]) => <div key={name} className="rounded-xl border border-line bg-white p-4"><p className="text-sm text-muted">{name}</p><strong className="text-2xl text-navy">{count}</strong></div>)}</div>
      {!labels.length && !error && <p className="rounded-xl bg-chip p-4">Chưa có nhãn. Bật FastAPI rồi bấm “Đồng bộ nhãn AI”.</p>}
      {!!unknownFoods.length && !error && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Có {unknownFoods.length} món đang gắn nhãn chưa có trong danh sách: {unknownFoods.map(f => `${f.name} (${f.aiLabel})`).join(', ')}. Đồng bộ nhãn rồi kiểm tra lại.</p>}
      <div className="flex flex-wrap gap-3"><input aria-label="Tìm nhãn hoặc món" className={`${field} flex-1`} placeholder="Tìm nhãn hoặc tên món, ví dụ banh_xeo…" value={query} onChange={e => {setQuery(e.target.value);setPage(1);}} />
        <select aria-label="Lọc ánh xạ" className={field} value={filter} onChange={e => {setFilter(e.target.value);setPage(1);}}><option value="ALL">Tất cả</option><option value="UNMAPPED">Chưa gắn món</option><option value="MAPPED">Đã gắn món</option><option value="INACTIVE">Không còn trong mô hình</option></select>
      </div>
      <section className="overflow-auto rounded-2xl border border-line bg-white p-4"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr><th className="pb-3">Index / Nhãn</th><th>Món đã ánh xạ</th><th>Gắn với món có sẵn</th></tr></thead><tbody>
        {rows.slice((current-1)*15,current*15).map(row => <tr key={row.label} className="border-t border-line align-top">
          <td className="py-4 pr-4"><small className="text-muted">#{row.index}</small><p><code>{row.label}</code></p><small className={row.active ? 'text-green-700' : 'text-amber-700'}>{row.active ? 'Đang dùng' : 'Không còn trong mô hình'}</small></td>
          <td className="py-4 pr-4">{!row.foods.length ? <span className="text-amber-700">Chưa gắn món</span> : row.foods.map(f => <div key={f.id} className="mb-2">{f.name} <button disabled={busy} onClick={() => void detach(row,f.id)} className="ml-2 text-red-700 underline disabled:opacity-40">Bỏ gắn</button></div>)}{row.foods.length>1 && <p className="text-xs text-amber-700">Nhiều ứng viên — người dùng cần xác nhận.</p>}</td>
          <td className="py-4"><div className="flex gap-2"><select aria-label={`Chọn món cho ${row.label}`} disabled={busy || !row.active} className={`${field} max-w-[280px]`} value={selected[row.label] || ''} onChange={e => setSelected(old => ({...old,[row.label]:e.target.value}))}><option value="">Chọn món…</option>{foods.map(f => <option key={f.id} value={f.id}>{f.name}{f.aiLabel ? ` [${f.aiLabel}]` : ''}</option>)}</select>
            <button disabled={busy || !row.active || !selected[row.label]} onClick={() => void assign(row)} className="rounded-lg bg-navy px-3 py-2 text-white disabled:opacity-40">Gắn món</button></div></td>
        </tr>)}
        {!rows.length && <tr><td colSpan={3} className="py-8 text-center text-muted">Không có nhãn phù hợp.</td></tr>}
      </tbody></table></section>
      <div className="flex justify-between gap-3 text-sm"><span>{rows.length} nhãn · Trang {current}/{pages}</span><div className="flex gap-3"><button disabled={current===1} onClick={() => setPage(current-1)}>Trước</button><button disabled={current===pages} onClick={() => setPage(current+1)}>Sau</button></div></div>
    </>}
    <p className="text-sm text-muted">Chưa có món phù hợp? <Link to="/admin/foods" className="text-secondary underline">Thêm món và dinh dưỡng</Link>, sau đó quay lại đây và bấm Tải lại. Đồng bộ nhãn không tự tạo dữ liệu dinh dưỡng.</p>
  </div>;
}
