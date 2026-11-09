---
name: pawverse-builder
description: Build a snap-to-earn "photograph real animals, get a virtual pet" mobile game on Avalanche with an AI photo judge, pet re-identification, 24h streak mechanics, peer photo verification, partner-cafe QR receipts and sponsor pet-food vouchers. Use this skill whenever the user mentions PawVerse, an AI pet collector, snap-to-earn, photo-to-NFT pets, Proof-of-Paw, Streak Fence, Kibble tokens, an O2O or social-impact game with cafe/brand sponsors, or asks to scaffold, design, code, review or plan any part of such an app (camera client, vision-judge pipeline, pgvector re-ID, state machine, ERC-721/1155/20 contracts, ERC-4337 wallets, QR service, sponsor dashboard), even if they only name one layer.
---

# PawVerse Builder

Guides building a photo-capture pet game where real photos of animals become virtual pets, with Avalanche used only for ownership and proof of impact. The hard part of this product is not the blockchain. It is **trust**: proving a photo is real, fresh and of a new animal, at a cost that does not exceed the reward. Design every layer around that.

## Operating principles

1. **Off-chain first, on-chain last.** Game logic, scores, streaks and micro-rewards live in Postgres/Redis. The chain records only things that gain value from being public or portable: pet ownership, item balances, voucher redemption, donation events. This keeps gas near zero and lets you change game rules without redeploying contracts.
2. **The backend is the only authority.** The client is hostile. Never let the app decide score, streak, reward or mint eligibility. The backend signs; contracts verify signatures.
3. **Assume every reward will be farmed.** Before building a mechanic that pays out, write down the cheapest attack (screen photos, stock photos, bot accounts, collusion, receipt sharing) and what blocks it. If you cannot name a block, do not ship the payout yet.
4. **Real-money flows stay small and auditable.** Sponsor vouchers and donations carry legal and reputational weight. Keep them behind escrow events and manual sponsor sign-off in v1.
5. **Verify chain facts against current docs** (chain IDs, RPC URLs, Avalanche L1 tooling, AA provider SDKs) before writing config. They change; do not rely on memory. Develop on Fuji testnet first.

## Recommended build order (vertical slices)

Build thin end-to-end slices rather than layer by layer. Each slice must be demoable.

| Slice | Deliverable | Reference |
|---|---|---|
| 0 | Repo, env, Docker (Postgres+pgvector, Redis), CI, auth with social login | `references/testing-and-deployment.md`, `references/api-security-privacy.md` |
| 1 | Camera -> upload -> AI judge -> score -> pet created (no chain) | `references/ai-judge-and-reid.md`, `references/mobile-client.md`, `references/api-security-privacy.md` |
| 2 | Pet garden, EXP, 24h Streak Fence, cron state machine, push notifications | `references/game-state.md`, `references/mobile-client.md` |
| 3 | Mint pets (ERC-721) + items (ERC-1155) with gasless wallet | `references/contracts-and-wallet.md`, `references/testing-and-deployment.md` (Fuji) |
| 4 | Lure/rescue (custodian) and crafting/swap | `references/game-state.md`, `references/contracts-and-wallet.md` |
| 5 | Proof-of-Paw 3-player consensus + honeypots + trust score | `references/anticheat-and-consensus.md` |
| 6 | Partner QR receipts, Sanctuary Stations, sponsor vouchers, charity escrow | `references/o2o-and-sponsors.md` |

Cross-cutting references, open them whenever the task touches them, whatever the slice:

- `references/mobile-client.md`: navigation, camera permissions, upload retries, offline behavior, push, accessibility, app-store rules.
- `references/api-security-privacy.md`: auth, authorization, idempotency, signed uploads, rate limits, secrets, privacy and photo deletion, observability, errors.
- `references/testing-and-deployment.md`: Docker setup, test layers, AI golden-set tests, contract tests, CI/CD, Fuji deployment, migrations and rollback.

Read only the references for the slice you are on. When the user asks to "build it all", do slices in order and stop to confirm after slice 2 and slice 4; these are the points where the design most often needs changes.

## Default stack (change only if the user states otherwise)

- **Client:** React Native (Expo, dev client) or Flutter; `react-native-vision-camera` / `camera` plugin for live capture; Phaser or PixiJS in a WebView for the 2D garden. Pick 2D for v1; 3D rigs multiply asset cost for little gain.
- **Backend:** FastAPI (Python) so the vision, embedding and cron code share a language; Postgres 16 + `pgvector`; Redis (timers, rate limits, matchmaking queues); WebSockets for pop-up quests; object storage (S3-compatible) for photos with signed URLs.
- **AI:** a multimodal model API for the judge with structured JSON output, plus an open image-embedding model (CLIP/SigLIP family) for re-ID. Keep model names in config, never in code paths.
- **Chain:** Avalanche C-Chain (Fuji for dev). Foundry or Hardhat, OpenZeppelin Contracts, ERC-4337 smart accounts via a provider (Thirdweb, Privy, Particle, etc.) with a paymaster. Consider a custom Avalanche L1 only after traffic justifies it.

