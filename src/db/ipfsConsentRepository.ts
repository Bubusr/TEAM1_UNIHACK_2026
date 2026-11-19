import crypto from 'node:crypto';
import { and, eq, or } from 'drizzle-orm';
import { ethers } from 'ethers';
import { db, createPool } from './index.ts';
import { adminDb } from '../lib/firebase-admin.ts';
import { ipfsConsents } from './schema.ts';

/**
 * Server-authoritative IPFS disclosure catalog.
 * The backend owns the exact legal disclosures associated with each version.
 */
export const AUTHORITATIVE_IPFS_DISCLOSURES: Record<string, string[]> = {
  '1.0': [
    'public_ipfs_storage',
    'public_nft_metadata',
    'decentralized_permanence',
    'no_deletion_guarantee',
  ],
};

export const DEFAULT_DISCLOSURE_VERSION = '1.0';
export const DEFAULT_DISCLOSURE_REFERENCE = 'paws-ipfs-disclosure-v1.0';

export interface IpfsConsentRecord {
  id?: number | string;
  consentUid: string;
  petUid: string;
  userId: number;
  userUid?: string;
  walletAddress: string;
  consentVersion: string;
  disclosureReference: string;
  disclosures: string[];
  consentedAt: Date;
  status: 'granted' | 'revoked' | 'minted';
  revokedAt?: Date | null;
  revokedByUserId?: number | null;
  revocationReason?: string | null;
  auditHistory?: Array<{
    consentUid: string;
    userId: number;
    walletAddress: string;
    consentedAt: string;
    status: string;
    revokedAt?: string | null;
    supersededAt?: string;
  }>;
  createdAt: Date;
}

export interface CreateIpfsConsentParams {
  petUid: string;
  userId: number;
  userUid?: string;
  walletAddress: string;
  consentVersion?: string;
  disclosureReference?: string;
  disclosures?: string[];
  consentedAt?: Date;
}

export interface VerifyIpfsConsentParams {
  petUid: string;
  userId: number;
  userUid?: string;
  walletAddress: string;
  consentVersion?: string;
}

let _pgTableEnsured = false;

/**
 * Ensures the dedicated `ipfs_consents` PostgreSQL table and unique constraints exist.
 * Safe for multi-tenant and runtime initialization with race condition protection.
 */
export async function ensurePostgresIpfsConsentsTable(): Promise<void> {
  if (_pgTableEnsured || !process.env.DATABASE_URL) return;

  const pool = createPool();
  const ddl = `
    CREATE TABLE IF NOT EXISTS ipfs_consents (
      id SERIAL PRIMARY KEY,
      consent_uid TEXT NOT NULL UNIQUE,
      pet_uid TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_uid TEXT,
      wallet_address TEXT NOT NULL,
      consent_version TEXT NOT NULL,
      disclosure_reference TEXT NOT NULL,
      disclosures JSONB NOT NULL,
      consented_at TIMESTAMP NOT NULL,
      status TEXT NOT NULL DEFAULT 'granted',
      revoked_at TIMESTAMP,
      revoked_by_user_id INTEGER,
      revocation_reason TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ipfs_consents_active_pet_version_unique
      ON ipfs_consents (pet_uid, consent_version)
      WHERE status IN ('granted', 'minted');
    CREATE INDEX IF NOT EXISTS ipfs_consents_pet_idx ON ipfs_consents (pet_uid);
    CREATE INDEX IF NOT EXISTS ipfs_consents_user_idx ON ipfs_consents (user_id);
    CREATE INDEX IF NOT EXISTS ipfs_consents_wallet_idx ON ipfs_consents (wallet_address);
  `;

  try {
    await pool.query(ddl);
    _pgTableEnsured = true;
  } catch (err: any) {
    if (err && (err.code === '42P07' || err.code === '42710' || err.code === '23505')) {
      _pgTableEnsured = true;
      return;
    }
    throw err;
  }
}

function normalizeWallet(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    throw new Error('Wallet address is required for IPFS consent.');
  }
  try {
    return ethers.getAddress(trimmed);
  } catch {
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    throw new Error(`Invalid EVM wallet address format: ${trimmed}`);
  }
}

