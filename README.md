# 🎋 MĂNG NON — UniHack 2026 (Team 1)

> **"Không gian nuôi dưỡng sinh linh đồng hành học tập độc lập & sức mạnh cộng đồng trên nền tảng Avalanche"**

[![Avalanche](https://img.shields.io/badge/Blockchain-Avalanche_Fuji_&_L1-E84142?logo=avalanche)](https://avax.network)
[![Solidity](https://img.shields.io/badge/Smart_Contracts-Solidity_0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-000000?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 1. Cốt Truyện & Ý Tưởng (Lore & Theme)

Lấy cảm hứng từ hai truyền thuyết văn hóa:
- **Thánh Gióng:** Sinh linh được nuôi dưỡng và lớn lên nhờ sự chung tay của cả cộng đồng; sức mạnh cá nhân cuối cùng quay lại bảo vệ và nuôi dưỡng cộng đồng.
- **Công chúa Kaguya:** Sinh linh kỳ diệu được tìm thấy trong ống tre phát sáng giữa rừng đêm.

### 🌟 3 Vùng Đất Tâm Hồn trong Game
1. **🌿 Rừng Tre Cổ (Không gian cá nhân):** Nơi Măng Non được sinh ra và lớn lên. Cảnh vật chuyển biến theo thời gian thực (ngày/đêm). Người chơi trò chuyện, tâm sự điều vừa học và trả lời quiz nhẹ nhàng. Ống nứa phát sáng xuất hiện ngẫu nhiên mang lại phước lành cổ xưa.
2. **🏛️ Làng Phù Đổng (Không gian cộng đồng):** Nơi tọa lạc **Cây Làng Phù Đổng** khổng lồ trên Avalanche C-Chain. Tích lũy năng lượng từ mock-yield Mầm Lực Vault và các nhà tài trợ CSR. Khi đạt ngưỡng, Cây Làng bùng nổ ban phước hào quang cho toàn bộ Măng Non đang sống.
3. **🌸 Vườn Ký Ức (Bảo tàng cá nhân):** Nơi lưu giữ các Măng Non đã hoàn thành mục tiêu (An nghỉ). Mỗi sinh linh trở thành một **NFT Hành Trình (ERC-721)** ghi nhận vĩnh viễn trên blockchain.
4. **🏮 Trạm Tre (Đối tác đời thực):** Quán cà phê và trung tâm giáo dục đối tác. Check-in GPS bảo vệ privacy để nhận voucher ưu đãi thực tế.

---

## 🧠 2. Bản Chất Măng Non & AI Companion

- **Đảo ngược vai trò:** Người chơi dạy AI, không phải AI giám sát/chấm điểm người chơi.
- **Tự vẽ tay hoặc tải ảnh:** Mỗi Măng Non là độc nhất do chính người chơi sáng tạo nét vẽ; hệ thống tự động tách nền và animate chuyển động thở / nhấp nháy mắt sống động.
- **4 Persona tính cách:**
  - 🔍 **Tò mò (Curious):** Hỏi nhiều, hỏi sâu về thế giới xung quanh.
  - 🍃 **Điềm tĩnh (Calm):** Trầm lặng, kiên định lắng nghe và chia sẻ.
  - 🔥 **Hào hứng (Excited):** Năng nổ, thích đố vui và động viên tinh thần.
  - 🌸 **Nhút nhát (Shy):** Rụt rè, cần người chơi chủ động gợi mở.
- **Không áp lực trừng phạt:** Không streak, không trừ điểm, không bệnh/chết nếu bận. Măng Non chỉ "ngủ" đợi bạn quay lại.

---

## ⛓️ 3. Kiến Trúc Kỹ Thuật (Architecture & Avalanche)

```text
┌───────────────────────────────────────────┐
│            Frontend (Next.js 14)          │
│   Rừng Tre · Làng Phù Đổng · Vườn Ký Ức   │
└─────────────────────┬─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│          Backend / Persona Engine         │
│   Auth · Gemini/Claude API · AI Suggest   │
└─────────────────────┬─────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │    Avalanche Blockchain   │
        │                           │
        │  [Game Subnet / L1]       │
        │  • GoalRegistry.sol       │
        │                           │
        │  [Avalanche C-Chain]      │
        │  • MamLucVault.sol        │
        │  • JourneyNFT.sol         │
        │  • VillageTree.sol        │
        │  • TramTreCheckin.sol     │
        └───────────────────────────┘
```

### Chi tiết Smart Contracts (`contracts/contracts/`)
| Hợp đồng | Mạng đề xuất | Mục đích |
|---|---|---|
| `GoalRegistry.sol` | Game L1 / Subnet | Quản lý Player State, Goal, tính cách, chỉ số và map nối lan toả 20%. |
| `MamLucVault.sol` | C-Chain | Vault cam kết: Hoàn trả 100% vốn gốc, trích 30% mock-yield vào Cây Làng. |
| `JourneyNFT.sol` | C-Chain | Chuẩn ERC-721 lưu trữ NFT hành trình Măng Non khi an nghỉ. |
| `VillageTree.sol` | C-Chain | Cây Làng Phù Đổng tích lũy mầm lực, kích hoạt sự kiện bùng nổ (Blessing). |
| `TramTreCheckin.sol` | C-Chain | Check-in GPS trạm đối tác, cấp mã voucher chống gian lận. |

---

## 🚀 4. Hướng Dẫn Chạy Thử (Quick Start)

### 1. Khởi động Web DApp (Frontend + AI Engine)
```bash
cd web
npm install
npm run dev
```
Truy cập ứng dụng tại: **[http://localhost:3000](http://localhost:3000)**

### 2. Kiểm thử Smart Contracts (Hardhat)
```bash
cd contracts
npm install
npx hardhat test
```
*Kết quả:* Toàn bộ 6 bài kiểm thử đơn vị mô phỏng đầy đủ luồng Goal, Vault, Cây Làng, JourneyNFT và Trạm Tre đều pass 100%.

### 3. Deploy lên Avalanche Fuji Testnet
Tạo file `contracts/.env`:
```env
PRIVATE_KEY=your_private_key_here
```
Triển khai lên mạng thử nghiệm:
```bash
cd contracts
npm run deploy:fuji
```

---

## 👥 5. Phân Công Nhóm 3 Người
- **1 Web3 & Smart Contracts:** Quản lý Solidity, kiểm thử Hardhat, cấu hình Avalanche Fuji & L1 Subnet.
- **1 Frontend & Game Feel:** Giao diện Canvas vẽ tay, chuyển động Măng Non, trải nghiệm 3 vùng đất.
- **1 AI Companion & Backend:** Tích hợp Persona Engine, gợi ý chỉ số thông minh, API đối tác.
