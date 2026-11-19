import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ethers } from 'ethers';
import { createApp } from '../src/server/app.ts';
import { sanitizeOneWord } from '../src/server/rewards.ts';
import { performPetCareAction } from '../src/server/gameActions.ts';
import { getOrCreateUser, getFullKeeperState } from '../src/db/users.ts';
import {
  getPetForWeb3,
  getLinkedWallet,
  recordIssuedMintClaim,
} from '../src/db/web3Repository.ts';
import { issueSignedMintClaim } from '../src/server/web3Service.ts';
import { issueGuestSessionToken } from '../src/server/guestSession.ts';

describe('Regression Tests: DEF-01, DEF-02, DEF-05', () => {
  let app: ReturnType<typeof createApp>;
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  before(async () => {
    app = createApp();
    server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // --------------------------------------------------------------------------
  // DEF-01: Care Action Enum Validation
  // --------------------------------------------------------------------------
  describe('DEF-01: Care Action Enum Validation', () => {
    it('rejects invalid actionType "dance" with HTTP 400 and does NOT mutate state', async () => {
      const { token } = issueGuestSessionToken();
      // 1. Get initial state
      const stateRes1 = await fetch(`${baseUrl}/api/keeper/state`, {
        headers: { 'X-Guest-Token': token },
      });
      assert.equal(stateRes1.status, 200);
      const state1 = await stateRes1.json();
      const initialPet = state1.pets[0];
      const initialMemoriesCount = initialPet.memories.length;
      const initialCoins = state1.user.coins;
      const initialBondXp = initialPet.bondXp;
      const initialCareCount = initialPet.careCount;

      // 2. Send invalid care action "dance"
      const careRes = await fetch(`${baseUrl}/api/keeper/care`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify({
          petUid: initialPet.petUid,
          actionType: 'dance',
          idempotencyKey: `qa-def01-dance-${Date.now()}`,
        }),
      });

      assert.equal(careRes.status, 400);
      const errPayload = await careRes.json();
      assert.match(errPayload.error, /Invalid care actionType/);

      // 3. Confirm state is completely unmutated
      const stateRes2 = await fetch(`${baseUrl}/api/keeper/state`, {
        headers: { 'X-Guest-Token': token },
      });
      const state2 = await stateRes2.json();
      const afterPet = state2.pets[0];

      assert.equal(state2.user.coins, initialCoins);
      assert.equal(afterPet.bondXp, initialBondXp);
      assert.equal(afterPet.careCount, initialCareCount);
      assert.equal(afterPet.memories.length, initialMemoriesCount);
    });

    it('rejects empty string actionType with HTTP 400', async () => {
      const { token } = issueGuestSessionToken();
      const res = await fetch(`${baseUrl}/api/keeper/care`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify({
          petUid: 'pet-calico',
          actionType: '',
          idempotencyKey: `qa-def01-empty-${Date.now()}`,
        }),
      });
      assert.equal(res.status, 400);
    });

    it('rejects null actionType with HTTP 400', async () => {
      const { token } = issueGuestSessionToken();
      const res = await fetch(`${baseUrl}/api/keeper/care`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify({
          petUid: 'pet-calico',
          actionType: null,
          idempotencyKey: `qa-def01-null-${Date.now()}`,
        }),
      });
      assert.equal(res.status, 400);
    });

    it('rejects numeric actionType (123) with HTTP 400', async () => {
      const { token } = issueGuestSessionToken();
      const res = await fetch(`${baseUrl}/api/keeper/care`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify({
          petUid: 'pet-calico',
          actionType: 123,
          idempotencyKey: `qa-def01-num-${Date.now()}`,
        }),
      });
      assert.equal(res.status, 400);
    });

    it('rejects missing actionType with HTTP 400', async () => {
      const { token } = issueGuestSessionToken();
      const res = await fetch(`${baseUrl}/api/keeper/care`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify({
          petUid: 'pet-calico',
          idempotencyKey: `qa-def01-missing-${Date.now()}`,
        }),
      });
      assert.equal(res.status, 400);
    });

    it('accepts valid care action "pet" and increments Bond XP + adds memory', async () => {
      const { token } = issueGuestSessionToken();
      const stateRes = await fetch(`${baseUrl}/api/keeper/state`, {
        headers: { 'X-Guest-Token': token },
      });
      const state = await stateRes.json();
      const pet = state.pets[0];
      const initialBondXp = pet.bondXp;

      const careRes = await fetch(`${baseUrl}/api/keeper/care`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Token': token,
        },
        body: JSON.stringify({
          petUid: pet.petUid,
          actionType: 'pet',
          idempotencyKey: `qa-def01-valid-pet-${Date.now()}`,
        }),
      });

      assert.equal(careRes.status, 200);
      const careBody = await careRes.json();
      assert.equal(careBody.result.bondXpDelta, 15);
      assert.equal(careBody.result.pet.bondXp, initialBondXp + 15);
    });
  });

  // --------------------------------------------------------------------------
  // DEF-02: Tag & String Sanitization
  // --------------------------------------------------------------------------
  describe('DEF-02: Tag & String Sanitization', () => {
    it('strips script tags and extracts clean pet name instead of leaving script words', () => {
      const input = '<script>alert(1)</script> Sunny';
      const result = sanitizeOneWord(input, 'Clover');
      assert.equal(result, 'Sunny');
    });

    it('returns fallback when input is exclusively malicious script tags', () => {
      const input = '<script>alert(1)</script>';
      const result = sanitizeOneWord(input, 'Clover');
      assert.equal(result, 'Clover');
    });

    it('strips img tag with onerror event handler payload', () => {
      const input = '<img src=x onerror=alert(1)> Milo';
      const result = sanitizeOneWord(input, 'Clover');
      assert.equal(result, 'Milo');
    });

    it('strips svg tag with onload event handler payload', () => {
      const input = '<svg onload="alert(1)">Pip';
      const result = sanitizeOneWord(input, 'Clover');
      assert.equal(result, 'Pip');
    });

    it('strips quotes and special punctuation from valid names', () => {
      const input = '"Oliver"';
      const result = sanitizeOneWord(input, 'Clover');
      assert.equal(result, 'Oliver');
    });

    it('preserves valid Unicode pet names (e.g. Vietnamese, French, Japanese)', () => {
      assert.equal(sanitizeOneWord('Bông Tuyết', 'Pet'), 'Bông');
      assert.equal(sanitizeOneWord('Café', 'Pet'), 'Café');
      assert.equal(sanitizeOneWord('ハチ公', 'Pet'), 'ハチ公');
    });

    it('preserves hyphens and underscores in compound pet names', () => {
      assert.equal(sanitizeOneWord('Charlie-Brown', 'Pet'), 'Charlie-Brown');
      assert.equal(sanitizeOneWord('Max_Power', 'Pet'), 'Max_Power');
    });

    it('handles null, undefined, empty, and non-string inputs safely with fallback', () => {
      assert.equal(sanitizeOneWord('', 'Fallback'), 'Fallback');
      assert.equal(sanitizeOneWord(null as any, 'Fallback'), 'Fallback');
      assert.equal(sanitizeOneWord(undefined as any, 'Fallback'), 'Fallback');
      assert.equal(sanitizeOneWord(12345 as any, 'Fallback'), 'Fallback');
    });
  });

  // --------------------------------------------------------------------------
  // DEF-05: Web3 Persistence Consistency (Firestore Integration)
  // --------------------------------------------------------------------------
  describe('DEF-05: Web3 Persistence Consistency', () => {
    it('reads pet record from Cloud Firestore via getPetForWeb3', async () => {
      const { token } = issueGuestSessionToken();
      const stateRes = await fetch(`${baseUrl}/api/keeper/state`, {
        headers: { 'X-Guest-Token': token },
      });
      assert.equal(stateRes.status, 200);
      const state = await stateRes.json();
      const mochi = state.pets.find((p: any) => p.name === 'Mochi');
      assert.ok(mochi, 'Mochi must exist in guest state');

      // Query through the web3Repository abstraction
      const web3Pet = await getPetForWeb3(mochi.petUid);
      assert.ok(web3Pet, 'Pet must be resolvable via getPetForWeb3');
      assert.equal(web3Pet.petUid, mochi.petUid);
      assert.equal(web3Pet.name, 'Mochi');
      assert.equal(web3Pet.species, mochi.species);
      assert.equal(web3Pet.discoveryScore, mochi.score);
    });

    it('serves dynamic ERC-721 metadata for Firestore-backed pet via GET /api/metadata/:petUid', async () => {
      const { token } = issueGuestSessionToken();
      const stateRes = await fetch(`${baseUrl}/api/keeper/state`, {
        headers: { 'X-Guest-Token': token },
      });
      assert.equal(stateRes.status, 200);
      const state = await stateRes.json();
      const mochi = state.pets.find((p: any) => p.name === 'Mochi');

      const metaRes = await fetch(`${baseUrl}/api/metadata/${encodeURIComponent(mochi.petUid)}`);
      assert.equal(metaRes.status, 200);
      const metadata = await metaRes.json();

      assert.equal(metadata.name, 'Mochi · Paws & Picket Passport');
      assert.ok(Array.isArray(metadata.attributes));
      const speciesTrait = metadata.attributes.find((a: any) => a.trait_type === 'Species');
      assert.ok(speciesTrait);
      assert.equal(speciesTrait.value, 'cat');
    });

    it('allows a Firestore-backed eligible pet with verified wallet to issue a signed mint claim voucher', async () => {
      // Temporarily mock contract address if unconfigured to test the mint-claim signing path
      const originalContractAddress = process.env.PET_PASSPORT_CONTRACT_ADDRESS;
      const originalSignerKey = process.env.TRUSTED_SIGNER_PRIVATE_KEY;
      const testSignerWallet = ethers.Wallet.createRandom();
      const mockContractAddress = '0x1111111111111111111111111111111111111111';

      process.env.PET_PASSPORT_CONTRACT_ADDRESS = mockContractAddress;
      process.env.TRUSTED_SIGNER_PRIVATE_KEY = testSignerWallet.privateKey;

      try {
        const { token } = issueGuestSessionToken();
        const stateRes = await fetch(`${baseUrl}/api/keeper/state`, {
          headers: { 'X-Guest-Token': token },
        });
        assert.equal(stateRes.status, 200);
        const state = await stateRes.json();
        const mochi = state.pets.find((p: any) => p.name === 'Mochi');
        const userUid = state.user.uid;

        // Perform care to make Mochi eligible (Bond XP >= 100)
        // Mochi starts with ~65 or 80 Bond XP in starter state. Let's feed/play to push past 100
        await fetch(`${baseUrl}/api/keeper/care`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Guest-Token': token },
          body: JSON.stringify({
            petUid: mochi.petUid,
            actionType: 'play',
            toyId: 'toy-yarn',
            idempotencyKey: `qa-def05-play-${Date.now()}`,
          }),
        });
        await fetch(`${baseUrl}/api/keeper/care`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Guest-Token': token },
          body: JSON.stringify({
            petUid: mochi.petUid,
            actionType: 'feed',
            food: 'carrot',
            idempotencyKey: `qa-def05-feed-${Date.now()}`,
          }),
        });

        // Link a mock wallet in Firestore
        const testUserWallet = ethers.Wallet.createRandom();
        const { adminDb } = await import('../src/lib/firebase-admin.ts');
        await adminDb.collection('wallets').doc(userUid).set({
          uid: userUid,
          userId: Number(state.user.id || 1),
          address: testUserWallet.address.toLowerCase(),
          chainId: 43113,
          verifiedAt: new Date().toISOString(),
        });
        await adminDb.collection('users').doc(userUid).set(
          {
            wallet: {
              address: testUserWallet.address.toLowerCase(),
              chainId: 43113,
              verifiedAt: new Date().toISOString(),
            },
          },
          { merge: true }
        );

        // Call issueSignedMintClaim through web3Service
        const claimResult = await issueSignedMintClaim({
          userId: Number(state.user.id || 1),
          uid: userUid,
          petUid: mochi.petUid,
          publicBaseUrl: baseUrl,
        });

        assert.ok(claimResult, 'Claim voucher must be returned');
        assert.equal(claimResult.chainId, 43113);
        assert.equal(claimResult.contractAddress, mockContractAddress);
        assert.ok(claimResult.claim.signature.startsWith('0x'), 'Must produce hex ECDSA signature');
        assert.equal(claimResult.claim.petIdHash, ethers.id(mochi.petUid));
        assert.equal(claimResult.claim.recipient.toLowerCase(), testUserWallet.address.toLowerCase());

        // Verify that the EIP-712 signature recovers the trusted signer address
        const domain = {
          name: 'PawsAndPicketPassport',
          version: '1',
          chainId: 43113,
          verifyingContract: mockContractAddress,
        };
        const isPassportClaim = (claimResult.claim as any).petId !== undefined;
        let recovered: string;
        if (isPassportClaim) {
          const types = {
            PassportClaim: [
              { name: 'recipient', type: 'address' },
              { name: 'petId', type: 'uint256' },
              { name: 'petName', type: 'string' },
              { name: 'species', type: 'string' },
              { name: 'score', type: 'uint256' },
              { name: 'tokenURI', type: 'string' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
            ],
          };
          const value = {
            recipient: claimResult.claim.recipient,
            petId: BigInt((claimResult.claim as any).petId),
            petName: (claimResult.claim as any).petName,
            species: (claimResult.claim as any).species,
            score: BigInt((claimResult.claim as any).score),
            tokenURI: (claimResult.claim as any).tokenURI,
            nonce: BigInt(claimResult.claim.nonce),
            deadline: BigInt(claimResult.claim.deadline),
          };
          recovered = ethers.verifyTypedData(domain, types, value, claimResult.claim.signature);
        } else {
          const types = {
            MintClaim: [
              { name: 'recipient', type: 'address' },
              { name: 'petIdHash', type: 'bytes32' },
              { name: 'metadataUriHash', type: 'bytes32' },
              { name: 'nonce', type: 'uint256' },
              { name: 'deadline', type: 'uint256' },
            ],
          };
          const value = {
            recipient: claimResult.claim.recipient,
            petIdHash: claimResult.claim.petIdHash,
            metadataUriHash: ethers.keccak256(ethers.toUtf8Bytes(claimResult.claim.metadataUri)),
            nonce: BigInt(claimResult.claim.nonce),
            deadline: claimResult.claim.deadline,
          };
          recovered = ethers.verifyTypedData(domain, types, value, claimResult.claim.signature);
        }
        assert.equal(recovered.toLowerCase(), testSignerWallet.address.toLowerCase());
      } finally {
        process.env.PET_PASSPORT_CONTRACT_ADDRESS = originalContractAddress;
        process.env.TRUSTED_SIGNER_PRIVATE_KEY = originalSignerKey;
      }
    });
  });
});
