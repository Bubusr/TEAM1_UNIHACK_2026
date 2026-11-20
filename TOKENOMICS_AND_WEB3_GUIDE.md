# 🐾 PAWS & PICKET — KINH TẾ HỌC WEB3 & MÔ HÌNH NHÀ TÀI TRỢ
*(Sustainable Web3 Economic Model, Wallet Architecture & Sponsorship Flow)*

> **Dành cho:** Tài liệu chiến lược sản phẩm, nộp hồ sơ Hackathon (UNIHACK 2026), và cẩm nang trả lời Ban Giám Khảo (Q&A Pitching Guide).

---

## 📌 1. TỔNG QUAN TÓM TẮT (Executive Summary — 30s Pitch)

Paws & Picket áp dụng mô hình **Kinh tế 2 tầng (Dual-Layer Web 2.5 Economy)**:
1. **Tầng Off-chain (Web2):** Đồng xu **🪙 Paw Coins** sinh ra từ việc chăm sóc thú cưng và trồng trọt, tiêu thụ khép kín 100% trong game. Không cho phép rút coin trực tiếp ra tiền crypto/AVAX nhằm **triệt tiêu hoàn toàn nạn bot cày tiền và lạm phát**.
2. **Tầng On-chain (Web3 - Avalanche Fuji/Mainnet):** Chỉ khi thú cưng được chăm sóc chu đáo lâu dài (Bond XP $\ge$ 100) và ảnh đạt chuẩn AI Vision (Score $\ge$ 80), người chơi mới có quyền mint **📜 Pet Passport (ERC-721 NFT)** vào ví cá nhân.
3. **Nhà tài trợ (Brands & Quỹ cứu trợ động vật):** Tham gia tài trợ voucher giảm giá thức ăn/phòng khám ngoài đời thực (**Real-World Assets - RWA**) và quỹ cứu hộ thú hoang, biến hành động chơi game thành giá trị xã hội minh bạch trên blockchain.

---

## 🪙 2. TẠI SAO COIN TRONG GAME KHÔNG ĐỔI TRỰC TIẾP RA AVAX?

### 2.1. Bài học xương máu từ các dự án Play-to-Earn đời đầu (Axie SLP, StepN GST)
* Các game Web3 thế hệ cũ cho phép người chơi "làm nhiệm vụ $\to$ nhận token $\to$ bán token lấy tiền thật từ quỹ phát hành (Liquidity Pool)".
* **Hậu quả tất yếu:**
  * **Nông trại Bot (Sybil Attack):** Hacker tạo hàng chục nghìn tài khoản ảo cày cuốc 24/7.
  * **Vòng xoáy tử thần (Hyperinflation):** Ai cũng muốn rút tiền xả token, không ai muốn nạp tiền giữ token $\to$ Giá trị token sập 99% chỉ sau vài tuần, dự án phá sản.
  * **Rủi ro pháp lý:** Bị phân loại là huy động vốn trái phép, cờ bạc hoặc dịch vụ chuyển tiền không phép (Money Transmitter).

### 2.2. Giải pháp của Paws & Picket: Nền kinh tế tuần hoàn khép kín (Closed-Loop Economy)
* **Paw Coins (🪙)** là **Soft Currency nội bộ**:
  * **Cách kiếm (Faucets):** Chăm pet, thu hoạch cà rốt/lúa mì, điểm danh hàng ngày, hoàn thành đánh giá AI Judge.
  * **Cách tiêu (Sinks):** Mua hạt giống mới, mua thức ăn dinh dưỡng, mua đồ chơi tăng thể lực, mua mũ thời trang, kích hoạt lá chắn rào bảo vệ (Fence Shield).
  * **Quy tắc:** Paw Coins **chỉ có thể lưu thông trong game**, không thể rút về ví và không đổi ra AVAX.
* **Lợi ích:** Đảm bảo trải nghiệm giải trí Free-to-Play thư giãn (Cozy game), không áp lực tài chính, cân bằng vĩnh viễn và không bao giờ lo cạn kiệt ngân quỹ.

---

## 🦊 3. NẾU KHÔNG ĐỔI ĐƯỢC COIN RA TIỀN, TẠI SAO CẦN VÍ WEB3?

Nhiều người sẽ hỏi: *"Nếu chỉ chơi game và dùng coin nội bộ, dùng database Firebase thông thường là đủ, cần gì đưa Ví Avalanche vào?"*

Nếu bỏ ví đi, Paws & Picket chỉ là một game mobile thông thường. **Ví Web3 mang lại 4 siêu năng lực độc quyền mà Web2 không bao giờ làm được:**

```
                    ┌──────────────────────────────┐
                    │      VÍ WEB3 AVALANCHE       │
                    │   (Core Wallet / ERC-721)    │
                    └──────────────┬───────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 [ 1. Quyền Sở Hữu ]      [ 2. Chợ Giao Dịch ]      [ 3. Tương Thích Chéo ]
   Vĩnh viễn on-chain        P2P Marketplace          Dùng pet trong game
   Không bị admin xóa        Bán cho người khác       Metaverse khác của
   Lưu trữ IPFS phi tập      Người mua trả tiền,      hệ sinh thái Avalanche
   trung không phụ thuộc     game không tốn quỹ       không cần chung database
   vào server game
```

