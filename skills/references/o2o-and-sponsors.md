# Partner Venues, QR Receipts and Sponsors

## Single-use receipt QR

Payload: `partner_id | receipt_id | issued_at | nonce | expires_at | signature` (Ed25519 or HMAC with a server key). Keep payload short and QR error correction at medium or higher.

Redeem atomically so two players cannot both win:

```sql
UPDATE qr_codes
SET redeemed_by = :user, redeemed_at = now()
WHERE id = :id AND redeemed_at IS NULL AND expires_at > now()
RETURNING partner_id;
```

If zero rows return, it was already used or expired. Then grant the shield and quest unlock in the same transaction.

Receipt-sharing in group chats is the main attack: also require GPS within a radius of the venue, and a per-user per-venue daily cap. Verify with the venue that codes are issued only against paid bills; consider a one-code-per-bill cashier flow in the partner mini-app.

## Partner mini-app (web)

Cashier logs in -> enters bill amount or id -> gets a QR to print or show. Weekly dashboard: scans, unique players, repeat visits, estimated redemptions. Keep it a plain responsive web page; cashiers will not install apps.

## Sponsor dashboard

Brand creates a voucher batch (SKU, count, expiry, region), defines redemption rules ("10 vouchers = 5 kg to Shelter Y"), views engagement, and confirms fulfilment. Each rule maps to a row the escrow contract and backend both read. Require brand approval before a rule can go live, and publish proof (event, shelter receipt) per donation.

## Verifiable-impact principles

- Do not claim a donation until fulfilment is confirmed by the shelter.
- Show a public ledger page (voucher redeemed -> pack sent -> shelter confirmed).
- Vet shelters (registration, contact, photos) before listing them.
- Keep brand money and player points separate in accounting; vouchers are the bridge, never raw token-to-cash conversion in v1.
