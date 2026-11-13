# 🎋 MĂNG NON (FOCUSGARDEN) — TỔNG QUAN TOÀN DIỆN HỆ THỐNG
> **Tài liệu thẩm định dành cho Ban giám khảo & Chuyên gia nhận xét**  
> *Phiên bản:* 2.0 (Đông Hồ Woodblock + Cuphead 2D + Die-cut Paper Sticker)  
> *Định vị:* Không gian tĩnh lặng đồng hành học tập & làm việc sâu (Anti-stress Deep Work Companion)

---

## 1. TRIẾT LÝ CỐT LÕI (CORE PHILOSOPHY & VALUE PROPOSITION)

Khác với các ứng dụng Pomodoro/Gamification truyền thống thường gây căng thẳng cho người dùng bằng cơ chế phạt nặng (chết cây khi rời app, đứt chuỗi streak, trừ điểm), **Măng Non** theo đuổi triết lý **"Anti-Stress & Zero-Penalty Sanctuary"**:
- **Không áp lực chuỗi ngày (No Streaks):** Bạn có thể vắng mặt nhiều ngày; khi trở lại, linh vật vẫn ân cần chào đón mà không trách móc.
- **Không màn hình thua cuộc (Zero Failure Screen):** Tạm dừng phiên tập trung được tính là *nghỉ ngơi hợp lý*, không phạt trừ tài nguyên.
- **Thoải mái tra cứu học liệu:** Cho phép người học chuyển ứng dụng đọc tài liệu/slide mà không bị coi là "vi phạm".
- **Gắn kết cảm xúc sâu sắc:** Người chơi tự tay vẽ hoặc chọn bạn đồng hành, gieo mầm vào đất, cùng bạn trải qua từng giờ học tập và chứng kiến bạn lớn lên.

---

## 2. HỆ THỐNG PHONG CÁCH NGHỆ THUẬT (ART STYLE & THEME)

Măng Non dung hợp hài hòa **3 ngôn ngữ thị giác kinh điển**:

```
 ┌───────────────────────────┐      ┌───────────────────────────┐
 │    TRANH KHẮC GỖ ĐÔNG HỒ   │      │    HOẠT HÌNH CUPHEAD 1930s│
 │  • Giấy Dó quét điệp óng  │      │  • Nét mực sần sùi rung   │
 │  • Tông màu tự nhiên ấm   │      │  • Mắt pie-cut biểu cảm   │
 └─────────────┬─────────────┘      └─────────────┬─────────────┘
               │                                  │
               └─────────────────┬────────────────┘
                                 ▼
                 ┌───────────────────────────────┐
                 │  DIE-CUT PAPER STICKER CUTOUT │
                 │  • Viền mực đen #2B2118 dày   │
                 │  • Đổ bóng cứng lệch góc      │
                 │  • Ôm khít alpha hình vẽ      │
                 └───────────────────────────────┘
```

### 2.1. Bảng Màu Dân Gian (Folk Palette Tokens)
| Mã Màu | Tên Gọi Đông Hồ | Ứng Dụng |
| :--- | :--- | :--- |
| `#F6EBD4` | **Trắng Điệp / Giấy Dó** | Nền thẻ bài, viền sticker, hộp thoại nhân vật |
| `#FFD166` | **Vàng Hoa Hòe** | Đốt nứa thần kỳ, đom đóm rừng đêm, ánh trăng |
| `#FFE599` | **Vàng Trăng Rằm** | Vầng trăng khuyết và vầng sáng mầm măng |
| `#E63946` / `#C8412F` | **Đỏ Son Dân Gian** | Quả lựu, đèn lồng đỏ Làng Phù Đổng, huy hiệu nổi bật |
| `#2B2118` | **Đen Mực Nho (Ink)** | Viền nét vẽ thủ công, đường cắt sticker, chữ viết |
| `#0E171A` / `#1B2A2F` | **Xanh Chàm Rừng Đêm** | Bầu trời đêm, bóng đổ phẳng (Zero Blur) |
| `#4F775A` / `#2D4736` | **Xanh Tán Đa Cổ Thụ** | Tán Cây Đa Phù Đổng và rừng tre phía xa |

