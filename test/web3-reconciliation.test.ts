import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { adminDb } from '../src/lib/firebase-admin.ts';
import {
  getPetForWeb3,
  getLinkedWallet,
  getWalletByAddress,
  updatePetOnChainOwnership,
  recordConfirmedMint,
} from '../src/db/web3Repository.ts';
import {
  reconcileMintedPetOwnership,
  confirmFujiMintTransaction,
  PAWS_PASSPORT_ABI,
} from '../src/server/web3Service.ts';

describe('Web3 Reconciliation & Mint Confirmation (P1 Firestore Hardening)', () => {
  const runId = crypto.randomBytes(4).toString('hex');
  const CONTRACT_ADDR = '0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31';

  // Sample EVM addresses (unique per run to avoid Firestore test collisions)
  const WALLET_USER_A = '0x1111' + runId.padEnd(36, '0');
  const WALLET_USER_B = '0x2222' + runId.padEnd(36, '0');
  const WALLET_USER_C = '0x3333' + runId.padEnd(36, '0');
  const WALLET_UNREGISTERED = '0x9999' + runId.padEnd(36, '0');

  const USER_A_ID = 8101;
  const USER_A_UID = `keeper-a-${runId}`;
  const USER_B_ID = 8102;
  const USER_B_UID = `keeper-b-${runId}`;

  let originalGetFunction: any;
  let originalGetTransactionReceipt: any;
  let mockOnChainOwner = WALLET_USER_A;
  let mockReceipt: any = null;

  beforeEach(async () => {
    // Intercept ethers BaseContract.prototype.getFunction to mock ownerOf on-chain query
    originalGetFunction = (ethers.BaseContract.prototype as any).getFunction;
    (ethers.BaseContract.prototype as any).getFunction = function (name: string) {
      if (name === 'ownerOf') {
        return async (_tokenId: bigint) => mockOnChainOwner;
      }
      return originalGetFunction.apply(this, arguments);
    };

    // Intercept JsonRpcProvider.prototype.getTransactionReceipt
    originalGetTransactionReceipt =
      ethers.JsonRpcProvider.prototype.getTransactionReceipt;
    ethers.JsonRpcProvider.prototype.getTransactionReceipt = async function (
      _txHash: string
    ) {
      return mockReceipt;
    };

    // Seed test users & wallets in Firestore
    await adminDb.collection('users').doc(USER_A_UID).set({
      id: USER_A_ID,
      uid: USER_A_UID,
      email: `user-a-${runId}@example.com`,
      wallet: {
        address: WALLET_USER_A.toLowerCase(),
        chainId: 43113,
        verifiedAt: new Date().toISOString(),
      },
    });

    await adminDb.collection('wallets').doc(USER_A_UID).set({
      uid: USER_A_UID,
      userId: USER_A_ID,
      address: WALLET_USER_A.toLowerCase(),
      chainId: 43113,
      verifiedAt: new Date().toISOString(),
    });

    await adminDb.collection('users').doc(USER_B_UID).set({
      id: USER_B_ID,
      uid: USER_B_UID,
      email: `user-b-${runId}@example.com`,
      wallet: {
        address: WALLET_USER_B.toLowerCase(),
        chainId: 43113,
        verifiedAt: new Date().toISOString(),
      },
    });

    await adminDb.collection('wallets').doc(USER_B_UID).set({
      uid: USER_B_UID,
      userId: USER_B_ID,
      address: WALLET_USER_B.toLowerCase(),
      chainId: 43113,
      verifiedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    (ethers.BaseContract.prototype as any).getFunction = originalGetFunction;
    ethers.JsonRpcProvider.prototype.getTransactionReceipt =
      originalGetTransactionReceipt;
  });

  it('1. Rejects reconciliation for unknown / non-existent pet', async () => {
    const unknownUid = `pet-unknown-${Date.now()}`;
    await assert.rejects(
      async () => {
        await reconcileMintedPetOwnership(unknownUid);
      },
      {
        message: 'Pet not found.',
      }
    );
  });

  it('2. Returns non-reconciled response for unminted pet or pet without tokenId', async () => {
    const unmintedUid = `pet-unminted-${runId}`;
    await adminDb.collection('pets').doc(unmintedUid).set({
      petUid: unmintedUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Unminted Pip',
      mintStatus: 'unminted',
      minted: false,
      discoveryScore: 85,
      bondXp: 120,
    });

    const result = await reconcileMintedPetOwnership(unmintedUid);
    assert.deepEqual(result, {
      reconciled: false,
      reason: 'Pet is not minted on-chain.',
    });
  });

  it('3. Reconciles successfully and idempotently when DB owner matches on-chain owner', async () => {
    const petUid = `pet-sync-${runId}`;
    const tokenId = '701';

    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Synced Mochi',
      mintStatus: 'minted',
      minted: true,
      tokenId,
      contractAddress: CONTRACT_ADDR,
      onChainOwner: WALLET_USER_A.toLowerCase(),
    });

    mockOnChainOwner = WALLET_USER_A.toLowerCase();

    // First call: in sync
    const res1 = await reconcileMintedPetOwnership(petUid);
    assert.strictEqual(res1.reconciled, true);
    assert.strictEqual(res1.inSync, true);
    assert.strictEqual(res1.conflict, false);
    assert.strictEqual(res1.onChainOwner, WALLET_USER_A.toLowerCase());

    // Second call: idempotent repeat verification
    const res2 = await reconcileMintedPetOwnership(petUid);
    assert.strictEqual(res2.reconciled, true);
    assert.strictEqual(res2.inSync, true);
    assert.strictEqual(res2.conflict, false);
    assert.strictEqual(res2.onChainOwner, WALLET_USER_A.toLowerCase());
  });

  it('4. Reconciles transfer to another registered keeper when on-chain owner changed', async () => {
    const petUid = `pet-transfer-${runId}`;
    const tokenId = '702';

    // Pet initially belongs to User A
    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Transferred Sunny',
      mintStatus: 'minted',
      minted: true,
      tokenId,
      contractAddress: CONTRACT_ADDR,
      onChainOwner: WALLET_USER_A.toLowerCase(),
    });

    // On-chain owner has moved to User B
    mockOnChainOwner = WALLET_USER_B.toLowerCase();

    const res = await reconcileMintedPetOwnership(petUid);
    assert.strictEqual(res.reconciled, true);
    assert.strictEqual(res.inSync, true);
    assert.strictEqual(res.conflict, false);
    assert.strictEqual(res.onChainOwner, WALLET_USER_B.toLowerCase());

    // Verify Firestore doc was updated to User B
    const updatedPet = await getPetForWeb3(petUid);
    assert.ok(updatedPet);
    assert.strictEqual(updatedPet.currentOwnerId, USER_B_ID);
    assert.strictEqual(updatedPet.currentOwnerUid, USER_B_UID);
    assert.strictEqual(updatedPet.onChainOwner, WALLET_USER_B.toLowerCase());
  });

  it('5. Flags conflict without reassigning pet when on-chain owner has no DB account', async () => {
    const petUid = `pet-conflict-${runId}`;
    const tokenId = '703';

    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Contested Pet',
      mintStatus: 'minted',
      minted: true,
      tokenId,
      contractAddress: CONTRACT_ADDR,
      onChainOwner: WALLET_USER_A.toLowerCase(),
    });

    // On-chain owner is an external unregistered address
    mockOnChainOwner = WALLET_UNREGISTERED.toLowerCase();

    const res = await reconcileMintedPetOwnership(petUid);
    assert.strictEqual(res.reconciled, false);
    assert.strictEqual(res.inSync, false);
    assert.strictEqual(res.conflict, true);
    assert.strictEqual(res.onChainOwner, WALLET_UNREGISTERED.toLowerCase());
    assert.strictEqual(res.dbWalletAddress, WALLET_USER_A.toLowerCase());

    // Verify Firestore ownership was NOT changed
    const unchangedPet = await getPetForWeb3(petUid);
    assert.ok(unchangedPet);
    assert.strictEqual(unchangedPet.currentOwnerId, USER_A_ID);
    assert.strictEqual(unchangedPet.currentOwnerUid, USER_A_UID);
  });

  it('6. Web3 repository resolves wallets via users collection fallback', async () => {
    const USER_C_UID = `keeper-c-${runId}`;

    // Store only in users collection (simulate legacy or partial registration)
    await adminDb.collection('users').doc(USER_C_UID).set({
      id: 8103,
      uid: USER_C_UID,
      email: `user-c-${runId}@example.com`,
      wallet: {
        address: WALLET_USER_C.toLowerCase(),
        chainId: 43113,
        verifiedAt: new Date().toISOString(),
      },
    });

    const foundWallet = await getWalletByAddress(WALLET_USER_C);
    assert.ok(foundWallet);
    assert.strictEqual(foundWallet.address, WALLET_USER_C.toLowerCase());
    assert.strictEqual(foundWallet.uid, USER_C_UID);
  });

  it('7. confirmFujiMintTransaction rejects invalid hash, missing receipt, or reverted tx', async () => {
    const petUid = `pet-mint-verify-${runId}`;
    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Mint Candidate',
      mintStatus: 'pending',
      minted: false,
      discoveryScore: 90,
      bondXp: 150,
      originalDiscovererWallet: WALLET_USER_A.toLowerCase(),
    });

    // Invalid hash format
    await assert.rejects(
      async () => {
        await confirmFujiMintTransaction({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          txHash: '0xinvalid',
        });
      },
      { message: 'Invalid transaction hash format.' }
    );

    // Unconfirmed / null receipt
    mockReceipt = null;
    const validDummyTx = '0x' + crypto.randomBytes(32).toString('hex');
    await assert.rejects(
      async () => {
        await confirmFujiMintTransaction({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          txHash: validDummyTx,
        });
      },
      /Transaction not yet confirmed on Avalanche Fuji/
    );

    // Reverted receipt (status === 0)
    mockReceipt = {
      status: 0,
      confirmations: async () => 1,
      to: CONTRACT_ADDR.toLowerCase(),
      logs: [],
    };
    await assert.rejects(
      async () => {
        await confirmFujiMintTransaction({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          txHash: validDummyTx,
        });
      },
      { message: 'Mint transaction reverted on Avalanche Fuji.' }
    );
  });

  it('8. confirmFujiMintTransaction rejects mismatched PetMinted logs or mismatched discoverer', async () => {
    const petUid = `pet-mint-logs-${runId}`;
    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Log Verification Pet',
      mintStatus: 'pending',
      minted: false,
      discoveryScore: 92,
      bondXp: 160,
      originalDiscovererWallet: WALLET_USER_A.toLowerCase(),
    });

    const validTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    const iface = new ethers.Interface(PAWS_PASSPORT_ABI);

    // Mismatched petIdHash
    const otherPetHash = ethers.id('some-other-pet-id');
    const mismatchedLog = iface.encodeEventLog(
      iface.getEvent('PetMinted')!,
      [888n, otherPetHash, WALLET_USER_A, 'ipfs://test-cid', 1n]
    );

    mockReceipt = {
      status: 1,
      confirmations: async () => 1,
      to: CONTRACT_ADDR.toLowerCase(),
      logs: [
        {
          address: CONTRACT_ADDR.toLowerCase(),
          data: mismatchedLog.data,
          topics: mismatchedLog.topics,
        },
      ],
    };

    await assert.rejects(
      async () => {
        await confirmFujiMintTransaction({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          txHash: validTxHash,
        });
      },
      /Verified receipt did not contain a matching PetMinted event for this pet/
    );

    // Matching petIdHash, but discoverer is NOT User A's wallet
    const expectedPetHash = ethers.id(petUid);
    const wrongDiscovererLog = iface.encodeEventLog(
      iface.getEvent('PetMinted')!,
      [888n, expectedPetHash, WALLET_USER_B, 'ipfs://test-cid', 1n]
    );

    mockReceipt = {
      status: 1,
      confirmations: async () => 1,
      to: CONTRACT_ADDR.toLowerCase(),
      logs: [
        {
          address: CONTRACT_ADDR.toLowerCase(),
          data: wrongDiscovererLog.data,
          topics: wrongDiscovererLog.topics,
        },
      ],
    };

    await assert.rejects(
      async () => {
        await confirmFujiMintTransaction({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          txHash: validTxHash,
        });
      },
      /Minted PetMinted discoverer does not match your verified wallet/
    );
  });

  it('9. confirmFujiMintTransaction succeeds with valid matching event and records confirmed mint', async () => {
    const petUid = `pet-mint-success-${runId}`;
    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Successful Mint Pet',
      mintStatus: 'pending',
      minted: false,
      discoveryScore: 95,
      bondXp: 200,
      originalDiscovererWallet: WALLET_USER_A.toLowerCase(),
    });

    const validTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    const iface = new ethers.Interface(PAWS_PASSPORT_ABI);
    const expectedPetHash = ethers.id(petUid);

    const validLog = iface.encodeEventLog(
      iface.getEvent('PetMinted')!,
      [901n, expectedPetHash, WALLET_USER_A.toLowerCase(), 'ipfs://test-cid', 1n]
    );

    mockReceipt = {
      status: 1,
      confirmations: async () => 1,
      to: CONTRACT_ADDR.toLowerCase(),
      logs: [
        {
          address: CONTRACT_ADDR.toLowerCase(),
          data: validLog.data,
          topics: validLog.topics,
        },
      ],
    };

    mockOnChainOwner = WALLET_USER_A.toLowerCase();

    const confirmed = await confirmFujiMintTransaction({
      userId: USER_A_ID,
      uid: USER_A_UID,
      petUid,
      txHash: validTxHash,
    });

    assert.strictEqual(confirmed.tokenId, '901');
    assert.strictEqual(confirmed.txHash, validTxHash.toLowerCase());
    assert.strictEqual(confirmed.onChainOwner, WALLET_USER_A.toLowerCase());

    // Verify Firestore status was updated
    const pet = await getPetForWeb3(petUid);
    assert.ok(pet);
    assert.strictEqual(pet.mintStatus, 'minted');
    assert.strictEqual(pet.tokenId, '901');
    assert.strictEqual(pet.mintTxHash, validTxHash);
    assert.strictEqual(pet.contractAddress?.toLowerCase(), CONTRACT_ADDR.toLowerCase());

    // Idempotency: re-confirming with the SAME txHash returns alreadyConfirmed: true
    const repeatSame = await confirmFujiMintTransaction({
      userId: USER_A_ID,
      uid: USER_A_UID,
      petUid,
      txHash: validTxHash,
    });
    assert.strictEqual(repeatSame.alreadyConfirmed, true);
    assert.strictEqual(repeatSame.tokenId, '901');

    // Attempting to confirm with a DIFFERENT txHash throws error
    const differentTx = '0x' + crypto.randomBytes(32).toString('hex');
    await assert.rejects(
      async () => {
        await confirmFujiMintTransaction({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          txHash: differentTx,
        });
      },
      /Pet is already minted on-chain/
    );
  });

  it('10. /api/web3/reconcile/:petUid endpoint verifies auth and returns reconciled result + keeper state', async () => {
    const { createApp } = await import('../src/server/app.ts');
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      const petUid = `pet-api-reconcile-${runId}`;
      const tokenId = '704';

      await adminDb.collection('pets').doc(petUid).set({
        petUid,
        currentOwnerId: USER_A_ID,
        currentOwnerUid: USER_A_UID,
        name: 'API Reconcile Mochi',
        mintStatus: 'minted',
        minted: true,
        tokenId,
        contractAddress: CONTRACT_ADDR,
        onChainOwner: WALLET_USER_A.toLowerCase(),
      });

      mockOnChainOwner = WALLET_USER_A.toLowerCase();

      // 1. Without auth: 401
      const resUnauth = await fetch(`${base}/api/web3/reconcile/${petUid}`, {
        method: 'POST',
      });
      assert.strictEqual(resUnauth.status, 401);

      // 2. With valid dev-keeper auth: 200 and returns result + state
      const tokenPayload = Buffer.from(
        JSON.stringify({
          uid: USER_A_UID,
          email: `user-a-${runId}@example.com`,
          name: 'User A',
        })
      ).toString('base64');

      const resAuth = await fetch(`${base}/api/web3/reconcile/${petUid}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer dev-keeper:${tokenPayload}`,
        },
      });

      assert.strictEqual(resAuth.status, 200);
      const data = (await resAuth.json()) as any;
      assert.strictEqual(data.result.reconciled, true);
      assert.strictEqual(data.result.inSync, true);
      assert.strictEqual(data.result.conflict, false);
      assert.strictEqual(data.result.onChainOwner, WALLET_USER_A.toLowerCase());
      assert.ok(data.state);

      // 3. Unknown pet: 400
      const resUnknown = await fetch(`${base}/api/web3/reconcile/non-existent-pet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer dev-keeper:${tokenPayload}`,
        },
      });
      assert.strictEqual(resUnknown.status, 400);
      const unknownData = (await resUnknown.json()) as any;
      assert.strictEqual(unknownData.error, 'Pet not found.');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
