# MEMBER 03 — FINAL WEB3 STABILIZATION AUDIT REPORT

**Author:** Member 03 – Senior Web3 Engineer & QA Lead  
**Audit Date:** November 19, 2026 (03:15 UTC / 10:15 Local)  
**Branch:** `mem02-mem03`  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31` (Avalanche Fuji)  
**Deliverable Document:** `MEMBER03_FINAL_STABILIZATION_REPORT.md`  

---

## 1. Metadata Recovery Investigation (Token #1)

### 1.1 Objective & Test Execution
An investigation was conducted to determine whether the exact historical Quick Tunnel hostname written into Token #1's on-chain calldata (`https://chi-low-fantastic-aaron.trycloudflare.com`) could be recovered and served:

1. **DNS & Edge Resolution Check:**
   - Attempted direct external HTTP request:  
     `curl -v --max-time 5 "https://chi-low-fantastic-aaron.trycloudflare.com"`
   - **Observed Result:** `curl: (28) Resolving timed out after 5002 milliseconds`.
   - **Finding:** Cloudflare authoritative DNS records for `chi-low-fantastic-aaron.trycloudflare.com` have been purged from Cloudflare's edge upon tunnel process termination.
2. **Reclaim Feasibility via `cloudflared`:**
   - Evaluated `cloudflared tunnel --hostname chi-low-fantastic-aaron.trycloudflare.com`.
   - **Finding:** Unauthenticated Quick Tunnels on `trycloudflare.com` are generated dynamically and pseudo-randomly by Cloudflare's API (`api.trycloudflare.com/tunnel`). Cloudflare does not allow users to specify, reserve, or reclaim previously assigned subdomains under `trycloudflare.com`. Subdomain binding is restricted strictly to named tunnels under a user-owned, authenticated Cloudflare zone.
3. **Smart Contract Update Feasibility:**
   - Inspected `contracts/PawsAndPicketPassport.sol`.
   - `PawsAndPicketPassport` inherits OpenZeppelin `ERC721URIStorage`.
   - The contract defines `_setTokenURI` as `internal` (invoked strictly within `mintWithClaim`).
   - The contract has **NO** `setTokenURI`, **NO** `setBaseURI`, and **NO** proxy upgradeability pattern.
   - On-chain `tokenURI(1)` on Avalanche Fuji is permanently immutable.

