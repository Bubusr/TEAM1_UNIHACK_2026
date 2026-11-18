import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import express from 'express';
import { eq } from 'drizzle-orm';
import { ethers } from 'ethers';
import { calculateJudgeOutcome, computeMintEligibility } from '../src/server/rewards.ts';
import { validateImageUpload } from '../src/server/aiJudge.ts';
import { buildWalletVerificationMessage } from '../src/server/walletAuth.ts';
import {
  buildPublicPetMetadata,
  getAvalancheChainId,
  getAvalancheFujiRpcUrl,
  getWeb3Status,
  pinPetPassportToPinata,
} from '../src/server/web3Service.ts';
import { createRateLimiter } from '../src/server/rateLimit.ts';
import {
  GUEST_TOKEN_TTL_MS,
  assertGuestSessionConfig,
  issueGuestSessionToken,
  verifyGuestSessionToken,
} from '../src/server/guestSession.ts';
import {
  evaluateFirstBondQuestEligibility,
  mergeGuestIntoKeeper,
  performGeneralGameAction,
  performPetCareAction,
  claimFirstBondQuest,
} from '../src/server/gameActions.ts';
import { buildPoolConfig, db } from '../src/db/index.ts';
import { getFullKeeperState, getOrCreateUser } from '../src/db/users.ts';
import { careLogs, pets, photoSubmissions, users } from '../src/db/schema.ts';
import { adminAuth, adminDb } from '../src/lib/firebase-admin.ts';
import { createApp } from '../src/server/app.ts';

