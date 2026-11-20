import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { adminDb } from '../src/lib/firebase-admin.ts';
import {
  getPetForWeb3,
  getLinkedWallet,
  recordConfirmedMint,
} from '../src/db/web3Repository.ts';
import {
  issueSignedMintClaim,
  confirmFujiMintTransaction,
  reconcileMintedPetOwnership,
  PAWS_PASSPORT_ABI,
  getWeb3Status,
} from '../src/server/web3Service.ts';
import {
  issueWalletNonce,
  verifyAndBindWallet,
} from '../src/server/walletAuth.ts';

describe('Web3 End-to-End Test Matrix (Phase H)', () => {
  const runId = crypto.randomBytes(4).toString('hex');
  const CONTRACT_ADDR =
    process.env.PET_PASSPORT_CONTRACT_ADDRESS ||
    '0x1a5913d8a00247ccad7bb0ed879b3be43ca112b0';

  const testWallet = ethers.Wallet.createRandom();
  const WALLET_ADDR = testWallet.address.toLowerCase();
  const USER_ID = 8201;
  const USER_UID = `keeper-e2e-${runId}`;

  it('Test 1 — Ineligible Pet: Rejects claim issuance when Score < 80 or Bond XP < 100', async () => {
    // 1a. Low score (< 80)
    const petLowScore = `pet-low-score-${runId}`;
    await adminDb.collection('pets').doc(petLowScore).set({
      petUid: petLowScore,
      currentOwnerId: USER_ID,
      currentOwnerUid: USER_UID,
      name: 'Rookie Pup',
      discoveryScore: 75,
      bondXp: 120,
      mintStatus: 'unminted',
    });

    // Seed wallet
    await adminDb.collection('wallets').doc(USER_UID).set({
      uid: USER_UID,
      userId: USER_ID,
      address: WALLET_ADDR,
      chainId: 43113,
      verifiedAt: new Date().toISOString(),
    });

    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_ID,
          uid: USER_UID,
          petUid: petLowScore,
          publicBaseUrl: 'https://test.local',
        });
      },
      /Pet needs an AI score of 80\+ to mint/
    );

    // 1b. Low Bond XP (< 100)
    const petLowXp = `pet-low-xp-${runId}`;
    await adminDb.collection('pets').doc(petLowXp).set({
      petUid: petLowXp,
      currentOwnerId: USER_ID,
      currentOwnerUid: USER_UID,
      name: 'Unbonded Cat',
      discoveryScore: 88,
      bondXp: 60,
      mintStatus: 'unminted',
    });

    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_ID,
          uid: USER_UID,
          petUid: petLowXp,
          publicBaseUrl: 'https://test.local',
        });
      },
      /Build 100 Bond XP through care, feeding, and play first/
    );
  });

  it('Test 2 — Eligible Pet: Issues valid EIP-712 claim voucher to authenticated wallet', async () => {
    const petEligible = `pet-eligible-${runId}`;
    await adminDb.collection('pets').doc(petEligible).set({
      petUid: petEligible,
      currentOwnerId: USER_ID,
      currentOwnerUid: USER_UID,
      name: 'Ready Mochi',
      species: 'Cat',
      pose: 'Sleeping',
      discoveryScore: 92,
      bondXp: 150,
      mintStatus: 'unminted',
    });

    const result = await issueSignedMintClaim({
      userId: USER_ID,
      uid: USER_UID,
      petUid: petEligible,
      publicBaseUrl: 'https://pawsandpicket.local',
    });

    assert.strictEqual(result.chainId, 43113);
    assert.strictEqual(result.contractAddress?.toLowerCase(), CONTRACT_ADDR.toLowerCase());
    assert.strictEqual(result.claim.recipient.toLowerCase(), WALLET_ADDR);
    assert.strictEqual(result.claim.petIdHash, ethers.id(petEligible));
    assert.ok(result.claim.metadataUri.includes(petEligible));
    assert.ok(result.claim.nonce);
    assert.ok(result.claim.deadline > Math.floor(Date.now() / 1000));
    assert.ok(/^0x[a-fA-F0-9]{130,}$/.test(result.claim.signature));
  });

  it('Test 3 — Wallet Authentication: Challenge issuance, EIP-191 signing, and Firestore binding', async () => {
    const freshWallet = ethers.Wallet.createRandom();
    const freshUid = `keeper-auth-${runId}`;
    const freshId = 8202;

    const challenge = await issueWalletNonce({
      userId: freshId,
      uid: freshUid,
      rawAddress: freshWallet.address,
    });

    assert.ok(challenge.nonce);
    assert.ok(challenge.message.includes(freshWallet.address));

    const sig = await freshWallet.signMessage(challenge.message);

    const bound = await verifyAndBindWallet({
      userId: freshId,
      uid: freshUid,
      rawAddress: freshWallet.address,
      nonce: challenge.nonce,
      signature: sig,
    });

    assert.strictEqual(bound.address, freshWallet.address.toLowerCase());
    assert.strictEqual(bound.chainId, 43113);

    const retrieved = await getLinkedWallet({ userId: freshId, uid: freshUid });
    assert.ok(retrieved);
    assert.strictEqual(retrieved.address, freshWallet.address.toLowerCase());

    // Sub-test: Anonymous Guest -> Authenticated Keeper wallet reclamation & Cross-Keeper protection
    const sharedWallet = ethers.Wallet.createRandom();
    const guestUid = `guest:session-${runId}`;
    const guestChallenge = await issueWalletNonce({
      userId: 9001,
      uid: guestUid,
      rawAddress: sharedWallet.address,
    });
    const guestSig = await sharedWallet.signMessage(guestChallenge.message);
    await verifyAndBindWallet({
      userId: 9001,
      uid: guestUid,
      rawAddress: sharedWallet.address,
      nonce: guestChallenge.nonce,
      signature: guestSig,
    });

    // Authenticated keeper signs with same wallet -> successfully reclaims from guest!
    const keeperUid = `keeper-claimed-${runId}`;
    const keeperChallenge = await issueWalletNonce({
      userId: 9002,
      uid: keeperUid,
      rawAddress: sharedWallet.address,
    });
    const keeperSig = await sharedWallet.signMessage(keeperChallenge.message);
    const reclaimed = await verifyAndBindWallet({
      userId: 9002,
      uid: keeperUid,
      rawAddress: sharedWallet.address,
      nonce: keeperChallenge.nonce,
      signature: keeperSig,
    });
    assert.strictEqual(reclaimed.address, sharedWallet.address.toLowerCase());

    // Another distinct authenticated keeper tries to bind the same wallet -> blocked!
    const intruderUid = `keeper-intruder-${runId}`;
    const intruderChallenge = await issueWalletNonce({
      userId: 9003,
      uid: intruderUid,
      rawAddress: sharedWallet.address,
    });
    const intruderSig = await sharedWallet.signMessage(intruderChallenge.message);
    await assert.rejects(
      async () => {
        await verifyAndBindWallet({
          userId: 9003,
          uid: intruderUid,
          rawAddress: sharedWallet.address,
          nonce: intruderChallenge.nonce,
          signature: intruderSig,
        });
      },
      /This wallet address is already linked to another Keeper account/
    );
  });

  it('Test 4 — Claim Security & Cryptographic Integrity', async () => {
    const rawSignerKey = process.env.TRUSTED_SIGNER_PRIVATE_KEY?.trim();
    assert.ok(rawSignerKey, 'TRUSTED_SIGNER_PRIVATE_KEY must be configured');
    const trustedSigner = new ethers.Wallet(rawSignerKey);

    const domain = {
      name: 'PawsAndPicketPassport',
      version: '1',
      chainId: 43113,
      verifyingContract: CONTRACT_ADDR,
    };

    const types = {
      MintClaim: [
        { name: 'recipient', type: 'address' },
        { name: 'petIdHash', type: 'bytes32' },
        { name: 'metadataUriHash', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const petId = `pet-crypto-test-${runId}`;
    const metadataUri = `https://pawsandpicket.local/api/metadata/${petId}`;

    const value = {
      recipient: ethers.getAddress(WALLET_ADDR),
      petIdHash: ethers.id(petId),
      metadataUriHash: ethers.keccak256(ethers.toUtf8Bytes(metadataUri)),
      nonce: 9999n,
      deadline: Math.floor(Date.now() / 1000) + 3600,
    };

    // 1. Valid signature verifies against trusted signer address
    const validSig = await trustedSigner.signTypedData(domain, types, value);
    const recovered = ethers.verifyTypedData(domain, types, value, validSig);
    assert.strictEqual(recovered.toLowerCase(), trustedSigner.address.toLowerCase());

    // 2. Tampered recipient recovers different address
    const tamperedValue = { ...value, recipient: ethers.Wallet.createRandom().address };
    const tamperedRecovered = ethers.verifyTypedData(domain, types, tamperedValue, validSig);
    assert.notStrictEqual(tamperedRecovered.toLowerCase(), trustedSigner.address.toLowerCase());
  });

  it('Test 5 & 6 — Fuji Confirmation & Persistent State in Firestore', async () => {
    const petUid = `pet-persist-${runId}`;
    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_ID,
      currentOwnerUid: USER_UID,
      name: 'Persistent Sunny',
      species: 'Golden Retriever',
      pose: 'Sitting',
      discoveryScore: 90,
      bondXp: 180,
      mintStatus: 'pending',
      minted: false,
    });

    const dummyTx = '0x' + crypto.randomBytes(32).toString('hex');
    const iface = new ethers.Interface(PAWS_PASSPORT_ABI);
    const petHash = ethers.id(petUid);

    const log = iface.encodeEventLog(
      iface.getEvent('PetMinted')!,
      [777n, petHash, WALLET_ADDR, 'https://test/meta', 1n]
    );

    // Mock RPC calls
    const origGetReceipt = ethers.JsonRpcProvider.prototype.getTransactionReceipt;
    const origGetFunction = (ethers.BaseContract.prototype as any).getFunction;

    ethers.JsonRpcProvider.prototype.getTransactionReceipt = async function () {
      return {
        status: 1,
        confirmations: async () => 1,
        to: CONTRACT_ADDR.toLowerCase(),
        logs: [
          {
            address: CONTRACT_ADDR.toLowerCase(),
            data: log.data,
            topics: log.topics,
          },
        ],
      } as any;
    };

    (ethers.BaseContract.prototype as any).getFunction = function (name: string) {
      if (name === 'ownerOf') {
        return async () => WALLET_ADDR;
      }
      return origGetFunction.apply(this, arguments);
    };

    try {
      const confirmation = await confirmFujiMintTransaction({
        userId: USER_ID,
        uid: USER_UID,
        petUid,
        txHash: dummyTx,
      });

      assert.strictEqual(confirmation.tokenId, '777');
      assert.strictEqual(confirmation.txHash, dummyTx.toLowerCase());

      // Verify state in Firestore
      const persisted = await getPetForWeb3(petUid);
      assert.ok(persisted);
      assert.strictEqual(persisted.mintStatus, 'minted');
      assert.strictEqual(persisted.tokenId, '777');
      assert.strictEqual(persisted.mintTxHash, dummyTx);
      assert.strictEqual(persisted.onChainOwner, WALLET_ADDR);
    } finally {
      ethers.JsonRpcProvider.prototype.getTransactionReceipt = origGetReceipt;
      (ethers.BaseContract.prototype as any).getFunction = origGetFunction;
    }
  });

  it('Test 7 — Recovery & Idempotency: Duplicate calls and partial write recovery', async () => {
    const petUid = `pet-recovery-${runId}`;
    const dummyTx = '0x' + crypto.randomBytes(32).toString('hex');

    // Pet already confirmed as minted in Firestore
    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_ID,
      currentOwnerUid: USER_UID,
      name: 'Recovery Pip',
      mintStatus: 'minted',
      minted: true,
      tokenId: '888',
      mintTxHash: dummyTx.toLowerCase(),
      contractAddress: CONTRACT_ADDR,
      onChainOwner: WALLET_ADDR,
    });

    // Repeat confirmation with the same txHash returns alreadyConfirmed without throwing
    const repeatResult = await confirmFujiMintTransaction({
      userId: USER_ID,
      uid: USER_UID,
      petUid,
      txHash: dummyTx,
    });

    assert.strictEqual(repeatResult.alreadyConfirmed, true);
    assert.strictEqual(repeatResult.tokenId, '888');

    // Reconcile when in sync
    const origGetFunction = (ethers.BaseContract.prototype as any).getFunction;
    (ethers.BaseContract.prototype as any).getFunction = function (name: string) {
      if (name === 'ownerOf') {
        return async () => WALLET_ADDR;
      }
      return origGetFunction.apply(this, arguments);
    };

    try {
      const reconcileResult = await reconcileMintedPetOwnership(petUid);
      assert.strictEqual(reconcileResult.reconciled, true);
      assert.strictEqual(reconcileResult.inSync, true);
      assert.strictEqual(reconcileResult.conflict, false);
    } finally {
      (ethers.BaseContract.prototype as any).getFunction = origGetFunction;
    }
  });
});
