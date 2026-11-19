import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server/app.ts';
import { adminDb } from '../src/lib/firebase-admin.ts';
import {
  buildPublicPetMetadata,
  issueSignedMintClaim,
  getCanonicalOrigin,
  isPetPubliclyAccessible,
} from '../src/server/web3Service.ts';
import type { Server } from 'node:http';

describe('Web3 Production Origin & Privacy Verification (Phase 7 Suite)', () => {
  let server: Server;
  let baseUrl: string;
  const testUid = `canonical-test-keeper-${Date.now()}`;
  const testUserId = 771234;
  const eligiblePetUid = `pet-eligible-${Date.now()}`;
  const unpublishedPetUid = `pet-unpublished-${Date.now()}`;
  const dataUrlPetUid = `pet-data-${Date.now()}`;
  const testWalletAddress = '0x2B237fF449D21ECd304407d98cAAA379290747D5';
  const testOrigin = 'https://test.pawsandpicket.local';

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.APP_URL = testOrigin;

    // 1. Start local Express app on dynamic port
    const app = createApp();
    server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;

    // 2. Seed linked wallet in Firestore
    await adminDb.collection('wallets').doc(testUid).set({
      uid: testUid,
      userId: testUserId,
      address: testWalletAddress,
      chainId: 43113,
      verifiedAt: new Date().toISOString(),
    });

    // 3. Seed ELIGIBLE pet with local asset photoUrl (Score 92 >= 80, Bond XP 120 >= 100)
    await adminDb.collection('pets').doc(eligiblePetUid).set({
      petUid: eligiblePetUid,
      currentOwnerId: testUserId,
      currentOwnerUid: testUid,
      name: 'Sunny Eligible',
      species: 'dog',
      pose: 'Joyful',
      discoveryScore: 92,
      bondXp: 120,
      careCount: 4,
      mintStatus: 'unminted',
      photoUrl: '/src/assets/images/cropped_golden_dog_1794637542709.jpg',
      originalDiscovererWallet: testWalletAddress,
      discoveredAt: new Date('2026-11-18T10:00:00Z'),
    });

    // 4. Seed UNPUBLISHED / INELIGIBLE private pet (Score 60 < 80, Bond XP 20 < 100)
    await adminDb.collection('pets').doc(unpublishedPetUid).set({
      petUid: unpublishedPetUid,
      currentOwnerId: testUserId,
      currentOwnerUid: testUid,
      name: 'Private Draft Pet',
      species: 'dog',
      pose: 'Hiding',
      discoveryScore: 60,
      bondXp: 20,
      careCount: 1,
      mintStatus: 'unminted',
      photoUrl: '/src/assets/images/cropped_golden_dog_1794637542709.jpg',
      originalDiscovererWallet: null,
      discoveredAt: new Date('2026-11-18T11:00:00Z'),
    });

    // 5. Seed ELIGIBLE pet with base64 data-URL photoUrl
    const samplePngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await adminDb.collection('pets').doc(dataUrlPetUid).set({
      petUid: dataUrlPetUid,
      currentOwnerId: testUserId,
      currentOwnerUid: testUid,
      name: 'Mochi Data',
      species: 'cat',
      pose: 'Napping',
      discoveryScore: 89,
      bondXp: 110,
      careCount: 3,
      mintStatus: 'unminted',
      photoUrl: samplePngBase64,
      originalDiscovererWallet: testWalletAddress,
      discoveredAt: new Date('2026-11-17T12:00:00Z'),
    });
  });

  after(async () => {
    if (server) {
      server.close();
    }
    await adminDb.collection('wallets').doc(testUid).delete().catch(() => {});
    await adminDb.collection('pets').doc(eligiblePetUid).delete().catch(() => {});
    await adminDb.collection('pets').doc(unpublishedPetUid).delete().catch(() => {});
    await adminDb.collection('pets').doc(dataUrlPetUid).delete().catch(() => {});
  });

  it('1. Production origin cannot default to an unverified placeholder', () => {
    const prevEnv = process.env.NODE_ENV;
    const prevAppUrl = process.env.APP_URL;
    try {
      // Simulate production environment with no APP_URL
      process.env.NODE_ENV = 'production';
      delete process.env.APP_URL;

      const origin = getCanonicalOrigin();
      assert.strictEqual(
        origin,
        null,
        'In production without APP_URL, getCanonicalOrigin() must return null and never default to pawsandpicket.app'
      );

      // Verify explicit placeholder MY_APP_URL is rejected
      process.env.APP_URL = 'MY_APP_URL';
      assert.strictEqual(getCanonicalOrigin(), null);
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevAppUrl !== undefined) process.env.APP_URL = prevAppUrl;
      else delete process.env.APP_URL;
    }
  });

  it('2. Missing production origin fails safely with 503', async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevAppUrl = process.env.APP_URL;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.APP_URL;

      // 2a. issueSignedMintClaim fails safely with 503 error
      await assert.rejects(
        async () => {
          await issueSignedMintClaim({
            userId: testUserId,
            uid: testUid,
            petUid: eligiblePetUid,
            publicBaseUrl: null,
          });
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 503);
          assert.match(err.message, /Verified production origin is not configured/);
          return true;
        }
      );

      // 2b. GET /api/metadata/:petUid fails safely with 503 in production without APP_URL
      const res = await fetch(`${baseUrl}/api/metadata/${encodeURIComponent(eligiblePetUid)}`);
      assert.strictEqual(res.status, 503);
      const json = await res.json();
      assert.match(json.error, /Public production origin is not configured/);
    } finally {
      process.env.NODE_ENV = prevEnv;
      if (prevAppUrl !== undefined) process.env.APP_URL = prevAppUrl;
      else delete process.env.APP_URL;
    }
  });

  it('3. Local tests can inject a test origin explicitly', async () => {
    const injectedOrigin = 'https://custom-test-origin.example.org';
    const origin = getCanonicalOrigin(injectedOrigin);
    assert.strictEqual(origin, injectedOrigin);

    const claimResult = await issueSignedMintClaim({
      userId: testUserId,
      uid: testUid,
      petUid: eligiblePetUid,
      publicBaseUrl: injectedOrigin,
    });
    assert.strictEqual(
      claimResult.claim.metadataUri,
      `${injectedOrigin}/api/metadata/${encodeURIComponent(eligiblePetUid)}`
    );
  });

  it('4. Metadata and portrait use the same canonical origin', async () => {
    const res = await fetch(`${baseUrl}/api/metadata/${encodeURIComponent(eligiblePetUid)}`);
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    const resolvedOrigin = getCanonicalOrigin();
    assert.ok(resolvedOrigin, 'Resolved origin should be non-null in test mode');

    const expectedPortraitUrl = `${resolvedOrigin}/api/pets/${encodeURIComponent(eligiblePetUid)}/portrait`;
    assert.strictEqual(json.image, expectedPortraitUrl);
  });

  it('5. No localhost or private-network URLs appear in metadata or claims', async () => {
    // 5a. getCanonicalOrigin rejects localhost and private IPs
    assert.strictEqual(getCanonicalOrigin('http://localhost:3000'), null);
    assert.strictEqual(getCanonicalOrigin('http://127.0.0.1:53548'), null);
    assert.strictEqual(getCanonicalOrigin('https://127.0.0.1'), null);
    assert.strictEqual(getCanonicalOrigin('http://192.168.1.1'), null);
    assert.strictEqual(getCanonicalOrigin('http://0.0.0.0:8080'), null);

    // 5b. Metadata response does not leak localhost or ports
    const res = await fetch(`${baseUrl}/api/metadata/${encodeURIComponent(eligiblePetUid)}`);
    const rawBody = await res.text();
    assert.ok(!rawBody.includes('localhost'));
    assert.ok(!rawBody.includes('127.0.0.1'));
    assert.ok(!rawBody.includes(':3000'));
    assert.ok(!rawBody.includes(':53548'));
    assert.ok(!rawBody.includes('/src/assets/images'));
  });

  it('6. Unpublished or ineligible pet images are NOT exposed unintentionally (Privacy Boundary)', async () => {
    // 6a. Verify isPetPubliclyAccessible logic
    assert.strictEqual(
      isPetPubliclyAccessible({ discoveryScore: 60, bondXp: 20, mintStatus: 'unminted' }),
      false,
      'Ineligible unminted pet must not be publicly accessible'
    );
    assert.strictEqual(
      isPetPubliclyAccessible({ discoveryScore: 92, bondXp: 120, mintStatus: 'unminted' }),
      true,
      'Eligible pet must be publicly accessible'
    );
    assert.strictEqual(
      isPetPubliclyAccessible({ discoveryScore: 50, bondXp: 10, mintStatus: 'minted' }),
      true,
      'Minted pet is on-chain NFT and must be publicly accessible'
    );

    // 6b. Request portrait for unpublished pet -> 404
    const portraitRes = await fetch(
      `${baseUrl}/api/pets/${encodeURIComponent(unpublishedPetUid)}/portrait`
    );
    assert.strictEqual(
      portraitRes.status,
      404,
      'Unpublished pet portrait must return 404 to protect private photos'
    );

    // 6c. Request metadata for unpublished pet -> 404
    const metaRes = await fetch(
      `${baseUrl}/api/metadata/${encodeURIComponent(unpublishedPetUid)}`
    );
    assert.strictEqual(
      metaRes.status,
      404,
      'Unpublished pet metadata must return 404'
    );

    // 6d. Request portrait for eligible pet -> 200 with raw binary image bytes
    const eligiblePortraitRes = await fetch(
      `${baseUrl}/api/pets/${encodeURIComponent(eligiblePetUid)}/portrait`
    );
    assert.strictEqual(eligiblePortraitRes.status, 200);
    assert.strictEqual(eligiblePortraitRes.headers.get('content-type'), 'image/jpeg');
    const bytes = await eligiblePortraitRes.arrayBuffer();
    assert.strictEqual(bytes.byteLength, 510996);
  });

  it('7. EIP-712 metadata URI matches the actual production metadata URL', async () => {
    const claimResult = await issueSignedMintClaim({
      userId: testUserId,
      uid: testUid,
      petUid: eligiblePetUid,
      publicBaseUrl: testOrigin,
    });

    const expectedUri = `${testOrigin}/api/metadata/${encodeURIComponent(eligiblePetUid)}`;
    assert.strictEqual(claimResult.claim.metadataUri, expectedUri);
    assert.ok(!claimResult.claim.metadataUri.includes('localhost'));
  });

  it('8. Portrait endpoint serves valid binary image for base64 uploads without authentication', async () => {
    const res = await fetch(`${baseUrl}/api/pets/${encodeURIComponent(dataUrlPetUid)}/portrait`, {
      headers: {},
      credentials: 'omit',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'image/png');
    const bytes = await res.arrayBuffer();
    assert.ok(bytes.byteLength > 0);
  });

  it('9. Health check endpoints (/api/health and /healthz) return HTTP 200 for Cloud Run probes', async () => {
    for (const endpoint of ['/api/health', '/healthz']) {
      const res = await fetch(`${baseUrl}${endpoint}`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.status, 'ok');
      assert.strictEqual(json.service, 'paws-and-picket');
      assert.ok(typeof json.timestamp === 'string');
      assert.ok(typeof json.uptime === 'number');
    }
  });
});
