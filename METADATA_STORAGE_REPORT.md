# METADATA STORAGE & TOKEN URI SPECIFICATION REPORT

**Author:** Member 03 – Blockchain & Web3 Integration Engineer  
**Date:** November 19, 2026  
**Application:** Paws & Picket  
**Network:** Avalanche Fuji Testnet (43113)  
**Contract Address:** `0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31`

---

## 1. Active Metadata Mode: Mode B (Server Canonical Metadata)

### Current Configuration
- **Provider:** `server` (`METADATA_STORAGE_PROVIDER=server` default)
- **Pinata Status:** Inactive (`METADATA_STORAGE_API_KEY` is unconfigured)
- **Readiness:** **READY FOR FUJI MINT** (`readyForMint: true`)

> [!NOTE]
> **Honest Decentralization Disclosure:**  
> The current system operates under **Mode B (Server Canonical Metadata)**. The Token URI points to the application's HTTPS endpoint (`https://<domain>/api/metadata/:petUid`), not an immutable IPFS content hash. This is standard and fully compliant with the ERC-721 Metadata JSON Schema, but depends on application server availability. It is **not** permanent IPFS pinning.

---

## 2. Standard ERC-721 Metadata Schema

The endpoint `/api/metadata/:petUid` returns canonical ERC-721 compliant JSON with strictly scrubbed PII.

### Sanitized JSON Example
```json
{
  "name": "Mochi · Paws & Picket Passport",
  "description": "Canonical Pet Passport for Mochi, discovered in Paws & Picket. Direct transfers are blocked; ownership changes only via explicit adoption.",
  "image": "https://pawsandpicket.app/api/pets/pet-mochi-fuji-001/portrait",
  "attributes": [
    { "trait_type": "Species", "value": "Cat" },
    { "trait_type": "Pose", "value": "Sleeping" },
    { "trait_type": "Discovery Score", "value": 92 },
    { "trait_type": "Bond XP", "value": 150 },
    { "trait_type": "Care Actions", "value": 6 },
    { "trait_type": "Discovered Date", "value": "2026-11-19" },
    { "trait_type": "Original Discoverer", "value": "0x2B237fF449D21ECd304407d98cAAA379290747D5" }
  ]
}
```

### Privacy & PII Compliance
- **Excluded:** User IDs, Keeper emails, account credentials, IP addresses, GPS location, and camera EXIF.
- **Included:** Pet name, species, pose, server-verified discovery score, Bond XP, care counter, discovery date, and public EVM address of original discoverer.

---

## 3. Image Delivery & Content-Type Architecture

- **Endpoint:** `/api/pets/:petUid/portrait`
- **Supported Formats:** `image/png`, `image/jpeg`, `image/webp`
- **Delivery Strategy:**
  - If stored as a base64 data URL in Firestore (`data:image/png;base64,...`), the endpoint decodes the binary payload, sets `Content-Type: image/png` and `Cache-Control: public, max-age=86400`, and streams the raw image bytes.
  - If stored as an external URL (e.g. Firebase Storage bucket), it issues an HTTP 302 redirect.
- **External Consumer Access:** Verified accessible without authentication headers, allowing OpenSea, Snowtrace, Core Wallet, and NFT indexers to parse and render pet portraits.

---

## 4. Alternative Mode: Mode A (Pinata IPFS Dual-Stage Pinning)

If `METADATA_STORAGE_PROVIDER=pinata` and a valid JWT is provided in `METADATA_STORAGE_API_KEY`:
1. **Stage 1 (Image Pinning):** Uploads raw image binary to Pinata IPFS (`/pinning/pinFileToIPFS`) -> returns `imageCid`.
2. **Stage 2 (Metadata Pinning):** Generates JSON with `image: "ipfs://<imageCid>"` and pins metadata (`/pinning/pinJSONToIPFS`) -> returns `metadataCid`.
3. **Signed Token URI:** `ipfs://<metadataCid>` is baked into the EIP-712 mint claim voucher.
4. **Gateway Fallback:** Resolves via `https://gateway.pinata.cloud/ipfs/<metadataCid>` or public IPFS gateways (`https://ipfs.io/ipfs/<metadataCid>`).

---

## 5. Summary of Verification

| Check | Result | Evidence |
| :--- | :---: | :--- |
| ERC-721 schema validity | **PASS** | `name`, `description`, `image`, `attributes` formatted |
| Image content type header | **PASS** | Serves binary with `image/*` MIME type |
| Zero PII exposure | **PASS** | Verified in automated regression test `server.test.ts` |
| Server restart survival | **PASS** | Data fetched dynamically from Firestore collection `pets` |
| EIP-712 URI binding | **PASS** | Hashed in typed data `keccak256(bytes(metadataUri))` |
