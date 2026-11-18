# AVALANCHE FUJI DEPLOYMENT RECORD: PET PASSPORT CONTRACT

**Network:** Avalanche Fuji Testnet (C-Chain)  
**Chain ID:** `43113` (`0xa869`)  
**Currency:** AVAX  
**Contract Name:** `PawsAndPicketPassport`  
**Token Symbol:** `PAWS`  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`  
**Snowtrace Explorer:** [https://testnet.snowtrace.io/address/0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31](https://testnet.snowtrace.io/address/0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31)

---

## 1. On-Chain Verification Evidence (Live RPC Audit)

The contract was independently queried via Avalanche Fuji public JSON-RPC endpoint (`chainId: 43113`).

| Parameter | On-Chain Value | Verification Status |
| :--- | :--- | :---: |
| **Bytecode Status** | Deployed (`8,387 bytes`, `16,776 hex chars`) | **VERIFIED** |
| **Token Name** | `Paws & Picket Pet Passport` | **VERIFIED** |
| **Token Symbol** | `PAWS` | **VERIFIED** |
| **Contract Owner** | `0x2B237fF449D21ECd304407d98cAAA379290747D5` | **VERIFIED** |
| **Claim Signer** | `0x2B237fF449D21ECd304407d98cAAA379290747D5` | **VERIFIED** |
| **Local Signer Match** | Matches local `TRUSTED_SIGNER_PRIVATE_KEY` public address | **VERIFIED** |
| **ERC-721 Interface (`0x80ac58cd`)** | `true` | **VERIFIED** |
| **ERC-721 Metadata (`0x5b5e139f`)** | `true` | **VERIFIED** |
| **EIP-712 Domain Name** | `PawsAndPicketPassport` | **VERIFIED** |
| **EIP-712 Version** | `1` | **VERIFIED** |
| **EIP-712 Verifying Contract** | `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31` | **VERIFIED** |
| **Adoption Transfers** | `false` (Soulbound Phase 1 custody enforced) | **VERIFIED** |
| **Next Token ID** | `1` (Contract is fresh; 0 tokens minted to date) | **VERIFIED** |

---

## 2. EIP-712 Typed Data Specification

The smart contract verifies mint authorizations matching OpenZeppelin EIP-712 standard:

```solidity
bytes32 public constant MINT_CLAIM_TYPEHASH = keccak256(
    "MintClaim(address recipient,bytes32 petIdHash,bytes32 metadataUriHash,uint256 nonce,uint256 deadline)"
);
```

### Domain Separator
- **Name:** `PawsAndPicketPassport`
- **Version:** `1`
- **ChainId:** `43113`
- **VerifyingContract:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`

---

## 3. Soulbound Phase 1 Custody Enforcement

1. **Direct Transfers Blocked:** `_update()` overrides standard ERC-721 transfers. Any call to `transferFrom` or `safeTransferFrom` reverts with `DirectTransferBlocked()`.
2. **Approvals Blocked:** `approve()` and `setApprovalForAll()` unconditionally revert with `DirectTransferBlocked()`.
3. **Adoption Transfers Disabled:** `ADOPTION_TRANSFERS_ENABLED` is a constant `false`. Calling `createAdoptionOffer`, `cancelAdoptionOffer`, or `acceptAdoption` reverts with `AdoptionTransfersDisabled()`.

---

## 4. Current Operational Status

- **Status:** **OPERATIONAL & READY FOR FIRST MINT**
- **Contract Redeployment Required:** **NO** (Existing deployment matches all specifications).
- **Backend ABI Compatibility:** 100% compatible with `PAWS_PASSPORT_ABI` in `src/server/web3Service.ts`.
