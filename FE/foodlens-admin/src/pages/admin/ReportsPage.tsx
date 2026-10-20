import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import type { AdminReport } from '../../api/types';

const card = 'rounded-2xl border border-line bg-white p-5';
const field = 'rounded-xl border border-line bg-white px-3 py-2 text-sm';

function localIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBefore(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localIsoDate(date);
}

const formatNumber = (value: number | null, digits = 1) =>
  value == null
    ? 'Chưa có'
    : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(value);

const formatPercent = (value: number | null) =>
  value == null ? 'Chưa có' : `${formatNumber(value * 100, 1)}%`;

export default function ReportsPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => daysBefore(29));
  const [to, setTo] = useState(() => localIsoDate());
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextFrom = from, nextTo = to) {
    if (!nextFrom || !nextTo) {
      setError('Hãy chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (nextFrom > nextTo) {
      setError('Ngày bắt đầu không được sau ngày kết thúc.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ from: nextFrom, to: nextTo });
      setReport(await api<AdminReport>(`/admin/reports/overview?${query.toString()}`));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Chỉ tải tự động một lần khi mở trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  function preset(days: number) {
    const nextFrom = daysBefore(days - 1);
    const nextTo = localIsoDate();
    setFrom(nextFrom);
    setTo(nextTo);
    void load(nextFrom, nextTo);
  }

  const maxEntries = Math.max(1, ...(report?.dailyActivity.map(item => item.mealEntries) ?? [0]));
  const labelEvery = Math.max(1, Math.ceil((report?.dailyActivity.length ?? 1) / 10));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Thống kê quản trị</p>
        <h2 className="mt-2 text-2xl font-bold text-navy">Báo cáo hệ thống</h2>
        <p className="mt-2 text-sm text-muted">
          Tổng hợp người dùng và nhật ký dinh dưỡng trong khoảng thời gian đã chọn.
        </p>
      </div>

      <form onSubmit={submit} className={`${card} flex flex-wrap items-end gap-3`}>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              type="button"
              disabled={loading}
              className={field}
              onClick={() => preset(days)}
            >
              {days} ngày
            </button>
          ))}
        </div>
        <label className="text-sm">
          Từ ngày
          <input
            required
            type="date"
            className={`${field} ml-2`}
            value={from}
            onChange={event => setFrom(event.target.value)}
          />
        </label>
        <label className="text-sm">
          Đến ngày
          <input
            required
            type="date"
            className={`${field} ml-2`}
            value={to}
            onChange={event => setTo(event.target.value)}
          />
        </label>
        <button
          disabled={loading}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Đang tải…' : 'Áp dụng'}
        </button>
        <p className="w-full text-xs text-muted">Khoảng báo cáo tối đa 366 ngày.</p>
      </form>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}{' '}
          <button className="underline" onClick={() => void load()}>Thử lại</button>
        </div>
      )}

      {loading && !report && <p>Đang tải báo cáo…</p>}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Người dùng mới', formatNumber(report.summary.newUsers, 0), 'Tài khoản tạo trong kỳ'],
              ['Người hoạt động', formatNumber(report.summary.activeUsers, 0), 'Có ghi nhật ký'],
              ['Món đã ghi', formatNumber(report.summary.mealEntries, 0), 'Dòng chi tiết nhật ký'],
              ['Hỗ trợ bởi AI', formatNumber(report.summary.aiAssistedEntries, 0), 'Có lưu confidence'],
              ['Confidence TB', formatPercent(report.summary.averageAiConfidence), 'Chỉ các món có dùng AI'],
            ].map(([label, value, note]) => (
              <section key={label} className={card}>
                <p className="text-sm text-muted">{label}</p>
                <strong className="my-3 block text-3xl text-navy">{value}</strong>
                <p className="text-xs text-muted">{note}</p>
              </section>
            ))}
          </div>

          <section className={card}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-navy">Hoạt động theo ngày</h3>
                <p className="mt-1 text-xs text-muted">Chiều cao cột là số món được thêm vào nhật ký. Nhấp vào cột để xem chi tiết hoạt động của ngày đó.</p>
              </div>
              <span className="text-xs text-muted">{report.from} → {report.to}</span>
            </div>
            <div className="overflow-x-auto pb-2">
              <div
                className="flex h-64 items-end gap-2 border-b border-line px-2"
                style={{ minWidth: `${Math.max(720, report.dailyActivity.length * 18)}px` }}
              >
                {report.dailyActivity.map((item, index) => {
                  const height = item.mealEntries === 0 ? 0 : Math.max(8, item.mealEntries / maxEntries * 180);
                  const showLabel = index % labelEvery === 0 || index === report.dailyActivity.length - 1;
                  return (
                    <div
                      key={item.date}
                      onClick={() => navigate(`/admin/activity?date=${item.date}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/admin/activity?date=${item.date}`); }}
                      className="group flex h-full min-w-[12px] flex-1 flex-col items-center justify-end cursor-pointer rounded-t hover:bg-slate-50/80 transition-colors p-0.5"
                      title={`${item.date}: ${item.mealEntries} món, ${item.activeUsers} người dùng. Bấm để xem chi tiết hoạt động.`}
                    >
                      {item.mealEntries > 0 && (
                        <span className="mb-1 text-[10px] font-semibold text-muted group-hover:text-secondary group-hover:scale-110 transition-transform">
                          {item.mealEntries}
                        </span>
                      )}
                      <div
                        className="w-full max-w-8 rounded-t bg-secondary group-hover:bg-[#005bb5] group-hover:shadow-md transition-all"
                        style={{ height: `${height}px` }}
                      />
                      <span className="mt-2 h-5 whitespace-nowrap text-[10px] text-muted group-hover:text-navy group-hover:font-medium">
                        {showLabel ? `${item.date.slice(8, 10)}/${item.date.slice(5, 7)}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {!report.summary.mealEntries && (
              <p className="mt-4 text-sm text-muted">Chưa có nhật ký trong khoảng thời gian này.</p>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className={`${card} overflow-auto xl:col-span-2`}>
              <h3 className="mb-4 font-semibold text-navy">Top món được ghi nhận</h3>
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-line text-muted">
                  <tr>
                    <th className="pb-3">Món ăn</th>
                    <th>Số lần</th>
                    <th>Tổng khối lượng</th>
                    <th>Tỷ lệ hỗ trợ AI</th>
                  </tr>
                </thead>
                <tbody>
                  {report.popularFoods.map(food => (
                    <tr key={food.foodId} className="border-b border-line last:border-0">
                      <td className="py-4 font-medium">{food.foodName}</td>
                      <td>{formatNumber(food.entryCount, 0)}</td>
                      <td>{formatNumber(food.totalWeightG)} g</td>
                      <td>{food.entryCount ? formatNumber(food.aiAssistedCount / food.entryCount * 100) : 0}%</td>
                    </tr>
                  ))}
                  {!report.popularFoods.length && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted">Chưa có dữ liệu.</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className={card}>
              <h3 className="font-semibold text-navy">Dinh dưỡng trung bình</h3>
              <p className="mb-5 mt-1 text-xs text-muted">Trung bình trên mỗi người dùng/ngày có nhật ký.</p>
              <div className="space-y-4">
                {[
                  ['Năng lượng', report.averageNutrition.calories, 'kcal'],
                  ['Protein', report.averageNutrition.protein, 'g'],
                  ['Carbohydrate', report.averageNutrition.carbs, 'g'],
                  ['Chất béo', report.averageNutrition.fat, 'g'],
                  ['Chất xơ', report.averageNutrition.fiber, 'g'],
                ].map(([label, rawValue, unit]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-3 border-b border-line pb-3">
                    <span className="text-sm text-muted">{label}</span>
                    <strong>{formatNumber(rawValue as number | null)}{rawValue == null ? '' : ` ${unit}`}</strong>
                  </div>
                ))}
              </div>
              {report.averageNutrition.fiber == null && report.summary.mealEntries > 0 && (
                <p className="mt-4 text-xs text-amber-700">
                  Chất xơ chưa có vì nhật ký còn món thiếu dữ liệu chất xơ.
                </p>
              )}
            </section>
          </div>

          <p className="text-xs text-muted">
            “Hỗ trợ bởi AI” chỉ tính món đã được lưu vào nhật ký cùng confidence; không phải toàn bộ lượt gửi ảnh nhận diện.
          </p>
        </>
      )}
    </div>
  );
}
