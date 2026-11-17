# TÀI LIỆU Ý TƯỞNG DỰ ÁN VÀ CẤU TRÚC CÁC MÀN HÌNH GIAO DIỆN (BUSQUEST)

---

## PHẦN 1: Ý TƯỞNG THỰC HIỆN DỰ ÁN

### 1. Tên dự án
**BusQuest** — Ứng dụng web di động kết hợp khám phá tour xe buýt đô thị và hệ thống chứng nhận, đổi thưởng số.

### 2. Vấn đề thực tế cần giải quyết
* **Áp lực giao thông và môi trường**: Các đô thị lớn đang chịu tải lượng phương tiện cá nhân rất cao, dẫn đến ùn tắc và ô nhiễm môi trường.
* **Phương tiện công cộng chưa hấp dẫn giới trẻ**: Mạng lưới xe buýt có giá thành rất thấp nhưng người dân, sinh viên và khách du lịch ít lựa chọn do thiếu trải nghiệm tương tác, việc tra cứu lộ trình du lịch còn rời rạc và thiếu động lực gắn kết.
* **Doanh nghiệp vừa và nhỏ địa phương khó tiếp cận khách tự túc**: Các quán cà phê, hàng quán truyền thống gần các trạm dừng di tích khó tiếp cận nhóm khách du lịch tự túc, đồng thời các hình thức phát hành phiếu giảm giá giấy truyền thống dễ bị giả mạo hoặc sử dụng nhiều lần ngoài tầm kiểm soát.

### 3. Giải pháp cốt lõi của BusQuest
BusQuest xây dựng mô hình **"Game hóa hành trình giao thông công cộng" (Gamified Public Transit City Tour)**:
* **Khám phá theo tuyến**: Người dùng lựa chọn một lộ trình tham quan thành phố được thiết kế sẵn theo các trạm dừng xe buýt kết nối các điểm di tích lịch sử, văn hóa.
* **Hỗ trợ di chuyển thực tế**: Cung cấp bản đồ trực quan và thông tin các chuyến xe buýt công cộng thật đang hoạt động để người dùng bắt xe đến từng địa điểm.
* **Xác thực hiện diện thực tế**: Tại mỗi điểm dừng trên tuyến, người dùng quét mã QR được đặt tại trạm. Hệ thống kiểm tra tọa độ vị trí thực tế của thiết bị để xác nhận người dùng đã có mặt tại trạm.
* **Cơ chế phần thưởng kép**: Khi hoàn thành đủ toàn bộ các điểm dừng trên lộ trình, người dùng được nhận:
  1. *Huy hiệu số chứng nhận thành tích (Soulbound)*: Được ghi nhận vĩnh viễn, không thể chuyển nhượng, không thể mua bán hay chuyển sang tài khoản khác.
  2. *Phiếu ưu đãi sử dụng một lần (Voucher)*: Áp dụng giảm giá khi sử dụng dịch vụ tại quán đối tác nằm ở trạm dừng của tuyến.
* **Xác thực đổi thưởng minh bạch tại quán**: Quán đối tác sử dụng giao diện quét để đọc mã QR phiếu ưu đãi từ điện thoại khách hàng. Hệ thống hợp đồng thông minh tự động kiểm tra và khóa phiếu sau khi đổi, từ chối tuyệt đối mọi hành vi quét lại lần hai.

### 4. Ứng dụng công nghệ phân tán và bảo vệ quyền riêng tư
* **Bảo vệ dữ liệu cá nhân (Off-chain Check-in)**: Dữ liệu từng lượt ghé thăm và tọa độ vị trí của người dùng được xử lý tại máy chủ xác thực bảo mật, không ghi nhận từng bước di chuyển lên mạng công khai nhằm bảo vệ lịch sử di chuyển cá nhân.
* **Chứng nhận tính toàn vẹn (On-chain Completion)**: Khi người dùng đi đủ các điểm, máy chủ tạo chữ ký mật mã chuẩn xác thực để kích hoạt giao dịch ghi nhận hoàn thành lộ trình, phát hành huy hiệu số và phiếu ưu đãi.
* **Chống gian lận sử dụng lặp lại (Anti-Double Spending)**: Hợp đồng thông minh đóng vai trò trọng tài độc lập kiểm soát số lượng phát hành và trạng thái đã sử dụng của từng phiếu ưu đãi.

