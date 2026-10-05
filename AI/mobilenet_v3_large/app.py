import gradio as gr
import torch
import torchvision.models as models
from torchvision import transforms
from PIL import Image, ImageDraw
from ultralytics import YOLO

print("Đang tải các mô hình AI, vui lòng đợi...")

# ==========================================
# 1. TẢI MÔ HÌNH YOLOv8 (Phát hiện vùng thức ăn)
# ==========================================
yolo_model = YOLO('best.pt')

# ==========================================
# 2. TẢI MÔ HÌNH MOBILENETV3 (Phân loại món ăn)
# ==========================================
mobilenet_path = 'mobilenet_v3_food_classifier_final.pt'
data = torch.load(mobilenet_path, map_location='cpu')
classes = data['classes']

mobilenet_model = models.mobilenet_v3_large(weights=None)
mobilenet_model.classifier[3] = torch.nn.Linear(mobilenet_model.classifier[3].in_features, len(classes))
mobilenet_model.load_state_dict(data['state_dict'])
mobilenet_model.eval()

# Tiền xử lý ảnh cho MobileNetV3
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ==========================================
# 3. HÀM DỰ ĐOÁN KẾT HỢP
# ==========================================
def predict_pipeline(img):
    if img is None:
        return None, None
    
    img = img.convert('RGB')
    
    # Bước 1: YOLO phát hiện thức ăn
    results = yolo_model(img, verbose=False)
    boxes = results[0].boxes
    
    if len(boxes) == 0:
        # Nếu YOLO không tìm thấy đồ ăn, vẫn đưa ảnh gốc vào MobileNet dự đoán thử
        cropped_img = img
        drawn_img = img
    else:
        # Lấy tọa độ Box có độ tự tin cao nhất
        best_box = boxes[0].xyxy[0].cpu().numpy()
        x1, y1, x2, y2 = map(int, best_box)
        
        # Cắt vùng ảnh có thức ăn
        cropped_img = img.crop((x1, y1, x2, y2))
        
        # Vẽ khung đỏ lên ảnh gốc để hiển thị cho người dùng
        drawn_img = img.copy()
        draw = ImageDraw.Draw(drawn_img)
        draw.rectangle([x1, y1, x2, y2], outline="red", width=5)
    
    # Bước 2: Phân loại món ăn bằng MobileNetV3 trên ảnh đã cắt (cropped_img)
    img_t = transform(cropped_img).unsqueeze(0)
    with torch.no_grad():
        out = mobilenet_model(img_t)
        probabilities = torch.nn.functional.softmax(out[0], dim=0)
    
    # Tạo từ điển kết quả
    result_dict = {classes[i]: float(probabilities[i]) for i in range(len(classes))}
    
    # Trả về: (Ảnh có vẽ khung YOLO, Biểu đồ xác suất của MobileNet)
    return drawn_img, result_dict

# ==========================================
# 4. GIAO DIỆN GRADIO
# ==========================================
demo = gr.Interface(
    fn=predict_pipeline,
    inputs=gr.Image(type="pil", label="Tải ảnh lên"), 
    outputs=[
        gr.Image(type="pil", label="Vùng thức ăn được phát hiện (YOLO)"),
        gr.Label(num_top_classes=3, label="Món ăn dự đoán (MobileNet)")
    ],
    title="🍲 AI Nhận Diện Ẩm Thực (YOLOv8 + MobileNetV3)",
    description="Hệ thống kết hợp YOLOv8 để định vị đĩa thức ăn và MobileNetV3 để phân loại chính xác 101 món ăn.",
    theme=gr.themes.Soft()
)

if __name__ == "__main__":
    demo.launch(share=True)