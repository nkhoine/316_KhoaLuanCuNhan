-- FOODLENS: MỘT FILE KHỞI TẠO LẠI DATABASE ĐỂ TEST LOCAL
-- Chạy toàn bộ file trong pgAdmin > database food_nutrition_db > Query Tool.
-- CẢNH BÁO: XÓA 6 BẢNG FOODLENS VÀ DỮ LIỆU CŨ. DROP CASCADE có thể xóa đối tượng phụ thuộc.
-- Backup trước nếu cần giữ dữ liệu. Không dùng script này để nâng cấp database thật.
-- Không cần chạy thêm 01_preflight.sql hay V2_foodlens.sql.
-- Tài khoản mẫu (chỉ để test local), mật khẩu chung: FoodLens123!
-- ADMIN: admin@huit.edu.vn
-- USER: khoihuynh@huit.edu.vn / testuser@gmail.com
-- Số dinh dưỡng giữ nguyên seed cũ, chưa xác minh nguồn.
-- Chất xơ chưa biết = NULL, không tự gán bằng 0.
-- Nhật ký mẫu được tạo theo CURRENT_DATE của PostgreSQL (Asia/Ho_Chi_Minh).
-- Sau khi chạy: đăng nhập FORM + cookie/CSRF theo bộ Postman đã gửi.

BEGIN;

DO $$
BEGIN
    IF current_database() <> 'food_nutrition_db' THEN
        RAISE EXCEPTION 'Hãy chọn database food_nutrition_db trong pgAdmin trước khi chạy.';
    END IF;
END $$;

SET LOCAL search_path TO public;
SET LOCAL TIME ZONE 'Asia/Ho_Chi_Minh';

-- ==========================================
-- PHẦN 0: XÓA BẢNG CŨ (NẾU CHẠY LẠI SCRIPT)
-- ==========================================
DROP TABLE IF EXISTS meal_log_details CASCADE;
DROP TABLE IF EXISTS meal_logs          CASCADE;
DROP TABLE IF EXISTS foods              CASCADE;
DROP TABLE IF EXISTS categories         CASCADE;
DROP TABLE IF EXISTS user_profiles      CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

-- ==========================================
-- PHẦN 1: MIGRATION (TẠO CẤU TRÚC BẢNG)
-- ==========================================

-- 1. Bảng Users (Tài khoản)
CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    full_name  VARCHAR(100),
    role       VARCHAR(20) DEFAULT 'USER',
    status     VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng User Profiles (Mục tiêu dinh dưỡng)
CREATE TABLE user_profiles (
    user_id         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    height_cm       FLOAT,
    weight_kg       FLOAT,
    goal            VARCHAR(50), 
    target_calories FLOAT,
    target_protein  FLOAT,
    target_carbs    FLOAT,
    target_fat      FLOAT
);

-- 3. Bảng Categories (Danh mục món ăn)
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

-- 4. Bảng Foods (Dữ liệu món ăn chuẩn)
CREATE TABLE foods (
    id             BIGSERIAL PRIMARY KEY,
    category_id    BIGINT REFERENCES categories(id),
    name           VARCHAR(255) NOT NULL,
    ai_label       VARCHAR(100), -- Cột ánh xạ với AI
    base_serving_g FLOAT DEFAULT 100.0,
    calories       FLOAT NOT NULL,
    protein        FLOAT NOT NULL,
    carbs          FLOAT NOT NULL,
    fat            FLOAT NOT NULL,
    image_url      VARCHAR(255)
);

-- 5. Bảng Meal Logs (Nhật ký bữa ăn theo ngày)
CREATE TABLE meal_logs (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT REFERENCES users(id) ON DELETE CASCADE,
    log_date       DATE NOT NULL,
    meal_type      VARCHAR(20), 
    total_calories FLOAT DEFAULT 0,
    total_protein  FLOAT DEFAULT 0,
    total_carbs    FLOAT DEFAULT 0,
    total_fat      FLOAT DEFAULT 0,
    UNIQUE(user_id, log_date, meal_type) 
);

-- 6. Bảng Meal Log Details (Chi tiết món ăn trong bữa)
CREATE TABLE meal_log_details (
    id                  BIGSERIAL PRIMARY KEY,
    meal_log_id         BIGINT REFERENCES meal_logs(id) ON DELETE CASCADE,
    food_id             BIGINT REFERENCES foods(id),
    consumed_weight_g   FLOAT NOT NULL,
    actual_calories     FLOAT NOT NULL,
    actual_protein      FLOAT NOT NULL,
    actual_carbs        FLOAT NOT NULL,
    actual_fat          FLOAT NOT NULL,
    ai_confidence_score FLOAT 
);

