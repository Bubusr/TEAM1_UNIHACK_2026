# Paws & Picket: Pre-Deployment Security Audit Report

**Document Version:** 1.0.0  
**Audit Scope:** Express Backend, Auth Middleware, Session Tokens, Input Validation, CSRF, Injection & Secrets  
**Evaluation Standard:** OWASP Top 10 API Security Risks & Web3 Signing Standards  
**Status:** **CONDITIONALLY SECURE (1 Defect to Patch, Production Hardening Flags Required)**  

---

## 1. Executive Security Assessment

A thorough red-team and code security evaluation was performed on [server.ts](file:///Users/apple/HACKATHON/server.ts), [src/middleware/auth.ts](file:///Users/apple/HACKATHON/src/middleware/auth.ts), [src/server/guestSession.ts](file:///Users/apple/HACKATHON/src/server/guestSession.ts), and [src/server/web3Service.ts](file:///Users/apple/HACKATHON/src/server/web3Service.ts).

### Overall Posture:
- **Authentication & Authorization:** Strong separation between Guest actors and Firebase-authenticated Keepers. Privilege escalation by altering `userId` in request bodies is completely mitigated.
- **CSRF & Origin Isolation:** Robust guards against cross-origin cookie mutations using modern `Sec-Fetch-Site` and `Origin` headers.
- **Injection Resistance:** SQL injection is prevented via Drizzle ORM parameterization; NoSQL injection in Firestore is prevented via typed document references.
- **Rate Limiting & DoS:** In-memory sliding window limiters protect resource-intensive endpoints (`/api/judge`, `/api/web3/mint-claim`).
- **Defects Identified:** 1 XSS sanitization deficiency (`DEF-02` in `sanitizeOneWord`) requiring remediation before production release.

---

## 2. Authentication & Session Integrity Evaluation

### 2.1 Guest Session Mechanism (HMAC-SHA256)
- **Token Format:** Base64URL-encoded payload concatenated with HMAC-SHA256 signature (`<payload>.<signature>`).
- **Cryptographic Rigor:**
  - Uses domain separation: `crypto.createHash('sha256').update('paws-guest-hmac-v1:' + configuredSecret).digest()`.
  - In production (`NODE_ENV === 'production'`), [src/server/guestSession.ts](file:///Users/apple/HACKATHON/src/server/guestSession.ts#L30-L40) mandates a minimum 32-character secret, rejecting placeholders (`changeme`, `secret`).
  - Token lifetime is clamped to 30 days (`GUEST_TOKEN_TTL_MS = 2,592,000,000 ms`).
  - Constant-time verification (`crypto.timingSafeEqual`) prevents timing attack side-channels.
- **Tamper Resistance (SEC-02):** Modifying a single character of the payload or signature immediately yields `HTTP 401: Invalid or tampered guest session token.` (Verified PASS in audit harness).

### 2.2 Firebase Admin Authentication
- Authenticated endpoints (`requireAuth`) require a valid Firebase ID token via `Authorization: Bearer <ID_TOKEN>`.
- Token verification delegates to `adminAuth.verifyIdToken(token, true)` with revocation check.
- **Dev Token Flag Check:** In non-production environments (`NODE_ENV !== 'production'`), a development bypass (`dev-keeper:<base64>`) exists for local automated testing.
  > [!IMPORTANT]
  > Production deployment must strictly enforce `NODE_ENV=production` to guarantee that the `dev-keeper:` bypass is disabled at runtime.

### 2.3 Identity Impersonation & Privilege Escalation (SEC-05, SEC-10)
- **Vulnerability Checked:** Can an attacker pass `userId: 1` in the JSON body of `/api/keeper/care` or `/api/web3/mint-claim` to operate on another player's assets?
- **Finding:** **MITIGATED**.
  All controllers obtain the actor's identity strictly from `req.actor.uid` or `req.user.uid` resolved by the authentication middleware. Body parameters attempting to override user ID are discarded.
- **Cross-User Asset Protection (SEC-05):** Attempting to execute care actions on a pet whose `currentOwnerUid !== req.actor.uid` returns `HTTP 400: Pet not found in your sanctuary.`

---

## 3. CSRF & Cross-Origin Defense (SEC-04)

- **Mechanisms:**
  - Modern browsers send `Sec-Fetch-Site`. If `Sec-Fetch-Site === 'cross-site'`, mutations (POST, PUT, DELETE) are rejected with `HTTP 403: Cross-site cookie mutations are forbidden.`
  - Fallback validation checks `Origin` and `Referer` headers against the server's public origin.
  - Guest session cookies are issued with `SameSite=Lax`, `HttpOnly=true`, and `Secure=true` in production.
- **Audit Verification (SEC-04):** Sending `POST /api/keeper/care` with `Origin: https://malicious-attacker.com` resulted in immediate `HTTP 403 Forbidden`.

---

## 4. Input Sanitization & Injection Defense (SEC-06, SEC-07, SEC-08)

### 4.1 SQL & NoSQL Injection (SEC-06)
- **PostgreSQL Layer:** All queries utilize Drizzle ORM parameterized expressions (`eq(pets.petUid, petUid)`). No raw string interpolation or concatenation is used.
- **Firestore Layer:** Queries utilize document references (`adminDb.collection('pets').doc(petUid)`). Arbitrary operators (e.g. `$where`, `$regex`, `$gt`) passed in JSON are treated as literal document IDs and safely return `404 Not Found`.

### 4.2 XSS Payload Handling (SEC-07 - DEF-02)
- **Vulnerability Checked:** Can malicious HTML/JavaScript be injected into pet names, notes, or species?
- **Finding:** **FAIL (Defect DEF-02)**.
  - In [src/server/rewards.ts#L36-L40](file:///Users/apple/HACKATHON/src/server/rewards.ts#L36-L40):
    ```ts
    export function sanitizeOneWord(input: string, fallback: string): string {
      const cleaned = input.replace(/[^a-zA-Z0-9 -]/g, '').trim();
      const first = cleaned.split(/\s+/)[0];
      return first ? first.slice(0, 18) : fallback;
    }
    ```
  - Input `<script>alert(1)</script> Sunny` is transformed into `scriptalert1script`.
  - **Risk Assessment:** While modern React escapes JSX text nodes (preventing direct script execution in the UI), leaving corrupted script strings impairs data hygiene and could lead to issues in dynamic SVG generation (`/api/pets/:petUid/portrait`).
  - **Fix:** Strip HTML tags before regex tokenizing: `input.replace(/<[^>]*>/g, ' ').replace(/[^a-zA-Z0-9 -]/g, '').trim()`.

### 4.3 Malicious Image Uploads (SEC-08)
- Endpoints processing image uploads (`POST /api/judge`) enforce:
  1. Payload size limit: Express JSON body limit clamped to 8 MB (`CORE-08` verified).
  2. Magic byte / metadata verification: The payload is passed to `sharp(buffer).metadata()`. Non-image files or polyglots disguised with a `.jpg` extension fail metadata extraction and return `HTTP 400: Invalid image file.` (`CORE-07` verified).

---

## 5. Secret Exposure & Information Leakage Audit

A comprehensive scan of all HTTP responses and error messages was conducted:

| Secret Asset | Checked Endpoints | Exposure Finding |
|---|---|---|
| `GEMINI_API_KEY` | `POST /api/judge`, error traces | **NOT EXPOSED** (Hidden behind generic error messages) |
| `TRUSTED_SIGNER_PRIVATE_KEY` | `GET /api/web3/status`, `POST /api/web3/mint-claim` | **NOT EXPOSED** (Only public address is exposed) |
| `GUEST_SESSION_SECRET` | `POST /api/guest/session`, cookies | **NOT EXPOSED** (Only HMAC digest is emitted) |
| Firebase Service Account Key | Firestore error handlers, logs | **NOT EXPOSED** |
| Signed Claim Vouchers | `POST /api/web3/mint-claim` | Only emitted to the verified owner of the eligible pet |

---

## 6. Rate Limiting & DoS Resistance (SEC-09)

In-memory sliding-window rate limiters ([src/server/rateLimit.ts](file:///Users/apple/HACKATHON/src/server/rateLimit.ts)) guard the application:
1. `judgeLimiter`: 12 requests / 60 seconds (prevents Gemini API quota exhaustion).
2. `actionLimiter`: 60 requests / 60 seconds (prevents bot care spam).
3. `mintLimiter`: 10 requests / 60 seconds (prevents voucher spamming).

Audit test `SEC-09` confirmed that exceeding 12 requests to `/api/judge` within 60 seconds immediately returns `HTTP 429: Too many judge requests. Please slow down.`