### 2.2. Quy Tắc Tách Biệt Thị Giác Tuyệt Đối (Background vs. Interactive)
1. **Phần Nền & Cảnh Vật Môi Trường (Scenery - Không tranh chấp thị giác):** Rừng tre xa, đồi đất, tán cây đa, vầng trăng.
   - Các vật thể môi trường (Mặt trăng, Đèn lồng, Cây đa) kết hợp mảng màu phẳng Đông Hồ với hào quang ánh sáng dịu (**Soft Bioluminescent Glow**) để tạo chiều sâu không gian rừng đêm tĩnh mịch, hoàn toàn không có viền đen công nghiệp cứng nhắc.
2. **Nút Bấm UI & Thẻ Bài Tương Tác (Interactive Elements - Bấm được):**
   - Các nút bấm dùng viền khắc gỗ mực đen sắc nét (`2.5px solid #2B2118`), bo góc mềm mại (`rounded-2xl`) và bóng cứng lệch góc (`3px 4px 0 #2B2118`).
   - Tuyệt đối **không áp bộ lọc SVG làm biến dạng chữ**, đảm bảo độ rõ nét tuyệt đối cho Typography (Anti-aliasing & Eye Comfort).

---

## 3. BỘ KỸ THUẬT HIỆU ỨNG (SHADERS, SVG & ANIMATIONS)

1. **Kiểm Soát Bộ Lọc Khắc Gỗ SVG (`#woodblock-edge`):**
   - Chỉ áp dụng chọn lọc cho hình nền mỹ thuật tự nhiên; gỡ bỏ hoàn toàn khỏi các phần tử chứa chữ (Typography) để tránh răng cưa và nhòe chữ.
2. **Hoạt Ảnh Nhún Nhảy Cuphead (`@keyframes cupheadBounce`):**
   - Chuyển động nhún nghiêng `scale` và `rotate` theo nhịp giật 4–6 FPS (`steps(2, end)`), giữ nguyên độ sắc nét của viền và nội dung chữ khi hover.
3. **Kỹ Thuật Tạo Hào Quang Vật Thể Tương Tác Sân Khấu (`.interactive-cutout`):**
   - Gỡ bỏ hoàn toàn viền trắng kem thô dày bao quanh vật thể.
   - Chỉ giữ bóng tối mảnh phía dưới (`drop-shadow(0 2px 0 #0E171A)`) kết hợp vầng hào quang ấm tự nhiên (`drop-shadow(0 0 12px rgba(255, 209, 102, 0.55))`).
   - Riêng hình vẽ sinh linh người chơi tạo ra được bọc viền giấy Dó mỏng nhẹ tinh tế 1.5px (`.spirit-sticker`).
4. **Nhịp Thở Sinh Mệnh (`@keyframes breathe`):**
   - Linh vật trong ống nứa co giãn đàn hồi chậm rãi (`scale(1.04, 0.96)` qua 3.6s), tạo cảm giác sinh linh đang ngủ yên bình.
5. **Âm Thanh Bản Địa (Folk SoundEngine):**
   - Tiếng gõ ống nứa rỗng (*Bamboo Knock*), tiếng chuông khánh đồng thanh tịnh (*Blessing Chime*).

---

## 4. NỀN KINH TẾ SONG HÀNH (DUAL-CURRENCY TOKENOMICS)

Hệ thống thiết lập 2 dòng tiền tuần hoàn minh bạch:

```
  ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
  │      💧 GIỌT SƯƠNG (DEWDROPS)    │           │       🍃 MẦM LỰC (LEAVES)       │
  │ • Tặng 100 💧 ngay khi đăng nhập│           │ • Proof-of-Focus (Học tập sâu)  │
  │ • Năng lượng thức tỉnh mầm non  │           │ • Không thể nạp tiền mua        │
  │ • Phí gieo hạt: -20 💧 / mầm    │           │ • Dâng nuôi Cây Đa Phù Đổng     │
  └─────────────────────────────────┘           └─────────────────────────────────┘
```

- **Ví Avalanche Fuji Tích Hợp (Account Abstraction):**
  - Người dùng đăng nhập bằng Google hoặc Guest là có ngay địa chỉ ví Avalanche C-Chain (`0x7E34...`) tự sinh xác định mà không cần cài đặt MetaMask hay ghi nhớ Seed Phrase.

---

## 5. LUỒNG TRẢI NGHIỆM NGƯỜI DÙNG TOÀN DIỆN (FULL 5-STAGE GAME LOOP)

