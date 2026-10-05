# FoodLens — Kết nối Web Admin với Spring Boot

## 1. Phạm vi bản này

Bản này được sửa trực tiếp từ foodlens-admin(2).zip bạn gửi, đối chiếu với backend đã sửa trong phiên làm việc (AdminController, AuthController, FoodController, CategoryController, FoodRecognitionService và SecurityConfig).

Đã nối bằng dữ liệu API:

- Đăng nhập thật, đăng ký tài khoản USER, đăng xuất thật; khôi phục phiên khi F5.
- Xác định vai trò bằng GET /api/auth/me, không đoán vai trò từ email.
- Bảo vệ /admin bằng phiên và vai trò ADMIN. Backend vẫn là nơi thực thi phân quyền.
- Tổng quan: đếm món, danh mục, tài khoản; phân bố món theo danh mục.
- Danh mục: xem/thêm/sửa/xóa; backend từ chối xóa danh mục còn món.
- Món ăn: xem, lọc tên/nhãn ở trình duyệt, thêm/sửa/xóa; gửi category: {id}; có fiber nullable, aiLabel, imageUrl.
- Người dùng: tải danh sách thật, tìm kiếm, lọc trạng thái, sửa họ tên, khóa/mở khóa tài khoản USER; không cung cấp khóa ADMIN.
- Nhật ký: trong trang Người dùng, chọn “Sửa / Nhật ký”, chọn ngày để tải nhật ký của người đó qua API admin.
- Kiểm thử AI: upload JPEG/PNG qua Spring Boot, hiển thị top predictions, confidence theo %, món và dinh dưỡng ánh xạ, nhiều ứng viên hoặc không phát hiện món.
- Ánh xạ nhãn: đọc aiLabel từ món; sửa nhãn tại Món ăn & dinh dưỡng.

Chưa thể nối vì backend đã đối chiếu chưa có API tương ứng: dataset, quản lý phiên bản mô hình/train, báo cáo tổng hợp chuyên biệt, audit log hoạt động. Những trang đó tiếp tục thông báo chưa có kết nối; không tạo số liệu giả. “Lượt nhận diện” trên tổng quan để dấu —.

Các trang /app của người dùng chưa được tích hợp đầy đủ trong lần sửa admin này: tổng quan, nhật ký, mục tiêu và hồ sơ vẫn còn giao diện mẫu. Đăng nhập/đăng xuất dùng chung đã là thật. Hai request nhận diện và lưu món của trang nhận diện user cũng chuyển sang client chung, bỏ userId=2 để dùng người dùng từ session backend. Không xem đó là đã hoàn thiện toàn bộ luồng user/mobile.

## 2. Cách chạy nhanh trên Windows

1. Giải nén source ra một thư mục mới để giữ bản cũ đối chiếu.
2. Bật PostgreSQL và chạy Spring Boot ở cổng 8080 như lần test Postman đã thành công.
3. Giữ FastAPI ở cổng 8000 nếu cần test AI. Các chức năng CRUD/admin không yêu cầu bật FastAPI.
4. Trong backend, giữ dòng đúng:

```properties
foodlens.ai-url=http://localhost:8000/predict
spring.jpa.hibernate.ddl-auto=none
server.servlet.session.cookie.secure=false
```

`secure=false` dành cho localhost HTTP. Không thay security hiện tại, không tắt CSRF, không chạy lại SQL/reset DB cho thay đổi frontend này.

5. Mở terminal trong thư mục foodlens-admin chứa package.json:

```powershell
npm ci
npm run dev
```

6. Mở http://localhost:5173/auth và đăng nhập bằng tài khoản ADMIN trong DB mà bạn đã test Postman thành công. Tài khoản có chữ admin trong email nhưng role USER sẽ không được vào quản trị.
7. Đăng nhập thành công sẽ vào /admin/dashboard.

Không cần copy token CSRF từ Postman sang trình duyệt. Trình duyệt và Postman giữ cookie riêng; đăng nhập trong Postman không đăng nhập giúp website.

Nếu cổng 5173 đang được dùng, dừng Vite cũ trước. Bản này bật strictPort để không âm thầm chuyển cổng.

## 3. Luồng kết nối và nơi chỉnh URL

Mặc định:

```text
Trình duyệt gọi /api/... tại localhost:5173
Vite proxy chuyển /api/... tới localhost:8080
Spring Boot gọi http://localhost:8000/predict cho nhận diện
```

