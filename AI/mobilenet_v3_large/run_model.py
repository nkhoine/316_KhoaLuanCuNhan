import torch
import torchvision.models as models
from torchvision import transforms
from PIL import Image

# 1. Đường dẫn file
file_path = 'mobilenet_v3_food_classifier_final.pt'
image_path = 'test.jpg'  # Đổi tên này thành file ảnh thực tế của bạn

# 2. Tải cấu hình và khởi tạo mô hình
data = torch.load(file_path, map_location=torch.device('cpu'))
classes = data['classes']

model = models.mobilenet_v3_large(weights=None)
model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, len(classes))
model.load_state_dict(data['state_dict'])
model.eval()

# 3. Khai báo quy trình xử lý ảnh (chuẩn cho MobileNetV3)
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# 4. Đọc ảnh và nhận diện
try:
    print(f"Đang xử lý ảnh: {image_path}...")
    # Mở ảnh và chuyển về hệ màu RGB (đề phòng ảnh PNG có nền trong suốt)
    img = Image.open(image_path).convert('RGB')
    
    # Tiền xử lý ảnh và thêm chiều batch: từ [C, H, W] -> [1, C, H, W]
    img_t = transform(img)
    batch_t = torch.unsqueeze(img_t, 0)

    # Đưa vào mô hình dự đoán (tắt tính toán đạo hàm để suy luận nhanh hơn)
    with torch.no_grad():
        out = model(batch_t)
        
        # Chuyển đổi đầu ra thành xác suất phần trăm (Softmax)
        probabilities = torch.nn.functional.softmax(out[0], dim=0)
    
    # Lấy ra vị trí có xác suất cao nhất
    max_prob, index = torch.max(probabilities, 0)
    predicted_class = classes[index.item()]
    confidence = max_prob.item() * 100

    print("-" * 30)
    print(f"🍽️ Kết quả nhận diện: {predicted_class}")
    print(f"📊 Độ tự tin: {confidence:.2f}%")
    print("-" * 30)

except FileNotFoundError:
    print(f"Lỗi: Không tìm thấy file ảnh '{image_path}'. Vui lòng copy 1 ảnh vào thư mục và kiểm tra lại tên.")
except Exception as e:
    print(f"Có lỗi xảy ra: {e}")