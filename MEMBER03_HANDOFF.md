# 🐾 Member 03 — Blockchain Handoff Document
> **Project:** Paws & Picket — UNIHACK 2026  
> **Role:** Member 03 — Blockchain Integration  
> **Date:** 2026-11-19

---

## 📋 Tổng quan

Member 03 đảm nhiệm toàn bộ hệ thống blockchain cho Paws & Picket, bao gồm:
- Smart contract ERC-721 NFT với EIP-712 signed minting
- Deploy lên Avalanche Fuji Testnet
- Backend API ký và verify NFT
- Frontend tích hợp Core Wallet (EIP-1193)

---

## 🔗 Contract On-chain

| Thông tin | Giá trị |
|-----------|---------|
| **Contract Address** | `0x1a5913d8a00247ccad7bb0ed879b3be43ca112b0` |
| **Network** | Avalanche Fuji Testnet (Chain ID: 43113) |
| **Snowtrace Explorer** | https://testnet.snowtrace.io/address/0x1a5913d8a00247ccad7bb0ed879b3be43ca112b0 |
| **Verified Source Code** | https://testnet.snowtrace.io/address/0x1a5913d8a00247ccad7bb0ed879b3be43ca112b0#code |
| **Deploy Tx Hash** | `0xd76c0bf245c702d4f8f835e6ebc61ec6fb577911a47948cc98e762faa07b8e9b` |
| **Block Number** | `61313149` |
| **Compiler** | Solidity `0.8.38`, EVM `cancun`, Optimizer 200 runs |
| **Deployer Address** | `0xd7fA1F935eaE310a80A5C5E8F45CE92cEBd54537` |
| **Backend Signer Address** | `0x2e3B039d3CB12e49475C08cB97041DFD1C88372f` |

> **NFT đã mint:** Token #1 — Buttercup (Dog, Score 92)  
> Mint Tx: `0xd0c2aba7d9060721d313152aa7cf9db675fca0207dc632926dadb7f1acd45fc9`

---

## 🏗️ Kiến trúc hệ thống

```
User Browser (Core Wallet)
        │  EIP-1193 (window.ethereum)
        ▼
  Frontend (React/Vite)
  src/lib/wallet.ts          ← Wallet connect, chain switch, mint flow
  src/components/WalletButton.tsx
  src/components/JudgeCardScreen.tsx  ← "Mint Passport" button
        │  POST /api/blockchain/claim-passport
        ▼
  Backend Express Server
  src/server/blockchainService.ts    ← EIP-712 signing (backend signer key)
  src/server/server.ts               ← API endpoints
        │  EIP-712 signed claim
        ▼
  Smart Contract (Avalanche Fuji)
  contracts/src/PawsAndPicketPassport.sol
  → Verify signature → Mint ERC-721 NFT
```

---

## 📁 Cấu trúc file quan trọng

```
contracts/
├── src/
│   └── PawsAndPicketPassport.sol       # Smart contract chính
├── PawsAndPicketPassport_Flat.sol      # Flattened (dùng để verify Snowtrace)
├── artifacts_hh/                       # Hardhat artifacts (sau khi compile)
└── cache_hh/

src/
├── contracts/
│   ├── PawsAndPicketPassport.json      # ABI + Bytecode (dùng để deploy)
│   ├── PawsAndPicketPassportABI.ts     # TypeScript ABI
│   ├── deployment.json                 # Thông tin deployment
│   └── config.ts                      # BLOCKCHAIN_CONFIG export
├── lib/
│   └── wallet.ts                       # Core Wallet integration
├── components/
│   └── WalletButton.tsx                # Wallet connect button
└── server/
    └── blockchainService.ts            # Backend blockchain service

scripts/
├── compile.ts                          # Compile contract → JSON artifact
├── deploy-fuji.ts                      # Deploy lên Avalanche Fuji
├── test-contract.ts                    # Unit tests smart contract (19 tests)
└── test-backend-api.ts                 # Integration tests backend API
```

---

## ⚙️ Environment Variables

Thêm vào file `.env` (không commit lên git):

```env
# Blockchain keys (testnet only — không dùng cho mainnet)
DEPLOYER_PRIVATE_KEY="0x860602cbf9d9eef078b930f568d1d0e328e47286ccd55df5de846151e491a8e3"
BACKEND_SIGNER_PRIVATE_KEY="0xca4f416b7565422e5396791990ae0e7f2cfbe795b44ffff5e5d57a1d34b4741f"

# Contract address
PAWS_PASSPORT_CONTRACT_ADDRESS="0x1a5913d8a00247ccad7bb0ed879b3be43ca112b0"
VITE_PAWS_PASSPORT_CONTRACT_ADDRESS="0x1a5913d8a00247ccad7bb0ed879b3be43ca112b0"
```

> ⚠️ **QUAN TRỌNG:** Các key trên là testnet keys do project tự generate, chỉ chứa AVAX testnet (không có giá trị). Không dùng cho mainnet.

---

## 🚀 Hướng dẫn chạy

### 1. Cài dependencies
```bash
npm install
```

### 2. Chạy ứng dụng (dev server)
```bash
npm run dev
# → http://localhost:3000
```

### 3. Compile smart contract
```bash
npm run compile:contracts
# → Tạo src/contracts/PawsAndPicketPassport.json
```

### 4. Chạy tests

**Unit test smart contract (19 tests):**
```bash
npm run test:contracts
```

**Integration test backend API:**
```bash
npm run test:backend-api
```
> Cần dev server đang chạy (`npm run dev`) trước khi chạy backend test.

