# REQUIREMENTS: BusQuest

Mức ưu tiên: P0 = bắt buộc cho MVP (không có thì không demo được); P1 = làm nếu còn thời gian; P2 = hướng mở rộng, không làm trong cuộc thi.

## Yêu cầu chức năng

| Mã | Mức | Yêu cầu | Tiêu chí chấp nhận |
| --- | --- | --- | --- |
| FR-01 | P0 | Đăng nhập bằng Google, ví nhúng tự tạo | Người dùng mới đăng nhập trên điện thoại và có địa chỉ ví mà không phải cài ví riêng |
| FR-02 | P0 | Xem danh sách lộ trình và chi tiết từng điểm | Hiện tên, số điểm, thời gian ước tính, huy hiệu sẽ nhận; chi tiết có thứ tự điểm và mô tả ngắn; dữ liệu đọc từ file dữ liệu |
| FR-03 | P0 | Check-in bằng cách quét QR tại điểm | QR hợp lệ và đúng vị trí thì tiến độ tăng; QR sai, hết hiệu lực hoặc trỏ sang tên miền khác thì báo lỗi rõ và không ghi nhận |
| FR-04 | P0 | Xem tiến độ lộ trình | Hiện đã check-in mấy trên tổng số điểm |
| FR-05 | P0 | Hoàn thành lộ trình, nhận huy hiệu và voucher | Đủ điểm hợp lệ thì máy chủ ký xác nhận; một giao dịch trên Fuji mint một huy hiệu và phát một voucher; hoàn thành lần hai cùng lộ trình bị từ chối |
| FR-06 | P0 | Trang Ví của tôi | Hiện huy hiệu, voucher còn hạn, voucher đã dùng |
| FR-07 | P0 | Dùng voucher bằng QR ngắn hạn | QR chứa chữ ký có hạn dùng vài chục giây; hết hạn thì không dùng được |
| FR-08 | P0 | Màn hình quán xác nhận voucher | Quán quét QR; hợp lệ thì voucher chuyển sang đã dùng; quét lại lần hai, voucher hết hạn, sai quán hoặc sai chữ ký thì bị từ chối |
| FR-09 | P0 | Luật chống gian lận ở máy chủ | Một check-in mỗi điểm mỗi ngày; khoảng thời gian tối thiểu và tối đa giữa hai điểm; giới hạn số lộ trình mỗi ngày; kiểm tra khoảng cách lúc check-in; giới hạn tần suất gọi API |
| FR-10 | P0 | Chế độ giả lập vị trí cho demo | Chỉ bật bằng biến môi trường; có biểu ngữ hiển thị rõ khi bật; được khai báo với ban giám khảo |
| FR-11 | P1 | Streak đi buýt theo ngày hoặc tuần | Hiện chuỗi hiện tại; mất chuỗi khi bỏ ngày |
| FR-12 | P1 | Bộ sưu tập huy hiệu theo chủ đề hoặc quận | Đủ bộ thì có huy hiệu đặc biệt |
| FR-13 | P1 | Quán xem số liệu tổng hợp | Chỉ thấy số voucher đã phát và đã dùng theo ngày, không thấy ví từng khách |
| FR-14 | P1 | Quán nạp hạn mức ưu đãi | Hết hạn mức thì không phát thêm voucher của quán đó |
| FR-15 | P1 | QR điểm đổi mã theo ngày hiển thị trên màn hình quán | Mã hôm qua không còn dùng được |
| FR-16 | P2 | Game L1 riêng và ICM | Không thuộc phạm vi cuộc thi trừ khi MVP xong sớm |
| FR-17 | P2 | Bảng xếp hạng theo lớp hoặc trường | Không xếp hạng cá nhân công khai |
| FR-18 | P2 | Ước tính CO2 tiết kiệm | Phải ghi rõ là ước tính và nêu cách tính |
| FR-19 | P2 | Kết nối dữ liệu vé điện tử của đơn vị vận hành | Cần đối tác; chưa liên hệ |

## Yêu cầu phi chức năng

### Riêng tư

- Lấy vị trí chỉ lúc bấm check-in, không chạy nền.
- Máy chủ không lưu tọa độ; chỉ lưu kết quả đạt hoặc không đạt.
- Không ghi từng lượt check-in kèm giờ lên chain; chain chỉ có hoàn thành lộ trình và trạng thái voucher.
- Hiển thị biệt danh, không hiện email hay tên thật; không lưu email cạnh dữ liệu check-in.
- Đặt thời hạn xóa dữ liệu check-in ở máy chủ.
- Quán chỉ xem số liệu tổng hợp.
- Huy hiệu do người chơi chủ động bấm nhận; chủ huy hiệu burn được.

### Bảo mật

- Không có khóa riêng, khóa ký hay file .env trong repo.
- Chữ ký EIP-712 gắn chain id, địa chỉ hợp đồng, địa chỉ người chơi, nonce dùng một lần và deadline.
- Hợp đồng cho phép chủ hợp đồng đổi địa chỉ verifier nếu lộ khóa.
- Ứng dụng chỉ chấp nhận QR trỏ đúng tên miền của mình.

### Trải nghiệm

- Mobile-first; mỗi màn hình một hành động chính.
- Không hiện thuật ngữ crypto (gas, transaction, địa chỉ ví dài) với người chơi.
- Giao diện tiếng Việt.
- Có nhãn "bản demo trên testnet" trong ứng dụng và slide.

### Chất lượng

- Hợp đồng có test Foundry cho đường thành công và đường bị từ chối (danh sách trong ARCHITECTURE.md).
- Có README nêu cách chạy, địa chỉ hợp đồng, hạn chế đã biết.

## Ràng buộc

- Hạn nộp 23h59 ngày 21/11/2026; mục tiêu nộp xong trong ngày 20/11/2026.
- Nhóm nhỏ (dự kiến 3 người, chưa xác nhận).
- Mạng Fuji; token thử lấy từ Testnet Faucet của Team1 Vietnam.
- Chỉ một lộ trình mẫu 3 điểm cho MVP.

## Ngoài phạm vi

- Mainnet, tiền hoặc token có giá trị thật.
- Thanh toán vé xe buýt.
- Theo dõi vị trí liên tục hoặc hiện vị trí người chơi khác.
- Thưởng dựa trên may rủi.
