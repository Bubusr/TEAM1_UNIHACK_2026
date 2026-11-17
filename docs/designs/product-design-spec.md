# PawVerse product design specification

## 1. Product contract

PawVerse turns a live photo of a real animal into a cared-for virtual pet.
Players protect pets with daily check-ins, grow a garden, earn non-transferable
Kibble, and later use verified ownership, partner rewards, peer review, and
charity impact features.

### Non-negotiable rules

- Live camera only; no gallery picker for reward-bearing captures.
- The backend calculates score, outcome, streak state, inventory, and rewards.
- A capture never rewards chasing, disturbing, feeding, or trespassing around
  an animal.
- Person faces and sensitive/private content are rejected or blurred before
  human review or storage.
- Kibble is an off-chain ledger balance until legal and economic review allows
  a transferable token.
- Blockchain transactions are asynchronous and never block the capture result.

## 2. Slice plan and status

| Slice | Demoable outcome | Primary surfaces | Status in current prototype |
|---|---|---|---|
| 0 | Sign in, consent, health checks, local services | Auth, consent, settings | Foundation scaffolded |
| 1 | Camera -> judge -> score -> first pet | Snap, result, pet created | Demo stub implemented |
| 2 | Care for pet and protect streak | Garden, pet modal, crop plot, shop | Demo implemented |
| 3 | Own pet and items on Fuji | Wallet, mint status, chain inventory | Designed |
| 4 | Visit, lure, rescue, craft, swap | Neighbor map, custody, crafting, escrow | Designed |
| 5 | Verify a redemption with peers | Consensus voter, trust, appeal | Designed |
| 6 | Connect venues, sponsors, shelters | QR, partner portal, voucher, impact | Designed |

## 3. Navigation and screen inventory

### Mobile shell

The bottom navigation has four destinations:

1. **Garden**: farm scene, pet, fence countdown, crop plot, barn, shop, lake.
2. **Snap**: live camera, daily theme, mission, upload state.
3. **Wallet**: Kibble, item inventory, chain ownership, mint queue.
4. **Profile**: account, privacy controls, consent, notification settings,
   deletion request, support.

Transient surfaces:

- Result sheet: rejected, EXP, fragment, or new pet.
- Pet detail sheet: stats, affection, actions, action caps.
- Animal list sheet: opened from the barn.
- Shop sheet: opened from the shop stall or wallet.
- Permission education sheet: camera, location, notifications.
- Error/retry sheet: explicit offline, expired, duplicate, or service errors.

### Partner and sponsor web

- Partner login and venue setup.
- Cashier QR generator with amount, expiry, print view, and redemption state.
- Partner stats: scans, unique players, shields, quests, discount unlocks.
- Sponsor campaign setup, voucher batch, approval queue, redemption metrics.
- Shelter onboarding, vetting, delivery confirmation, and impact ledger.

### Operations

- Admin user lookup and ban.
- Photo review and takedown.
- Judgment audit with model/prompt/version/raw result.
- Ledger correction workflow with reason and immutable audit event.
- Consensus queue, appeals, anomaly alerts, and contract pause controls.

## 4. Core user flows

### 4.1 Capture and adoption

```text
Snap
  -> camera permission education
  -> live preview + theme + welfare reminder
  -> capture metadata and attestation
  -> upload queue with retry
  -> cheap pre-checks
  -> AI judge JSON
  -> face/person and animal-welfare checks
  -> re-identification
  -> backend score and outcome
  -> result sheet
  -> pet/fence/ledger update
```

Failure states must distinguish:

- `permission_required`
- `offline_queued`
- `duplicate_capture`
- `timestamp_invalid`
- `not_an_animal`
- `person_detected`
- `unsafe_animal_interaction`
- `score_too_low`
- `service_unavailable`

### 4.2 Daily care

```text
Garden -> tap pet -> detail sheet -> feed/pet/play -> server response
Garden -> drag pet to lake -> drink interaction -> server response
Garden -> crop plot -> water -> grow -> food/inventory update
Garden -> barn -> animal list -> pet details
Garden -> shop stall -> shop sheet -> purchase -> ledger update
```

Actions show remaining daily caps before the user commits. The API returns
the updated pet, balance, and a user-readable event message.

### 4.3 Minting

```text
New pet result -> pending mint badge -> wallet connection/social account
  -> signer authorization -> async queue -> chain receipt
  -> metadata/token ownership sync -> wallet detail
```

Pending, failed, and minted states are visible. A failed mint never removes
the off-chain pet.

### 4.4 Lure, rescue, and custody