`vite.config.ts` có proxy /api. Không rewrite bỏ /api vì các controller Spring đều có tiền tố này.

- Backend đổi cổng: sửa target trong vite.config.ts, khởi động lại Vite.
- Không cần tạo .env khi chạy mặc định. Có .env.example để tham khảo.
- Nếu máy có .env hoặc .env.local cũ, kiểm tra VITE_API_BASE_URL. Mặc định mong muốn là /api.
- Nếu muốn gọi thẳng backend, đặt VITE_API_BASE_URL=http://localhost:8080/api rồi chạy lại Vite; backend phải cho phép đúng origin http://localhost:5173 và credentials trong CORS. Dùng cùng hostname localhost cho web và API, đừng trộn 127.0.0.1.
- Vite proxy này phục vụ `npm run dev`. Khi triển khai bản `dist`, cấu hình reverse proxy /api tới backend hoặc đặt URL API khi build và cấu hình CORS/HTTPS phù hợp. Không coi proxy dev là cấu hình hosting production.

`src/api/client.ts` quản lý:

1. credentials: include cho mọi request để gửi/nhận cookie phiên.
2. Trước mỗi POST/PUT/PATCH/DELETE, GET /auth/csrf để lấy token thuộc phiên hiện tại, lấy đúng tên headerName do server trả.
3. Login gửi application/x-www-form-urlencoded bằng URLSearchParams, không gửi JSON.
4. CRUD gửi JSON; upload gửi FormData và để trình duyệt tự đặt multipart boundary.
5. Logout gọi backend thật, nhận 204 không parse JSON rỗng.
6. Không tự gửi lại request ghi khi gặp 403 để tránh vô tình tạo dữ liệu trùng.
7. Không lưu password, session ID hoặc vai trò giả trong localStorage.

Cách lấy token mỗi lần ghi có thêm một request nhỏ nhưng đơn giản, tránh dùng token cũ sau login/logout. Các GET dữ liệu không cần token.

## 4. Những file chính cần đọc hoặc copy nếu không dùng cả project

| File | Công việc |
|---|---|
| src/api/client.ts (mới) | Fetch client: cookie, CSRF, JSON, FormData và thông báo lỗi |
| src/api/types.ts (mới) | Các kiểu response đúng với backend |
| src/auth/AuthContext.tsx (mới) | /me, login, logout và route guard |
| src/App.tsx | Bọc AuthProvider, bảo vệ route và thêm Ánh xạ nhãn |
| src/pages/AuthPage.tsx | Thay đăng nhập giả bằng API thật |
| src/components/AdminLayout.tsx | Hiện người đăng nhập và đăng xuất thật |
| src/pages/admin/AdminDashboard.tsx | Bỏ số liệu demo, dùng API |
| src/pages/admin/FoodsPage.tsx | Cookie/CSRF cho CRUD; fiber và dữ liệu biểu mẫu |
| src/pages/admin/UsersPage.tsx | Danh sách thật, sửa/khóa và nhật ký theo ngày |
| src/pages/admin/ModelTestPage.tsx | Upload ảnh và đọc hợp đồng AI mới |
| src/pages/admin/MappingsPage.tsx (mới) | Danh sách nhãn đang ánh xạ |
| vite.config.ts | Proxy backend ở cổng 8080 |
| .env.example | Ví dụ base URL |
| src/components/UserLayout.tsx | Đăng xuất chung đúng session, thông báo phần user chưa hoàn thiện |
| src/pages/user/UserRecognizePage.tsx | Hai request dùng client chung, bỏ userId cố định |
| tests/api-client.test.mjs (mới) | Kiểm tra hợp đồng HTTP bằng phản hồi giả lập |
| package.json | Thêm lệnh test:api |

LandingPage, UserDashboardPage, UserGoalsPage, UserOnboardingPage được bỏ các import không dùng để TypeScript build được. Không đổi chức năng các trang này.

Lưu ý có hai file tên AdminLayout trong source cũ. App.tsx đang dùng **src/components/AdminLayout.tsx**, không dùng src/pages/admin/AdminLayout.tsx.

## 5. Bảng endpoint đã nối

Đường dẫn bên dưới tính từ backend cổng 8080. Trên tab Network của web mặc định sẽ thấy cổng 5173 do proxy.

