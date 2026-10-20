import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../api/client';
import type { AdminUser, DailySummary } from '../../api/types';
import { Activity, Calendar, Clock, Flame, User, Utensils } from 'lucide-react';

interface FlattenedActivity {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  userStatus: string;
  date: string;
  mealType: string;
  foodName: string;
  weightG: number;
  calories: number;
  isAiAssisted?: boolean;
}

const card = 'rounded-2xl border border-line bg-white p-5 shadow-sm';
const field = 'rounded-xl border border-line bg-white px-3 py-2 text-sm';

import { useSearchParams } from 'react-router-dom';

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFromUrl = searchParams.get('date');
  const [date, setDate] = useState(() => dateFromUrl || todayIso());
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activities, setActivities] = useState<FlattenedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Cập nhật khi URL param date thay đổi
  useEffect(() => {
    if (dateFromUrl && dateFromUrl !== date) {
      setDate(dateFromUrl);
    }
  }, [dateFromUrl]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setSearchParams({ date: newDate });
  };

  async function loadData(targetDate = date) {
    setLoading(true);
    setError('');
    try {
      // 1. Lấy danh sách users thật từ DB
      const userList = await api<AdminUser[]>('/admin/users');
      setUsers(userList);

      // 2. Với các user, lấy nhật ký bữa ăn theo targetDate qua endpoint /admin/users/{id}/meal-logs?date=...
      const normalUsers = userList.filter(u => u.role === 'USER');
      const results = await Promise.allSettled(
        normalUsers.map(async (u) => {
          try {
            const summary = await api<DailySummary>(`/admin/users/${u.id}/meal-logs?date=${encodeURIComponent(targetDate)}`);
            return { user: u, summary };
          } catch {
            return null;
          }
        })
      );

      const items: FlattenedActivity[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled' && res.value && res.value.summary) {
          const { user, summary } = res.value;
          summary.meals?.forEach((meal) => {
            meal.items?.forEach((item) => {
              items.push({
                id: `${meal.mealLogId}-${item.id}`,
                userId: user.id,
                userName: user.fullName,
                userEmail: user.email,
                userStatus: user.status,
                date: summary.logDate,
                mealType: meal.mealType,
                foodName: item.foodName,
                weightG: item.consumedWeightG,
                calories: item.actualCalories,
              });
            });
          });
        }
      });

      setActivities(items);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const filteredActivities = activities.filter((act) => {
    const matchType = filterType === 'ALL' || act.mealType === filterType;
    const matchSearch =
      act.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.foodName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const totalCalories = filteredActivities.reduce((acc, curr) => acc + curr.calories, 0);
  const activeUserCount = new Set(filteredActivities.map((a) => a.userId)).size;

  const mealTypeLabels: Record<string, { label: string; color: string }> = {
    BREAKFAST: { label: 'Bữa sáng', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    LUNCH: { label: 'Bữa trưa', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    DINNER: { label: 'Bữa tối', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    SNACK: { label: 'Bữa phụ', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Giám sát hệ thống</p>
          <h2 className="mt-2 text-2xl font-bold text-navy">Nhật ký hoạt động (Audit Activity)</h2>
          <p className="mt-1 text-sm text-muted">
            Theo dõi trực tiếp các thao tác ghi nhận bữa ăn và tương tác người dùng theo ngày.
          </p>
        </div>
        <button
          onClick={() => void loadData(date)}
          disabled={loading}
          className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:bg-slate-50 transition"
        >
          {loading ? 'Đang cập nhật…' : 'Làm mới'}
        </button>
      </div>

      {/* Bộ lọc */}
      <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            <Calendar size={18} className="text-secondary" />
            Chọn ngày:
            <input
              type="date"
              className={field}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </label>

          <div className="h-6 w-px bg-line hidden sm:block"></div>

          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            Bữa ăn:
            <select
              className={field}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">Tất cả các bữa</option>
              <option value="BREAKFAST">Bữa sáng</option>
              <option value="LUNCH">Bữa trưa</option>
              <option value="DINNER">Bữa tối</option>
              <option value="SNACK">Bữa phụ</option>
            </select>
          </label>
        </div>

        <div>
          <input
            type="text"
            placeholder="Tìm người dùng, món ăn..."
            className={`${field} w-64`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Thống kê nhanh trong ngày */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className={card}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-secondary rounded-xl">
              <User size={22} />
            </div>
            <div>
              <p className="text-xs text-muted">Người dùng hoạt động</p>
              <strong className="text-2xl font-bold text-navy">{activeUserCount}</strong>
              <span className="text-xs text-muted ml-1">/ {users.length} tài khoản</span>
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Utensils size={22} />
            </div>
            <div>
              <p className="text-xs text-muted">Món được ghi</p>
              <strong className="text-2xl font-bold text-navy">{filteredActivities.length}</strong>
              <span className="text-xs text-muted ml-1">lượt món</span>
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Flame size={22} />
            </div>
            <div>
              <p className="text-xs text-muted">Tổng Calo ghi nhận</p>
              <strong className="text-2xl font-bold text-navy">
                {new Intl.NumberFormat('vi-VN').format(Math.round(totalCalories))}
              </strong>
              <span className="text-xs text-muted ml-1">kcal</span>
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-xs text-muted">Trạng thái dữ liệu</p>
              <strong className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Đồng bộ thật
              </strong>
              <span className="text-xs text-muted">Kết nối API Spring Boot</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Danh sách bản ghi */}
      <div className={`${card} overflow-hidden`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-navy flex items-center gap-2">
            <Clock size={18} className="text-secondary" />
            Nhật ký ghi nhận ({filteredActivities.length} dòng)
          </h3>
          <span className="text-xs text-muted">Dữ liệu thời gian thực từ cơ sở dữ liệu</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted">Đang truy xuất hoạt động nhật ký từ hệ thống…</div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-muted">
            Không tìm thấy hoạt động ghi nhận bữa ăn nào trong ngày {date}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-3 pt-1">Người dùng</th>
                  <th className="pb-3 pt-1">Bữa ăn</th>
                  <th className="pb-3 pt-1">Món ăn đã nạp</th>
                  <th className="pb-3 pt-1">Khối lượng</th>
                  <th className="pb-3 pt-1">Năng lượng</th>
                  <th className="pb-3 pt-1">Trạng thái tài khoản</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredActivities.map((act) => {
                  const mealMeta = mealTypeLabels[act.mealType] || { label: act.mealType, color: 'bg-slate-100 text-slate-800 border-slate-200' };
                  return (
                    <tr key={act.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-medium">
                        <div className="text-navy">{act.userName}</div>
                        <div className="text-xs text-muted">{act.userEmail}</div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${mealMeta.color}`}>
                          {mealMeta.label}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-navy">{act.foodName}</td>
                      <td className="py-3 text-muted">{act.weightG} g</td>
                      <td className="py-3 font-semibold text-secondary">{act.calories} kcal</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${act.userStatus === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${act.userStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {act.userStatus === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
