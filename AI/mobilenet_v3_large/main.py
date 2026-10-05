from fastapi import FastAPI, UploadFile, File
import torch
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import io
from ultralytics import YOLO

app = FastAPI(
    title="Food Recognition API",
    description="API kết hợp YOLOv8 và MobileNetV3 để nhận diện món ăn."
)

print("Đang tải các mô hình AI, vui lòng đợi...")

# ==========================================
# 1. TẢI MÔ HÌNH
# ==========================================
yolo_model = YOLO('best.pt')

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
# 2. ENDPOINT API
# ==========================================
@app.get("/labels")
def get_labels():
    return {
        "total": len(classes),
        "labels": [
            {
                "index": index,
                "label": classes[index]
            }
            for index in range(len(classes))
        ]
    }

@app.post("/predict")
async def predict_food(file: UploadFile = File(...)):
    # Đọc bytes từ file upload và chuyển thành PIL Image
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert('RGB')
    
    # Bước 1: YOLO phát hiện thức ăn
    results = yolo_model(img, verbose=False)
    boxes = results[0].boxes
    
    response_data = {
        "food_detected": False,
        "bounding_box": None,
        "predictions": []
    }
    
    if len(boxes) == 0:
        cropped_img = img
    else:
        # Lấy tọa độ Box có độ tự tin cao nhất
        best_box = boxes[0].xyxy[0].cpu().numpy()
        x1, y1, x2, y2 = map(int, best_box)
        cropped_img = img.crop((x1, y1, x2, y2))
        
        response_data["food_detected"] = True
        response_data["bounding_box"] = {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
    
    # Bước 2: Phân loại món ăn bằng MobileNetV3
    img_t = transform(cropped_img).unsqueeze(0)
    with torch.no_grad():
        out = mobilenet_model(img_t)
        probabilities = torch.nn.functional.softmax(out[0], dim=0)
    
    # Lấy top 3 kết quả có xác suất cao nhất
    top_prob, top_catid = torch.topk(probabilities, 3)
    
    for i in range(top_prob.size(0)):
        food_name = classes[top_catid[i].item()]
        confidence = float(top_prob[i].item()) * 100
        response_data["predictions"].append({
            "class": food_name,
            "confidence": round(confidence, 2)
        })
        
    return response_data