-- ==========================================
-- PHẦN 2: SEED DATA (ĐỔ DỮ LIỆU MẪU)
-- ==========================================

-- Seed Danh mục
INSERT INTO categories (name, description) VALUES 
    ('Món Cơm',       'Các loại cơm truyền thống Việt Nam'),
    ('Món Nước',      'Phở, bún, hủ tiếu, bánh canh...'),
    ('Ăn Vặt',        'Trà sữa, bánh tráng, chè...'),
    ('Món Bánh',      'Bánh mì, bánh xèo, gỏi cuốn...'),
    ('Món Xào & Canh','Các món xào, canh gia đình');

-- Seed Dữ liệu Món ăn chuẩn (Tính trên 100g)
INSERT INTO foods (category_id, name, base_serving_g, calories, protein, carbs, fat, image_url, ai_label) VALUES 
    -- Món Cơm (ID: 1)
    (1, 'Cơm tấm sườn nướng',   100.0, 255.0,  9.5, 35.2,  8.4, NULL, NULL),
    (1, 'Cơm chiên dương châu', 100.0, 190.0,  6.0, 28.0,  6.5, NULL, NULL),
    (1, 'Cơm gà xối mỡ',        100.0, 220.0,  8.5, 30.0,  7.5, NULL, NULL),
    -- Món Nước (ID: 2)
    (2, 'Phở bò chín',          100.0, 110.0,  5.2, 18.5,  2.1, NULL, 'pho'),
    (2, 'Bún bò Huế',           100.0, 125.0,  6.5, 17.0,  3.5, NULL, NULL),
    (2, 'Hủ tiếu Nam Vang',     100.0, 105.0,  5.0, 19.0,  1.5, NULL, NULL),
    (2, 'Bánh canh cua',        100.0, 115.0,  6.0, 20.0,  2.0, NULL, NULL),
    -- Ăn Vặt (ID: 3)
    (3, 'Trà sữa trân châu',    100.0,  90.0,  1.0, 18.0,  1.5, NULL, NULL),
    (3, 'Bánh tráng trộn',      100.0, 300.0,  4.0, 35.0, 15.0, NULL, NULL),
    (3, 'Pizza Hải Sản',        100.0, 266.0, 11.0, 33.0, 10.0, NULL, 'pizza'),
    -- Món Bánh (ID: 4)
    (4, 'Bánh mì thịt nướng',   100.0, 260.0, 10.0, 32.0,  9.0, NULL, NULL),
    (4, 'Bánh xèo',             100.0, 240.0,  7.0, 22.0, 13.0, NULL, NULL),
    (4, 'Gỏi cuốn',             100.0, 160.0,  8.0, 25.0,  3.0, NULL, NULL),
    -- Món Xào & Canh (ID: 5)
    (5, 'Bò xào hành tây',      100.0, 180.0, 15.0,  8.0, 10.0, NULL, NULL),
    (5, 'Canh chua cá lóc',     100.0,  45.0,  4.0,  5.0,  1.0, NULL, NULL),
    (5, 'Rau muống xào tỏi',    100.0,  80.0,  3.0,  5.0,  5.0, NULL, NULL),
    (5, 'Bò Bít Tết',           100.0, 250.0, 25.0,  0.0, 15.0, NULL, 'steak');

-- Seed Users 
INSERT INTO users (email, password, full_name, role) VALUES 
    ('admin@huit.edu.vn',     '$2b$10$p72u6aFxjosuXFEnexZ0Qe3RVtaLj6onzk9CzV6tfvu0gnd4XM0DK', 'Quản trị viên HUIT', 'ADMIN'),
    ('khoihuynh@huit.edu.vn', '$2b$10$T9x/R1TjKn8Js.JNW0K/aOsufF2a9UaF3nTHM10rZmYeEmRQVQPOS', 'Huỳnh Ngọc Khôi',    'USER'),
    ('testuser@gmail.com',    '$2b$10$zzSv8qI9/o1HxZ1butvKLeFKXRo8e5fFeTQY7LpL1biJTOfo26.4u', 'Người dùng Test',    'USER');

