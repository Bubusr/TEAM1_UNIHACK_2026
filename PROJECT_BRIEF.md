# PROJECT_BRIEF: BusQuest

## Bối cảnh cuộc thi

- Sự kiện: UniHack 2026 do Team1 Vietnam tổ chức, online, từ 2/11 đến 30/11/2026.
- Nền tảng: Avalanche. Tương thích EVM hoàn toàn (Solidity, Hardhat, Foundry, ví MetaMask hoặc Core), xác thực giao dịch khoảng một giây, phí gas rất thấp, cho phép tạo L1 riêng với luật chơi và token gas độc lập (theo slide giới thiệu của ban tổ chức).
- Không bắt buộc theo track cố định. Có thể chọn từ 20 đề gợi ý chia theo 4 track (Social finance, Game on L1, AI agents & security, Agent economy x402), hoặc mang dự án riêng và tích hợp một phần chạy thật trên Avalanche (smart contract, thanh toán, NFT, token, đăng nhập ví).
- Hạn nộp: 23h59 ngày 21/11/2026. Bài nộp gồm link dApp, GitHub công khai (hoặc add tuantqse90 nếu private), slide Canva hoặc Google Slides, video demo 2-3 phút.
- Quy tắc của các đề mẫu: nếu không demo được thì không nộp.

### Thang điểm (100 điểm)

| Tiêu chí | Điểm |
| --- | --- |
| Kỹ thuật | 25 |
| Tích hợp Avalanche | 25 |
| Sáng tạo và đổi mới | 15 |
| Tác động và use case | 15 |
| UI/UX và demo | 10 |
| Thuyết trình và pitching | 10 |

Mọi pitch phải trả lời ba câu: vì sao on-chain, vì sao Avalanche, tiền hoặc lợi ích đến từ đâu; và nêu đúng giới hạn pháp lý ở Việt Nam.

## Vấn đề

- Sinh viên ít tiền, không biết đi chơi ở đâu cho rẻ.
- Xe buýt có nhiều tuyến đi qua chỗ hay nhưng ít người trẻ đi.
- Quán cà phê nhỏ và di tích ít người biết khó tìm khách trẻ, và quán không đo được ưu đãi của mình có mang khách đến hay không.

## Giải pháp

Ứng dụng gợi ý lộ trình đi buýt gồm 2-4 điểm. Người chơi quét QR tại từng điểm. Đủ điểm thì nhận huy hiệu NFT không chuyển nhượng và voucher của quán đối tác. Quán quét QR để xác nhận; mỗi voucher chỉ dùng một lần.

## Ba bên liên quan

| Bên | Nhận được |
| --- | --- |
| Sinh viên | Lộ trình sẵn, đi buýt rẻ, huy hiệu, ưu đãi |
| Quán và điểm tham quan | Khách mới, voucher không dùng lại được, thống kê số lượt |
| Xe buýt | Lý do để người trẻ thử đi buýt |

## Ba câu hỏi pitch (câu trả lời dự kiến)

1. Vì sao on-chain? Huy hiệu là bằng chứng hoàn thành không sửa được; voucher không thể dùng hai lần; quán kiểm tra ngay không cần đối soát; hạn mức ưu đãi công khai.
2. Vì sao Avalanche? Phí gần bằng 0 và xác nhận nhanh cho các giao dịch nhỏ (mint huy hiệu, phát và xác nhận voucher); EVM tương thích nên dùng công cụ quen thuộc; có đường mở rộng sang L1 riêng.
3. Lợi ích từ đâu ra? Từ quán đối tác: họ cấp ưu đãi để có khách mới (giống chi phí quảng cáo nhưng đo được). Người chơi không phải trả gì. Nếu chưa có quán thật, ghi rõ ưu đãi trong demo là mô phỏng.

## Giới hạn pháp lý và đạo đức (phải nói đúng trong pitch)

- Đây là bản demo kỹ thuật trên testnet.
- Voucher là ưu đãi của quán (giảm giá, tặng món), không phải tiền hay công cụ đầu tư; không dùng token có giá trị thật.
- Phần thưởng dựa trên việc đi đủ điểm, không dựa trên may rủi.
- Vị trí là dữ liệu cá nhân: cần xin đồng ý, nói rõ thu thập để làm gì, và không lưu tọa độ.
- Chưa kiểm tra văn bản pháp luật hiện hành; nhóm cần tự đối chiếu quy định mới nhất về tài sản số và dữ liệu cá nhân (kể cả trẻ vị thành niên) trước khi viết phần pháp lý vào slide.

## Hạn chế cần nói thật

- Máy chủ xác thực là điểm tập trung.
- Hệ thống chứng minh được người chơi đã đi qua các điểm trong khoảng thời gian hợp lý, chưa chứng minh được đã ngồi trên xe buýt. Hướng mở rộng là dữ liệu vé điện tử của đơn vị vận hành (chưa liên hệ).
- Kiểm tra vị trí chỉ là kiểm tra yếu vì tọa độ do điện thoại gửi.
- Chưa có quán đối tác thật, chưa có xác nhận được phép dán QR tại điểm thật.