```text
Neighbor list -> vulnerable fence -> lure confirmation
  -> seeded server roll + caps + grace window
  -> custody update or failure
  -> owner notification
  -> rescue screen with cost cap and decaying odds
  -> deterministic result -> custody restored or cooldown
```

The UI must call this **lure/rescue**, not theft. Owners always retain a
recoverable path.

### 4.5 Proof-of-Paw

```text
Redemption request -> consensus task -> three eligible voters
  -> blurred photo + timer -> approve/report
  -> 2-of-3 or 3-of-3 resolution -> payout/trust update
  -> appeal queue for disputed or high-value results
```

Voters never see requester identity, exact location, or other unnecessary
personal data.

### 4.6 Partner, sponsor, and charity

```text
Cashier -> signed single-use QR -> player scans in app
  -> GPS radius + expiry + daily cap -> shield/quest/discount

Sponsor -> voucher campaign -> approval -> batch issuance
  -> player claim -> redemption -> shelter fulfilment
  -> ReliefEscrow event -> public impact ledger
```

## 5. Data model delta

The following extends the existing core tables. All reward and redemption
records are append-only or have an auditable status history.

```sql
daily_themes(
  id, prompt, welfare_copy, starts_at, ends_at, score_weights_json,
  active, created_by
)
achievements(id, code, name, description, reward_item, reward_amount)
user_achievements(user_id, achievement_id, unlocked_at)
upload_jobs(id, photo_id, status, attempts, next_retry_at, last_error)
judge_runs(id, photo_id, model, prompt_version, raw_json, cost_micros,
  validation_status, created_at)
pet_events(id, pet_id, user_id, kind, idempotency_key, payload_json, created_at)
fence_events(id, pet_id, from_state, to_state, reason, created_at)
notifications(id, user_id, kind, payload_json, sent_at, read_at)
wallets(id, user_id, provider, address, chain_id, created_at)
mint_jobs(id, pet_id, token_id, status, tx_hash, attempts, last_error)
chain_events(id, chain_id, tx_hash, log_index, event_name, payload_json)
neighbors(id, owner_id, visibility, region_code, last_seen_at)
lure_attempts(id, pet_id, actor_id, seed_commitment, result, cooldown_until)
custody_events(id, pet_id, from_user_id, to_user_id, reason, created_at)
recipes(id, code, inputs_json, output_json, enabled)
craft_jobs(id, user_id, recipe_id, idempotency_key, status, created_at)
swap_offers(id, maker_id, taker_id, maker_items_json, taker_items_json,
  expires_at, status, escrow_ref)
consensus_tasks(id, redemption_id, status, required_votes, resolution)
consensus_votes(id, task_id, voter_id, vote, is_honeypot, created_at)
trust_events(id, user_id, kind, delta, reference_id, created_at)
partners(id, name, venue, lat, lng, radius_m, status)
qr_codes(id, partner_id, nonce, signature, expires_at, redeemed_by, redeemed_at)
sponsor_campaigns(id, sponsor_id, rules_json, approval_status, starts_at, ends_at)
vouchers(id, campaign_id, item_id, status, claimed_by, redeemed_at)
shelters(id, name, vetting_status, delivery_contact)
relief_events(id, voucher_id, shelter_id, amount, status, tx_hash)
audit_events(id, actor_id, action, entity_type, entity_id, metadata_json, created_at)
```

## 6. API artifact

### Authentication and account

```text
POST /v1/auth/google
POST /v1/auth/apple
POST /v1/auth/refresh
DELETE /v1/account
GET /v1/me
POST /v1/consents
```

### Capture and judge

```text
POST /v1/uploads
POST /v1/captures/{capture_id}/submit
GET  /v1/captures/{capture_id}
GET  /v1/themes/today
GET  /v1/achievements
```

Every mutating request accepts `Idempotency-Key`. Uploads use short-lived
signed URLs and never expose object-store credentials to the app.

### Garden and economy

```text
GET  /v1/garden
POST /v1/pets/{pet_id}/interactions/{action}
POST /v1/pets/{pet_id}/drink
POST /v1/garden/purchase
POST /v1/garden/grow
GET  /v1/inventory
GET  /v1/ledger
GET  /v1/notifications
```

### Chain and custody

```text
POST /v1/wallet/link
GET  /v1/wallet
GET  /v1/pets/{pet_id}/mint
POST /v1/pets/{pet_id}/mint/retry
GET  /v1/neighbors
POST /v1/pets/{pet_id}/lure
POST /v1/pets/{pet_id}/rescue
POST /v1/crafting
POST /v1/swaps
POST /v1/swaps/{swap_id}/accept
```

### Consensus and partner ecosystem

