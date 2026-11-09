# MĂNG NON — Danh sách Giả Định & Quyết Định Thiết Kế (ASSUMPTIONS.md)

Tài liệu ghi nhận toàn bộ các quyết định tự đưa ra theo nguyên tắc mục 2.1 của `Idea03_MangNon_Antigravity_Prompt.md`:
*Mọi quyết định đều hướng tới câu hỏi kiểm tra: "Điều này khiến người dùng cảm thấy được chờ đợi một cách ấm áp, hay bị thúc giục một cách lạnh lùng?"*

---

| # | Vấn đề / Chỗ trống | Quyết định đưa ra | Lý do |
|---|---|---|---|
| 1 | **Thiết bị & Khung hiển thị** | Mặc định thiết kế mobile-first (390×844). Trên màn hình Desktop lớn, tự động bọc trong khung viền điện thoại mềm mại đặt giữa màn hình có bóng đổ nhẹ. | Giữ trọn vẹn tỷ lệ dọc của điện thoại di động khi demo trên laptop ban giám khảo, không bị méo tỷ lệ hay vỡ bố cục. |
| 2 | **Kiến trúc Router** | Dùng Hash Router dạng SPA trên Next.js (`#/bat-dau/ong-nua`, `#/mo-ong-nua`, `#/tao-hinh`, `#/dat-ten`, `#/gap-dau`, `#/rung`, `#/ke`, `#/nho`, `#/lang`, `#/vuon`, `#/cai-dat`). | Cho phép chuyển màn tức thì không giật trang, lưu trạng thái onboarding dở dang, back button tự nhiên. |
| 3 | **Cơ chế lưu trữ dữ liệu** | Sử dụng `localStorage` cho trạng thái ứng dụng, tin nhắn, ký ức, cài đặt, và `IndexedDB` (hoặc data URI nén) cho hình ảnh vẽ tay/ảnh tải lên. | Hoạt động offline 100%, không cần kết nối backend mạng, đảm bảo không bao giờ bị nghẽn mạng khi thuyết trình 3 phút. |
| 4 | **Đơn vị Cây Đa Làng** | Thể hiện bằng **số lá phát sáng** trên cành Cây Đa cổ thụ, không dùng điểm số hay thanh %. Mức nền cộng đồng giả lập 62% mốc, cộng thêm lá của người dùng. | Tránh biến Cây Đa thành bảng điểm số cạnh tranh; giữ trọn vẻ đẹp hoài niệm của làng quê. |
| 5 | **Đếm buổi kể chuyện** | 1 buổi kể được ghi nhận khi người dùng gửi ≥ 2 tin nhắn trong một phiên. Con số này chỉ lưu nội bộ để tính giai đoạn nhận thức, tuyệt đối không hiển thị ra UI. | Tránh tâm lý cày cuốc số lượng tin nhắn, giữ tương tác tự nhiên. |
| 6 | **Demo Control Panel (S14)** | Đặt ở một biểu tượng nhỏ kín đáo góc dưới màn hình Cài đặt (S13) hoặc tổ hợp phím tắt `Ctrl + Shift + D`, có nút trượt bật/tắt hiển thị nút nổi trên màn hình. | Cho phép ban giám khảo và đội ngũ nhảy nhanh tới mọi mốc giờ, mùa, giai đoạn nhận thức và kích hoạt bùng nổ hoa gạo trong buổi demo 3 phút mà không làm phiền người dùng thông thường. |
| 7 | **Tách nền ảnh tự động** | Dùng thuật toán Canvas Edge Detection & Color Thresholding phía client; nếu ảnh phức tạp tự động chuyển sang Cắt khung mềm oval dịu dàng. | Không phụ thuộc vào API AI tách nền đám mây bên ngoài để đảm bảo tính ổn định offline tuyệt đối. |
| 8 | **Âm thanh** | Tích hợp Web Audio API tự sinh tiếng gõ tre ("cộc cộc"), chuông gió và tiếng nước suối. Mặc định TẮT âm thanh, người dùng có nút bật/tắt trong Cài đặt (S13) và góc màn hình. | Tuân thủ tiêu chuẩn không tự phát âm thanh khi chưa có cử chỉ người dùng, tạo cảm giác yên bình. |