```mermaid
flowchart TD
    S1["1. Đăng Nhập & Chào Mừng<br/>(WelcomeLoginModal)"] -->|Tặng ngay 100 💧| S2["2. Màn Hình Rừng Tre (S06)<br/>Stage 1: Mầm Măng Say Ngủ"]
    S2 -->|Chạm thức tỉnh (-20 💧)<br/>Kích hoạt đồng hồ 2 phút ngay lập tức| S3["3. Studio Sáng Tạo (S03 - S05)<br/>Vẽ dáng ➔ Đặt tên ➔ Mục tiêu<br/>(Có Floating Badge đếm ngược song song)"]
    S3 -->|Hoàn tất thiết kế ➔ Kiểm tra thời gian thực| S4{"Thời gian vẽ & thiết kế?"}
    S4 -->|< 120 giây| S5["4. Stage 2: Tre Non Vươn Lớn<br/>Đếm ngược nốt số giây còn lại<br/>(Có nút 'xong ngay' để demo)"]
    S4 -->|>= 120 giây| S6["5. Stage 3: Cây Tre Trưởng Thành<br/>Đốt nứa phát sáng rực rỡ"]
    S5 -->|Hết giờ đếm ngược| S6
    S6 -->|Chạm mở đốt nứa vàng| S7["6. Stage 4: Ống Tre Hé Mở<br/>Nét vẽ đã Auto-Crop nằm ngủ trong ống<br/>Nút '✨ Đánh thức bước ra Rừng Tre!'"]
    S7 -->|Bấm nút Đánh Thức| S8["7. Stage 5: Đã Thức Tỉnh - Bước Ra Rừng Tre<br/>Ống tre ẩn đi ➔ Rối giấy 16 khớp chạy nhảy trên cỏ<br/>Tương tác chạm: nhảy múa, vẫy tay, đi bộ, chat"]
    S8 --> S9["8. Vòng Lặp Đồng Hành Thường Nhật<br/>• Tâm tình trò chuyện (S07) tăng Cấp nhận thức (growthLevel 1..4)<br/>• Tập trung Focus Sanctuary tích Mầm Lực (🍃)<br/>• Dâng lá nuôi Cây Đa Phù Đổng (S12) & Mint NFT Kỷ Niệm"]
```

### Chi Tiết Từng Giai Đoạn Trong Vòng Lặp:

1. **Bước 1 — Tân Thủ Nhập Môn:** Người dùng mở app ➔ Modal chào đón giới thiệu triết lý Măng Non, hướng dẫn 2 loại tiền tệ và **tặng ngay 100 Giọt Sương 💧** khi đăng nhập Google hoặc Khách.
2. **Stage 1 — Mầm Măng Say Ngủ (`S06`):** Tại Rừng Tre, mầm măng nhỏ đội nón lá đang say giấc với bảng thông báo nhấp nhô: `🎋 Mầm măng say ngủ • Chạm thức tỉnh (-20 💧)`.
3. **Kích Hoạt Đếm Ngược 2 Phút Ngay Khi Mở Khóa (`incubationStartedAt = Date.now()`):**
   - Khi người chơi xác nhận dùng 20 💧 (số dư còn 80 💧), hệ thống lập tức ghi nhận mốc thời gian thực và chuyển vào Studio sáng tạo (`S03` Tạo hình ➔ `S04` Đặt tên & Tính cách ➔ `S05` Mục tiêu).
   - **Floating Badge Đỉnh Màn Hình (Dynamic Island):** Trong suốt quá trình vẽ và đặt tên, một thanh trạng thái nổi co giãn hiển thị đếm ngược thời gian thực:
     - Nếu $< 120\text{s}$: `🎋 Mầm măng đang lớn ngoài rừng: [MM:SS]`.
     - Nếu $\ge 120\text{s}$: `✨ Cây tre đã lớn! Hoàn tất thiết kế để mở đốt nứa!`.
4. **Stage 2 — Tre Non Vươn Lớn (Returning to Forest):**
   - Nếu người chơi vẽ và thiết kế nhanh ($< 120\text{s}$), khi quay lại Rừng Tre sẽ thấy thân tre non đang tiếp tục vươn lớn, đếm ngược nốt số giây còn lại (`120 - elapsedSeconds`).
   - Có sẵn nút bấm `"xong ngay"` để tua nhanh thời gian khi Ban giám khảo thẩm định demo.
5. **Stage 3 — Cây Tre Trưởng Thành & Đốt Nứa Phát Sáng:**
   - Khi đủ $\ge 120\text{s}$ (hoặc khi đồng hồ đếm về `00:00`), cây tre chuyển sang dạng thân tre cao lớn, đốt nứa giữa toả hào quang vàng ấm kèm lời mời gọi `✨ Chạm mở đốt nứa`.
