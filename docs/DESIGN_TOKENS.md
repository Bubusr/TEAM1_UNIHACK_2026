# MĂNG NON — Hệ Thống Thị Giác & Design Tokens (DESIGN_TOKENS.md)

Hệ thống token chuẩn hóa theo mục 9 của `Idea03_MangNon_Antigravity_Prompt.md`:

---

### 1. Bảng Màu Chuẩn (CSS Variables)

```css
:root {
  /* Nền chủ đạo [KHOÁ] - Phong cách chiều sâu Ghibli */
  --bamboo-day-1: #3E5C45;   /* Xanh tre trầm ban ngày */
  --bamboo-day-2: #6B8F71;   /* Xanh tre tự nhiên */
  --night-deep:   #1B2A2F;   /* Xanh đêm sâu Rừng Tre */
  --night-darker: #132024;
  --night-abyss:  #0D1619;

  /* Điểm nhấn ánh sáng [KHOÁ] - Luôn là điểm mắt nhìn vào trước */
  --glow-amber:   #F4A259;   /* Ánh sáng ấm đốt tre */
  --glow-gold:    #FFD166;   /* Ánh sáng vàng Kaguya rực rỡ */

  /* Đỏ / hồng mộc bản Đông Hồ (chỉ dùng tiết chế cho Cây Đa bùng nổ hoa gạo) */
  --dongho-red:   #C8412F;   /* Đỏ hoa gạo */
  --dongho-pink:  #E8837A;

  /* Thẻ tre & Giấy dó [ĐỀ XUẤT] */
  --paper-bamboo: #E9D8A6;   /* Màu thẻ tre khô */
  --paper-do:     #F6EBD4;   /* Giấy dó / chữ trên nền tối */
  --ink:          #2B2118;   /* Chữ đen mực mộc bản */
  --node-ring:    #B98B3E;   /* Vòng đốt tre */

  /* Easing & Timing chuyển động mềm */
  --ease-soft: cubic-bezier(.22, 1, .36, 1);
  --dur-short: 300ms;
  --dur-med: 600ms;
  --dur-long: 1200ms;
  --breathe: 3.6s;
  --sway: 6s;
}
```

---

### 2. Hai Lớp Thị Giác Tách Bạch [KHOÁ]

1. **Lớp Môi Trường (Background - Ghibli):**
   - Ánh sáng xuyên tán lá mềm, vệt sáng sương đêm.
   - Parallax 3 lớp: Tre xa mờ nhạt $\rightarrow$ Tre trung cảnh rõ nét $\rightarrow$ Khóm tre cận cảnh rìa màn hình.
   - Mặt đất rừng rêu phong với cỏ dại uốn lượn.
2. **Lớp Tương Tác (UI / Component - Tranh dân gian Đông Hồ):**
   - Khung hội thoại: Dạng **thẻ tre / lá tre cuộn**.
   - Nút bấm: Dạng mộc bản in lệch màu 2–3px, viền đậm, không blur.
   - Ấn giai đoạn nhận thức: Con dấu mộc bản hình lá (1 đến 4 lá).
   - Phiến đá Suối Ký Ức: Silhouette đơn sắc in mờ dưới đáy nước trong vắt.

---

### 3. Ngân Sách Chuyển Động & Hiệu Ứng Hạt [KHOÁ]
- Chuyển động thở: `scaleY(1.0) -> scaleY(1.02)` trong 3.6s, không làm méo hình gốc.
- Đom đóm trong rừng thường nhật: $\le 40$ hạt.
- Khoảnh khắc đặc biệt (Mở ống nứa, Bùng nổ hoa gạo, An nghỉ): $\le 120$ hạt.
- Hỗ trợ `prefers-reduced-motion`: Tắt hạt và parallax, chuyển sang hiệu ứng crossfade ánh sáng mềm.

