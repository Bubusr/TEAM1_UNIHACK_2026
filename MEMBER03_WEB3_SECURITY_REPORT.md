# MEMBER 03 — WEB3 SECURITY & THREAT MODEL AUDIT REPORT

**Author:** Member 03 – Senior Web3 Engineer & Security Lead  
**Branch:** `mem02-mem03`  
**Execution Date:** November 19, 2026  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31` (Avalanche Fuji)  
**Security Status:** **PASSED ALL 10 VOUCHER & RECONCILIATION THREAT VECTORS (36/36 TESTS PASS)**

---

## 1. Threat Modeling & Security Posture

The Paws & Picket Pet Passport smart contract architecture was designed to resist the most critical vulnerabilities in Web3 gaming: MEV voucher front-running, unauthorized trading of soulbound pet passports, signature replay across chains or sessions, and desynchronization between on-chain ERC-721 ownership and off-chain database records.

---

## 2. Core Security Controls Evaluated

### 2.1 Soulbound Phase 1 Protection (Direct Transfers & Approvals Blocked)
- **Objective:** Prevent speculative secondary market trading and bot farming of pet passports.
- **Contract Enforcement:**
  - `_update(address to, uint256 tokenId, address auth)` explicitly enforces:
    - Initial mint (`from == address(0)`) is allowed.
    - Any direct `transferFrom` or `safeTransferFrom` reverts with custom error `DirectTransferBlocked()`.
  - OpenZeppelin standard approval functions are completely disabled:
    - `approve(address, uint256)` reverts unconditionally with `DirectTransferBlocked()`.
    - `setApprovalForAll(address, bool)` reverts unconditionally with `DirectTransferBlocked()`.
  - P2P Adoptions in Phase 1: `ADOPTION_TRANSFERS_ENABLED` is set to `false`. Any call to `createAdoptionOffer` reverts with `AdoptionTransfersDisabled()`.
- **Test Verification:** Verified in `test/PawsAndPicketPassport.test.ts` (PASS).

### 2.2 EIP-712 Voucher Integrity & Authorization Boundary
- **Objective:** Ensure only authorized backend vouchers issued by the trusted signer can mint a Pet Passport, and prevent MEV front-runners from stealing claims.
- **Cryptographic Scheme:**
  - Standard EIP-712 Typed Data Domain:
    - `name: "Paws & Picket Pet Passport"`
    - `version: "1"`
    - `chainId: 43113`
    - `verifyingContract: 0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`
  - Struct `MintClaim(address recipient,bytes32 petIdHash,bytes32 metadataUriHash,uint256 nonce,uint256 deadline)`
- **Front-Running Prevention (`msg.sender == recipient`):**
  - Line 111 of `PawsAndPicketPassport.sol`:
    `if (recipient == address(0) || msg.sender != recipient) revert InvalidRecipient();`
  - Even if a malicious bot intercepts a voucher in the public Avalanche mempool, the transaction will revert because only the verified `recipient` wallet can broadcast `mintWithClaim`.

### 2.3 Nonce Replay & Double-Mint Defenses
- **Objective:** Prevent repeated use of the same claim or minting multiple tokens for a single pet.
- **Enforcement:**
  - **Single-Use Nonce:** `usedNonces[nonce] = true` is marked immediately on-chain upon successful execution. Submitting the same nonce again reverts with `NonceAlreadyUsed()`.
  - **Pet Id Hash Uniqueness:** `tokenByPetId[petIdHash]` tracks minted pet hashes. Attempting to mint a second token for the same pet reverts with `PetAlreadyMinted()`.
  - **Deadline Expiration:** Each voucher has a 15-minute expiration timestamp (`block.timestamp <= deadline`). Expired vouchers revert with `ClaimExpired()`.

### 2.4 EIP-191 Challenge-Response Wallet Binding
- **Objective:** Ensure user owns the private key of the wallet address being bound to the Keeper profile before any voucher is generated.
- **Enforcement:**
  - Backend issues an EIP-191 challenge string containing user UID, checksummed wallet address, chain ID 43113, and a 16-byte random hex nonce with a 10-minute expiration.
  - Verification via `ethers.verifyMessage` recovers the signer address.
  - Consumed nonce is atomically marked in Firestore to prevent replay.

---

## 3. Negative Testing & Security Test Suite Matrix

The automated security test suite was executed against the smart contract and backend services using the native Node test runner (`npx tsx --test`):

| Test Suite | Total Tests | Passed | Failed | Key Vectors Covered |
| :--- | :---: | :---: | :---: | :--- |
| `test/PawsAndPicketPassport.test.ts` | 4 | 4 | 0 | Soulbound reverts, approval blockers, voucher expiry, replay attacks, duplicate pet mints. |
| `test/walletClient.test.ts` | 7 | 7 | 0 | EIP-6963 discovery priority, Core fallback, EIP-191 signing, RPC rejection codes (4001). |
| `test/web3-reconciliation.test.ts` | 10 | 10 | 0 | Non-existent pet rejection, unminted pet rejection, idempotent reconciliation, conflict flagging without mutation, receipt tampering rejection. |
| `test/web3-metadata-canonical.test.ts` | 9 | 9 | 0 | Production origin enforcement, privacy boundary for unminted pet portraits, canonical metadata URI alignment. |
| `test/web3-e2e-matrix.test.ts` | 6 | 6 | 0 | Ineligible pet rejection (Score < 80, Bond < 100), cryptographic voucher validation, full lifecycle verification. |
| **TOTAL** | **36** | **36** | **0** | **100% PASS RATE** |

---

## 4. Security Recommendations for Future Phases

1. **IPFS Decentralization:** Currently running in Mode B (Server-Canonical metadata with Cloudflare tunnel / production domain). Before mainnet launch, activate Mode A (Pinata 2-stage IPFS pinning) so token metadata is decentralized and pinned permanently on IPFS.
2. **Authorized Domains in Firebase Auth:** For full multi-device web access with Google Sign-In, add production hosting domains to Firebase Console > Authentication > Settings > Authorized Domains.
3. **P2P Adoption Transition:** When enabling Phase 2 player-to-player adoptions, activate the bilateral adoption escrow functions (`createAdoptionOffer`, `acceptAdoption`) with appropriate timelocks and bond requirements.