### 3.1. Quyền sở hữu tài sản số thực thụ (True Digital Ownership)
* **Web2 (Firebase/SQL):** Bạn chỉ đang "thuê" tài khoản. Nếu nhà phát hành đóng server hoặc khóa nick, toàn bộ công sức chăm sóc thú cưng của bạn biến mất.
* **Web3 (ERC-721 Passport):** Pet Passport nằm trong ví mật mã của bạn (`0x...`), metadata lưu trên IPFS phi tập trung. Kể cả website đóng cửa, bạn vẫn sở hữu tấm hộ chiếu số độc bản đó trên blockchain Avalanche trọn đời.

### 3.2. Thị trường tự do P2P — Bán lại Pet lấy AVAX như thế nào?
* Bạn nuôi nấng một chú chó/mèo từ lúc là thú hoang (Stray), đạt điểm AI 98, thân thiết cấp 10, gắn phụ kiện hiếm $\to$ Bạn mint thành Pet Passport NFT.
* Bạn mang Pet Passport lên chợ NFT tự do (như Joepegs, Campfire trên Avalanche) và niêm yết: *"Bán Pet Passport Mochi #1 giá 2 AVAX"*.
* Một người chơi khác yêu thích chú mèo này nhưng không có thời gian cày cuốc sẽ **bỏ 2 AVAX trong ví của họ ra mua**.
* 👉 **Điểm mấu chốt:** **Tiền AVAX này là do NGƯỜI CHƠI KHÁC TRẢ CHO BẠN (Peer-to-Peer)**, hoàn toàn không phải dự án in tiền trả cho bạn. Game vừa bảo toàn ngân quỹ, vừa tạo ra giá trị kinh tế thực tế cho người chơi chăm chỉ.

### 3.3. Khả năng tương thích chéo không cần xin phép (Interoperability)
* Bất kỳ dự án nào khác trên Avalanche (game 3D, game RPG, ứng dụng mạng xã hội Web3) đều có thể quét địa chỉ ví của bạn.
* Nếu họ thấy bạn sở hữu Pet Passport từ Paws & Picket, họ có thể cấp cho bạn một nhân vật thú cưng 3D đồng hành trong game của họ mà **không cần hai bên công ty phải làm hợp đồng chia sẻ API**.

### 3.4. Nhận đặc quyền nhà tài trợ bảo mật danh tính (Permissionless RWA Perks)
* Thương hiệu muốn tặng quà cho người chăm sóc thú cưng giỏi chỉ cần kiểm tra xem ví nào chứa Pet Passport hợp lệ.
* Người chơi kết nối ví để claim voucher giảm giá mà **không cần cung cấp email, số điện thoại hay thông tin cá nhân** cho bên thứ ba.

---

## 🏢 4. NHÀ TÀI TRỢ LÀ AI & LUỒNG TIỀN (CASH FLOW) VẬN HÀNH THẾ NÀO?

```
                      [ NHÀ TÀI TRỢ & ĐỐI TÁC ]
     ┌────────────────────────────┼───────────────────────────┐
     ▼                            ▼                           ▼
[ THƯƠNG HIỆU THÚ CƯNG ]   [ QUỸ CỨU HỘ ĐỘNG VẬT ]   [ QUỸ ECOSYSTEM GRANT ]
(Royal Canin, Purina...)   (Trạm cứu hộ chó mèo)     (Avalanche / Blizzard)
     │                            │                           │
     ▼                            ▼                           ▼
• Tài trợ Voucher giảm      • Tài trợ quỹ cứu trợ     • Cấp vốn phát triển
  giá thức ăn thật (RWA)      thú hoang (Bait &         (Dev Grants)
• Đặt banner/vật phẩm         Rescue CSR Pool)        • Tài trợ phí gas
  thương hiệu trong game                                (Paymaster)
     │                            │                           │
     └────────────────────────────┼───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │   HỆ SINH THÁI DỰ ÁN     │
                    │      PAWS & PICKET        │
                    └─────────────┬─────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ TRẢI NGHIỆM MIỄN PHÍ (WEB2) ]                 [ GIÁ TRỊ TÍCH LŨY (WEB3) ]
• Cày Paw Coins khép kín                        • Mint Pet Passport NFT
• Trồng trọt, chăm thú                          • Claim voucher ngoài đời (RWA)
• Tiếp cận hàng triệu người dùng                • Giao dịch tự do trên Marketplace
```

### 4.1. Ba nhóm nhà tài trợ chính:
1. **Thương hiệu thức ăn & Phụ kiện thú cưng (Pet Brands):**
   * *Động lực:* Tiếp cận chính xác tệp khách hàng yêu động vật, có nuôi thú cưng thật sự.
   * *Hình thức:* Tài trợ voucher tiêm phòng, giảm giá mua hạt, hạt giống độc quyền trong nông trại.