| Chức năng | Method | Endpoint | Body / query |
|---|---|---|---|
| CSRF | GET | /api/auth/csrf | Không |
| Đăng nhập | POST | /api/auth/login | Form email, password |
| Tài khoản hiện tại | GET | /api/auth/me | Không |
| Đăng ký | POST | /api/auth/register | JSON email, password, fullName |
| Đăng xuất | POST | /api/auth/logout | Không |
| Danh sách món | GET | /api/foods | Không; UI lọc trên danh sách đã tải |
| Tạo món | POST | /api/foods | FoodRequest |
| Sửa món | PUT | /api/foods/{id} | FoodRequest |
| Xóa món | DELETE | /api/foods/{id} | Không |
| Danh sách danh mục | GET | /api/categories | Không |
| Tạo danh mục | POST | /api/categories | name, description |
| Sửa danh mục | PUT | /api/categories/{id} | name, description |
| Xóa danh mục | DELETE | /api/categories/{id} | Không |
| Người dùng | GET | /api/admin/users | Không |
| Sửa họ tên | PATCH | /api/admin/users/{id} | {"fullName":"Tên mới"} |
| Khóa/mở khóa | PATCH | /api/admin/users/{id}/status | {"status":"INACTIVE"} hoặc ACTIVE |
| Nhật ký người dùng | GET | /api/admin/users/{id}/meal-logs | ?date=YYYY-MM-DD |
| Nhận diện | POST | /api/ai/recognize | multipart, file kiểu File |

Không gửi id người dùng vào các API cá nhân để giả danh. Chỉ endpoint admin dùng id người cần xem nhật ký.

Ví dụ FoodRequest (thay category.id bằng danh mục thực tế):

```json
{
  "name": "Món thử kết nối",
  "category": {"id": 1},
  "baseServingG": 100,
  "calories": 150,
  "protein": 10,
  "carbs": 20,
  "fat": 3,
  "fiber": null,
  "aiLabel": null,
  "imageUrl": null
}
```

Dinh dưỡng là lượng theo baseServingG, không mặc định mọi món đều 100 g. fiber=null là chưa biết, khác 0 g. Nhãn AI phải khớp chính xác chuỗi mô hình trả, ví dụ pho, bun_bo_hue.

## 6. Checklist test từng màn hình trên trình duyệt

Mở F12 → Network → Fetch/XHR, bật Preserve log. Xóa bộ lọc nếu không thấy request.

### A. Đăng nhập và phiên

1. Chưa login, truy cập /admin/dashboard: chuyển về /auth.
2. Nhập sai mật khẩu: /auth/login trả 401, hiện lỗi, không vào admin.
3. Đăng nhập ADMIN thật: GET csrf 200 → POST login 200 → GET me 200 và role ADMIN → trang Tổng quan.
4. F5 tại /admin/users: vẫn đăng nhập nếu session chưa hết hạn.
5. Bấm Đăng xuất: POST logout 204; vào lại /admin/dashboard phải quay về /auth.
6. Đăng nhập bằng USER: vào /app, nhập /admin/dashboard thủ công sẽ bị từ chối trên UI. Backend /api/admin/users cũng phải trả 403 khi dùng session USER (có thể xác minh bằng Postman với session USER riêng).
7. Dừng và khởi động backend; nếu phiên bị mất, tải lại web và đăng nhập lại. Không paste token Postman vào web.

### B. Danh mục và món

1. Món ăn & dinh dưỡng → tab Danh mục → thêm “Danh mục test kết nối”. Kỳ vọng POST categories 201.
2. F5: danh mục vẫn còn, chứng minh dữ liệu đã lưu backend.
3. Tab Món ăn → thêm “Món test kết nối” vào danh mục vừa tạo; khẩu phần 100 g, kcal 150, protein 10, carb 20, fat 3, fiber để trống. Kỳ vọng POST foods 201.
4. Tìm “Món test”; sửa fiber=2.5 và khẩu phần 150 g (đảm bảo các giá trị dinh dưỡng nhập theo khẩu phần đó); PUT foods/{id} trả 200. F5 kiểm tra lại.
5. Sửa món có imageUrl cũ mà chỉ thay kcal: imageUrl không bị mất.
6. Thử xóa danh mục đang chứa món: UI hoặc backend từ chối, không xóa nhầm.
7. Xóa món test chưa dùng trong nhật ký: DELETE foods/{id} 204. Sau đó xóa danh mục test: 204. Không dùng món/nhật ký thật để thử xóa.
8. Danh mục không có dữ liệu phải hiện trạng thái rỗng; nếu backend tắt phải hiện lỗi kết nối, không coi là dữ liệu thật bằng 0.

### C. Người dùng và nhật ký

