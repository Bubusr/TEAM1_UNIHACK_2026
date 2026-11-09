# Signer key plan

The backend signer key will be generated and held by a KMS or HSM. It must never be exported to application code, mobile builds, logs, or CI artifacts.

Rotation plan:

1. Add the new signer role on-chain.
2. Deploy the new signer service and verify a Fuji test mint.
3. Revoke the old signer role.
4. Record the change in the audit log and alert on unexpected signer use.

Local development uses a fake identifier only; it cannot sign production transactions.