function parseConsentDocDate(val: unknown): Date {
  if (val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Persists an explicit, server-authoritative IPFS consent record.
 * Guarantees identity binding, idempotency, and audit history preservation across revocations and re-consents.
 * NEVER writes to `pets.memories`.
 */
export async function recordIpfsConsent(
  params: CreateIpfsConsentParams
): Promise<IpfsConsentRecord> {
  const cleanPetUid = (params.petUid || '').trim();
  if (!cleanPetUid) {
    throw new Error('petUid is required to record IPFS consent.');
  }

  const cleanUserId = Number(params.userId);
  if (!Number.isFinite(cleanUserId) || cleanUserId <= 0) {
    throw new Error('Valid userId is required to record IPFS consent.');
  }

  const cleanWallet = normalizeWallet(params.walletAddress);
  const cleanVersion = (params.consentVersion || DEFAULT_DISCLOSURE_VERSION).trim();

  const authoritativeDisclosures = AUTHORITATIVE_IPFS_DISCLOSURES[cleanVersion];
  if (!authoritativeDisclosures) {
    throw new Error(`Unsupported IPFS disclosure version: ${cleanVersion}`);
  }

  const cleanReference = (
    params.disclosureReference || `${DEFAULT_DISCLOSURE_REFERENCE}`
  ).trim();

  // Server-authoritative timestamp: defaults to Date.now()
  const serverConsentedAt = params.consentedAt ?? new Date();

  // 1. Cloud Firestore implementation
  if (!process.env.DATABASE_URL) {
    const docId = `${cleanPetUid}_${cleanVersion}`;
    const docRef = adminDb.collection('ipfsConsents').doc(docId);

    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);

      if (snap.exists) {
        const d = snap.data()!;

        // Idempotency: exact same user, exact same wallet, already active (granted or minted)
        if (
          (d.status === 'granted' || d.status === 'minted') &&
          Number(d.userId) === cleanUserId &&
          String(d.walletAddress).toLowerCase() === cleanWallet.toLowerCase()
        ) {
          return {
            id: snap.id,
            consentUid: d.consentUid || snap.id,
            petUid: d.petUid,
            userId: Number(d.userId || cleanUserId),
            userUid: d.userUid || params.userUid,
            walletAddress: d.walletAddress,
            consentVersion: d.consentVersion,
            disclosureReference: d.disclosureReference,
            disclosures: d.disclosures || authoritativeDisclosures,
            consentedAt: parseConsentDocDate(d.consentedAt),
            status: d.status,
            revokedAt: d.revokedAt ? parseConsentDocDate(d.revokedAt) : null,
            revokedByUserId: d.revokedByUserId || null,
            revocationReason: d.revocationReason || null,
            auditHistory: d.auditHistory || [],
            createdAt: parseConsentDocDate(d.createdAt),
          };
        }

        if (d.status === 'minted') {
          throw new Error('Pet Passport is already minted on-chain; active consent cannot be modified.');
        }

        // Re-consent after revocation OR re-binding for new owner/wallet:
        // Archive previous state to auditHistory to preserve immutable legal audit trail!
        const auditHistory = Array.isArray(d.auditHistory) ? [...d.auditHistory] : [];
        auditHistory.push({
          consentUid: d.consentUid,
          userId: Number(d.userId),
          userUid: d.userUid || null,
          walletAddress: d.walletAddress,
          consentVersion: d.consentVersion,
          consentedAt: d.consentedAt,
          status: d.status,
          revokedAt: d.revokedAt || null,
          supersededAt: new Date().toISOString(),
        });

        const newConsentUid = `consent-${crypto.randomUUID()}`;
        const updatedRecord = {
          consentUid: newConsentUid,
          petUid: cleanPetUid,
          userId: cleanUserId,
          userUid: params.userUid || null,
          walletAddress: cleanWallet,
          consentVersion: cleanVersion,
          disclosureReference: cleanReference,
          disclosures: authoritativeDisclosures,
          consentedAt: serverConsentedAt.toISOString(),
          status: 'granted' as const,
          revokedAt: null,
          revokedByUserId: null,
          revocationReason: null,
          auditHistory,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        tx.set(docRef, updatedRecord, { merge: true });

        return {
          id: docId,
          consentUid: newConsentUid,
          petUid: cleanPetUid,
          userId: cleanUserId,
          userUid: params.userUid,
          walletAddress: cleanWallet,
          consentVersion: cleanVersion,
          disclosureReference: cleanReference,
          disclosures: authoritativeDisclosures,
          consentedAt: serverConsentedAt,
          status: 'granted',
          auditHistory,
          createdAt: parseConsentDocDate(d.createdAt),
        };
      }

      // Initial first-time consent grant
      const consentUid = `consent-${crypto.randomUUID()}`;
      const recordData = {
        consentUid,
        petUid: cleanPetUid,
        userId: cleanUserId,
        userUid: params.userUid || null,
        walletAddress: cleanWallet,
        consentVersion: cleanVersion,
        disclosureReference: cleanReference,
        disclosures: authoritativeDisclosures,
        consentedAt: serverConsentedAt.toISOString(),
        status: 'granted' as const,
        auditHistory: [],
        createdAt: new Date().toISOString(),
      };

      tx.set(docRef, recordData, { merge: true });

      return {
        id: docId,
        consentUid,
        petUid: cleanPetUid,
        userId: cleanUserId,
        userUid: params.userUid,
        walletAddress: cleanWallet,
        consentVersion: cleanVersion,
        disclosureReference: cleanReference,
        disclosures: authoritativeDisclosures,
        consentedAt: serverConsentedAt,
        status: 'granted',
        auditHistory: [],
        createdAt: new Date(),
      };
    });
  }

  // 2. PostgreSQL implementation
  await ensurePostgresIpfsConsentsTable();

  return await db.transaction(async (tx) => {
    // 1. Check if an active (granted or minted) consent already exists for this (petUid, consentVersion)
    const [active] = await tx
      .select()
      .from(ipfsConsents)
      .where(
        and(
          eq(ipfsConsents.petUid, cleanPetUid),
          eq(ipfsConsents.consentVersion, cleanVersion),
          or(
            eq(ipfsConsents.status, 'granted'),
            eq(ipfsConsents.status, 'minted')
          )
        )
      )
      .limit(1);

    if (active) {
      // Idempotency: exact same user, exact same wallet, already active
      if (
        active.userId === cleanUserId &&
        active.walletAddress.toLowerCase() === cleanWallet.toLowerCase()
      ) {
        return {
          id: active.id,
          consentUid: active.consentUid,
          petUid: active.petUid,
          userId: active.userId,
          userUid: active.userUid || undefined,
          walletAddress: active.walletAddress,
          consentVersion: active.consentVersion,
          disclosureReference: active.disclosureReference,
          disclosures: active.disclosures,
          consentedAt: active.consentedAt,
          status: active.status as 'granted' | 'revoked' | 'minted',
          revokedAt: active.revokedAt,
          revokedByUserId: active.revokedByUserId,
          revocationReason: active.revocationReason,
          createdAt: active.createdAt,
        };
      }

      if (active.status === 'minted') {
        throw new Error('Pet Passport is already minted on-chain; active consent cannot be modified.');
      }

      // Owner changed or wallet relinked: supersede active unminted consent
      await tx
        .update(ipfsConsents)
        .set({
          status: 'revoked',
          revokedAt: new Date(),
          revocationReason: `Superseded by new consent from user ${cleanUserId} / wallet ${cleanWallet}`,
        })
        .where(eq(ipfsConsents.id, active.id));
    }

    const consentUid = `consent-${crypto.randomUUID()}`;

    // 2. Insert new consent record.
    // The partial unique index guarantees that only ONE row with status IN ('granted', 'minted')
    // can exist per (pet_uid, consent_version). Historical revoked rows remain preserved!
    const [inserted] = await tx
      .insert(ipfsConsents)
      .values({
        consentUid,
        petUid: cleanPetUid,
        userId: cleanUserId,
        userUid: params.userUid || null,
        walletAddress: cleanWallet,
        consentVersion: cleanVersion,
        disclosureReference: cleanReference,
        disclosures: authoritativeDisclosures,
        consentedAt: serverConsentedAt,
        status: 'granted',
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      return {
        id: inserted.id,
        consentUid: inserted.consentUid,
        petUid: inserted.petUid,
        userId: inserted.userId,
        userUid: inserted.userUid || undefined,
        walletAddress: inserted.walletAddress,
        consentVersion: inserted.consentVersion,
        disclosureReference: inserted.disclosureReference,
        disclosures: inserted.disclosures,
        consentedAt: inserted.consentedAt,
        status: inserted.status as 'granted' | 'revoked' | 'minted',
        createdAt: inserted.createdAt,
      };
    }

    // Handled duplicate concurrent race: reload canonical active record
    const [canonical] = await tx
      .select()
      .from(ipfsConsents)
      .where(
        and(
          eq(ipfsConsents.petUid, cleanPetUid),
          eq(ipfsConsents.consentVersion, cleanVersion),
          or(
            eq(ipfsConsents.status, 'granted'),
            eq(ipfsConsents.status, 'minted')
          )
        )
      )
      .limit(1);

    if (!canonical) {
      throw new Error('Failed to resolve or insert IPFS consent record.');
    }

    return {
      id: canonical.id,
      consentUid: canonical.consentUid,
      petUid: canonical.petUid,
      userId: canonical.userId,
      userUid: canonical.userUid || undefined,
      walletAddress: canonical.walletAddress,
      consentVersion: canonical.consentVersion,
      disclosureReference: canonical.disclosureReference,
      disclosures: canonical.disclosures,
      consentedAt: canonical.consentedAt,
      status: canonical.status as 'granted' | 'revoked' | 'minted',
      createdAt: canonical.createdAt,
    };
  });
}

/**
 * Retrieves the active IPFS consent record strictly partitioned by petUid.
 * Ensures cross-pet isolation: Pet A consent can never be resolved for Pet B.
 */
export async function getIpfsConsentForPet(
  petUid: string,
  consentVersion?: string
): Promise<IpfsConsentRecord | null> {
  const cleanPetUid = (petUid || '').trim();
  if (!cleanPetUid) return null;

  const version = consentVersion?.trim();

  // 1. Cloud Firestore
  if (!process.env.DATABASE_URL) {
    if (version) {
      const docRef = adminDb.collection('ipfsConsents').doc(`${cleanPetUid}_${version}`);
      const snap = await docRef.get();
      if (!snap.exists) return null;
      const d = snap.data()!;
      return {
        id: snap.id,
        consentUid: d.consentUid || snap.id,
        petUid: d.petUid,
        userId: Number(d.userId || 0),
        userUid: d.userUid || undefined,
        walletAddress: d.walletAddress,
        consentVersion: d.consentVersion,
        disclosureReference: d.disclosureReference,
        disclosures: d.disclosures || [],
        consentedAt: parseConsentDocDate(d.consentedAt),
        status: d.status,
        revokedAt: d.revokedAt ? parseConsentDocDate(d.revokedAt) : null,
        revokedByUserId: d.revokedByUserId || null,
        revocationReason: d.revocationReason || null,
        auditHistory: d.auditHistory || [],
        createdAt: parseConsentDocDate(d.createdAt),
      };
    }

    const q = await adminDb
      .collection('ipfsConsents')
      .where('petUid', '==', cleanPetUid)
      .limit(5)
      .get();

    if (q.empty) return null;

    // Pick most recent active consent
    const docs = q.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          consentUid: d.consentUid || doc.id,
          petUid: d.petUid,
          userId: Number(d.userId || 0),
          userUid: d.userUid || undefined,
          walletAddress: d.walletAddress,
          consentVersion: d.consentVersion,
          disclosureReference: d.disclosureReference,
          disclosures: d.disclosures || [],
          consentedAt: parseConsentDocDate(d.consentedAt),
          status: d.status as 'granted' | 'revoked' | 'minted',
          revokedAt: d.revokedAt ? parseConsentDocDate(d.revokedAt) : null,
          revokedByUserId: d.revokedByUserId || null,
          revocationReason: d.revocationReason || null,
          auditHistory: d.auditHistory || [],
          createdAt: parseConsentDocDate(d.createdAt),
        };
      })
      .filter((r) => r.status === 'granted' || r.status === 'minted')
      .sort((a, b) => b.consentedAt.getTime() - a.consentedAt.getTime());

    return docs[0] ?? null;
  }

  // 2. PostgreSQL
  await ensurePostgresIpfsConsentsTable();

  const query = version
    ? db
        .select()
        .from(ipfsConsents)
        .where(
          and(
            eq(ipfsConsents.petUid, cleanPetUid),
            eq(ipfsConsents.consentVersion, version)
          )
        )
        .limit(1)
    : db
        .select()
        .from(ipfsConsents)
        .where(eq(ipfsConsents.petUid, cleanPetUid))
        .limit(10);

  const rows = await query;
  if (!rows || rows.length === 0) return null;

  const active = rows
    .filter((r) => r.status === 'granted' || r.status === 'minted')
    .sort((a, b) => b.consentedAt.getTime() - a.consentedAt.getTime());

  const record = active[0];
  if (!record) return null;

  return {
    id: record.id,
    consentUid: record.consentUid,
    petUid: record.petUid,
    userId: record.userId,
    userUid: record.userUid || undefined,
    walletAddress: record.walletAddress,
    consentVersion: record.consentVersion,
    disclosureReference: record.disclosureReference,
    disclosures: record.disclosures,
    consentedAt: record.consentedAt,
    status: record.status as 'granted' | 'revoked' | 'minted',
    revokedAt: record.revokedAt,
    revokedByUserId: record.revokedByUserId,
    revocationReason: record.revocationReason,
    createdAt: record.createdAt,
  };
}

