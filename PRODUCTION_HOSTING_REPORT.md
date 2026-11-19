# PRODUCTION HOSTING & PUBLIC METADATA VERIFICATION REPORT

**Author:** Member 03 – Blockchain & Web3 Integration Engineer  
**Date:** November 19, 2026  
**Application:** Paws & Picket  
**Branch:** `mem02-mem03`  
**Network:** Avalanche Fuji Testnet (`43113`)  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`  

---

## 1. Hosting Provider Identification

Following a full inspection of the repository configuration files (`.firebaserc`, `firebase.json`, `package.json`, `src/config/firebase-applet-config.json`, and git history):

1. **Configured Platform:** **Google Firebase**  
   - Configuration exists via `.firebaserc` and `src/config/firebase-applet-config.json`.
   - Authentication is configured with Google Sign-In redirect URI `https://paws-local.firebaseapp.com/__/auth/handler`.
   - Primary persistence is configured via Google Cloud Firestore (`adminDb` in `src/server/firebaseAdmin.ts`).
2. **Project Provenance:** **Google AI Studio Applet / Cloud Run**  
   - Documented in `README.md` (`https://ai.studio/apps/65993069-6b57-4eb3-ae17-971a699607e3`).
   - Host detection logic in `src/lib/walletClient.ts` explicitly accounts for AI Studio preview origins (`ais-dev-*.run.app`, `ais-pre-*.run.app`, and `*.run.app`).
3. **Alternative Providers:**  
   - Zero configuration files found for Vercel (`vercel.json`), Google Cloud App Engine (`app.yaml`), Cloud Build (`cloudbuild.yaml`), Docker (`Dockerfile`), Railway, Render, Fly.io, or Netlify.

---

## 2. Actual Project Identifier

- **Firebase Project ID:** `paws-local`
- **Google Cloud Project Number:** `213801959465`
- **Firebase Web App ID:** `1:213801959465:web:a72a8122fba248a7e71c38`
- **Authenticated Firebase Account:** `pc.thuhuong@gmail.com` (verified via `firebase-tools login:list`)
- **Active Subscription Plan:** **Spark (Free Tier)** (confirmed via API probe)

---

## 3. Public Domain Resolution

Two public domain candidates were evaluated:

| Domain | Type | Status | Evidence |
| :--- | :--- | :---: | :--- |
| `pawsandpicket.app` | Custom Domain | **UNROUTED (NXDOMAIN)** | `nslookup` fails with `NXDOMAIN` |
| `paws-local.web.app` | Default Firebase Hosting | **RESOLVES (Google Edge)** | Resolves to `199.36.158.100` |
| `paws-local.firebaseapp.com` | Default Firebase Auth/App | **RESOLVES (Google Edge)** | Resolves to `199.36.158.100` |

---

## 4. DNS Result

### Custom Domain (`pawsandpicket.app`)
```bash
$ nslookup pawsandpicket.app
Server:		192.168.1.1
Address:	192.168.1.1#53
** server can't find pawsandpicket.app: NXDOMAIN
```

### Hosting Provider Domain (`paws-local.web.app`)
```bash
$ nslookup paws-local.web.app
Server:		192.168.1.1
Address:	192.168.1.1#53

Non-authoritative answer:
Name:	paws-local.web.app
Address: 199.36.158.100
```

---

## 5. TLS Verification

### Custom Domain (`https://pawsandpicket.app`)
- **Connection Result:** Failed (`curl: (6) Could not resolve host`).

### Hosting Provider Domain (`https://paws-local.web.app`)
- **TLS Version:** TLS 1.3 (`AEAD-CHACHA20-POLY1305-SHA256`)
- **Certificate Authority:** Google Trust Services (`CN=WR3`)
- **Certificate Subject:** `CN=web.app`, SAN `*.web.app`
- **Validity Window:** October 27, 2026 to January 25, 2027
- **Verification Status:** **TLS HANDSHAKE SUCCESSFUL**

---

## 6. Deployment Status & Deployed Commit

- **Current Deployment Status:** **NOT DEPLOYED (404 Site Not Found)**
- **HTTP Probe Result:**
```http
HTTP/2 404
content-type: text/html; charset=utf-8
cache-control: max-age=0

<!doctype html><html><head><title>Site Not Found</title>...
```

### Technical Root Cause of Deployment Blocker
1. **Express Server Architecture:** Paws & Picket backend is a full Node.js / Express application (`src/server/server.ts`) hosting dynamic API endpoints (`/api/metadata/:petUid`, `/api/pets/:petUid/portrait`, `/api/web3/mint-claim`).
2. **Missing Firebase Hosting Config:** `firebase.json` only contains `auth` and `firestore` rules; it has no `hosting` section configured.
3. **Billing Tier Limitation (Spark Plan):** Firebase Hosting cannot run server-side Node.js code or Cloud Functions on the free Spark plan. Running `firebase apphosting:backends:list` or `functions:list` confirms:
   ```
   Error: Your project paws-local must be on the Blaze (pay-as-you-go) plan to complete this command.
   ```
4. **Current Application Commit:** Commit `e7daaa3` exists strictly in the local git repository on branch `mem02-mem03` and has not been deployed to any public hosting environment.

