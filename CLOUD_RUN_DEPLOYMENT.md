# GOOGLE CLOUD RUN DEPLOYMENT GUIDE: PAWS & PICKET

**Author:** Member 03 – Blockchain & Web3 Integration Engineer  
**Date:** November 19, 2026  
**Application:** Paws & Picket  
**Branch:** `mem02-mem03`  
**Target Platform:** Google Cloud Run (Fully Managed Container Service)  
**Target Project:** `paws-local` (Project Number `213801959465`)  

---

## 1. Architecture Overview

Paws & Picket is packaged as a unified production container running the Node.js Express server on Google Cloud Run:
- **Client Frontend:** Built via Vite (`npm run build`) into `dist/`. Served as static files with SPA fallback (`app.get('*')`).
- **Backend API & Web3:** Native Express REST endpoints (`/api/*`), Web3 status, EIP-712 claim signing, Fuji mint receipt confirmation, and Firestore reconciliation.
- **Primary Database:** Google Cloud Firestore (using Application Default Credentials from Cloud Run's service account).
- **Static Pet Portraits:** High-resolution local starter animal portraits served from `/src/assets/images/`.
- **Health Checks:** Native `/api/health` and `/healthz` endpoints responding with HTTP 200 for Cloud Run liveness/readiness probes.

---

## 2. Container Specification

### Multi-Stage Production `Dockerfile`
A clean multi-stage `Dockerfile` has been created in the repository root:
1. **Stage 1 (`builder`):** Installs all dependencies and compiles the Vite frontend (`dist/`).
2. **Stage 2 (`runner`):** 
   - Base: `node:24-alpine` (lightweight, minimal attack surface).
   - Installs runtime dependencies only (`npm ci --omit=dev`).
   - Copies compiled `dist/` from builder.
   - Copies `src/` (including `src/assets/images/` and server code).
   - Sets `ENV NODE_ENV=production` and `ENV PORT=8080`.
   - Exposes port `8080` and binds to `0.0.0.0`.
   - Starts via `CMD ["node", "src/server/server.ts"]`.

### Build & Secret Exclusion (`.dockerignore`)
The `.dockerignore` file strictly excludes:
- `node_modules`
- `.git`
- `.env` and `.env.*` (Prevents leaking private keys and API credentials into image layers)
- `contracts/`, `artifacts/`, `cache/`
- Test files and logs

---

## 3. Deployment Reality & Cloud Run Billing Blocker

An automated probe was executed against Google Cloud APIs using verified Application Default Credentials (`/Users/apple/.config/gcloud/application_default_credentials.json`):

```json
GET https://cloudbilling.googleapis.com/v1/projects/paws-local/billingInfo
{
  "name": "projects/paws-local/billingInfo",
  "projectId": "paws-local",
  "billingAccountName": "",
  "billingEnabled": false
}
```

> [!WARNING]
> **Active Deployment Blocker:**  
> Project `paws-local` currently has **`billingEnabled: false`** (Spark free tier).  
> Google Cloud Run and Google Cloud Artifact Registry require linking a billing account or upgrading the Firebase project to the **Blaze (pay-as-you-go)** tier before container services can be deployed.  
> In compliance with strict instructions, billing was not modified or upgraded automatically.

---

## 4. Step-by-Step Deployment Instructions

Once billing is enabled on project `paws-local`, execute the following steps to deploy:

### Step 1: Link Billing Account
Visit Google Cloud Console or Firebase Console:
- [https://console.firebase.google.com/project/paws-local/usage/details](https://console.firebase.google.com/project/paws-local/usage/details)
- Click **Upgrade** to link your Cloud Billing account to `paws-local`.

### Step 2: Enable Required Google Cloud APIs
Run in terminal (or enable in Google Cloud Console):
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  --project=paws-local
```

### Step 3: Build & Deploy Container to Cloud Run
From the repository root:
```bash
# 1. Build client assets
npm run build

# 2. Deploy directly from source via Cloud Build & Cloud Run
gcloud run deploy paws-and-picket \
  --source . \
  --project paws-local \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,AVALANCHE_CHAIN_ID=43113,AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc,PET_PASSPORT_CONTRACT_ADDRESS=0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31" \
  --set-secrets "TRUSTED_SIGNER_PRIVATE_KEY=paws-trusted-signer:latest,GEMINI_API_KEY=paws-gemini-key:latest,GUEST_SESSION_SECRET=paws-session-secret:latest"
```

### Step 4: Configure `APP_URL` with the Deployed Origin
Cloud Run will output the service URL, for example:
`https://paws-and-picket-xxxxx-as.a.run.app`

Update the service configuration:
```bash
gcloud run services update paws-and-picket \
  --project paws-local \
  --region asia-southeast1 \
  --update-env-vars "APP_URL=https://paws-and-picket-xxxxx-as.a.run.app"
```

### Step 5: Verify Public Reachability & Run Smoke Tests
Execute the verification suite documented in `PRODUCTION_SMOKE_TEST.md`.
