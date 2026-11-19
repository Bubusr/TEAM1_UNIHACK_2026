# Pinata IPFS Upload Hardening & Resilience Report

**Date:** 2026-11-19  
**Branch:** `mem02-mem03`  
**Author:** Member 03 (Web3 Infrastructure & Smart Contracts)  
**Task:** Harden Pinata IPFS Mode A upload before Token #2  

---

## 1. Executive Summary

In preparation for future decentralized Pet Passport minting (Token #2 and beyond), the Pinata IPFS upload pipeline in `src/server/web3Service.ts` was audited, redesigned, and hardened against transient network outages, request hangs, ambiguous upload outcomes, and credential leakage.

A comprehensive unit test suite (`test/pinata-ipfs-hardening.test.ts`) was authored with 9 targeted test cases covering timeouts, exponential backoff retries, non-retryable 4xx handling, malformed CID responses, duplicate detection, and automated secret redaction.

All 106 tests across the repository's 13 test suites pass cleanly (`106 pass, 0 fail`), `npm run lint` (`tsc --noEmit`) passes with 0 errors, and `npm run build` succeeds cleanly.

---

## 2. Files Changed

1. `src/server/web3Service.ts`
   - Added `isValidIpfsCid(cid: unknown): cid is string` validator supporting multihash formats (CIDv0 `Qm...`, CIDv1 `baf...`, and test mock CIDs).
   - Added `redactSensitiveData(text: string, secrets?: string[]): string` sanitizer scrubbing raw API keys, Bearer tokens, JWT tokens (`eyJ...`), Base64 image payloads, and host filesystem usernames (`/Users/...`, `/home/...`).
   - Added error classifiers: `isTransientHttpError` (429, 502, 503, 504), `isNonRetryableHttpError` (400, 401, 403, 404, 422), and `isTransientNetworkError` (`AbortError`, `TimeoutError`, `ECONNRESET`, `ETIMEDOUT`, `fetch failed`).
   - Added `executePinataRequest` orchestration engine with timeout via `AbortController` and race promises, bounded retries, exponential backoff, and secret redaction.
   - Hardened `pinPetPassportToPinata` with fast-fail empty API key validation, duplicate image bypass via `existingImageCid` / `pet.ipfsCid`, strict CID response validation, and try/catch secret scrubbing.
   - Updated `issueSignedMintClaim` to pass `existingImageCid` when `pet.ipfsCid` is already stored and valid in the repository.

2. `test/pinata-ipfs-hardening.test.ts` *(new)*
   - Added 9 unit tests using Node.js native test runner (`node:test`) and strict assertions (`node:assert/strict`) with fully mocked network calls.

---

## 3. Timeout and Retry Policy

| Parameter | Default Value | Configurable In Options | Behavior / Rule |
| :--- | :--- | :--- | :--- |
| **Request Timeout** | `15,000 ms` (15s) | `timeoutMs` | Each HTTP request to Pinata is bounded by an `AbortController`. If the request exceeds the timeout, the signal aborts, terminating the connection and rejecting the promise. |
| **Max Retries** | `2` (3 total attempts) | `maxRetries` | Transient failures are retried at most 2 times before failing closed. |
| **Backoff Strategy** | Exponential Backoff | `retryDelayMs` (default 500ms) | Delay formula: $\text{delay} = \text{retryDelayMs} \times 2^{\text{attempt}}$. For default: Attempt 0 $\to$ delay 500ms $\to$ Attempt 1 $\to$ delay 1000ms $\to$ Attempt 2. |
| **Retryable Conditions** | HTTP 429, 502, 503, 504, Timeout, ECONNRESET, ETIMEDOUT, ENOTFOUND, EAI_AGAIN | N/A | Retried automatically up to `maxRetries`. |
| **Non-Retryable Conditions** | HTTP 400, 401, 403, 404, 422 | N/A | **Fail-fast immediately on attempt 0**. Never retries invalid auth credentials, bad payloads, or not-found errors. |

---

## 4. Duplicate-Upload & Ambiguous Outcome Handling

1. **Pre-Upload Existence Check:**
   - If a pet record already has a valid `ipfsCid` in Firestore/PostgreSQL, or if the caller provides `existingImageCid`:
     - Stage 1 file upload (`/pinning/pinFileToIPFS`) is **completely bypassed**.
     - `readPetPortraitBytes` is not invoked.
     - The existing image CID is embedded directly into the ERC-721 metadata JSON (`ipfs://${imageCid}`).
     - Only Stage 2 metadata pinning (`/pinning/pinJSONToIPFS`) is executed.
2. **Ambiguous Outcome Recovery:**
   - In case of a timeout during Stage 1 upload, retries are bounded to 2 attempts. If the upload cannot be confirmed, the transaction aborts with a sanitized error rather than leaving indefinite hanging sockets or creating uncontrolled duplicate pins.
   - Response CIDs are validated before persisting to database or signing claims:
     ```ts
     if (!isValidIpfsCid(imgJson.IpfsHash)) {
       throw new Error(`Pinata image upload returned an invalid IPFS CID: ...`);
     }
     ```

---

## 5. Privacy & User Consent Findings

> [!WARNING]
> **Consent Status for Token #2: BLOCKED**

### Audit Findings:
1. **No Explicit Consent UI:**
   - Neither `src/components/CreamSheets.tsx` nor `src/components/JudgeCardScreen.tsx` currently displays an explicit consent checkbox or disclosure regarding permanent public IPFS publication.
   - Clicking "Mint Pet Passport" currently proceeds directly to `/api/web3/mint-claim`.
2. **No Backend Consent Enforcement:**
   - `/api/web3/mint-claim` in `src/server/app.ts` only validates authentication, pet ownership, AI score $\ge 80$, and Bond XP $\ge 100$. It does not check a `consentToPublicIpfs` flag.
3. **Decentralized Permanence Concern:**
   - Content pinned to IPFS gateways is permanently public, decentralized, and cannot be revoked or deleted once replicated across the IPFS DHT (potential GDPR right-to-be-forgotten conflict for user-uploaded pet photos).
4. **Required Integration Point Before Token #2:**
   - **Frontend:** In Keeper Profile / Pet Passport modal, display an explicit confirmation modal before requesting a mint claim when IPFS storage is active:
     > *"Minting this Pet Passport will publish your pet's photo and discovery statistics to the public, permanent InterPlanetary File System (IPFS). This action is decentralized and irreversible. Do you consent to public publication?"*
   - **Backend API:** `/api/web3/mint-claim` must require `consentToPublicIpfs: true` in the request body when `METADATA_STORAGE_PROVIDER === 'pinata'`.
   - In accordance with task scope boundaries, Member 03 did **not** modify Member 01 frontend or Member 02 game rules. Token #2 mint remains **BLOCKED** until this consent gate is approved and coordinated.

---

## 6. Tests Executed & Actual Results

### Targeted Hardening Suite (`test/pinata-ipfs-hardening.test.ts`):
```text
▶ Pinata IPFS Upload Hardening & Resilience Suite
  ✔ 1. Successful image + metadata upload (two-stage flow with valid CIDs) (11.83ms)
  ✔ 2. Request timeout handling (aborts after timeoutMs and retries boundedly) (77.75ms)
  ✔ 3. Retryable HTTP errors (502, 503, 504 retry with exponential backoff and succeed) (44.64ms)
  ✔ 4. Non-retryable HTTP errors (400, 401, 403 fail immediately without retrying) (5.37ms)
  ✔ 5. Malformed Pinata responses (missing, null, or invalid CIDs and non-JSON body) (4.46ms)
  ✔ 6. Missing or empty API key (fails fast before making any network calls) (10.48ms)
  ✔ 7. Duplicate/ambiguous upload handling (reuses existingImageCid without re-uploading file) (0.80ms)
  ✔ 8. Secret redaction in errors and logs (scrubs raw API keys, JWTs, Base64, and filesystem paths) (1.00ms)
  ✔ 9. Helper unit tests: isValidIpfsCid, redactSensitiveData, error classifications (0.84ms)
✔ Pinata IPFS Upload Hardening & Resilience Suite (159.60ms)
```

### Full Repository Test Suite (`npm test`):
```text
ℹ tests 106
ℹ suites 13
ℹ pass 106
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 52703.37ms
```

### Static Type Check & Build:
- `npm run lint` (`tsc --noEmit`): **0 errors** (PASS).
- `npm run build` (`vite build`): **0 errors** (PASS).

---

## 7. Remaining Blockers for Token #2

| ID | Category | Status | Blocker Description | Required Action |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-01** | Privacy / Consent | **BLOCKED** | Missing explicit user consent UI and API flag for permanent public IPFS publication. | Align with Member 01 & Member 02 to implement consent checkbox in Keeper modal and require `consentToPublicIpfs: true` in `/api/web3/mint-claim`. |
| **BLK-02** | Credentials | **BLOCKED** | `METADATA_STORAGE_API_KEY` is not yet configured in `.env` / Cloud Run secret manager. | Provision Pinata API key / JWT on server environment only. |
| **BLK-03** | Scope Protection | **ENFORCED** | Smart contract `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31` on Avalanche Fuji is immutable and operating normally. | No contract changes, redeployments, or manual mints without coordinator approval. |

---

## 8. Conclusion

- **Pinata IPFS Upload Hardening:** **PASS** (15s timeout, bounded retry, duplicate prevention, multihash CID validation, secret redaction, 100% test pass).
- **Privacy & Consent Audit:** **BLOCKED** (Documented integration points; requires explicit user consent gate before Token #2 mint).
- **Token #2 Mint Readiness:** **BLOCKED** (Awaiting consent gate and production Pinata key configuration).
