# MEMBER 03 FRONTEND INTEGRATION CONTRACT & HANDOFF
## Guide for Member 01 (Frontend / UI Lead)

This document provides the exact contract, API specifications, client methods, and state machine transitions for integrating Avalanche Fuji Web3 Pet Passport Minting into the Sanctuary and Passport UI.

---

## 1. Web3 Architecture Overview

```
[Keeper Sanctuary UI]
        │
        ├─ 1. Detect & Connect Core Wallet (EIP-6963 / window.avalanche)
        ├─ 2. Sign EIP-191 Nonce Challenge (POST /api/wallet/nonce -> verify)
        ├─ 3. Query Mint Eligibility (GET /api/pets/:petUid/mint-eligibility)
        │       (Server-authoritative: Score >= 80 & Bond XP >= 100)
        ├─ 4. Request EIP-712 Claim Voucher (POST /api/web3/mint-claim)
        ├─ 5. Submit On-Chain Tx (Core Wallet: mintWithClaim)
        ├─ 6. Confirm Receipt On Server (POST /api/web3/confirm-mint)
        └─ 7. Render Verified Passport Details & Snowtrace Link
```

---

## 2. Frontend State Machine

Member 01 should model the Passport modal / button using these 16 explicit states:

```
[WALLET_NOT_INSTALLED] ────────► [WALLET_DISCONNECTED]
                                        │
                                        ▼ (connectInjectedWallet)
                                 [WALLET_CONNECTED]
                                        │
                         (wrong chain?) ├──► [WRONG_NETWORK] ──► (ensureFujiNetwork)
                                        │
                                        ▼ (signChallengeMessage)
                                 [WALLET_AUTH_PENDING]
                                        │
                                        ▼ (POST /api/wallet/verify)
                                 [WALLET_AUTHENTICATED]
                                        │
                  (Score < 80 or XP < 100?) ├──► [PET_NOT_ELIGIBLE] (Care/Bond buttons)
                                        │
                                        ▼ (POST /api/web3/mint-claim)
                                 [CLAIM_ISSUING]
                                        │
                                        ▼
                                 [CLAIM_READY]
                                        │
                                        ▼ (executePassportMint)
                                 [TX_AWAITING_APPROVAL]
                                        │
                    (User rejected?)    ├──► [TX_FAILED] ──► (Retry)
                                        │
                                        ▼
                                 [TX_PENDING] (Show Fuji Snowtrace pending link)
                                        │
                                        ▼ (tx.wait())
                                 [TX_CONFIRMED]
                                        │
                                        ▼ (POST /api/web3/confirm-mint)
                                 [BACKEND_CONFIRMING]
                                        │
                                        ▼
                                 [PASSPORT_MINTED] ──► (Display Badge & Token ID)
                                        │
                         (ownership mismatch?) └──► [RECONCILIATION_REQUIRED]
```

---

## 3. Core API Endpoints Reference

### 3.1 Get Web3 System Status
- **Route:** `GET /api/web3/status`
- **Auth:** None (Public)
- **Response (200):**
```json
{
  "phase": 1,
  "chainId": 43113,
  "chainName": "Avalanche Fuji Testnet",
  "explorerBaseUrl": "https://testnet.snowtrace.io",
  "contractConfigured": true,
  "signerConfigured": true,
  "readyForMint": true,
  "contractAddress": "0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31",
  "metadataProvider": "server",
  "ipfsConfigured": false
}
```

### 3.2 Check Pet Mint Eligibility
- **Route:** `GET /api/pets/:petUid/mint-eligibility`
- **Auth:** `Bearer <token>` (Keeper session)
- **Response (200):**
```json
{
  "petUid": "pet-mochi-001",
  "eligible": true,
  "reasons": [],
  "current": { "score": 92, "bondXp": 120, "careCount": 5, "mintStatus": "unminted" },
  "requirements": { "minScore": 80, "minBondXp": 100, "fujiChainId": 43113 }
}
```
- **If Ineligible (200):** `eligible: false`, `reasons: ["Build 100 Bond XP through care first (current: 45/100)"]`.

