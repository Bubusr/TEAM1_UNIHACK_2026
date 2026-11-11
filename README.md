# 🎋 MĂNG NON · Independent Learning Companion & Community Energy on Avalanche

> **MĂNG NON** is a hand-drawn Vietnamese folk-art (Đông Hồ & Dó paper) companion powered by on-device Computer Vision auto-rigging. You bring real-world learning stories to nurture your companion through 4 stages of cognitive growth without any streak pressure, penalties, or guilt. When your journey is complete, your companion rests into a smooth pebble in the Stream of Memories, returning 100% of your committed capital from the Vault and minting a perpetual ERC-721 NFT on the **Avalanche Fuji C-Chain**.

Built for **Team1 Vietnam UniHack 2026** (30 Days to Build on Avalanche).  
Track: **Game on L1 / Social Finance / AI Agents** (aligned with Topic 10).

- `web/`: Next.js 14 web dApp (Canvas 2D continuous paper puppet engine, CV auto-rigging, IndexedDB, Web Audio).
- `contracts/`: 5 Smart Contracts (Solidity 0.8.20, Hardhat) deployed and verified on **Avalanche Fuji C-Chain**.
- `server/`: Python FastAPI microservice (Rembg AI & Meta Animated Drawings export).
- `scripts/`: Automated copy-lint test suite guaranteeing pressure-free UX copy.

Live dApp Local: `http://localhost:3000`  
Deployer Wallet: `0x2B237fF449D21ECd304407d98cAAA379290747D5`

---

## 1. Problem

1. **Streak Burnout & Retention Failure:** Modern habit and edtech apps (e.g., Duolingo, Habitica) rely on coercive gamification: threatening push notifications, streak loss, character health degradation, and social shame when life gets busy. This induces anxiety, causes burnout, and drives students away permanently.
2. **Speculative Web3 Gamification:** Move-to-earn or student GameFi apps frequently distribute volatile memecoins, fostering speculative short-term dumping rather than sustainable financial and learning habits.
3. **Disconnection from Real-World Effort:** Students study for hours in libraries and cafes, yet their real-world dedication remains disconnected from their digital identity and on-chain records.

---

## 2. Solution: Măng Non

MĂNG NON fundamentally redesigns the learning and habit companion:

- **Create Your Own Companion:** Draw your character on paper and take a photo, or draw directly on the digital canvas with 14 folk ink pigments. Our Computer Vision AI auto-rigs 16 anatomical joints (Meta Humanoid / Chibi / Quadruped), applies continuous paper cutout deformation, and adds a die-cut sticker outline (inspired by Teri from *The Amazing World of Gumball*).
- **Inverted Role — You Teach the AI:** You are not monitored, tested, or judged by AI. Instead, you share your daily learning reflections. Măng Non grows through 4 cognitive stages:
  1. *Stage 1 — Raw Curiosity:* Asks simple, naive questions.
  2. *Stage 2 — Association:* Connects things you told it days ago.
  3. *Stage 3 — Personal Perspective:* Expresses gentle preferences and aesthetic tastes.
  4. *Stage 4 — Deep Companionship:* Offers quiet emotional presence and comfort during tough days.
- **Pressure-Free Guarantee (Non-Violent UX):** Zero streaks, zero point deductions, zero guilt. If you are away for weeks, Măng Non simply rests asleep in the bamboo grove waiting for your return.
- **Mam Luc Commitment Vault & The Village Tree:** You lock an optional commitment deposit in AVAX. Upon completing your goal, you withdraw **100% of your principal**. A portion of generated mock-yield is channeled into the **Phù Đổng Village Tree** to trigger community blossom blessings.
- **Stream of Memories (ERC-721 NFT):** When a journey concludes, Măng Non performs a peaceful resting ritual, transforming into an immutable pebble NFT on Avalanche Fuji.
- **Bamboo Stations (Real-World Venues):** Privacy-preserving GPS check-in (Haversine formula ≤ 300m radius) at partner student study cafes and campus libraries in Ho Chi Minh City to unlock real-world study vouchers.

---

## 3. Three Mandatory Pitch Questions

### 1. Why on-chain?
- **Trustless Capital Preservation:** In traditional apps, deposited commitment funds are controlled by centralized servers. `MamLucVault.sol` guarantees 100% principal return upon goal completion by smart contract logic; no admin can seize user funds.
- **Permanent Emotional Identity:** A completed companion isn't a row in a private database that vanishes when a server shuts down. It becomes an **ERC-721 NFT** stored immutably on Avalanche.
- **Transparent Public Goods:** Community energy for the Village Tree accumulates openly on-chain, automatically triggering bloom events when the threshold is reached.

### 2. Why Avalanche?
- **Sub-Second Finality:** Avalanche C-Chain achieves transaction finality in ~1 second. Minting memory NFTs and claiming vouchers feels instantaneous, identical to Web2 mobile apps.
- **Extremely Low Gas Fees:** Transactions cost fractions of a cent (sub-gwei gas), removing financial barriers for students.
- **Clean Architectural Separation:** Interactive high-density game state (60 FPS canvas deformation, sound engine, AI dialogue) runs off-chain on-device at zero gas cost. Value settlement, vaults, and NFTs settle permanently on Avalanche Fuji C-Chain.

### 3. Where does the money or yield come from? & Legal Limits
- **100% Capital Safety:** User commitment deposits are held in `MamLucVault`. The principal is 100% redeemable upon goal completion.
- **Yield Mechanism:** Idle commitment funds earn staking/lending yield across Avalanche DeFi protocols. 30% of this accrued yield feeds the Village Tree reserve to sponsor study vouchers.
- **Vietnam Legal Compliance:** Tokens and NFTs within MĂNG NON are **strictly educational utility and identity assets**, NOT legal currency or cash substitutes. Partner perks at Bamboo Stations are legal commercial service discount vouchers with zero cash redemption.