### 5. Redeploy contract (nếu cần)
```bash
npm run deploy:fuji
# → Deploy contract mới lên Avalanche Fuji
# → Tự động cập nhật .env, deployment.json, config.ts
```

---

## 🔌 API Endpoints

Server chạy tại `http://localhost:3000`

### `GET /api/blockchain/status`
Kiểm tra kết nối Fuji và trạng thái contract.

```json
{
  "connected": true,
  "chainId": 43113,
  "contractAddress": "0x1a5913...",
  "totalMinted": 1
}
```

### `POST /api/blockchain/claim-passport`
Backend ký EIP-712 claim để user mint NFT.

**Request:**
```json
{
  "recipient": "0xUserWalletAddress",
  "petId": "pet-uuid-123",
  "petName": "Buttercup",
  "species": "Dog",
  "score": 92,
  "tokenURI": "https://..."
}
```

**Response:**
```json
{
  "claim": { "recipient": "...", "petId": "...", ... },
  "signature": "0xabc123..."
}
```

### `POST /api/blockchain/verify-mint`
Verify transaction đã thành công trên chain.

**Request:**
```json
{ "txHash": "0xd0c2aba7..." }
```

**Response:**
```json
{
  "verified": true,
  "tokenId": 1,
  "petName": "Buttercup",
  "owner": "0xd7fA..."
}
```

---

## 🎮 Luồng Mint NFT (Demo)

1. **Mở app** → `http://localhost:3000`
2. **Kết nối wallet** → Click nút **"Connect Wallet"** (góc phải màn hình AI Judge)
   - Chọn Core Wallet hoặc OKX Wallet
   - App tự động switch sang Avalanche Fuji (Chain ID: 43113)
3. **Chơi game** → Nhận điểm từ AI Judge
4. **Mint Passport** → Click **"Mint Passport"** trên card pet
   - Backend tạo EIP-712 signature
   - Wallet popup yêu cầu ký giao dịch
   - NFT được mint on-chain
5. **Xem kết quả** → Popup hiện Token ID, Tx Hash, link Snowtrace

---

## 📜 Smart Contract — Tính năng bảo mật

| Feature | Mô tả |
|---------|-------|
| **EIP-712** | Typed structured data signing — chống replay attack |
| **Nonce tracking** | `usedNonces[nonce] = true` — mỗi nonce chỉ dùng 1 lần |
| **Deadline** | Signature hết hạn sau 1 giờ |
| **Pet uniqueness** | `petMinted[petId]` — mỗi pet chỉ mint 1 NFT |
| **Recipient check** | `msg.sender == claim.recipient` — chỉ chủ nhân mới mint được |
| **Trusted signer** | Backend signer key verify — chống giả mạo request |

---

## 🐛 Known Issues / Limitations

1. **OKX Wallet compatibility:** App hỗ trợ cả OKX và Core Wallet. Nếu dùng OKX, cần nhập private key của deployer vào OKX.

2. **Partial verification:** Contract verify trên Snowtrace là "Partial Match" (dùng flattened single-file thay vì Standard JSON Input multi-file). Lý do: Hardhat v3 flatten output lẫn stdout log, khiến metadata hash khác với lúc deploy. Source code vẫn hoàn toàn readable và có thể đối chiếu. Để exact match cần Snowtrace API key + `hardhat verify etherscan`.

3. **TokenURI:** Hiện tại tokenURI là placeholder string. Production cần IPFS hoặc metadata server.

4. **Single pet per wallet:** Contract cho phép mint nhiều pets với các `petId` khác nhau, nhưng mỗi `petId` chỉ mint được 1 lần.

5. **Testnet only:** Toàn bộ hệ thống chạy trên Avalanche Fuji Testnet. AVAX testnet không có giá trị thực.

---

## 🔧 Hardhat Config

File: `hardhat.config.js`

```javascript
solidity: {
  version: "0.8.38",      // Phải match với npm solc version
  settings: {
    evmVersion: "cancun", // Bắt buộc — OpenZeppelin v5 dùng mcopy opcode
    optimizer: { enabled: true, runs: 200 }
  }
}
```

> ⚠️ **QUAN TRỌNG:** `evmVersion: "cancun"` là bắt buộc. Nếu thiếu, compile sẽ lỗi `mcopy not found`.

---

## 📊 Test Results

```
Smart Contract Tests (npm run test:contracts):
  ✅ Deployment & initialization (3 tests)
  ✅ EIP-712 signature validation (4 tests)  
  ✅ Successful minting (3 tests)
  ✅ Security — replay attack prevention (3 tests)
  ✅ Security — deadline enforcement (2 tests)
  ✅ Security — pet uniqueness (2 tests)
  ✅ View functions (2 tests)
  TOTAL: 19/19 PASS

Backend API Tests (npm run test:backend-api):
  ✅ GET /api/blockchain/status
  ✅ POST /api/blockchain/claim-passport
  ✅ POST /api/blockchain/verify-mint
  TOTAL: ALL PASS
```

---

## 📦 npm Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy dev server (port 3000) |
| `npm run build` | Build production |
| `npm run compile:contracts` | Compile Solidity → JSON artifact |
| `npm run test:contracts` | Chạy 19 unit tests smart contract |
| `npm run test:backend-api` | Chạy integration tests API |
| `npm run deploy:fuji` | Deploy contract mới lên Fuji |

---

*Handoff document by Member 03 — UNIHACK 2026*
