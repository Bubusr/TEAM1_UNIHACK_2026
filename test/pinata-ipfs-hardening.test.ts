import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  executePinataRequest,
  isNonRetryableHttpError,
  isTransientHttpError,
  isTransientNetworkError,
  isValidIpfsCid,
  pinPetPassportToPinata,
  redactSensitiveData,
} from '../src/server/web3Service.ts';

const samplePet = {
  petUid: 'pet-harden-001',
  name: 'Pip',
  species: 'bunny',
  pose: 'Curious',
  photoUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  discoveryScore: 88,
  bondXp: 660,
  careCount: 15,
  discoveredAt: new Date('2026-11-19T00:00:00Z'),
  originalDiscovererWallet: '0xC05DE09a4Af5eDa0B5E191A1F569A787eE5aa889',
};

const recipient = '0xC05DE09a4Af5eDa0B5E191A1F569A787eE5aa889';
const testApiKey = 'pinata-secret-api-key-998877';

describe('Pinata IPFS Upload Hardening & Resilience Suite', () => {
  it('1. Successful image + metadata upload (two-stage flow with valid CIDs)', async () => {
    const calls: { url: string; auth: string | null; body: any }[] = [];

    const mockFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      const headers = init?.headers as Record<string, string>;
      calls.push({
        url,
        auth: headers?.Authorization ?? null,
        body: init?.body,
      });

      if (url.endsWith('/pinFileToIPFS')) {
        return new Response(
          JSON.stringify({ IpfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.endsWith('/pinJSONToIPFS')) {
        return new Response(
          JSON.stringify({
            IpfsHash: 'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    const result = await pinPetPassportToPinata({
      pet: samplePet,
      recipientChecksum: recipient,
      apiKey: testApiKey,
      fetchFn: mockFetch,
    });

    assert.equal(calls.length, 2, 'Expected exactly 2 HTTP requests for image and metadata');
    assert.ok(calls[0].url.endsWith('/pinFileToIPFS'), 'First call must be image pin');
    assert.equal(calls[0].auth, `Bearer ${testApiKey}`);

    assert.ok(calls[1].url.endsWith('/pinJSONToIPFS'), 'Second call must be metadata pin');
    assert.equal(calls[1].auth, `Bearer ${testApiKey}`);

    const metadataPayload = JSON.parse(String(calls[1].body)) as {
      pinataContent: { image: string; name: string };
    };
    assert.equal(
      metadataPayload.pinataContent.image,
      'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      'Metadata JSON must embed image CID with ipfs:// scheme'
    );

    assert.equal(result.imageCid, 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
    assert.equal(
      result.metadataCid,
      'bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644'
    );
    assert.equal(
      result.metadataUri,
      'ipfs://bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644'
    );
  });

  it('2. Request timeout handling (aborts after timeoutMs and retries boundedly)', async () => {
    let callCount = 0;

    const mockFetch: typeof fetch = async (_input, init) => {
      callCount++;
      return new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve(new Response(JSON.stringify({ IpfsHash: 'QmNeverReceived123' }), { status: 200 }));
        }, 150);

        init?.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          const err = new Error('The operation was aborted due to timeout');
          err.name = 'AbortError';
          reject(err);
        });
      });
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: testApiKey,
          fetchFn: mockFetch,
          timeoutMs: 30,
          maxRetries: 1,
          retryDelayMs: 5,
        });
      },
      (err: Error) => {
        assert.ok(
          /timed out/i.test(err.message),
          `Expected timeout error message, got: ${err.message}`
        );
        assert.ok(!err.message.includes(testApiKey), 'Error must not leak API key');
        return true;
      }
    );

    assert.equal(callCount, 2, 'Should attempt initial call plus 1 retry before failing');
  });

  it('3. Retryable HTTP errors (502, 503, 504 retry with exponential backoff and succeed)', async () => {
    let imageAttempts = 0;

    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);

      if (url.endsWith('/pinFileToIPFS')) {
        imageAttempts++;
        if (imageAttempts === 1) {
          return new Response('Bad Gateway', { status: 502 });
        }
        if (imageAttempts === 2) {
          return new Response('Service Unavailable', { status: 503 });
        }
        return new Response(
          JSON.stringify({ IpfsHash: 'QmSuccessAfterRetries123' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.endsWith('/pinJSONToIPFS')) {
        return new Response(
          JSON.stringify({ IpfsHash: 'QmMetaSuccess123' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    const result = await pinPetPassportToPinata({
      pet: samplePet,
      recipientChecksum: recipient,
      apiKey: testApiKey,
      fetchFn: mockFetch,
      maxRetries: 2,
      retryDelayMs: 10,
    });

    assert.equal(imageAttempts, 3, 'Should have retried 502 and 503 before succeeding on attempt 3');
    assert.equal(result.imageCid, 'QmSuccessAfterRetries123');
    assert.equal(result.metadataCid, 'QmMetaSuccess123');
  });

  it('4. Non-retryable HTTP errors (400, 401, 403 fail immediately without retrying)', async () => {
    // Test 401 Unauthorized
    let authAttempts = 0;
    const authMockFetch: typeof fetch = async () => {
      authAttempts++;
      return new Response(
        JSON.stringify({ error: `Unauthorized key ${testApiKey}` }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: testApiKey,
          fetchFn: authMockFetch,
          maxRetries: 3,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('non-retryable status 401'),
          `Expected non-retryable 401 message, got: ${err.message}`
        );
        assert.ok(!err.message.includes(testApiKey), 'API key must be redacted from error');
        return true;
      }
    );
    assert.equal(authAttempts, 1, '401 must fail immediately without retries');

    // Test 400 Bad Request
    let badReqAttempts = 0;
    const badReqMockFetch: typeof fetch = async () => {
      badReqAttempts++;
      return new Response('Invalid request payload', { status: 400 });
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: testApiKey,
          fetchFn: badReqMockFetch,
          maxRetries: 3,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('non-retryable status 400'),
          `Expected non-retryable 400 message, got: ${err.message}`
        );
        return true;
      }
    );
    assert.equal(badReqAttempts, 1, '400 must fail immediately without retries');
  });

  it('5. Malformed Pinata responses (missing, null, or invalid CIDs and non-JSON body)', async () => {
    // 5a: Non-JSON body
    const nonJsonFetch: typeof fetch = async () => {
      return new Response('<html>Error: gateway timeout raw HTML</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: testApiKey,
          fetchFn: nonJsonFetch,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('invalid JSON response'),
          `Expected invalid JSON response, got: ${err.message}`
        );
        return true;
      }
    );

    // 5b: Missing IpfsHash field
    const missingHashFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ status: 'queued' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: testApiKey,
          fetchFn: missingHashFetch,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('invalid IPFS CID'),
          `Expected invalid IPFS CID, got: ${err.message}`
        );
        return true;
      }
    );

    // 5c: Null IpfsHash field
    const nullHashFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ IpfsHash: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: testApiKey,
          fetchFn: nullHashFetch,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('invalid IPFS CID'),
          `Expected invalid IPFS CID, got: ${err.message}`
        );
        return true;
      }
    );

    // 5d: Invalid CID format (non-alphanumeric or too short)
    const invalidCidFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ IpfsHash: 'invalid-cid-format-!!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: testApiKey,
          fetchFn: invalidCidFetch,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('invalid IPFS CID'),
          `Expected invalid IPFS CID, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it('6. Missing or empty API key (fails fast before making any network calls)', async () => {
    let callCount = 0;
    const mockFetch: typeof fetch = async () => {
      callCount++;
      return new Response('{}', { status: 200 });
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: '',
          fetchFn: mockFetch,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('Pinata API key is required'),
          `Expected API key required message, got: ${err.message}`
        );
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: '   ',
          fetchFn: mockFetch,
        });
      },
      (err: Error) => {
        assert.ok(
          err.message.includes('Pinata API key is required'),
          `Expected API key required message, got: ${err.message}`
        );
        return true;
      }
    );

    assert.equal(callCount, 0, 'No network requests should be made when API key is missing');
  });

  it('7. Duplicate/ambiguous upload handling (reuses existingImageCid without re-uploading file)', async () => {
    const calls: string[] = [];

    const mockFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(url);

      if (url.endsWith('/pinFileToIPFS')) {
        throw new Error('pinFileToIPFS should NOT be called when existingImageCid is provided');
      }

      if (url.endsWith('/pinJSONToIPFS')) {
        const body = JSON.parse(String(init?.body)) as {
          pinataContent: { image: string };
        };
        assert.equal(
          body.pinataContent.image,
          'ipfs://QmExistingImageCid789',
          'Metadata must embed provided existingImageCid'
        );
        return new Response(
          JSON.stringify({ IpfsHash: 'QmNewMetadataCid123' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    const result = await pinPetPassportToPinata({
      pet: samplePet,
      recipientChecksum: recipient,
      apiKey: testApiKey,
      fetchFn: mockFetch,
      existingImageCid: 'QmExistingImageCid789',
    });

    assert.equal(calls.length, 1, 'Only metadata JSON upload should be called');
    assert.equal(result.imageCid, 'QmExistingImageCid789');
    assert.equal(result.metadataCid, 'QmNewMetadataCid123');
    assert.equal(result.metadataUri, 'ipfs://QmNewMetadataCid123');
  });

  it('8. Secret redaction in errors and logs (scrubs raw API keys, JWTs, Base64, and filesystem paths)', async () => {
    const rawJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.s3cr3ts1gn4tur3';
    const rawSecret = 'pinata-super-secret-key-445566';
    const sensitivePath = '/Users/apple/HACKATHON/src/server/web3Service.ts';
    const base64Data =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const leakingFetch: typeof fetch = async () => {
      throw new Error(
        `Failed to reach Pinata with Bearer ${rawJwt} and key ${rawSecret} at ${sensitivePath} while parsing ${base64Data}`
      );
    };

    await assert.rejects(
      async () => {
        await pinPetPassportToPinata({
          pet: samplePet,
          recipientChecksum: recipient,
          apiKey: rawSecret,
          fetchFn: leakingFetch,
          maxRetries: 0,
        });
      },
      (err: Error) => {
        const msg = err.message;
        assert.ok(!msg.includes(rawSecret), 'Raw secret must be redacted');
        assert.ok(!msg.includes(rawJwt), 'JWT must be redacted');
        assert.ok(!msg.includes('/Users/apple'), 'Filesystem username path must be redacted');
        assert.ok(
          !msg.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'),
          'Base64 data must be redacted'
        );
        assert.ok(msg.includes('[REDACTED_SECRET]'), 'Must include [REDACTED_SECRET]');
        assert.ok(msg.includes('[REDACTED_TOKEN]') || msg.includes('[REDACTED_JWT]'), 'Must include token redaction');
        assert.ok(msg.includes('[REDACTED_USER]'), 'Must include [REDACTED_USER]');
        return true;
      }
    );
  });

  it('9. Helper unit tests: isValidIpfsCid, redactSensitiveData, error classifications', () => {
    // CIDv0 & CIDv1 validity
    assert.equal(isValidIpfsCid('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'), true);
    assert.equal(
      isValidIpfsCid('bafybeicg2abbmanlpdgahsvsgmytvdweit2xxppnxqkqv6j5amkj5h2644'),
      true
    );
    assert.equal(isValidIpfsCid('QmTestImageCid123'), true);
    assert.equal(isValidIpfsCid('not-a-cid'), false);
    assert.equal(isValidIpfsCid('Qm with space'), false);
    assert.equal(isValidIpfsCid('http://ipfs.io/Qm123'), false);
    assert.equal(isValidIpfsCid(''), false);
    assert.equal(isValidIpfsCid(null), false);
    assert.equal(isValidIpfsCid(undefined), false);
    assert.equal(isValidIpfsCid(123456789), false);

    // HTTP error classification
    assert.equal(isTransientHttpError(502), true);
    assert.equal(isTransientHttpError(503), true);
    assert.equal(isTransientHttpError(504), true);
    assert.equal(isTransientHttpError(429), true);
    assert.equal(isTransientHttpError(400), false);
    assert.equal(isTransientHttpError(401), false);
    assert.equal(isTransientHttpError(403), false);

    assert.equal(isNonRetryableHttpError(400), true);
    assert.equal(isNonRetryableHttpError(401), true);
    assert.equal(isNonRetryableHttpError(403), true);
    assert.equal(isNonRetryableHttpError(404), true);
    assert.equal(isNonRetryableHttpError(422), true);
    assert.equal(isNonRetryableHttpError(500), false);
    assert.equal(isNonRetryableHttpError(503), false);

    // Network error classification
    assert.equal(isTransientNetworkError(new Error('fetch failed')), true);
    assert.equal(isTransientNetworkError(new Error('read ECONNRESET')), true);
    assert.equal(isTransientNetworkError(new Error('connect ETIMEDOUT')), true);
    assert.equal(isTransientNetworkError(new Error('Some other business error')), false);
  });
});