## Core data model (start here)

```sql
users(id, auth_id, wallet_address, trust_score, created_at)
photos(id, user_id, storage_key, sha256, phash, gps_lat, gps_lng, device_attestation, captured_at, server_received_at)
judgments(id, photo_id, model, raw_json, is_live, total_score, theme_id, outcome)  -- outcome: rejected|exp|fragment|new_pet
pets(id, owner_id, custodian_id, species, breed, coat, stats_json, embedding vector(512), token_id NULL, minted_at NULL, last_checkin_at, fence_state)
pet_photos(pet_id, photo_id)            -- every accepted photo of that pet
items(user_id, item_type, qty)          -- off-chain mirror of ERC-1155
ledger(id, user_id, kind, amount, ref, created_at)   -- append-only points ledger
consensus_tasks(id, photo_id, requester_id, status, created_at)
consensus_votes(task_id, voter_id, vote, is_honeypot, voted_at)
qr_codes(id, partner_id, nonce, signature, issued_at, redeemed_by NULL, redeemed_at NULL)
```

Use an **append-only ledger** for all points. Balances are derived or cached. This makes fraud forensics and chain settlement straightforward.

## Capture pipeline (the spine of the product)

```
client capture -> attest -> upload -> backend checks -> AI judge -> re-ID -> outcome -> ledger/state -> (async) mint
```

1. **Client:** live camera only (no gallery picker). Attach device attestation (Play Integrity / App Attest), GPS, motion sensor sample, and client timestamp. Treat these as signals, not proof; a rooted device can fake them, so they feed risk scoring rather than hard gating.
2. **Backend pre-checks (cheap, before paying for AI):** attestation valid, rate limit, SHA-256 and perceptual-hash dedupe against all prior photos (not just the user's), EXIF/server-time skew, GPS plausibility vs. last photo (speed check).
3. **AI judge:** one call returns structured JSON. See `references/ai-judge-and-reid.md` for the schema and prompt rules.
4. **Re-ID:** embed the photo, query the user's pets by cosine distance, decide `same animal / new animal / not an animal`.
5. **Outcome:** apply the score bands (`<50` reject, `50-79` EXP or item fragment, `>=80` and new animal -> pet), write to ledger, update the fence timer.
6. **Mint asynchronously.** Never block the capture result on a transaction. Show the pet immediately as "pending" and mint in a queue.

## Things to tell the user honestly

Raise these early rather than after code exists; each can change the design:

- **Live-camera-only does not stop determined cheaters** (photographing a screen, or emulators). The judge's moire/screen detection, attestation and peer review are layered defenses, not guarantees.
- **Consensus voting pays 2 Kibble per vote, so it can be farmed.** Honeypots, trust-weighted voters, stake-or-cooldown and collusion checks are mandatory, not optional.
- **"Earn" mechanics may be regulated** as gambling, securities or promotions depending on country, and mixing minors, GPS and photos raises privacy duties. Recommend legal review before any token is tradable or any cash-equivalent reward exists. Starting with non-transferable points and sponsor-funded vouchers lowers this risk.
- **Photos of people and private property** will appear. Add face/person detection that rejects or blurs, and a takedown path.
- **Animal welfare:** never reward behavior that stresses animals (chasing, feeding wild animals, trespass). Put this in the judge prompt, theme design and onboarding copy.
- **The lure/steal mechanic can feel punitive.** Cap how often a pet can be lured, give the owner a grace window and notification, and make recovery always possible (rate decays, never reaches zero).

## Code quality rules for this project

- Idempotency keys on every reward, mint and redemption endpoint; retries must not double-pay.
- Wrap "check then update" flows (QR redeem, voucher claim) in a single atomic SQL statement or transaction with row locks.
- Contracts: minimal, OpenZeppelin-based, signature-gated mints (EIP-712), pausable, role-based. Write Foundry tests including replay, wrong-signer and expired-signature cases before any testnet deploy.
- Never store private keys in the repo; the minter/signer key lives in a KMS or secrets manager, with a rotation plan.
- Log every judge response (raw JSON, model, prompt version) so scoring disputes and prompt changes can be audited.
- Ship a metrics view early: judge cost per photo, reject rate, duplicate rate, consensus disagreement rate, honeypot fail rate, QR redemption rate.

## Output expectations

When asked to produce code, deliver runnable files in the structure `apps/mobile`, `apps/api`, `packages/contracts`, `apps/partner-web`, with a README that lists env vars and the commands to run each slice. When asked to design or plan, give the slice plan, the data model delta, the main attack paths and the open questions, not generic Web3 advice.