6. **Stage 4 — Ống Nứa Bổ Dọc Hé Mở (Auto-Crop Bounding Box):**
   - Khi chạm vào đốt nứa sáng, ống tre bổ dọc mở nắp sang bên phải, lộ ra thành thịt tre màu gỗ ấm (`#F4A259`) và lòng ống rỗng tỏa sáng (`#FFF3B0`).
   - **Thuật toán Auto-Crop thông minh:** Hàm `autoCropCharacterDataUrl` tự động quét alpha $> 25$ trên canvas vẽ $320\times 320$, cắt sạch khoảng trắng thừa và đệm mỏng $8\text{px}$, giúp nét vẽ của người chơi ôm khít vừa vặn lòng ống tre với nhịp thở `breathe` và chữ `zZ`.
   - **Nút cao trào cảm xúc:** Dưới chân ống tre xuất hiện nút bấm:
     > **`✨ Đánh thức [Tên Bé] bước ra Rừng Tre!`**
7. **Stage 5 — Đã Thức Tỉnh: Rối Giấy 16 Khớp Bước Ra Thảm Cỏ:**
   - Ống tre ẩn đi để nhường trọn vẹn sân khấu cho thảm cỏ Rừng Tre.
   - Nhân vật chính thức bước xuống đất và chuyển động trực tiếp trên Canvas Game Loop bằng bộ khung xương 16 khớp (`calculateRigPose` + `drawAnimatedFigure` / `drawPaperPuppet`).
   - **Tương tác đa điểm:**
     - Chạm vào nhân vật: Phát âm thanh khánh đồng `playBlessingChime()`, kích hoạt nhảy cẫng lên ăn mừng (`happy_jump`) hoặc vẫy tay chào (`wave`), hiển thị bóng thoại tâm tình.
     - Chạm vào thảm cỏ: Sinh linh tự động chuyển hướng và sải bước (`walk`) tiến tới vị trí chạm.
8. **Vòng Lặp Đồng Hành Thường Nhật:** Toàn bộ tính năng mở khóa: Chat tâm tình (`S07`), phiên tập trung Focus Sanctuary tích Mầm Lực 🍃 và tham gia Làng Phù Đổng dâng lá cứu cây đa làng (`S12`).

---

## 6. TÁCH BẠCH KIẾN TRÚC: `stage` (1..5) VS `growthLevel` (1..4)

Hệ thống phân định rạch ròi giữa **Vòng đời nở mầm** và **Cấp độ nhận thức tâm lý**:

| Khái Niệm | Giá Trị | Cơ Chế Tiến Hóa | Tác Động Giao Diện |
| :--- | :--- | :--- | :--- |
| **Hatching Stage (`stage`)** | `1 \| 2 \| 3 \| 4 \| 5` | Vòng đời ấp nở từ Mầm non ➔ Đang lớn (2p) ➔ Đốt sáng ➔ Mở ống ngủ ➔ **Bước ra Rừng Tre (Stage 5)**. | Thay đổi hình thái sân khấu Rừng Tre `S06` (SVG khoang tre ➔ Rối giấy 16 khớp trên Canvas). **Không bao giờ bị ghi đè khi chat!** |
| **Cognitive Level (`growthLevel`)** | `1 \| 2 \| 3 \| 4` | Mức độ thấu cảm theo số phiên học tập & tâm sự: **Level 1** (Mới nở), **Level 2** ($\ge 5$ phiên), **Level 3** ($\ge 15$ phiên), **Level 4** ($\ge 35$ phiên). | Thay đổi chiều sâu phản hồi của AI LLM (từ tò mò ngây thơ ➔ đúc kết liên tưởng ➔ có chính kiến riêng ➔ tri kỷ đồng hành). |
| **Tokenomics (`dewdrops`)** | `number` (Mặc định `100 💧`) | Quỹ Giọt Sương tân thủ, trừ `-20 💧` khi bấm mở khóa mầm măng ở Stage 1 để vào Studio. | Lưu bền vững trong `AppStateData.dewdrops` và đồng bộ ví Avalanche. |

---

## 7. RỄ TRE ĐAN LƯỚI — ON-CHAIN SKILL ROOT GRAPH (COMPOSABLE STAT SYNERGY)

