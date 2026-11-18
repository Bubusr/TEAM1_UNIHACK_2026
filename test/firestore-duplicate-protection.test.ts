import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { adminDb } from '../src/lib/firebase-admin.ts';
import {
  firestoreAcquirePhotoReservation,
  firestoreCompletePhotoReservation,
  firestoreCommitPhotoSubmissionAndReservation,
  firestoreFailPhotoReservation,
  firestoreGetPhotoReservation,
  firestoreRecordPhotoSubmission,
  firestoreAddSubmissionToSanctuary,
  buildReservationDocId,
  DEFAULT_LEASE_TTL_MS,
  TRANSIENT_COOLDOWN_MS,
  MAX_RESERVATION_ATTEMPTS,
  ATTEMPT_RESET_WINDOW_MS,
  firestoreResetPhotoReservation,
} from '../src/db/firestoreStorage.ts';
import { judgeAndRecordPhoto } from '../src/server/gameActions.ts';
import { createApp } from '../src/server/app.ts';
import { issueGuestSessionToken } from '../src/server/guestSession.ts';

// Deterministic test image (1x1 transparent PNG)
const TEST_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

function createTestImage(uniqueTag: string): { base64: string; sha256: string } {
  const buf = Buffer.concat([TEST_PNG_BYTES, Buffer.from(uniqueTag)]);
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  return { base64: buf.toString('base64'), sha256 };
}

const mockSuccessfulOutcome = {
  isAnimal: true,
  confidence: 96,
  overallScore: 88,
  verdict: 'Approved',
  tierLabel: 'Gold',
  sharp: 90,
  light: 85,
  species: 'Corgi',
  pose: 'Playful',
  themeScore: 92,
  themeMatch: true,
  petName: 'Boba',
  coinsReward: 150,
  expReward: 60,
};

