import torch
import torchvision.models as models

file_path = 'mobilenet_v3_food_classifier_final.pt'
data = torch.load(file_path, map_location='cpu')

# 1. KIỂM TRA ĐỘ TIN CẬY (METRICS)
print("📊 ĐỘ TIN CẬY CỦA MÔ HÌNH (Lưu từ quá trình huấn luyện)")
print("-" * 50)
if 'metrics' in data:
    metrics = data['metrics']
    for key, value in metrics.items():
        # Xử lý hiển thị phần trăm cho các chỉ số đánh giá
        if isinstance(value, float) and value < 1.0 and key != 'loss':
            print(f"  * {key}: {value * 100:.2f}%")
        else:
            print(f"  * {key}: {value}")
else:
    print("Không tìm thấy metadata về metrics trong file này.")

# 2. KIỂM TRA SỐ LỚP CỦA MÔ HÌNH
print("\n🏗️ CẤU TRÚC VÀ SỐ LỚP CỦA MÔ HÌNH")
print("-" * 50)
classes = data['classes']
model = models.mobilenet_v3_large(weights=None)
model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, len(classes))

# Đếm tổng số lượng module (bao gồm các lớp chập, lớp pooling, lớp tuyến tính...)
total_modules = sum(1 for _ in model.modules())
print(f"Tổng số thành phần/lớp (modules) trong mạng: {total_modules} lớp")

# Đếm số lượng tham số (parameters) cần học
total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Tổng số tham số học được (Trainable Parameters): {total_params:,}")

# Ghi chú: Bỏ dấu '#' ở dòng dưới cùng nếu bạn muốn in toàn bộ kiến trúc chi tiết ra màn hình
# print(model)

from torchinfo import summary

print("\n📋 BẢNG TÓM TẮT KIẾN TRÚC MÔ HÌNH")
print("-" * 50)
# Giả lập đưa 1 tấm ảnh kích thước (3 màu RGB, rộng 224, cao 224) vào mô hình
summary(model, input_size=(1, 3, 224, 224), 
        col_names=["input_size", "output_size", "num_params", "kernel_size"],
        col_width=20,
        row_settings=["var_names"])