Trong văn hóa Việt, cây tre đứng vững trước giông bão nhờ **bộ rễ chùm đan chặt vào nhau dưới lòng đất**. Măng Non biến triết lý này thành cơ chế **Composable Soulbound Token (SBT) Graph** trên Avalanche:

1. **AI Auto-Stat Allocation (Tự Động Setup 4 Chỉ Số Gốc):**
   - Khi hoàn tất `S05FirstMeeting`, hệ thống tự động phân tích từ khóa `goalTitle` + tính cách `personality` + thời hạn `plannedDays`:
     - 🧠 **Hiểu biết (`intelligence`):** Tăng mạnh với mục tiêu học thuật, thi cử, lập trình, ngoại ngữ.
     - 🔥 **Kiên trì (`perseverance`):** Tăng mạnh với mục tiêu dài ngày ($\ge 14$ ngày).
     - 🌱 **Sức sống (`fitness`):** Tăng mạnh với mục tiêu thể chất, giấc ngủ, thiền, sức khỏe.
     - 🎨 **Sáng tạo (`creativity`):** Tăng mạnh với mục tiêu vẽ, thiết kế, âm nhạc, nghệ thuật.
2. **Khế Ước Rễ Tre On-Chain (Cross-Stat Resonance):**
   - Tại Stage 5, người chơi có thể bấm **`"🔗 Map Rễ Tre On-chain"`** để nối linh vật với Đại Thụ Tri Thức hoặc bạn đồng hành tiền bối (`restingMangnons`).
   - Ghi nhận mã giao dịch `synergyTxHash` (`0xRoot...`) trên mạng Avalanche C-Chain.
   - **Cộng hưởng chỉ số:** Mỗi phiên Focus (`+5` điểm) hoặc Chat sâu (`+3` điểm):
     - Nhân vật nhận thêm **+25% điểm thưởng cộng hưởng** vào chỉ số yếu nhất (tự cân bằng phát triển toàn diện).
     - Tự động truyền **+20% điểm** sang bạn đồng hành được nối rễ.
   - **Hiệu ứng Thị Giác:** Sợi dây rễ phát sáng đom đóm (`drawEnergyVines`) chạy ngầm dưới thảm cỏ Canvas 2D.

---

## 8. KIẾN TRÚC KỸ THUẬT (SYSTEM ARCHITECTURE)

- **Frontend Core:** Next.js 14 (App Router), React 18, TypeScript strict mode.
- **Styling & Assets:** Tailwind CSS tùy biến triệt để bảng màu `dongho`, font chữ dân gian, bộ lọc sần SVG.
- **Graphics Engine:** HTML5 Canvas 2D Game Loop (vẽ hạt đom đóm tỉ lệ vàng, thân tre cong tự nhiên, khử hoàn toàn tải nặng GPU 3D).
- **Sound Engine:** Web Audio API tự tổng hợp sóng âm âm học tre nứa mộc bản, không phụ thuộc file MP3 nặng.
- **Lưu Trữ Dữ Liệu:** IndexedDB (cho ảnh vẽ phân giải cao) + LocalStorage (cho trạng thái nhân vật, ví Web3 và phiên tập trung).

---

> 💡 **Khuyến nghị cho phần Thuyết trình / Demo:**  
> 1. Mở đầu bằng thông điệp **"Anti-Stress & Tranh dân gian Việt Nam"** để tạo ấn tượng văn hóa độc bản.  
> 2. Thực hiện trọn vẹn luồng: **Nhận 100 💧** ➔ **Thức tỉnh mầm măng (-20 💧)** ➔ **Vẽ linh vật & Đặt tên (Đồng hồ đếm ngược chạy song song)** ➔ **Cây tre lớn (Stage 2/3)** ➔ **Ống nứa hé mở thấy nét vẽ đã Auto-Crop nằm ngủ (Stage 4)** ➔ **Bấm Đánh Thức bé bước ra Rừng Tre chạy nhảy trên thảm cỏ bằng khung xương 16 khớp (Stage 5)** để chứng minh tính hoàn thiện kỹ thuật và cảm xúc vượt trội của sản phẩm.  
> 3. Trình diễn thẻ **Rễ Tre Đan Lưới (Skill Root Graph)** ở Stage 5 và bấm **"🔗 Map Rễ Tre On-chain"** để hiển thị sợi dây năng lượng đom đóm `drawEnergyVines` uốn lượn dưới thảm cỏ cùng mã hash Avalanche Fuji, làm nổi bật cơ chế Composable Soulbound Token độc đáo trước Ban giám khảo.

