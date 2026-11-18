# METADATA STORAGE & TOKEN URI SPECIFICATION REPORT

**Author:** Member 03 – Blockchain & Web3 Integration Engineer  
**Date:** November 19, 2026  
**Application:** Paws & Picket  
**Network:** Avalanche Fuji Testnet (43113)  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`  
**Canonical Public Origin:** `https://pawsandpicket.app`  

---

## 1. Active Metadata Mode: Mode B (Server Canonical Metadata)

### Current Configuration
- **Provider:** `server` (`METADATA_STORAGE_PROVIDER=server` default)
- **Pinata Status:** Inactive (`METADATA_STORAGE_API_KEY` is unconfigured)
- **Readiness:** **READY FOR FUJI MINT** (`readyForMint: true`)

> [!NOTE]
> **Honest Decentralization Disclosure:**  
> The current system operates under **Mode B (Server Canonical Metadata)**. The Token URI points to the application's canonical HTTPS endpoint (`https://pawsandpicket.app/api/metadata/:petUid`), not an immutable IPFS content hash. This is standard and fully compliant with the ERC-721 Metadata JSON Schema, but depends on application server availability. It is **not** permanent IPFS pinning.

---

## 2. Standard ERC-721 Metadata Schema & Canonical Origin Hardening

The endpoint `/api/metadata/:petUid` returns canonical ERC-721 compliant JSON with strictly scrubbed PII.

### Root Cause Analysis of Previous Defect
1. **Localhost Leakage:** Previously, `getPublicOrigin(req)` extracted `req.get('host')` when `APP_URL` was unset or blank, producing `http://127.0.0.1:<port>`.
2. **Local Asset Path Concatenation:** For pets referencing local starter assets (e.g. `/src/assets/images/cropped_golden_dog_...`), the metadata generator previously concatenated `${origin}${pet.photoUrl}`, directly exposing internal filesystem paths instead of routing through the portrait endpoint.
3. **EIP-712 Voucher Origin Drift:** In `/api/web3/mint-claim`, `publicBaseUrl` was derived from incoming request host headers rather than the canonical origin.

### Implemented Corrections
1. **Canonical Origin Constant:** Introduced `CANONICAL_APP_ORIGIN = 'https://pawsandpicket.app'` and `getCanonicalOrigin()` in both `src/server/app.ts` and `src/server/web3Service.ts`.
2. **Strict Sanitization:** `buildPublicPetMetadata()` and `issueSignedMintClaim()` automatically reject and sanitize any localhost, 127.0.0.1, or non-HTTPS URLs, ensuring all metadata tokens and EIP-712 vouchers use `https://pawsandpicket.app`.
3. **Unified Portrait Endpoint:** Regardless of whether the pet image is stored as a base64 data-URL or a local starter asset, `metadata.image` always resolves to:
   `https://pawsandpicket.app/api/pets/<encoded-petUid>/portrait`

### Sanitized JSON Example
```json
{
  "name": "Sunny · Paws & Picket Passport",
  "description": "Canonical Pet Passport for Sunny, discovered in Paws & Picket. Direct transfers are blocked; ownership changes only via explicit adoption.",
  "image": "https://pawsandpicket.app/api/pets/pet-retriever-guest%3Amulti-pet-1794982055618/portrait",
  "attributes": [
    { "trait_type": "Species", "value": "dog" },
    { "trait_type": "Pose", "value": "Happy" },
    { "trait_type": "Discovery Score", "value": 91 },
    { "trait_type": "Bond XP", "value": 100 },
    { "trait_type": "Care Milestones", "value": 5 },
    { "trait_type": "Discovered Date", "value": "2026-11-18" },
    { "trait_type": "Original Discoverer", "value": "0x2B237fF449D21ECd304407d98cAAA379290747D5" }
  ]
}
```