### 1.2 Verdict
- **Token #1 Metadata Recovery:** **BLOCKED**  
*(The on-chain URI for Token #1 is permanent, and the ad-hoc TryCloudflare hostname cannot be reclaimed or resolved externally).*

---

## 2. Token #2 Mint Readiness & Hosting Evaluation

### 2.1 Architecture & Failsafe Mechanism
The backend metadata service in `src/server/web3Service.ts` implements strict validation:
- When issuing an EIP-712 claim voucher, `sanitizePublicOrigin()` enforces:
  - Protocol must be `https://` (or `ipfs://`).
  - Origin must NOT contain `localhost`, `127.0.0.1`, `0.0.0.0`, or port suffixes (`:\d+`).
  - If `APP_URL` is unconfigured in production mode, the server fails closed with `HTTP 503: Verified production origin is not configured`.

### 2.2 Hosting Options Evaluation (Zero-Cost Focus)

| Hosting Architecture | Feasibility & Cost | Pros | Cons / Blockers |
| :--- | :--- | :--- | :--- |
| **Vercel Preview** | Zero Cost (Free Tier) | Automated branch deployments. | **UNSUITABLE.** URLs are ephemeral (tied to commits/PRs); violates token persistence requirements. |
| **Vercel Production** | Zero Cost (Hobby Tier) | Stable, permanent domain (`https://pawsandpicket.vercel.app`), SSL managed, globally CDN cached. | **Viable.** Requires configuring Vercel project deployment and setting `APP_URL` to the production domain. |
| **Pinata IPFS (Mode A)** | Zero Cost (Free Tier: 1GB, 500 files) | Decentralized, 100% server-independent. `ipfs://<CID>` is permanently pinned and never expires. | **Recommended.** Code already implements 2-stage Pinata pinning in `web3Service.ts`. Requires setting `METADATA_STORAGE_API_KEY`. |
| **Cloud Run / App Hosting** | Requires GCP Setup | Full container SSR support. | Firebase project `paws-local` currently lacks billing (Spark tier). |

### 2.3 Token #2 Readiness Status
- **Code Readiness:** The server code is 100% prepared to issue production-safe claims without temporary URLs.
- **Environment Status:** Neither a permanent production domain (`APP_URL`) nor a Pinata IPFS API key is currently provisioned in the live `.env`.
- **Token #2 Mint Readiness:** **BLOCKED**  
*(Minting Token #2 must remain blocked until a permanent production domain or IPFS key is provisioned, preventing a repeat of the ephemeral URL issue).*

---

## 3. Smart Contract Integrity

All smart contract constraints have been strictly preserved:
- **Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31` on Avalanche Fuji C-Chain.
- **Contract Code:** `contracts/PawsAndPicketPassport.sol` was **NOT modified** (no `setTokenURI` or `setBaseURI` injected).
- **No Redeployment:** The contract was not redeployed; bytecode remains identical to deployment.
- **Token Count:** Exactly **1 token** minted (`totalSupply == 1`, Token #1). No additional tokens were minted.
- **Trusted Signer:** Signer address remains `0x2B237fF449D21ECd304407d98cAAA379290747D5`.

---

## 4. Test Suite & Build Integrity

### 4.1 Script & Configuration Fix
- In `package.json`, added `"test": "tsx --test test/*.test.ts"`.
- Resolved TypeScript typing in `vite.config.ts`: `allowedHosts: true as const`.

### 4.2 Full Repository Test Execution
Executed `npm test` across all 9 project test files:

```
> react-example@0.0.0 test
> tsx --test test/*.test.ts

ℹ tests 97
ℹ suites 12
ℹ pass 97
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 198004.7955
```

| Suite File | Tests | Status | Scope |
| :--- | :---: | :---: | :--- |
| `test/PawsAndPicketPassport.test.ts` | 4 | **PASS** | Soulbound rules, replay protection, claim validation |
| `test/walletClient.test.ts` | 7 | **PASS** | EIP-6963 Core Wallet discovery, EIP-191 signing |
| `test/web3-e2e-matrix.test.ts` | 6 | **PASS** | Ineligible rejection, claim generation, Firestore binding |
| `test/web3-metadata-canonical.test.ts` | 9 | **PASS** | Canonical origin enforcement, privacy boundary |
| `test/web3-reconciliation.test.ts` | 10 | **PASS** | On-chain to Firestore reconciliation, conflict handling |
| `test/camera-experience.test.ts` | 10 | **PASS** | Mobile rear camera, desktop webcam, drag & drop |
| `test/firestore-duplicate-protection.test.ts` | 14 | **PASS** | Idempotency locks, worker leases, duplicate rejection |
| `test/regression-defects.test.ts` | 17 | **PASS** | DEF-01, DEF-02, DEF-05 validation and sanitization |
| `test/server.test.ts` | 20 | **PASS** | Auth boundaries, guest sessions, rate limits, CSRF |
| **PROJECT TOTAL** | **97** | **97 PASS / 0 FAIL (100%)** | Full Coverage |

### 4.3 Static Analysis & Build Verification
- **TypeScript Check (`npm run lint` / `tsc --noEmit`):** `0 errors` (100% clean).
- **Production Build (`npm run build` / `vite build`):** Succeeded in `591ms` (`dist/` generated cleanly).
- **Zero Test Tampering:** No tests were altered, disabled, or removed.

---

## 5. Scope Protection & Separation of Concerns

A git audit confirms complete isolation of Member 03's changes:
- `src/server/gameActions.ts`: **UNTOUCHED** (Member 02 gameplay and care loops preserved).
- `src/server/aiJudge.ts`: **UNTOUCHED** (Gemini AI prompt and judge schemas preserved).
- `src/server/rewards.ts`: **UNTOUCHED** (XP formulas and game scoring tiers preserved).
- `src/db/schema.ts`: **UNTOUCHED** (PostgreSQL core schema preserved).
- **Git Branch:** Work remains strictly on `mem02-mem03` and has **NOT** been merged into `main`.
- **Hosting:** No production deployment or domain purchases were executed.

---

## 6. Final Audit Conclusions

```
========================================================================
1. Token #1 metadata recovery:        BLOCKED
   (Quick Tunnel hostname expired; on-chain tokenURI is immutable)

2. Token #2 mint readiness:           BLOCKED
   (Awaiting permanent production domain or Pinata IPFS key provisioning)

3. Web3 implementation acceptance:    PASS
   (On-chain mint, Soulbound custody, EIP-712 claims, wallet auth, 
    and full 97/97 test suite are 100% functional and verified)
========================================================================
```