2. **Quỹ bảo trợ động vật & Trạm cứu hộ chó mèo (Animal Welfare CSR):**
   * *Động lực:* Lan tỏa thông điệp nhận nuôi và cứu trợ thú hoang (Rescue, don't shop).
   * *Hình thức:* Đóng góp vào quỹ cứu trợ. Mỗi lần người chơi giải cứu một chú thú hoang trong game qua tính năng "Bait & Rescue", một phần tiền tài trợ được chuyển về trạm cứu hộ động vật ngoài đời thực (Social Impact Proof).
3. **Quỹ phát triển hệ sinh thái Blockchain (Avalanche Foundation / Blizzard Fund):**
   * *Động lực:* Thúc đẩy người dùng phổ thông (Web2 casual gamers) bước chân vào hệ sinh thái Avalanche.
   * *Hình thức:* Cấp vốn giải thưởng Hackathon, tài trợ cơ sở hạ tầng node, hỗ trợ gasless minting (Account Abstraction).

---

## 🚀 5. CHIẾN LƯỢC ONBOARDING "WEB 2.5" — VŨ KHÍ THẮNG HACKATHON

| Tiêu chí | Game Web3 truyền thống | Paws & Picket (Web 2.5) |
| :--- | :--- | :--- |
| **Bắt đầu chơi** | Bắt cài ví Metamask, nạp tiền mua NFT mới cho chơi $\to$ **90% người dùng bỏ cuộc** | Chơi ngay qua Google/Khách, không cần ví, không tốn 1 xu $\to$ **Tối đa hóa người chơi** |
| **Kinh tế** | In token trả thưởng click-to-earn $\to$ **Lạm phát sụp đổ** | Closed-loop Soft Currency $\to$ **Bền vững 100%** |
| **Khi nào cần Ví?** | Ngay từ giây đầu tiên | Chỉ xuất hiện khi thú cưng đủ điều kiện làm Passport $\to$ **Trải nghiệm tự nhiên, không ép buộc** |
| **Giá trị Web3** | Đầu cơ tài chính ngắn hạn | Chứng thực danh tính thú cưng độc bản, giao dịch P2P và kết nối RWA |

---

## 🎤 6. CHEAT SHEET: CÂU TRẢ LỜI MẪU KHI BỊ BAN GIÁM KHẢO VẶN HỎI

### ❓ Câu 1: *"Game này bỏ ví Web3 đi, dùng database thường có được không?"*
> **Trả lời:**  
> *"Về mặt kỹ thuật thông thường, bỏ ví game vẫn chạy được. Nhưng nếu bỏ ví, người chơi chỉ đang 'thuê' dữ liệu của máy chủ — khi máy chủ tắt, thú cưng biến mất.  
> Ví Web3 mang lại **Quyền sở hữu thực sự (True Ownership)**: Pet Passport là NFT ERC-721 trên Avalanche do người chơi toàn quyền nắm giữ vĩnh viễn, có thể bán lại P2P cho người khác trên chợ NFT, mang sang game khác trong metaverse, hoặc dùng để claim voucher thức ăn thú cưng từ nhà tài trợ mà không cần chia sẻ dữ liệu cá nhân."*

### ❓ Câu 2: *"Coin trong game có rút ra đổi lấy AVAX được không? Tiền đâu trả cho người chơi?"*
> **Trả lời:**  
> *"Dự án chúng em **nói KHÔNG với mô hình Ponzi Play-to-Earn lạm phát**. Coin trong game là tiền tệ khép kín off-chain để chơi game, hoàn toàn không được rút ra tiền mặt để triệt tiêu nạn bot cày tiền.  
> Thay vào đó, giá trị tài chính đến từ **thị trường thứ cấp P2P**: Ai dày công chăm sóc pet hiếm, ảnh AI điểm cao có thể mint Pet Passport và bán cho người chơi khác trên chợ NFT bằng AVAX. Người mua trả tiền cho người bán, ngân quỹ dự án hoàn toàn không bị ảnh hưởng."*

### ❓ Câu 3: *"Nhà tài trợ được lợi ích gì khi bỏ tiền vào dự án này?"*
> **Trả lời:**  
> *"Nhà tài trợ có 2 nhóm chính:  
> 1. **Các hãng thú cưng (Pet Brands):** Tiếp cận tệp người nuôi thú cưng thật đã được AI xác thực qua ảnh chụp, tài trợ voucher RWA để thu hút khách hàng mới ngoài đời thực.  
> 2. **Các quỹ bảo trợ động vật & CSR:** Minh bạch hóa hoạt động cứu trợ thú hoang trên blockchain. Mỗi NFT Passport cứu hộ được phát hành là một chứng chỉ nhận nuôi minh bạch, giúp nhà tài trợ giải ngân quỹ từ thiện đúng người đúng việc."*

---

*(Tài liệu được biên soạn phục vụ Hackathon UNIHACK 2026 — Đội ngũ Paws & Picket)*
