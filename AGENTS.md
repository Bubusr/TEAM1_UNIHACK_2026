# AGENTS.md: BusQuest

Tệp này dành cho trợ lý AI (và người mới vào nhóm). Đọc hết tệp này trước khi viết bất kỳ dòng code nào.

## Dự án là gì

BusQuest là ứng dụng web mobile "tour xe buýt có nhiệm vụ". Người chơi đi qua 2-4 điểm (quán cà phê, di tích, trường học) theo một lộ trình, quét QR để check-in từng điểm. Hoàn thành lộ trình thì nhận một huy hiệu NFT không chuyển nhượng và một voucher dùng một lần của quán đối tác. Quán quét QR để xác nhận voucher.

Dự án làm cho cuộc thi UniHack 2026 của Team1 Vietnam, chạy trên Avalanche (mạng thử Fuji, C-Chain). Hạn nộp: 23h59 ngày 21/11/2026. Đây là bản demo kỹ thuật trên testnet, không phải sản phẩm tài chính vận hành thật.

## Trạng thái hiện tại (tính đến 12/11/2026)

Chưa có code. Mới có tài liệu thiết kế. Mọi thứ trong ARCHITECTURE.md là thiết kế dự kiến, chưa được triển khai.

## Đọc theo thứ tự này

1. PROJECT_BRIEF.md: bối cảnh cuộc thi, vấn đề, giải pháp, thang điểm.
2. REQUIREMENTS.md: yêu cầu chức năng và phi chức năng, có mã (FR-xx) và tiêu chí chấp nhận.
3. ARCHITECTURE.md: thành phần, hợp đồng thông minh, API, dữ liệu, luồng.
4. AVALANCHE_INTEGRATION.md: yêu cầu tích hợp Avalanche của cuộc thi và cách dự án đáp ứng.

## Quyết định đã chốt

- Mạng: Avalanche Fuji (C-Chain). Game L1 riêng và ICM chỉ làm nếu hợp đồng đã chạy xong sớm; không phải phạm vi MVP.
- Ba hợp đồng: CheckInManager, BadgeNFT, VoucherManager (Solidity, Foundry, OpenZeppelin).
- Từng lượt check-in ở từng điểm nằm ở máy chủ xác thực (off-chain). Trên chain chỉ có sự kiện hoàn thành lộ trình, huy hiệu và voucher. Lý do: không phơi lịch sử di chuyển của người dùng lên blockchain công khai.
- Máy chủ xác thực ký xác nhận bằng EIP-712; hợp đồng kiểm tra chữ ký.
- Huy hiệu là ERC-721 không chuyển nhượng (chỉ mint và burn).
- Voucher chỉ dùng một lần, có hạn dùng; chủ voucher ký chữ ký ngắn hạn để quán xác nhận.
- Máy chủ không lưu tọa độ GPS; chỉ lưu kết quả đạt hoặc không đạt.
- MVP chỉ có một lộ trình mẫu 3 điểm.
- Phần thưởng dựa trên nỗ lực (đi đủ điểm), không dựa trên may rủi.

## Chưa chốt (hỏi người dùng, đừng tự đoán)

- Số người trong nhóm và ai phụ trách mảng nào.
- Nhà cung cấp ví nhúng (Privy, Thirdweb hay Web3Auth) và việc có trả gas hộ không.
- Framework máy chủ xác thực và cơ sở dữ liệu cụ thể.
- Ba điểm của lộ trình mẫu, tọa độ và tên chính xác.
- Quán đối tác thật (hiện chưa có; nếu chưa có thì ưu đãi trong demo là mô phỏng).
- Khoảng thời gian tối thiểu và tối đa giữa hai điểm (đặt theo khảo sát tuyến thật).

## Stack dự kiến

Solidity + Foundry + OpenZeppelin (ERC-721, EIP-712, ECDSA); Next.js mobile-first; wagmi hoặc viem; ví nhúng; máy chủ API Node.js; thư viện quét QR trên trình duyệt. Chỉ thêm thư viện khác khi cần và nói rõ lý do.

## Quy tắc khi viết code

- Không commit khóa riêng, khóa ký của máy chủ, file .env hay cụm từ khôi phục. Dùng biến môi trường; thêm .env vào .gitignore ngay từ đầu.
- Không lưu tọa độ GPS; không lưu email cạnh dữ liệu check-in.
- Không ghi từng lượt check-in lên chain nếu chưa được người dùng đồng ý (xem AVALANCHE_INTEGRATION.md, mục đánh đổi).
- Không bịa địa chỉ hợp đồng, chain id, URL hay tên API. Địa chỉ hợp đồng lấy từ một file cấu hình duy nhất dùng chung cho frontend và máy chủ.
- Không triển khai lên mainnet. Mọi giao diện và tài liệu ghi rõ "bản demo trên testnet".
- Hợp đồng: dùng custom error và event, có test Foundry cho cả đường thành công và đường bị từ chối (xem danh sách test trong ARCHITECTURE.md).
- Giao diện tiếng Việt, mỗi màn hình một hành động chính, không hiện các từ gas, transaction, địa chỉ ví dài với người chơi.
- Chế độ giả lập vị trí chỉ bật bằng biến môi trường và phải có biểu ngữ hiển thị rõ khi bật.
- Giữ đúng phạm vi MVP trong REQUIREMENTS.md (mức P0). Không tự thêm tính năng P1 hoặc P2.

## Định nghĩa hoàn thành MVP

Một người dùng mới đăng nhập bằng Google trên điện thoại, check-in đủ 3 điểm, nhận huy hiệu và voucher qua một giao dịch trên Fuji, hiện QR voucher, quán quét và xác nhận thành công, quét lại lần hai thì bị từ chối. Toàn bộ luồng chạy từ link dApp công khai.

## Cách làm việc

- Khi thiếu thông tin, hỏi; khi buộc phải giả định, ghi giả định ra rõ ràng.
- Thay đổi nhỏ, từng bước; chạy forge build và forge test trước khi báo xong phần hợp đồng.
- Lệnh chạy frontend và máy chủ: chưa chốt, sẽ ghi vào README khi dựng xong.