---

## PHẦN 2: DANH SÁCH CÁC MÀN GIAO DIỆN VÀ CẤU TRÚC THÀNH PHẦN

Ứng dụng được thiết kế theo cấu trúc màn hình di động, mỗi màn hình tập trung vào một nhóm tác vụ rõ ràng, không chứa các thành phần trang trí dư thừa.

---

### MÀN HÌNH 1: TRANG CHỦ (HOME SCREEN)
Màn hình xuất phát điểm của người dùng, cung cấp nhận diện tài khoản, tổng quan hành trình và các lối tắt chức năng chính.

* **Khu vực đầu trang**:
  * Biểu tượng định danh người dùng và tên bí danh tài khoản.
  * Nút bấm thực hiện đăng nhập hoặc đăng xuất tài khoản.
  * Thẻ thông tin trạng thái mạng thử nghiệm phân tán.
* **Khối thông tin tổng quan lộ trình**:
  * Tiêu đề lộ trình tham quan.
  * Đoạn mô tả mục tiêu của lộ trình.
  * Hàng chỉ số nhanh: Số lượng điểm dừng, danh sách số hiệu các tuyến xe buýt phục vụ, thời lượng di chuyển ước tính.
* **Khẻ chi tiết lộ trình khả dụng**:
  * Mã số nhận diện tuyến và tên tuyến lộ trình.
  * Đoạn tóm tắt nội dung tuyến.
  * Chuỗi biểu thị thứ tự các trạm dừng liên tiếp từ điểm đầu đến điểm cuối.
  * Khung tóm tắt phần thưởng nhận được sau khi đi đủ tuyến (Huy hiệu và Phiếu ưu đãi).
  * Nút bấm điều hướng: "Xem chi tiết lộ trình và bản đồ".
* **Khu vực lối tắt tác vụ nhanh**:
  * Thẻ tác vụ mở tính năng quét mã QR check-in tại trạm.
  * Thẻ tác vụ mở ví cá nhân xem huy hiệu và phiếu ưu đãi.
* **Khu vực liên kết đối tác**:
  * Khối thông tin dành cho nhân viên quán đối tác.
  * Nút bấm chuyển sang cổng xác thực phiếu ưu đãi của quán.
* **Thanh điều hướng cố định dưới đáy màn hình**:
  * Nút chuyển về Trang chủ.
  * Nút quét mã QR check-in đặt tại vị trí trung tâm.
  * Nút chuyển đến Ví cá nhân.

---

### MÀN HÌNH 2: CHI TIẾT LỘ TRÌNH VÀ BẢN ĐỒ TUYẾN XE (ROUTE DETAIL & TRANSIT GUIDE)
Màn hình cung cấp toàn bộ hướng dẫn di chuyển thực tế bằng xe buýt và danh sách các điểm dừng cần hoàn thành.

* **Thanh tiêu đề trang**:
  * Nút bấm quay lại trang chủ.
  * Nhãn định danh số hiệu tuyến và khu vực địa lý của tuyến.
* **Khối tổng quan tiến độ**:
  * Tên lộ trình và đoạn mô tả chi tiết.
  * Chỉ số tiến độ: Số trạm đã check-in trên tổng số trạm và tỉ lệ phần trăm hoàn thành.
  * Thanh hiển thị tiến độ hoàn thành dạng thanh ngang.
* **Bộ chuyển đổi hai chế độ hiển thị (Segmented Tabs)**:
  * Nút chọn Tab 1: "Nhiệm vụ Check-in".
  * Nút chọn Tab 2: "Bản đồ & Xe buýt".
* **Nội dung Tab 1 — Nhiệm vụ Check-in**:
  * Danh sách trục dọc các trạm dừng theo thứ tự di chuyển:
    * Đánh số thứ tự từng trạm.
    * Tên địa danh trạm dừng.
    * Đoạn giới thiệu tóm tắt giá trị lịch sử, kiến trúc của địa điểm.
    * Nhãn biểu thị trạng thái của trạm: "Đã ghé thăm", "Trạm kế tiếp cần đến", hoặc "Chưa ghé thăm".
  * Khối thao tác hành động theo trạng thái:
    * *Trường hợp chưa hoàn thành đủ*: Nút bấm chuyển sang màn hình quét QR check-in trạm kế tiếp.
    * *Trường hợp đã đi đủ tất cả các trạm*: Nút bấm xác nhận giao dịch để nhận Huy hiệu số và Phiếu ưu đãi.
    * *Trường hợp đã nhận thưởng thành công*: Khung thông báo chúc mừng hoàn thành và nút bấm điều hướng mở Ví cá nhân.
    * Khung hiển thị thông báo lỗi khi giao dịch không thành công (nếu có).
