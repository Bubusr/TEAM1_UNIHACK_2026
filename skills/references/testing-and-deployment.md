# Testing and Deployment

## Local environment (Docker)

`docker-compose.yml` services: `postgres` (with pgvector image), `redis`, `minio` (S3), `mailhog` (if email), `anvil` (local EVM for fast contract tests), and optionally the `api` and `worker`.

- One command to start: `make dev` (compose up, run migrations, seed data).
- Seed data: a few users, pets with embeddings, a partner, a sponsor batch, themes, and a small golden photo set.
- `.env.example` lists every variable with safe fake values. The app must fail fast at boot if a required variable is missing.
- Local AI: a `JUDGE_MODE=stub|live` flag. `stub` returns deterministic canned judgments from a fixture file so most tests do not call the paid model.
- Test-mode capture path (mobile): a dev-only flag that lets testers submit prepared images without the live camera. It must be compiled out of production builds and covered by a CI check.

## Test pyramid

| Layer | Tooling | What to cover |
|---|---|---|
| Unit | pytest | score calculation, rescue formula, fence state from timestamps, trust score, signature building |
| Database | pytest + real Postgres (testcontainers), transaction rollback per test | migrations apply, constraints, atomic QR redeem, ledger uniqueness, pgvector queries |
| API | pytest + httpx | authz (other user's ids), idempotency replay, rate limits, error envelope, signed-URL limits |
| Worker | pytest | mint queue retries, cron fence flip idempotency, consensus resolution and timeouts |
| Contracts | Foundry (`forge test`) | see below |
| AI golden set | custom runner | see below |
| End to end | Maestro or Detox against staging | login, capture, result, garden, notification |
| Load | k6 or Locust | capture submit, WebSocket matchmaking, QR scan spikes |

Run against a real Postgres, not SQLite; locking and pgvector behavior differ.

### Database and concurrency tests

- Two simultaneous scans of the same QR: exactly one succeeds.
- Two simultaneous submits with the same `capture_id`: one record, same response.
- Double-vote by the same voter; vote after resolution; timeout then replacement voter.
- Ledger balance equals the sum of entries after random operation sequences (property test).

## AI golden-set tests

- Maintain `evals/golden/` with labeled images and expected outcomes: sharp cat (high), blurry (reject), screenshot of a cat, printed photo, stock photo, AI-generated pet, same cat different angle, two similar cats, plush toy, dog with owner's face, distressed animal, night shot, household object for loot.
- Each case has expected: `is_live`, outcome band, subject class, re-ID decision, welfare flag, person flag.
- The runner produces a report: pass rate per category, score drift versus the previous prompt/model version, cost and latency. **Block releases** if live-capture detection, welfare flag or person detection regress beyond a threshold.
- Use a fixed temperature and repeat each case a few times to measure variance; flaky cases get reviewed, not ignored.
- Version everything: `judge_prompt_vN`, model id, embedding model id, thresholds. A change to any of them triggers the golden run in CI (nightly for live-model runs to control cost; stub runs on every PR).
- Expand the set from real production disputes and fraud findings.

## Contract tests (Foundry)

- **Unit:** mint with valid signature; role checks; custodian set and cleared on transfer; `burnToCraft` burns and mints correct amounts; escrow emits `ReliefPackDonated` with right fields.
- **Negative:** wrong signer, expired deadline, replayed signature or nonce, double mint of the same `petId`, unauthorized operator, paused contract, zero address, overflow-style edge amounts.
- **Fuzz and invariants:** total supply matches minted count; vouchers burned equal vouchers redeemed in escrow; custodian never changes `ownerOf`; no one but the operator role can change custodian.
- **Fork tests:** run against a Fuji fork for realistic gas and any dependency addresses.
- **Gas snapshots:** `forge snapshot` in CI to catch regressions.
- **Static analysis:** Slither (and a second tool) in CI; fix or justify each finding.
- **Backend-to-contract:** an integration test where the real signer service signs, and a local chain accepts the mint; this catches EIP-712 domain mismatches, the most common integration bug.

## CI/CD

Pipeline stages on every PR:
1. Lint and type check (ruff/mypy, eslint/tsc, solhint).
2. Unit + DB + API tests (with compose services).
3. Contract tests, gas snapshot, Slither.
4. Golden-set stub run; migration check (apply up, down and up on a scratch DB).
5. Mobile: unit tests, build check, secret scan, and the check that the test-mode capture flag is absent in release config.
6. Build and scan container images; publish with the commit SHA tag.

On merge to main: deploy to **staging** automatically (api, worker, partner-web, sponsor-web, contracts on Fuji if changed), run smoke tests and the end-to-end suite. Production deploys require manual approval, with canary or rolling rollout and automatic rollback on error-rate or latency alarms. Mobile: build with EAS or Fastlane, internal testing track, then staged rollout.

Environment separation: local, staging (Fuji, test paymaster, stub or low-cap judge), production (mainnet, real keys). No shared databases or keys between them.

## Fuji deployment

Verify current network settings (chain id, RPC, explorer, faucet) in Avalanche docs before config.

1. Fund a deployer account from the faucet; use a throwaway key for testnet and keep it out of the repo.
2. Deploy order: `PawItems` -> `PawPet` -> `ReliefEscrow` -> (optional) `Kibble`. Save addresses, ABI, deploy block and tx hashes to `deployments/fuji.json` (committed) and verify source on the explorer.
3. Grant roles: signer role to the backend signer address, operator role to the game-operator address, admin to a multisig (even on testnet, to practice).
4. Configure the paymaster allowlist with the new addresses and set low daily caps.
5. Point the staging backend at the addresses via config; run the end-to-end mint test: capture, pending pet, mint tx, event indexed, token shows in wallet.
6. Start the event indexer from the deploy block; test reorg and restart behavior (resume from last processed block).
7. Rehearse the pause switch and signer-rotation procedure on Fuji.
8. Mainnet only after: external audit, fuzz/invariant suite green, legal sign-off on rewards, multisig and KMS in place, and a written incident runbook.

Contracts are immutable once deployed. Decide upgradability deliberately: if using proxies, test upgrade paths and storage layout; if not, plan for migration (deploy v2 and migrate state) from the start.

## Database migrations and rollback

- Use a migration tool (Alembic) with one linear history; every migration has `upgrade` and `downgrade`, reviewed in PR.
- **Expand and contract:** deploy schema changes that are backward-compatible first (add nullable column, add table, dual-write), then switch code, then remove the old shape in a later release. This makes app rollback safe.
- Avoid long locks: create indexes concurrently (`CREATE INDEX CONCURRENTLY`; for pgvector HNSW build on a copy or off-peak), backfill in batches, add constraints as `NOT VALID` then validate.
- Run migrations as a separate pre-deploy job with its own DB role; fail the deploy if it fails.
- Take a snapshot before production migrations; test restore regularly (an untested backup is not a backup).
- **Rollback rules:** code rollback is always allowed after an expand-phase migration; destructive migrations (drop column, rewrite data) are never auto-rolled-back, so they require a data backup and a forward-fix plan.
- Ledger, photo records and consensus votes are never mutated in place by migrations; add corrective entries instead.
- Re-embedding after an embedding-model change: add a new vector column, backfill, shadow-compare decisions, then switch.

## Release checklist

Golden set green; migrations dry-run on a production-size copy; feature flags default off for risky features (lure, consensus payouts, vouchers); dashboards and alerts in place; rollback command documented and tried; on-call and communication plan; staged mobile rollout with crash and error monitoring for the first 24 hours.
