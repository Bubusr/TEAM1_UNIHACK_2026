# 🎋 MĂNG NON — Hệ Thống Thị Giác & Design Tokens (DESIGN_TOKENS.md)

> **Phong cách cốt lõi:** **Rough Doodle & Muted Pastel** — Nét vẽ tay 2D không hoàn hảo (thick dark ink outlines), đổ bóng phẳng 2D (1-2 shadow tones), bảng màu Muted Pastel hoài cổ kỳ bí (Eerie Vintage) trên chất liệu thớ giấy Dó truyền thống Việt Nam.  
> **Nguyên tắc trải nghiệm:** **Anti-stress Eye Comfort + Organic Hand-drawn Feel** (Tĩnh lặng tuyệt đối khi đọc/học — Nét vẽ tay thô mộc, rung rinh nhè nhẹ khi tương tác).

---

## 1. Triết Lý Thiết Kế Rough Doodle & Eerie Vintage

1. **Nét vẽ phác thảo tay hữu cơ (Hand-drawn 2D Doodle):**
   - Nét mực than dày, không hoàn hảo, nét vẽ run nhẹ và độ dày nét biến thiên tự nhiên.
   - Tránh đồ họa vector bóng bẩy (polished vector), tránh hình học hoàn hảo hiện đại, không dùng 3D rendering.
2. **Đổ bóng phẳng 2D (2D Flat Shading):**
   - Các mảng màu phẳng, bóng đổ cứng (cel shading tối đa 1–2 tone bóng).
   - Không dùng ánh sáng thực tế, không dải chuyển màu bóng bẩy (glossy highlights/complex gradients).
3. **Bầu không khí Hoài cổ kỳ bí (Eerie Vintage Sanctuary):**
   - Huyền bí, lạ lẫm, hoài niệm, ấm áp nhưng độc đáo (balance between cozy and eerie).
   - Không biến toàn bộ khung cảnh thành đen tối đơn sắc (không horror cực đoan, không sepia quá mức).

---

## 2. Bảng Màu Muted Pastel Chuẩn (Color Palette)

| Mã Token | Tên Màu | Hex Code | Ứng Dụng |
| :--- | :--- | :--- | :--- |
| `forest.deep` | Rừng đêm thẫm | `#222E30` | Màu nền chính mô phỏng chiều sâu rừng tre đêm |
| `forest.darker` | Rừng tối | `#1A2426` | Mảng nền phụ, thanh điều hướng dưới đáy |
| `forest.abyss` | Đêm sâu thẳm | `#141C1E` | Nền modal, góc khuất tán tre |
| `bamboo.soft` | Xanh khói (Dusty Sage) | `#7E9A85` | Nét tre, lá non, badge sinh linh |
| `bamboo.light` | Xanh rêu non (Sage Light) | `#8FA996` | Điểm nhấn chữ, nhãn trạng thái |
| `muted.olive` | Xanh tre trầm (Muted Olive) | `#5A6544` | Đốt nứa, nút bấm chính, thảm cỏ rừng |
| `dusty.blue` | Lam tro (Dusty Blue) | `#6B818C` | Khớp chi phải, sông suối ký ức |
| `warm.glow` / `ochre` | Hoàng thổ (Muted Ochre) | `#CFA85B` | Đom đóm, hạt sáng, thẻ bài nổi bật |
| `brick.red` | Đỏ gạch cổ (Brick Red) | `#A84D3D` | Hoa gạo, nút hành động khẩn, ví Core/MetaMask |
| `desaturated.brown` | Nâu đất hoài cổ | `#5C4D43` | Vỏ tre, rễ cây, phụ đề văn bản |
| `paper` | Kem Dó (Warm Cream) | `#F4EEDD` | Màu nền của mọi thẻ bài học tập, chữ đọc trên nền tối |
| `paper.mid` | Giấy Dó trung tính | `#EDE5D2` | Thẻ phụ, banner quà tặng, mảng in lệch |
| `ink` | Mực than mềm (Soft Charcoal) | `#26292B` | Viền mực dày 2.5px–3.5px của toàn bộ nút và khung |

