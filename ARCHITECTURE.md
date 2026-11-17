# ARCHITECTURE: BusQuest

Đây là thiết kế dự kiến (chưa có code). Các tên hàm, trường dữ liệu và endpoint là đề xuất; được phép điều chỉnh khi cài đặt, nhưng phải giữ các nguyên tắc ở cuối tệp.

## Thành phần

| Thành phần | Nơi chạy | Việc làm |
| --- | --- | --- |
| Ứng dụng người chơi | Trình duyệt điện thoại (Next.js) | Đăng nhập, xem lộ trình, quét QR, nhận thưởng, Ví của tôi, mã dùng voucher |
| Màn hình quán | Cùng ứng dụng, tài khoản quán | Quét QR voucher, gửi giao dịch xác nhận |
| Máy chủ xác thực | Node.js, ngoài chain | Kiểm tra QR, vị trí, luật chống gian lận; lưu tiến độ; ký xác nhận hoàn thành |
| CheckInManager | Fuji C-Chain | Kiểm tra chữ ký hoàn thành, ghi đã hoàn thành, gọi mint huy hiệu và phát voucher |
| BadgeNFT | Fuji C-Chain | Huy hiệu ERC-721 không chuyển nhượng |
| VoucherManager | Fuji C-Chain | Voucher, hạn mức quán, xác nhận dùng |

Người chơi nói chuyện với máy chủ để check-in và xin chữ ký, rồi tự gửi giao dịch lên Fuji. Quán gửi giao dịch xác nhận voucher.

## Hợp đồng thông minh

Công cụ: Solidity, Foundry, OpenZeppelin (ERC721, EIP712, ECDSA, Ownable).

### CheckInManager

- Trạng thái: verifier (địa chỉ máy chủ), completed[player][routeId], usedNonce[player][nonce].
- completeRoute(routeId, deadline, nonce, signature): người gọi là người chơi. Kiểm tra: chưa hết deadline, nonce chưa dùng, chưa hoàn thành lộ trình này, chữ ký đúng từ verifier. Sau đó đánh dấu hoàn thành, gọi BadgeNFT.mint(player, routeId) và VoucherManager.issue(player, routeId); phát sự kiện RouteCompleted(player, routeId).
- setVerifier(address): chỉ chủ hợp đồng.

### BadgeNFT

- ERC-721. mint(to, routeId): chỉ CheckInManager. burn(tokenId): chủ huy hiệu.
- Chặn mọi chuyển nhượng; chỉ cho phép mint (from = 0) và burn (to = 0).
- tokenURI trỏ tới metadata và hình ngoài chain, theo routeId.

### VoucherManager

- Trạng thái: vouchers[id] gồm owner, partner, routeId, expiry, used; partnerQuota[partner]; isPartner[address]; routePartner[routeId].
- issue(to, routeId): chỉ CheckInManager. Lấy quán theo routeId, trừ hạn mức, tạo voucher; hết hạn mức thì revert; phát VoucherIssued(voucherId, owner, partner, routeId).
- redeem(voucherId, expiry, signature): người gọi phải là quán của voucher. Kiểm tra: chưa dùng, chưa hết hạn voucher, expiry của chữ ký chưa qua, chữ ký đúng từ chủ voucher. Đánh dấu used; phát VoucherRedeemed(voucherId, partner).
- registerPartner(address), setRoutePartner(routeId, partner), setQuota(partner, amount): chủ hợp đồng.

### Dữ liệu ký EIP-712

Miền (domain): tên, phiên bản, chain id, địa chỉ hợp đồng kiểm tra.

- Completion(address player, uint256 routeId, uint256 nonce, uint256 deadline): do máy chủ ký.
- Redeem(uint256 voucherId, address partner, uint256 expiry): do chủ voucher ký (trong ứng dụng người chơi), hiện thành QR ngắn hạn.

### Test Foundry cần có

- Chữ ký hợp lệ: hoàn thành lộ trình, nhận đúng một huy hiệu và một voucher.
- Chữ ký sai người, sai lộ trình, hết hạn hoặc nonce đã dùng: bị từ chối.
- Hoàn thành lần hai cùng lộ trình: bị từ chối.
- Huy hiệu không chuyển nhượng được; burn được.
- Voucher dùng lần hai, hết hạn, sai quán, sai chữ ký: bị từ chối.
- Hết hạn mức quán: không phát thêm voucher.