* **Nội dung Tab 2 — Bản đồ & Hướng dẫn xe buýt**:
  * Khung bản đồ địa lý số tương tác:
    * Bản đồ hiển thị khu vực địa lý thực tế chứa tất cả các trạm dừng.
    * Các điểm đánh dấu vị trí trạm trên bản đồ.
    * Đường nối thể hiện hướng di chuyển giữa các trạm.
  * Bộ nút chọn nhanh từng trạm:
    * Bấm chọn trạm cụ thể để bản đồ tự động đưa điểm đó vào vị trí trung tâm.
  * Thẻ thông tin trạm chờ xe buýt tương ứng với trạm được chọn:
    * Tên trạm chờ xe buýt ngoài thực tế và mã trạm.
    * Khoảng cách đi bộ từ điểm dừng xe buýt đến cửa di tích.
    * Danh sách các tuyến xe buýt ghé qua đón trả khách tại trạm này.
    * Nút bấm liên kết mở trực tiếp ứng dụng bản đồ chỉ đường công cộng.
  * Lịch trình hướng dẫn chuyển chặng chi tiết:
    * Hướng dẫn di chuyển từ trạm 1 sang trạm 2 (khoảng cách, thời gian, cách thức đi bộ hoặc chuyển xe).
    * Hướng dẫn di chuyển từ trạm 2 sang trạm 3.
  * Danh mục các tuyến xe buýt công cộng phục vụ lộ trình:
    * Thẻ thông tin từng tuyến xe buýt: Số hiệu tuyến, tên hành trình đầu bến và cuối bến, khung giờ chạy trong ngày, tần suất giữa các chuyến xe, mức giá vé phổ thông và mức giá vé ưu đãi học sinh/sinh viên, danh sách các điểm di tích mà tuyến này đi qua.
  * Khối liên kết mở ứng dụng tra cứu thời gian thực của xe buýt.

---

### MÀN HÌNH 3: QUÉT MÃ QR CHECK-IN TẠI TRẠM DỪNG (CHECK-IN SCANNER)
Màn hình thực hiện chức năng quét mã QR dán tại các trạm dừng để ghi nhận sự hiện diện thực tế của người dùng.

* **Thanh điều hướng đầu trang**:
  * Nút bấm quay lại trang trước.
  * Tiêu đề màn hình quét mã check-in.
  * Nhãn hiển thị số lượng trạm đã hoàn thành trên tổng số trạm.
* **Khung ngắm máy ảnh (Viewfinder)**:
  * Vùng hiển thị hình ảnh từ máy ảnh thiết bị dạng khung vuông.
  * Dấu định vị góc ngắm bốn cạnh để căn chỉnh mã QR.
  * Dòng vạch tín hiệu quét chuyển động.
  * Dòng chữ hướng dẫn người dùng hướng ống kính vào mã QR dán tại điểm đến.
* **Khung hiển thị kết quả kiểm tra**:
  * Khung thông báo xác thực thành công: Tên trạm vừa ghi nhận, cập nhật tổng tiến độ mới.
  * Khung thông báo từ chối: Nêu rõ lý do (mã QR không đúng định dạng, hoặc khoảng cách vị trí thiết bị nằm ngoài phạm vi cho phép).
* **Khối thông báo hoàn thành toàn bộ lộ trình**:
  * Xuất hiện khi người dùng đã check-in đủ tất cả các trạm.
  * Nút bấm chuyển ngay về trang lộ trình để nhận thưởng.
* **Khối công cụ thử nghiệm nhanh (Dành cho kiểm thử và ban giám khảo)**:
  * Danh sách các trạm dừng mẫu của lộ trình.
  * Nút bấm giả lập quét từng trạm.
  * Nhãn hiển thị trạng thái đã quét hoặc chưa quét cho từng nút.
* **Khối nhập mã trạm dừng thủ công**:
  * Ô nhập chuỗi ký tự mã trạm dừng (dự phòng trường hợp ống kính máy ảnh không khả dụng).
  * Nút bấm gửi mã để xác thực.
