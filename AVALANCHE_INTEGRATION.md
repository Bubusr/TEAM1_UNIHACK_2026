# AVALANCHE_INTEGRATION: BusQuest

Tệp này ghi yêu cầu tích hợp Avalanche của cuộc thi, dự án đáp ứng đến đâu, và những gì còn thiếu. Dùng làm danh sách kiểm tra trước khi nộp.

## Yêu cầu của cuộc thi (theo slide giới thiệu của ban tổ chức)

- Tích hợp Avalanche chiếm 25 trên 100 điểm; Kỹ thuật chiếm 25 điểm.
- Dự án cần có một phần chạy thật trên Avalanche (ví dụ smart contract, thanh toán, NFT, token hoặc đăng nhập ví) để ghi điểm tích hợp.
- Lý do Avalanche được nêu: tương thích EVM hoàn toàn, xác thực giao dịch khoảng một giây, phí gas rất thấp, cho phép tạo L1 riêng với luật chơi và token gas độc lập.
- Bài nộp cần chứng minh được bằng link dApp chạy được, GitHub và video demo.

## Đối chiếu với BusQuest

| Hình thức tích hợp | Có trong BusQuest MVP? | Ở đâu |
| --- | --- | --- |
| Smart contract | Có | CheckInManager, BadgeNFT, VoucherManager trên Fuji |
| NFT | Có | BadgeNFT (ERC-721 không chuyển nhượng) |
| Đăng nhập ví | Có, gián tiếp | Ví nhúng tạo từ đăng nhập Google; mọi giao dịch ký bằng ví này trên Fuji |
| Thanh toán | Không | Voucher là ưu đãi của quán, không phải thanh toán bằng token |
| Token | Không | Không phát token có giá trị; hạn mức ưu đãi chỉ là bộ đếm trong hợp đồng |
| L1 riêng và ICM | Không (P2) | Chỉ làm nếu MVP xong sớm |

## Mạng và công cụ

- Mạng: Avalanche Fuji, C-Chain (testnet). Chain id Fuji C-Chain là 43113 và có RPC công khai của Avalanche; nhóm cần kiểm tra lại giá trị và URL trong Avalanche Builder Hub trước khi dùng, không sao chép từ tệp này.
- Token thử: lấy ở mục Testnet Faucet trên trang của Team1 Vietnam.
- Công cụ: Foundry, OpenZeppelin, wagmi hoặc viem, nhà cung cấp ví nhúng.
- Thông tin đăng ký: team1vn.xyz (đăng nhập Google để tạo profile và Avalanche Builder Hub).

## Vì sao Avalanche (để dùng trong pitch, chỉ nói điều đúng)

- Mỗi lượt hoàn thành lộ trình, phát voucher và xác nhận voucher là giao dịch nhỏ; phí thấp và xác nhận nhanh giúp người dùng không phải chờ hay trả phí đáng kể.
- Tương thích EVM nên dùng được Solidity và Foundry quen thuộc.
- Có đường mở rộng sang L1 riêng nếu số giao dịch tăng. Chỉ nói "có đường mở rộng", không nói đã làm.

## Đánh đổi cần quyết định (chưa chốt)

Thiết kế hiện tại giữ từng lượt check-in ở máy chủ, chỉ đưa hoàn thành lộ trình, huy hiệu và voucher lên chain, để không phơi lịch sử di chuyển lên blockchain công khai. Hệ quả: số giao dịch on-chain ít hơn, nên lập luận "nhiều giao dịch nhỏ cần L1 riêng" yếu đi. Các lựa chọn:

1. Giữ nguyên thiết kế riêng tư (đang chọn). Lập luận Avalanche dựa vào mint huy hiệu, phát và xác nhận voucher, và đường mở rộng.
2. Cho người chơi chọn bật ghi từng check-in lên chain (tùy chọn, mặc định tắt, có cảnh báo rõ). Tăng hoạt động on-chain, đánh đổi bằng riêng tư.
3. Dựng Game L1 riêng cho trạng thái game và nối C-Chain bằng ICM. Phạm vi lớn, chỉ làm nếu hợp đồng đã chạy ổn định sớm.

Điều chưa biết: ban giám khảo chấm "Tích hợp Avalanche" nghiêng về việc dùng L1 hay chỉ cần hợp đồng trên Fuji. Nên hỏi ban tổ chức (nhóm Telegram của Team1 Vietnam hoặc buổi workshop) trước khi quyết định đầu tư vào L1.

Ghi chú: slide của đề mẫu có nói rằng ở những đề nêu Fuji thì dùng L1 riêng hoặc C-Chain mainnet cũng được. BusQuest không nằm trong danh sách đề mẫu nên câu đó không áp dụng trực tiếp.

## Danh sách kiểm tra bằng chứng tích hợp trước khi nộp

- [ ] Ba hợp đồng đã triển khai lên Fuji; địa chỉ ghi trong README và file cấu hình.
- [ ] Mã nguồn hợp đồng công khai trong repo; nếu công cụ khám phá khối cho phép thì xác minh mã nguồn.
- [ ] Video demo có ít nhất một giao dịch thật trên Fuji (hoàn thành lộ trình và xác nhận voucher), kèm đường dẫn tới giao dịch.
- [ ] Link dApp mở được trên điện thoại khác, không cần tài khoản của nhóm.
- [ ] Slide có phần "Vì sao Avalanche" khớp với những gì đã làm.
- [ ] README nêu rõ cái gì chạy trên chain, cái gì chạy ở máy chủ, và vì sao.

## Không được nói sai

- Không nói đã chạy mainnet; đây là testnet.
- Không nói đã dùng L1 riêng hoặc ICM nếu chưa làm.
- Không nói có đối tác quán hoặc đơn vị vận hành nếu chưa có thỏa thuận.
- Không nói hệ thống xác minh được người chơi ngồi trên xe buýt; chỉ nói đã đi qua các điểm trong thời gian hợp lý.