/**
 * Authoritative predicate checking whether a pet has valid, unrevoked consent
 * matching the authenticated user identity, verified linked wallet, and version.
 * Prevents User B from reusing User A's consent.
 */
export async function hasValidIpfsConsent(
  params: VerifyIpfsConsentParams
): Promise<boolean> {
  const cleanPetUid = (params.petUid || '').trim();
  if (!cleanPetUid) return false;

  const cleanUserId = Number(params.userId);
  if (!Number.isFinite(cleanUserId) || cleanUserId <= 0) return false;

  let cleanWallet: string;
  try {
    cleanWallet = normalizeWallet(params.walletAddress);
  } catch {
    return false;
  }

  const record = await getIpfsConsentForPet(cleanPetUid, params.consentVersion);
  if (!record) return false;

  // 1. Strict cross-pet isolation
  if (record.petUid !== cleanPetUid) return false;

  // 2. Strict user identity binding: User B cannot reuse User A's consent
  if (record.userId !== cleanUserId) return false;

  // 3. Strict Firebase UID matching if provided
  if (params.userUid && record.userUid && record.userUid !== params.userUid) {
    return false;
  }

  // 4. Strict wallet matching: relinked / changed wallet cannot reuse previous wallet's consent
  if (record.walletAddress.toLowerCase() !== cleanWallet.toLowerCase()) {
    return false;
  }

  // 5. Strict status matching: revoked consent is never valid
  if (record.status !== 'granted' && record.status !== 'minted') {
    return false;
  }

  // 6. Version matching if requested
  if (params.consentVersion && record.consentVersion !== params.consentVersion.trim()) {
    return false;
  }

  return true;
}

