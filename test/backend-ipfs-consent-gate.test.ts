import test, { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { adminDb } from '../src/lib/firebase-admin.ts';
import {
  getPetForWeb3,
  getLinkedWallet,
  recordConfirmedMint,
  recordIpfsConsent,
  revokeIpfsConsent,
  hasValidIpfsConsent,
  getIpfsConsentForPet,
} from '../src/db/web3Repository.ts';
import {
  issueSignedMintClaim,
  reconcileMintedPetOwnership,
  PAWS_PASSPORT_ABI,
  petImageCidMap,
  _resetPetImageCidMap,
  _resetInFlightClaimLocks,
} from '../src/server/web3Service.ts';
import { createApp } from '../src/server/app.ts';

describe('Member 03 Backend IPFS Consent Gate & Idempotency Suite', () => {
  const runId = crypto.randomBytes(4).toString('hex');
  const CONTRACT_ADDR = '0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31';
  const SIGNER_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
  const SIGNER_ADDR = new ethers.Wallet(SIGNER_KEY).address;

  const testWalletA = ethers.Wallet.createRandom();
  const WALLET_A = testWalletA.address;
  const testWalletB = ethers.Wallet.createRandom();
  const WALLET_B = testWalletB.address;

  const USER_A_ID = 9101;
  const USER_A_UID = `keeper-a-${runId}`;
  const USER_B_ID = 9102;
  const USER_B_UID = `keeper-b-${runId}`;

  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.METADATA_STORAGE_PROVIDER = 'pinata';
    process.env.METADATA_STORAGE_API_KEY = 'test-secret-pinata-api-key';
    process.env.PET_PASSPORT_CONTRACT_ADDRESS = CONTRACT_ADDR;
    process.env.TRUSTED_SIGNER_PRIVATE_KEY = SIGNER_KEY;
    process.env.AVALANCHE_CHAIN_ID = '43113';
    _resetPetImageCidMap();
    _resetInFlightClaimLocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetPetImageCidMap();
    _resetInFlightClaimLocks();
  });

  // Helper to create an eligible test pet
  async function seedEligiblePet(petUid: string, ownerId = USER_A_ID, ownerUid = USER_A_UID) {
    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: ownerId,
      currentOwnerUid: ownerUid,
      name: 'Pip',
      species: 'bunny',
      pose: 'Curious',
      photoUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      discoveryScore: 88,
      bondXp: 660,
      careCount: 15,
      mintStatus: 'unminted',
      discoveredAt: new Date().toISOString(),
    });
  }

  // Helper to seed verified linked wallet
  async function seedLinkedWallet(userId: number, uid: string, address: string) {
    await adminDb.collection('wallets').doc(uid).set({
      userId,
      uid,
      address,
      chainId: 43113,
      verifiedAt: new Date().toISOString(),
    });
  }

  it('1. Missing consent: rejects claim request with HTTP 400 CONSENT_REQUIRED and 0 Pinata calls', async () => {
    const petUid = `pet-missing-consent-${runId}`;
    await seedEligiblePet(petUid);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          publicConsent: null, // No consent
          fetchFn: mockFetch,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'CONSENT_REQUIRED');
        assert.ok(err.message.includes('consent is required'));
        assert.ok(Array.isArray(err.supportedVersions));
        return true;
      }
    );

    assert.equal(pinataCalls, 0, 'Must perform exactly 0 Pinata calls when consent is missing');
  });

  it('2. accepted=false: rejects claim request with HTTP 400 CONSENT_REQUIRED and 0 Pinata calls', async () => {
    const petUid = `pet-accepted-false-${runId}`;
    await seedEligiblePet(petUid);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          publicConsent: { accepted: false, consentVersion: '1.0' },
          fetchFn: mockFetch,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'CONSENT_REQUIRED');
        return true;
      }
    );

    assert.equal(pinataCalls, 0, 'Must perform exactly 0 Pinata calls when accepted is false');
  });

  it('3. Unsupported consent version: rejects with HTTP 400 UNSUPPORTED_CONSENT_VERSION and 0 Pinata calls', async () => {
    const petUid = `pet-unsupported-version-${runId}`;
    await seedEligiblePet(petUid);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          publicConsent: { accepted: true, consentVersion: '99.0' },
          fetchFn: mockFetch,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'UNSUPPORTED_CONSENT_VERSION');
        return true;
      }
    );

    assert.equal(pinataCalls, 0, 'Must perform exactly 0 Pinata calls for unsupported version');
  });

  it('4. Forged client userId: ignored in favor of authenticated session userId', async () => {
    const petUid = `pet-forge-user-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async (input) => {
      pinataCalls++;
      const url = String(input);
      if (url.endsWith('/pinFileToIPFS')) {
        return new Response(JSON.stringify({ IpfsHash: 'QmImageHash111' }));
      }
      return new Response(
        JSON.stringify({ IpfsHash: 'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644' })
      );
    };

    // Authenticated session is USER_A_ID, client sends forged extra parameter
    const result = await issueSignedMintClaim({
      userId: USER_A_ID,
      uid: USER_A_UID,
      petUid,
      publicConsent: {
        accepted: true,
        consentVersion: '1.0',
        userId: 999999, // Forged client userId
      } as any,
      fetchFn: mockFetch,
    });

    assert.ok(result.claim);
    assert.equal(result.claim.recipient.toLowerCase(), WALLET_A.toLowerCase());

    // Verify consent record was bound to USER_A_ID, never forged 999999
    const consent = await getIpfsConsentForPet(petUid, '1.0');
    assert.ok(consent);
    assert.equal(consent.userId, USER_A_ID);
    assert.notEqual(consent.userId, 999999);
  });

  it('5. Forged client wallet address: ignored in favor of database linked wallet', async () => {
    const petUid = `pet-forge-wallet-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    const forgedWallet = '0x000000000000000000000000000000000000dEaD';

    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/pinFileToIPFS')) {
        return new Response(JSON.stringify({ IpfsHash: 'QmImageHash222' }));
      }
      return new Response(
        JSON.stringify({ IpfsHash: 'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644' })
      );
    };

    const result = await issueSignedMintClaim({
      userId: USER_A_ID,
      uid: USER_A_UID,
      petUid,
      publicConsent: {
        accepted: true,
        consentVersion: '1.0',
        walletAddress: forgedWallet, // Forged client wallet
      } as any,
      fetchFn: mockFetch,
    });

    assert.equal(result.claim.recipient.toLowerCase(), WALLET_A.toLowerCase());
    assert.notEqual(result.claim.recipient.toLowerCase(), forgedWallet.toLowerCase());

    const consent = await getIpfsConsentForPet(petUid, '1.0');
    assert.ok(consent);
    assert.equal(consent.walletAddress.toLowerCase(), WALLET_A.toLowerCase());
  });

  it('6. Cross-user consent reuse: User B cannot claim Pet A owned by User A, 0 Pinata calls', async () => {
    const petUid = `pet-cross-user-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID); // Owned by User A
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);
    await seedLinkedWallet(USER_B_ID, USER_B_UID, WALLET_B);

    // User A previously consented
    await recordIpfsConsent({
      petUid,
      userId: USER_A_ID,
      userUid: USER_A_UID,
      walletAddress: WALLET_A,
      consentVersion: '1.0',
    });

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    // User B attempts to claim Pet A
    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_B_ID,
          uid: USER_B_UID,
          petUid,
          publicConsent: { accepted: true, consentVersion: '1.0' },
          fetchFn: mockFetch,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('Only the current pet owner'));
        return true;
      }
    );

    assert.equal(pinataCalls, 0, 'Must perform 0 Pinata calls for unauthorized caller');
  });

  it('7. Cross-pet consent reuse: consent for Pet A cannot authorize Pet B, 0 Pinata calls for Pet B', async () => {
    const petA = `pet-a-consent-${runId}`;
    const petB = `pet-b-no-consent-${runId}`;
    await seedEligiblePet(petA, USER_A_ID, USER_A_UID);
    await seedEligiblePet(petB, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    // Explicit consent granted ONLY for Pet A
    await recordIpfsConsent({
      petUid: petA,
      userId: USER_A_ID,
      userUid: USER_A_UID,
      walletAddress: WALLET_A,
      consentVersion: '1.0',
    });

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    // Claim for Pet B without consent envelope
    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid: petB,
          publicConsent: null,
          fetchFn: mockFetch,
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, 'CONSENT_REQUIRED');
        return true;
      }
    );

    assert.equal(pinataCalls, 0, 'Zero Pinata calls for pet without consent');
  });

  it('8. Revoked consent: revoked consent blocks claim authorization, 0 Pinata calls', async () => {
    const petUid = `pet-revoked-consent-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    // Grant consent
    await recordIpfsConsent({
      petUid,
      userId: USER_A_ID,
      userUid: USER_A_UID,
      walletAddress: WALLET_A,
      consentVersion: '1.0',
    });

    // Revoke consent
    await revokeIpfsConsent({
      petUid,
      userId: USER_A_ID,
      reason: 'Keeper opted out',
    });

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    // Attempting claim without re-accepting (e.g. accepted: false)
    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          publicConsent: { accepted: false, consentVersion: '1.0' },
          fetchFn: mockFetch,
        });
      },
      (err: any) => {
        assert.equal(err.code, 'CONSENT_REQUIRED');
        return true;
      }
    );

    assert.equal(pinataCalls, 0, 'Revoked consent must produce 0 Pinata calls');
  });

  it('9. Wallet relinking: consent bound to Wallet 1 cannot authorize Wallet 2 without re-consent', async () => {
    const petUid = `pet-relink-wallet-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    // Consented with WALLET_A
    await recordIpfsConsent({
      petUid,
      userId: USER_A_ID,
      userUid: USER_A_UID,
      walletAddress: WALLET_A,
      consentVersion: '1.0',
    });

    // User A changes linked wallet in profile to WALLET_B
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_B);

    // Old consent check fails with WALLET_B
    const isValidWithNewWallet = await hasValidIpfsConsent({
      petUid,
      userId: USER_A_ID,
      userUid: USER_A_UID,
      walletAddress: WALLET_B,
      consentVersion: '1.0',
    });
    assert.equal(isValidWithNewWallet, false, 'Old consent must not validate for changed wallet');

    // Fresh explicit consent with new wallet succeeds
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/pinFileToIPFS')) {
        return new Response(JSON.stringify({ IpfsHash: 'QmImageRelink' }));
      }
      return new Response(
        JSON.stringify({ IpfsHash: 'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644' })
      );
    };

    const result = await issueSignedMintClaim({
      userId: USER_A_ID,
      uid: USER_A_UID,
      petUid,
      publicConsent: { accepted: true, consentVersion: '1.0' },
      fetchFn: mockFetch,
    });

    assert.equal(result.claim.recipient.toLowerCase(), WALLET_B.toLowerCase());
  });

  it('10. Concurrent claim requests: deduplicated by in-flight lock (exactly 1 Pinata upload set)', async () => {
    const petUid = `pet-concurrent-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let imageUploadCount = 0;
    let metadataUploadCount = 0;

    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      // Artificial delay to allow concurrency collision
      await new Promise((r) => setTimeout(r, 60));

      if (url.endsWith('/pinFileToIPFS')) {
        imageUploadCount++;
        return new Response(JSON.stringify({ IpfsHash: 'QmConcurrentImage' }));
      }
      if (url.endsWith('/pinJSONToIPFS')) {
        metadataUploadCount++;
        return new Response(
          JSON.stringify({
            IpfsHash: 'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644',
          })
        );
      }
      throw new Error(`Unexpected url: ${url}`);
    };

    // Run 3 concurrent requests simultaneously
    const [res1, res2, res3] = await Promise.all([
      issueSignedMintClaim({
        userId: USER_A_ID,
        uid: USER_A_UID,
        petUid,
        publicConsent: { accepted: true, consentVersion: '1.0' },
        fetchFn: mockFetch,
      }),
      issueSignedMintClaim({
        userId: USER_A_ID,
        uid: USER_A_UID,
        petUid,
        publicConsent: { accepted: true, consentVersion: '1.0' },
        fetchFn: mockFetch,
      }),
      issueSignedMintClaim({
        userId: USER_A_ID,
        uid: USER_A_UID,
        petUid,
        publicConsent: { accepted: true, consentVersion: '1.0' },
        fetchFn: mockFetch,
      }),
    ]);

    // All callers get matching non-conflicting claim vouchers
    assert.equal(res1.claim.metadataUri, res2.claim.metadataUri);
    assert.equal(res2.claim.metadataUri, res3.claim.metadataUri);

    // Exactly 1 upload of each type occurred despite 3 simultaneous requests
    assert.equal(imageUploadCount, 1, 'Only 1 image upload must occur across concurrent requests');
    assert.equal(metadataUploadCount, 1, 'Only 1 metadata upload must occur across concurrent requests');
  });

  it('11. Pinata image success / metadata failure: reuses cached image CID on retry without re-uploading', async () => {
    const petUid = `pet-partial-failure-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let imageUploadCalls = 0;
    let metadataUploadCalls = 0;
    let failMetadata = true;

    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/pinFileToIPFS')) {
        imageUploadCalls++;
        return new Response(JSON.stringify({ IpfsHash: 'QmCachedImageCid999' }));
      }
      if (url.endsWith('/pinJSONToIPFS')) {
        metadataUploadCalls++;
        if (failMetadata) {
          return new Response(
            JSON.stringify({ error: 'Pinata gateway timeout' }),
            { status: 504 }
          );
        }
        return new Response(
          JSON.stringify({
            IpfsHash: 'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644',
          })
        );
      }
      throw new Error(`Unexpected url: ${url}`);
    };

    // Attempt 1: Image succeeds, metadata fails with 504
    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          publicConsent: { accepted: true, consentVersion: '1.0' },
          fetchFn: mockFetch,
          maxRetries: 0,
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('metadata upload'));
        return true;
      }
    );

    assert.equal(imageUploadCalls, 1, 'Image upload was called in Attempt 1');
    assert.equal(metadataUploadCalls, 1, 'Metadata upload was called and failed');

    // Attempt 2: User retries with working metadata
    failMetadata = false;
    const retryResult = await issueSignedMintClaim({
      userId: USER_A_ID,
      uid: USER_A_UID,
      petUid,
      publicConsent: { accepted: true, consentVersion: '1.0' },
      fetchFn: mockFetch,
    });

    assert.ok(retryResult.claim);
    assert.equal(
      imageUploadCalls,
      1,
      'Image must NOT be uploaded again on retry; must reuse cached CID'
    );
    assert.equal(metadataUploadCalls, 2, 'Metadata upload was retried and succeeded');
  });

  it('12. Existing minted Token #1 reconciliation: reconciles cleanly and blocks duplicate mint claim', async () => {
    const petUid = `pet-minted-token1-${runId}`;
    const tokenId = '1';

    await adminDb.collection('pets').doc(petUid).set({
      petUid,
      currentOwnerId: USER_A_ID,
      currentOwnerUid: USER_A_UID,
      name: 'Pip',
      species: 'bunny',
      discoveryScore: 88,
      bondXp: 660,
      mintStatus: 'minted',
      minted: true,
      tokenId,
      contractAddress: CONTRACT_ADDR,
      onChainOwner: WALLET_A.toLowerCase(),
      metadataUri: 'https://chi-low-fantastic-aaron.trycloudflare.com/api/metadata/pip',
    });
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    // 12a. Attempting mint-claim on already minted pet throws ALREADY_MINTED with 0 Pinata calls
    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    await assert.rejects(
      async () => {
        await issueSignedMintClaim({
          userId: USER_A_ID,
          uid: USER_A_UID,
          petUid,
          publicConsent: { accepted: true, consentVersion: '1.0' },
          fetchFn: mockFetch,
        });
      },
      (err: any) => {
        assert.equal(err.code, 'ALREADY_MINTED');
        assert.ok(err.message.includes('already been minted'));
        return true;
      }
    );
    assert.equal(pinataCalls, 0, 'Must perform 0 Pinata calls for already minted pet');

    // 12b. Reconciliation of Token #1 continues without requiring new consent or minting
    const origGetFn = (ethers.BaseContract.prototype as any).getFunction;
    (ethers.BaseContract.prototype as any).getFunction = function (name: string) {
      if (name === 'ownerOf') {
        return async () => WALLET_A.toLowerCase();
      }
      return origGetFn.apply(this, arguments);
    };
    try {
      const reconcileResult = await reconcileMintedPetOwnership(petUid);
      assert.ok(reconcileResult);
      assert.equal(reconcileResult.reconciled, true);
      assert.equal(reconcileResult.inSync, true);
    } finally {
      (ethers.BaseContract.prototype as any).getFunction = origGetFn;
    }
  });

  it('13. Direct HTTP API bypass attempt: calling POST /api/web3/mint-claim without consent fails with 400 CONSENT_REQUIRED', async () => {
    const app = createApp();
    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const base = `http://127.0.0.1:${port}`;

      const petUid = `pet-api-direct-bypass-${runId}`;
      await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
      await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

      const tokenPayload = Buffer.from(
        JSON.stringify({
          uid: USER_A_UID,
          email: `user-a-${runId}@example.com`,
          name: 'User A',
        })
      ).toString('base64');

      // Direct curl/fetch bypassing frontend modal: no publicConsent provided
      const res = await fetch(`${base}/api/web3/mint-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer dev-keeper:${tokenPayload}`,
        },
        body: JSON.stringify({ petUid }),
      });

      assert.equal(res.status, 400);
      const data = (await res.json()) as { error: string; code: string };
      assert.equal(data.code, 'CONSENT_REQUIRED');
      assert.ok(data.error.includes('Explicit user consent is required'));
    } finally {
      server.close();
    }
  });

  it('14. Database persistence failure: aborts mint claim before IPFS upload with HTTP 500 CONSENT_PERSISTENCE_FAILED and 0 Pinata calls', async () => {
    const petUid = `pet-db-fail-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let pinataCalls = 0;
    const mockFetch: typeof fetch = async () => {
      pinataCalls++;
      return new Response(JSON.stringify({ IpfsHash: 'QmTest' }));
    };

    // Simulate database failure during runTransaction
    const origRunTx = adminDb.runTransaction.bind(adminDb);
    adminDb.runTransaction = async () => {
      throw new Error('Simulated database deadlock/connection failure');
    };

    try {
      await assert.rejects(
        async () => {
          await issueSignedMintClaim({
            userId: USER_A_ID,
            uid: USER_A_UID,
            petUid,
            publicConsent: { accepted: true, consentVersion: '1.0' },
            fetchFn: mockFetch,
          });
        },
        (err: any) => {
          assert.equal(err.statusCode, 500);
          assert.equal(err.code, 'CONSENT_PERSISTENCE_FAILED');
          assert.ok(err.message.includes('Failed to persist consent audit record'));
          return true;
        }
      );

      assert.equal(pinataCalls, 0, 'Zero Pinata calls must be made when persistence fails');
    } finally {
      adminDb.runTransaction = origRunTx;
    }
  });

  it('15. Pinata timeout and retry: recovers from transient network timeout and successfully issues voucher', async () => {
    const petUid = `pet-timeout-retry-${runId}`;
    await seedEligiblePet(petUid, USER_A_ID, USER_A_UID);
    await seedLinkedWallet(USER_A_ID, USER_A_UID, WALLET_A);

    let attempts = 0;
    const mockFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      attempts++;

      // First attempt for image upload times out via AbortSignal
      if (attempts === 1) {
        return new Promise<Response>((_, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              const abortErr = new Error('The operation was aborted');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          }
        });
      }

      if (url.endsWith('/pinFileToIPFS')) {
        return new Response(JSON.stringify({ IpfsHash: 'QmRecoveredImage' }));
      }
      if (url.endsWith('/pinJSONToIPFS')) {
        return new Response(
          JSON.stringify({
            IpfsHash: 'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644',
          })
        );
      }
      throw new Error(`Unexpected url: ${url}`);
    };

    const result = await issueSignedMintClaim({
      userId: USER_A_ID,
      uid: USER_A_UID,
      petUid,
      publicConsent: { accepted: true, consentVersion: '1.0' },
      fetchFn: mockFetch,
      timeoutMs: 80,
      maxRetries: 2,
      retryDelayMs: 20,
    });

    assert.ok(result.claim);
    assert.equal(
      result.claim.metadataUri,
      'ipfs://bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644'
    );
    assert.ok(attempts >= 3, 'Must have attempted initial timed-out call + retry + metadata upload');
  });
});