-- Seed User Profiles
INSERT INTO user_profiles (user_id, height_cm, weight_kg, goal, target_calories, target_protein, target_carbs, target_fat) VALUES 
    (2, 175.0, 68.0, 'GAIN_MUSCLE', 2500.0, 140.0, 300.0, 80.0),
    (3, 160.0, 55.0, 'LOSE_WEIGHT', 1500.0,  90.0, 150.0, 50.0);

-- Seed Meal Logs 
INSERT INTO meal_logs (user_id, log_date, meal_type, total_calories, total_protein, total_carbs, total_fat) VALUES 
    (2, CURRENT_DATE, 'BREAKFAST', 330.0, 15.6, 55.5,  6.3),
    (2, CURRENT_DATE, 'LUNCH',     510.0, 19.0, 70.4, 16.8);

-- Seed Meal Log Details
INSERT INTO meal_log_details (meal_log_id, food_id, consumed_weight_g, actual_calories, actual_protein, actual_carbs, actual_fat, ai_confidence_score) VALUES 
    (1, 4, 300.0, 330.0, 15.6, 55.5,  6.3, 0.95),
    (2, 1, 200.0, 510.0, 19.0, 70.4, 16.8, 0.88);

-- ==========================================
-- PHẦN 3: BỔ SUNG CẤU TRÚC & RÀNG BUỘC
-- ==========================================

-- Thêm các cột tương thích Backend Java mới
ALTER TABLE foods             ADD COLUMN IF NOT EXISTS fiber FLOAT;
ALTER TABLE meal_log_details  ADD COLUMN IF NOT EXISTS actual_fiber FLOAT;
ALTER TABLE meal_logs         ADD COLUMN IF NOT EXISTS total_fiber FLOAT;
ALTER TABLE user_profiles     ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE user_profiles     ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE user_profiles     ADD COLUMN IF NOT EXISTS activity_level VARCHAR(30);

-- Cập nhật NOT NULL cho các cột quan trọng
ALTER TABLE users 
    ALTER COLUMN role SET NOT NULL, 
    ALTER COLUMN status SET NOT NULL;
    
ALTER TABLE foods 
    ALTER COLUMN category_id SET NOT NULL, 
    ALTER COLUMN base_serving_g SET NOT NULL;
    
ALTER TABLE meal_logs 
    ALTER COLUMN user_id SET NOT NULL, 
    ALTER COLUMN meal_type SET NOT NULL;
    
ALTER TABLE meal_log_details 
    ALTER COLUMN meal_log_id SET NOT NULL, 
    ALTER COLUMN food_id SET NOT NULL;

-- Tạo Indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower ON users(lower(email));
CREATE INDEX IF NOT EXISTS ix_foods_category         ON foods(category_id);
CREATE INDEX IF NOT EXISTS ix_foods_ai_label         ON foods(ai_label);
CREATE INDEX IF NOT EXISTS ix_details_meal           ON meal_log_details(meal_log_id);

