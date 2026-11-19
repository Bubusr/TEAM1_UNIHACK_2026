# Paws & Picket — Member 02 + Member 03 Integration Guide & Architecture

## 1. Overview & Milestone Status

- **Smart Contract:** `PawsAndPicketPassport.sol` deployed on Avalanche Fuji testnet at `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31` (Chain ID `43113`).
- **Token #1 (Pip):** Successfully minted on Avalanche Fuji. TxHash: `0xbf87e4929ea7426ecabd643176895c296d5fbfc8f17771b24bde6aedca2c415d`.
- **Consent Gate & Storage:** Fully decoupled from `pets.memories`, using a dedicated `ipfs_consents` table (PostgreSQL) and `ipfsConsents` collection (Firestore).
- **Pinata Mode A:** Hardened with 15s timeout, exponential backoff (HTTP 502/503/504), secret redaction, CID validation, and two-stage CID caching.
- **Verification:** 135/135 tests passing (`npm test`), 0 TypeScript errors (`tsc --noEmit`), production Vite build passing.

---

## 2. Avalanche Fuji Smart Contract & EIP-712 Specification

- **Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`
- **Chain ID:** `43113` (Avalanche Fuji Testnet)
- **RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`
- **Explorer:** `https://testnet.snowtrace.io`
- **Trusted Signer Address:** `0x401D396ee9796e95c102bA16e456b3eA7eA63e4B`

### EIP-712 Domain & Type Definition
```typescript
const domain = {
  name: 'PawsAndPicketPassport',
  version: '1',
  chainId: 43113,
  verifyingContract: '0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31',
};

const types = {
  MintClaim: [
    { name: 'recipient', type: 'address' },
    { name: 'petIdHash', type: 'bytes32' },
    { name: 'metadataUriHash', type: 'bytes32' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};
```

---

## 3. Member 02 — Database & IPFS Consent Storage

### PostgreSQL Entity (`ipfs_consents`)
```sql
CREATE TABLE ipfs_consents (
  id SERIAL PRIMARY KEY,
  consent_uid TEXT NOT NULL UNIQUE,
  pet_uid TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_uid TEXT,
  wallet_address TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  disclosure_reference TEXT NOT NULL,
  disclosures JSONB NOT NULL,
  consentedAt TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'granted',
  revoked_at TIMESTAMP,
  revoked_by_user_id INTEGER,
  revocation_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enforces exactly one active consent per pet & version; permits re-consent after revocation
CREATE UNIQUE INDEX ipfs_consents_active_pet_version_unique
  ON ipfs_consents (pet_uid, consent_version)
  WHERE status IN ('granted', 'minted');
```

### Firestore Collection (`ipfsConsents`)
- **Document Key:** `${petUid}_${consentVersion}` (e.g. `pet-pip-001_1.0`).
- **Audit Trail:** Prior states archived into `auditHistory: [...]` array on revocation or re-consent.
- **Identity Binding:** Binds `petUid`, `userId`, `userUid`, and `walletAddress`.
- **Immutability:** Once minted (`status === 'minted'`), consent cannot be revoked or modified.

---

## 4. Member 03 — Backend IPFS Consent Gate & Pinata Pipeline

### Execution Flow (`POST /api/web3/mint-claim`)
1. **Authentication:** Validates Bearer token via `requireAuth` $\to$ resolves internal `user.id`.
2. **Ownership Check:** Verifies caller owns pet (`pet.currentOwnerId === user.id`).
3. **Wallet Resolution:** Resolves database linked wallet (`getLinkedWallet`).
4. **Eligibility & Mint Status:** Validates AI Score $\ge 80$, Bond XP $\ge 100$, `mintStatus !== 'minted'`.
5. **Explicit Consent:** Validates `publicConsent.accepted === true`.
6. **Version Catalog:** Validates `consentVersion` in `AUTHORITATIVE_IPFS_DISCLOSURES` (`"1.0"`).
7. **Persistence:** Saves consent via `recordIpfsConsent`. (Aborts with HTTP 500 on failure; zero Pinata calls).
8. **Verification:** Validates consent via `hasValidIpfsConsent`. (Aborts with HTTP 403 on failure; zero Pinata calls).
9. **Pinata Upload:**
   - Image upload (`/pinning/pinFileToIPFS`) $\to$ caches `imageCid`.
   - Metadata JSON upload (`/pinning/pinJSONToIPFS`) embedding `ipfs://${imageCid}`.
   - On retry, skips image upload if `imageCid` was already cached.
10. **Voucher Issuance:** Constructs and signs EIP-712 voucher $\to$ saves to `mintClaims`.

---

## 5. Member 01 — Frontend Integration Contract

### API Route: `POST /api/web3/mint-claim`
**Request Payload:**
```json
{
  "petUid": "pet-pip-001",
  "publicConsent": {
    "accepted": true,
    "consentVersion": "1.0"
  }
}
```
*Legacy alias accepted: `{ "petUid": "...", "consentToPublicIpfs": true, "consentVersion": "1.0" }`*

**Success Response (`200 OK`):**
```json
{
  "chainId": 43113,
  "contractAddress": "0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31",
  "claim": {
    "recipient": "0xC05DE09a4Af5eDa0B5E191A1F569A787eE5aa889",
    "petIdHash": "0x51775e30...fe4e9cd8",
    "metadataUri": "ipfs://bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644",
    "nonce": "15340927891234567890",
    "deadline": 1795055100,
    "signature": "0x41f33ba7...201b"
  }
}
```

**Consent Error Responses:**
- `400 Bad Request`: `{"error": "Explicit user consent is required...", "code": "CONSENT_REQUIRED", "supportedVersions": ["1.0"]}`
- `400 Bad Request`: `{"error": "Unsupported consent version...", "code": "UNSUPPORTED_CONSENT_VERSION"}`
- `500 Internal Server Error`: `{"error": "Failed to persist consent audit record...", "code": "CONSENT_PERSISTENCE_FAILED"}`

---

## 6. Production & Deployment Reference

### Environment Variables
| Variable | Scope | Description |
| :--- | :--- | :--- |
| `PET_PASSPORT_CONTRACT_ADDRESS` | Server & Client | `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31` |
| `AVALANCHE_CHAIN_ID` | Server & Client | `43113` |
| `AVALANCHE_FUJI_RPC_URL` | Server | `https://api.avax-test.network/ext/bc/C/rpc` |
| `TRUSTED_SIGNER_PRIVATE_KEY` | Server ONLY | Signer private key (Never expose in frontend) |
| `METADATA_STORAGE_PROVIDER` | Server | `pinata` (Production IPFS) or `server` |
| `METADATA_STORAGE_API_KEY` | Server ONLY | Pinata JWT / API Key |
| `APP_URL` | Server | Canonical HTTPS production domain |

### Local Testing & Build
```bash
npm test        # Runs all 135 unit, integration, and E2E tests
npm run lint    # Runs strict TypeScript typecheck (tsc --noEmit)
npm run build   # Builds production client bundle via Vite
```
