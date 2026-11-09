# Anti-cheat and Proof-of-Paw Consensus

## Layered defenses (cheapest first)

1. Attestation + rate limits + per-device account caps
2. Hash/perceptual-hash dedupe across all users
3. Judge live-capture signals + metadata plausibility (GPS speed, timestamp skew, gyro motion)
4. Re-ID against the user's collection
5. Peer consensus, only for **redemption of real-world value**, not for every photo
6. Human moderator review for appeals and high-value cases

Score each photo with a risk number; send only medium-risk, high-value items to peers. This keeps peer cost and reward emissions low.

## Consensus flow

1. Player A requests redemption -> create `consensus_task`.
2. Matchmaker picks 3 online voters with: trust above threshold, not friends or same device/IP range as A, not recently paired with A, spread of regions if possible.
3. Voters get a modal with the photo (face-blurred), timer (e.g. 30s) and `Approve / Report`. Log time-to-vote.
4. Resolve at 2-of-3 (or 3-of-3 for high-value). If a voter times out, replace them.
5. Pay each voter only after resolution. Pay for agreement with the final outcome and for honeypot correctness, not for raw participation.

## Honeypots

Mix known-fake (screens, stock, AI-generated) and known-real items at about 10-20% of tasks. Voters who fail honeypots lose trust and payout; repeat failure removes eligibility. Rotate the honeypot set so it cannot be memorized, and never tell the voter which task was a honeypot until after they vote.

## Trust score

Inputs: honeypot accuracy, agreement with final outcomes, account age, device attestation, report-abuse rate. Use it to weight selection and payouts. Decay slowly so past good behavior is not permanent.

## Attacks to test explicitly

- Click-spam Approve for 2 Kibble (low honeypot catch rate -> raise honeypot rate for that voter)
- Collusion rings (cluster by shared devices, social graph, always-paired voters; randomize and cross-region)
- Voter reports honest photos to hurt a rival (track report precision)
- Sybil accounts farming votes (device caps, minimum account age, small stake or cooldown)
- Requester resubmits the same fake until a lenient trio appears (cap attempts, remember photo hash)

Reward emissions must stay below the sponsor value per verified redemption; model the unit economics in a spreadsheet before choosing the "2 Kibble" figure.