---

## 4. Architecture

| Component | Location / Layer | Responsibility |
| :--- | :--- | :--- |
| **Canvas 2D Paper Puppet Engine** | Client (Browser) | 60 FPS continuous mesh deformation, squash & stretch, paper bend, 3D die-cut sticker border. |
| **CV Auto-Rigging Engine** | Client (Browser) | Canvas pixel matrix scanner, biological anatomical layering (Head, Eyes, Torso, Limbs) and 16-joint rigging. |
| **Dialogue & Persona Engine** | Client + API Route | 4 cognitive stages, memory extraction (≥6 words), emotional safety filter (§8.5), Gemini / Claude LLM integration with offline fallback. |
| **GoalRegistry.sol** | Avalanche Fuji C-Chain | Player state, goal tracking, companion personalities, and 20% stat resonance to linked goals. |
| **MamLucVault.sol** | Avalanche Fuji C-Chain | Commitment capital vault, 100% principal refund upon resting, yield contribution to the Village Tree. |
| **VillageTree.sol** | Avalanche Fuji C-Chain | Community energy pool for the Phù Đổng Tree, automated blossom blessing events. |
| **JourneyNFT.sol** | Avalanche Fuji C-Chain | ERC-721 token representing resting companion stones with on-chain metadata. |
| **TramTreCheckin.sol** | Avalanche Fuji C-Chain | Real-world GPS verification for partner study hubs, issuing anti-fraud voucher codes. |

---

## 5. Deployed Smart Contracts on Avalanche Fuji Testnet

All 5 contracts are compiled, tested with Hardhat (6/6 passing), and deployed live on **Avalanche Fuji C-Chain** (ChainID: `43113`):

| Contract | On-Chain Address (Avalanche Fuji) | Snowtrace Explorer |
| :--- | :--- | :--- |
| **VillageTree** | `0x372587d6BF5B3c3a2D267df6a22f87E3F9ebb0AA` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x372587d6BF5B3c3a2D267df6a22f87E3F9ebb0AA) |
| **GoalRegistry** | `0x814C3450FC4ddF562411a8C820710E0D100C3264` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x814C3450FC4ddF562411a8C820710E0D100C3264) |
| **MamLucVault** | `0x7e342d6b338ecb2D1F2ed609b4554b7b1A8cBdC0` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x7e342d6b338ecb2D1F2ed609b4554b7b1A8cBdC0) |
| **JourneyNFT** | `0x7Db4Be38e24A710476916B4e576BD12c2e603a4E` | [View on Snowtrace](https://testnet.snowtrace.io/address/0x7Db4Be38e24A710476916B4e576BD12c2e603a4E) |
| **TramTreCheckin** | `0xAe9E327A569146e2d59F2Fa4b4749f3060591Da1` | [View on Snowtrace](https://testnet.snowtrace.io/address/0xAe9E327A569146e2d59F2Fa4b4749f3060591Da1) |

Deployment artifact saved at `contracts/deployed-addresses.json` and consumed dynamically via `/api/deployed-addresses`.

---

## 6. Built In-House vs Outside Services

- **Built In-House (100%):**
  - Computer Vision Auto-Rigging algorithm analyzing canvas pixel arrays.
  - 2D Continuous Paper Puppet deformation physics (Teri Gumball style).
  - Dilation-based handcrafted Dó paper sticker border generator.
  - All 5 Avalanche Solidity Smart Contracts (`GoalRegistry`, `MamLucVault`, `VillageTree`, `JourneyNFT`, `TramTreCheckin`).
  - Web Audio API procedural sound engine (bamboo knocks, wind chimes, temple bells).
  - IndexedDB storage engine with Web Crypto SHA-256 caching.
  - Custom Vietnamese emotional safety copy-linter (`scripts/lint-copy.js`).
- **Outside Services:**
  - **Avalanche Fuji Testnet** (RPC: `https://api.avax-test.network/ext/bc/C/rpc`).
  - Google Gemini 1.5 Flash / Anthropic Claude 3.5 for cloud LLM mode (includes full offline persona simulation fallback).
  - Google Fonts (`Be Vietnam Pro` & `Mali`).

---

## 7. Quick Start & Local Development

### Prerequisites
- Node.js 18+ or 20+
- Modern browser with HTML5 Canvas & WebGL support (Chrome, Edge, Safari)

### 1. Install Dependencies
```bash
# Install web dependencies
npm --prefix web install

# Install contract dependencies
npm --prefix contracts install
```

### 2. Run Web dApp
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**. The interface renders an authentic 390×844 mobile frame with Ghibli forest atmosphere and Đông Hồ woodblock interactions.

### 3. Run Pressure-Free Copy-Linter
```bash
npm run lint:copy
```
*Output:* `✅ 100% COPY-LINT PASS! Không có từ gây áp lực nào.`

### 4. Run Smart Contract Tests
```bash
npm run test:contracts
```
*Output:* `6 passing` — Validates Goal creation, Vault deposit & 100% refund, Village Tree energy accumulation, JourneyNFT minting, and Bamboo Station check-ins.

---

## 8. Team & Submission Checklist

- [x] **Live dApp & Contracts:** Running on Avalanche Fuji Testnet.
- [x] **GitHub Repo:** Clean code, README with contract addresses, verified passing tests.
- [x] **Zero Mocks:** Real MetaMask/Core wallet integration, real GPS geolocation, real on-chain transactions.
- [x] **Anti-Pressure Experience:** Complete 13 mobile screen journey without coercive gamification.

Developed for **Team1 Vietnam UniHack 2026**. License: **MIT**.
