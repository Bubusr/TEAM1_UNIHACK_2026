# Paws & Picket — Backend Architecture & API Audit
**Document:** `BACKEND_AUDIT.md`  
**Author:** Member 02 (Backend Core, Game Logic & Database)  
**Reference:** [Guide_mem2.md](file:///Users/apple/HACKATHON/Guide_mem2.md)  
**Version:** 1.0.0 · Phase 1 Implementation Baseline  
**Status:** COMPLETE AUDIT & ROADMAP

---

## 1. Executive Summary

As defined in `Guide_mem2.md`, Member 02 owns the backend vertical slice:
$$\text{AI Judge} \longrightarrow \text{Pet Creation} \longrightarrow \text{Care Actions} \longrightarrow \text{Bond XP} \longrightarrow \text{First Bond Quest} \longrightarrow \text{Mint Eligibility}$$

Per team agreements:
- **Member 01 (Frontend / UI):** Owns UI screens, views, layout, styling, and client-side presentation. Member 02 does **not** alter UI or frontend styling.
- **Member 03 (Web3 & Contracts):** Owns Solidity smart contracts (`PawsAndPicketPassport.sol`), EIP-712 typed claim signing, and on-chain verification. Member 02 provides trusted server-authoritative eligibility decisions.
- **Member 02 (Backend Core):** Owns `server.ts`, `gameActions.ts`, `aiJudge.ts`, `rewards.ts`, database rules, persistence (PostgreSQL / Cloud Firestore), and anti-abuse safeguards.

---

## 2. Express Endpoints Inventory & Status

| Endpoint | Method | Auth Level | Source File | Status | Frontend Consumer (`src/lib/api.ts`) |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `/api/guest/session` | `POST` | None (CSRF-checked) | `server.ts` | **Active** ✅ | `initGuestSession()` |
| `/api/keeper/state` | `GET` | Actor (`Guest` or `Firebase`) | `server.ts`, `src/db/users.ts` | **Active** ✅ | `fetchKeeperState()` |
| `/api/judge` | `POST` | Actor (`Guest` or `Firebase`) | `src/server/aiJudge.ts`, `src/server/gameActions.ts` | **Active** ✅ | `apiJudgePhoto()` |
| `/api/keeper/add-to-garden` | `POST` | Actor (`Guest` or `Firebase`) | `src/server/gameActions.ts` | **Active** ✅ | `apiAddToGarden()` |
| `/api/keeper/care` | `POST` | Actor (`Guest` or `Firebase`) | `src/server/gameActions.ts` | **Active** ✅ | `apiCarePet()` |
| `/api/keeper/quest/claim` | `POST` | Actor (`Guest` or `Firebase`) | `src/server/gameActions.ts` | **Active** ✅ | `apiClaimFirstBondQuest()` |
| `/api/keeper/action` | `POST` | Actor (`Guest` or `Firebase`) | `src/server/gameActions.ts` | **Active** ✅ | `apiGameAction()` |
| `/api/keeper/merge-guest` | `POST` | Firebase Auth Required | `src/server/gameActions.ts` | **Active** ✅ | `apiMergeGuestIntoKeeper()` |
| `/api/wallet/nonce` | `POST` | Firebase Auth Required | `src/server/walletAuth.ts` | **Active** ✅ | `apiRequestWalletNonce()` |
| `/api/wallet/verify` | `POST` | Firebase Auth Required | `src/server/walletAuth.ts` | **Active** ✅ | `apiVerifyWalletSignature()` |
| `/api/wallet` | `DELETE` | Firebase Auth Required | `src/server/walletAuth.ts` | **Active** ✅ | `apiUnlinkWallet()` |
| `/api/web3/status` | `GET` | Public / None | `src/server/web3Service.ts` | **Active** ✅ | `fetchWeb3Status()` |
| `/api/web3/mint-claim` | `POST` | Firebase Auth Required | `src/server/web3Service.ts` | **Active** ✅ | `apiRequestMintClaim()` |
| `/api/web3/confirm-mint` | `POST` | Firebase Auth Required | `src/server/web3Service.ts` | **Active** ✅ | `apiConfirmMint()` |
| `/api/web3/reconcile/:petUid` | `POST` | Firebase Auth Required | `src/server/web3Service.ts` | **Active** ✅ | `apiReconcilePet()` |
| `/api/metadata/:petUid` | `GET` | Public / None | `src/server/web3Service.ts` | **Active** ✅ | ERC-721 Token URI |
| `/api/pets/:petUid/portrait` | `GET` | Public / None | `server.ts` | **Active** ✅ | Pet image display |
| `/api/pets/:petUid/mint-eligibility` | `GET` | Public / Actor | `server.ts` | **Active** ✅ | Member 03 contract pipeline |
| `/api/adoptions/offer` | `POST` | Auth | `server.ts` | **501 Deferred** ⏸️ | Phase 2 P2P Adoptions |
| `/api/adoptions/accept` | `POST` | Auth | `server.ts` | **501 Deferred** ⏸️ | Phase 2 P2P Adoptions |
| `/api/adoptions/cancel` | `POST` | Auth | `server.ts` | **501 Deferred** ⏸️ | Phase 2 P2P Adoptions |

---

## 3. Detailed Audit by Domain

### 3.1 Authentication & Identity (`guestSession.ts`, `auth.ts`, `users.ts`)
* **Mechanism:**
  * **Guest Keepers:** Cryptographic HMAC-SHA256 session token (`paws_guest` cookie or `X-Guest-Token` header) with 30-day TTL.
  * **Registered Keepers:** Firebase Authentication Bearer ID tokens (Google Sign-In).
  * **Actor Middleware (`requireGameActor`):** Transparently permits either a verified Firebase token or verified Guest session token.
  * **Merge Endpoint (`/api/keeper/merge-guest`):** Migrates guest pets, inventory surpluses, and quest progress atomically into the registered Keeper account without duplicating initial starter coins or baseline items.
* **Findings:**
  - Secure CSRF protection checks `Origin`, `Referer`, and `Sec-Fetch-Site`.
  - Rate limiting is active on guest creation (30 req / 15 min).

### 3.2 AI Photo Discovery & Validation (`aiJudge.ts`, `rewards.ts`, `gameActions.ts`)
* **Mechanism:**
  1. **Strict Magic Byte Validation (`detectMagicMime`):** Validates buffer bytes for JPEG (`0xFF 0xD8 0xFF`), PNG (`0x89 0x50 0x4E 0x47`), or WEBP (`RIFF...WEBP`). Rejects spoofed MIME headers and payloads $> 8$ MB.
  2. **SHA-256 Duplicate Check:** Compares image SHA-256 against user's prior `photoSubmissions`. Rejects identical photos with HTTP 409.
  3. **Gemini Structured Evaluation:** Evaluates `isAnimal`, `confidence` (0-100), `sharp`, `light`, `themeScore`, `themeMatch`, `species`, `pose`, `petName`.
  4. **Score & Tier Calculation (`calculateJudgeOutcome`):**
     $$\text{OverallScore} = \text{round}(0.35 \times \text{sharp} + 0.30 \times \text{light} + 0.35 \times \text{themeScore})$$
     - $\text{Score} \ge 80$: Unlocks pet discovery (`80+ Tier`), +150 coins, +50 EXP.
     - $60 \le \text{Score} < 80$: Renews fence (+24h), +75 coins, +25 EXP.
     - $\text{Score} < 60$ or `!isAnimal`: Rejects creation, 0 coins, 0 EXP.
* **Findings:**
  - Gemini visual output cannot be spoofed by the client. Client-sent scores are ignored.
  - Discovery must be approved by the backend before calling `/api/keeper/add-to-garden`.

### 3.3 Pet Lifecycle & Sanctuary Management
* **State Machine:**
  $$\text{DISCOVERED} \longrightarrow \text{ANALYZED} \longrightarrow \text{APPROVED} \longrightarrow \text{IN\_SANCTUARY} \longrightarrow \text{CARE\_IN\_PROGRESS} \longrightarrow \text{MINT\_ELIGIBLE} \longrightarrow \text{MINTED}$$
* **Implementation:**
  - `addSubmissionToSanctuary` assigns an immutable `petUid`, sets initial Bond XP = 15, care count = 0, records the discovery memory, and links the discoverer.
  - Initial starter pets (`Mochi`, `Sunny`, `Pip`) are seeded with distinct personalities, coordinates, and initial Bond XP.

### 3.4 Care Progression & Bond XP (`gameActions.ts`, `firestoreStorage.ts`)
* **Mechanism:**
  - **Petting (`pet`):** +15 Bond XP, +15 Coins (up to daily cap 10), +6 EXP.
  - **Feeding (`feed`):** +25 Bond XP, consumes 1 food item from inventory, +25 Coins (up to daily cap 6), +12 EXP. Rejects if food inventory $\le 0$.
  - **Playing (`play`):** +20 Bond XP, requires owning the toy (`ownedToys`), +20 Coins (up to daily cap 5), +8 EXP.
* **Anti-Abuse Safeguards:**
  - Client cannot send arbitrary XP or Coin values.
  - Atomic transaction with `idempotencyKey` prevents double-reward farming.
  - Daily limit counters (`petCoinsUsed`, `feedCoinsUsed`, `playCoinsUsed`) track caps per UTC day.

### 3.5 First Bond Quest System
* **Requirements:**
  1. `questPetDone === true` (Pet action completed on this pet)
  2. `questFeedDone === true` (Feed action completed on this pet)
  3. `questPlayDone === true` (Play action completed on this pet)
  4. $\text{Bond XP} \ge 100$ on this exact pet
* **Claim Reward:**
  - +250 Coins, +60 EXP.
  - Strictly one claim per account (`firstBondQuestClaimedAt`). Attempting a second claim returns HTTP 409.

### 3.6 Web3 Mint Eligibility Interface
* **Current Status:** **Active & Verified ✅**
  - Dedicated endpoint `GET /api/pets/:petUid/mint-eligibility` implemented in `server.ts` and verified in `test/server.test.ts`.
  - Response contract strictly complies with Guide_mem2 Section 7:
    ```json
    {
      "eligible": boolean,
      "petId": string,
      "reasons": string[],
      "requirements": {
        "validDiscovery": boolean,
        "confidencePassed": boolean,
        "imageScorePassed": boolean,
        "duplicateCheckPassed": boolean,
        "inSanctuary": boolean,
        "bondLevelPassed": boolean,
        "firstBondQuestCompleted": boolean,
        "careEventsVerified": boolean,
        "notMinted": boolean
      }
    }
    ```
  - Evaluated requirements:
    - $\text{Discovery Score} \ge 80$
    - $\text{Bond XP} \ge 100$
    - First Bond Quest completed (`questPetDone && questFeedDone && questPlayDone`)
    - $\text{Care Events} \ge 3$
    - $\text{Mint Status} \ne \text{'minted'}$
  - Returned as part of `getFullKeeperState` in `pets[].eligibility`, as well as via `GET /api/pets/:petUid/mint-eligibility`.
  - Claim issuance in `/api/web3/mint-claim` enforces these rules before Member 03's signer issues an EIP-712 signature.

---

## 4. Priority Roadmap for Member 02

### [P0.1] API Audit Documentation ✅
- Complete mapping of all 18 endpoints, contracts, and security boundaries documented in `BACKEND_AUDIT.md`.

### [P0.2] AI Judge Hardening ✅
- Gemini visual prompt enforces structured JSON evaluation with strict magic byte MIME verification, duplicate image SHA-256 rejection, and honest 503 fallback when `GEMINI_API_KEY` is unprovisioned.

### [P0.3] Standalone Mint Eligibility Endpoint ✅
- Implemented and verified `GET /api/pets/:petUid/mint-eligibility` returning the exact requirement matrix for Member 03's contract pipeline.

### [P0.4] Data Storage Fast-Path & Concurrency Serialization ✅
- Dual-mode persistence fully supported:
  - Local dev / no-Docker mode: Instant Cloud Firestore (`paws-local`) reads/writes with atomic transactions and idempotency checks.
  - Production / Cloud SQL mode: PostgreSQL + Drizzle ORM transactions with row-level locks.
  - Verified across concurrent pet care, guest merges, and First Bond Quest claims.

---

## 5. Verification Checklist

- [x] All 18 Express endpoints inventoried, implemented, and verified.
- [x] Web3 & UI boundaries respected: no smart contracts modified, no UI components altered.
- [x] Server-authoritative Bond XP calculation verified (+15 pet, +25 feed, +20 play).
- [x] First Bond Quest condition enforcement verified (Pet + Feed + Play + 100 Bond XP).
- [x] Idempotency keys prevent replay and duplicate reward farming across all mutating endpoints.
- [x] Dedicated mint eligibility endpoint (`GET /api/pets/:petUid/mint-eligibility`) verified.
- [x] Dual-mode database compatibility (PostgreSQL / Cloud Firestore) verified.
- [x] `test/server.test.ts`: 20/20 test cases passing.
- [x] `test/walletClient.test.ts`: 7/7 test cases passing.
- [x] `test/PawsAndPicketPassport.test.ts`: 4/4 test cases passing.
- [x] `npm run lint` & `npm run build`: 0 errors.
