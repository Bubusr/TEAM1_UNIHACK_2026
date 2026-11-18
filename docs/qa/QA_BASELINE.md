# Paws & Picket: Pre-Deployment QA Baseline & Environment Audit

**Document Version:** 1.0.0  
**Audit Mode:** READ-ONLY / AUDIT-ONLY (No code, config, or contract modifications)  
**Execution Timestamp:** 2026-11-18T13:26:00+07:00  
**Target Release:** Avalanche Fuji Testnet (Chain ID 43113)  
**Workspace:** `/Users/apple/HACKATHON`

---

## 1. Executive Summary & Audit Scope

This baseline document establishes the authoritative operational, environmental, and test state of the **Paws & Picket** codebase prior to smart contract deployment and public staging release. 

All verifications were executed under strict **Audit-Only Constraints**:
- **Source Code (`server.ts`, `src/`):** UNMODIFIED.
- **Smart Contracts (`contracts/`):** UNMODIFIED.
- **Environment Configuration (`.env`):** UNMODIFIED.
- **Database Schemas:** UNMODIFIED.
- **UI / Frontend Components:** UNMODIFIED.

Testing methodologies categorize results into four distinct operational tiers:
1. **Real Service:** Executed against live network, Google Cloud Firestore, and external Avalanche Fuji RPC endpoints.
2. **Mock:** Simulated payloads verifying internal business logic and fallback handlers.
3. **Local:** Pure deterministic math, cryptographic signing, and hash verification routines.
4. **Blocked:** Executions halted safely due to unprovisioned external API keys or un-deployed on-chain contracts.

---

## 2. Environment & Infrastructure Inventory

### 2.1 Runtime & Dependencies
- **Node.js Environment:** v22.14.0 (macOS Darwin 25.1.0 arm64)
- **TypeScript Runtime:** `tsx` v4.21.0
- **Frontend Framework:** React 19.0.1 + Vite 8.3.0 + Tailwind CSS 4.3.3 + Motion 12.23.24
- **Backend Framework:** Express 4.21.2 + zod 3.25.76 + ethers 6.17.0
- **Smart Contract Toolkit:** Hardhat 3.22.0 + OpenZeppelin Contracts 5.6.1 + solc 0.8.38
- **AI Engine:** `@google/genai` v3.3.0 (Gemini 2.5 Flash / Pro)

### 2.2 Active Database Source of Truth
The codebase supports dual-persistence architecture:
- **Cloud Firestore (Active Source of Truth):**
  - **Firebase Project ID:** `paws-local`
  - **Authentication Mode:** Google Cloud Application Default Credentials (ADC) / Firestore SDK.
  - **Status:** **ONLINE & ACTIVE**. All read, write, and transaction tests currently persist to Cloud Firestore collection `users/{uid}`.
- **PostgreSQL / Docker (Inactive / Fallback):**
  - **Status:** **OFFLINE**. Docker engine is stopped, `DATABASE_URL` is commented out in `.env`.
  - **Behavior:** Backend automatically detects database driver availability and cleanly falls back to Cloud Firestore without runtime crash.

