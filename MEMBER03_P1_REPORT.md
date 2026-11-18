# MEMBER 03 — P1 IMPLEMENTATION REPORT: FIRESTORE RECONCILIATION HARDENING

**Role:** Member 03 – Blockchain & Web3 Integration Engineer  
**Branch:** `mem02-mem03`  
**Date:** November 19, 2026  
**Status:** COMPLETE & VERIFIED — SAFE TO PROCEED

---

## 1. Executive Summary

In Milestone P1, the Web3 ownership reconciliation engine (`reconcileMintedPetOwnership`) was decoupled from direct PostgreSQL queries and re-routed through the unified repository abstraction (`src/db/web3Repository.ts`). This guarantees full compatibility with Cloud Firestore primary mode (where `process.env.DATABASE_URL` is omitted) while preserving full fallback functionality for PostgreSQL.

All Member 02 game rules, First Bond Quest requirements, AI scoring criteria, and database schemas remain 100% untouched.

---

## 2. Root Cause Analysis of Reconciliation Failure

### Identified Defect
In `src/server/web3Service.ts` (lines 726–771 prior to fix), `reconcileMintedPetOwnership` performed direct Drizzle ORM operations:
1. `db.select().from(pets).where(eq(pets.petUid, petUid))`
2. `db.select().from(wallets).where(eq(wallets.userId, pet.currentOwnerId))`
3. `db.select().from(wallets).where(eq(wallets.address, onChainOwner))`
4. `db.update(pets).set(...).where(eq(pets.id, pet.id))`

When deployed or executed in Firestore-primary mode (`DATABASE_URL` unset), the `db` client attempted to execute SQL queries against an unconfigured PostgreSQL pool, resulting in uncaught runtime exceptions or database connection timeouts.

Additionally, `pet.contractAddress` was unpopulated on certain Firestore documents because `recordConfirmedMint` did not write `contractAddress` into the pet document upon mint confirmation.

---

## 3. Implementation Details

### 3.1 `src/db/web3Repository.ts`
- **Extended `Web3PetRecord`:** Added `contractAddress?: string | null` and `onChainOwner?: string | null` to the shared interface.
- **Enhanced `getPetForWeb3`:** Mapped `contractAddress` and `onChainOwner` from both Cloud Firestore (`adminDb.collection('pets')`) and PostgreSQL (`pets` table).
- **Added `getWalletByAddress(address: string)`:**
  - Standardizes EVM address lookups via lowercase matching.
  - Queries Firestore `wallets` collection by `address == cleanAddr`.
  - Fallback check on `users` collection (`wallet.address == cleanAddr`) to support keeper records where wallet is embedded.
  - Retains PostgreSQL query `db.select().from(wallets).where(eq(wallets.address, cleanAddr))` when `DATABASE_URL` is configured.
- **Enhanced `recordConfirmedMint`:** Accepts optional `contractAddress?: string` and persists it onto the pet document in Firestore and PostgreSQL.
- **Added `updatePetOnChainOwnership(params)`:**
  - Atomically updates `currentOwnerId`, `userId`, `currentOwnerUid`, and `onChainOwner` on the target pet document in Firestore.
  - Performs equivalent `db.update(pets)` query when operating in PostgreSQL mode.

### 3.2 `src/server/web3Service.ts`
- **Decoupled `reconcileMintedPetOwnership`:**
  - Uses `getPetForWeb3(petUid)` instead of direct SQL `from(pets)`.
  - Resolves `contractAddress` gracefully: uses `pet.contractAddress || getWeb3Status().contractAddress`.
  - Queries on-chain owner via `ethers.Contract.ownerOf(BigInt(pet.tokenId))`.
  - Retrieves registered keeper wallet for current pet owner via `getLinkedWallet({ userId, uid })`.
  - If in sync (`dbWalletAddress === onChainOwner`), returns `{ reconciled: true, inSync: true, conflict: false, onChainOwner }`.
  - If mismatch detected:
    - Queries `getWalletByAddress(onChainOwner)`.
    - If new on-chain owner is a registered keeper, calls `updatePetOnChainOwnership(...)` and returns `{ reconciled: true, inSync: true, conflict: false, onChainOwner }`.
    - If new on-chain owner has NO registered keeper account, returns `{ reconciled: false, inSync: false, conflict: true, onChainOwner, dbWalletAddress }` without mutating database ownership.
