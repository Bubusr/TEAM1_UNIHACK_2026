# PawVerse privacy baseline

This prototype does not accept real user data yet. Before enabling capture:

- Camera, location, device attestation, photos, embeddings, and notification tokens require explicit consent.
- Live camera capture is the only production capture path; the gallery is not a source of gameplay photos.
- Precise GPS is retained only for risk checks, then reduced or deleted according to the retention schedule.
- Originals, derivatives, embeddings, and account data must be deleted through the account-deletion job, subject to a minimal fraud audit record.
- Photos shown for peer verification must be face-blurred, downscaled, and served with short-lived URLs.
- No personal data, photos, GPS, or private keys may be written on-chain.

Production launch requires legal review for the countries served and a published retention schedule.

