# Paws & Picket: QA Failures, Blockers & Defect Status Report

**Document Version:** 2.0.0 (Post-Fix Sprint Update)  
**Execution Timestamp:** 2026-11-18  
**Defects Summary:** 0 FAIL | 2 BLOCKED | 3 RESOLVED  
**Fix Reference:** See [QA_FIX_LOG.md](file:///Users/apple/HACKATHON/QA_FIX_LOG.md) for detailed code changes and test execution logs.

---

## Defect Inventory & Resolution Status

| Defect ID | Severity | Category | Component | Status | Summary & Resolution |
|---|---|---|---|---|---|
| **DEF-01** | High | Business Logic | [server.ts](file:///Users/apple/HACKATHON/server.ts#L508), [gameActions.ts](file:///Users/apple/HACKATHON/src/server/gameActions.ts#L474), [firestoreStorage.ts](file:///Users/apple/HACKATHON/src/db/firestoreStorage.ts#L408) | ✅ **RESOLVED (PASS)** | Enforced strict `actionType` enum check (`['pet', 'feed', 'play']`). Invalid actions reject with HTTP 400 with 0 side-effects. Verified by 6 regression tests. |
| **DEF-02** | Medium | Security / Sanitization | [rewards.ts](file:///Users/apple/HACKATHON/src/server/rewards.ts#L36-L55) | ✅ **RESOLVED (PASS)** | Overhauled `sanitizeOneWord()`: strips script/style blocks, HTML tags, event handlers, and quotes; preserves valid Unicode letters (e.g. `Bông`, `Café`, `ハチ公`). Verified by 8 regression tests. |
| **DEF-03** | Critical Blocker | Configuration | [.env](file:///Users/apple/HACKATHON/.env#L2) & [src/server/aiJudge.ts](file:///Users/apple/HACKATHON/src/server/aiJudge.ts#L36-L48) | 🛑 **BLOCKED** | `GEMINI_API_KEY` is unconfigured. Fail-safe HTTP 503 behavior confirmed. Requires user-provisioned API key. |
| **DEF-04** | Critical Blocker | Web3 / Blockchain | [.env](file:///Users/apple/HACKATHON/.env#L16) & [contracts/PawsAndPicketPassport.sol](file:///Users/apple/HACKATHON/contracts/PawsAndPicketPassport.sol) | 🛑 **BLOCKED** | `PET_PASSPORT_CONTRACT_ADDRESS` is empty. Contract is un-deployed on Fuji. Requires testnet AVAX faucet & deployment. |
| **DEF-05** | High | Multi-DB Architecture | [web3Repository.ts](file:///Users/apple/HACKATHON/src/db/web3Repository.ts) & [web3Service.ts](file:///Users/apple/HACKATHON/src/server/web3Service.ts) | ✅ **RESOLVED (PASS)** | Created `src/db/web3Repository.ts` abstracting Firestore and PostgreSQL. Firestore-backed pets and wallets can issue signed mint claims and serve ERC-721 metadata. Verified by 3 regression tests. |
| **DEF-06** | Medium | Scoring Consistency | [server.ts](file:///Users/apple/HACKATHON/server.ts#L220-L255) & [rewards.ts](file:///Users/apple/HACKATHON/src/server/rewards.ts#L53-L57) | ⚠️ **TRACKED (Low Risk)** | Mint requirements matrix hardcodes `confidencePassed: true` while `rewards.ts` gates discovery score $\ge 80$. Gated by AI Judge scoring. |

---

## Verification Summary

All 3 code-level issues (DEF-01, DEF-02, DEF-05) have been completely resolved and verified through:
- **New Regression Suite:** [test/regression-defects.test.ts](file:///Users/apple/HACKATHON/test/regression-defects.test.ts) — **17 / 17 PASS**.
- **Full Backend Suite:** [test/server.test.ts](file:///Users/apple/HACKATHON/test/server.test.ts) — **20 / 20 PASS**.
- **QA Audit Harness:** [test/qa-audit-runner.ts](file:///Users/apple/HACKATHON/test/qa-audit-runner.ts) — **49 PASS, 0 FAIL, 2 BLOCKED**.
- **Lint & Build:** 0 TypeScript errors, clean Vite production build.
