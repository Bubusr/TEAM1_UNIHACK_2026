# WEB3 COMPREHENSIVE TEST REPORT & VERIFICATION MATRIX

**Author:** Member 03 – Blockchain & Web3 Integration Engineer  
**Date:** November 19, 2026  
**Branch:** `mem02-mem03`  
**Overall Status:** **27 / 27 WEB3 TESTS PASS — 88 / 88 WORKSPACE TESTS PASS (0 FAILURES)**

---

## 1. Automated Web3 Test Suites

| Test Suite File | Focus Area | Pass | Fail | Duration |
| :--- | :--- | :---: | :---: | :---: |
| `test/PawsAndPicketPassport.test.ts` | Hardhat ERC-721 + EIP-712 Contract Engine | 4 | 0 | 1,991 ms |
| `test/walletClient.test.ts` | EIP-6963 Core Wallet Discovery & RPC Handling | 7 | 0 | 168 ms |
| `test/web3-reconciliation.test.ts` | Firestore Reconciliation, Mint Log Parsing, Auth | 10 | 0 | 21,393 ms |
| `test/web3-e2e-matrix.test.ts` | 7-Scenario End-to-End Mint Lifecycle Matrix | 6 | 0 | 7,051 ms |
| **Total Web3 Test Suite** | | **27** | **0** | **~30.6 s** |

---

## 2. Hardhat Smart Contract Verification Matrix

Executed via local Hardhat simulated environment (`chainId: 31337`) with Cancun EVM target and Cancun/EIP-712 support:

1. **Claim Minting:** Mints Pet Passport with valid EIP-712 claim and records immutable original discoverer address.
2. **Event Emission & URI:** Emits `PetMinted(tokenId, petIdHash, discoverer, metadataUri, nonce)` and indexes `tokenByPetId`.
3. **Rejection Safeguards:**
   - Invalid signature recovered -> reverts `InvalidSignature()`.
   - Wrong caller (`msg.sender != recipient`) -> reverts `InvalidRecipient()`.
   - Expired claim (`block.timestamp > deadline`) -> reverts `ClaimExpired()`.
   - Reused nonce (`usedNonces[nonce] == true`) -> reverts `NonceAlreadyUsed()`.
   - Duplicate pet mint (`tokenByPetId[petIdHash] != 0`) -> reverts `PetAlreadyMinted()`.
4. **Soulbound Restrictions:**
   - Direct transfer (`transferFrom`, `safeTransferFrom`) reverts `DirectTransferBlocked()`.
   - Token approval (`approve`, `setApprovalForAll`) reverts `DirectTransferBlocked()`.
   - Adoption endpoints (`createAdoptionOffer`, `acceptAdoption`) revert `AdoptionTransfersDisabled()`.

---

## 3. Avalanche Fuji RPC Live Verification

Queried via live JSON-RPC connection to Avalanche Fuji C-Chain (`https://api.avax-test.network/ext/bc/C/rpc`):

- **Chain ID:** `43113`
- **Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`
- **Bytecode Verified:** Present (`16,776 hex chars` / `8,387 bytes`)
- **ERC-721 Interface:** `true`
- **ERC-721 Metadata Interface:** `true`
- **EIP-712 Domain Name:** `PawsAndPicketPassport`
- **EIP-712 Version:** `1`
- **EIP-712 Verifying Contract:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`
- **On-Chain Claim Signer:** `0x2B237fF449D21ECd304407d98cAAA379290747D5`
- **Local Signer Match:** Confirmed identical to `new ethers.Wallet(TRUSTED_SIGNER_PRIVATE_KEY).address`.
- **Mint Status:** 0 tokens currently minted on-chain; ready for token #1.

---

## 4. Browser Wallet Discovery & Authentication Matrix

Verified in `test/walletClient.test.ts` and `src/server/walletAuth.ts`:

- **EIP-6963 Core Wallet Prioritization:** Core Extension detected via `rdns: "com.avalabs.core"` and prioritized over generic injected wallets.
- **Injected Fallbacks:** Seamless fallback to `window.avalanche` or `window.ethereum`.
- **EIP-191 Authentication Challenge:** Nonce issued by server, signed with `personal_sign`, validated server-side via `ethers.verifyMessage`.
- **Security & Replay Guard:** Nonces single-use (`usedAt`), 10-minute expiry, and rejected with 409 if wallet is bound to another keeper.
- **Error Handling:** Standardized `WalletRpcError` codes for user cancellation (`4001`), pending prompts (`-32002`), and unsupported methods (`-32601`).

---

## 5. Full Workspace Regression Status

- `test/server.test.ts`: **19 / 19 PASS**
- `test/regression-defects.test.ts`: **18 / 18 PASS**
- `test/camera-experience.test.ts`: **10 / 10 PASS**
- `test/firestore-duplicate-protection.test.ts`: **14 / 14 PASS**
- `test/PawsAndPicketPassport.test.ts`: **4 / 4 PASS**
- `test/walletClient.test.ts`: **7 / 7 PASS**
- `test/web3-reconciliation.test.ts`: **10 / 10 PASS**
- `test/web3-e2e-matrix.test.ts`: **6 / 6 PASS**

**Grand Total:** **88 / 88 TESTS PASSING (0 FAILURES, 0 REGRESSIONS)**
