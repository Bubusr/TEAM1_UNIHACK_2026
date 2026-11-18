# MEMBER 03 — BLOCKCHAIN & WEB3 COMPREHENSIVE AUDIT REPORT
**Product:** Paws & Picket  
**Role:** Member 03 — Blockchain & Web3 Integration Engineer  
**Date:** 2026-11-19  
**Current Branch:** `mem02-mem03`  
**Git Status:** Clean working tree (Base commit `6084196` tracking `origin/mem02`)

---

## 1. REPOSITORY & RUNTIME ENVIRONMENT AUDIT

### 1.1 Branch & Workspace Context
- **Active Branch:** `mem02-mem03`
  - *Branch Nomenclature Note:* Created as `mem02-mem03` instead of `mem02/mem03` due to Git's reference storage rules (`refs/heads/mem02` exists as a file, preventing `mem02/` as a directory ref).
  - Derived cleanly from Member 02's committed baseline `6084196`, preserving all previous commit author identity (`Bubusr <pc.thuhuong@gmail.com>`).
- **Working Tree:** 100% clean. Zero uncommitted or unstaged changes.

### 1.2 Environment Variables Audit (Names Only)
The presence of runtime and deployment environment variables was audited via `dotenv` without printing or exposing values:

| Variable Name | Purpose | Status | Verification Method |
| :--- | :--- | :---: | :--- |
| `AVALANCHE_FUJI_RPC_URL` | Fuji C-Chain RPC endpoint | **CONFIGURED** | Verified through RPC call |
| `AVALANCHE_CHAIN_ID` | Network Chain ID (43113) | **CONFIGURED** | Verified through RPC call |
| `DEPLOYER_PRIVATE_KEY` | Hardhat deployment account | **CONFIGURED** | Verified on-chain balance via RPC |
| `TRUSTED_SIGNER_PRIVATE_KEY` | EIP-712 server claim signer | **CONFIGURED** | Verified against on-chain `claimSigner()` |
| `PET_PASSPORT_CONTRACT_ADDRESS` | Deployed Passport NFT contract | **CONFIGURED** | Verified on-chain bytecode via RPC |
| `GEMINI_API_KEY` | AI Photo Judge evaluation | **CONFIGURED** | Verified by backend regression tests |
| `GUEST_SESSION_SECRET` | HMAC guest token security | **CONFIGURED** | Verified by backend regression tests |
| `DATABASE_URL` | PostgreSQL connection string | **MISSING** | Primary persistence is Cloud Firestore |
| `METADATA_STORAGE_PROVIDER` | Storage provider selection | **MISSING** | Defaults to canonical `server` endpoint |
| `METADATA_STORAGE_API_KEY` | Pinata IPFS API JWT/Key | **MISSING** | Tested via mock; live IPFS upload pending |
| `APP_URL` | Public origin override | **MISSING** | Auto-detected from incoming request host |

---

## 2. AVALANCHE FUJI SMART CONTRACT ON-CHAIN AUDIT

### 2.1 Contract Deployment Evidence (Verified Through RPC)
Direct JSON-RPC query to Avalanche Fuji Testnet (`https://api.avax-test.network/ext/bc/C/rpc`, Chain ID `43113`):

- **Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`
- **Bytecode Length:** `16,776 bytes` (Confirmed deployed and active)
- **ERC-721 Name:** `Paws & Picket Pet Passport`
- **ERC-721 Symbol:** `PAWS`
- **Contract Owner:** `0x2B237fF449D21ECd304407d98cAAA379290747D5`
- **On-Chain Claim Signer:** `0x2B237fF449D21ECd304407d98cAAA379290747D5`
- **Local Signer Match:** **MATCH CONFIRMED** (Address derived from `TRUSTED_SIGNER_PRIVATE_KEY` matches on-chain `claimSigner()` 100%)
- **Deployer Fuji Balance:** `~0.01 AVAX`
- **Snowtrace Explorer Link:** [https://testnet.snowtrace.io/address/0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31](https://testnet.snowtrace.io/address/0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31)

### 2.2 Smart Contract Architecture (`contracts/PawsAndPicketPassport.sol`)
*Verified by source-code inspection and automated contract tests:*
- **Standard Compliance:** OpenZeppelin v5 `ERC721`, `ERC721URIStorage`, `Ownable`, `EIP712`.
- **EIP-712 Domain:** `name: "PawsAndPicketPassport"`, `version: "1"`, `chainId: 43113`, `verifyingContract: 0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`.
- **Typehash:**
  ```solidity
  keccak256("MintClaim(address recipient,bytes32 petIdHash,bytes32 metadataUriHash,uint256 nonce,uint256 deadline)")
  ```
- **Replay Protection:** Enforced by mapping `mapping(uint256 => bool) public usedNonces`.
- **Pet Uniqueness:** Enforced by mapping `mapping(bytes32 => uint256) public tokenByPetId`. Attempting to mint a second Passport for the same `petIdHash` reverts with `PetAlreadyMinted()`.
- **Phase 1 Custody Policy (Soulbound):**
  - `approve()` and `setApprovalForAll()` unconditionally revert with `DirectTransferBlocked()`.
  - `_update()` blocks transfers where `from != address(0)` and `to != address(0)` unless explicit adoption transfer is unlocked.
  - `ADOPTION_TRANSFERS_ENABLED = false` in Phase 1, making `createAdoptionOffer`, `cancelAdoptionOffer`, and `acceptAdoption` revert with `AdoptionTransfersDisabled()`. Direct transfers cannot be bypassed.

---

## 3. AUTOMATED TEST RESULTS & VERIFICATION COMMANDS

### 3.1 Smart Contract Hardhat Tests
- **Command:** `npx tsx --test test/PawsAndPicketPassport.test.ts`
- **Result:** **4/4 PASS (560ms)** *(Verified by automated test)*
  1. `mints a Pet Passport with valid EIP-712 claim and records immutable discoverer`
  2. `emits PetMinted log and stores ipfs:// metadataUri matching backend claim confirmation format`
  3. `rejects invalid signature, wrong caller, expired claim, replay nonce, and duplicate pet mint`
  4. `blocks direct transfers and approvals AND disables all player-to-player adoption transfers in Phase 1`