---

## 7. Public Metadata URL Specification

- **Endpoint Format:** `<CANONICAL_ORIGIN>/api/metadata/:petUid`
- **Dynamic Origin Resolution Strategy:**
  - In production, `getCanonicalOrigin()` strictly reads `process.env.APP_URL`.
  - It validates that the URL starts with `https://` and does not contain `localhost`, `127.0.0.1`, `0.0.0.0`, or port numbers.
  - **Fail-Safe Mechanism:** If `APP_URL` is unset or blank in production, `getCanonicalOrigin()` returns `null`, and `issueSignedMintClaim()` / `GET /api/metadata/:petUid` fail safely with **HTTP 503**, preventing the issuance of on-chain vouchers with broken or unverified URLs.
- **Candidate Production URLs:**
  - Once deployed on custom domain: `https://pawsandpicket.app/api/metadata/:petUid`
  - Once deployed on Firebase/Cloud Run: `https://paws-local.web.app/api/metadata/:petUid`

---

## 8. Public Portrait URL & Privacy Boundaries

- **Endpoint Format:** `<CANONICAL_ORIGIN>/api/pets/:petUid/portrait`
- **Binary Image Delivery:** Streams raw binary bytes (`image/jpeg`, 510,996 bytes) with `Cache-Control: public, max-age=86400, immutable`.
- **Zero Authentication Header:** Accessible to external NFT wallets, explorers, and marketplaces without cookies or Bearer tokens.
- **Privacy Enforcement (`isPetPubliclyAccessible`):**
  - **Accessible Pets:**
    1. Pets already minted on Avalanche Fuji (`mintStatus === 'minted'`).
    2. Pets with pending mint transactions (`mintStatus === 'pending'`).
    3. Pets meeting server-authoritative Pet Passport eligibility (`discoveryScore >= 80 && bondXp >= 100`).
  - **Inaccessible Pets (Privacy Shield):**
    - Unminted pets that have not completed bonding or scored < 80 return **HTTP 404**, preventing unauthenticated scraping of private user photos.

---

## 9. Independent HTTP Test Results

| Target Endpoint | Environment | Result | Status Code | Details |
| :--- | :--- | :---: | :---: | :--- |
| `https://pawsandpicket.app` | Public Internet | **FAILED** | `NXDOMAIN` | Unregistered custom domain |
| `https://paws-local.web.app` | Public Internet | **404** | `HTTP 404` | Firebase default domain active, site not deployed |
| `GET /api/metadata/:petUid` (Sunny) | Local Express (Test Origin) | **PASS** | `HTTP 200` | Returns valid ERC-721 JSON with canonical HTTPS image |
| `GET /api/pets/:petUid/portrait` | Local Express (Eligible) | **PASS** | `HTTP 200` | Streams 510,996 bytes binary `image/jpeg` |
| `GET /api/pets/:petUid/portrait` | Local Express (Unpublished) | **PASS** | `HTTP 404` | Private photo protected from public scrapers |
| `POST /api/web3/mint-claim` | Local Express (Production Unset) | **PASS** | `HTTP 503` | Fails safely when `APP_URL` is unconfigured |

---

## 10. Outstanding Manual Configuration & Cloud Run Deployment Path

### Google Cloud Billing API Verification
An automated query to the Google Cloud Billing API (`https://cloudbilling.googleapis.com/v1/projects/paws-local/billingInfo`) verified:
```json
{
  "name": "projects/paws-local/billingInfo",
  "projectId": "paws-local",
  "billingAccountName": "",
  "billingEnabled": false
}
```
Project `paws-local` has **`billingEnabled: false`**. Google Cloud Run, Artifact Registry, and Cloud Build require an active billing account.

### Deployment Assets Created
1. `Dockerfile`: Optimized multi-stage build (Node 24 Alpine, `PORT=8080`, native strip-types).
2. `.dockerignore`: Strictly excludes `.env`, secrets, contracts, and test files.
3. Health check endpoints: `/api/health` and `/healthz` mounted in `src/server/app.ts`.
4. Dedicated deployment guides:
   - `CLOUD_RUN_DEPLOYMENT.md`: Step-by-step gcloud and console instructions.
   - `PRODUCTION_SMOKE_TEST.md`: 12-point automated verification script.
   - `PRODUCTION_ENVIRONMENT_CHECKLIST.md`: Secret management and environment variable audit.

### Exact Manual Steps to Deploy
1. **Link Billing Account:** Enable billing on `paws-local` at [https://console.firebase.google.com/project/paws-local/usage/details](https://console.firebase.google.com/project/paws-local/usage/details).
2. **Deploy to Cloud Run:** Run `gcloud run deploy paws-and-picket --source . --project paws-local --region asia-southeast1 --allow-unauthenticated` (detailed command in `CLOUD_RUN_DEPLOYMENT.md`).
3. **Configure APP_URL:** Update `APP_URL` with the generated `https://<service-url>.run.app`.
4. **Execute Smoke Tests:** Verify live connectivity with `PRODUCTION_SMOKE_TEST.md` before requesting mint approval.