1. Trang Người dùng: GET /admin/users 200, đối chiếu email với DB/Postman.
2. Chọn một tài khoản thử nghiệm USER → Sửa / Nhật ký → thay họ tên → PATCH users/{id} 200. F5 kiểm tra tên mới.
3. Khóa USER thử nghiệm → PATCH status INACTIVE 200. Thử đăng nhập tài khoản đó ở trình duyệt riêng/ẩn danh: backend phải từ chối. Mở khóa từ admin và thử đăng nhập lại.
4. Nút khóa ADMIN bị vô hiệu hóa; server cũng có chặn tương ứng.
5. Trong Sửa / Nhật ký, chọn ngày có bản ghi đã tạo từ Postman/mobile. GET /meal-logs?date=... 200; đối chiếu món, gram, kcal và tổng dinh dưỡng với Postman.
6. Đổi sang người dùng khác/ngày khác: không được hiển thị nhầm dữ liệu cũ. Ngày không có bản ghi hiện “Chưa có nhật ký”.
7. Admin chỉ xem nhật ký trong bản này; không có nút sửa nhật ký người khác.

### D. AI và nhãn

1. Bật FastAPI, chọn trang Kiểm thử mô hình, upload cùng ảnh đã test Postman.
2. Network: GET csrf 200 rồi POST /api/ai/recognize 200. FastAPI log POST /predict 200, không còn 307.
3. Nếu backend trả confidence=0.5846, UI hiện 58.46%, không hiện 5846%.
4. Nếu food_detected=false, hiện không phát hiện món; không hiện thông báo sai rằng đã nhận diện.
5. Nếu nhận diện nhưng nutrition_info=null: đọc message; mở Ánh xạ nhãn và xem món nào thiếu nhãn.
6. Trong Món ăn & dinh dưỡng, sửa món tương ứng với nhãn pho (không gắn tùy tiện nhãn sai). Nhận diện lại để kiểm tra nutrition_info.
7. Nếu nhiều món cùng nhãn, trang test hiển thị các ứng viên; không tự tuyên bố chỉ có một món đúng.
8. Dừng FastAPI rồi thử: web hiển thị lỗi backend; không đổi thành kết quả nhận diện thành công giả.

### E. Tổng quan

Sau khi thêm/xóa món/danh mục, quay lại Tổng quan hoặc bấm Làm mới số liệu. Số lượng phải khớp dữ liệu đã tải. Mục số người dùng gồm cả ADMIN; số lượt nhận diện chưa có thống kê thì để —.

## 7. Lỗi thường gặp

| Hiện tượng | Kiểm tra |
|---|---|
| /api trả HTML thay JSON | Có chạy npm run dev đúng source mới và proxy vite.config.ts chưa? |
| 401 | Cookie phiên chưa có/hết hạn; đăng nhập lại trên web |
| 403 | Kiểm tra role ADMIN, CSRF header và cookie; không tắt CSRF để né lỗi |
| 404 /api/admin/users | Backend đang chạy thiếu AdminController hoặc khác phiên bản đã đối chiếu |
| 400 khi lưu món | Xem message; category.id hợp lệ, gram > 0, dinh dưỡng không âm |
| 409 khi xóa | Dữ liệu đang được tham chiếu; xử lý theo message backend |
| 502 AI phản hồi rỗng | Kiểm tra URL Spring gọi /predict không có slash cuối, không phải link Markdown |
| ECONNREFUSED trong terminal Vite | Backend chưa chạy ở target localhost:8080 |
| Postman thành công nhưng web chưa login | Hai ứng dụng không dùng chung cookie phiên |
| Trang dataset/models/reports/activity chưa hoạt động | Chưa có API tương ứng; không phải lỗi cookie |

Nếu gặp lỗi, gửi method + URL + status + response trong Network và log Spring tương ứng. Không gửi cookie, CSRF token hoặc mật khẩu.

## 8. Kiểm tra chất lượng

```powershell
npm run build
npm run test:api
```

Bản cung cấp đã chạy thành công TypeScript/Vite production build và 7 kiểm tra client: cookie GET, login form/CSRF, token mới cho mutation, FormData không ép Content-Type, logout 204, xử lý 401 và không tự retry 403.

Các kiểm tra client dùng response giả lập để xác minh hợp đồng HTTP; chưa phải test kết nối PostgreSQL/Spring/FastAPI đang chạy trên máy bạn. Checklist ở mục 6 là bước xác nhận end-to-end tại máy bạn.