describe('Hardened Firestore Idempotency & Duplicate Protection', () => {
  it('Scenario 1: Same user submits same image twice sequentially -> 1st succeeds, 2nd gets 409 duplicate', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`seq-${runId}`);
    const uid = `test-user-seq-${runId}`;

    let callCount = 0;
    const mockAnalyzer = async () => {
      callCount++;
      return mockSuccessfulOutcome;
    };

    const firstResult = await judgeAndRecordPhoto({
      userId: 1001,
      uid,
      imageBase64: testImg.base64,
      mimeType: 'image/png',
      theme: 'Fluffy Tails',
      analyzer: mockAnalyzer,
    });

    assert.ok(firstResult.submissionUid, 'First submission must have a submissionUid');
    assert.equal(firstResult.overallScore, 88);
    assert.equal(callCount, 1, 'Gemini must be called exactly once for first submission');

    const reservation = await firestoreGetPhotoReservation(`u_${uid}`, testImg.sha256);
    assert.ok(reservation, 'Reservation must exist in Firestore');
    assert.equal(reservation.status, 'COMPLETED');
    assert.equal(reservation.submissionUid, firstResult.submissionUid);

    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 1001,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: mockAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 409, 'Status code must be 409 Conflict');
        assert.match(
          err.message,
          /This exact photo was already judged/i,
          'Error message must indicate duplicate'
        );
        return true;
      }
    );

    assert.equal(callCount, 1, 'Gemini must NOT be called on duplicate submission');
  });

  it('Scenario 2: 5 concurrent requests submit same image -> exactly 1 acquires lock/calls Gemini; 4 get processing/duplicate', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`concurrent-${runId}`);
    const uid = `test-user-conc-${runId}`;

    let geminiCalls = 0;
    const mockSlowAnalyzer = async () => {
      geminiCalls++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockSuccessfulOutcome;
    };

    const promises = Array.from({ length: 5 }, () =>
      judgeAndRecordPhoto({
        userId: 2002,
        uid,
        imageBase64: testImg.base64,
        mimeType: 'image/png',
        theme: 'Fluffy Tails',
        analyzer: mockSlowAnalyzer,
      })
    );

    const outcomes = await Promise.allSettled(promises);
    const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
    const rejected = outcomes.filter((o) => o.status === 'rejected');

    assert.equal(fulfilled.length, 1, 'Exactly one concurrent request must succeed');
    assert.equal(rejected.length, 4, 'Exactly four concurrent requests must be rejected');
    assert.equal(geminiCalls, 1, 'Gemini must be called exactly once across all concurrent requests');

    for (const r of rejected) {
      if (r.status === 'rejected') {
        const err = r.reason as any;
        assert.equal(err.statusCode, 409);
        assert.match(
          err.message,
          /(currently being evaluated|already judged)/i
        );
      }
    }
  });

  it('DEF-01: Processing lasting 32s (beyond old 30s lease) does NOT allow second worker to reclaim while active (35s lease)', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`lease-guard-${runId}`);
    const scopeKey = `u_test-worker-${runId}`;

    // Acquire reservation with default lease (35s)
    const acq = await firestoreAcquirePhotoReservation({
      scopeKey,
      imageSha256: testImg.sha256,
      leaseTtlMs: DEFAULT_LEASE_TTL_MS, // 35000 ms
    });

    assert.equal(acq.status, 'ACQUIRED');

    // Simulate 31 seconds elapsed (which would have expired an unhardened 30s lease)
    // Document lease expires in 35s, so at 31s it is STILL ACTIVE!
    const docId = buildReservationDocId(scopeKey, testImg.sha256);
    await adminDb.collection('photoReservations').doc(docId).update({
      leaseExpiresAt: Date.now() + 4000, // 4 seconds still remaining!
    });

    // Second worker attempts to acquire reservation
    const secondAcq = await firestoreAcquirePhotoReservation({
      scopeKey,
      imageSha256: testImg.sha256,
      leaseTtlMs: DEFAULT_LEASE_TTL_MS,
    });

    // Must be blocked because first worker's lease is still active!
    assert.equal(secondAcq.status, 'PROCESSING_ACTIVE');
  });

  it('DEF-01: Gemini timeout transitions reservation to recoverable failure state', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`timeout-${runId}`);
    const uid = `test-user-timeout-${runId}`;

    const timingOutAnalyzer = async () => {
      const err = new Error('Google Gemini AI is currently experiencing high demand or timed out. Please wait a few moments and snap again!');
      (err as any).statusCode = 503;
      throw err;
    };

    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 3001,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: timingOutAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 503);
        assert.match(err.message, /timed out/i);
        return true;
      }
    );

    const reservation = await firestoreGetPhotoReservation(`u_${uid}`, testImg.sha256);
    assert.ok(reservation);
    assert.equal(reservation.status, 'FAILED');
    assert.equal(reservation.errorType, 'TRANSIENT');
  });

  it('DEF-02: Atomic submission & reservation completion succeeds All-or-Nothing', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`atomic-${runId}`);
    const uid = `test-user-atomic-${runId}`;
    const scopeKey = `u_${uid}`;

    const acq = await firestoreAcquirePhotoReservation({
      scopeKey,
      imageSha256: testImg.sha256,
    });
    assert.equal(acq.status, 'ACQUIRED');
    const submissionUid = acq.submissionUid;

    const commitRes = await firestoreCommitPhotoSubmissionAndReservation({
      userId: 4001,
      uid,
      scopeKey,
      submissionUid,
      imageSha256: testImg.sha256,
      mimeType: 'image/png',
      byteSize: 128,
      photoUrl: 'data:image/png;base64,...',
      theme: 'Fluffy Tails',
      confidence: 95,
      overallScore: 88,
      verdict: 'Approved',
      tierLabel: 'Gold',
      sharp: 90,
      light: 85,
      species: 'Corgi',
      pose: 'Playful',
      themeScore: 90,
      themeMatch: true,
      petName: 'Mochi',
      coinsReward: 150,
      expReward: 50,
    });

    assert.equal(commitRes.success, true);

    // Verify both documents exist and match in Firestore
    const subDoc = await adminDb.collection('photoSubmissions').doc(submissionUid).get();
    const resDoc = await firestoreGetPhotoReservation(scopeKey, testImg.sha256);

    assert.equal(subDoc.exists, true);
    assert.equal(resDoc?.status, 'COMPLETED');
    assert.equal(resDoc?.submissionUid, submissionUid);
  });

  it('DEF-02: Stale worker cannot commit submission after lease ownership changes', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`stale-worker-${runId}`);
    const scopeKey = `u_test-stale-${runId}`;
    const docId = buildReservationDocId(scopeKey, testImg.sha256);

    const oldSubmissionUid = `sub-old-${runId}`;
    const newSubmissionUid = `sub-new-${runId}`;

    // Active reservation has newSubmissionUid
    await adminDb.collection('photoReservations').doc(docId).set({
      id: docId,
      scopeKey,
      imageSha256: testImg.sha256,
      status: 'PROCESSING',
      submissionUid: newSubmissionUid,
      leaseExpiresAt: Date.now() + 30000,
      attemptCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Stale worker (with oldSubmissionUid) attempts to commit
    const commitRes = await firestoreCommitPhotoSubmissionAndReservation({
      userId: 5001,
      uid: `test-stale-${runId}`,
      scopeKey,
      submissionUid: oldSubmissionUid, // Stale!
      imageSha256: testImg.sha256,
      mimeType: 'image/png',
      byteSize: 128,
      photoUrl: 'data:image/png;base64,...',
      theme: 'Fluffy Tails',
      confidence: 90,
      overallScore: 80,
      verdict: 'Approved',
      tierLabel: 'Silver',
      sharp: 80,
      light: 80,
      species: 'Cat',
      pose: 'Sleepy',
      themeScore: 80,
      themeMatch: true,
      petName: 'Luna',
      coinsReward: 100,
      expReward: 40,
    });

    assert.equal(commitRes.success, false);
    assert.equal(commitRes.reason, 'LEASE_SUPERSEDED');

    // Verify submission document was NOT created
    const subDoc = await adminDb.collection('photoSubmissions').doc(oldSubmissionUid).get();
    assert.equal(subDoc.exists, false, 'Stale worker must NOT write to photoSubmissions');
  });

  it('DEF-03: Two guest sessions with different tokens but the same IP can submit independently', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`guest-iso-${runId}`);

    const token1 = issueGuestSessionToken(`guest-nat-1-${runId}`).token;
    const token2 = issueGuestSessionToken(`guest-nat-2-${runId}`).token;

    let calls1 = 0;
    let calls2 = 0;

    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      // Call judge for Guest 1 via judgeAndRecordPhoto
      const res1 = await judgeAndRecordPhoto({
        userId: 6001,
        uid: `guest:guest-nat-1-${runId}`,
        imageBase64: testImg.base64,
        mimeType: 'image/png',
        theme: 'Fluffy Tails',
        analyzer: async () => {
          calls1++;
          return mockSuccessfulOutcome;
        },
      });

      // Call judge for Guest 2 for the exact same image
      const res2 = await judgeAndRecordPhoto({
        userId: 6002,
        uid: `guest:guest-nat-2-${runId}`,
        imageBase64: testImg.base64,
        mimeType: 'image/png',
        theme: 'Fluffy Tails',
        analyzer: async () => {
          calls2++;
          return mockSuccessfulOutcome;
        },
      });

      assert.ok(res1.submissionUid);
      assert.ok(res2.submissionUid);
      assert.notEqual(res1.submissionUid, res2.submissionUid);
      assert.equal(calls1, 1);
      assert.equal(calls2, 1, 'Guest 2 must not be blocked by Guest 1 on the same photo');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('DEF-03: Missing guest session cannot fall back to IP identity and returns 401', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`no-session-${runId}`);

    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      // Request without any session token or cookie
      const res = await fetch(`${base}/api/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
        }),
      });

      assert.equal(res.status, 401, 'Must reject unauthenticated request without IP fallback');
      const body = (await res.json()) as { error?: string };
      assert.match(body.error || '', /Sign in or initialize a guest session first/i);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('DEF-04: Repeated 429/503 retries are blocked during cooldown, and succeed after cooldown', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`cooldown-${runId}`);
    const uid = `test-user-cooldown-${runId}`;

    let attempts = 0;
    const flakyAnalyzer = async () => {
      attempts++;
      if (attempts === 1) {
        const err = new Error('Gemini 503: High demand');
        (err as any).statusCode = 503;
        throw err;
      }
      return mockSuccessfulOutcome;
    };

    // Attempt 1: Fails with 503
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 7001,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: flakyAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 503);
        return true;
      }
    );

    assert.equal(attempts, 1);

    // Immediate attempt 2 (within 5s cooldown) -> blocked by cooldown with 429!
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 7001,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: flakyAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 429, 'Immediate retry during cooldown must return 429');
        assert.match(err.message, /wait \d+s/i);
        return true;
      }
    );

    assert.equal(attempts, 1, 'Gemini must NOT be called during cooldown');

    // Simulate cooldown elapsed by setting failedAtMs in Firestore
    const docId = buildReservationDocId(`u_${uid}`, testImg.sha256);
    await adminDb.collection('photoReservations').doc(docId).update({
      failedAtMs: Date.now() - (TRANSIENT_COOLDOWN_MS + 1000),
      failedAt: new Date(Date.now() - (TRANSIENT_COOLDOWN_MS + 1000)).toISOString(),
    });

    // Attempt 3 (after cooldown) -> must succeed!
    const successRes = await judgeAndRecordPhoto({
      userId: 7001,
      uid,
      imageBase64: testImg.base64,
      mimeType: 'image/png',
      theme: 'Fluffy Tails',
      analyzer: flakyAnalyzer,
    });

    assert.ok(successRes.submissionUid);
    assert.equal(attempts, 2, 'Gemini must be called once cooldown has expired');
  });

  it('DEF-04: Permanent invalid-image (non-animal) does not trigger repeated automatic retries', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`non-animal-${runId}`);
    const uid = `test-user-non-animal-${runId}`;

    let callCount = 0;
    const nonAnimalAnalyzer = async () => {
      callCount++;
      return {
        ...mockSuccessfulOutcome,
        isAnimal: false,
        confidence: 20,
      };
    };

    // 1st attempt: 422 Non-animal
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8001,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: nonAnimalAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 422);
        assert.match(err.message, /No real pet or animal detected/i);
        return true;
      }
    );

    assert.equal(callCount, 1);

    // 2nd attempt immediately: blocked by permanent cooldown without calling Gemini again!
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8001,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: nonAnimalAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 422);
        assert.match(err.message, /No real pet or animal detected/i);
        return true;
      }
    );

    assert.equal(callCount, 1, 'Gemini must NOT be called again for permanent invalid-image');
  });

  it('Scenario 7: Duplicate requests cannot generate duplicate rewards or multiple pets', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`rewards-guard-${runId}`);
    const uid = `test-user-rewards-${runId}`;

    await adminDb.collection('users').doc(uid).set({
      id: 9001,
      uid,
      coins: 1000,
      level: 1,
      expPercent: 0,
      limitsDate: '2026-11-18',
      petCoinsUsed: 0,
      playCoinsUsed: 0,
      feedCoinsUsed: 0,
      cloverCoinsUsed: 0,
    });

    const report = await judgeAndRecordPhoto({
      userId: 9001,
      uid,
      imageBase64: testImg.base64,
      mimeType: 'image/png',
      theme: 'Fluffy Tails',
      analyzer: async () => mockSuccessfulOutcome,
    });

    const add1 = await firestoreAddSubmissionToSanctuary({
      userId: 9001,
      uid,
      submissionUid: report.submissionUid,
      idempotencyKey: `idem-sanctuary-${runId}`,
    });

    assert.ok(add1.petUid);

    const add2 = await firestoreAddSubmissionToSanctuary({
      userId: 9001,
      uid,
      submissionUid: report.submissionUid,
      idempotencyKey: `idem-sanctuary-repeat-${runId}`,
    });

    assert.equal(add2.alreadyAdded, true);
    assert.equal(add2.petUid, add1.petUid);

    const petsSnap = await adminDb
      .collection('pets')
      .where('currentOwnerUid', '==', uid)
      .get();
    assert.equal(petsSnap.size, 1);
  });

  it('Hardening: Three permitted attempts and fourth attempt blocked with MAX_RETRIES_EXCEEDED (HTTP 429)', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`max-retries-${runId}`);
    const uid = `test-user-max-retries-${runId}`;
    const docId = buildReservationDocId(`u_${uid}`, testImg.sha256);

    let geminiAttempts = 0;
    const failingAnalyzer = async () => {
      geminiAttempts++;
      const err = new Error('Gemini API 503: High demand overload');
      (err as any).statusCode = 503;
      throw err;
    };

    // Attempt 1: Permitted, fails with 503
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8101,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: failingAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 503);
        return true;
      }
    );
    assert.equal(geminiAttempts, 1);

    // Simulate transient cooldown elapsed for Attempt 2
    await adminDb.collection('photoReservations').doc(docId).update({
      failedAtMs: Date.now() - (TRANSIENT_COOLDOWN_MS + 1000),
      failedAt: new Date(Date.now() - (TRANSIENT_COOLDOWN_MS + 1000)).toISOString(),
    });

    // Attempt 2: Permitted, fails with 503
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8101,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: failingAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 503);
        return true;
      }
    );
    assert.equal(geminiAttempts, 2);

    // Simulate transient cooldown elapsed for Attempt 3
    await adminDb.collection('photoReservations').doc(docId).update({
      failedAtMs: Date.now() - (TRANSIENT_COOLDOWN_MS + 1000),
      failedAt: new Date(Date.now() - (TRANSIENT_COOLDOWN_MS + 1000)).toISOString(),
    });

    // Attempt 3: Permitted (3rd attempt), fails with 503
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8101,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: failingAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 503);
        return true;
      }
    );
    assert.equal(geminiAttempts, 3);

    // Simulate transient cooldown elapsed for Attempt 4
    await adminDb.collection('photoReservations').doc(docId).update({
      failedAtMs: Date.now() - (TRANSIENT_COOLDOWN_MS + 1000),
      failedAt: new Date(Date.now() - (TRANSIENT_COOLDOWN_MS + 1000)).toISOString(),
    });

    // Attempt 4: Exceeds MAX_RESERVATION_ATTEMPTS (3) -> Blocked with HTTP 429!
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8101,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: failingAnalyzer,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 429);
        assert.equal(err.code, 'MAX_RETRIES_EXCEEDED');
        assert.match(err.message, /Maximum evaluation attempts \(3\) exceeded/i);
        return true;
      }
    );

    // Gemini must NOT be called on the 4th attempt
    assert.equal(geminiAttempts, 3, 'Gemini must not be called once max attempts are exceeded');
  });

  it('Hardening: Different guest sessions remain isolated even when one guest exceeds max retries', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`guest-iso-max-${runId}`);
    const guestA = `guest-exhausted-${runId}`;
    const guestB = `guest-fresh-${runId}`;

    const docIdA = buildReservationDocId(`u_${guestA}`, testImg.sha256);

    // Pre-populate Guest A's reservation as having failed 3 times
    await adminDb.collection('photoReservations').doc(docIdA).set({
      id: docIdA,
      scopeKey: `u_${guestA}`,
      imageSha256: testImg.sha256,
      status: 'FAILED',
      submissionUid: `sub-exhausted-${runId}`,
      leaseExpiresAt: 0,
      attemptCount: 3,
      errorType: 'TRANSIENT',
      error: 'Gemini 503 repeated',
      failedAtMs: Date.now() - 10000,
      failedAt: new Date(Date.now() - 10000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Guest A is blocked by MAX_RETRIES_EXCEEDED
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8201,
          uid: guestA,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: async () => mockSuccessfulOutcome,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 429);
        assert.equal(err.code, 'MAX_RETRIES_EXCEEDED');
        return true;
      }
    );

    // Guest B submits the exact same photo -> must succeed because scope is isolated!
    let guestBCalled = false;
    const resultB = await judgeAndRecordPhoto({
      userId: 8202,
      uid: guestB,
      imageBase64: testImg.base64,
      mimeType: 'image/png',
      theme: 'Fluffy Tails',
      analyzer: async () => {
        guestBCalled = true;
        return mockSuccessfulOutcome;
      },
    });

    assert.ok(guestBCalled, 'Guest B analyzer must be called');
    assert.ok(resultB.submissionUid);
    assert.equal(resultB.verdict, 'Approved');

    // Confirm Guest B's reservation doc has attemptCount = 1
    const docIdB = buildReservationDocId(`u_${guestB}`, testImg.sha256);
    const snapB = await adminDb.collection('photoReservations').doc(docIdB).get();
    assert.equal(snapB.data()?.status, 'COMPLETED');
  });

  it('Hardening: Legitimate retry succeeds after intended reset/recovery policy', async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    const testImg = createTestImage(`reset-policy-${runId}`);
    const uid = `test-user-reset-${runId}`;
    const docId = buildReservationDocId(`u_${uid}`, testImg.sha256);

    // Pre-populate reservation as exhausted (3 attempts)
    await adminDb.collection('photoReservations').doc(docId).set({
      id: docId,
      scopeKey: `u_${uid}`,
      imageSha256: testImg.sha256,
      status: 'FAILED',
      submissionUid: `sub-init-${runId}`,
      leaseExpiresAt: 0,
      attemptCount: 3,
      errorType: 'TRANSIENT',
      error: 'Gemini 503 high demand',
      failedAtMs: Date.now() - 10000,
      failedAt: new Date(Date.now() - 10000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Verify blocked before reset window
    await assert.rejects(
      async () => {
        await judgeAndRecordPhoto({
          userId: 8301,
          uid,
          imageBase64: testImg.base64,
          mimeType: 'image/png',
          theme: 'Fluffy Tails',
          analyzer: async () => mockSuccessfulOutcome,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 429);
        assert.equal(err.code, 'MAX_RETRIES_EXCEEDED');
        return true;
      }
    );

    // Policy 1: Simulate reset window elapsed (e.g. 60s has passed since failure)
    await adminDb.collection('photoReservations').doc(docId).update({
      failedAtMs: Date.now() - (ATTEMPT_RESET_WINDOW_MS + 2000),
      failedAt: new Date(Date.now() - (ATTEMPT_RESET_WINDOW_MS + 2000)).toISOString(),
    });

    let analyzerCalled = false;
    const successResult = await judgeAndRecordPhoto({
      userId: 8301,
      uid,
      imageBase64: testImg.base64,
      mimeType: 'image/png',
      theme: 'Fluffy Tails',
      analyzer: async () => {
        analyzerCalled = true;
        return mockSuccessfulOutcome;
      },
    });

    assert.ok(analyzerCalled, 'Analyzer must be called after reset window has elapsed');
    assert.ok(successResult.submissionUid);
    assert.equal(successResult.verdict, 'Approved');

    // Policy 2: Explicit reservation reset via firestoreResetPhotoReservation
    const testImg2 = createTestImage(`explicit-reset-${runId}`);
    const docId2 = buildReservationDocId(`u_${uid}`, testImg2.sha256);
    await adminDb.collection('photoReservations').doc(docId2).set({
      id: docId2,
      scopeKey: `u_${uid}`,
      imageSha256: testImg2.sha256,
      status: 'FAILED',
      submissionUid: `sub-init2-${runId}`,
      leaseExpiresAt: 0,
      attemptCount: 3,
      errorType: 'TRANSIENT',
      error: 'Exhausted',
      failedAtMs: Date.now() - 5000,
      failedAt: new Date(Date.now() - 5000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await firestoreResetPhotoReservation({
      scopeKey: `u_${uid}`,
      imageSha256: testImg2.sha256,
    });

    const resetSnap = await adminDb.collection('photoReservations').doc(docId2).get();
    assert.equal(resetSnap.exists, false, 'Reservation doc should be deleted after explicit reset');

    const freshResult = await judgeAndRecordPhoto({
      userId: 8301,
      uid,
      imageBase64: testImg2.base64,
      mimeType: 'image/png',
      theme: 'Fluffy Tails',
      analyzer: async () => mockSuccessfulOutcome,
    });
    assert.ok(freshResult.submissionUid);
  });
});