---

## 3. Quy Tắc Bo Góc Bất Đối Xứng (Organic Cutout Radius)

Thay vì bo tròn góc máy móc (`rounded-2xl`, `rounded-full`), các thành phần sử dụng bo góc bất đối xứng để tạo cảm giác **tờ giấy được cắt bằng kéo tay thủ công**:

```css
:root {
  /* Khung thẻ giấy Dó lớn (.bamboo-card) */
  --radius-cutout-1: 255px 15px 225px 15px / 15px 225px 15px 255px;

  /* Nút bấm mộc bản (.btn-woodblock) */
  --radius-cutout-2: 15px 225px 15px 255px / 255px 15px 225px 15px;

  /* Nhãn thẻ nhỏ & huy hiệu */
  --radius-cutout-3: 180px 20px 195px 25px / 25px 190px 20px 185px;
}
```

---

## 4. Nguyên Tắc Mảng Màu In Lệch Bản (Woodblock Misprint Layer)

Trong nghệ thuật tranh khắc gỗ dân gian Đông Hồ, mỗi màu sắc được in bằng một bản khắc gỗ riêng biệt. Khi dập tay, các bản màu thường **lệch nhẹ từ 2px đến 5px**, để lộ viền màu bên dưới.

```
+---------------------------------------+
|  Thẻ Giấy Dó Chính (#F6EBD4)          |
|  Viền mực đen 2.5px (#2B2118)         |
+---------------------------------------+
   \=====================================\   <-- Bản in lệch màu (::before)
    \ Mảng màu tre (#6B8F71) lệch 5px    \       (Z-index: -1, Zero Blur)
     \=====================================\
```

### Triển khai CSS:
- **Bóng cứng 0px blur:**
  - `box-shadow: 4px 4px 0px #2B2118;` (bóng mực đen phẳng lì).
- **Lớp in lệch bản (`::before` layer):**
  - Đặt `position: absolute; top: 5px; left: 5px; right: -6px; bottom: -6px;`
  - Màu nền đặc (`#6B8F71` hoặc `#FFD166`), bo góc `var(--radius-cutout-2)`.
  - Khi `:hover`: Cả thẻ nhún nhảy theo `wiggleCuphead`, lớp `::before` dịch chuyển nhẹ `translate(2px, 2px)` để tách lớp cắt dán giấy rõ nét.

---

## 5. Quy Chuẩn Chuyển Động (Stepped Animation Standards)

| Trạng Thái | Thuộc Tính Animation | Cơ Chế |
| :--- | :--- | :--- |
| **Idle (Tĩnh)** | `animation: none` | Đứng yên 100%, không rung, không nháy |
| **Hover (Chạm)** | `wiggleCuphead 0.35s steps(3, end) infinite` | Xoay nhẹ (-1.5° đến 1.5°), co giãn (squash & stretch 1.02/0.98), giật 3 bước frame-by-frame |
| **Boiling Line** | `boilLine 0.25s steps(4, end) infinite` | Viền mực rung dịch 1px để mô phỏng nét vẽ tay trên từng khung hình |
| **Active (Bấm)** | `transform: translate(4px, 4px); box-shadow: 0px 0px 0px;` | Ép phẳng lún xuống khớp khít vào bản bóng |

---

## 6. Hỗ Trợ Giảm Chuyển Động (Accessibility & Reduced Motion)

Khi người dùng bật chế độ `prefers-reduced-motion: reduce` trong hệ điều hành hoặc kích hoạt tính năng **Giảm chuyển động** trong cài đặt của Măng Non:
- Mọi animation `steps()` và `wiggleCuphead` bị tắt hoàn toàn (`animation: none !important`).
- Tốc độ phản hồi tương tác giữ nguyên trạng thái lún nút cơ học để đảm bảo xúc giác phản hồi.
