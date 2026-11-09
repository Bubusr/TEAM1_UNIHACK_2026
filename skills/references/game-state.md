# Garden, Streak Fence, Lure and Rescue

## Fence state machine

States: `SHIELDED` (partner shield active) -> `SECURE` (checked in < 24h) -> `VULNERABLE` (>= 24h) -> `LURED` (custodian = another player) -> back to `SECURE` on rescue.

Rules:
- A valid check-in (judged photo >= 50, any pet of the user, not a duplicate) sets `last_checkin_at = server_now` and fence expiry to `+24h`. Use server time only.
- A cron/worker (every minute, or a delayed-job per pet) flips overdue fences to `VULNERABLE`. Make the flip idempotent and compute state from timestamps on read, so a missed cron run never causes wrong state.
- `shield_expires_at` from a partner QR overrides expiry for its duration.
- Send a push notification at 20h and 23h so loss is never a surprise.

## Lure rules (keep it fair)

- Only `VULNERABLE` pets can be lured. Cap: one lure per pet per 48h and per attacker daily limit.
- Lure consumes a bait item (burn ERC-1155 or decrement off-chain). Success probability is server-rolled with a stored seed for audit.
- **Ownership never changes.** Set `custodian_id`; owner keeps title. Custodian gets cosmetic visit rewards only, not the pet's EXP.
- Owner gets a push and a free grace rescue window (e.g. 12h) after the first lure.

## Rescue odds

```
rescue_rate = clamp(base - days_missed * decay, floor, 1.0)
rescue_cost = base_cost * (1 + days_missed * escalation)
```

Use a floor (for example 15%) and a cost cap so rescue is always possible. Offer a deterministic path (pay cost, or complete a quest) alongside the roll so players do not feel robbed by RNG.

## Pet growth

Interaction actions (feed, pet, play) change affection and EXP with daily caps. Coat colors from the judge map to rig palettes; keep rigs modular (body, ears, tail, pattern layer) so 12 species do not need 12 art pipelines.

## Crafting and swaps

Recipes in a server table (`fragments x N -> item`). Perform crafting off-chain by default; offer `burnToCraft` on-chain only for tradable results. P2P swap: escrowed two-sided offer with expiry, executed atomically (on-chain 1155 swap or a server-side transaction).
