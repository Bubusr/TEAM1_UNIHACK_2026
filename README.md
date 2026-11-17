# TEAM 1 - UNIHACK 2026

Kho lưu trữ chính thức của **Team 1** tham gia cuộc thi **UNIHACK 2026**.

---

## 🌳 Cấu trúc phân nhánh (Git Branching Strategy)

Repository này được tổ chức theo mô hình phân tách các prototype độc lập trên từng nhánh riêng biệt nhằm tối ưu tốc độ thử nghiệm, tránh xung đột mã nguồn (merge conflicts) giữa các ý tưởng trong thời gian diễn ra Hackathon:

```text
main (Nhánh gốc — chỉ lưu tài liệu tổng quan & hướng dẫn chung)
├── prototype/busquest
├── prototype/focusgarden (hoặc prototype/mangnon)
└── prototype/petworld
```

### Chi tiết các nhánh

| Nhánh | Mục đích / Nội dung | Trạng thái |
|---|---|---|
| `main` | Nhánh tài liệu tổng hợp, quy chuẩn dự án, báo cáo và hướng dẫn chung. | Nhánh mặc định |
| `prototype/busquest` | Không gian phát triển prototype **BusQuest**. | Đang phát triển |
| `prototype/focusgarden` | Không gian phát triển prototype **FocusGarden** *(hoặc Măng Non)*. | Đang phát triển |
| `prototype/petworld` | Không gian phát triển prototype **PetWorld**. | Đang phát triển |

---

## 🚀 Hướng dẫn làm việc trong nhóm (Team Workflow)

### 1. Clone và đồng bộ mã nguồn
```bash
# Clone repo về máy (nếu chưa clone)
git clone https://github.com/Bubusr/TEAM1_UNIHACK_2026.git
cd TEAM1_UNIHACK_2026

# Cập nhật danh sách tất cả các nhánh từ remote
git fetch origin
```

### 2. Chuyển sang nhánh prototype cần làm việc
Chọn nhánh tương ứng với prototype bạn phụ trách:

```bash
# Đối với BusQuest:
git checkout prototype/busquest

# Đối với FocusGarden:
git checkout prototype/focusgarden

# Đối với PetWorld:
git checkout prototype/petworld
```

### 3. Làm việc và đẩy code lên GitHub
Khi làm việc trên nhánh prototype của mình:

```bash
# Kiểm tra trạng thái thay đổi
git status

# Thêm thay đổi vào staging
git add .

# Tạo commit theo chuẩn Conventional Commits
git commit -m "feat(busquest): thêm giao diện màn hình chính"

# Đẩy lên remote repository
git push origin <tên-nhánh>
# Ví dụ: git push -u origin prototype/busquest
```

---

## 📌 Quy ước chung (Conventions)

- **Nhánh `main`:** Giữ sạch, không commit trực tiếp code prototype vào nhánh này. Chỉ cập nhật tài liệu tổng hợp hoặc tài liệu thuyết trình/báo cáo chung của nhóm.
- **Commit Message:** Khuyến khích sử dụng tiền tố rõ ràng:
  - `feat:` Tính năng mới
  - `fix:` Sửa lỗi
  - `ui:` Cập nhật giao diện
  - `docs:` Bổ sung tài liệu
  - `refactor:` Tối ưu / tái cấu trúc mã nguồn
- **Dependencies & Môi trường:** Mỗi nhánh prototype cần có file cấu hình phụ thuộc riêng (như `package.json`, `requirements.txt`, ...) và file `README.md` riêng hướng dẫn cài đặt chạy thử cho prototype đó.

## ▶️ Chạy PawVerse / PetWorld local

### Yêu cầu

- Docker Desktop
- Python 3.11+
- Node.js 20+
- Expo Go trên điện thoại (nếu test bằng điện thoại)

### 1. Cài đặt

Từ thư mục gốc repository:

```powershell
Copy-Item .env.example .env
python -m pip install -e ".\apps\api[test]"
npm install
```

### 2. Khởi động dịch vụ Docker

```powershell
docker compose up -d
```

Các dịch vụ nền được cung cấp là:

- Postgres 16 + pgvector tại `localhost:5432`
- Redis tại `localhost:6379`
- MinIO tại `localhost:9000`
- MinIO Console tại `localhost:9001`

Docker không bắt buộc để chạy demo hiện tại vì API đang dùng demo state trong bộ nhớ. Nếu Docker Desktop báo `no configuration file provided`, hãy chạy lệnh từ thư mục gốc repository.

### 3. Chạy API

Mở terminal PowerShell thứ nhất:

```powershell
python -m uvicorn app.main:app --app-dir .\apps\api --reload --host 0.0.0.0 --port 8000
```

Kiểm tra API trong terminal thứ hai:

```powershell
Invoke-WebRequest http://localhost:8000/health
```

### 4. Chạy app trên PC

Mở terminal PowerShell thứ ba:

```powershell
npm run dev:mobile -- --web --port 8082
```

Mở `http://localhost:8082` trong trình duyệt. Dùng `localhost` để trình duyệt cho phép camera; camera thường bị chặn trên địa chỉ LAN dùng `http://`.

### 5. Chạy app trên điện thoại

1. Kết nối điện thoại và máy tính vào cùng một Wi-Fi.
2. Tìm địa chỉ IP LAN của máy tính bằng `ipconfig` (ví dụ `192.168.1.10`).
3. Trong PowerShell, thay địa chỉ IP bên dưới bằng IP của máy tính:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.10:8000"
npm run dev:mobile -- --lan --port 8082
```

4. Mở Expo Go trên điện thoại và quét QR code được hiển thị trong terminal hoặc trình duyệt Expo.

Nếu điện thoại không kết nối được, kiểm tra Windows Firewall cho Python/Node.js và đảm bảo port `8000` và `8082` không bị chặn.

### 6. Kiểm tra test và type

```powershell
python -m pytest .\apps\api\tests
npx tsc --noEmit -p .\apps\mobile\tsconfig.json
```

### 7. Dừng môi trường

Nhấn `Ctrl+C` ở các terminal đang chạy API/Expo. Dừng Docker bằng:

```powershell
docker compose down
```
