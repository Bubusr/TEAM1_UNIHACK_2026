# BusQuest — Tour Xe Buýt Có Nhiệm Vụ (UniHack 2026 - Team1 Vietnam)

> **Bản demo kỹ thuật trên testnet — Avalanche Fuji C-Chain (Chain ID: 43113)**

BusQuest là ứng dụng web mobile "tour xe buýt có nhiệm vụ" dành cho sinh viên và giới trẻ. Người chơi di chuyển qua 3 điểm di tích lịch sử tại Quận 1, TP.HCM theo lộ trình bằng xe buýt, quét mã QR check-in tại từng điểm. Khi hoàn thành toàn bộ lộ trình, người chơi nhận được:
1. **Một Huy hiệu NFT Soulbound** (ERC-721 không thể chuyển nhượng) lưu giữ vĩnh viễn trên blockchain Avalanche.
2. **Một Phiếu ưu đãi (Voucher)** giảm giá sử dụng 1 lần tại quán cà phê đối tác. Quán sẽ quét mã QR động của khách để xác nhận on-chain.

---

## 🏗️ Kiến Trúc Hệ Thống

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **Smart Contracts** | Solidity 0.8.24, Foundry, OpenZeppelin | Chạy trên Avalanche Fuji C-Chain (`CheckInManager`, `BadgeNFT`, `VoucherManager`) |
| **Frontend UI** | Next.js 15 (App Router), Tailwind CSS | Giao diện mobile-first tiếng Việt, thân thiện, không lộ thuật ngữ crypto thô |
| **Backend & API** | Next.js API Routes, Prisma ORM, SQLite | Xác thực QR, chống gian lận, ký EIP-712 xác nhận hoàn thành, **tuyệt đối không lưu toạ độ GPS** |
| **Bảo mật & Riêng tư** | EIP-712 Signatures, Viem | Ký số hoàn thành lộ trình (Verifier) và Redeem voucher ngắn hạn (30 giây) |

---

## ⚡ Tích Hợp Avalanche (Avalanche Integration)

- **Mạng**: Avalanche Fuji C-Chain (Chain ID: `43113`, RPC: `https://api.avax-test.network/ext/bc/C/rpc`).
- **Hợp đồng thông minh**:
  - `CheckInManager.sol`: Xác minh chữ ký EIP-712 từ Verifier ngoài chain, gọi mint huy hiệu và phát voucher, chống replay bằng nonce.
  - `BadgeNFT.sol`: Chuẩn ERC-721 Soulbound chặn chuyển nhượng (chỉ cho phép mint và burn bởi chủ sở hữu).
  - `VoucherManager.sol`: Quản lý hạn mức phát voucher của quán đối tác, xác minh chữ ký EIP-712 ngắn hạn do chủ voucher ký khi quán thực hiện `redeem`.
- **Vì sao chọn Avalanche?**: Phí giao dịch cực thấp và thời gian hoàn tất (finality) ~1 giây rất phù hợp cho các vi giao dịch (micro-transactions) như check-in và đổi voucher mà không làm gián đoạn trải nghiệm người dùng ngoài đời thực.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Yêu Cầu Môi Trường
- Node.js >= 18
- Foundry (forge) để biên dịch và kiểm thử smart contracts

### 2. Cài Đặt Thư Viện & Khởi Tạo Database
```bash
# Cài đặt các gói phụ thuộc
npm install

# Khởi tạo database SQLite và sinh Prisma client
npx prisma db push

# Nạp dữ liệu lộ trình mẫu Quận 1 TP.HCM (3 điểm)
node prisma/seed.js
```

### 3. Kiểm Thử Smart Contracts (Foundry)
```bash
cd contracts
forge test -vvv
```
*(Kết quả: 13/13 tests passed bao gồm kiểm tra chữ ký EIP-712, chống double-redeem, chống transfer huy hiệu, quota đối tác,...)*

### 4. Khởi Chạy Ứng Dụng Web
```bash
npm run dev
```
Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

## 📱 Các Màn Hình Chính Của Ứng Dụng

1. **Trang chủ (`/`)**: Khám phá danh sách tuyến buýt, xem thời gian dự kiến và phần thưởng.
2. **Chi tiết lộ trình (`/routes/1`)**: Xem danh sách 3 điểm (Nhà thờ Đức Bà, Bưu điện Trung tâm, Dinh Độc Lập), thanh tiến độ thực tế và nút nhận thưởng khi hoàn thành.
3. **Quét QR Check-in (`/checkin`)**: Quét camera hoặc sử dụng nút "Thử nghiệm nhanh (Demo Test)" để giả lập quét mã tại điểm dừng cho giám khảo.
4. **Ví của tôi (`/wallet`)**:
   - Tab **Huy hiệu NFT**: Xem huy hiệu Soulbound ERC-721 đã nhận.
   - Tab **Phiếu ưu đãi**: Xem voucher giảm giá và bấm "Dùng ngay".
5. **Chi tiết Voucher (`/wallet/voucher/[id]`)**: Sinh mã QR động tự làm mới sau mỗi 30 giây bằng chữ ký số EIP-712.
6. **Màn hình Quán Đối Tác (`/merchant`)**: Dành cho nhân viên quán quét QR khách hàng, gọi xác nhận on-chain và kiểm tra cơ chế từ chối khi quét lại lần 2.

---

## 🛡️ Cam Kết Riêng Tư & An Toàn (Theo AGENTS.md)
- Không lưu toạ độ GPS cá nhân trong cơ sở dữ liệu.
- Không đưa từng lượt check-in chi tiết lên blockchain công khai (chỉ đưa sự kiện hoàn thành lộ trình).
- Mọi khoá riêng và bí mật môi trường được bảo vệ trong `.env` (đã thêm vào `.gitignore`).