### 3.2 Wallet Client & Provider Prioritization Tests
- **Command:** `npx tsx --test test/walletClient.test.ts`
- **Result:** **7/7 PASS (90ms)** *(Verified by automated test)*
  1. `prioritizes EIP-6963 Core Wallet over MetaMask even when MetaMask announces first`
  2. `falls back to window.avalanche when EIP-6963 only announces non-Core wallets`
  3. `falls back to generic window.ethereum and handles window.ethereum.providers arrays`
  4. `reports no-wallet and unsupported-wallet states safely and matches Keeper UI branches`
  5. `does not re-dispatch eip6963:requestProvider inside announce handlers`
  6. `connects Core on Avalanche C-Chain Mainnet, triggers readable personal_sign EIP-191 prompt without chain switch, and switches/adds Fuji on explicit request`
  7. `surfaces exact failed JSON-RPC method & code on user rejection (4001) or unsupported signature RPC (-32601)`

### 3.3 Full System Regression Tests
- **Command:** `npx tsx --test test/firestore-duplicate-protection.test.ts test/camera-experience.test.ts test/server.test.ts test/regression-defects.test.ts test/walletClient.test.ts test/PawsAndPicketPassport.test.ts`
- **Result:** **72/72 PASS across 9 suites (71,131ms)** *(Verified by automated test)*

### 3.4 Contract Compilation
- **Command:** `npx hardhat compile --force`
- **Result:** **SUCCESS** (`Compiled 1 Solidity file with solc 0.8.28 (evm target: cancun)`)

---

## 4. METADATA & IPFS STATUS DISTINCTION

- **Server-Canonical Metadata Mode:** **READY & ACTIVE**  
  *Evidence:* Tested via `GET /api/metadata/:petUid`. Generates dynamic, PII-free ERC-721 JSON metadata.
- **Pinata IPFS 2-Stage Pinning:** **READY IN CODE, MOCK-VERIFIED**  
  *Evidence:* Implemented in `src/server/web3Service.ts:221-313` and verified with mock fetch in `test/server.test.ts:343`.  
  *Important Clarification:* A live, real upload to Pinata's public IPFS gateway has **NOT** been executed because `METADATA_STORAGE_API_KEY` is not populated in the local environment. It is accurately classified as **MOCK-VERIFIED**, not a live IPFS upload.

---

## 5. DEPENDENCY MATRIX FOR BLOCKCHAIN INTEGRATION

| Dependency | Required Evidence | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| **Pet Eligibility API** | `GET /api/pets/:petUid/mint-eligibility` | **READY** | Automated test (`server.test.ts:790`) |
| **Pet ID Stability** | Persistent `petUid` in database | **READY** | Automated test (`web3Repository.ts`) |
| **Wallet Authentication** | EIP-191 personal_sign challenge | **READY** | Automated test (`walletAuth.ts`, `server.test.ts`) |
| **EIP-712 Mint Claim** | Typehash & typed signature generation | **READY** | Automated test (`PawsAndPicketPassport.test.ts`) |
| **Trusted Signer** | Server key matches on-chain `claimSigner` | **READY** | RPC query to Fuji contract `0x2aA2EbA...` |
| **Passport Contract** | Valid bytecode deployed on Fuji (43113) | **READY** | RPC query: 16,776 bytes present |
| **Fuji RPC Connection** | Connected to official Avalanche testnet | **READY** | RPC query: Chain ID 43113 verified |
| **IPFS Metadata** | Persistent CID storage | **NEEDS FIX / KEY** | Code ready; requires Pinata API key for live pin |
| **Mint Transaction** | Receipt with status 1 & `PetMinted` log | **READY** | Verified by contract unit tests |
| **Ownership Verification** | `ownerOf(tokenId) == player` | **READY** | Verified by contract unit tests |
| **Firestore Reconciliation** | Reconcile without PostgreSQL dependency | **NEEDS FIX** | Identified in P1 (`web3Service.ts:726`) |

---

## 6. CRITICAL BLOCKERS & RECOMMENDED EXECUTION ORDER

### Identified Blocker for P1:
- `reconcileMintedPetOwnership` in [src/server/web3Service.ts:725-780](file:///Users/apple/HACKATHON/src/server/web3Service.ts#L725-L780) uses direct PostgreSQL `db.select().from(pets)` queries. Calling `/api/web3/reconcile/:petUid` in Firestore-primary mode fails.
- Fix: Replace with `getPetForWeb3()`, `getWalletByAddress()`, and `updatePetOnChainOwnership()` in `src/db/web3Repository.ts`.

### Go / No-Go Decision:
- **Decision:** **GO FOR P1 IMPLEMENTATION**
- **Justification:** The smart contract is already deployed, bytecode is verified on Avalanche Fuji, trusted signer keys match on-chain access controls, and 72/72 system tests pass. Resolving the Firestore reconciliation gap unblocks full end-to-end Web3 capability.
