# Mobile Client: Navigation, Camera, Offline, Push, Accessibility, Store Rules

Default: React Native with Expo (dev client, not Expo Go, because camera, attestation and wallet SDKs need native modules). If the user chose Flutter, keep the same structure and swap in the equivalent packages.

## Project structure

```
apps/mobile/src/
  app/            routes (Expo Router) or navigators
  features/       capture/ garden/ neighbors/ inventory/ verify/ scan/ wallet/
  services/       api client, ws client, storage, push, attestation
  state/          server cache (TanStack Query) + small local store (Zustand)
  ui/             design tokens, shared components
```

Keep server state in a query cache and only UI state in the local store. Never duplicate scores, streaks or balances locally as the source of truth.

## Navigation

- Bottom tabs: **Garden**, **Snap** (center, prominent), **Neighbors**, **Bag**, **Profile**.
- Modal stacks for: capture result, pet detail, rescue screen, QR scanner, Proof-of-Paw vote.
- The Proof-of-Paw pop-up must be a modal that can be dismissed without penalty; it must never interrupt an active capture or a result screen (queue it until the user is idle).
- Deep links: `pawverse://pet/:id`, `pawverse://rescue/:petId`, `pawverse://station/:partnerId`. Handle cold-start and logged-out links by storing the target and resuming after login.

## Camera and permissions

- Use a live-capture library (for example `react-native-vision-camera`). Do not render any gallery picker; also do not accept photos shared into the app from other apps.
- Ask for permission in context: show a one-screen explanation ("PawVerse needs the camera to capture real animals") before the system prompt. Handle all states: undetermined, denied, denied-permanently (deep link to settings), restricted.
- Location: request "while using the app" only. Never request background location. Degrade gracefully: if denied, the user can still capture but cannot use venue features, and risk scoring treats missing GPS as neutral-high.
- Capture then compress on device (long edge ~1280-1600px, JPEG quality ~80); strip nothing needed by the backend, but do not upload more metadata than the privacy policy states.
- Show a clear "analyzing" state; the judge can take seconds. Allow the user to leave the screen and receive the result as a notification and in-app inbox item.
- Handle lifecycle: app backgrounded during capture, camera interrupted by a call, low storage, low light (suggest flash), thermal throttling.

## Upload with retries and offline behavior

1. Write each capture to a local durable queue (SQLite/MMKV) with a client-generated `capture_id` (UUID). This is also the idempotency key.
2. Request a signed upload URL, upload the file, then call `POST /captures/:capture_id/submit`. Each step is resumable and safe to repeat.
3. Retry with exponential backoff and jitter (for example 2s, 4s, 8s, up to ~5 attempts), then park the item as "waiting for network" and retry on connectivity change or app foreground.
4. Server rejects stale captures (client time skew or captured too long ago); show an honest message rather than silently dropping.
5. Offline: camera works and queues; garden shows last known state with a "last updated" label; actions that need the server (lure, rescue, redeem, vote, QR) are disabled with an explanation, never queued blindly, because they depend on live state and fairness.
6. Show the queue to the user (pending, uploading, failed with retry button). A silent failed upload loses a streak day and kills trust.
7. Streak timing is server-decided from the server-received time; tell users that, and consider a short grace window for uploads that were captured before expiry but queued offline (with the capture's attestation and timestamp checked).

## Push notifications

- Use FCM (Android) and APNs (iOS) via a single provider SDK; store tokens per device, remove on logout and on provider "invalid token" errors.
- Notification types: fence expiring (20h, 23h), pet lured, rescue result, Proof-of-Paw task, shield expiring, voucher approved, donation confirmed, daily theme.
- Per-type toggles and quiet hours in settings. Cap marketing-style pushes; only the fence and lure alerts are "important".
- Payloads carry ids only, not sensitive data; the app fetches details after opening.
- Ask for permission after the first successful capture (when value is clear), not at first launch.

## Real-time (WebSocket)

Reconnect with backoff, resubscribe on reconnect, heartbeat, and always treat the socket as a hint: after reconnect, fetch authoritative state over REST. Pop-up quests carry an expiry; if the user opens it after expiry, show "expired" rather than an error.

## Accessibility

- Every control has an accessibility label; the camera shutter, timer and result score are announced.
- Support dynamic type (no fixed-height text), minimum 44x44pt touch targets, contrast ratio at least 4.5:1, and a non-color cue for fence states (icon + text, not only red/green).
- Screen reader flow for capture: announce the active theme, "photo captured", and the result summary in text; do not rely on animations to convey outcome.
- Respect "reduce motion": replace garden animations and confetti with static states.
- Provide haptic and visual alternatives for sound cues; captions for any video.
- Timed actions (vote timer, rescue window) need extendable or generous limits, and clear remaining-time announcements.
- Test with VoiceOver and TalkBack on real devices at least once per release.

## App store and platform requirements

Check current Apple and Google policies before submission; they change.

- **Permissions strings:** accurate camera, location and notification purpose text.
- **Privacy disclosures:** App Store privacy labels and Google Play Data safety form must match actual collection (photos, precise location, device identifiers, purchases, user content).
- **Account deletion:** an in-app deletion path is required on both stores when accounts can be created in-app; it must also trigger photo, embedding and wallet-link deletion (see `api-security-privacy.md`).
- **User-generated content:** photos are seen by other users in voting, so provide reporting, blocking and moderation, and a way to contact the developer.
- **Payments:** if players can buy vouchers, tokens or items with real money, check in-app purchase rules and whether digital goods must use platform billing; physical goods and donations have different rules. Get this reviewed before building a purchase flow.
- **Crypto features:** both stores have rules for NFTs, tokens and wallets (for example restrictions on mining, unlocking features by owning NFTs, and requirements in some regions). Keep v1 free of token-gated features and of sale of tokens inside the app, and read current policy.
- **Age rating and minors:** decide the minimum age, add an age gate, and apply stricter handling for children's data if minors are allowed.
- **Reviewer access:** provide a test account, a script for the camera (reviewers cannot photograph pets easily; offer a documented test-mode path that is disabled in production builds), and notes about location features.
- Release hygiene: staged rollout, crash reporting, minimum supported OS versions, forced-update endpoint for breaking API changes.