/**
 * Revokes an active consent before minting occurs.
 * If the pet is already minted, revocation is blocked.
 * Only the user who granted consent can revoke it.
 */
export async function revokeIpfsConsent(params: {
  petUid: string;
  userId: number;
  reason?: string;
}): Promise<boolean> {
  const cleanPetUid = (params.petUid || '').trim();
  if (!cleanPetUid) return false;

  const existing = await getIpfsConsentForPet(cleanPetUid);
  if (!existing) return false;

  if (existing.status === 'minted') {
    throw new Error('Cannot revoke IPFS consent for a Pet Passport already minted on-chain.');
  }

  // Identity check: only the user who granted consent can revoke it
  if (existing.userId !== params.userId) {
    throw new Error('Only the user who granted consent can revoke it.');
  }

  const nowIso = new Date().toISOString();
  const revocationReason = params.reason || 'User requested revocation';

  // 1. Cloud Firestore
  if (!process.env.DATABASE_URL) {
    const docId = `${cleanPetUid}_${existing.consentVersion}`;
    const docRef = adminDb.collection('ipfsConsents').doc(docId);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists) return;

      const d = snap.data()!;
      if (d.status === 'minted') {
        throw new Error('Cannot revoke IPFS consent for a Pet Passport already minted on-chain.');
      }

      tx.set(
        docRef,
        {
          status: 'revoked',
          revokedAt: nowIso,
          revokedByUserId: params.userId,
          revocationReason,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    });

    return true;
  }

  // 2. PostgreSQL
  await ensurePostgresIpfsConsentsTable();

  const res = await db
    .update(ipfsConsents)
    .set({
      status: 'revoked',
      revokedAt: new Date(),
      revokedByUserId: params.userId,
      revocationReason,
    })
    .where(
      and(
        eq(ipfsConsents.petUid, cleanPetUid),
        eq(ipfsConsents.userId, params.userId),
        eq(ipfsConsents.status, 'granted')
      )
    );

  return Boolean(res);
}

/**
 * Marks the consent status as 'minted' once the on-chain mint transaction succeeds.
 */
export async function markIpfsConsentMinted(params: {
  petUid: string;
  consentVersion?: string;
}): Promise<boolean> {
  const cleanPetUid = (params.petUid || '').trim();
  if (!cleanPetUid) return false;

  const existing = await getIpfsConsentForPet(cleanPetUid, params.consentVersion);
  if (!existing) return false;

  // 1. Cloud Firestore
  if (!process.env.DATABASE_URL) {
    const docId = `${cleanPetUid}_${existing.consentVersion}`;
    await adminDb.collection('ipfsConsents').doc(docId).set(
      {
        status: 'minted',
        mintedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  }

  // 2. PostgreSQL
  await ensurePostgresIpfsConsentsTable();

  await db
    .update(ipfsConsents)
    .set({
      status: 'minted',
    })
    .where(
      and(
        eq(ipfsConsents.petUid, cleanPetUid),
        eq(ipfsConsents.consentVersion, existing.consentVersion),
        eq(ipfsConsents.status, 'granted')
      )
    );

  return true;
}