- **Enhanced `confirmFujiMintTransaction`:** Supplies `contractAddress: status.contractAddress` to `recordConfirmedMint` upon successful on-chain mint receipt verification.

---

## 4. Test Verification & Results

### 4.1 New Targeted Regression Suite (`test/web3-reconciliation.test.ts`)
10 tests created specifically covering P1 reconciliation and mint verification behaviors:

| Test Scenario | Status | Elapsed |
| :--- | :---: | :---: |
| 1. Rejects reconciliation for unknown / non-existent pet | **PASS** | 2,844 ms |
| 2. Returns non-reconciled response for unminted pet or pet without tokenId | **PASS** | 1,143 ms |
| 3. Reconciles successfully and idempotently when DB owner matches on-chain owner | **PASS** | 1,661 ms |
| 4. Reconciles transfer to another registered keeper when on-chain owner changed | **PASS** | 1,907 ms |
| 5. Flags conflict without reassigning pet when on-chain owner has no DB account | **PASS** | 2,431 ms |
| 6. Web3 repository resolves wallets via users collection fallback | **PASS** | 849 ms |
| 7. `confirmFujiMintTransaction` rejects invalid hash, missing receipt, or reverted tx | **PASS** | 1,547 ms |
| 8. `confirmFujiMintTransaction` rejects mismatched PetMinted logs or wrong discoverer | **PASS** | 2,088 ms |
| 9. `confirmFujiMintTransaction` succeeds with valid matching event and records confirmed mint | **PASS** | 2,445 ms |
| 10. `/api/web3/reconcile/:petUid` HTTP endpoint verifies auth and returns reconciled result + state | **PASS** | 4,625 ms |

**Result:** 10 / 10 PASS (0 fail)

### 4.2 Web3 & Smart Contract Verification
```
npx tsx --test test/PawsAndPicketPassport.test.ts test/walletClient.test.ts test/web3-reconciliation.test.ts
```
**Result:** 21 / 21 PASS (0 fail)

### 4.3 Full Backend Regression Suite
- `test/server.test.ts`: 19 tests PASS
- `test/regression-defects.test.ts`: 18 tests PASS
- `test/camera-experience.test.ts`: 10 tests PASS
- `test/firestore-duplicate-protection.test.ts`: 14 tests PASS
- `test/PawsAndPicketPassport.test.ts`: 4 tests PASS
- `test/walletClient.test.ts`: 7 tests PASS
- `test/web3-reconciliation.test.ts`: 10 tests PASS

**Grand Total: 82 / 82 Tests PASS (0 Failures, 0 Regressions)**

### 4.4 Static Analysis & Build Verification
- TypeScript Check: `npm run lint` (`tsc --noEmit`) -> **0 ERRORS**
- Vite Production Build: `npm run build` -> **SUCCESSFUL** (`dist/` generated cleanly in 607ms)

---

## 5. Team Boundary Compliance

- **Member 02 Backend Rules:** Preserved unchanged (`discoveryScore >= 80`, `bondXp >= 100`, First Bond Quest requirements, AI judge validation, guest session tokens).
- **Contract Safety:** Existing Fuji deployment (`0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`) and trusted claim signer configuration are unaltered.
- **Secret Safety:** No private keys or secrets logged, committed, or exposed.
- **Branch Discipline:** All modifications contained within `mem02-mem03`.

---

## 6. Next Steps (P2 Preparation)

P0 (Audit) and P1 (Firestore Reconciliation) are completed. We halt here without initiating live minting or contract redeployment, in strict adherence to the execution instructions.
