# MEMBER 03 — PHASE A: READ-ONLY PREFLIGHT AUDIT REPORT
**Network:** Avalanche Fuji C-Chain (Chain ID: `43113`)  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`  
**Audit Timestamp:** 2026-11-19T08:33:00+07:00  
**Branch:** `mem02-mem03`  
**HEAD Commit:** `9e57831`  
**Overall Phase A Status:** **BLOCKED (CRITICAL METADATA HOSTING PREREQUISITE)**

---

## 1. Executive Summary Checklist

| Check ID | Description | Status | Evidence / Verified Value |
| :--- | :--- | :---: | :--- |
| **A1** | **Git & Repo Integrity** | **PASS** | Branch `mem02-mem03`, HEAD `9e57831`, working tree clean, Member 02 game logic untouched |
| **A2** | **Contract Verification** | **PASS** | Bytecode exists (8,387 bytes), Chain ID 43113, ERC-721 + Metadata supported, Soulbound active, 0 tokens minted |
| **A3** | **Trusted Signer Verification** | **PASS** | Address `0x2B237fF449D21ECd304407d98cAAA379290747D5` matches on-chain `claimSigner()`, Typehash `0x849e8587...` matches |
| **A4** | **Pet Eligibility Verification** | **PASS** | Pip (`pet-bunny-vZxWefZiwAO9s2WpYNCKVS29s3d2`): Score 88/100, Bond XP 660/100, `mintStatus: unminted` |
| **A5** | **Public Metadata & Image** | **BLOCKED** | `APP_URL` is unset; local metadata endpoint fails closed (503); `pawsandpicket.app` is `NXDOMAIN` |
| **A6** | **Wallet Recipient Status** | **WAITING** | No Core Wallet linked in session yet; per safety rules, cannot use Deployer address as recipient |

---

## 2. Detailed Audit Findings

### A1. Git & Repository Integrity
- **Branch:** `mem02-mem03` (strictly isolated from `main` and original `mem02`).
- **Working Tree:** Clean (0 unstaged changes).
- **Recent Commits:**
  - `9e57831`: `feat(web3): add Phase I Fuji preflight audit CLI script`
  - `6198e83`: `fix(security): sanitize Firebase web config apiKey and route via VITE_FIREBASE_API_KEY`
  - `c057f89`: `feat(infra): prepare Cloud Run deployment assets, health checks, and production runbooks`
- **Scope Verification:**
  - `src/server/gameActions.ts`: Untouched.
  - Member 02 database schema & Firestore logic: Untouched (only queried via `web3Repository.ts`).
  - Member 01 UI screens: Untouched.

### A2. Avalanche Fuji Smart Contract State
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Chain ID:** `43113` (`0xa869` verified via RPC)
- **Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`
- **Bytecode Length:** 8,387 bytes on-chain.
- **Contract Name:** `Paws & Picket Pet Passport`
- **Contract Symbol:** `PAWS`
- **Contract Owner / Deployer:** `0x2B237fF449D21ECd304407d98cAAA379290747D5`
- **On-Chain Claim Signer:** `0x2B237fF449D21ECd304407d98cAAA379290747D5`
- **Soulbound Restriction:**
  - `ADOPTION_TRANSFERS_ENABLED()`: `false`.
  - Direct transfers (`transferFrom`, `safeTransferFrom`) and approvals (`approve`, `setApprovalForAll`) strictly revert on-chain with `DirectTransferBlocked()`.
- **Interface Support (ERC-165):**
  - `0x80ac58cd` (IERC721): `true`
  - `0x5b5e139f` (IERC721Metadata): `true`
- **Token Count:**
  - `ownerOf(1)`: Reverts with `ERC721NonexistentToken(1)` (`0x7e273289`).
  - Exact total minted: **0 tokens**. Contract is fresh and ready for Token #1.

### A3. Trusted EIP-712 Signer & Voucher Specification
- **Signer Configuration:** `TRUSTED_SIGNER_PRIVATE_KEY` present in local `.env`.
- **Derived Signer Address:** `0x2B237fF449D21ECd304407d98cAAA379290747D5` (100% exact match with on-chain `claimSigner()`).
- **EIP-712 Domain Parameters:**
  ```json
  {
    "name": "PawsAndPicketPassport",
    "version": "1",
    "chainId": 43113,
    "verifyingContract": "0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31"
  }
  ```