### 3.3 Request Wallet Auth Nonce
- **Route:** `POST /api/wallet/nonce`
- **Auth:** `Bearer <token>`
- **Payload:** `{ "walletAddress": "0xYourWalletAddress" }`
- **Response (200):**
```json
{
  "nonce": "a7b3c4d5e6f7...",
  "walletAddress": "0xYourWalletAddress",
  "message": "Paws & Picket Keeper Wallet Verification\nAccount: keeper_uid\nWallet: 0x...\nChain ID: 43113\nNonce: a7b3...",
  "expiresAt": "2026-11-19T01:30:00.000Z"
}
```

### 3.4 Verify Wallet Signature
- **Route:** `POST /api/wallet/verify`
- **Auth:** `Bearer <token>`
- **Payload:** `{ "walletAddress": "0x...", "nonce": "...", "signature": "0x..." }`
- **Response (200):**
```json
{
  "wallet": {
    "address": "0x...",
    "chainId": 43113,
    "verifiedAt": "2026-11-19T01:20:00.000Z"
  }
}
```
- **Error (409):** `{ "error": "This wallet address is already linked to another Keeper account." }`

### 3.5 Issue Signed Mint Claim Voucher (EIP-712)
- **Route:** `POST /api/web3/mint-claim`
- **Auth:** `Bearer <token>`
- **Payload:** `{ "petUid": "pet-mochi-001" }`
- **Response (200):**
```json
{
  "chainId": 43113,
  "contractAddress": "0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31",
  "claim": {
    "recipient": "0xYourWalletAddress",
    "petIdHash": "0x1234...",
    "metadataUri": "https://domain.com/api/metadata/pet-mochi-001",
    "nonce": "9876543210...",
    "deadline": 1795000000,
    "signature": "0xabcdef..."
  }
}
```

### 3.6 Confirm Minted Transaction
- **Route:** `POST /api/web3/confirm-mint`
- **Auth:** `Bearer <token>`
- **Payload:** `{ "petUid": "pet-mochi-001", "txHash": "0x..." }`
- **Response (200):**
```json
{
  "confirmation": {
    "tokenId": "1",
    "txHash": "0x...",
    "onChainOwner": "0x..."
  },
  "state": { /* Updated Keeper sanctuary state */ }
}
```
- **Idempotency:** Calling again with the same `txHash` returns `{ "confirmation": { "alreadyConfirmed": true, "tokenId": "1" } }`.

### 3.7 Reconcile Pet Ownership
- **Route:** `POST /api/web3/reconcile/:petUid`
- **Auth:** `Bearer <token>`
- **Response (200):**
```json
{
  "result": {
    "reconciled": true,
    "inSync": true,
    "conflict": false,
    "onChainOwner": "0x..."
  },
  "state": { /* Updated state */ }
}
```

---

## 4. Reusable Frontend Client Functions

Member 01 can import directly from `src/lib/walletClient.ts`:

```typescript
import {
  inspectWalletProvider,       // Checks if Core Wallet or injected wallet is installed
  connectInjectedWallet,       // Requests eth_requestAccounts, returns { address, chainId }
  ensureFujiNetwork,           // Prompts wallet_switchEthereumChain or wallet_addEthereumChain (43113)
  signChallengeMessage,        // Runs personal_sign for wallet authentication
  executePassportMint,         // Executes mintWithClaim on contract with EIP-712 voucher
} from '../lib/walletClient.ts';
```

### Example Complete Mint Flow in UI
```typescript
// 1. Ensure Fuji network
await ensureFujiNetwork();

// 2. Request Claim from Backend
const { claim, contractAddress } = await api.post('/api/web3/mint-claim', { petUid });

// 3. Execute Transaction via Core Wallet
const { txHash, wait } = await executePassportMint(contractAddress, claim);

// 4. Await on-chain inclusion
const receipt = await wait();

// 5. Tell Backend to confirm receipt & update pet state
const { confirmation, state } = await api.post('/api/web3/confirm-mint', {
  petUid,
  txHash,
});
```
