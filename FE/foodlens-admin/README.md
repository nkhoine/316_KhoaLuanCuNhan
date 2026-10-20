# 🍜 FoodLens Web (Admin + User)

Giao diện web của hệ thống **FoodLens**: nhận diện món ăn Việt Nam bằng AI và theo dõi dinh dưỡng.
Gồm hai khu vực:

- **Admin** (`/admin`): quản lý món ăn, danh mục, người dùng, ánh xạ nhãn AI và kiểm thử mô hình.
- **User** (`/app`): nhận diện món ăn, nhật ký ăn uống, mục tiêu, hồ sơ cá nhân.

> Hướng dẫn chi tiết về kết nối backend, endpoint và checklist test: xem [HUONG-DAN-KET-NOI-ADMIN.md](./HUONG-DAN-KET-NOI-ADMIN.md).

---

## 🧱 Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 3 + PostCSS |
| Icon | lucide-react |
| Lint | oxlint |

## 🏗️ Kiến trúc hệ thống

```text
Trình duyệt (localhost:5173)
   │  /api/...  (Vite proxy)
   ▼
Spring Boot (localhost:8080)  ──►  PostgreSQL
   │  /predict
   ▼
FastAPI – mô hình AI (localhost:8000)
```

- Xác thực bằng **session cookie** + **CSRF token** (không dùng JWT, không lưu mật khẩu/vai trò vào localStorage).
- Vai trò người dùng lấy từ `GET /api/auth/me`; backend vẫn là nơi thực thi phân quyền.

## 📁 Cấu trúc thư mục

```text
src/
├── api/
│   ├── client.ts        # Fetch client: cookie, CSRF, JSON/FormData, xử lý lỗi
│   ├── types.ts         # Kiểu dữ liệu response từ backend
│   └── user.ts          # API phía người dùng
├── auth/
│   └── AuthContext.tsx  # AuthProvider, useAuth, RequireAuth (route guard)
├── components/
│   ├── AdminLayout.tsx  # Layout admin (layout đang được App.tsx sử dụng)
│   ├── UserLayout.tsx   # Layout người dùng
│   └── user/            # FoodPicker, ProfileEditor, UI dùng chung, theme
├── pages/
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx     # Đăng nhập / đăng ký
│   ├── admin/           # Dashboard, Foods, Users, Mappings, ModelTest, Reports
│   └── user/            # Dashboard, Recognize, Diary, Goals, Profile, Onboarding
├── App.tsx              # Khai báo route
└── main.tsx
tests/
└── api-client.test.mjs  # Kiểm thử hợp đồng HTTP của client
```

## 🔐 Xác thực (`src/auth/AuthContext.tsx`)

| Export | Chức năng |
|---|---|
| `AuthProvider` | Tải phiên hiện tại qua `/auth/me` khi khởi động; cung cấp `user`, `loading`, `error`, `reload`, `login`, `logout`. Tự đăng xuất khi nhận sự kiện `foodlens:unauthorized`. |
| `useAuth()` | Hook lấy context xác thực (báo lỗi nếu thiếu `AuthProvider`). |
| `RequireAuth` | Route guard: chưa đăng nhập → chuyển `/auth`; `admin` = true mà role khác `ADMIN` → từ chối truy cập. |

Luồng đăng nhập: `GET /auth/csrf` → `POST /auth/login` (form-urlencoded) → `GET /auth/me`.

## 🗺️ Các route chính

| Route | Mô tả | Quyền |
|---|---|---|
| `/` | Landing page | Công khai |
| `/auth` | Đăng nhập / Đăng ký tài khoản (có kiểm tra khớp xác nhận mật khẩu) | Công khai |
| `/app/dashboard`, `/recognize`, `/diary`, `/goals`, `/profile`, `/onboarding` | Khu vực người dùng | Đã đăng nhập |
| `/admin/dashboard` | Tổng quan số liệu | ADMIN |
| `/admin/users` | Quản lý người dùng, khóa/mở khóa, xem nhật ký | ADMIN |
| `/admin/foods` | CRUD món ăn & danh mục, dinh dưỡng | ADMIN |
| `/admin/mappings` | Ánh xạ nhãn AI ↔ món ăn | ADMIN |
| `/admin/model-test` | Upload ảnh kiểm thử mô hình AI | ADMIN |
| `/admin/reports` | Báo cáo tổng hợp số liệu, biểu đồ ngày, top món ăn, dinh dưỡng TB | ADMIN |
| `/admin/activity` | Giám sát nhật ký hoạt động bữa ăn của người dùng theo thời gian thực | ADMIN |
| `/admin/datasets`, `/models` | Đang phát triển (chưa có API) | ADMIN |

## 🚀 Cài đặt & chạy

### Yêu cầu
- Node.js 20+
- Backend Spring Boot chạy ở cổng `8080` (kèm PostgreSQL `food_nutrition_db`)
- FastAPI ở cổng `8000` (chỉ cần khi test nhận diện AI)

### Các bước

```powershell
npm ci
npm run dev
```

Mở http://localhost:5173/auth và đăng nhập bằng tài khoản **ADMIN** có trong DB (ví dụ: `admin@huit.edu.vn` / `FoodLens123!`).
Cổng 5173 được đặt `strictPort` — nếu bị chiếm, hãy tắt tiến trình Vite cũ.

### Biến môi trường (tùy chọn)

Không cần `.env` khi chạy mặc định. Tham khảo `.env.example`:

```env
VITE_API_BASE_URL=/api
```

Muốn gọi thẳng backend: đặt `VITE_API_BASE_URL=http://localhost:8080/api` và cấu hình CORS cho origin `http://localhost:5173` có credentials.

Đổi cổng backend: sửa `target` của proxy trong [vite.config.ts](./vite.config.ts).

## 📜 Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server (có proxy `/api`) |
| `npm run build` | Type-check + build production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run lint` | Kiểm tra code bằng oxlint |
| `npm run test:api` | Chạy test hợp đồng HTTP của API client |

## 🌐 Triển khai

Proxy của Vite chỉ dùng cho môi trường dev. Khi deploy thư mục `dist/`, cần cấu hình reverse proxy `/api` tới backend (hoặc đặt `VITE_API_BASE_URL` lúc build) và bật HTTPS/CORS phù hợp.

## ⚠️ Giới hạn hiện tại

- Các trang dataset và quản lý phiên bản mô hình chưa có API backend tương ứng.
- Một số trang khu vực `/app` vẫn đang hoàn thiện giao diện và tính năng.
- Số "lượt nhận diện" trên tổng quan hiển thị `—` do chưa có bảng audit log riêng cho mọi request AI không lưu nhật ký.

## 🛠️ Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| `/api` trả về HTML | Chưa chạy `npm run dev` hoặc proxy sai |
| 401 | Phiên hết hạn → đăng nhập lại |
| 403 | Không phải ADMIN hoặc thiếu CSRF/cookie |
| `ECONNREFUSED` | Backend chưa chạy ở `localhost:8080` |
| Postman đăng nhập được nhưng web chưa | Postman và trình duyệt không dùng chung cookie |

Xem thêm mục "Lỗi thường gặp" trong [HUONG-DAN-KET-NOI-ADMIN.md](./HUONG-DAN-KET-NOI-ADMIN.md).