### 2.3 Web3 & Blockchain Configuration
- **Network:** Avalanche Fuji Testnet (C-Chain)
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc` (Verified reachable, responds with Chain ID `43113` / `0xa869`).
- **Deployer / Signer Address:** `0x2B237fF449D21ECd304407d98cAAA379290747D5`
- **Deployer Balance:** `0.00999999928936384 AVAX` (Sufficient for EIP-712 signing, marginal for contract deployment).
- **Contract Address (`PET_PASSPORT_CONTRACT_ADDRESS`):** **EMPTY / UNCONFIGURED**.
  - Contract bytecode probe confirms `PawsAndPicketPassport.sol` has **not** been deployed to Fuji yet.

### 2.4 External AI Configuration
- **Gemini API (`GEMINI_API_KEY`):** **EMPTY / UNCONFIGURED**.
  - Live AI judging via `POST /api/judge` fails closed safely with `HTTP 503 Service Unavailable: GEMINI_API_KEY is not configured in Settings > Secrets`.

---

## 3. API Endpoint Inventory (18 Endpoints)

The Express application ([server.ts](file:///Users/apple/HACKATHON/server.ts)) exposes 18 specialized endpoints divided into 5 operational domains:

| # | HTTP Method | Route Path | Auth Requirement | Rate Limit | Purpose |
|---|---|---|---|---|---|
| 1 | `GET` | `/api/web3/status` | Public | None | Inspect Fuji RPC, contract address, and signer readiness |
| 2 | `GET` | `/api/metadata/:petUid` | Public | None | ERC-721 tokenURI dynamic JSON metadata generator |
| 3 | `GET` | `/api/pets/:petUid/portrait` | Public | None | SVG on-chain/dynamic portrait generator |
| 4 | `GET` | `/api/pets/:petUid/mint-eligibility` | Public | None | Evaluates score $\ge 80$, Bond XP $\ge 100$, unminted status |
| 5 | `POST` | `/api/judge` | Public | 12 req/min (`judgeLimiter`) | Multimodal photo analysis via Gemini with local fallback |
| 6 | `POST` | `/api/guest/session` | Public | 60 req/min (`actionLimiter`) | HMAC-SHA256 guest token generator |
| 7 | `GET` | `/api/keeper/state` | `requireGameActor` | None | Full sanctuary, inventory, farm, and pet state loader |
| 8 | `POST` | `/api/keeper/merge-guest` | `requireAuth` | 60 req/min | Merges guest progress into Google-authenticated keeper |
| 9 | `POST` | `/api/keeper/add-to-garden` | `requireGameActor` | 60 req/min | Adds newly discovered pet from AI judge to user sanctuary |
| 10 | `POST` | `/api/keeper/care` | `requireGameActor` | 60 req/min | Server-authoritative care (pet, feed, play) & XP award |
| 11 | `POST` | `/api/keeper/quest/claim` | `requireGameActor` | 60 req/min | Server-verified First Bond Quest reward claim (one-time) |
| 12 | `POST` | `/api/keeper/action` | `requireGameActor` | 60 req/min | Farm harvesting, planting, shop buy, orchard, stray rescue |
| 13 | `POST` | `/api/wallet/nonce` | `requireAuth` | 60 req/min | Issues cryptographic nonce for EIP-191 wallet linking |
| 14 | `POST` | `/api/wallet/verify` | `requireAuth` | 60 req/min | Verifies signature & binds wallet address to user |
| 15 | `DELETE`| `/api/wallet` | `requireAuth` | 60 req/min | Unlinks wallet from user account |
| 16 | `POST` | `/api/web3/mint-claim` | `requireAuth` | 60 req/min | Issues signed EIP-712 Typed Data voucher for Fuji mint |
| 17 | `POST` | `/api/web3/confirm-mint` | `requireAuth` | 60 req/min | Verifies on-chain tx receipt & updates pet to `minted` |
| 18 | `POST` | `/api/web3/reconcile/:petUid`| `requireAuth` | 60 req/min | Scans blockchain logs to resolve desynced mint status |

---

## 4. Test Suite Baseline & Verifications

Prior to running the comprehensive QA matrix, baseline automated test suites were verified:

1. **Backend Integration Suite (`test/server.test.ts`):**
   - Command: `npx tsx --test test/server.test.ts`
   - Result: **20 / 20 PASS** (0 failures).
   - Covers: Guest auth, judge fallback, garden admission, care progression, idempotency, quest claims, and metadata generation.
2. **Web3 Client Suite (`test/walletClient.test.ts`):**
   - Command: `npx tsx test/walletClient.test.ts`
   - Result: **7 / 7 PASS** (0 failures).
   - Covers: Chain ID checks, EIP-712 typed signature packing, and transaction decoding.
3. **Smart Contract Unit Suite (`test/PawsAndPicketPassport.test.ts`):**
   - Command: `npx tsx --test test/PawsAndPicketPassport.test.ts`
   - Result: **4 / 4 PASS** (0 failures).
   - Covers: Signature verification, double-mint prevention, expired voucher rejection, and pause controls.
4. **Static Typecheck & Lint (`npm run lint`):**
   - Command: `tsc --noEmit`
   - Result: **0 errors**.
5. **Production Build (`npm run build`):**
   - Command: `vite build`
   - Result: **Clean build** completed in 855ms (`dist/index.html`, `dist/assets/*`).

---

## 5. Known Operational Limitations & Boundaries

1. **Live Gemini Image Analysis:** Requires `GEMINI_API_KEY` in `.env`. Without it, real photo analysis returns HTTP 503. Mock tests confirm algorithmic evaluation works when Gemini payloads are supplied.
2. **On-Chain Testnet Minting:** Blocked until `PawsAndPicketPassport.sol` is deployed to Fuji and `PET_PASSPORT_CONTRACT_ADDRESS` is populated in `.env`.
3. **Deployer Gas Reserves:** Deployer wallet `0x2B237fF449D21ECd304407d98cAAA379290747D5` has ~0.01 AVAX. While adequate for unit test signing, deploying the full contract bytecode to Fuji will require ~0.05 - 0.1 AVAX.
