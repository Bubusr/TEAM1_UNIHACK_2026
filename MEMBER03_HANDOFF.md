# MEMBER 03 — MASTER WEB3 HANDOFF & ARCHITECTURAL SPECIFICATION

**Author:** Member 03 – Blockchain & Web3 Integration Engineer  
**Role:** Paws & Picket Avalanche Fuji Web3 Lead  
**Branch:** `mem02-mem03`  
**Date:** November 19, 2026  
**Network:** Avalanche Fuji C-Chain (Chain ID: `43113`)  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`  

---

## 1. What Member 03 Implemented

1. **Firestore-Primary Ownership Reconciliation (P1):**
   - Decoupled `reconcileMintedPetOwnership` from direct Drizzle ORM PostgreSQL queries.
   - Built dual-mode repository functions in `src/db/web3Repository.ts` supporting both Cloud Firestore primary and PostgreSQL fallback.
   - Case-insensitive address normalization and fallback query on `users.wallet.address`.
   - Conflict-safe reconciliation: external / unregistered on-chain transfers flag `{ conflict: true }` without mutating database ownership.
2. **Avalanche Fuji ERC-721 Smart Contract Infrastructure (Phase B):**
   - Verified live contract deployment at `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`.
   - Verified on-chain claim signer matches the backend trusted signer (`0x2B237fF449D21ECd304407d98cAAA379290747D5`).
   - Verified Soulbound Phase 1 custody protections (direct transfer blocked, approvals blocked, adoption transfers disabled).
3. **Core Wallet Discovery & EIP-191 Authentication (Phase C):**
   - EIP-6963 discovery (`com.avalabs.core`) with injected fallbacks (`window.avalanche`, `window.ethereum`).
   - Nonce-based EIP-191 challenge/response signature verification on backend.
   - Atomic wallet binding to Keeper account in Cloud Firestore.
4. **EIP-712 Authoritative Mint Claim Pipeline (Phase D):**
   - Server-authoritative eligibility validation (`discoveryScore >= 80` and `bondXp >= 100`).
   - Cryptographic EIP-712 typed voucher generation with 15-minute deadline and single-use random nonce.
5. **Metadata Storage Architecture (Phase E):**
   - Documented Mode B (Server Canonical Metadata via `/api/metadata/:petUid`) with PII-scrubbed ERC-721 schema.
   - Documented Mode A (Pinata IPFS 2-stage pinning for production).
6. **Fuji RPC Mint Confirmation Engine (Phase F):**
   - Independent on-chain receipt verification (`status == 1`, `to == contractAddress`).
   - `PetMinted` event log parser extracting immutable `tokenId`, `petIdHash`, and `discoverer`.
   - Idempotent duplicate confirmation protection.
7. **Frontend Handoff Documentation (Phase G):**
   - Detailed integration guide and 16-state UI machine for Member 01 in `MEMBER03_FRONTEND_HANDOFF.md`.
8. **End-to-End Test Matrix (Phase H):**
   - 27 Web3 automated tests passing; 88/88 workspace tests passing with 0 regressions.

---

## 2. Files Modified & Created

### Modified Primary Files
- `src/db/web3Repository.ts`: Added `getWalletByAddress`, `updatePetOnChainOwnership`, contract address and on-chain owner mappings, and enhanced `recordConfirmedMint`.
- `src/server/web3Service.ts`: Re-routed `reconcileMintedPetOwnership` through `web3Repository.ts`, added dynamic contract address fallback, and passed `contractAddress` to `recordConfirmedMint`.
- `src/server/app.ts`: Passed `user.uid` to `unlinkWallet` for clean Firestore wallet deletion.

### Created Deliverable Documents & Test Suites
- `MEMBER03_AUDIT.md`: Pre-execution audit report.
- `MEMBER03_P1_REPORT.md`: P1 implementation and verification report.
- `FUJI_DEPLOYMENT.md`: Avalanche Fuji live contract deployment record.
- `METADATA_STORAGE_REPORT.md`: Canonical metadata schema and IPFS specification.
- `MEMBER03_FRONTEND_HANDOFF.md`: Integration guide for Member 01.
- `WEB3_TEST_REPORT.md`: Comprehensive 88-test regression matrix report.
- `MEMBER03_HANDOFF.md`: This master specification document.
- `test/web3-reconciliation.test.ts`: 10 targeted Firestore reconciliation tests.
- `test/web3-e2e-matrix.test.ts`: 6 end-to-end lifecycle matrix tests.

---

## 3. How the Smart Contract Works

- **Standard:** ERC-721 with OpenZeppelin `ERC721URIStorage`, `Ownable`, and `EIP712`.
- **Minting Mechanism:** `mintWithClaim(address recipient, bytes32 petIdHash, string metadataUri, uint256 nonce, uint256 deadline, bytes signature)`.
- **Validation:**
  - `msg.sender == recipient`.
  - `block.timestamp <= deadline`.
  - `!usedNonces[nonce]`.
  - `tokenByPetId[petIdHash] == 0`.
  - `ECDSA.recover(digest, signature) == claimSigner`.
- **Custody Rules (Soulbound Phase 1):**
  - Direct transfers (`transferFrom`, `safeTransferFrom`) revert with `DirectTransferBlocked()`.
  - Approvals (`approve`, `setApprovalForAll`) revert with `DirectTransferBlocked()`.
  - P2P Adoptions revert with `AdoptionTransfersDisabled()`.

---

## 4. How Wallet Authentication Works

1. Frontend calls `connectInjectedWallet()` via `src/lib/walletClient.ts`.
2. Keeper requests a nonce challenge from `POST /api/wallet/nonce`.
3. Backend generates a 16-byte random hex nonce and returns an EIP-191 human-readable message.
4. Core Wallet displays readable prompt to keeper and signs via `personal_sign`.
5. Frontend submits signature to `POST /api/wallet/verify`.
6. Backend validates signature via `ethers.verifyMessage`, consumes the nonce, checks for wallet account collisions, and binds the wallet address to the Keeper in Firestore.

---

## 5. How EIP-712 Claims Work

1. Authenticated Keeper requests mint claim via `POST /api/web3/mint-claim`.
2. Backend loads the authoritative pet document from Cloud Firestore.
3. Backend evaluates `computeMintEligibility(pet)`:
   - Requires `pet.discoveryScore >= 80`.
   - Requires `pet.bondXp >= 100`.
   - Requires `pet.mintStatus !== 'minted'`.
4. Backend formats OpenZeppelin EIP-712 typed struct `MintClaim`.
5. Server signs with `TRUSTED_SIGNER_PRIVATE_KEY` (`0x2B237fF449D21ECd304407d98cAAA379290747D5`).
6. Claim voucher returned to frontend; Keeper submits tx directly to Fuji C-Chain.

---

## 6. How Metadata is Stored

- **Mode B (Default Server Canonical):**
  - Token URI format: `https://<domain>/api/metadata/:petUid`.
  - Serves ERC-721 compliant JSON with traits (`Species`, `Pose`, `Discovery Score`, `Bond XP`, `Original Discoverer`).
  - Image served via `/api/pets/:petUid/portrait` with binary stream and `Content-Type` header.
  - Zero PII exposed.
