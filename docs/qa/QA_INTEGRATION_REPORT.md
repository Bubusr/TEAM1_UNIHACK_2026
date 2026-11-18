# Paws & Picket: End-to-End Integration & Cross-Team Interface Report

**Document Version:** 2.0.0 (Post-Fix Sprint Update)  
**Audit Scope:** Interface Contracts, Data Schemas, and State Synchronization between Member 01 (Frontend), Member 02 (Core Backend), and Member 03 (Smart Contracts/Web3)  
**Execution Date:** 2026-11-18  

---

## 1. Executive Summary & Team Boundaries

The **Paws & Picket** architecture is divided across three distinct developer domains:
- **Member 01 (Frontend / Game Engine):** Owns UI state, React canvas, sprite animations, sound, user interactions, and wallet client interaction via ethers.
- **Member 02 (Core Backend & Engine):** Owns server-authoritative state, AI Judge multimodal pipeline, game action execution, Cloud Firestore persistence, repository interfaces, and First Bond Quest rules.
- **Member 03 (Smart Contracts & Web3 Infrastructure):** Owns `PawsAndPicketPassport.sol`, ERC-721 compliance, EIP-712 typed signing verifications, Avalanche Fuji deployment, and tokenURI metadata schema.

---

## 2. Interface Contract Specifications

### 2.1 State Synchronization Contract (`GET /api/keeper/state`)
- **Producer:** Member 02 (Backend)
- **Consumer:** Member 01 (Frontend)
- **Interface Consistency Status:** **VERIFIED (PASS)**

---

### 2.2 Authoritative Web3 Data Repository (`src/db/web3Repository.ts`)
- **Owner:** Member 02 (Persistence Interface)
- **Consumer:** Member 03 (`web3Service.ts`) & Member 01 (`server.ts`)
- **Interface Consistency Status:** **VERIFIED (RESOLVED via DEF-05)**
- **Abstracted Operations:**
  - `getPetForWeb3(petUid)`: Queries Cloud Firestore `pets` (or PostgreSQL if active).
  - `getLinkedWallet({ userId, uid })`: Retrieves verified wallet address and chain ID.
  - `recordIssuedMintClaim(...)`: Records claim voucher in Firestore `mintClaims`.
  - `recordConfirmedMint(...)`: Records verified on-chain mint in Firestore `pets`.
- **Finding:** Seamlessly connects Member 03's Web3 voucher generation to Member 02's Cloud Firestore without requiring Docker/PostgreSQL.

---

### 2.3 EIP-712 Typed Data Mint Contract (`POST /api/web3/mint-claim`)
- **Producer:** Member 02 (Backend)
- **Signer:** Backend `TRUSTED_SIGNER_PRIVATE_KEY`
- **Consumer:** Member 01 (Client) $\to$ Member 03 (`PawsAndPicketPassport.sol` on Fuji)
- **Interface Consistency Status:** **VERIFIED (COMPATIBLE, BLOCKED BY DEPLOYMENT)**
- **EIP-712 Domain:**
  ```json
  {
    "name": "PawsAndPicketPassport",
    "version": "1",
    "chainId": 43113,
    "verifyingContract": "<PET_PASSPORT_CONTRACT_ADDRESS>"
  }
  ```
- **EIP-712 Types:**
  ```solidity
  struct MintClaim {
      address recipient;
      bytes32 petIdHash;
      bytes32 metadataUriHash;
      uint256 nonce;
      uint256 deadline;
  }
  ```
- **Solidity Function Signature:**
  ```solidity
  function mintPassportWithClaim(
      MintClaim calldata claim,
      bytes calldata signature
  ) external returns (uint256 tokenId);
  ```
- **Finding:** The Typed Data hash calculated in `src/server/web3Service.ts` matches Solidity's `_hashTypedDataV4` byte-for-byte (verified via local Hardhat test `PawsAndPicketPassport.test.ts` and regression suite `regression-defects.test.ts`).

---

## 3. End-to-End Workflow Verifications

### Workflow 1: Photo Discovery $\to$ Sanctuary Pet Onboarding
- **Integration Status:** **STABLE WITH FALLBACK**. Real image analysis is blocked by missing API key (`DEF-03`), but mock and local tests confirm the onboarding transaction executes smoothly once AI results are delivered.

---

### Workflow 2: Daily Care $\to$ Bond XP $\to$ First Bond Quest Claim
- **Integration Status:** **PASS**. Strict enum validation (`DEF-01`) now eliminates invalid actions (`"dance"`, `""`, `null`, `123`). Concurrency, idempotency, and one-time claim protection operate correctly across multiple sequential and parallel requests.

---

### Workflow 3: Mint Eligibility $\to$ On-Chain Fuji Mint $\to$ Reconcile
- **Integration Status:** **BLOCKED AT DEPLOYMENT STAGE (`DEF-04`)**. Local signature generation, Firestore persistence, and unit testing are 100% verified, but live execution cannot proceed until contract bytecode is deployed to Avalanche Fuji.

---

## 4. Cross-Team Interface Gaps & Resolution Status

| Gap ID | Teams Involved | Severity | Description | Status | Resolution |
|---|---|---|---|---|---|
| **GAP-01** | Member 02 $\leftrightarrow$ Member 03 | **CRITICAL** | Contract `PawsAndPicketPassport.sol` is not deployed on Fuji testnet. | 🛑 **BLOCKED** | Member 03 deploys contract to Fuji and delivers contract address to Member 02. |
| **GAP-02** | Member 02 $\leftrightarrow$ Member 03 | **HIGH** | `src/server/web3Service.ts` queried PostgreSQL `db` instead of Firestore. | ✅ **RESOLVED** | Member 02 created `src/db/web3Repository.ts`; Member 03 updated `web3Service.ts` to use it. Verified with 3 integration tests. |
| **GAP-03** | Member 01 $\leftrightarrow$ Member 02 | **HIGH** | `POST /api/keeper/care` accepted invalid `actionType` (`BOND-08`). | ✅ **RESOLVED** | Member 02 enforced `['pet', 'feed', 'play']` enum validation on route, controller, and storage engine. |
| **GAP-04** | Member 01 $\leftrightarrow$ Member 02 | **MEDIUM** | Specification requires AI confidence $\ge 85\%$ for minting. | ⚠️ **TRACKED** | Documented and tracked for final tuning when real Gemini scoring is enabled. |