### Privacy & PII Compliance
- **Excluded:** User IDs, Keeper emails, account credentials, IP addresses, GPS location, and camera EXIF.
- **Included:** Pet name, species, pose, server-verified discovery score, Bond XP, care counter, discovery date, and public EVM address of original discoverer.

---

## 3. Public Portrait Binary Serving Architecture

- **Endpoint:** `GET /api/pets/:petUid/portrait`
- **Supported Storage Backends:**
  1. **Firestore Data URLs:** Base64-decoded into binary buffer, setting `Content-Type: image/jpeg` or `image/png`, `Content-Length`, and `Cache-Control: public, max-age=86400, immutable`.
  2. **Local Starter Assets:** Safely resolved within `rootDir` (e.g. `src/assets/images/cropped_golden_dog_...`), verified with `fs.existsSync()`, and served via `res.sendFile(absPath)` with `Content-Type: image/jpeg` (510,996 bytes).
  3. **External HTTPS URLs:** Forwarded via HTTP 302 redirect.
- **Unauthenticated Access:** Completely public, zero authentication or session headers required, enabling external NFT viewers (OpenSea, Snowtrace, Core Wallet) to fetch and render raw portrait images.

---

## 4. Production Deployment & Public Reachability Verification

> [!WARNING]
> **Production DNS & Reachability Status (Step 3 Real-World Audit):**  
> - **Domain:** `pawsandpicket.app`
> - **DNS Lookup:** `nslookup pawsandpicket.app` -> `NXDOMAIN` (Domain not found on public DNS).
> - **HTTPS Connection:** `curl -sIv https://pawsandpicket.app` -> `curl: (6) Could not resolve host: pawsandpicket.app`.
> - **Verification Distinction:**
>   - **Code Generator Verification:** **PASS**. The backend code strictly generates valid, canonical `https://pawsandpicket.app` URLs without any localhost leakage.
>   - **Live Public Reachability:** **BLOCKED (INFRASTRUCTURE)**. The domain `pawsandpicket.app` has not yet been registered or assigned DNS records in production.

---

## 5. Alternative Mode: Mode A (Pinata IPFS Dual-Stage Pinning)

If `METADATA_STORAGE_PROVIDER=pinata` and a valid JWT is provided in `METADATA_STORAGE_API_KEY`:
1. **Stage 1 (Image Pinning):** Uploads raw image binary to Pinata IPFS (`/pinning/pinFileToIPFS`) -> returns `imageCid`.
2. **Stage 2 (Metadata Pinning):** Generates JSON with `image: "ipfs://<imageCid>"` and pins metadata (`/pinning/pinJSONToIPFS`) -> returns `metadataCid`.
3. **Signed Token URI:** `ipfs://<metadataCid>` is baked into the EIP-712 mint claim voucher.
4. **Gateway Fallback:** Resolves via `https://gateway.pinata.cloud/ipfs/<metadataCid>` or public IPFS gateways (`https://ipfs.io/ipfs/<metadataCid>`).

---

## 6. Summary of Verification & Test Matrix

| Check | Result | Evidence |
| :--- | :---: | :--- |
| ERC-721 schema validity | **PASS** | `name`, `description`, `image`, `attributes` formatted |
| Canonical HTTPS Origin | **PASS** | `https://pawsandpicket.app` strictly enforced |
| No Localhost/Port Leakage | **PASS** | Verified in `test/web3-metadata-canonical.test.ts` (0 matches for localhost/:3000/:53548) |
| Binary Image Serving | **PASS** | 510,996 bytes streamed with `image/jpeg` status 200 |
| Public Unauthenticated Access | **PASS** | Zero session / cookie required for `/api/pets/:petUid/portrait` |
| Zero PII exposure | **PASS** | Verified in automated tests (no emails, no user IDs, no coordinates) |
| EIP-712 URI binding consistency | **PASS** | Exact match between voucher `metadataUri` and metadata endpoint |
| Production Internet Reachability | **BLOCKED** | Domain `pawsandpicket.app` returns `NXDOMAIN` |
