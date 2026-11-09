# PawVerse build task list

Tasks are grouped by slice and follow the order in the skill. Each slice ends with something you can demo.

## Slice 0: Foundation

1. Create a monorepo: `apps/mobile`, `apps/api`, `apps/partner-web`, `apps/sponsor-web`, `packages/contracts`, `packages/shared` (types, API client).
2. Set up Docker Compose with Postgres 16 + pgvector, Redis, and S3-compatible storage (MinIO for local).
3. Set up CI (lint, tests, contract tests) and environments (local, staging, production).
4. Set up secrets management, including a KMS-held signer key plan.
5. Build social login (Google/Apple) and user sessions.
6. Write the database migrations for the core tables (users, photos, judgments, pets, ledger, and so on).
7. Set up the API skeleton: auth middleware, rate limiting, idempotency keys, structured logging, error tracking.
8. Write the privacy policy, terms and consent flow (camera, location, notifications) before any real users.

## Slice 1: Capture, AI judge, first pet

### **Mobile**

9. Build the live camera screen with no gallery picker.
10. Add the Daily Theme overlay and mission prompt.
11. Capture metadata: GPS, motion sensor sample, timestamp.
12. Add device attestation (Play Integrity / App Attest).
13. Build the upload flow with retry and offline queue.
14. Build the result screen: score breakdown, "Adoption Failed", EXP gained, or "New Pet".

### **Backend**

15. Photo upload endpoint with signed URLs.
16. Pre-checks: attestation, rate limit, SHA-256 and perceptual-hash dedupe, timestamp skew, GPS speed check.
17. Judge service: prompt, JSON schema, validation, retry, versioning, cost tracking.
18. Face/person detection with reject or blur.
19. Score calculation in the backend (don't trust the model's own total).
20. Embedding service and pgvector re-ID with the two thresholds.
21. Outcome engine: reject, EXP, item fragment, new pet.
22. Daily Themes and Achievements tables with an admin way to schedule them.
23. Golden test set of 30-50 photos and a script that runs it on every prompt or model change.

## Slice 2: Garden, streaks, notifications

24. 2D garden scene (Phaser/PixiJS in a WebView) with a bridge to the app.
25. Modular pet rigs: body, ears, tail, pattern layer, with palette mapping from coat colors.
26. Interactions (feed, pet, play) with daily caps and EXP/affection bars.
27. Fence state machine: `SECURE`, `VULNERABLE`, `SHIELDED`, `LURED`.
28. Worker or cron that flips overdue fences, with state also computed from timestamps on read.
29. Countdown timer UI and the shielded state.
30. Push notifications (20h and 23h warnings, lure alerts, rescue results).
31. Backpack and inventory screen, backed by the points ledger.
32. Daily streak counter and milestones.

## Slice 3: Wallet and minting

33. Choose the smart-account provider and set up social-login wallets on Fuji.
34. Set up a paymaster with an allowlist, per-user gas caps and a kill switch.
35. Write the `PawPet` ERC-721 contract with EIP-712 `mintWithSig`.
36. Write the `PawItems` ERC-1155 contract.
37. Write Foundry tests: replay, wrong signer, expired signature, double mint.
38. Deploy to Fuji and write deploy scripts.
39. Mint queue: async worker, retries, status field ("pending" to "minted").
40. Metadata service (token URI, stats, images).
41. Wallet screen and "my pets on chain" view in the app.
42. Pet and item sync between chain and database (event indexer).
43. Optional: `Kibble` ERC-20 plus batch settlement from the ledger.

## Slice 4: Lure, rescue, crafting, swaps

44. "Visit neighbor" list and map (friends and nearby players with vulnerable fences).
45. Bait and anti-theft gear items.
46. Lure action with a server-side seeded roll, caps, cooldowns and the owner's grace window.
47. `currentCustodian` on-chain and off-chain, with `setCustodian` operator role.
48. Rescue and ransom screen with decaying odds, a cost cap and a deterministic path.
49. Crafting table: recipes table, `burnToCraft`, fragment merging.
50. P2P swap: escrowed two-sided offers with expiry and atomic execution.
51. Anti-abuse rules for raids (daily limits, repeated-target limits).

## Slice 5: Proof-of-Paw consensus

52. WebSocket service with online presence.
53. Redemption request flow that creates a `consensus_task`.
54. Matchmaker: trust threshold, not friends, not same device or IP range, regional spread.
55. Voter pop-up with face-blurred photo, timer, Approve and Report.
56. Resolution logic (2-of-3, 3-of-3 for high-value), timeouts and replacement voters.
57. Fake-photo traps (honeypots): content library, rotation, hidden labeling.
58. Trust score system with decay.
59. Voter payouts only after resolution, based on agreement and honeypot accuracy.
60. Collusion and sybil detection (device clustering, pairing frequency).
61. Appeal path and human moderator queue.

## Slice 6: Partner venues, sponsors, charity

### **Partners**

62. Partner onboarding and the Sanctuary Station map layer.
Finis63. Cashier web page: login, per-bill QR generation, print view.
64. Signed single-use QR service with atomic redeem and expiry.
65. In-app QR receipt scanner, with GPS radius check and daily caps.
66. Shield, secret quests and discount unlock on redeem.
67. Weekly partner stats dashboard.

### **Sponsors and charity**

68. Sponsor portal: voucher batches, redemption rules, approval flow, engagement metrics.
69. Voucher issuance (1155 ids) and claim flow in the app.
70. `ReliefEscrow` contract with the `ReliefPackDonated` event.
71. Event listener that notifies sponsors and creates fulfilment tasks.
72. Shelter onboarding and vetting, plus shelter delivery confirmation. 73. Public impact ledger page (redeemed, sent, confirmed).

## Cross-cutting tasks

### **Security and fraud**

74. Admin panel: user lookup, ban, photo review, judgment audit, ledger view.
75. Anomaly alerts: reject rate spikes, honeypot failure rate, QR redemption spikes.
76. Contract security: multisig admin, pause switch, fuzz tests, external audit before mainnet or any real-value voucher.

### **Economy and analytics**

77. Spreadsheet model of rewards versus sponsor value (before fixing the 2-Kibble rate).
78. Metrics dashboard: judge cost per photo, duplicate rate, consensus disagreement, retention, streak survival.
79. Remote config for score thresholds, weights, caps and rewards, so balance changes don't need an app release.

### **Legal and trust**

80. Legal review of token or reward rules, charity claims, promotions law, minors and location data.
81. Content policy and takedown path; animal-welfare rules in the judge prompt and onboarding.
82. Data retention and deletion (photos, GPS, embeddings).

### **Quality and launch**

83. Test plans: API tests, contract tests, end-to-end capture test, load test for judge and WebSockets.
84. Closed beta with a few cafes and one shelter; fix the top fraud paths found.
85. App store submission (permissions text, review notes about camera, location and rewards).
86. Mainnet deployment plan, with a rollback and incident runbook.
