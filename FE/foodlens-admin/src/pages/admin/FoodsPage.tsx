import { useState, useEffect } from 'react';
import { api, errorMessage } from '../../api/client';
import { Plus, Edit, X, Save, Trash2 } from 'lucide-react';

interface Category {
  id?: number;
  name: string;
  description: string;
}

interface Food {
  id?: number;
  name: string;
  categoryId?: number; // Dùng riêng để lưu state cho Form
  category?: Category; // Spring Boot trả về nguyên object category
  baseServingG: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  aiLabel: string | null;
  fiber: number | null;
  imageUrl?: string | null;
}

const INITIAL_FOOD_STATE: Food = {
  name: '',
  categoryId: undefined, 
  baseServingG: 100,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: null,
  imageUrl: '',
  aiLabel: ''
};

const INITIAL_CAT_STATE: Category = {
  name: '',
  description: ''
};

export default function FoodsPage() {
  const [activeTab, setActiveTab] = useState<'foods' | 'categories'>('foods');
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [modalMode, setModalMode] = useState<'none' | 'food' | 'category'>('none');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [foodFormData, setFoodFormData] = useState<Food>(INITIAL_FOOD_STATE);
  const [catFormData, setCatFormData] = useState<Category>(INITIAL_CAT_STATE);

  const API_FOODS_URL = '/foods';
  const API_CATEGORIES_URL = '/categories';

  useEffect(() => {
    fetchFoods();
    fetchCategories();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await api<Food[]>(API_FOODS_URL);
      setFoods(response);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api<Category[]>(API_CATEGORIES_URL);
      setCategories(response);
    } catch (error) {
      setError(errorMessage(error));
    }
  };

  // ================= HANDLERS CHO MÓN ĂN (FOOD) =================
  const handleAddNewFood = () => {
    setEditingId(null);
    setFoodFormData({ ...INITIAL_FOOD_STATE, categoryId: categories[0]?.id });
    setModalMode('food');
  };

  const handleEditFood = (food: Food) => {
    setEditingId(food.id!);
    setFoodFormData({ 
      ...food, 
      // Trích xuất ID đúng từ object category do Spring Boot trả về
      categoryId: food.category?.id || food.categoryId,
      aiLabel: food.aiLabel || '' 
    });
    setModalMode('food');
  };

  const handleFoodChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFoodFormData(prev => ({
      ...prev,
      [name]: ['name', 'aiLabel', 'imageUrl'].includes(name) ? value : name === 'fiber' && value === '' ? null : Number(value)
    }));
  };

  const handleSubmitFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      // Đóng gói lại thành object { id: ... } để Spring Boot map đúng khóa ngoại
      const payload = {
        name: foodFormData.name.trim(),
        baseServingG: foodFormData.baseServingG,
        calories: foodFormData.calories, protein: foodFormData.protein,
        carbs: foodFormData.carbs, fat: foodFormData.fat, fiber: foodFormData.fiber,
        imageUrl: foodFormData.imageUrl?.trim() || null,
        category: { id: foodFormData.categoryId },
        aiLabel: foodFormData.aiLabel && foodFormData.aiLabel.trim() !== '' ? foodFormData.aiLabel.trim() : null
      };

      if (editingId) {
        await api(`${API_FOODS_URL}/${editingId}`, 'PUT', payload);
        alert("Cập nhật món ăn thành công!");
      } else {
        await api(API_FOODS_URL, 'POST', payload);
        alert("Thêm món mới thành công!");
      }
      setModalMode('none');
      fetchFoods(); 
    } catch (error) {
      console.error("Lỗi khi lưu món ăn:", error);
      alert(errorMessage(error));
    } finally { setBusy(false); }
  };

  const handleDeleteFood = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa món này không?")) {
      try {
        await api(`${API_FOODS_URL}/${id}`, 'DELETE');
        fetchFoods();
      } catch (error) {
        console.error("Lỗi xóa món ăn:", error);
        alert(errorMessage(error));
      }
    }
  };

  // ================= HANDLERS CHO DANH MỤC (CATEGORY) =================
  const handleAddNewCategory = () => {
    setEditingId(null);
    setCatFormData(INITIAL_CAT_STATE);
    setModalMode('category');
  };

  const handleEditCategory = (cat: Category) => {
    setEditingId(cat.id!);
    setCatFormData(cat);
    setModalMode('category');
  };

  const handleCatChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCatFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (editingId) {
        await api(`${API_CATEGORIES_URL}/${editingId}`, 'PUT', { name: catFormData.name.trim(), description: catFormData.description });
        alert("Cập nhật danh mục thành công!");
      } else {
        await api(API_CATEGORIES_URL, 'POST', { name: catFormData.name.trim(), description: catFormData.description });
        alert("Thêm danh mục mới thành công!");
      }
      setModalMode('none');
      fetchCategories();
      fetchFoods();
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
      alert(errorMessage(error));
    } finally { setBusy(false); }
  };

  const handleDeleteCategory = async (id: number) => {
    // Đếm số món an bằng cách kiểm tra object category.id
    const foodsInThisCategory = foods.filter(f => (f.category?.id || f.categoryId) === id).length;
    
    if (foodsInThisCategory > 0) {
      alert(`KHÔNG THỂ XÓA!\nDanh mục này đang chứa ${foodsInThisCategory} món ăn.`);
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này không?")) {
      try {
        await api(`${API_CATEGORIES_URL}/${id}`, 'DELETE');
        fetchCategories();
      } catch (error) {
        console.error("Lỗi xóa danh mục:", error);
        alert(errorMessage(error));
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 relative">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error} <button onClick={() => { setError(''); setLoading(true); void fetchFoods(); void fetchCategories(); }} className="underline">Thử lại</button></p>}
      <input aria-label="Tìm món" placeholder="Tìm tên món hoặc nhãn AI…" value={query} onChange={e => setQuery(e.target.value)} className="rounded-xl border border-line p-3" />
      <div className="flex gap-3 items-start p-3 rounded-xl bg-chip border border-dashed border-line text-sm text-muted mb-2">
        <span className="text-xl">ℹ️</span>
        <div>
          <b className="text-text">Quản lý món ăn và dinh dưỡng</b>
          <br/>Dữ liệu được tải trực tiếp từ PostgreSQL thông qua Spring Boot API.
        </div>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-1 bg-bg-alt p-1 rounded-xl border border-line">
          <button 
            onClick={() => setActiveTab('foods')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'foods' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:bg-line/50'}`}
          >
            Món ăn
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'categories' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:bg-line/50'}`}
          >
            Danh mục
          </button>
        </div>

        {activeTab === 'foods' ? (
          <button disabled={!categories.length} title={!categories.length ? "Thêm danh mục trước" : undefined} onClick={handleAddNewFood} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy/90">
            <Plus size={16} /> Thêm món mới
          </button>
        ) : (
          <button onClick={handleAddNewCategory} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy/90">
            <Plus size={16} /> Thêm danh mục
          </button>
        )}
      </div>

      {activeTab === 'foods' ? (
        <div className="overflow-x-auto border border-line rounded-2xl bg-surface shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-bg-alt/50 border-b border-line">
              <tr>
                <th className="px-4 py-3 font-semibold">Tên món</th>
                <th className="px-4 py-3 font-semibold">Nhãn AI</th>
                <th className="px-4 py-3 font-semibold">Khẩu phần</th>
                <th className="px-4 py-3 font-semibold">Kcal</th>
                <th className="px-4 py-3 font-semibold">Macros (P/C/F)</th>
                <th className="px-4 py-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted">Đang tải dữ liệu...</td></tr>
              ) : foods.filter(food => `${food.name} ${food.aiLabel || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).map((food) => (
                <tr key={food.id} className="border-b border-line last:border-0 hover:bg-bg-alt/30">
                  <td className="px-4 py-3 font-semibold text-text">{food.name}</td>
                  <td className="px-4 py-3"><code className="bg-chip text-secondary px-2 py-1 rounded-md text-xs">{food.aiLabel || '—'}</code></td>
                  <td className="px-4 py-3 text-muted">{food.baseServingG}g</td>
                  <td className="px-4 py-3 font-bold">{food.calories}</td>
                  <td className="px-4 py-3 text-muted">{food.protein} / {food.carbs} / {food.fat} g<br />Xơ: {food.fiber == null ? "Chưa có" : `${food.fiber} g`}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEditFood(food)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:bg-bg-alt text-xs font-semibold">
                      <Edit size={14} /> Sửa
                    </button>
                    <button onClick={() => handleDeleteFood(food.id!)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !foods.filter(food => `${food.name} ${food.aiLabel || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).length && <tr><td colSpan={6} className="py-8 text-center text-muted">Không có món ăn phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line rounded-2xl bg-surface shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted uppercase bg-bg-alt/50 border-b border-line">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Tên danh mục</th>
                <th className="px-4 py-3 font-semibold">Mô tả</th>
                <th className="px-4 py-3 font-semibold">Số món</th>
                <th className="px-4 py-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted">Chưa có danh mục. Hãy thêm danh mục đầu tiên.</td></tr>
              ) : categories.map((cat) => {
                // Đếm đúng dựa trên object category
                const foodCount = foods.filter(f => (f.category?.id || f.categoryId) === cat.id).length;
                return (
                  <tr key={cat.id} className="border-b border-line last:border-0 hover:bg-bg-alt/30">
                    <td className="px-4 py-3 text-muted">{cat.id}</td>
                    <td className="px-4 py-3 font-semibold text-text">{cat.name}</td>
                    <td className="px-4 py-3 text-muted">{cat.description}</td>
                    <td className="px-4 py-3 font-bold text-navy">{foodCount}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleEditCategory(cat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line hover:bg-bg-alt text-xs font-semibold">
                        <Edit size={14} /> Sửa
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id!)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL THÊM/SỬA MÓN ĂN */}
      {modalMode === 'food' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-line bg-bg-alt/50">
              <h3 className="font-bold text-lg">{editingId ? 'Sửa món ăn' : 'Thêm món mới'}</h3>
              <button onClick={() => setModalMode('none')} className="text-muted hover:text-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitFood} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-1">Tên món ăn</label>
                  <input required name="name" maxLength={255} value={foodFormData.name} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Nhãn AI (Từ khóa)</label>
                  <input name="aiLabel" maxLength={100} value={foodFormData.aiLabel || ''} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Danh mục</label>
                  <select required name="categoryId" value={foodFormData.categoryId ?? ""} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary">
                    <option value="" disabled>Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Khẩu phần chuẩn (g)</label>
                  <input type="number" min="0.1" step="0.1" required max="10000" name="baseServingG" value={foodFormData.baseServingG} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Calories (Kcal)</label>
                  <input type="number" min="0" step="0.1" required name="calories" value={foodFormData.calories} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Protein (g)</label>
                  <input type="number" min="0" step="0.1" required name="protein" value={foodFormData.protein} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Carbs (g)</label>
                  <input type="number" min="0" step="0.1" required name="carbs" value={foodFormData.carbs} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Fat (g)</label>
                  <input type="number" min="0" step="0.1" required name="fat" value={foodFormData.fat} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Chất xơ (g), bỏ trống nếu chưa biết</label>
                  <input type="number" min="0" max="999999" step="0.1" name="fiber" value={foodFormData.fiber ?? ''} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">URL ảnh (tùy chọn)</label>
                  <input name="imageUrl" maxLength={255} value={foodFormData.imageUrl ?? ''} onChange={handleFoodChange} className="w-full px-3 py-2 rounded-lg border border-line" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-line">
                <button type="button" onClick={() => setModalMode('none')} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:bg-bg-alt">Hủy</button>
                <button disabled={busy} type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy/90">
                  <Save size={16} /> Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA DANH MỤC */}
      {modalMode === 'category' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-line bg-bg-alt/50">
              <h3 className="font-bold text-lg">{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
              <button onClick={() => setModalMode('none')} className="text-muted hover:text-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitCategory} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Tên danh mục</label>
                <input required name="name" value={catFormData.name} onChange={handleCatChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" placeholder="Vd: Món nước" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Mô tả danh mục</label>
                <textarea rows={3} name="description" value={catFormData.description ?? ''} onChange={handleCatChange} className="w-full px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-secondary" placeholder="Mô tả ngắn gọn..."></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-line">
                <button type="button" onClick={() => setModalMode('none')} className="px-4 py-2 rounded-xl text-sm font-semibold text-muted hover:bg-bg-alt">Hủy</button>
                <button disabled={busy} type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-navy text-white hover:bg-navy/90">
                  <Save size={16} /> Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}