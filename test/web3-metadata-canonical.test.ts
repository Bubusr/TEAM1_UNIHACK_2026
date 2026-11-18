import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server/app.ts';
import { adminDb } from '../src/lib/firebase-admin.ts';
import {
  buildPublicPetMetadata,
  issueSignedMintClaim,
  getCanonicalOrigin,
  CANONICAL_APP_ORIGIN,
} from '../src/server/web3Service.ts';
import type { Server } from 'node:http';

describe('Web3 Canonical Metadata & Public Portrait Verification (Regression Suite)', () => {
  let server: Server;
  let baseUrl: string;
  const testUid = `canonical-test-keeper-${Date.now()}`;
  const testUserId = 771234;
  const localAssetPetUid = `pet-canonical-local-${Date.now()}`;
  const dataUrlPetUid = `pet-canonical-data-${Date.now()}`;
  const testWalletAddress = '0x2B237fF449D21ECd304407d98cAAA379290747D5';

  before(async () => {
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

    // 3. Seed pet with local asset photoUrl
    await adminDb.collection('pets').doc(localAssetPetUid).set({
      petUid: localAssetPetUid,
      currentOwnerId: testUserId,
      currentOwnerUid: testUid,
      name: 'Sunny Local',
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

    // 4. Seed pet with base64 data-URL photoUrl
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
    // Clean up server and test documents
    if (server) {
      server.close();
    }
    await adminDb.collection('wallets').doc(testUid).delete().catch(() => {});
    await adminDb.collection('pets').doc(localAssetPetUid).delete().catch(() => {});
    await adminDb.collection('pets').doc(dataUrlPetUid).delete().catch(() => {});
  });

  it('1. GET /api/metadata/:petUid returns absolute HTTPS image URL with canonical origin', async () => {
    const res = await fetch(`${baseUrl}/api/metadata/${encodeURIComponent(localAssetPetUid)}`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.name, 'Sunny Local · Paws & Picket Passport');
    assert.ok(typeof json.image === 'string', 'image property must be a string');
    assert.ok(json.image.startsWith('https://'), `image URL must start with https://, got: ${json.image}`);
    assert.ok(
      json.image.startsWith(CANONICAL_APP_ORIGIN),
      `image URL must use canonical origin ${CANONICAL_APP_ORIGIN}, got: ${json.image}`
    );
    assert.equal(
      json.image,
      `${CANONICAL_APP_ORIGIN}/api/pets/${encodeURIComponent(localAssetPetUid)}/portrait`
    );
  });

  it('2. Metadata JSON string never contains localhost, 127.0.0.1, dev ports, or local filesystem paths', async () => {
    const res = await fetch(`${baseUrl}/api/metadata/${encodeURIComponent(localAssetPetUid)}`);
    assert.equal(res.status, 200);

    const rawBody = await res.text();
    assert.ok(!rawBody.includes('localhost'), 'Metadata JSON must not contain "localhost"');
    assert.ok(!rawBody.includes('127.0.0.1'), 'Metadata JSON must not contain "127.0.0.1"');
    assert.ok(!rawBody.includes(':3000'), 'Metadata JSON must not contain dev port :3000');
    assert.ok(!rawBody.includes(':53548'), 'Metadata JSON must not contain dev port :53548');
    assert.ok(!rawBody.includes('/src/assets/images'), 'Metadata JSON must not expose internal filesystem paths');
  });

  it('3. GET /api/pets/:petUid/portrait serves valid binary image with 200 and image Content-Type for local assets', async () => {
    const res = await fetch(`${baseUrl}/api/pets/${encodeURIComponent(localAssetPetUid)}/portrait`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/jpeg');

    const bytes = await res.arrayBuffer();
    assert.ok(bytes.byteLength > 0, 'Image bytes must be non-zero');
    assert.equal(bytes.byteLength, 510996, 'Image size should match cropped_golden_dog on disk');
  });

  it('4. GET /api/pets/:petUid/portrait serves valid binary image with 200 for Firestore base64 uploads', async () => {
    const res = await fetch(`${baseUrl}/api/pets/${encodeURIComponent(dataUrlPetUid)}/portrait`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');

    const bytes = await res.arrayBuffer();
    assert.ok(bytes.byteLength > 0, 'Image bytes must be non-zero');
  });

  it('5. Portrait endpoint does not require authentication, cookies, or headers', async () => {
    // Plain request with completely empty headers and no cookies
    const res = await fetch(`${baseUrl}/api/pets/${encodeURIComponent(localAssetPetUid)}/portrait`, {
      headers: {},
      credentials: 'omit',
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/jpeg');
  });

  it('6. Metadata JSON attributes contain strictly game traits and zero PII', async () => {
    const res = await fetch(`${baseUrl}/api/metadata/${encodeURIComponent(localAssetPetUid)}`);
    assert.equal(res.status, 200);
    const json = await res.json();

    const rawString = JSON.stringify(json);
    assert.ok(!rawString.includes('@'), 'Metadata must not contain email addresses');
    assert.ok(!rawString.includes('password'), 'Metadata must not contain password fields');
    assert.ok(!rawString.includes(testUid), 'Metadata must not contain internal user UID');
    assert.ok(!rawString.includes(String(testUserId)), 'Metadata must not contain internal numeric user ID');

    const traitTypes = json.attributes.map((a: { trait_type: string }) => a.trait_type);
    assert.ok(traitTypes.includes('Species'));
    assert.ok(traitTypes.includes('Pose'));
    assert.ok(traitTypes.includes('Discovery Score'));
    assert.ok(traitTypes.includes('Bond XP'));
    assert.ok(traitTypes.includes('Care Milestones'));
    assert.ok(traitTypes.includes('Discovered Date'));
    assert.ok(traitTypes.includes('Original Discoverer'));
  });

  it('7. EIP-712 mint claim enforces canonical HTTPS metadataUri and sanitizes localhost input', async () => {
    // 7a. Normal call using getCanonicalOrigin()
    const normalClaim = await issueSignedMintClaim({
      userId: testUserId,
      uid: testUid,
      petUid: localAssetPetUid,
      publicBaseUrl: getCanonicalOrigin(),
    });

    const expectedUri = `${CANONICAL_APP_ORIGIN}/api/metadata/${encodeURIComponent(localAssetPetUid)}`;
    assert.equal(normalClaim.claim.metadataUri, expectedUri);
    assert.ok(!normalClaim.claim.metadataUri.includes('localhost'));
    assert.ok(!normalClaim.claim.metadataUri.includes('127.0.0.1'));

    // 7b. Defensive test: even if caller passes localhost baseUrl, it must sanitize to canonical HTTPS
    const localClaim = await issueSignedMintClaim({
      userId: testUserId,
      uid: testUid,
      petUid: localAssetPetUid,
      publicBaseUrl: 'http://127.0.0.1:53548',
    });
    assert.equal(localClaim.claim.metadataUri, expectedUri);
    assert.ok(!localClaim.claim.metadataUri.includes('localhost'));
    assert.ok(!localClaim.claim.metadataUri.includes('127.0.0.1'));
  });

  it('8. buildPublicPetMetadata helper automatically sanitizes any localhost publicImageUrl passed to it', () => {
    const meta = buildPublicPetMetadata({
      petUid: 'pet-sanitize-test',
      name: 'Sanitized Pet',
      species: 'rabbit',
      pose: 'Curious',
      discoveryScore: 88,
      bondXp: 100,
      careCount: 3,
      discoveredAt: new Date('2026-11-18'),
      originalDiscovererWallet: testWalletAddress,
      publicImageUrl: 'http://127.0.0.1:53548/src/assets/images/cropped_golden_dog_1794637542709.jpg',
    });

    assert.equal(
      meta.image,
      `${CANONICAL_APP_ORIGIN}/api/pets/pet-sanitize-test/portrait`
    );
    assert.ok(!meta.image.includes('127.0.0.1'));
    assert.ok(!meta.image.includes('53548'));
    assert.ok(!meta.image.includes('/src/assets/images'));
  });
});
