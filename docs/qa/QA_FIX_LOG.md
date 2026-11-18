# Paws & Picket: QA Fix Log & Verification Record

**Sprint:** CONTROLLED QA BUG FIX SPRINT  
**Execution Timestamp:** 2026-11-18T13:52:00+07:00  
**Status:** **FIXES VERIFIED — READY FOR FULL REGRESSION**  
**Pre-Fix State:** 47 PASS | 2 FAIL | 2 BLOCKED  
**Post-Fix State:** 49 PASS | 0 FAIL | 2 BLOCKED  
**New Regression Suite:** 17 / 17 PASS ([test/regression-defects.test.ts](file:///Users/apple/HACKATHON/test/regression-defects.test.ts))  
**Core Backend Suite:** 20 / 20 PASS ([test/server.test.ts](file:///Users/apple/HACKATHON/test/server.test.ts))  

---

## 1. Summary of Defects Addressed

| Defect ID | Severity | Category | Status | Summary of Fix |
|---|---|---|---|---|
| **DEF-01** | High | Business Logic | ✅ **RESOLVED** | Enforced strict enum validation (`['pet', 'feed', 'play']`) in `server.ts`, `gameActions.ts`, and `firestoreStorage.ts`. Invalid types (e.g. `'dance'`, `null`, `""`, `123`) rejected with HTTP 400. |
| **DEF-02** | Medium | Security / Sanitization | ✅ **RESOLVED** | Overhauled `sanitizeOneWord()` in `rewards.ts` to strip `<script>`, `<style>`, HTML tags, event handlers, and quotes while fully preserving valid Unicode letters (e.g. Vietnamese `Bông`, French `Café`, Japanese `ハチ公`) and compound names. |
| **DEF-05** | High | Multi-DB Integration | ✅ **RESOLVED** | Created [src/db/web3Repository.ts](file:///Users/apple/HACKATHON/src/db/web3Repository.ts) as the authoritative data-access abstraction. Decoupled `web3Service.ts` and `walletAuth.ts` from direct PostgreSQL `db` queries, enabling Cloud Firestore-backed pets and wallets to issue EIP-712 mint claims and serve ERC-721 metadata. |
| **DEF-03** | Blocker | Configuration | 🛑 **BLOCKED (Unchanged)** | `GEMINI_API_KEY` remains empty in `.env`. Fail-safe HTTP 503 behavior confirmed. Requires user-supplied secret. |
| **DEF-04** | Blocker | Web3 / Testnet | 🛑 **BLOCKED (Unchanged)** | `PET_PASSPORT_CONTRACT_ADDRESS` remains empty. Contract `PawsAndPicketPassport.sol` is ready for deployment to Avalanche Fuji (Chain ID 43113). |

---

## 2. Detailed Technical Fix Records

### DEF-01: Care Action Enum Validation
- **Defect ID:** DEF-01 (Matrix: `BOND-08`)
- **Root Cause:**
  [server.ts#L504](file:///Users/apple/HACKATHON/server.ts#L504) only checked truthiness of `actionType` (`!actionType`), allowing arbitrary strings like `"dance"`. In [src/db/firestoreStorage.ts#L486](file:///Users/apple/HACKATHON/src/db/firestoreStorage.ts#L486), the `if/else if` chain fell through with 0 deltas but appended a memory item `{ kind: "dance" }` and returned HTTP 200.
- **Files Changed:**
  1. [server.ts](file:///Users/apple/HACKATHON/server.ts#L508-L518): Added `SUPPORTED_CARE_ACTIONS = ['pet', 'feed', 'play']` guard, returning HTTP 400.
  2. [src/server/gameActions.ts](file:///Users/apple/HACKATHON/src/server/gameActions.ts#L465-L475): Added runtime assertion guard.
  3. [src/db/firestoreStorage.ts](file:///Users/apple/HACKATHON/src/db/firestoreStorage.ts#L400-L415): Added runtime assertion guard before transaction begins.
- **Exact Behavior Changed:**
  `POST /api/keeper/care` with `actionType: "dance"`, `""`, `null`, `123`, or missing field immediately halts with `HTTP 400: Invalid care actionType. Must be one of: pet, feed, play.` No memory records are created, no coins/XP/bond are awarded, no inventory is deducted, and timestamps remain untouched.
- **Regression Tests Added:**
  In [test/regression-defects.test.ts](file:///Users/apple/HACKATHON/test/regression-defects.test.ts):
  - `rejects invalid actionType "dance" with HTTP 400 and does NOT mutate state`
  - `rejects empty string actionType with HTTP 400`
  - `rejects null actionType with HTTP 400`
  - `rejects numeric actionType (123) with HTTP 400`
  - `rejects missing actionType with HTTP 400`
  - `accepts valid care action "pet" and increments Bond XP + adds memory`
- **Execution Result:** ✅ **6 / 6 PASS**.

---

### DEF-02: Tag Sanitization & Rendering Safety
- **Defect ID:** DEF-02 (Matrix: `SEC-07`)
- **Root Cause:**
  `sanitizeOneWord` in [src/server/rewards.ts](file:///Users/apple/HACKATHON/src/server/rewards.ts) used `input.replace(/[^a-zA-Z0-9 -]/g, '')`. For input `<script>alert(1)</script> Sunny`, it stripped `<` and `>`, leaving the raw tag words `scriptalert1script`. Additionally, it stripped all non-ASCII Unicode characters, breaking legitimate Vietnamese or foreign pet names.
- **Files Changed:**
  1. [src/server/rewards.ts](file:///Users/apple/HACKATHON/src/server/rewards.ts#L36-L55):
     - Strip `<script>` and `<style>` blocks along with their inner contents.
     - Strip remaining HTML tags (`<[^>]+>`).
     - Strip HTML entity encodings (`&...;`).
     - Strip inline event handlers (`on\w+=`) and dangerous pseudo-protocols (`javascript:`, `vbscript:`, `data:`).
     - Allow Unicode letters (`\p{L}`), numbers (`\p{N}`), hyphens, underscores, and spaces.
     - Return the first non-empty word token sliced to max 24 chars, or fallback.
- **Exact Behavior Changed:**
  - `<script>alert(1)</script> Sunny` $\to$ `"Sunny"` (was `"scriptalert1script"`).
  - `<script>alert(1)</script>` $\to$ fallback (`"Clover"`).
  - `<img src=x onerror=alert(1)> Milo` $\to$ `"Milo"`.
  - `Bông Tuyết` $\to$ `"Bông"` (preserved Unicode letter `ô`).
  - `Café` $\to$ `"Café"`.
  - `ハチ公` $\to$ `"ハチ公"`.
  - `"Oliver"` $\to$ `"Oliver"` (quotes stripped).
- **Rendering Sink Audit:**
  Audited all frontend rendering locations in [src/components/SanctuaryScreen.tsx](file:///Users/apple/HACKATHON/src/components/SanctuaryScreen.tsx) and [src/components/CreamSheets.tsx](file:///Users/apple/HACKATHON/src/components/CreamSheets.tsx). All instances use standard React JSX text nodes (`{pet.name}`), which invoke `document.createTextNode()` with automatic HTML escaping. Zero usage of `dangerouslySetInnerHTML`, `innerHTML`, or `eval()`.
- **Regression Tests Added:**
  In [test/regression-defects.test.ts](file:///Users/apple/HACKATHON/test/regression-defects.test.ts):
  - 8 distinct unit tests covering scripts, img onerror, svg onload, quotes, Unicode, compound names, and null/undefined fallbacks.
- **Execution Result:** ✅ **8 / 8 PASS**.

---

### DEF-05: Web3 Persistence Consistency (Firestore Integration)
- **Defect ID:** DEF-05 (Architectural Anomaly)
- **Root Cause:**
  The game state operates primarily on Cloud Firestore (`paws-local`), but `src/server/web3Service.ts` and `src/server/walletAuth.ts` performed direct Drizzle ORM queries against PostgreSQL (`db.select().from(wallets)`, `db.select().from(pets)`). When PostgreSQL is offline (Docker stopped), Web3 operations crashed.
- **Files Changed:**
  1. Created [src/db/web3Repository.ts](file:///Users/apple/HACKATHON/src/db/web3Repository.ts):
     - `getPetForWeb3(petUid)`: Unified pet retrieval supporting Firestore doc/query and Drizzle ORM.
     - `getLinkedWallet({ userId, uid })`: Retrieves verified wallet from Firestore `wallets` or Postgres `wallets`.
     - `recordIssuedMintClaim(...)`: Records claim voucher into Firestore `mintClaims` or Postgres `mint_claims`.
     - `recordConfirmedMint(...)`: Updates pet `mintStatus='minted'` and on-chain ownership in Firestore or Postgres.
     - `storeWalletAuthNonce`, `consumeNonceAndBindWallet`, `removeBoundWallet`: Provides wallet binding support for Firestore.
  2. [src/server/web3Service.ts](file:///Users/apple/HACKATHON/src/server/web3Service.ts):
     - `issueSignedMintClaim`: Switched to `getLinkedWallet`, `getPetForWeb3`, and `recordIssuedMintClaim`.
     - `confirmFujiMintTransaction`: Switched to `getLinkedWallet`, `getPetForWeb3`, and `recordConfirmedMint`.
  3. [src/server/walletAuth.ts](file:///Users/apple/HACKATHON/src/server/walletAuth.ts): Switched to `web3Repository.ts`.
  4. [server.ts](file:///Users/apple/HACKATHON/server.ts): `/api/metadata/:petUid` switched to `getPetForWeb3(petUid)`.
- **Exact Behavior Changed:**
  Eligible pets stored in Cloud Firestore can now successfully request signed EIP-712 mint claim vouchers, query dynamic ERC-721 metadata via `GET /api/metadata/:petUid`, and confirm on-chain Fuji mint receipts without requiring PostgreSQL.
- **Regression Tests Added:**
  In [test/regression-defects.test.ts](file:///Users/apple/HACKATHON/test/regression-defects.test.ts):
  - `reads pet record from Cloud Firestore via getPetForWeb3` (PASS)
  - `serves dynamic ERC-721 metadata for Firestore-backed pet via GET /api/metadata/:petUid` (PASS)
  - `allows a Firestore-backed eligible pet with verified wallet to issue a signed mint claim voucher` (PASS: verified EIP-712 typed data signature recovery against trusted signer address)
- **Execution Result:** ✅ **3 / 3 PASS**.

---

## 3. Comprehensive Test Suite Verification

| Suite | File | Tests | Pass | Fail | Duration |
|---|---|---|---|---|---|
| New Regression Defects | [test/regression-defects.test.ts](file:///Users/apple/HACKATHON/test/regression-defects.test.ts) | 17 | **17** | 0 | 11.6s |
| Backend Core Integration | [test/server.test.ts](file:///Users/apple/HACKATHON/test/server.test.ts) | 20 | **20** | 0 | 62.1s |
| Web3 Client Discovery | [test/walletClient.test.ts](file:///Users/apple/HACKATHON/test/walletClient.test.ts) | 7 | **7** | 0 | 0.08s |
| Smart Contract Rules | [test/PawsAndPicketPassport.test.ts](file:///Users/apple/HACKATHON/test/PawsAndPicketPassport.test.ts) | 4 | **4** | 0 | 0.91s |
| QA Audit Runner (Re-run) | [test/qa-audit-runner.ts](file:///Users/apple/HACKATHON/test/qa-audit-runner.ts) | 51 | **49** | 0 (2 Blocked) | 28.5s |
| TypeScript Check | `npm run lint` (`tsc --noEmit`) | - | **0 errors** | 0 | 1.8s |
| Production Build | `npm run build` (`vite build`) | - | **Clean** | 0 | 0.73s |

---

## 4. Remaining Limitations (Prior to Fuji Testnet Launch)

1. **DEF-03 (Gemini Key):** Real live animal discovery requires `GEMINI_API_KEY` in `.env`.
2. **DEF-04 (Fuji Contract):** Deployer wallet `0x2B237fF449D21ECd304407d98cAAA379290747D5` needs testnet AVAX to deploy `PawsAndPicketPassport.sol`, after which `PET_PASSPORT_CONTRACT_ADDRESS` must be set.

---

## 5. Final Sprint Decision

> **FIXES VERIFIED — READY FOR FULL REGRESSION**
> 
> All confirmed code defects (DEF-01, DEF-02, DEF-05) have been remediated with zero regressions. The codebase has met all conditions for **Gate 1 — Backend Ready**.