- **Type Definition & Typehash:**
  - Definition: `MintClaim(address recipient,bytes32 petIdHash,bytes32 metadataUriHash,uint256 nonce,uint256 deadline)`
  - On-Chain `MINT_CLAIM_TYPEHASH`: `0x849e8587db585218666b698bf43079939297f3a6bd4e8ee098d0af7dd4deaac1`
  - Computed Local Typehash: `0x849e8587db585218666b698bf43079939297f3a6bd4e8ee098d0af7dd4deaac1` (100% exact match).

### A4. Pet Candidate & Eligibility Verification
- **Target Pet:** Pip
- **Pet UID:** `pet-bunny-vZxWefZiwAO9s2WpYNCKVS29s3d2`
- **Owner UID:** `vZxWefZiwAO9s2WpYNCKVS29s3d2` (Owner ID: `1302947346`)
- **Discovery Score:** `88` (Threshold: $\ge 80$) -> **PASS ✓**
- **Bond XP:** `660` (Threshold: $\ge 100$) -> **PASS ✓**
- **Mint Status:** `unminted` -> **PASS ✓**
- **Token ID:** `null` -> **PASS ✓**
- **Mint Tx Hash:** `null` -> **PASS ✓**
- **On-chain `tokenByPetId(keccak256("pet-bunny-vZxWefZiwAO9s2WpYNCKVS29s3d2"))`:** Returns `0` (Unminted on Fuji).

---

## 3. Critical Blockers & Analysis (Why Phase A is BLOCKED)

### Blocker 1: Public Metadata & Image Verification (Phase A5 Requirement)
Section 2.A5 mandates:
> *"Check the real HTTP endpoints from a public network context... If public metadata or image hosting is unavailable, STOP before minting. Do not mint an NFT with broken or inaccessible metadata."*

Current Status:
1. **DNS Lookup:** `pawsandpicket.app` returns `ENOTFOUND` (`NXDOMAIN`).
2. **Firebase Hosting:** `https://paws-local.web.app/api/health` returns HTTP `404 Not Found` (only static CDN is active, dynamic compute is not routed).
3. **Backend Fail-Safe Gate:** In `src/server/web3Service.ts`, `getCanonicalOrigin()` fails closed when `APP_URL` is unset, causing `GET /api/metadata/:petUid` to return HTTP `503 Service Unavailable`.
4. **Impact on EIP-712 Voucher:**
   The EIP-712 signature binds `metadataUriHash = keccak256(bytes(metadataUri))`. If an invalid or unresolvable URL is bound into Token #1, the on-chain NFT will forever point to dead metadata on Snowtrace and NFT explorers.

### Blocker 2: Recipient Core Wallet Connection (Phase B Prerequisite)
Section 0.2 & 3 mandate:
> *"Never use the trusted signer/deployer wallet as the recipient unless it is explicitly the user's intended recipient... If Core Wallet is not installed or the user is not connected, stop and ask the user to connect it."*

Current Status:
- Firestore collection `users` currently has 0 users with an active `walletAddress`.
- We cannot proceed to Phase B (EIP-191 authentication) and Phase C (Voucher issuance) until the user provides their Core Wallet address.

---

## 4. Required Remediation & Decision Gate

To proceed safely from Phase A to Phase B & Phase C:

1. **Resolution for Metadata URI (Choose Option A, B, or C):**
   - **Option A (Public Tunnel / Ngrok / Cloudflare Tunnel):** Run a temporary public HTTPS tunnel pointing to `http://127.0.0.1:3000` (e.g. `https://xxxx.trycloudflare.com`) and set `APP_URL=https://xxxx.trycloudflare.com` so the Fuji NFT points to real live HTTP 200 metadata without requiring domain registration.
   - **Option B (Pinata / Decentralized IPFS):** Provide a Pinata JWT / API key in `METADATA_STORAGE_API_KEY` and set `METADATA_STORAGE_PROVIDER=pinata`. The server will pin the metadata and portrait directly to `ipfs://...`, ensuring permanent decentralized storage for Token #1.
   - **Option C (Testnet Override Origin):** Explicitly approve using a designated testnet origin (e.g. `https://testnet.pawsandpicket.app` or `http://127.0.0.1:3000`) for the Fuji testnet milestone mint.

2. **Provide Recipient Core Wallet Address:**
   - Connect Core Wallet in the app at `http://127.0.0.1:3000`, or provide your Avalanche Fuji wallet address (`0x...`).

---

**Status:** Awaiting user decision on Metadata URI resolution and Core Wallet address before entering Phase B.
