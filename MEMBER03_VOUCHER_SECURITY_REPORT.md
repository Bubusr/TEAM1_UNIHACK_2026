# MEMBER 03 — PHASE C: MINT VOUCHER VALIDATION & SECURITY REPORT
**Network:** Avalanche Fuji C-Chain (Chain ID: `43113`)  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`  
**Security Status:** **VERIFIED & SECURE (10 / 10 CHECKS PASSED)**  
**Audit Timestamp:** 2026-11-19T09:16:00+07:00

---

## 1. Cryptographic Specification & EIP-712 Compatibility

### Domain Separator
The domain separator is identical between the Solidity smart contract and the Node.js backend:
```solidity
// PawsAndPicketPassport.sol (Line 18)
contract PawsAndPicketPassport is ERC721, ERC721URIStorage, Ownable, EIP712("PawsAndPicketPassport", "1")
```
Backend EIP-712 Domain:
```json
{
  "name": "PawsAndPicketPassport",
  "version": "1",
  "chainId": 43113,
  "verifyingContract": "0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31"
}
```

### Typehash Definition
- **Solidity Definition:**
  ```solidity
  bytes32 public constant MINT_CLAIM_TYPEHASH = keccak256(
    "MintClaim(address recipient,bytes32 petIdHash,bytes32 metadataUriHash,uint256 nonce,uint256 deadline)"
  );
  ```
- **Verified Typehash Value:**
  `0x849e8587db585218666b698bf43079939297f3a6bd4e8ee098d0af7dd4deaac1`
- **Field Ordering & Types:**
  1. `address recipient`: Checksummed EVM address of the verified Keeper wallet.
  2. `bytes32 petIdHash`: `keccak256(bytes(petUid))` linking the token to the authoritative pet document.
  3. `bytes32 metadataUriHash`: `keccak256(bytes(metadataUri))` binding the immutable or canonical metadata URL.
  4. `uint256 nonce`: Cryptographically random 128-bit unsigned integer (`crypto.randomBytes(16)`).
  5. `uint256 deadline`: Unix timestamp in seconds (`Date.now() / 1000 + 15 * 60`).

---

## 2. Negative Security Test Matrix

| ID | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | Discovery Score $< 80$ | Claim rejected with HTTP 400 | Rejects with message: *"Pet needs an AI score of 80+ to mint"* | **PASS** |
| **SEC-02** | Bond XP $< 100$ | Claim rejected with HTTP 400 | Rejects with message: *"Build 100 Bond XP through care, feeding, and play first"* | **PASS** |
| **SEC-03** | User with Unlinked Wallet | Claim rejected with HTTP 400 | Rejects with message: *"Link and verify your wallet in Keeper Profile before minting"* | **PASS** |
| **SEC-04** | Non-Owner Claim Attempt | Claim rejected with HTTP 400 | Rejects with message: *"Only the current pet owner can request a mint claim"* | **PASS** |
| **SEC-05** | Already Minted Pet | Claim rejected with HTTP 400 | Rejects with message: *"This pet has already been minted on-chain"* | **PASS** |
| **SEC-06** | Replayed Nonce On-Chain | Contract execution reverts | Reverts with custom error `NonceAlreadyUsed()` | **PASS** |
| **SEC-07** | Expired Claim Deadline | Contract execution reverts | Reverts with custom error `ClaimExpired()` | **PASS** |
| **SEC-08** | Duplicate Pet ID On-Chain | Contract execution reverts | Reverts with custom error `PetAlreadyMinted()` | **PASS** |
| **SEC-09** | Unauthorized Signer | Contract execution reverts | Reverts with custom error `InvalidSignature()` | **PASS** |
| **SEC-10** | Direct Secondary Transfer | Contract execution reverts | Reverts with custom error `DirectTransferBlocked()` (Soulbound) | **PASS** |

---

## 3. Authoritative Backend Enforcement

1. **Client-Supplied Eligibility Bypass Guard:**
   - The `/api/web3/mint-claim` endpoint ignores any score or bond XP values in the request payload.
   - Eligibility is recomputed authoritatively from Cloud Firestore via `computeMintEligibility(pet)` in `rewards.ts`.
2. **Single-Use Replay Protection:**
   - Each claim receives a unique 16-byte cryptographically secure nonce.
   - Once confirmed on-chain, the contract marks `usedNonces[nonce] = true`.
   - The contract rejects any subsequent transaction using the same nonce regardless of caller.
3. **Fail-Closed Origin Protection:**
   - The backend strictly enforces that `metadataUri` points to a verified canonical HTTPS domain (`APP_URL`).
   - If unconfigured, the endpoint fails closed (HTTP 503) rather than embedding `localhost` or broken origins.

---

## 4. Conclusion

The voucher generation and on-chain verification pipeline satisfies all security criteria for Phase C. The backend cannot be tricked into issuing vouchers for unbonded pets, unauthorized keepers, or forged origins.