* **Đường dẫn liên kết quay lại xem tiến độ lộ trình**.

---

### MÀN HÌNH 4: VÍ CÁ NHÂN (USER WALLET)
Màn hình quản lý toàn bộ tài sản số của người dùng bao gồm huy hiệu chứng nhận và danh sách các phiếu ưu đãi đã nhận được.

* **Thanh tiêu đề trang**:
  * Tiêu đề màn hình Ví của tôi.
  * Dòng hiển thị tên bí danh người dùng và địa chỉ tài khoản liên kết.
  * Nút bấm đăng nhập hoặc đăng xuất.
* **Thanh chuyển đổi nội dung hai danh mục (Segmented Tabs)**:
  * Nút chọn Tab 1: "Huy hiệu số" kèm chỉ số đếm số lượng huy hiệu đang sở hữu.
  * Nút chọn Tab 2: "Phiếu ưu đãi" kèm chỉ số đếm số lượng phiếu đang có.
* **Nội dung Tab 1 — Huy hiệu số (Soulbound Tokens)**:
  * *Trường hợp chưa sở hữu huy hiệu*:
    * Biểu tượng trống.
    * Đoạn thông báo hướng dẫn người dùng hoàn thành lộ trình để nhận huy hiệu.
    * Nút bấm điều hướng sang trang lộ trình để bắt đầu.
  * *Trường hợp danh sách huy hiệu đã đạt được*:
    * Danh thiếp hiển thị từng huy hiệu:
      * Nhãn phân loại chứng nhận: "Không thể chuyển nhượng".
      * Tên huy hiệu chứng nhận thành tích tuyến.
      * Chuẩn kỹ thuật số của huy hiệu.
      * Tên mạng phân tán xác thực.
      * Ngày tháng cấp phát huy hiệu.
* **Nội dung Tab 2 — Phiếu ưu đãi (Vouchers)**:
  * *Trường hợp chưa có phiếu*:
    * Biểu tượng trống.
    * Đoạn thông báo giải thích phiếu ưu đãi sẽ được cấp khi hoàn thành tuyến.
    * Nút bấm bắt đầu tour xe buýt.
  * *Trường hợp danh sách phiếu ưu đãi đã nhận*:
    * Nhóm các phiếu còn hiệu lực sử dụng:
      * Tên quán đối tác áp dụng.
      * Nội dung chi tiết mức ưu đãi hoặc giảm giá.
      * Ngày hết hạn sử dụng của phiếu.
      * Nhãn trạng thái "Còn hiệu lực".
      * Nút bấm "Sử dụng" để mở màn hình xuất trình mã QR đổi thưởng.
    * Nhóm các phiếu đã sử dụng:
      * Tên quán đối tác.
      * Nội dung ưu đãi hiển thị dạng gạch ngang.
      * Nhãn trạng thái "Đã sử dụng".
* **Khối thanh điều hướng dưới đáy màn hình**.

---

### MÀN HÌNH 5: XUẤT TRÌNH MÃ QR SỬ DỤNG PHIẾU ƯU ĐÃI (VOUCHER QR REDEMPTION)
Màn hình khách hàng xuất trình mã QR tại quầy thanh toán của quán đối tác để được áp dụng giảm giá trực tiếp.

* **Thanh tiêu đề trang**:
  * Nút bấm quay lại màn hình Ví cá nhân.
  * Tiêu đề màn hình xác nhận sử dụng phiếu ưu đãi.
  * Nhãn ghi chú: "Sử dụng một lần".
* **Khối tóm tắt thông tin ưu đãi**:
  * Tên quán đối tác áp dụng ưu đãi.
  * Dòng thông tin giá trị ưu đãi được trừ vào hóa đơn.
  * Hạn áp dụng của phiếu.
* **Khung hiển thị mã QR động**:
  * Hình ảnh mã QR kích thước lớn hiển thị ở vị trí trung tâm.
  * Mã QR được gắn kèm chữ ký mật mã có thời hạn giới hạn ngắn.
  * Bộ đếm ngược thời gian làm mới mã (đếm lùi từ 30 giây về 0).
  * Thanh chỉ báo thời gian tự động thu ngắn theo số giây còn lại.
  * Đoạn giải thích cơ chế bảo mật: Mã QR tự làm mới để chống việc chụp màn hình gửi cho người khác, yêu cầu đưa trực tiếp cho nhân viên quán quét.