```text
POST /v1/redemptions/{redemption_id}/consensus
GET  /v1/consensus/tasks/next
POST /v1/consensus/tasks/{task_id}/vote
POST /v1/consensus/tasks/{task_id}/appeal
POST /v1/partner/qr
POST /v1/partner/qr/{qr_id}/redeem
POST /v1/sponsors/campaigns
POST /v1/vouchers/{voucher_id}/claim
GET  /v1/impact
```

## 7. Contract artifact

### `PawPet` ERC-721

- EIP-712 `mintWithSig(to, metadataHash, nonce, deadline, signature)`.
- Signer role held by KMS-backed service; private key never enters mobile,
  CI, logs, or repository.
- `pause`, role separation, nonce replay protection, and token URI update
  policy.
- Events: `PetMinted`, `PetMetadataUpdated`, `CustodianUpdated`.

### `PawItems` ERC-1155

- Item IDs for seeds, food, bait, gear, fragments, and vouchers.
- Server-signed mint/burn or controlled operator role.
- Events: `ItemIssued`, `ItemBurned`, `VoucherRedeemed`.

### `ReliefEscrow`

- Holds sponsor-funded relief allocation.
- Releases only after approved fulfilment event.
- Event: `ReliefPackDonated(voucherId, shelterId, amount, reference)`.
- Pausable multisig admin and emergency withdrawal policy documented before
  deployment.

## 8. Trust, abuse, and safety matrix

| Attack or failure | Control | User-facing outcome |
|---|---|---|
| Screen photo or stock image | Live camera, attestation signal, moire check, duplicate hash, peer review | Clear rejection and retry guidance |
| Reward replay | Idempotency key, unique capture hash, append-only ledger | Existing result shown, no second reward |
| GPS spoofing | Speed plausibility, risk score, venue radius, device signals | Capture accepted for review or rejected |
| Face/private property | Detector before storage/review; blur or reject | Privacy-safe explanation |
| Pet action farming | Server caps, cooldowns, atomic ledger update | Remaining cap displayed |
| Consensus collusion | Trust threshold, device/IP clustering, pair-frequency checks | Task withheld, payout delayed |
| QR reuse | Signature, single-use row lock, expiry, radius and daily cap | Redemption declined with reason |
| Voucher abuse | Approval workflow, campaign rules, immutable redemption event | Manual review path |
| Lure harassment | Daily/repeated-target limits, grace window, rescue cap | Owner notification and guaranteed recovery path |
| Key compromise | KMS signer, multisig admin, pause switch, rotation plan | Minting paused without losing off-chain pets |

## 9. Acceptance criteria

### Slice 0

- A new user can sign in, see consent copy, revoke consent, and request
  deletion.
- API errors have stable codes, request IDs, structured logs, and no secrets.
- Local services start from the documented commands.

### Slice 1

- Gallery images cannot enter the reward flow.
- Result totals are calculated by the backend and match component sums.
- Duplicate, stale, unsafe, and non-animal captures have distinct outcomes.
- Offline capture retries do not duplicate rewards.

### Slice 2

- Fence state is computed from timestamps on read and reconciled by a worker.
- Pet actions respect caps atomically.
- Countdown, 20h/23h notifications, inventory, and streak milestones are
  visible and testable.

### Slice 3

- Mint replay, wrong signer, expired signature, and double mint tests pass.
- A failed chain transaction leaves the pet usable off-chain.
- Wallet ownership reconciles from indexed events.

### Slice 4

- Lure rolls are server-seeded, capped, auditable, and recoverable.
- Swaps are escrowed, expiring, and atomic for both sides.
- Crafting burns exact inputs once and produces the declared output.

### Slice 5

- Matchmaker excludes same device/IP range and requester acquaintances.
- Resolution handles 2-of-3, 3-of-3, timeout, replacement, honeypot, and
  appeal paths.
- Voters are paid only after resolution.

### Slice 6

- QR codes are signed, single-use, atomic, expiring, and radius checked.
- Sponsor vouchers require approval and produce an impact event.
- Shelter fulfilment is confirmed before public impact totals update.

## 10. Open questions before production

1. Which social-login wallet provider and paymaster will be used on Fuji?
2. Which jurisdictions and age groups are supported, and what reward/legal
   restrictions apply?
3. What is the retention period for original photos, GPS, embeddings, and
   audit logs?
4. Is Kibble permanently non-transferable, or does a regulated conversion path
   exist later?
5. Which vision model and embedding model meet the golden-set accuracy and
   cost target?
6. Which partner and shelter verification evidence is mandatory?
7. Which visual style assets are licensed or original before launch?