-- Thêm các ràng buộc an toàn dữ liệu (Check Constraints)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_users_role' AND conrelid='users'::regclass) THEN
        ALTER TABLE users ADD CONSTRAINT ck_users_role CHECK (role IN ('USER','ADMIN'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_users_status' AND conrelid='users'::regclass) THEN
        ALTER TABLE users ADD CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE','INACTIVE'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_food_serving' AND conrelid='foods'::regclass) THEN
        ALTER TABLE foods ADD CONSTRAINT ck_food_serving CHECK (base_serving_g > 0 AND base_serving_g < 100000);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_food_nutrients' AND conrelid='foods'::regclass) THEN
        ALTER TABLE foods ADD CONSTRAINT ck_food_nutrients CHECK (
            calories >= 0 AND calories < 1000000 AND 
            protein >= 0  AND protein < 1000000 AND 
            carbs >= 0    AND carbs < 1000000 AND 
            fat >= 0      AND fat < 1000000
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_food_fiber' AND conrelid='foods'::regclass) THEN
        ALTER TABLE foods ADD CONSTRAINT ck_food_fiber CHECK (fiber IS NULL OR (fiber >= 0 AND fiber < 1000000));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_meal_type' AND conrelid='meal_logs'::regclass) THEN
        ALTER TABLE meal_logs ADD CONSTRAINT ck_meal_type CHECK (meal_type IN ('BREAKFAST','LUNCH','DINNER','SNACK'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_detail_weight' AND conrelid='meal_log_details'::regclass) THEN
        ALTER TABLE meal_log_details ADD CONSTRAINT ck_detail_weight CHECK (consumed_weight_g >= 0.1 AND consumed_weight_g <= 10000);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_detail_confidence' AND conrelid='meal_log_details'::regclass) THEN
        ALTER TABLE meal_log_details ADD CONSTRAINT ck_detail_confidence CHECK (ai_confidence_score IS NULL OR (ai_confidence_score >= 0 AND ai_confidence_score <= 1));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_detail_nutrients' AND conrelid='meal_log_details'::regclass) THEN
        ALTER TABLE meal_log_details ADD CONSTRAINT ck_detail_nutrients CHECK (
            actual_calories >= 0 AND actual_calories < 1000000000 AND 
            actual_protein >= 0  AND actual_protein < 1000000000 AND 
            actual_carbs >= 0    AND actual_carbs < 1000000000 AND 
            actual_fat >= 0      AND actual_fat < 1000000000
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_detail_fiber' AND conrelid='meal_log_details'::regclass) THEN
        ALTER TABLE meal_log_details ADD CONSTRAINT ck_detail_fiber CHECK (actual_fiber IS NULL OR (actual_fiber >= 0 AND actual_fiber < 1000000000));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_profile_height' AND conrelid='user_profiles'::regclass) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT ck_profile_height CHECK (height_cm IS NULL OR (height_cm >= 30 AND height_cm <= 300));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_profile_weight' AND conrelid='user_profiles'::regclass) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT ck_profile_weight CHECK (weight_kg IS NULL OR (weight_kg >= 1 AND weight_kg <= 700));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_profile_gender' AND conrelid='user_profiles'::regclass) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT ck_profile_gender CHECK (gender IS NULL OR gender IN ('MALE','FEMALE','OTHER'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_profile_activity' AND conrelid='user_profiles'::regclass) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT ck_profile_activity CHECK (activity_level IS NULL OR activity_level IN ('SEDENTARY','LIGHT','MODERATE','ACTIVE','VERY_ACTIVE'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ck_profile_goals' AND conrelid='user_profiles'::regclass) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT ck_profile_goals CHECK (goal IS NULL OR goal IN ('LOSE_WEIGHT','MAINTAIN','GAIN_MUSCLE','GAIN_WEIGHT'));
    END IF;
END $$;

-- Cập nhật AI label cho Bún bò Huế
UPDATE foods SET ai_label = 'bun_bo_hue' 
WHERE name = 'Bún bò Huế' AND (ai_label IS NULL OR btrim(ai_label) = '');

-- Kiểm tra các mục tiêu nếu được cung cấp
ALTER TABLE user_profiles ADD CONSTRAINT ck_profile_targets CHECK (
    (target_calories IS NULL OR (target_calories >= 0 AND target_calories < 1000000)) AND
    (target_protein  IS NULL OR (target_protein >= 0  AND target_protein < 1000000)) AND
    (target_carbs    IS NULL OR (target_carbs >= 0    AND target_carbs < 1000000)) AND
    (target_fat      IS NULL OR (target_fat >= 0      AND target_fat < 1000000))
);

ALTER TABLE meal_logs ADD CONSTRAINT ck_meal_totals CHECK (
    total_calories >= 0 AND total_calories < 1000000000 AND
    total_protein  >= 0 AND total_protein < 1000000000 AND
    total_carbs    >= 0 AND total_carbs < 1000000000 AND
    total_fat      >= 0 AND total_fat < 1000000000 AND
    (total_fiber   IS NULL OR (total_fiber >= 0 AND total_fiber < 1000000000))
);

COMMIT;

-- ==========================================
-- PHẦN 4: KIỂM TRA KẾT QUẢ
-- ==========================================

-- Thống kê số lượng dòng trong mỗi bảng
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'user_profiles',    COUNT(*) FROM user_profiles
UNION ALL SELECT 'categories',       COUNT(*) FROM categories
UNION ALL SELECT 'foods',            COUNT(*) FROM foods
UNION ALL SELECT 'meal_logs',        COUNT(*) FROM meal_logs
UNION ALL SELECT 'meal_log_details', COUNT(*) FROM meal_log_details;

-- Danh sách User (Không trả password hash)
SELECT id, email, full_name, role, status 
FROM users 
ORDER BY id;

-- Chỉ tạo bảng nhãn; không sửa/xóa dữ liệu foods hoặc nhật ký.
BEGIN;
CREATE TABLE IF NOT EXISTS ai_labels (
    label VARCHAR(100) PRIMARY KEY,
    class_index INTEGER NOT NULL CHECK (class_index >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_labels_label_not_blank CHECK (length(trim(label)) > 0)
);
COMMIT;