* **Trạng thái khi phiếu đã được sử dụng thành công**:
  * Ẩn toàn bộ mã QR.
  * Hiển thị biểu tượng xác nhận phiếu đã đổi thành công.
  * Đoạn thông báo nêu rõ phiếu chỉ có giá trị dùng một lần và đã được ghi nhận hoàn tất.
  * Nút bấm quay trở về Ví cá nhân.
* **Lối tắt dành cho thử nghiệm luồng**:
  * Dòng liên kết chuyển nhanh sang màn hình nhân viên quán quét để kiểm tra tính năng.

---

### MÀN HÌNH 6: QUÁN ĐỐI TÁC XÁC THỰC PHIẾU ƯU ĐÃI (MERCHANT VERIFICATION)
Màn hình dành riêng cho nhân viên thu ngân hoặc quản lý của quán đối tác để quét kiểm tra và xác nhận áp dụng ưu đãi cho khách hàng.

* **Thanh tiêu đề trang**:
  * Nút bấm quay lại trang chính.
  * Tên định danh của quán đối tác được phân quyền.
  * Nhãn phân loại tài khoản đối tác.
* **Khung ngắm máy ảnh quét mã khách hàng**:
  * Vùng hiển thị camera của thiết bị nhân viên quán.
  * Khung định vị ngắm mã QR.
  * Dòng chữ hướng dẫn nhân viên hướng camera vào màn hình điện thoại của khách hàng.
* **Khung hiển thị phản hồi kết quả xác thực**:
  * *Trạng thái xác thực thành công*:
    * Tiêu đề thông báo xác nhận thành công.
    * Tên ưu đãi vừa được áp dụng vào hóa đơn.
    * Thông tin giao dịch đã được ghi nhận trên hợp đồng thông minh.
  * *Trạng thái xác thực bị từ chối*:
    * Tiêu đề cảnh báo từ chối giao dịch.
    * Thông báo nêu rõ lý do: Phiếu ưu đãi này đã được đổi trước đó, hợp đồng từ chối xử lý để chống gian lận dùng lặp lại.
* **Danh sách các phiếu khách hàng đang trình diện tại quầy**:
  * *Danh sách phiếu hợp lệ chưa dùng*:
    * Mã định danh của phiếu.
    * Nội dung mức giảm giá.
    * Nhãn trạng thái hợp lệ.
    * Nút bấm "Xác nhận đổi thưởng".
  * *Danh sách phiếu đã qua sử dụng*:
    * Mã định danh của phiếu.
    * Nội dung ưu đãi có gạch ngang.
    * Nhãn trạng thái đã sử dụng.
    * Nút bấm "Quét lại (Thử lỗi từ chối)" để người dùng hoặc ban giám khảo kiểm tra phản hồi từ chối của hệ thống.
* **Dòng thông tin ghi chú thẩm quyền**:
  * Nêu rõ chỉ tài khoản đối tác được ủy quyền mới có quyền gọi hàm xác nhận đổi thưởng trên hợp đồng thông minh.

---

### TÓM TẮT SƠ ĐỒ LUỒNG TƯƠNG TÁC GIỮA CÁC MÀN HÌNH

```
[Màn hình 1: Trang chủ]
       │
       ├──► [Màn hình 2: Chi tiết lộ trình & Bản đồ tuyến xe]
       │           │
       │           ├──► [Tab Bản đồ & Hướng dẫn các tuyến buýt] ──► Mở bản đồ chỉ đường
       │           │
       │           └──► [Tab Nhiệm vụ Check-in]
       │                       │
       ├──► [Màn hình 3: Quét QR check-in tại trạm] ◄──┘
       │           │
       │           └── (Đi đủ các trạm) ──► Nhận thưởng On-chain
       │                                         │
       ├──► [Màn hình 4: Ví cá nhân] ◄───────────┘
       │           │
       │           └── (Chọn phiếu còn hạn) ──► [Màn hình 5: Xuất trình QR đổi phiếu]
       │                                                      │
       └──► [Màn hình 6: Quán đối tác xác thực phiếu] ◄───────┘
                   │
                   ├── Lần quét 1: Hợp lệ ──► Đổi thưởng thành công
                   └── Lần quét 2: Đã dùng ──► Từ chối giao dịch
```