- **Mode A (Pinata IPFS):**
  - Dual-stage pinning (Image CID -> Metadata CID).
  - Token URI format: `ipfs://<metadataCid>`.

---

## 7. How Mint Confirmation Works

1. After on-chain transaction inclusion, frontend sends tx hash to `POST /api/web3/confirm-mint`.
2. Backend queries Fuji RPC for the transaction receipt.
3. Checks `receipt.status == 1`, `receipt.to == contractAddress`, and `confirmations >= 1`.
4. Parses event logs for `PetMinted` matching `ethers.id(petUid)` and recipient wallet.
5. Verifies `ownerOf(tokenId)` matches the recipient.
6. Calls `recordConfirmedMint` to atomically transition the pet to `mintStatus: 'minted'`, saves `tokenId`, `mintTxHash`, `contractAddress`, and `onChainOwner`, and adds a milestone memory.

---

## 8. How Firestore Persists the Passport

Pet documents in Firestore collection `pets`:
```json
{
  "petUid": "pet-retriever-guest:multi-pet-1794982055618",
  "name": "Sunny",
  "mintStatus": "minted",
  "minted": true,
  "tokenId": "1",
  "mintTxHash": "0x...",
  "contractAddress": "0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31",
  "onChainOwner": "0x...",
  "currentOwnerId": 8201,
  "currentOwnerUid": "keeper_uid"
}
```

---

## 9. Production Hosting & Cloud Run Deployment Infrastructure

1. **Hosting Provider Audit:** Identified project configuration in `.firebaserc` (project `paws-local`, number `213801959465`). API audit verified `billingEnabled: false` (Spark free tier).
2. **Container Architecture:** Created multi-stage `Dockerfile`, `.dockerignore`, and health checks (`/api/health`, `/healthz`) in `src/server/app.ts`.
3. **Dynamic Origin Resolution:** Implemented `getCanonicalOrigin()`, which reads `process.env.APP_URL` and fails closed (HTTP 503) if unconfigured in production.
4. **Privacy Boundary:** Added `isPetPubliclyAccessible()` protecting unbonded/unpublished private photos from unauthenticated scraping.
5. **Deployment Deliverables:**
   - `CLOUD_RUN_DEPLOYMENT.md`: Step-by-step Cloud Run guide.
   - `PRODUCTION_SMOKE_TEST.md`: 12-point automated verification script.
   - `PRODUCTION_ENVIRONMENT_CHECKLIST.md`: Secret management and environment variable audit.
   - `PRODUCTION_HOSTING_REPORT.md`: Comprehensive hosting and DNS report.

---

## 10. Known Limitations

- **Phase 1 Soulbound:** In-game player-to-player NFT transfers are disabled until Phase 2 smart contract upgrade.
- **Server Metadata Dependency:** Under Mode B, Token URIs depend on the domain availability of the backend web server rather than decentralized IPFS pinning.
- **Public Domain Deployment:** The backend must be deployed to public compute (e.g. Google Cloud Run or Firebase Blaze) with `APP_URL` configured before the metadata and portrait endpoints are accessible to external indexers on the public internet.

---

## 11. Steps Remaining for Milestone I (Real Fuji Mint)

1. Enable billing on project `paws-local` or configure container hosting.
2. Deploy backend Express server to Cloud Run and configure `APP_URL`.
3. Run `PRODUCTION_SMOKE_TEST.md` against the live HTTPS URL.
4. Connect Keeper's Core Wallet to act as Transaction Sender & NFT Recipient.
5. User gives explicit approval to broadcast `mintWithClaim` on Avalanche Fuji C-Chain.
6. Verify token #1 mint and event log independently on Snowtrace.