describe('Backend Security, AI Rewards & Web3 Boundaries', { concurrency: 1 }, () => {
  it('enforces server-side AI judge validation and non-animal rejection', () => {
    const nonAnimal = calculateJudgeOutcome({
      isAnimal: false,
      confidence: 95,
      sharp: 90,
      light: 90,
      themeScore: 90,
      themeMatch: true,
      species: 'Object',
      pose: 'Static',
      petName: 'Table',
    });
    assert.equal(nonAnimal.isAnimal, false);
    assert.equal(nonAnimal.coinsReward, 0);
    assert.equal(nonAnimal.expReward, 0);

    const lowConfidence = calculateJudgeOutcome({
      isAnimal: true,
      confidence: 42,
      sharp: 95,
      light: 95,
      themeScore: 95,
      themeMatch: true,
      species: 'Dog',
      pose: 'Sitting',
      petName: 'Blurry',
    });
    assert.equal(lowConfidence.isAnimal, false);
    assert.equal(lowConfidence.coinsReward, 0);

    const highTier = calculateJudgeOutcome({
      isAnimal: true,
      confidence: 98,
      sharp: 92,
      light: 88,
      themeScore: 90,
      themeMatch: true,
      species: 'Corgi',
      pose: 'Playful',
      petName: 'Waffles',
    });
    assert.equal(highTier.isAnimal, true);
    assert.equal(highTier.overallScore >= 80, true);
    assert.equal(highTier.coinsReward, 150);
    assert.equal(highTier.expReward, 50);
  });

  it('requires BOTH 80+ score and 100+ Bond XP for mint eligibility', () => {
    assert.equal(
      computeMintEligibility({
        discoveryScore: 92,
        bondXp: 99,
        mintStatus: 'unminted',
      }).eligible,
      false
    );
    assert.equal(
      computeMintEligibility({
        discoveryScore: 79,
        bondXp: 120,
        mintStatus: 'unminted',
      }).eligible,
      false
    );
    assert.equal(
      computeMintEligibility({
        discoveryScore: 85,
        bondXp: 100,
        mintStatus: 'minted',
      }).eligible,
      false
    );
    assert.equal(
      computeMintEligibility({
        discoveryScore: 85,
        bondXp: 100,
        mintStatus: 'unminted',
      }).eligible,
      true
    );
  });

  it('rejects unsupported MIME types and spoofed magic bytes on image upload', () => {
    const fakeJpeg = Buffer.from('NOT_A_REAL_JPEG_PAYLOAD_123456').toString('base64');
    assert.throws(
      () => validateImageUpload(fakeJpeg, 'image/jpeg'),
      /signature does not match/i
    );
    assert.throws(
      () => validateImageUpload(fakeJpeg, 'image/gif'),
      /Only JPEG, PNG, and WEBP/i
    );

    const validPngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const valid = validateImageUpload(validPngBytes.toString('base64'), 'image/png');
    assert.equal(valid.mimeType, 'image/png');
    assert.equal(valid.sha256.length, 64);
  });

  it('verifies EIP-191 nonce challenge signatures cleanly and rejects wrong signers', async () => {
    const signer = ethers.Wallet.createRandom();
    const attacker = ethers.Wallet.createRandom();
    const msg = buildWalletVerificationMessage({
      uid: 'firebase-uid-123',
      walletAddress: signer.address,
      nonce: 'deadbeef1234',
      chainId: 43113,
    });
    const sig = await signer.signMessage(msg);
    assert.equal(
      ethers.verifyMessage(msg, sig).toLowerCase(),
      signer.address.toLowerCase()
    );
    assert.notEqual(
      ethers.verifyMessage(msg, sig).toLowerCase(),
      attacker.address.toLowerCase()
    );
  });

  it('reports honest Web3 configuration status and omits PII from public Passport metadata', () => {
    const prevContract = process.env.PET_PASSPORT_CONTRACT_ADDRESS;
    const prevKey = process.env.TRUSTED_SIGNER_PRIVATE_KEY;
    const prevProvider = process.env.METADATA_STORAGE_PROVIDER;
    const prevStorageKey = process.env.METADATA_STORAGE_API_KEY;
    delete process.env.PET_PASSPORT_CONTRACT_ADDRESS;
    delete process.env.TRUSTED_SIGNER_PRIVATE_KEY;
    delete process.env.METADATA_STORAGE_PROVIDER;
    delete process.env.METADATA_STORAGE_API_KEY;

    const status = getWeb3Status();
    assert.equal(status.phase, 1);
    assert.equal(status.chainId, 43113);
    assert.equal(status.readyForMint, false);
    assert.equal(status.contractAddress, null);
    assert.equal(status.metadataProvider, 'server');
    assert.ok(status.missingConfig.includes('PET_PASSPORT_CONTRACT_ADDRESS'));
    assert.ok(status.missingConfig.includes('TRUSTED_SIGNER_PRIVATE_KEY'));
    // Default server metadata provider must NOT require METADATA_STORAGE_API_KEY
    assert.ok(!status.missingConfig.includes('METADATA_STORAGE_API_KEY'));

    // Switching to external Pinata provider requires METADATA_STORAGE_API_KEY
    process.env.METADATA_STORAGE_PROVIDER = 'pinata';
    const pinataStatus = getWeb3Status();
    assert.equal(pinataStatus.metadataProvider, 'pinata');
    assert.ok(pinataStatus.missingConfig.includes('METADATA_STORAGE_API_KEY'));

    const meta = buildPublicPetMetadata({
      petUid: 'pet-abc',
      name: 'Mochi',
      species: 'cat',
      pose: 'Cozy',
      discoveryScore: 94,
      bondXp: 120,
      careCount: 6,
      discoveredAt: new Date('2026-11-16T00:00:00Z'),
      originalDiscovererWallet: '0x000000000000000000000000000000000000dead',
      publicImageUrl: 'https://example.com/api/pets/pet-abc/portrait',
    });
    const serialized = JSON.stringify(meta);
    assert.ok(!serialized.includes('@'));
    assert.equal(meta.name, 'Mochi · Paws & Picket Passport');

    if (prevContract !== undefined) process.env.PET_PASSPORT_CONTRACT_ADDRESS = prevContract;
    if (prevKey !== undefined) process.env.TRUSTED_SIGNER_PRIVATE_KEY = prevKey;
    if (prevProvider !== undefined) {
      process.env.METADATA_STORAGE_PROVIDER = prevProvider;
    } else {
      delete process.env.METADATA_STORAGE_PROVIDER;
    }
    if (prevStorageKey !== undefined) {
      process.env.METADATA_STORAGE_API_KEY = prevStorageKey;
    } else {
      delete process.env.METADATA_STORAGE_API_KEY;
    }
  });

  it('supports DATABASE_URL with Cloud SQL fallback, safe Fuji defaults, and honest 503 when GEMINI_API_KEY is missing', async () => {
    const prevDbUrl = process.env.DATABASE_URL;
    const prevSqlHost = process.env.SQL_HOST;
    const prevSqlUser = process.env.SQL_USER;
    const prevSqlPassword = process.env.SQL_PASSWORD;
    const prevSqlDb = process.env.SQL_DB_NAME;
    const prevRpc = process.env.AVALANCHE_FUJI_RPC_URL;
    const prevChain = process.env.AVALANCHE_CHAIN_ID;
    const prevGemini = process.env.GEMINI_API_KEY;

    try {
      // 1. DATABASE_URL takes precedence when set to a real connection URL
      process.env.DATABASE_URL = 'postgresql://ext_user:ext_pass@pg.example.internal:5433/paws_db';
      process.env.SQL_HOST = '127.0.0.1';
      const urlCfg = buildPoolConfig();
      assert.equal(urlCfg.host, 'pg.example.internal');
      assert.equal(urlCfg.port, 5433);
      assert.equal(urlCfg.user, 'ext_user');
      assert.equal(urlCfg.password, 'ext_pass');
      assert.equal(urlCfg.database, 'paws_db');

      // 2. Placeholder/unset DATABASE_URL falls back cleanly to Cloud SQL SQL_* vars
      process.env.DATABASE_URL = 'MY_DATABASE_URL';
      process.env.SQL_HOST = '10.0.0.5';
      process.env.SQL_USER = 'cloud_user';
      process.env.SQL_PASSWORD = 'cloud_password';
      process.env.SQL_DB_NAME = 'paws_cloud';
      const sqlCfg = buildPoolConfig();
      assert.equal(sqlCfg.host, '10.0.0.5');
      assert.equal(sqlCfg.user, 'cloud_user');
      assert.equal(sqlCfg.password, 'cloud_password');
      assert.equal(sqlCfg.database, 'paws_cloud');

      // 3. Safe Fuji RPC & Chain ID defaults
      delete process.env.AVALANCHE_FUJI_RPC_URL;
      delete process.env.AVALANCHE_CHAIN_ID;
      assert.equal(getAvalancheFujiRpcUrl(), 'https://api.avax-test.network/ext/bc/C/rpc');
      assert.equal(getAvalancheChainId(), 43113);
      process.env.AVALANCHE_FUJI_RPC_URL = 'MY_AVALANCHE_FUJI_RPC_URL';
      assert.equal(getAvalancheFujiRpcUrl(), 'https://api.avax-test.network/ext/bc/C/rpc');

      // 4. Missing GEMINI_API_KEY yields honest 503 on POST /api/judge while app starts & Web3 status stays 200
      delete process.env.GEMINI_API_KEY;
      const app = createApp();
      const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
        const s = app.listen(0, () => resolve(s));
      });
      try {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        const base = `http://127.0.0.1:${port}`;

        const validPng = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        ]).toString('base64');

        const judgeRes = await fetch(`${base}/api/judge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: validPng, mimeType: 'image/png', theme: 'Cozy' }),
        });
        assert.equal(judgeRes.status, 503);
        const judgeErr = (await judgeRes.json()) as { error?: string };
        assert.match(judgeErr.error || '', /GEMINI_API_KEY/);

        const web3Res = await fetch(`${base}/api/web3/status`);
        assert.equal(web3Res.status, 200);
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    } finally {
      if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = prevDbUrl;
      if (prevSqlHost === undefined) delete process.env.SQL_HOST;
      else process.env.SQL_HOST = prevSqlHost;
      if (prevSqlUser === undefined) delete process.env.SQL_USER;
      else process.env.SQL_USER = prevSqlUser;
      if (prevSqlPassword === undefined) delete process.env.SQL_PASSWORD;
      else process.env.SQL_PASSWORD = prevSqlPassword;
      if (prevSqlDb === undefined) delete process.env.SQL_DB_NAME;
      else process.env.SQL_DB_NAME = prevSqlDb;
      if (prevRpc === undefined) delete process.env.AVALANCHE_FUJI_RPC_URL;
      else process.env.AVALANCHE_FUJI_RPC_URL = prevRpc;
      if (prevChain === undefined) delete process.env.AVALANCHE_CHAIN_ID;
      else process.env.AVALANCHE_CHAIN_ID = prevChain;
      if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevGemini;
    }
  });

  it('issues and verifies HMAC-signed guest session tokens, rejects tampering, and enforces 30-day expiration', () => {
    const baseNow = 1_750_000_000_000;
    const issued = issueGuestSessionToken(undefined, baseNow);
    const verified = verifyGuestSessionToken(issued.token, baseNow + 1000);
    assert.ok(verified);
    assert.equal(verified.guestUid, issued.guestUid);

    // Expired after 30 days -> rejected
    assert.equal(
      verifyGuestSessionToken(issued.token, baseNow + GUEST_TOKEN_TTL_MS),
      null
    );
    assert.equal(
      verifyGuestSessionToken(issued.token, baseNow + GUEST_TOKEN_TTL_MS + 60_000),
      null
    );

    // Future-dated iat beyond 5-min clock skew -> rejected
    const futureToken = issueGuestSessionToken(undefined, baseNow + 10 * 60_000);
    assert.equal(verifyGuestSessionToken(futureToken.token, baseNow), null);

    const [payload, sig] = issued.token.split('.');
    const tamperedSig = `${payload}.${sig.slice(0, -2)}AA`;
    assert.equal(verifyGuestSessionToken(tamperedSig, baseNow), null);

    const forgedPayload = Buffer.from(
      JSON.stringify({ gid: 'forged-guest-9999', iat: baseNow })
    ).toString('base64url');
    assert.equal(verifyGuestSessionToken(`${forgedPayload}.${sig}`, baseNow), null);
  });

  it('enforces per-pet First Bond Quest rules (Pet + Feed + Play + 100 Bond XP on one pet, once per account)', () => {
    // Missing a care step even with 120 Bond XP -> ineligible
    assert.equal(
      evaluateFirstBondQuestEligibility({
        alreadyClaimed: false,
        questPetDone: true,
        questFeedDone: true,
        questPlayDone: false,
        bondXp: 120,
      }).eligible,
      false
    );

    // All 3 steps done, Bond XP < 100 -> ineligible
    assert.equal(
      evaluateFirstBondQuestEligibility({
        alreadyClaimed: false,
        questPetDone: true,
        questFeedDone: true,
        questPlayDone: true,
        bondXp: 95,
      }).eligible,
      false
    );

    // Already claimed on Keeper account -> ineligible
    assert.equal(
      evaluateFirstBondQuestEligibility({
        alreadyClaimed: true,
        questPetDone: true,
        questFeedDone: true,
        questPlayDone: true,
        bondXp: 110,
      }).eligible,
      false
    );

    // Valid single pet meeting all 4 rules -> eligible
    assert.equal(
      evaluateFirstBondQuestEligibility({
        alreadyClaimed: false,
        questPetDone: true,
        questFeedDone: true,
        questPlayDone: true,
        bondXp: 100,
      }).eligible,
      true
    );
  });

  it('pins both pet image and PII-free JSON metadata in 2 stages to Pinata IPFS', async () => {
    const validPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const dataUrl = `data:image/png;base64,${validPng.toString('base64')}`;

    const calls: { url: string; body: unknown; auth: string | null }[] = [];
    const mockFetch: typeof fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString();
      const headers = init?.headers as Record<string, string> | undefined;
      calls.push({
        url,
        body: init?.body,
        auth: headers?.Authorization ?? null,
      });

      if (url.endsWith('/pinFileToIPFS')) {
        return new Response(JSON.stringify({ IpfsHash: 'QmTestImageCid123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.endsWith('/pinJSONToIPFS')) {
        return new Response(JSON.stringify({ IpfsHash: 'QmTestMetaCid456' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Unexpected Pinata URL: ${url}`);
    };

    const pinned = await pinPetPassportToPinata({
      pet: {
        petUid: 'pet-ipfs-test',
        name: 'Mochi',
        species: 'cat',
        pose: 'Cozy',
        photoUrl: dataUrl,
        discoveryScore: 95,
        bondXp: 120,
        careCount: 8,
        discoveredAt: new Date('2026-11-16T00:00:00Z'),
        originalDiscovererWallet: '0x000000000000000000000000000000000000dEaD',
      },
      recipientChecksum: '0x000000000000000000000000000000000000dEaD',
      apiKey: 'test-pinata-jwt',
      fetchFn: mockFetch,
    });

    assert.equal(calls.length, 2);
    assert.ok(calls[0].url.endsWith('/pinFileToIPFS'));
    assert.equal(calls[0].auth, 'Bearer test-pinata-jwt');
    assert.ok(calls[0].body instanceof FormData);

    assert.ok(calls[1].url.endsWith('/pinJSONToIPFS'));
    assert.equal(calls[1].auth, 'Bearer test-pinata-jwt');
    const jsonPayload = JSON.parse(String(calls[1].body)) as {
      pinataContent: { image: string; name: string };
    };
    assert.equal(jsonPayload.pinataContent.image, 'ipfs://QmTestImageCid123');
    assert.ok(!String(calls[1].body).includes('@'));
    assert.equal(pinned.imageCid, 'QmTestImageCid123');
    assert.equal(pinned.metadataCid, 'QmTestMetaCid456');
    assert.equal(pinned.metadataUri, 'ipfs://QmTestMetaCid456');
  });

  it('enforces rate limits with HTTP 429 and Retry-After', async () => {
    const miniApp = express();
    miniApp.get(
      '/limited',
      createRateLimiter({ windowMs: 10000, maxRequests: 2, keyPrefix: 'test' }),
      (_req, res) => res.json({ ok: true })
    );
    const server = await new Promise<ReturnType<typeof miniApp.listen>>((resolve) => {
      const s = miniApp.listen(0, () => resolve(s));
    });
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const r1 = await fetch(`http://127.0.0.1:${port}/limited`);
      const r2 = await fetch(`http://127.0.0.1:${port}/limited`);
      const r3 = await fetch(`http://127.0.0.1:${port}/limited`);
      assert.equal(r1.status, 200);
      assert.equal(r2.status, 200);
      assert.equal(r3.status, 429);
      assert.ok(r3.headers.get('retry-after'));
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('protects authenticated routes, returns 501 for Phase 2 adoption routes, and persists guest session/quest in PostgreSQL', async () => {
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    let createdGuestUid: string | null = null;
    const originalVerifyIdToken = adminAuth.verifyIdToken.bind(adminAuth);
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      const statusRes = await fetch(`${base}/api/web3/status`);
      assert.equal(statusRes.status, 200);
      const statusJson = (await statusRes.json()) as {
        chainId: number;
        phase: number;
      };
      assert.equal(statusJson.chainId, 43113);
      assert.equal(statusJson.phase, 1);

      for (const route of [
        { method: 'GET', path: '/api/keeper/state' },
        { method: 'POST', path: '/api/wallet/nonce' },
        { method: 'POST', path: '/api/wallet/verify' },
        { method: 'POST', path: '/api/web3/mint-claim' },
        { method: 'POST', path: '/api/web3/confirm-mint' },
        { method: 'POST', path: '/api/adoptions/offer' },
        { method: 'POST', path: '/api/adoptions/accept' },
        { method: 'POST', path: '/api/adoptions/cancel' },
      ]) {
        const res = await fetch(`${base}${route.path}`, {
          method: route.method,
          headers: { 'Content-Type': 'application/json' },
          body: route.method === 'POST' ? '{}' : undefined,
        });
        assert.equal(res.status, 401, `${route.method} ${route.path} should require auth`);
      }

      // Phase 2 adoption transfer endpoints return HTTP 501 when authenticated
      (adminAuth as { verifyIdToken: typeof adminAuth.verifyIdToken }).verifyIdToken =
        (async () =>
          ({
            uid: 'phase2-check-uid',
            email: 'phase2@test.local',
            name: 'Tester',
          }) as unknown as Awaited<ReturnType<typeof adminAuth.verifyIdToken>>);

      for (const path of [
        '/api/adoptions/offer',
        '/api/adoptions/accept',
        '/api/adoptions/cancel',
      ]) {
        const res = await fetch(`${base}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          },
          body: '{}',
        });
        assert.equal(res.status, 501, `${path} must return 501 in Phase 1`);
      }

      const spoofRes = await fetch(`${base}/api/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: Buffer.from('hello world fake jpeg').toString('base64'),
          mimeType: 'image/jpeg',
          theme: 'Fluffy Tails',
        }),
      });
      assert.equal(spoofRes.status, 400);

      // Guest PostgreSQL session + per-pet First Bond Quest flow
      const guestRes = await fetch(`${base}/api/guest/session`, {
        method: 'POST',
      });
      assert.equal(guestRes.status, 200);
      const guestJson = (await guestRes.json()) as {
        guestToken: string;
        state: {
          user: { uid: string; coins: number };
          firstBondQuest: { claimed: boolean };
          pets: Array<{
            petUid: string;
            name: string;
            bondXp: number;
            questPetDone: boolean;
            questFeedDone: boolean;
            questPlayDone: boolean;
          }>;
        };
      };
      createdGuestUid = guestJson.state.user.uid;
      assert.ok(guestJson.guestToken);
      assert.equal(guestJson.state.firstBondQuest.claimed, false);
      assert.equal(guestJson.state.pets.length, 3);
      const mochi = guestJson.state.pets[0];
      const sunny = guestJson.state.pets[1];
      assert.equal(mochi.questPetDone, false);

      // Pet + Feed + Play on Mochi only (starting Bond XP = 65; +15 +25 +20 = 125)
      const guestHeaders = {
        'Content-Type': 'application/json',
        'X-Guest-Token': guestJson.guestToken,
      };
      for (const step of [
        { actionType: 'pet' },
        { actionType: 'feed', food: 'carrot' },
        { actionType: 'play', toyId: 'toy-yarn' },
      ]) {
        const careRes = await fetch(`${base}/api/keeper/care`, {
          method: 'POST',
          headers: guestHeaders,
          body: JSON.stringify({
            petUid: mochi.petUid,
            ...step,
            idempotencyKey: `test-${Math.random()}`,
          }),
        });
        assert.equal(careRes.status, 200);
      }

      // Cross-pet isolation: claiming with Sunny fails because Sunny has no care steps
      const wrongPetClaim = await fetch(`${base}/api/keeper/quest/claim`, {
        method: 'POST',
        headers: guestHeaders,
        body: JSON.stringify({
          petUid: sunny.petUid,
          idempotencyKey: `claim-wrong-${Date.now()}`,
        }),
      });
      assert.equal(wrongPetClaim.status, 400);

      // Claiming with Mochi succeeds (+250 coins) and prevents second claim
      const validClaim = await fetch(`${base}/api/keeper/quest/claim`, {
        method: 'POST',
        headers: guestHeaders,
        body: JSON.stringify({
          petUid: mochi.petUid,
          idempotencyKey: `claim-ok-${Date.now()}`,
        }),
      });
      assert.equal(validClaim.status, 200);
      const claimedJson = (await validClaim.json()) as {
        state: {
          firstBondQuest: { claimed: boolean; claimedPetUid: string };
        };
      };
      assert.equal(claimedJson.state.firstBondQuest.claimed, true);
      assert.equal(claimedJson.state.firstBondQuest.claimedPetUid, mochi.petUid);

      const doubleClaim = await fetch(`${base}/api/keeper/quest/claim`, {
        method: 'POST',
        headers: guestHeaders,
        body: JSON.stringify({
          petUid: mochi.petUid,
          idempotencyKey: `claim-dup-${Date.now()}`,
        }),
      });
      assert.equal(doubleClaim.status, 409);

      // In-game stray rescue remains active for Phase 1
      const rescueRes = await fetch(`${base}/api/keeper/action`, {
        method: 'POST',
        headers: guestHeaders,
        body: JSON.stringify({
          action: 'rescue_stray',
          payload: {},
          idempotencyKey: `rescue-${Date.now()}`,
        }),
      });
      assert.equal(rescueRes.status, 200);
      const rescuedJson = (await rescueRes.json()) as {
        state: { user: { luredRescued: boolean }; pets: Array<{ name: string }> };
      };
      assert.equal(rescuedJson.state.user.luredRescued, true);
      assert.equal(rescuedJson.state.pets.length, 4);
    } finally {
      (adminAuth as { verifyIdToken: typeof adminAuth.verifyIdToken }).verifyIdToken =
        originalVerifyIdToken;
      if (createdGuestUid && process.env.DATABASE_URL) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uid, createdGuestUid))
          .limit(1);
        if (u) {
          await db.delete(careLogs).where(eq(careLogs.userId, u.id));
          await db.delete(pets).where(eq(pets.currentOwnerId, u.id));
          await db.delete(users).where(eq(users.id, u.id));
        }
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
  it('enforces GUEST_SESSION_SECRET in production and never falls back to defaults or SQL_PASSWORD', async () => {
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.GUEST_SESSION_SECRET;
    const prevSqlPwd = process.env.SQL_PASSWORD;
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      process.env.NODE_ENV = 'production';
      process.env.SQL_PASSWORD = 'some-db-password-that-must-not-be-used';

      // 1. Missing GUEST_SESSION_SECRET -> fails closed (503)
      delete process.env.GUEST_SESSION_SECRET;
      assert.throws(() => assertGuestSessionConfig(), /GUEST_SESSION_SECRET/);
      assert.throws(() => issueGuestSessionToken(), /GUEST_SESSION_SECRET/);
      const missingRes = await fetch(`${base}/api/guest/session`, {
        method: 'POST',
        headers: { Origin: base },
      });
      assert.equal(missingRes.status, 503);

      // 2. Placeholder / short GUEST_SESSION_SECRET -> fails closed (503)
      process.env.GUEST_SESSION_SECRET = 'MY_GUEST_SESSION_SECRET';
      assert.throws(() => assertGuestSessionConfig(), /GUEST_SESSION_SECRET/);
      process.env.GUEST_SESSION_SECRET = 'too-short-secret';
      assert.throws(() => assertGuestSessionConfig(), /GUEST_SESSION_SECRET/);
      const shortRes = await fetch(`${base}/api/guest/session`, {
        method: 'POST',
        headers: { Origin: base },
      });
      assert.equal(shortRes.status, 503);

      // 3. Valid >=32 char random secret -> succeeds and stays independent of SQL_PASSWORD
      process.env.GUEST_SESSION_SECRET =
        'a9f8e7d6c5b4a39281706f5e4d3c2b1a0987654321abcdef';
      assert.doesNotThrow(() => assertGuestSessionConfig());
      const issued = issueGuestSessionToken('prod-guest-id-001');
      assert.ok(verifyGuestSessionToken(issued.token));

      process.env.SQL_PASSWORD = 'rotated-db-password-unrelated-to-guest-hmac';
      assert.equal(verifyGuestSessionToken(issued.token)?.guestUid, 'guest:prod-guest-id-001');
    } finally {
      if (prevEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prevEnv;
      if (prevSecret === undefined) delete process.env.GUEST_SESSION_SECRET;
      else process.env.GUEST_SESSION_SECRET = prevSecret;
      if (prevSqlPwd === undefined) delete process.env.SQL_PASSWORD;
      else process.env.SQL_PASSWORD = prevSqlPwd;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('blocks cross-site and header-stripped cookie mutations (CSRF) across all mutating endpoints while allowing same-origin gameplay', async () => {
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    let createdGuestUid: string | null = null;
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      // Cross-site & sibling-subdomain POST /api/guest/session blocked
      const crossGuest = await fetch(`${base}/api/guest/session`, {
        method: 'POST',
        headers: {
          Origin: 'https://evil.example',
          'Sec-Fetch-Site': 'cross-site',
        },
      });
      assert.equal(crossGuest.status, 403);

      const sameSiteGuest = await fetch(`${base}/api/guest/session`, {
        method: 'POST',
        headers: {
          Origin: 'https://sub.evil.example',
          'Sec-Fetch-Site': 'same-site',
        },
      });
      assert.equal(sameSiteGuest.status, 403);

      // Legitimate same-origin guest session creation succeeds
      const guestRes = await fetch(`${base}/api/guest/session`, {
        method: 'POST',
        headers: { Origin: base },
      });
      assert.equal(guestRes.status, 200);
      const guestJson = (await guestRes.json()) as {
        guestToken: string;
        state: { user: { uid: string }; pets: Array<{ petUid: string }> };
      };
      createdGuestUid = guestJson.state.user.uid;
      const mochiUid = guestJson.state.pets[0].petUid;
      const cookieVal = `paws_guest=${encodeURIComponent(guestJson.guestToken)}`;

      // Cross-site, same-site, Origin: null, mismatched Referer, and header-stripped cookie attacks -> 403 across ALL mutating categories
      const csrfVectors: Array<{
        label: string;
        headers: Record<string, string>;
      }> = [
        {
          label: 'cross-site Origin',
          headers: { Origin: 'https://attacker.example', 'Sec-Fetch-Site': 'cross-site' },
        },
        {
          label: 'sibling-subdomain same-site',
          headers: { Origin: 'http://other.127.0.0.1', 'Sec-Fetch-Site': 'same-site' },
        },
        {
          label: 'Origin: null sandboxed iframe',
          headers: { Origin: 'null' },
        },
        {
          label: 'mismatched Referer',
          headers: { Referer: 'https://phishing.example/form.html' },
        },
        {
          label: 'header-stripped cookie-only request',
          headers: {},
        },
      ];

      const mutatingTargets: Array<{
        name: string;
        path: string;
        body: Record<string, unknown>;
      }> = [
        {
          name: 'care',
          path: '/api/keeper/care',
          body: { petUid: mochiUid, actionType: 'pet', idempotencyKey: 'csrf-care' },
        },
        {
          name: 'farming tap_plot',
          path: '/api/keeper/action',
          body: { action: 'tap_plot', payload: { plotId: 'plot-3', activeSeed: 'carrot' }, idempotencyKey: 'csrf-farm' },
        },
        {
          name: 'market list_market',
          path: '/api/keeper/action',
          body: { action: 'list_market', payload: { item: 'carrot', qty: 1, price: 30 }, idempotencyKey: 'csrf-market' },
        },
        {
          name: 'accessories equip_accessory',
          path: '/api/keeper/action',
          body: { action: 'equip_accessory', payload: { petUid: mochiUid, accessoryId: null }, idempotencyKey: 'csrf-acc' },
        },
        {
          name: 'neighbors neighbor_pat',
          path: '/api/keeper/action',
          body: { action: 'neighbor_pat', payload: { neighborId: 'neighbor-1' }, idempotencyKey: 'csrf-neighbor' },
        },
        {
          name: 'rescue rescue_stray',
          path: '/api/keeper/action',
          body: { action: 'rescue_stray', payload: {}, idempotencyKey: 'csrf-rescue' },
        },
        {
          name: 'quest claim',
          path: '/api/keeper/quest/claim',
          body: { petUid: mochiUid, idempotencyKey: 'csrf-quest' },
        },
        {
          name: 'add-to-garden',
          path: '/api/keeper/add-to-garden',
          body: { submissionUid: 'sub-fake', idempotencyKey: 'csrf-garden' },
        },
        {
          name: 'judge with cookie',
          path: '/api/judge',
          body: { imageBase64: 'AA==', mimeType: 'image/png', theme: 'Cozy' },
        },
        {
          name: 'guest session refresh with cookie',
          path: '/api/guest/session',
          body: {},
        },
      ];

      for (const target of mutatingTargets) {
        for (const vector of csrfVectors) {
          const res = await fetch(`${base}${target.path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: cookieVal,
              ...vector.headers,
            },
            body: JSON.stringify(target.body),
          });
          assert.equal(
            res.status,
            403,
            `Expected 403 CSRF rejection for ${target.name} via ${vector.label}, got ${res.status}`
          );
        }
      }

      // Verify legitimate same-origin cookie mutations work across gameplay categories
      const sameOriginHeaders = {
        'Content-Type': 'application/json',
        Cookie: cookieVal,
        Origin: base,
        'Sec-Fetch-Site': 'same-origin',
      };
      const sameOriginChecks: Array<{ path: string; body: Record<string, unknown> }> = [
        {
          path: '/api/keeper/care',
          body: { petUid: mochiUid, actionType: 'pet', idempotencyKey: `ok-care-${Date.now()}` },
        },
        {
          path: '/api/keeper/action',
          body: { action: 'refill_water', payload: {}, idempotencyKey: `ok-farm-${Date.now()}` },
        },
        {
          path: '/api/keeper/action',
          body: { action: 'equip_accessory', payload: { petUid: mochiUid, accessoryId: null }, idempotencyKey: `ok-acc-${Date.now()}` },
        },
        {
          path: '/api/keeper/action',
          body: { action: 'neighbor_pat', payload: { neighborId: 'neighbor-1' }, idempotencyKey: `ok-nb-${Date.now()}` },
        },
        {
          path: '/api/keeper/action',
          body: { action: 'rescue_stray', payload: {}, idempotencyKey: `ok-rescue-${Date.now()}` },
        },
      ];

      for (const check of sameOriginChecks) {
        const res = await fetch(`${base}${check.path}`, {
          method: 'POST',
          headers: sameOriginHeaders,
          body: JSON.stringify(check.body),
        });
        assert.equal(res.status, 200, `Same-origin cookie mutation failed on ${check.path}`);
      }
    } finally {
      if (createdGuestUid && process.env.DATABASE_URL) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uid, createdGuestUid))
          .limit(1);
        if (u) {
          await db.delete(careLogs).where(eq(careLogs.userId, u.id));
          await db.delete(pets).where(eq(pets.currentOwnerId, u.id));
          await db.delete(users).where(eq(users.id, u.id));
        }
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('grants First Bond Quest reward AT MOST ONCE under concurrent HTTP claim requests', async () => {
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    let createdGuestUid: string | null = null;
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      const guestRes = await fetch(`${base}/api/guest/session`, { method: 'POST' });
      assert.equal(guestRes.status, 200);
      const guestJson = (await guestRes.json()) as {
        guestToken: string;
        state: {
          user: { uid: string; coins: number };
          pets: Array<{ petUid: string }>;
        };
      };
      createdGuestUid = guestJson.state.user.uid;
      const mochiUid = guestJson.state.pets[0].petUid;
      const headers = {
        'Content-Type': 'application/json',
        'X-Guest-Token': guestJson.guestToken,
      };

      for (const step of [
        { actionType: 'pet' },
        { actionType: 'feed', food: 'carrot' },
        { actionType: 'play', toyId: 'toy-yarn' },
      ]) {
        const res = await fetch(`${base}/api/keeper/care`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            petUid: mochiUid,
            ...step,
            idempotencyKey: `race-prep-${step.actionType}-${Date.now()}`,
          }),
        });
        assert.equal(res.status, 200);
      }

      const preClaimRes = await fetch(`${base}/api/keeper/state`, { headers });
      const preClaim = (await preClaimRes.json()) as {
        user: { coins: number };
      };

      // Fire 5 parallel claim requests with distinct idempotencyKeys
      const responses = await Promise.all(
        Array.from({ length: 5 }, (_, idx) =>
          fetch(`${base}/api/keeper/quest/claim`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              petUid: mochiUid,
              idempotencyKey: `parallel-claim-${idx}-${Date.now()}`,
            }),
          })
        )
      );

      const statuses = responses.map((r) => r.status);
      const successCount = statuses.filter((s) => s === 200).length;
      const conflictCount = statuses.filter((s) => s === 409).length;
      assert.equal(successCount, 1, `Expected exactly 1 success, got statuses ${statuses}`);
      assert.equal(conflictCount, 4, `Expected 4 conflicts, got statuses ${statuses}`);

      const postClaimRes = await fetch(`${base}/api/keeper/state`, { headers });
      const postClaim = (await postClaimRes.json()) as {
        user: { coins: number };
        firstBondQuest: { claimed: boolean; claimedPetUid: string | null };
      };
      assert.equal(postClaim.user.coins, preClaim.user.coins + 250);
      assert.equal(postClaim.firstBondQuest.claimed, true);
      assert.equal(postClaim.firstBondQuest.claimedPetUid, mochiUid);
    } finally {
      if (createdGuestUid && process.env.DATABASE_URL) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uid, createdGuestUid))
          .limit(1);
        if (u) {
          await db.delete(careLogs).where(eq(careLogs.userId, u.id));
          await db.delete(pets).where(eq(pets.currentOwnerId, u.id));
          await db.delete(users).where(eq(users.id, u.id));
        }
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('serializes concurrent PostgreSQL pet care actions atomically without lost Bond XP, coins, or double-spent food', async () => {
    const suffix = Date.now();
    const uid = `guest:test-atomic-${suffix}`;
    let userId: number | null = null;
    try {
      const user = await getOrCreateUser(uid, `${uid}@guest.local`, 'AtomicGuest', {
        isGuest: true,
      });
      userId = user.id;
      const initialUserState = await getFullKeeperState(user.id);
      const mochiUid =
        initialUserState.pets.find((p) => p.name === 'Mochi')?.petUid ||
        `pet-calico-${user.id}`;
      const dupKey = `atomic-pet-${suffix}`;

      // Fire parallel care calls: 1) pet (dupKey), 2) concurrent replay of dupKey, 3) feed last carrot, 4) play yarn
      const results = await Promise.all([
        performPetCareAction({
          userId: user.id,
          petUid: mochiUid,
          actionType: 'pet',
          idempotencyKey: dupKey,
        }),
        performPetCareAction({
          userId: user.id,
          petUid: mochiUid,
          actionType: 'pet',
          idempotencyKey: dupKey,
        }),
        performPetCareAction({
          userId: user.id,
          petUid: mochiUid,
          actionType: 'feed',
          food: 'carrot',
          idempotencyKey: `atomic-feed-1-${suffix}`,
        }),
        performPetCareAction({
          userId: user.id,
          petUid: mochiUid,
          actionType: 'play',
          toyId: 'toy-yarn',
          idempotencyKey: `atomic-play-${suffix}`,
        }),
        performPetCareAction({
          userId: user.id,
          petUid: mochiUid,
          actionType: 'feed',
          food: 'carrot',
          idempotencyKey: `atomic-feed-2-${suffix}`,
        }),
      ]);

      // Only 1 feed may consume the single starter carrot; the second feed sees 0 carrots left
      const noFoodCount = results.filter((r) => r.toast === 'No food').length;
      assert.equal(noFoodCount, 1, 'Single carrot cannot be consumed twice under concurrency');

      const state = await getFullKeeperState(user.id);
      const mochi = state.pets.find((p) => p.petUid === mochiUid)!;
      // 12560 + 15 (pet once) + 25 (feed once) + 20 (play) = 12620
      assert.equal(state.user.coins, 12620);
      // 65 + 15 + 25 + 20 = 125
      assert.equal(mochi.bondXp, 125);
      // 3 + 3 = 6
      assert.equal(mochi.careCount, 6);
      assert.equal(state.user.foodInventory.carrot, 0);
      assert.equal(mochi.questPetDone, true);
      assert.equal(mochi.questFeedDone, true);
      assert.equal(mochi.questPlayDone, true);
    } finally {
      if (userId !== null && process.env.DATABASE_URL) {
        await db.delete(careLogs).where(eq(careLogs.userId, userId));
        await db.delete(pets).where(eq(pets.currentOwnerId, userId));
        await db.delete(users).where(eq(users.id, userId));
      }
    }
  });

  it('merges Guest (including claimed First Bond Quest) into an active Keeper idempotently without losing pets or duplicating rewards', async () => {
    const suffix = Date.now();
    const guestUid = `guest:test-merge-g-${suffix}`;
    const keeperUid = `keeper-merge-k-${suffix}`;
    const keeper2Uid = `keeper-merge-k2-${suffix}`;
    const guest2Uid = `guest:test-merge-g2-${suffix}`;
    const createdUserIds: number[] = [];

    try {
      // --- Scenario A: Guest already claimed First Bond Quest + has custom pet & toy/hat; Keeper ALSO has progress & own custom pet, hasn't claimed quest yet ---
      const guest = await getOrCreateUser(guestUid, `${guestUid}@guest.local`, 'Guest', {
        isGuest: true,
      });
      createdUserIds.push(guest.id);
      const keeper = await getOrCreateUser(keeperUid, `keeper-${suffix}@test.local`, 'KeeperA');
      createdUserIds.push(keeper.id);

      const guestMochiUid = `pet-calico-${guest.id}`;
      await performPetCareAction({
        userId: guest.id,
        petUid: guestMochiUid,
        actionType: 'pet',
        idempotencyKey: `g-pet-${suffix}`,
      });
      await performPetCareAction({
        userId: guest.id,
        petUid: guestMochiUid,
        actionType: 'feed',
        food: 'carrot',
        idempotencyKey: `g-feed-${suffix}`,
      });
      await performPetCareAction({
        userId: guest.id,
        petUid: guestMochiUid,
        actionType: 'play',
        toyId: 'toy-yarn',
        idempotencyKey: `g-play-${suffix}`,
      });
      await claimFirstBondQuest({
        userId: guest.id,
        petUid: guestMochiUid,
        idempotencyKey: `g-claim-${suffix}`,
      });
      await performGeneralGameAction({
        userId: guest.id,
        uid: guestUid,
        action: 'buy_toy',
        payload: { toyId: 'toy-tennis' },
        idempotencyKey: `g-toy-${suffix}`,
      });
      await performGeneralGameAction({
        userId: guest.id,
        uid: guestUid,
        action: 'buy_shop_item',
        payload: { itemId: 'straw-hat' },
        idempotencyKey: `g-hat-${suffix}`,
      });

      const guestCustomPetUid = `pet-custom-guest-${suffix}`;
      if (!process.env.DATABASE_URL) {
        await adminDb.collection('pets').doc(guestCustomPetUid).set({
          petUid: guestCustomPetUid,
          originalDiscovererId: guest.id,
          originalDiscovererUid: guestUid,
          currentOwnerId: guest.id,
          currentOwnerUid: guestUid,
          name: 'Pippin',
          species: 'cat',
          pose: 'Sunny',
          photoUrl: '/src/assets/images/cropped_calico_cat_1794637541476.jpg',
          cutoutMode: 'auto',
          posX: 40,
          posY: 50,
          discoveryScore: 91,
          bondXp: 35,
          careCount: 1,
          memories: [],
          mintStatus: 'unminted',
        });
        await adminDb.collection('photoSubmissions').doc(`sub-guest-${suffix}`).set({
          submissionUid: `sub-guest-${suffix}`,
          userId: guest.id,
          uid: guestUid,
          imageSha256: `sha-guest-${suffix}`,
          mimeType: 'image/png',
          byteSize: 1200,
          photoUrl: 'data:image/png;base64,AA==',
          theme: 'Cozy',
          isAnimal: true,
          confidence: 95,
          overallScore: 91,
          verdict: 'Purrfect',
          tierLabel: 'Gold',
          sharp: 90,
          light: 90,
          species: 'Cat',
          pose: 'Sunny',
          themeScore: 90,
          themeMatch: true,
          petName: 'Pippin',
          coinsReward: 150,
          expReward: 50,
          addedToGarden: true,
          petUid: guestCustomPetUid,
        });
      } else {
        await db.insert(pets).values({
          petUid: guestCustomPetUid,
          originalDiscovererId: guest.id,
          originalDiscovererUid: guestUid,
          currentOwnerId: guest.id,
          name: 'Pippin',
          species: 'cat',
          pose: 'Sunny',
          photoUrl: '/src/assets/images/cropped_calico_cat_1794637541476.jpg',
          cutoutMode: 'auto',
          posX: 40,
          posY: 50,
          discoveryScore: 91,
          bondXp: 35,
          careCount: 1,
          memories: [],
          mintStatus: 'unminted',
        });
        await db.insert(photoSubmissions).values({
          submissionUid: `sub-guest-${suffix}`,
          userId: guest.id,
          imageSha256: `sha-guest-${suffix}`,
          mimeType: 'image/png',
          byteSize: 1200,
          photoUrl: 'data:image/png;base64,AA==',
          theme: 'Cozy',
          isAnimal: true,
          confidence: 95,
          overallScore: 91,
          verdict: 'Purrfect',
          tierLabel: 'Gold',
          sharp: 90,
          light: 90,
          species: 'Cat',
          pose: 'Sunny',
          themeScore: 90,
          themeMatch: true,
          petName: 'Pippin',
          coinsReward: 150,
          expReward: 50,
          addedToGarden: true,
          petUid: guestCustomPetUid,
        });
      }

      // Give Keeper their own independent progress, own coins balance (15000), and own custom pet
      const keeperCustomPetUid = `pet-custom-keeper-${suffix}`;
      if (!process.env.DATABASE_URL) {
        await adminDb.collection('users').doc(keeperUid).update({ coins: 15000 });
      } else {
        await db
          .update(users)
          .set({ coins: 15000 })
          .where(eq(users.id, keeper.id));
      }
      await performPetCareAction({
        userId: keeper.id,
        petUid: `pet-retriever-${keeper.id}`,
        actionType: 'pet',
        idempotencyKey: `k-pet-${suffix}`,
      });
      if (!process.env.DATABASE_URL) {
        await adminDb.collection('pets').doc(keeperCustomPetUid).set({
          petUid: keeperCustomPetUid,
          originalDiscovererId: keeper.id,
          originalDiscovererUid: keeperUid,
          currentOwnerId: keeper.id,
          currentOwnerUid: keeperUid,
          name: 'Maple',
          species: 'dog',
          pose: 'Happy',
          photoUrl: '/src/assets/images/cropped_golden_dog_1794637542709.jpg',
          cutoutMode: 'auto',
          posX: 60,
          posY: 55,
          discoveryScore: 87,
          bondXp: 25,
          careCount: 1,
          memories: [],
          mintStatus: 'unminted',
        });
        await adminDb.collection('photoSubmissions').doc(`sub-keeper-${suffix}`).set({
          submissionUid: `sub-keeper-${suffix}`,
          userId: keeper.id,
          uid: keeperUid,
          imageSha256: `sha-keeper-${suffix}`,
          mimeType: 'image/png',
          byteSize: 1200,
          photoUrl: 'data:image/png;base64,BB==',
          theme: 'Fluffy',
          isAnimal: true,
          confidence: 92,
          overallScore: 87,
          verdict: 'Great',
          tierLabel: 'Silver',
          sharp: 85,
          light: 88,
          species: 'Dog',
          pose: 'Happy',
          themeScore: 87,
          themeMatch: true,
          petName: 'Maple',
          coinsReward: 150,
          expReward: 50,
          addedToGarden: true,
          petUid: keeperCustomPetUid,
        });
      } else {
        await db.insert(pets).values({
          petUid: keeperCustomPetUid,
          originalDiscovererId: keeper.id,
          originalDiscovererUid: keeperUid,
          currentOwnerId: keeper.id,
          name: 'Maple',
          species: 'dog',
          pose: 'Happy',
          photoUrl: '/src/assets/images/cropped_golden_dog_1794637542709.jpg',
          cutoutMode: 'auto',
          posX: 60,
          posY: 55,
          discoveryScore: 87,
          bondXp: 25,
          careCount: 1,
          memories: [],
          mintStatus: 'unminted',
        });
        await db.insert(photoSubmissions).values({
          submissionUid: `sub-keeper-${suffix}`,
          userId: keeper.id,
          imageSha256: `sha-keeper-${suffix}`,
          mimeType: 'image/png',
          byteSize: 1200,
          photoUrl: 'data:image/png;base64,BB==',
          theme: 'Fluffy',
          isAnimal: true,
          confidence: 92,
          overallScore: 87,
          verdict: 'Great',
          tierLabel: 'Silver',
          sharp: 85,
          light: 88,
          species: 'Dog',
          pose: 'Happy',
          themeScore: 87,
          themeMatch: true,
          petName: 'Maple',
          coinsReward: 150,
          expReward: 50,
          addedToGarden: true,
          petUid: keeperCustomPetUid,
        });
      }

      // Execute two concurrent merges for idempotency verification
      const [m1, m2] = await Promise.all([
        mergeGuestIntoKeeper({
          guestUid,
          keeperUserId: keeper.id,
          keeperUid,
        }),
        mergeGuestIntoKeeper({
          guestUid,
          keeperUserId: keeper.id,
          keeperUid,
        }),
      ]);
      assert.equal(
        [m1.merged, m2.merged].filter(Boolean).length,
        1,
        'Concurrent merge must run exactly once'
      );
      const idempotentSkip = m1.merged ? m2 : m1;
      assert.equal(idempotentSkip.reason, 'already_merged');

      // Sequential third call also idempotent
      const m3 = await mergeGuestIntoKeeper({
        guestUid,
        keeperUserId: keeper.id,
        keeperUid,
      });
      assert.equal(m3.merged, false);

      const mergedState = await getFullKeeperState(keeper.id);
      const petUids = new Set(mergedState.pets.map((p) => p.petUid));
      assert.ok(petUids.has(keeperCustomPetUid), 'Keeper custom pet retained');
      assert.ok(petUids.has(guestCustomPetUid), 'Guest custom pet migrated');
      assert.equal(mergedState.album.length, 2, 'Both album submissions preserved');
      assert.ok(mergedState.user.ownedToys.includes('toy-tennis'));
      assert.ok(mergedState.user.ownedShopItems.includes('straw-hat'));
      assert.equal(mergedState.firstBondQuest.claimed, true);
      assert.equal(mergedState.firstBondQuest.claimedPetUid, `pet-calico-${keeper.id}`);
      // Keeper started at 15000 + 15 (pet Sunny) + 250 (inherited guest First Bond Quest reward) = 15265 (no starter 12560 coin duplication!)
      assert.equal(mergedState.user.coins, 15265);
      // Keeper started at Lv12/64% (1264) + 6 (pet Sunny) + 86 (guest earned 6+12+8+60 EXP) = 1356 -> Lv 13, 56%
      assert.equal(mergedState.user.level, 13);
      assert.equal(mergedState.user.expPercent, 56);

      if (process.env.DATABASE_URL) {
        const remainingGuest = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uid, guestUid));
        assert.equal(remainingGuest.length, 0);
      }

      // --- Scenario B: Both Guest and Keeper ALREADY claimed First Bond Quest -> duplicate 250 Quest coins & 60 Quest EXP stripped, non-quest earned gameplay (+60 coins, +26 EXP) preserved ---
      const guest2 = await getOrCreateUser(guest2Uid, `${guest2Uid}@guest.local`, 'Guest2', {
        isGuest: true,
      });
      createdUserIds.push(guest2.id);
      const keeper2 = await getOrCreateUser(keeper2Uid, `keeper2-${suffix}@test.local`, 'KeeperB');
      createdUserIds.push(keeper2.id);

      for (const u of [guest2, keeper2]) {
        const mUid = `pet-calico-${u.id}`;
        await performPetCareAction({
          userId: u.id,
          petUid: mUid,
          actionType: 'pet',
          idempotencyKey: `b-pet-${u.id}-${suffix}`,
        });
        await performPetCareAction({
          userId: u.id,
          petUid: mUid,
          actionType: 'feed',
          food: 'carrot',
          idempotencyKey: `b-feed-${u.id}-${suffix}`,
        });
        await performPetCareAction({
          userId: u.id,
          petUid: mUid,
          actionType: 'play',
          toyId: 'toy-yarn',
          idempotencyKey: `b-play-${u.id}-${suffix}`,
        });
        await claimFirstBondQuest({
          userId: u.id,
          petUid: mUid,
          idempotencyKey: `b-claim-${u.id}-${suffix}`,
        });
      }

      const preMergeB = await getFullKeeperState(keeper2.id);
      const resB = await mergeGuestIntoKeeper({
        guestUid: guest2Uid,
        keeperUserId: keeper2.id,
        keeperUid: keeper2Uid,
      });
      assert.equal(resB.merged, true);
      const postMergeB = await getFullKeeperState(keeper2.id);
      assert.equal(
        postMergeB.user.coins,
        preMergeB.user.coins + 60,
        'Duplicate Quest 250 + Starter 12560 must be stripped while preserving Guest non-quest earned coins (+60)'
      );
      assert.equal(
        postMergeB.user.level * 100 + postMergeB.user.expPercent,
        preMergeB.user.level * 100 + preMergeB.user.expPercent + 26,
        'Duplicate Quest 60 EXP must be stripped while preserving Guest non-quest earned EXP (+26)'
      );

      // --- Scenario C1: Active Keeper merges Guest with non-quest earned Coins (+115 from rescue + pet) & EXP (+6) ---
      const guest3Uid = `guest:test-merge-g3-${suffix}`;
      const keeper3Uid = `keeper-merge-k3-${suffix}`;
      const guest3 = await getOrCreateUser(guest3Uid, `${guest3Uid}@guest.local`, 'Guest3', {
        isGuest: true,
      });
      createdUserIds.push(guest3.id);
      const keeper3 = await getOrCreateUser(keeper3Uid, `keeper3-${suffix}@test.local`, 'KeeperC');
      createdUserIds.push(keeper3.id);

      if (!process.env.DATABASE_URL) {
        await adminDb.collection('users').doc(keeper3Uid).update({ coins: 15000 });
      } else {
        await db.update(users).set({ coins: 15000 }).where(eq(users.id, keeper3.id));
      }
      await performPetCareAction({
        userId: keeper3.id,
        petUid: `pet-retriever-${keeper3.id}`,
        actionType: 'pet',
        idempotencyKey: `k3-pet-${suffix}`,
      });
      await performPetCareAction({
        userId: guest3.id,
        petUid: `pet-calico-${guest3.id}`,
        actionType: 'pet',
        idempotencyKey: `g3-pet-${suffix}`,
      });
      await performGeneralGameAction({
        userId: guest3.id,
        uid: guest3Uid,
        action: 'rescue_stray',
        payload: {},
        idempotencyKey: `g3-rescue-${suffix}`,
      });

      const preMergeC = await getFullKeeperState(keeper3.id);
      const resC = await mergeGuestIntoKeeper({
        guestUid: guest3Uid,
        keeperUserId: keeper3.id,
        keeperUid: keeper3Uid,
      });
      assert.equal(resC.merged, true);
      const postMergeC = await getFullKeeperState(keeper3.id);
      // Guest earned +15 (pet) +100 (rescue) = +115 coins above 12560, and +6 EXP
      assert.equal(postMergeC.user.coins, preMergeC.user.coins + 115);
      assert.equal(
        postMergeC.user.level * 100 + postMergeC.user.expPercent,
        preMergeC.user.level * 100 + preMergeC.user.expPercent + 6
      );
      assert.equal(postMergeC.user.luredRescued, true);

      // --- Scenario C2: Fresh Keeper (0 prior care/progress) inherits full Guest state without duplicating 12560 starter coins ---
      const guest4Uid = `guest:test-merge-g4-${suffix}`;
      const keeper4Uid = `keeper-merge-k4-${suffix}`;
      const guest4 = await getOrCreateUser(guest4Uid, `${guest4Uid}@guest.local`, 'Guest4', {
        isGuest: true,
      });
      createdUserIds.push(guest4.id);
      const keeper4 = await getOrCreateUser(keeper4Uid, `keeper4-${suffix}@test.local`, 'KeeperFresh');
      createdUserIds.push(keeper4.id);

      await performPetCareAction({
        userId: guest4.id,
        petUid: `pet-calico-${guest4.id}`,
        actionType: 'pet',
        idempotencyKey: `g4-pet-${suffix}`,
      });
      const resD = await mergeGuestIntoKeeper({
        guestUid: guest4Uid,
        keeperUserId: keeper4.id,
        keeperUid: keeper4Uid,
      });
      assert.equal(resD.merged, true);
      const postMergeD = await getFullKeeperState(keeper4.id);
      assert.equal(postMergeD.user.coins, 12575);
      assert.equal(postMergeD.user.level, 12);
      assert.equal(postMergeD.user.expPercent, 70);
    } finally {
      if (process.env.DATABASE_URL) {
        for (const uid of createdUserIds) {
          await db.delete(photoSubmissions).where(eq(photoSubmissions.userId, uid));
          await db.delete(careLogs).where(eq(careLogs.userId, uid));
          await db.delete(pets).where(eq(pets.currentOwnerId, uid));
          await db.delete(pets).where(eq(pets.originalDiscovererId, uid));
          await db.delete(users).where(eq(users.id, uid));
        }
      }
    }
  });

  it('targets selected non-Mochi pets (Sunny, Pip, Biscuit) for Pet/Feed/Play without hardcoding index 0, and attributes Bond XP + Quest progress accurately', async () => {
    const {
      applyLocalPetCareUpdate,
      resolveSelectedPetId,
      resolveTargetPet,
    } = await import('../src/lib/petInteractions.ts');

    // 1. Frontend targeting helper tests across multiple pets
    const initialList = [
      { id: 'pet-calico', petUid: 'u-mochi', name: 'Mochi', species: 'cat' as const, photoUrl: '', x: 34, y: 50, bondXp: 65, careCount: 3 },
      { id: 'pet-retriever', petUid: 'u-sunny', name: 'Sunny', species: 'dog' as const, photoUrl: '', x: 63, y: 45, bondXp: 40, careCount: 2 },
      { id: 'pet-bunny', petUid: 'u-pip', name: 'Pip', species: 'bunny' as const, photoUrl: '', x: 50, y: 62, bondXp: 25, careCount: 1 },
    ];
    assert.equal(resolveSelectedPetId(initialList, 'pet-retriever'), 'pet-retriever');
    const chosenSunny = resolveTargetPet(initialList, undefined, 'pet-retriever')!;
    assert.equal(chosenSunny.name, 'Sunny');

    const afterPlaySunny = applyLocalPetCareUpdate(initialList, chosenSunny.id, 'play');
    assert.equal(afterPlaySunny[0].bondXp, 65, 'Mochi must NOT gain XP when Sunny plays');
    assert.equal(afterPlaySunny[0].questPlayDone, undefined);
    assert.equal(afterPlaySunny[1].bondXp, 60, 'Sunny must gain +20 Bond XP from Play');
    assert.equal(afterPlaySunny[1].questPlayDone, true);
    assert.equal(afterPlaySunny[2].bondXp, 25, 'Pip must remain unchanged');

    // 2. Backend PostgreSQL multi-pet care + Sunny First Bond Quest + Biscuit rescue toy play
    const suffix = Date.now();
    const uid = `guest:multi-pet-${suffix}`;
    let userId: number | null = null;
    try {
      const user = await getOrCreateUser(uid, `${uid}@guest.local`, 'MultiPetTester', {
        isGuest: true,
      });
      userId = user.id;
      const initialState = await getFullKeeperState(user.id);
      const sunny = initialState.pets.find((p) => p.name === 'Sunny')!;
      const pip = initialState.pets.find((p) => p.name === 'Pip')!;
      const mochi = initialState.pets.find((p) => p.name === 'Mochi')!;

      // Care on Sunny (40 -> +15 pet +25 feed +20 play = 100 Bond XP)
      await performPetCareAction({
        userId: user.id,
        petUid: sunny.petUid!,
        actionType: 'pet',
        idempotencyKey: `mp-sunny-pet-${suffix}`,
      });
      await performPetCareAction({
        userId: user.id,
        petUid: sunny.petUid!,
        actionType: 'feed',
        food: 'carrot',
        idempotencyKey: `mp-sunny-feed-${suffix}`,
      });
      await performPetCareAction({
        userId: user.id,
        petUid: sunny.petUid!,
        actionType: 'play',
        toyId: 'toy-yarn',
        idempotencyKey: `mp-sunny-play-${suffix}`,
      });

      // Play toy with Pip too (25 -> 45 Bond XP)
      await performPetCareAction({
        userId: user.id,
        petUid: pip.petUid!,
        actionType: 'play',
        toyId: 'toy-yarn',
        idempotencyKey: `mp-pip-play-${suffix}`,
      });

      // Rescue Biscuit and play toy with Biscuit (30 -> 50 Bond XP)
      await performGeneralGameAction({
        userId: user.id,
        uid,
        action: 'rescue_stray',
        payload: {},
        idempotencyKey: `mp-rescue-${suffix}`,
      });
      const midState = await getFullKeeperState(user.id);
      const biscuit = midState.pets.find((p) => p.name === 'Biscuit')!;
      assert.ok(biscuit?.petUid);

      await performPetCareAction({
        userId: user.id,
        petUid: biscuit.petUid!,
        actionType: 'play',
        toyId: 'toy-yarn',
        idempotencyKey: `mp-biscuit-play-${suffix}`,
      });

      // Claim First Bond Quest on Sunny (NOT Mochi!)
      const questClaim = await claimFirstBondQuest({
        userId: user.id,
        petUid: sunny.petUid!,
        idempotencyKey: `mp-sunny-quest-${suffix}`,
      });
      assert.equal(questClaim.claimed, true);
      assert.equal(questClaim.petUid, sunny.petUid);

      const finalState = await getFullKeeperState(user.id);
      const finalMochi = finalState.pets.find((p) => p.petUid === mochi.petUid)!;
      const finalSunny = finalState.pets.find((p) => p.petUid === sunny.petUid)!;
      const finalPip = finalState.pets.find((p) => p.petUid === pip.petUid)!;
      const finalBiscuit = finalState.pets.find((p) => p.petUid === biscuit.petUid)!;

      assert.equal(finalMochi.bondXp, 65, 'Mochi remains at starter 65 Bond XP');
      assert.equal(finalMochi.questPlayDone, false);
      assert.equal(finalSunny.bondXp, 100);
      assert.equal(finalSunny.questPetDone, true);
      assert.equal(finalSunny.questFeedDone, true);
      assert.equal(finalSunny.questPlayDone, true);
      assert.equal(finalPip.bondXp, 45);
      assert.equal(finalPip.questPlayDone, true);
      assert.equal(finalBiscuit.bondXp, 50);
      assert.equal(finalBiscuit.questPlayDone, true);
      assert.equal(finalState.firstBondQuest.claimedPetUid, sunny.petUid);
    } finally {
      if (userId !== null && process.env.DATABASE_URL) {
        await db.delete(careLogs).where(eq(careLogs.userId, userId));
        await db.delete(pets).where(eq(pets.currentOwnerId, userId));
        await db.delete(users).where(eq(users.id, userId));
      }
    }
  });

  it('exposes geminiConfigured=false without breaking Sanctuary/Farm/Quest gameplay when GEMINI_API_KEY is unset', async () => {
    const prevGemini = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    let createdGuestUid: string | null = null;
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      const statusRes = await fetch(`${base}/api/web3/status`);
      assert.equal(statusRes.status, 200);
      const statusJson = (await statusRes.json()) as { geminiConfigured?: boolean };
      assert.equal(statusJson.geminiConfigured, false);

      // Core gameplay (session, care, farming, quest) works normally without GEMINI_API_KEY
      const guestRes = await fetch(`${base}/api/guest/session`, { method: 'POST' });
      assert.equal(guestRes.status, 200);
      const guestJson = (await guestRes.json()) as {
        guestToken: string;
        state: { user: { uid: string }; pets: Array<{ petUid: string }> };
      };
      createdGuestUid = guestJson.state.user.uid;
      const headers = {
        'Content-Type': 'application/json',
        'X-Guest-Token': guestJson.guestToken,
      };

      const careRes = await fetch(`${base}/api/keeper/care`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          petUid: guestJson.state.pets[1].petUid,
          actionType: 'play',
          toyId: 'toy-yarn',
          idempotencyKey: `no-gem-play-${Date.now()}`,
        }),
      });
      assert.equal(careRes.status, 200);

      // Judging returns honest 503 with zero fabricated scores
      const validPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]).toString('base64');
      const judgeRes = await fetch(`${base}/api/judge`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageBase64: validPng, mimeType: 'image/png', theme: 'Cozy' }),
      });
      assert.equal(judgeRes.status, 503);
      const judgeBody = (await judgeRes.json()) as { error?: string; overallScore?: unknown };
      assert.match(judgeBody.error || '', /GEMINI_API_KEY/);
      assert.equal(judgeBody.overallScore, undefined);
    } finally {
      if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevGemini;
      if (createdGuestUid && process.env.DATABASE_URL) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uid, createdGuestUid))
          .limit(1);
        if (u) {
          await db.delete(careLogs).where(eq(careLogs.userId, u.id));
          await db.delete(pets).where(eq(pets.currentOwnerId, u.id));
          await db.delete(users).where(eq(users.id, u.id));
        }
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('starts cleanly under native node server.ts in production mode and fails closed without GUEST_SESSION_SECRET', async () => {
    const freePort = await new Promise<number>((resolve, reject) => {
      const srv = net.createServer();
      srv.once('error', reject);
      srv.listen(0, '0.0.0.0', () => {
        const addr = srv.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        srv.close(() => resolve(port));
      });
    });

    // 1. Missing GUEST_SESSION_SECRET in NODE_ENV=production must fail closed
    const failBoot = await new Promise<{ code: number | null; stderr: string }>((resolve) => {
      const child = spawn(process.execPath, ['src/server/server.ts'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: String(freePort),
          GUEST_SESSION_SECRET: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('exit', (code) => resolve({ code, stderr }));
    });
    assert.equal(failBoot.code, 1);
    assert.match(failBoot.stderr, /GUEST_SESSION_SECRET/);

    // 2. With valid GUEST_SESSION_SECRET, native `node server.ts` binds 0.0.0.0:PORT and serves `/` and `/api/web3/status`
    const child = spawn(process.execPath, ['src/server/server.ts'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(freePort),
        GUEST_SESSION_SECRET: 'prod_test_secret_1234567890123456789012345678',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    try {
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      const deadline = Date.now() + 8000;
      while (Date.now() < deadline && !stdout.includes(`http://0.0.0.0:${freePort}`)) {
        if (child.exitCode !== null) {
          assert.fail(`node server.ts exited early (${child.exitCode}): ${stderr}`);
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      assert.match(stdout, new RegExp(`http://0\\.0\\.0\\.0:${freePort}`));

      const homeRes = await fetch(`http://127.0.0.1:${freePort}/`);
      assert.equal(homeRes.status, 200);
      const html = await homeRes.text();
      assert.match(html, /<!doctype html>/i);

      const statusRes = await fetch(`http://127.0.0.1:${freePort}/api/web3/status`);
      assert.equal(statusRes.status, 200);
      const statusJson = (await statusRes.json()) as { phase?: number; chainId?: number };
      assert.equal(statusJson.phase, 1);
      assert.equal(statusJson.chainId, 43113);
    } finally {
      child.kill('SIGTERM');
    }
  });

  it('verifies GET /api/pets/:petUid/mint-eligibility returns server-authoritative eligibility decision and requirements matrix', async () => {
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    let createdGuestUid: string | null = null;
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      // 1. Unknown pet returns HTTP 404
      const notFoundRes = await fetch(`${base}/api/pets/pet-nonexistent-12345/mint-eligibility`);
      assert.equal(notFoundRes.status, 404);

      // 2. Initialize guest session (Mochi starts at 65 Bond XP, incomplete care quest)
      const guestRes = await fetch(`${base}/api/guest/session`, { method: 'POST' });
      assert.equal(guestRes.status, 200);
      const guestJson = (await guestRes.json()) as {
        guestToken: string;
        state: { user: { uid: string }; pets: Array<{ petUid: string; name: string }> };
      };
      createdGuestUid = guestJson.state.user.uid;
      const mochi = guestJson.state.pets.find((p) => p.name === 'Mochi') || guestJson.state.pets[0];
      const headers = {
        'Content-Type': 'application/json',
        'X-Guest-Token': guestJson.guestToken,
      };

      // 3. Before care: Mochi fails bond level (< 100) and quest completion
      const preCareRes = await fetch(`${base}/api/pets/${mochi.petUid}/mint-eligibility`);
      assert.equal(preCareRes.status, 200);
      const preCare = (await preCareRes.json()) as {
        eligible: boolean;
        petId: string;
        reasons: string[];
        requirements: {
          validDiscovery: boolean;
          confidencePassed: boolean;
          imageScorePassed: boolean;
          duplicateCheckPassed: boolean;
          inSanctuary: boolean;
          bondLevelPassed: boolean;
          firstBondQuestCompleted: boolean;
          careEventsVerified: boolean;
          notMinted: boolean;
        };
      };
      assert.equal(preCare.eligible, false);
      assert.equal(preCare.petId, mochi.petUid);
      assert.ok(preCare.reasons.includes('BOND_LEVEL_TOO_LOW'));
      assert.ok(preCare.reasons.includes('FIRST_BOND_QUEST_INCOMPLETE'));
      assert.equal(preCare.requirements.imageScorePassed, true);
      assert.equal(preCare.requirements.bondLevelPassed, false);
      assert.equal(preCare.requirements.firstBondQuestCompleted, false);
      assert.equal(preCare.requirements.notMinted, true);

      // 4. Perform Pet, Feed, and Play care actions to complete progression (Bond XP: 65 + 15 + 25 + 20 = 125 >= 100)
      for (const step of [
        { actionType: 'pet' },
        { actionType: 'feed', food: 'carrot' },
        { actionType: 'play', toyId: 'toy-yarn' },
      ]) {
        const careRes = await fetch(`${base}/api/keeper/care`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            petUid: mochi.petUid,
            ...step,
            idempotencyKey: `elig-prep-${step.actionType}-${Date.now()}`,
          }),
        });
        assert.equal(careRes.status, 200);
      }

      // 5. Post care: Mochi is now fully eligible for Pet Passport minting
      const postCareRes = await fetch(`${base}/api/pets/${mochi.petUid}/mint-eligibility`);
      assert.equal(postCareRes.status, 200);
      const postCare = (await postCareRes.json()) as typeof preCare;
      assert.equal(postCare.eligible, true);
      assert.equal(postCare.reasons.length, 0);
      assert.equal(postCare.requirements.imageScorePassed, true);
      assert.equal(postCare.requirements.bondLevelPassed, true);
      assert.equal(postCare.requirements.firstBondQuestCompleted, true);
      assert.equal(postCare.requirements.notMinted, true);
      assert.equal(postCare.requirements.inSanctuary, true);
      assert.equal(postCare.requirements.careEventsVerified, true);
    } finally {
      if (createdGuestUid && process.env.DATABASE_URL) {
        const [u] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uid, createdGuestUid))
          .limit(1);
        if (u) {
          await db.delete(careLogs).where(eq(careLogs.userId, u.id));
          await db.delete(pets).where(eq(pets.currentOwnerId, u.id));
          await db.delete(users).where(eq(users.id, u.id));
        }
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});


