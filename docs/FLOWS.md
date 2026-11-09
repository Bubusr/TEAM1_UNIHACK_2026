# MĂNG NON — 8 Luồng Trải Nghiệm Chuẩn (FLOWS.md)

Tài liệu đặc tả 8 luồng chính theo mục 7 của `Idea03_MangNon_Antigravity_Prompt.md`:

---

### 1. Luồng A — Lần đầu mở app & Onboarding (UC01–UC05)
* **Nhịp điệu thời gian (~3 phút):** 
  - `0:00`: Tò mò thấy ống nứa sáng giữa rừng đêm (S01)
  - `0:20`: Chạm mở ống nứa, ánh sáng tràn màn (S02)
  - `1:30`: Trao hình hài bằng vẽ tay / tải ảnh / chọn mẫu (S03)
  - `2:00`: Đặt tên và chọn 1 trong 4 tính cách (S04)
  - `3:00`: Trò chuyện 3 lượt đầu tiên, đặt tên hành trình và an trú ở Rừng Tre Cổ (S05 $\rightarrow$ S06).
* **Đường lui & xử lý lỗi:** Nếu người dùng thoát app giữa chừng, lần sau mở lại sẽ quay về đúng bước đang làm dở (lưu `onboardingStep`). Cho phép bấm *"Để sau"* ở bước đặt hành trình.

---

### 2. Luồng B — Kể chuyện hằng ngày (UC06–UC07)
* Từ S06 $\rightarrow$ Nhấp *"Kể cho Măng Non nghe"* $\rightarrow$ Vào S07.
* Chọn chip mở lời hoặc gõ tự do $\rightarrow$ Bấm gửi $\rightarrow$ Măng Non đung đưa lá tre suy ngẫm $\rightarrow$ Phản hồi theo tính cách và giai đoạn nhận thức.
* Mỗi lần chia sẻ tạo ra một ứng viên ký ức, hiện thông báo nhẹ *"Mình nhớ rồi"* thoáng qua 2s.
* Vào S08 để xem toàn bộ ký ức, ghim hoặc chọn *"Quên điều này"* với xác nhận dịu dàng.

---

### 3. Luồng C — An nghỉ (Nghi thức 5 nhịp thiêng liêng, UC09)
* **Nhịp 1 — Mở lời:** Măng Non xin được nói đôi lời trước khi ngủ (có nút *"Để sau"* nếu bấm nhầm).
* **Nhịp 2 — Nhìn lại:** Hiển thị 3 điều Măng Non nhớ nhất xuất hiện chậm rãi với ánh sáng ấm.
* **Nhịp 3 — Lời cuối:** Măng Non gửi lời cảm ơn chân thành theo tính cách, lưu vĩnh cửu tại Vườn Ký Ức.
* **Nhịp 4 — Hóa ánh sáng:** Hình Măng Non hóa thành các hạt sáng li ti trôi về suối, phiến đá nhẵn mới hiện ra dưới đáy nước trong vắt.
* **Nhịp 5 — Cây Đa nhận lá:** Thông báo *"Hành trình của cậu đã góp một chiếc lá cho Cây Đa."* $\rightarrow$ Chuyển về S06 nơi một ống nứa mờ chờ đợi khi cậu sẵn sàng.

---

### 4. Luồng D — Làng Phù Đổng & Cây Đa Bùng Nổ (UC11)
* Mở tab **Làng** $\rightarrow$ Xem Cây Đa Phù Đổng với các lá phát sáng tượng trưng cho đóng góp của cả làng.
* Nếu đang mở màn hình khi đạt ngưỡng: Hoa gạo đỏ rực nở bung trên cành và đom đóm rợp trời.
* Nếu sự kiện bùng nổ diễn ra khi vắng mặt: Lần kế tiếp mở tab Làng sẽ có thẻ tre *"Đêm qua Cây Đa đã nở hoa"* kèm nút *"Xem lại"*.

---

### 5. Luồng E — Quay lại sau thời gian dài (UC08)
* Khoảng cách thời gian được tính nội bộ:
  - `< 3 ngày`: Vào thẳng S06, chào bình thường.
  - `3–6 ngày`: Chào dịu dàng: *"Cậu về rồi. Mình vẫn ở đây."*
  - `≥ 7 ngày`: Chào ấm áp: *"Lâu rồi mới gặp. Không cần kể gì cũng được, ngồi cạnh mình một lát cũng tốt."*
* **Tuyệt đối không:** Không hiện số ngày vắng mặt, không trừ điểm, không trách móc.

---

### 6. Luồng F — Xử lý lỗi & Ngoại lệ dịu dàng (UC13)
* Khi mất mạng / lỗi tách nền: Hiện thẻ tre giọng dịu: *"Mạng hơi chập chờn một chút. Măng Non vẫn ở đây, mình thử lại sau nhé."*
* Luôn cung cấp đường lui (ví dụ: chuyển từ chụp ảnh sang chọn ảnh từ máy, chuyển từ tách nền AI sang cắt khung oval mềm).

---

### 7. Luồng G — Chu kỳ Thời gian & 4 Mùa (UC12)
* Tự động điều chỉnh theo giờ máy tính và tháng thực tế:
  - Sáng (06:00–16:59): Vệt nắng xuyên lá, màu xanh tre trầm.
  - Hoàng hôn (17:00–18:59): Sắc cam ấm.
  - Đêm (19:00–05:59): Màu xanh đêm sâu, đom đóm bay, ống nứa sáng rõ nhất.
  - 4 Mùa: Xuân (tươi), Hạ (xanh đậm), Thu (lá vàng), Đông (tĩnh lặng).

---

### 8. Luồng H — Xóa toàn bộ dữ liệu (UC14)
* Vào S13 $\rightarrow$ *"Xoá toàn bộ dữ liệu"* $\rightarrow$ Hộp xác nhận 1 dịu dàng $\rightarrow$ Hộp xác nhận 2 gõ tên Măng Non $\rightarrow$ Dọn sạch `localStorage` và `IndexedDB` $\rightarrow$ Quay về S01 như người mới bắt đầu.

