# API, Security and Privacy

Default backend: FastAPI + Postgres + Redis + S3-compatible storage. Principles apply to any stack.

## Authentication

- Social login (Google/Apple) via the provider's ID token; verify signature, audience, issuer and expiry on the server. Exchange it for your own short-lived access token (about 15 minutes) and a rotating refresh token stored hashed.
- Bind sessions to a device record. On refresh-token reuse, revoke the whole session family.
- Link the smart-account wallet to the user server-side; never trust a wallet address sent by the client without proof (signed message or provider-verified claim).
- Sensitive actions (redeem vouchers, change linked wallet, delete account) require a fresh login or step-up check.

## Authorization

- Deny by default. Every endpoint declares who may call it: user, partner staff, sponsor staff, admin, internal worker.
- Object-level checks on every id in the path (`pet.owner_id == user.id`, or a valid lure/rescue relationship). Most real-world breaches are missing object-level checks, so write tests that call each endpoint with another user's ids.
- Separate auth realms and tokens for partner-web, sponsor-web and admin; cashiers must never reach player data.
- Role changes are audited. Admin actions are logged with actor, target and before/after.

## Idempotency

- Required `Idempotency-Key` header on every endpoint that grants, spends or mints: capture submit, lure, rescue, craft, swap, redeem, vote, QR scan, voucher claim.
- Store `(user_id, key, request_hash, response, status, expires_at)`; the same key with the same body returns the stored response; same key with a different body returns 409.
- Use `capture_id` from the client as the natural key for captures.
- Ledger writes carry a unique `(ref_type, ref_id)` constraint so a retry cannot double-credit even if the idempotency layer fails.
- On-chain: use a nonce per mint/claim voucher and store tx hashes; a mint job checks chain state before resending.

## Signed upload URLs

- Server issues a presigned PUT for a key it generates (`captures/{user_id}/{capture_id}.jpg`); the client never chooses the key.
- Constrain content type, maximum size (for example 8 MB) and expiry (for example 5 minutes).
- Uploads go to a private bucket; the submit step re-checks size and type server-side, verifies it is a decodable image (reject polyglots), re-encodes it, and computes hashes from the stored bytes.
- Serve photos to other players (voting) only through short-lived signed GET URLs of face-blurred, downscaled derivatives, never the original.
- Malware scan or at least strict image re-encode; delete orphaned uploads that were never submitted (lifecycle rule).

## Rate limiting and abuse controls

- Layered limits in Redis: per IP, per device, per user, per endpoint. Use token bucket with tighter limits for expensive routes (capture submit, judge calls) and for reward routes (vote, QR scan, lure).
- Return `429` with `Retry-After`; the client must back off.
- Budget guard for AI cost: global and per-user daily judge-call caps, with a circuit breaker that stops calling the model when spend exceeds a threshold and returns a friendly "try later".
- Bot defenses at signup: attestation, email/phone verification as needed, device caps per account, velocity checks.
- WebSocket: authenticate on connect, limit message rate and size, drop idle connections.

## Input validation

Validate everything with typed schemas (Pydantic); cap list sizes and string lengths; validate GPS ranges; reject NaN/inf; parameterized SQL only; never build SQL from user text. Escape user-generated text (pet names) wherever it is rendered, including WebViews and the partner dashboard.

## Secret management

- No secrets in the repo, images, logs or mobile bundle. Mobile apps contain only public identifiers; anything in the app can be extracted.
- Store secrets in a secrets manager (cloud provider or Vault); inject at runtime. Separate secrets per environment.
- The mint **signer key** and any operator key: hold in a KMS/HSM that signs without exporting the key; strict IAM; alert on use; documented rotation (contracts support adding a new signer role before removing the old one).
- Model API keys: server-side only, per-environment, with spend limits.
- Add secret scanning (pre-commit and CI) and rotate immediately if one leaks.
- Principle of least privilege for DB roles: the API cannot drop tables; migrations use a separate role.

## Privacy and photo deletion

Photos of animals still contain people, homes, plates, children and precise locations.

- **Data minimization:** store coarse location with the photo for display; keep precise GPS only as long as risk scoring needs it, then truncate or delete. Strip EXIF from derivatives.
- **People and private spaces:** the judge's face/person flag rejects or blurs; provide user reporting and a takedown path with a response-time target.
- **Retention:** define it in writing, for example originals deleted after the pet is minted and any consensus window ends; keep only the derivative, hashes and embeddings needed for dedupe and re-ID. Rejected photos deleted after a short period (for example 30 days) unless under fraud review.
- **Deletion requests:** an account deletion job removes originals, derivatives, embeddings, GPS, push tokens and profile data, and queues backups to age out. Record what was deleted and when. Handle the legal tension with fraud/audit needs by keeping minimal hashed records.
- **On-chain data is permanent.** Never put photos, GPS or personal data in token metadata. Metadata should contain only pet stats and a pointer to a non-sensitive image; if a user deletes their account, burn or detach the token where possible and explain what cannot be erased.
- **Consent and minors:** explicit consent for camera, location and for showing photos to other players in verification; define a minimum age and treat any under-18 support with stricter rules.
- **Regional law:** check requirements for each launch country (for example GDPR-style rights and Vietnam's personal data protection rules if launching there) with legal counsel; do not assume.
- Keep an access log for staff viewing user photos.

## Observability

- **Logging:** structured JSON logs with `request_id`, `user_id` (hashed where possible), `capture_id`; never log tokens, presigned URLs or raw GPS.
- **Metrics:** request rate/latency/errors per route; judge latency, cost, error and reject rate; queue depth for mint and consensus; fence-flip lag; paymaster spend; honeypot failure rate; QR redemption rate.
- **Tracing:** trace a capture end to end (upload, pre-checks, judge, re-ID, ledger, mint job).
- **Alerts:** error budget burn, judge failure spike, queue backlog, unusual reward emission, paymaster balance low, signer key use outside the mint worker.
- **Audit:** immutable audit trail for ledger changes, admin actions, judge decisions (raw output and prompt version).

## Error handling

- One error envelope: `{ "error": { "code": "CAPTURE_DUPLICATE", "message": "...", "retryable": false, "request_id": "..." } }`.
- Stable machine-readable codes the client maps to friendly text; never leak stack traces or internal ids.
- Distinguish retryable (network, 5xx, 429) from terminal (validation, duplicate, forbidden).
- External dependencies (model API, RPC, push): timeouts, retries with jitter, circuit breakers, and a degraded mode (for example capture accepted as "pending judgment" if the model is down).
- Background jobs: dead-letter queue, max attempts, and a dashboard to replay safely (idempotent handlers).
- Reconcile periodically: ledger vs. chain, vouchers vs. escrow events, fences vs. timestamps.