## Máy chủ xác thực

| Endpoint | Việc làm |
| --- | --- |
| GET /api/routes | Trả danh sách lộ trình và điểm dừng từ file dữ liệu |
| POST /api/checkin | Nhận routeId, stopId, mã QR, tọa độ một lần; kiểm tra mã, khoảng cách, luật chống gian lận; ghi check-in; không lưu tọa độ |
| GET /api/progress/:routeId | Trả số điểm đã check-in của người đang đăng nhập |
| POST /api/complete | Nếu đủ điểm hợp lệ thì tạo nonce và deadline, ký Completion, trả chữ ký |

Xác thực phiên: dùng token phiên của nhà cung cấp ví nhúng (chưa chọn nhà cung cấp).

### Luật chống gian lận

- Một check-in mỗi điểm mỗi ngày.
- Khoảng thời gian tối thiểu và tối đa giữa hai điểm liên tiếp (giá trị đặt theo khảo sát tuyến thật, chưa có số).
- Giới hạn số lộ trình hoàn thành mỗi ngày cho mỗi người.
- Kiểm tra khoảng cách tới điểm dừng lúc check-in (kiểm tra yếu).
- Giới hạn tần suất gọi API.
- Giả lập vị trí chỉ khi biến môi trường bật, có biểu ngữ.

### Mã QR điểm

Đường dẫn về tên miền của ứng dụng kèm mã điểm. MVP: mã cố định in giấy, bù bằng kiểm tra vị trí và luật trên. Nâng cấp (P1): mã đổi theo ngày hiển thị trên màn hình quán. Ứng dụng chỉ chấp nhận QR trỏ đúng tên miền.

## Dữ liệu ở máy chủ

| Bảng | Trường chính |
| --- | --- |
| users | mã ẩn danh, địa chỉ ví, biệt danh |
| routes | id, tên, mô tả (có thể là file dữ liệu) |
| stops | id, routeId, thứ tự, tên, tọa độ, mã QR (có thể là file dữ liệu) |
| checkins | userId, stopId, ngày (không có tọa độ) |

Đặt thời hạn xóa cho checkins. Không lưu email cạnh checkins.

## Luồng

### Check-in và hoàn thành lộ trình

1. Người chơi đăng nhập, chọn lộ trình, đến điểm đầu.
2. Quét QR; ứng dụng gửi mã QR và tọa độ lên máy chủ.
3. Máy chủ kiểm tra mã, khoảng cách và luật; hợp lệ thì ghi check-in và trả tiến độ.
4. Lặp lại cho đến khi đủ điểm.
5. Người chơi bấm nhận thưởng; máy chủ kiểm tra đủ điểm rồi ký Completion.
6. Ứng dụng gửi completeRoute lên CheckInManager.
7. Hợp đồng kiểm tra chữ ký, mint huy hiệu, phát voucher.

### Dùng voucher

1. Người chơi mở voucher; ứng dụng ký Redeem ngắn hạn và hiện thành QR.
2. Quán quét QR trên màn hình quán.
3. Ứng dụng quán gửi redeem lên VoucherManager.
4. Hợp đồng kiểm tra và đánh dấu đã dùng.
5. Quán thấy kết quả; quét lại lần nữa thì bị từ chối.

## Cấu hình và bí mật

- Địa chỉ hợp đồng, chain id và URL RPC nằm trong một file cấu hình duy nhất dùng chung cho frontend và máy chủ.
- Khóa ký của máy chủ và mọi bí mật nằm trong biến môi trường, không vào repo.

## Nguyên tắc không được phá

1. Tọa độ không được lưu ở bất kỳ đâu.
2. Từng lượt check-in không được lên chain (trừ khi người dùng quyết định khác, xem AVALANCHE_INTEGRATION.md).
3. Mọi chữ ký phải gắn chain id, hợp đồng, người ký hoặc người nhận, nonce hoặc hạn.
4. Voucher chỉ dùng một lần; huy hiệu không chuyển nhượng.
5. Không bịa địa chỉ hợp đồng, URL hay thông số kỹ thuật chưa có.
