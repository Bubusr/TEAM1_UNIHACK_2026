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

## ▶️ Chạy PawVerse local (Slice 0)

### Yêu cầu

- Docker Desktop
- Python 3.11+
- Node.js 20+

### Cài đặt

Từ thư mục gốc repository:

```powershell
Copy-Item .env.example .env
python -m pip install -e ".\apps\api[test]"
npm install
```

### Khởi động dịch vụ local

```powershell
docker compose up -d
```

Docker Compose sẽ khởi động:

- Postgres 16 + pgvector tại `localhost:5432`
- Redis tại `localhost:6379`
- MinIO tại `localhost:9000`
- MinIO Console tại `localhost:9001`

### Chạy và kiểm tra API

```powershell
python -m uvicorn app.main:app --app-dir .\apps\api --reload --port 8000
```

Trong terminal khác:

```powershell
Invoke-WebRequest http://localhost:8000/health
python -m pytest .\apps\api\tests
```

### Chạy mobile app

```powershell
npm run dev:mobile
```

Slice 0 hiện cung cấp mobile app shell, API health endpoint, local infrastructure và database migration nền tảng. Camera capture và AI judge sẽ được triển khai ở Slice 1.
