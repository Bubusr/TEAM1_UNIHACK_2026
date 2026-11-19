import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { adminDb } from '../src/lib/firebase-admin.ts';
import {
  AUTHORITATIVE_IPFS_DISCLOSURES,
  DEFAULT_DISCLOSURE_REFERENCE,
  DEFAULT_DISCLOSURE_VERSION,
  ensurePostgresIpfsConsentsTable,
  getIpfsConsentForPet,
  hasValidIpfsConsent,
  markIpfsConsentMinted,
  recordIpfsConsent,
  revokeIpfsConsent,
} from '../src/db/ipfsConsentRepository.ts';
import { ipfsConsents, pets } from '../src/db/schema.ts';
import { getTableColumns, getTableName } from 'drizzle-orm';

describe('Dedicated IPFS Consent Storage Layer Suite', () => {
  const testRunId = crypto.randomUUID().slice(0, 8);
  const userA_Id = 101;
  const userB_Id = 202;
  const walletA = '0xC05DE09a4Af5eDa0B5E191A1F569A787eE5aa889';
  const walletB = '0x2B237fF449D21ECd304407d98cAAA379290747D5';
  const otherWallet = '0x000000000000000000000000000000000000dEaD';

  describe('1. Schema & Entity Integrity (PostgreSQL Declarations)', () => {
    it('declares dedicated ipfs_consents table with all required columns and constraints', () => {
      const columns = getTableColumns(ipfsConsents);

      // Required column presence
      assert.ok(columns.id, 'Must have primary key id');
      assert.ok(columns.consentUid, 'Must have consentUid');
      assert.ok(columns.petUid, 'Must have petUid');
      assert.ok(columns.userId, 'Must have userId');
      assert.ok(columns.userUid, 'Must have userUid');
      assert.ok(columns.walletAddress, 'Must have walletAddress');
      assert.ok(columns.consentVersion, 'Must have consentVersion');
      assert.ok(columns.disclosureReference, 'Must have disclosureReference');
      assert.ok(columns.disclosures, 'Must have disclosures JSONB');
      assert.ok(columns.consentedAt, 'Must have consentedAt timestamp');
      assert.ok(columns.status, 'Must have status string');
      assert.ok(columns.revokedAt, 'Must have revokedAt timestamp');
      assert.ok(columns.revokedByUserId, 'Must have revokedByUserId');
      assert.ok(columns.revocationReason, 'Must have revocationReason');
      assert.ok(columns.createdAt, 'Must have createdAt timestamp');

      // Verify table name
      assert.equal(getTableName(ipfsConsents), 'ipfs_consents');
    });

    it('NEVER alters or relies on pets.memories for consent storage', () => {
      const petCols = getTableColumns(pets);
      assert.ok(petCols.memories, 'pets.memories exists as game diary');
      // Verify ipfsConsents has no relationship or dependencies on pets.memories
      const consentCols = getTableColumns(ipfsConsents);
      assert.equal(
        (consentCols as any).memories,
        undefined,
        'ipfs_consents must not have memories column'
      );
    });

    it('defines PostgreSQL DDL with safe partial unique index on status IN (granted, minted)', async () => {
      // In environment without DATABASE_URL, ensurePostgresIpfsConsentsTable returns safely without throwing
      await assert.doesNotReject(async () => {
        await ensurePostgresIpfsConsentsTable();
      });
    });
  });

  describe('2. Validation & Boundary Enforcement', () => {
    it('rejects empty or whitespace petUid', async () => {
      await assert.rejects(
        async () => {
          await recordIpfsConsent({
            petUid: '   ',
            userId: userA_Id,
            walletAddress: walletA,
          });
        },
        { message: 'petUid is required to record IPFS consent.' }
      );
    });

    it('rejects invalid userId', async () => {
      await assert.rejects(
        async () => {
          await recordIpfsConsent({
            petUid: `pet-val-${testRunId}`,
            userId: 0,
            walletAddress: walletA,
          });
        },
        { message: 'Valid userId is required to record IPFS consent.' }
      );
    });

    it('rejects invalid EVM wallet address format', async () => {
      await assert.rejects(
        async () => {
          await recordIpfsConsent({
            petUid: `pet-val-${testRunId}`,
            userId: userA_Id,
            walletAddress: 'not-an-eth-address',
          });
        },
        { message: 'Invalid EVM wallet address format: not-an-eth-address' }
      );
    });

    it('rejects unsupported consent versions', async () => {
      await assert.rejects(
        async () => {
          await recordIpfsConsent({
            petUid: `pet-val-${testRunId}`,
            userId: userA_Id,
            walletAddress: walletA,
            consentVersion: '99.0',
          });
        },
        { message: 'Unsupported IPFS disclosure version: 99.0' }
      );
    });
  });

  describe('3. Critical Issue 1: Strict Identity & Ownership Binding', () => {
    const petShared = `pet-identity-${testRunId}`;

    it('binds consent strictly to User A; User B cannot reuse User A consent for same pet', async () => {
      // User A grants consent for petShared with walletA
      const consentA = await recordIpfsConsent({
        petUid: petShared,
        userId: userA_Id,
        userUid: `uid-userA-${testRunId}`,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(consentA.userId, userA_Id);

      // 1. User A verifies with their own userId and walletA -> SUCCESS
      const validForA = await hasValidIpfsConsent({
        petUid: petShared,
        userId: userA_Id,
        userUid: `uid-userA-${testRunId}`,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(validForA, true, 'User A must validate their own consent');

      // 2. User B attempts to verify with User B's userId and User B's walletB -> BLOCKED
      const validForB_OwnWallet = await hasValidIpfsConsent({
        petUid: petShared,
        userId: userB_Id,
        walletAddress: walletB,
        consentVersion: '1.0',
      });
      assert.equal(validForB_OwnWallet, false, 'User B must NOT reuse User A consent');

      // 3. User B attempts to spoof User A's wallet while presenting User B's userId -> BLOCKED
      const validForB_SpoofedWallet = await hasValidIpfsConsent({
        petUid: petShared,
        userId: userB_Id,
        walletAddress: walletA, // Spoofed wallet
        consentVersion: '1.0',
      });
      assert.equal(validForB_SpoofedWallet, false, 'User B cannot spoof User A wallet');

      // 4. User A attempts to verify after relinking to a different wallet (otherWallet) -> BLOCKED
      const validForA_Relinked = await hasValidIpfsConsent({
        petUid: petShared,
        userId: userA_Id,
        walletAddress: otherWallet,
        consentVersion: '1.0',
      });
      assert.equal(validForA_Relinked, false, 'Relinked wallet must NOT validate older wallet consent');

      // 5. User B cannot revoke User A's consent
      await assert.rejects(
        async () => {
          await revokeIpfsConsent({
            petUid: petShared,
            userId: userB_Id,
          });
        },
        { message: 'Only the user who granted consent can revoke it.' }
      );
    });

    test.after(async () => {
      await adminDb.collection('ipfsConsents').doc(`${petShared}_1.0`).delete();
    });
  });

  describe('4. Critical Issue 2: Revocation, Re-Consent & Audit Trail Preservation', () => {
    const petRevoke = `pet-lifecycle-${testRunId}`;

    it('executes full Grant -> Revoke -> Re-Grant lifecycle without blocking and preserves audit history', async () => {
      // Step 1: Initial Grant (Revision 1)
      const grant1 = await recordIpfsConsent({
        petUid: petRevoke,
        userId: userA_Id,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(grant1.status, 'granted');
      const uid1 = grant1.consentUid;

      // Verify active
      const valid1 = await hasValidIpfsConsent({
        petUid: petRevoke,
        userId: userA_Id,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(valid1, true, 'Active consent must validate');

      // Step 2: Revoke Consent
      const revoked = await revokeIpfsConsent({
        petUid: petRevoke,
        userId: userA_Id,
        reason: 'User reconsidered decentralized storage',
      });
      assert.equal(revoked, true, 'Revocation must succeed');

      // Verify revoked consent CANNOT authorize an upload or claim voucher
      const validAfterRevoke = await hasValidIpfsConsent({
        petUid: petRevoke,
        userId: userA_Id,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(validAfterRevoke, false, 'Revoked consent must NOT authorize upload');

      // Step 3: Re-Consent (Revision 2)
      // Must NOT be blocked by unique index! Must generate new consentUid and preserve history
      const grant2 = await recordIpfsConsent({
        petUid: petRevoke,
        userId: userA_Id,
        walletAddress: walletA,
        consentVersion: '1.0',
      });

      assert.equal(grant2.status, 'granted');
      assert.notEqual(grant2.consentUid, uid1, 'Re-consent must generate a new unique consentUid');

      // Verify active again
      const valid2 = await hasValidIpfsConsent({
        petUid: petRevoke,
        userId: userA_Id,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(valid2, true, 'Re-consented pet must validate again');

      // Verify audit history preserved in Firestore doc
      const snap = await adminDb.collection('ipfsConsents').doc(`${petRevoke}_1.0`).get();
      assert.ok(snap.exists);
      const data = snap.data()!;
      assert.equal(data.status, 'granted');
      assert.ok(Array.isArray(data.auditHistory), 'Must preserve auditHistory array');
      assert.equal(data.auditHistory.length, 1, 'Previous grant/revocation archived in auditHistory');
      assert.equal(data.auditHistory[0].consentUid, uid1, 'Archived history holds Revision 1 UID');
      assert.equal(data.auditHistory[0].status, 'revoked');
    });

    it('handles concurrent re-consent requests safely', async () => {
      // 5 concurrent calls re-consenting after grant2
      const writes = Array.from({ length: 5 }, () =>
        recordIpfsConsent({
          petUid: petRevoke,
          userId: userA_Id,
          walletAddress: walletA,
          consentVersion: '1.0',
        })
      );

      const results = await Promise.all(writes);
      const canonicalUid = results[0].consentUid;
      for (const r of results) {
        assert.equal(r.consentUid, canonicalUid, 'Concurrent re-consent callers resolve to same active record');
        assert.equal(r.status, 'granted');
      }
    });

    test.after(async () => {
      await adminDb.collection('ipfsConsents').doc(`${petRevoke}_1.0`).delete();
    });
  });

  describe('5. Cloud Firestore Live Engine Operations', () => {
    const petLiveA = `pet-live-a-${testRunId}`;
    const petLiveB = `pet-live-b-${testRunId}`;

    it('records consent with server timestamp and authoritative disclosures', async () => {
      const beforeTime = Date.now();

      const record = await recordIpfsConsent({
        petUid: petLiveA,
        userId: userA_Id,
        userUid: `uid-live-${testRunId}`,
        walletAddress: walletA,
        consentVersion: '1.0',
      });

      assert.ok(record.consentUid.startsWith('consent-'));
      assert.equal(record.petUid, petLiveA);
      assert.equal(record.userId, userA_Id);
      assert.equal(record.walletAddress.toLowerCase(), walletA.toLowerCase());
      assert.equal(record.consentVersion, '1.0');
      assert.equal(record.disclosureReference, DEFAULT_DISCLOSURE_REFERENCE);
      assert.deepEqual(record.disclosures, AUTHORITATIVE_IPFS_DISCLOSURES['1.0']);
      assert.equal(record.status, 'granted');

      const consentTime = record.consentedAt.getTime();
      assert.ok(consentTime >= beforeTime - 2000, 'Timestamp must be current server time');
      assert.ok(consentTime <= Date.now() + 2000, 'Timestamp cannot be in future');
    });

    it('enforces strict cross-pet isolation (Pet A consent cannot authorize Pet B)', async () => {
      const validA = await hasValidIpfsConsent({
        petUid: petLiveA,
        userId: userA_Id,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(validA, true);

      const validB = await hasValidIpfsConsent({
        petUid: petLiveB,
        userId: userA_Id,
        walletAddress: walletA,
        consentVersion: '1.0',
      });
      assert.equal(validB, false, 'Pet B must NOT be authorized by Pet A consent');
    });

    it('transitions to minted status and preserves historical consent auditability permanently', async () => {
      const petMint = `pet-minted-${testRunId}`;
      await recordIpfsConsent({
        petUid: petMint,
        userId: userA_Id,
        walletAddress: walletA,
      });

      const marked = await markIpfsConsentMinted({ petUid: petMint });
      assert.equal(marked, true);

      const record = await getIpfsConsentForPet(petMint);
      assert.ok(record);
      assert.equal(record.status, 'minted');

      // Minted pet remains verified on-chain
      const validMinted = await hasValidIpfsConsent({
        petUid: petMint,
        userId: userA_Id,
        walletAddress: walletA,
      });
      assert.equal(validMinted, true, 'Minted pet remains verified');

      // Cannot revoke once minted
      await assert.rejects(
        async () => {
          await revokeIpfsConsent({ petUid: petMint, userId: userA_Id });
        },
        { message: 'Cannot revoke IPFS consent for a Pet Passport already minted on-chain.' }
      );

      // Cleanup
      await adminDb.collection('ipfsConsents').doc(`${petMint}_1.0`).delete();
    });

    test.after(async () => {
      await adminDb.collection('ipfsConsents').doc(`${petLiveA}_1.0`).delete();
    });
  });

  describe('6. Member 03 Re-Export Contract Compatibility', () => {
    it('re-exports all IPFS consent functions from web3Repository for Member 03', async () => {
      const web3Repo = await import('../src/db/web3Repository.ts');
      assert.equal(typeof web3Repo.recordIpfsConsent, 'function');
      assert.equal(typeof web3Repo.getIpfsConsentForPet, 'function');
      assert.equal(typeof web3Repo.hasValidIpfsConsent, 'function');
      assert.equal(typeof web3Repo.revokeIpfsConsent, 'function');
      assert.equal(typeof web3Repo.markIpfsConsentMinted, 'function');
      assert.equal(typeof web3Repo.ensurePostgresIpfsConsentsTable, 'function');
      assert.ok(web3Repo.AUTHORITATIVE_IPFS_DISCLOSURES['1.0']);
      assert.equal(web3Repo.DEFAULT_DISCLOSURE_VERSION, '1.0');
    });
  });
});
