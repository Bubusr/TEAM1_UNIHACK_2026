# PRODUCTION ENVIRONMENT CONFIGURATION CHECKLIST

**Author:** Member 03 – Blockchain & Web3 Integration Engineer  
**Date:** November 19, 2026  
**Application:** Paws & Picket  
**Target Host:** Google Cloud Run  

---

## 1. Environment Variable Audit & Security Classification

| Variable Name | Required / Optional | Sensitivity Level | Local Status | Production Secret Storage Recommendation | Purpose |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `APP_URL` | **REQUIRED** | Public Config | *Unset (Fail-Closed)* | Cloud Run Environment Variable | Canonical HTTPS origin for metadata and portrait URLs. |
| `GEMINI_API_KEY` | **REQUIRED** | **CONFIDENTIAL** | Configured | Google Cloud Secret Manager | Authenticates server-side AI Judge photo evaluation. |
| `AVALANCHE_FUJI_RPC_URL` | **REQUIRED** | Public Config | Configured | Cloud Run Environment Variable | Avalanche Fuji C-Chain JSON-RPC endpoint. |
| `AVALANCHE_CHAIN_ID` | **REQUIRED** | Public Config | Configured (`43113`) | Cloud Run Environment Variable | Target EVM Chain ID (`43113`). |
| `TRUSTED_SIGNER_PRIVATE_KEY` | **REQUIRED** | **CRITICAL SECRET** | Configured | Google Cloud Secret Manager | Signs EIP-712 Pet Passport claim vouchers. |
| `PET_PASSPORT_CONTRACT_ADDRESS` | **REQUIRED** | Public Config | Configured (`0x2aA...`) | Cloud Run Environment Variable | Deployed ERC-721 contract address on Fuji. |
| `GUEST_SESSION_SECRET` | **REQUIRED** | **CONFIDENTIAL** | Configured | Google Cloud Secret Manager | HMAC secret signing guest session cookies. |
| `NODE_ENV` | **REQUIRED** | Public Config | *Set in Dockerfile* | Hardcoded `production` in container | Enables production routing, caching, and guards. |
| `PORT` | **REQUIRED** | Public Config | *Auto-Injected* | Cloud Run automatic injection | Default container port `8080`. |
| `DATABASE_URL` | Optional | Confidential | *Unset* | Google Cloud Secret Manager | PostgreSQL fallback (Firestore is primary). |
| `METADATA_STORAGE_PROVIDER` | Optional | Public Config | *Unset (default server)* | Cloud Run Environment Variable | `server` (Mode B) or `pinata` (Mode A). |
| `METADATA_STORAGE_API_KEY` | Optional | **CONFIDENTIAL** | *Unset* | Google Cloud Secret Manager | Pinata JWT for dual-stage IPFS pinning. |

---

## 2. Strict Security & Non-Disclosure Rules

1. **No Secrets in Dockerfile:** The `Dockerfile` must never contain hardcoded keys, passwords, or build-time arguments containing secrets.
2. **No Secrets in Source Control:** `.gitignore` and `.dockerignore` strictly exclude `.env`, `.env.local`, and credential files.
3. **No Private Keys in Client Bundles:** Only public configuration (`VITE_*`) may be accessed by the browser. `TRUSTED_SIGNER_PRIVATE_KEY` is exclusively consumed by server-side `src/server/web3Service.ts`.
4. **Google Cloud Secret Manager Integration:** On Cloud Run, configure sensitive secrets using `--set-secrets` rather than plain `--set-env-vars`, mounting them securely at runtime.
