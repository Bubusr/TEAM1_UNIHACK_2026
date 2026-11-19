import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { ethers } from 'ethers';
import { db } from '../db/index.ts';
import { adminDb } from '../lib/firebase-admin.ts';
import {
  adoptionOffers,
  mintClaims,
  pets,
  users,
  wallets,
} from '../db/schema.ts';
import {
  AUTHORITATIVE_IPFS_DISCLOSURES,
  DEFAULT_DISCLOSURE_REFERENCE,
  DEFAULT_DISCLOSURE_VERSION,
  getIpfsConsentForPet,
  getLinkedWallet,
  getPetForWeb3,
  getWalletByAddress,
  hasValidIpfsConsent,
  markIpfsConsentMinted,
  recordConfirmedMint,
  recordIpfsConsent,
  recordIssuedMintClaim,
  revokeIpfsConsent,
  updatePetOnChainOwnership,
} from '../db/web3Repository.ts';
import { MINT_ELIGIBILITY_RULES } from '../shared/gameMeta.ts';
import { computeMintEligibility } from './rewards.ts';

export const PAWS_PASSPORT_ABI = [
  'function mintWithClaim((address recipient, uint256 petId, string petName, string species, uint256 score, string tokenURI, uint256 nonce, uint256 deadline) claim, bytes signature) external returns (uint256)',
  'function mintWithClaim(address recipient, bytes32 petIdHash, string metadataUri, uint256 nonce, uint256 deadline, bytes signature) external returns (uint256)',
  'function createAdoptionOffer(uint256 tokenId, address to, uint64 durationSeconds) external',
  'function cancelAdoptionOffer(uint256 tokenId) external',
  'function acceptAdoption(uint256 tokenId) external',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenByPetId(bytes32 petIdHash) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function passports(uint256 tokenId) view returns (bytes32 petIdHash, address originalDiscoverer, uint64 discoveredAt, uint64 mintedAt)',
  'function adoptionOffers(uint256 tokenId) view returns (address from, address to, uint64 expiresAt, bool active)',
  'event PetPassportMinted(uint256 indexed tokenId, uint256 indexed petId, address indexed recipient, string petName, string species, uint256 score, string tokenURI)',
  'event PetMinted(uint256 indexed tokenId, bytes32 indexed petIdHash, address indexed discoverer, string metadataUri, uint256 nonce)',
  'event AdoptionOffered(uint256 indexed tokenId, address indexed from, address indexed to, uint64 expiresAt)',
  'event AdoptionCancelled(uint256 indexed tokenId, address indexed cancelledBy)',
  'event AdoptionCompleted(uint256 indexed tokenId, address indexed from, address indexed to, bytes32 petIdHash)',
] as const;

export function getNumericPetId(pet: { id?: number | string; petUid: string }): bigint {
  if (typeof pet.id === 'number' && Number.isFinite(pet.id) && pet.id > 0) {
    return BigInt(pet.id);
  }
  const hash = crypto.createHash('sha256').update(pet.petUid).digest('hex');
  return BigInt('0x' + hash.slice(0, 14));
}

export function getAvalancheChainId(): number {
  const parsed = Number(
    process.env.AVALANCHE_CHAIN_ID?.trim() || MINT_ELIGIBILITY_RULES.FUJI_CHAIN_ID
  );
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : MINT_ELIGIBILITY_RULES.FUJI_CHAIN_ID;
}

export function getAvalancheFujiRpcUrl(): string {
  const configured = process.env.AVALANCHE_FUJI_RPC_URL?.trim();
  if (configured && configured !== 'MY_AVALANCHE_FUJI_RPC_URL') {
    return configured;
  }
  return 'https://api.avax-test.network/ext/bc/C/rpc';
}

export type MetadataStorageProvider = 'server' | 'pinata';

export function getMetadataStorageConfig(): {
  provider: MetadataStorageProvider;
  apiKeyConfigured: boolean;
  requiresApiKey: boolean;
} {
  const rawProvider = (
    process.env.METADATA_STORAGE_PROVIDER?.trim() || 'server'
  ).toLowerCase();
  const provider: MetadataStorageProvider =
    rawProvider === 'pinata' || rawProvider === 'ipfs' ? 'pinata' : 'server';
  const rawKey = process.env.METADATA_STORAGE_API_KEY?.trim() || '';
  const apiKey = rawKey === 'MY_METADATA_STORAGE_API_KEY' ? '' : rawKey;
  return {
    provider,
    apiKeyConfigured: Boolean(apiKey),
    requiresApiKey: provider === 'pinata',
  };
}

function parseOptionalAddress(raw: string): string | null {
  if (!raw) return null;
  try {
    return ethers.getAddress(raw);
  } catch {
    return null;
  }
}

export function getWeb3Status() {
  const chainId = getAvalancheChainId();
  const rpcUrl = getAvalancheFujiRpcUrl();
  const contractAddress = parseOptionalAddress(
    process.env.PET_PASSPORT_CONTRACT_ADDRESS?.trim() ||
      process.env.PAWS_PASSPORT_CONTRACT_ADDRESS?.trim() ||
      ''
  );
  const rawSignerKey = process.env.TRUSTED_SIGNER_PRIVATE_KEY?.trim() || '';

  let signerAddress: string | null = null;
  if (rawSignerKey) {
    try {
      signerAddress = new ethers.Wallet(rawSignerKey).address;
    } catch {
      signerAddress = null;
    }
  }

  const storage = getMetadataStorageConfig();
  const metadataStorageReady =
    !storage.requiresApiKey || storage.apiKeyConfigured;

  const missingConfig: string[] = [];
  if (!contractAddress) missingConfig.push('PET_PASSPORT_CONTRACT_ADDRESS');
  if (!signerAddress) missingConfig.push('TRUSTED_SIGNER_PRIVATE_KEY');
  if (storage.requiresApiKey && !storage.apiKeyConfigured) {
    missingConfig.push('METADATA_STORAGE_API_KEY');
  }

  const geminiRaw = process.env.GEMINI_API_KEY?.trim() || '';
  const geminiConfigured = Boolean(
    geminiRaw && geminiRaw !== 'MY_GEMINI_API_KEY'
  );

  return {
    phase: 1,
    chainId,
    chainName:
      chainId === 43113 ? 'Avalanche Fuji Testnet' : `Avalanche Chain ${chainId}`,
    explorerBaseUrl: 'https://testnet.snowtrace.io',
    rpcConfigured: Boolean(rpcUrl),
    contractConfigured: Boolean(contractAddress),
    signerConfigured: Boolean(signerAddress),
    readyForMint: Boolean(contractAddress && signerAddress && metadataStorageReady),
    contractAddress,
    metadataProvider: storage.provider,
    ipfsConfigured: storage.provider === 'pinata' && storage.apiKeyConfigured,
    geminiConfigured,
    missingConfig,
  };
}

export function getFujiProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getAvalancheFujiRpcUrl(), getAvalancheChainId());
}

export function isPetPubliclyAccessible(
  pet:
    | {
        mintStatus?: string;
        discoveryScore?: number;
        bondXp?: number;
        score?: number;
      }
    | null
    | undefined
): boolean {
  if (!pet) return false;
  if (pet.mintStatus === 'minted' || pet.mintStatus === 'pending') return true;

  const score = Number(pet.discoveryScore ?? pet.score ?? 0);
  return score >= 80;
}

export function sanitizePublicOrigin(val?: string | null): string | null {
  const trimmed = (val || '').trim();
  if (!trimmed || trimmed === 'MY_APP_URL') return null;
  if (!trimmed.startsWith('https://')) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('0.0.0.0') ||
    /:\d{2,5}$/.test(trimmed)
  ) {
    return null;
  }
  return trimmed.replace(/\/$/, '');
}

export function getCanonicalOrigin(candidateOverride?: string | null): string | null {
  // If candidateOverride is explicitly supplied, sanitize it directly
  if (candidateOverride !== undefined && candidateOverride !== null) {
    return sanitizePublicOrigin(candidateOverride);
  }

  // Otherwise inspect environment variable
  const fromEnv = sanitizePublicOrigin(process.env.APP_URL);
  if (fromEnv) {
    return fromEnv;
  }

  // Never provide test fallback in production mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Automated test runner deterministic fallback
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.npm_lifecycle_event === 'test' ||
    (Array.isArray(process.argv) &&
      process.argv.some(
        (arg) => typeof arg === 'string' && (arg.includes('--test') || arg.includes('test/'))
      ))
  ) {
    return 'https://test.pawsandpicket.local';
  }

  // Fail closed in production/unconfigured runtime
  return null;
}

export function buildPublicPetMetadata(pet: {
  petUid: string;
  name: string;
  species: string;
  pose: string;
  discoveryScore: number;
  bondXp: number;
  careCount: number;
  discoveredAt: Date;
  originalDiscovererWallet: string | null;
  publicImageUrl: string;
}) {
  let image = pet.publicImageUrl?.trim();
  const canonicalOrigin = getCanonicalOrigin();
  if (
    !image ||
    image.includes('localhost') ||
    image.includes('127.0.0.1') ||
    (!image.startsWith('https://') && !image.startsWith('ipfs://'))
  ) {
    if (canonicalOrigin) {
      image = `${canonicalOrigin}/api/pets/${encodeURIComponent(pet.petUid)}/portrait`;
    }
  }

  return {
    name: `${pet.name} · Paws & Picket Passport`,
    description: `Canonical Pet Passport for ${pet.name}, discovered in Paws & Picket. Direct transfers are blocked; ownership changes only via explicit adoption.`,
    image,
    attributes: [
      { trait_type: 'Species', value: pet.species },
      { trait_type: 'Pose', value: pet.pose },
      { trait_type: 'Discovery Score', value: pet.discoveryScore },
      { trait_type: 'Bond XP', value: pet.bondXp },
      { trait_type: 'Care Milestones', value: pet.careCount },
      {
        trait_type: 'Discovered Date',
        value:
          pet.discoveredAt instanceof Date && !Number.isNaN(pet.discoveredAt.getTime())
            ? pet.discoveredAt.toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
      },
      ...(pet.originalDiscovererWallet
        ? [
            {
              trait_type: 'Original Discoverer',
              value: pet.originalDiscovererWallet,
            },
          ]
        : []),
    ],
  };
}

async function readPetPortraitBytes(
  photoUrl: string
): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  if (photoUrl.startsWith('data:')) {
    const match = photoUrl.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/);
    if (!match) {
      throw new Error('Unsupported data URL format for pet portrait.');
    }
    const mimeType = match[1];
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    return {
      buffer: Buffer.from(match[3], 'base64'),
      mimeType,
      ext,
    };
  }

  if (photoUrl.startsWith('/src/assets/images/')) {
    const assetsRoot = path.resolve(process.cwd(), 'src', 'assets', 'images');
    const relName = path.basename(photoUrl);
    const fullPath = path.resolve(assetsRoot, relName);
    if (!fullPath.startsWith(assetsRoot + path.sep)) {
      throw new Error('Invalid starter pet portrait path.');
    }
    const buffer = await fs.readFile(fullPath);
    const lower = relName.toLowerCase();
    const mimeType = lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';
    const ext = lower.endsWith('.png')
      ? 'png'
      : lower.endsWith('.webp')
      ? 'webp'
      : 'jpg';
    return { buffer, mimeType, ext };
  }

  throw new Error('Unsupported pet portrait source for IPFS upload.');
}

export function isValidIpfsCid(cid: unknown): cid is string {
  if (typeof cid !== 'string') return false;
  const trimmed = cid.trim();
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return false;
  // CIDv0 (Qm... length >= 10, typically 46) or CIDv1 (baf... length >= 10, typically 59)
  if (trimmed.startsWith('Qm') && trimmed.length >= 10) return true;
  if (trimmed.startsWith('baf') && trimmed.length >= 10) return true;
  return false;
}

export function redactSensitiveData(text: string, secrets: string[] = []): string {
  if (!text || typeof text !== 'string') return '';
  let result = text;

  for (const s of secrets) {
    if (s && typeof s === 'string' && s.length >= 4) {
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), '[REDACTED_SECRET]');
    }
  }

  // Redact Bearer tokens
  result = result.replace(/Bearer\s+([A-Za-z0-9_\-.~+/]+=*)/gi, 'Bearer [REDACTED_TOKEN]');

  // Redact JWT tokens (header.payload.signature)
  result = result.replace(/\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b/g, '[REDACTED_JWT]');

  // Redact Base64 data URIs
  result = result.replace(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]{16,}/gi, 'data:image/...;base64,[REDACTED_BASE64]');

  // Redact raw image base64 headers if leaked in error messages
  result = result.replace(/\b(iVBORw0KGgo|\/9j\/4AAQSkZJRg|UklGR)[A-Za-z0-9+/=]{16,}\b/g, '[REDACTED_IMAGE_BASE64]');

  // Redact filesystem paths containing user directories
  result = result.replace(/(\/(?:Users|home)\/)[^\s/:,"]+/g, '$1[REDACTED_USER]');
  result = result.replace(/([A-Za-z]:\\Users\\)[^\s\\:,"]+/g, '$1[REDACTED_USER]');

  return result;
}

export function isTransientHttpError(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export function isNonRetryableHttpError(status: number): boolean {
  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 422
  );
}

export function isTransientNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : '';
  if (name === 'AbortError' || name === 'TimeoutError') return true;
  if (/timeout|aborted|econnreset|etimedout|enotfound|eai_again|fetch failed|network error/i.test(msg)) {
    return true;
  }
  return false;
}

export async function executePinataRequest(
  url: string,
  init: RequestInit,
  options: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    apiKey: string;
    actionName: string;
  }
): Promise<Response> {
  const doFetch = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15000;
  const maxRetries = options.maxRetries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const secrets = [options.apiKey];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let didTimeout = false;

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        didTimeout = true;
        controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }

    const abortPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener(
        'abort',
        () => {
          reject(new Error(`Request timed out after ${timeoutMs}ms`));
        },
        { once: true }
      );
    });

    try {
      const response = await Promise.race([
        doFetch(url, {
          ...init,
          signal: controller.signal,
        }),
        abortPromise,
      ]);

      if (timeoutId) clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      const status = response.status;
      const rawBody = await response.text().catch(() => '');
      const sanitizedBody = redactSensitiveData(rawBody, secrets);

      if (isNonRetryableHttpError(status)) {
        throw new Error(
          redactSensitiveData(
            `Pinata ${options.actionName} failed with non-retryable status ${status}: ${sanitizedBody}`,
            secrets
          )
        );
      }

      if (isTransientHttpError(status) && attempt < maxRetries) {
        const backoff = retryDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      throw new Error(
        redactSensitiveData(
          `Pinata ${options.actionName} failed (${status}) after ${attempt + 1} attempt(s): ${sanitizedBody}`,
          secrets
        )
      );
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);

      // Re-throw non-retryable errors immediately
      if (err?.message && err.message.includes('non-retryable status')) {
        throw err;
      }

      const isTimeout =
        didTimeout ||
        err?.name === 'AbortError' ||
        err?.name === 'TimeoutError' ||
        /timed? ?out/i.test(err?.message || '');

      const isTransient = isTimeout || isTransientNetworkError(err);

      if (isTransient && attempt < maxRetries) {
        const backoff = retryDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      const errorMsg = isTimeout
        ? `Pinata ${options.actionName} request timed out after ${timeoutMs}ms (attempt ${attempt + 1}/${maxRetries + 1}).`
        : `Pinata ${options.actionName} network failure: ${err?.message || 'unknown error'}`;

      lastError = new Error(redactSensitiveData(errorMsg, secrets));
      break;
    }
  }

  throw (
    lastError ||
    new Error(
      redactSensitiveData(
        `Pinata ${options.actionName} failed after bounded retries.`,
        secrets
      )
    )
  );
}

export const petImageCidMap = new Map<string, string>();

export function _resetPetImageCidMap() {
  petImageCidMap.clear();
}

export async function pinPetPassportToPinata(params: {
  pet: {
    petUid: string;
    name: string;
    species: string;
    pose: string;
    photoUrl: string;
    discoveryScore: number;
    bondXp: number;
    careCount: number;
    discoveredAt: Date;
    originalDiscovererWallet: string | null;
    ipfsCid?: string | null;
    ipfsImageCid?: string | null;
  };
  recipientChecksum: string;
  apiKey: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  existingImageCid?: string;
}): Promise<{
  imageCid: string;
  metadataCid: string;
  metadataUri: string;
}> {
  const apiKey = (params.apiKey || '').trim();
  if (!apiKey) {
    throw new Error('Pinata API key is required and cannot be empty.');
  }

  const secrets = [apiKey];

  try {
    let imageCid: string;
    const candidateImageCid =
      params.existingImageCid ||
      (params.pet as any).ipfsImageCid;

    if (candidateImageCid && isValidIpfsCid(candidateImageCid)) {
      // Avoid duplicate upload: reuse verified existing image CID
      imageCid = candidateImageCid;
    } else if (params.pet.photoUrl && params.pet.photoUrl.startsWith('ipfs://')) {
      const urlCid = params.pet.photoUrl.replace('ipfs://', '').split('/')[0];
      if (isValidIpfsCid(urlCid)) {
        imageCid = urlCid;
        petImageCidMap.set(params.pet.petUid, imageCid);
      } else {
        imageCid = '';
      }
    } else {
      imageCid = '';
    }

    if (!imageCid) {
      const { buffer, mimeType, ext } = await readPetPortraitBytes(params.pet.photoUrl);

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
      formData.append('file', blob, `paws-passport-${params.pet.petUid}.${ext}`);
      formData.append(
        'pinataMetadata',
        JSON.stringify({ name: `paws-passport-image-${params.pet.petUid}` })
      );

      const imgRes = await executePinataRequest(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        },
        {
          fetchFn: params.fetchFn,
          timeoutMs: params.timeoutMs,
          maxRetries: params.maxRetries,
          retryDelayMs: params.retryDelayMs,
          apiKey,
          actionName: 'image upload',
        }
      );

      let imgJson: { IpfsHash?: unknown } = {};
      try {
        imgJson = (await imgRes.json()) as { IpfsHash?: unknown };
      } catch (parseErr) {
        throw new Error(
          `Pinata image upload returned invalid JSON response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
        );
      }

      if (!isValidIpfsCid(imgJson.IpfsHash)) {
        throw new Error(
          `Pinata image upload returned an invalid IPFS CID: ${JSON.stringify(imgJson.IpfsHash ?? null)}`
        );
      }

      imageCid = imgJson.IpfsHash;
      petImageCidMap.set(params.pet.petUid, imageCid);
      if (!process.env.DATABASE_URL) {
        try {
          await adminDb.collection('pets').doc(params.pet.petUid).set(
            { ipfsImageCid: imageCid },
            { merge: true }
          );
        } catch {
          // Non-fatal caching error
        }
      }
    }

    const metadataJson = buildPublicPetMetadata({
      petUid: params.pet.petUid,
      name: params.pet.name,
      species: params.pet.species,
      pose: params.pet.pose,
      discoveryScore: params.pet.discoveryScore,
      bondXp: params.pet.bondXp,
      careCount: params.pet.careCount,
      discoveredAt: params.pet.discoveredAt,
      originalDiscovererWallet:
        params.pet.originalDiscovererWallet || params.recipientChecksum,
      publicImageUrl: `ipfs://${imageCid}`,
    });

    const metaRes = await executePinataRequest(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          pinataMetadata: { name: `paws-passport-${params.pet.petUid}` },
          pinataContent: metadataJson,
        }),
      },
      {
        fetchFn: params.fetchFn,
        timeoutMs: params.timeoutMs,
        maxRetries: params.maxRetries,
        retryDelayMs: params.retryDelayMs,
        apiKey,
        actionName: 'metadata upload',
      }
    );

    let metaJson: { IpfsHash?: unknown } = {};
    try {
      metaJson = (await metaRes.json()) as { IpfsHash?: unknown };
    } catch (parseErr) {
      throw new Error(
        `Pinata metadata upload returned invalid JSON response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
      );
    }

    if (!isValidIpfsCid(metaJson.IpfsHash)) {
      throw new Error(
        `Pinata metadata upload returned an invalid IPFS CID: ${JSON.stringify(metaJson.IpfsHash ?? null)}`
      );
    }

    return {
      imageCid,
      metadataCid: metaJson.IpfsHash,
      metadataUri: `ipfs://${metaJson.IpfsHash}`,
    };
  } catch (err: any) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const sanitizedMsg = redactSensitiveData(rawMsg, secrets);
    if (err instanceof Error) {
      err.message = sanitizedMsg;
      throw err;
    }
    throw new Error(sanitizedMsg);
  }
}

export interface IssueSignedMintClaimParams {
  userId: number;
  uid?: string;
  petUid: string;
  publicBaseUrl?: string | null;
  publicConsent?: {
    accepted?: boolean;
    consentVersion?: string;
    [key: string]: unknown;
  } | null;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export const inFlightClaimLocks = new Map<string, Promise<any>>();

export function _resetInFlightClaimLocks() {
  inFlightClaimLocks.clear();
}

export async function issueSignedMintClaim(params: IssueSignedMintClaimParams) {
  const cleanPetUid = (params.petUid || '').trim();
  const lockKey = `${cleanPetUid}:${params.userId}`;

  if (inFlightClaimLocks.has(lockKey)) {
    return await inFlightClaimLocks.get(lockKey)!;
  }

  const claimPromise = (async () => {
    return await _executeIssueSignedMintClaim({ ...params, petUid: cleanPetUid });
  })();

  inFlightClaimLocks.set(lockKey, claimPromise);
  try {
    return await claimPromise;
  } finally {
    inFlightClaimLocks.delete(lockKey);
  }
}

async function _executeIssueSignedMintClaim(params: IssueSignedMintClaimParams) {
  const status = getWeb3Status();
  if (!status.readyForMint || !status.contractAddress) {
    const err = new Error(
      `Avalanche Fuji minting is not configured on the server (missing: ${status.missingConfig.join(', ')}).`
    );
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const rawSignerKey = process.env.TRUSTED_SIGNER_PRIVATE_KEY!.trim();
  const signerWallet = new ethers.Wallet(rawSignerKey);

  // Authoritative linked wallet resolved from authenticated session and database
  const linkedWallet = await getLinkedWallet({
    userId: params.userId,
    uid: params.uid,
  });

  if (!linkedWallet) {
    throw new Error('Link and verify your wallet in Keeper Profile before minting.');
  }

  const pet = await getPetForWeb3(params.petUid);

  if (!pet) {
    const err = new Error('Pet passport not found.');
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }

  const isOwner =
    pet.currentOwnerId === params.userId ||
    (params.uid && pet.currentOwnerUid === params.uid);
  if (!isOwner) {
    const err = new Error('Only the current pet owner can request a mint claim.');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }

  const eligibility = computeMintEligibility(pet);
  if (pet.mintStatus === 'minted') {
    const err = new Error('This pet has already been minted on-chain.');
    (err as Error & { statusCode?: number }).statusCode = 400;
    (err as any).code = 'ALREADY_MINTED';
    throw err;
  }
  if (!eligibility.scoreMet) {
    const err = new Error(
      `Pet needs an AI score of ${eligibility.minScore}+ to mint (current: ${pet.discoveryScore}).`
    );
    (err as Error & { statusCode?: number }).statusCode = 400;
    (err as any).code = 'INELIGIBLE';
    throw err;
  }
  if (!eligibility.bondMet) {
    const err = new Error(
      `Build ${eligibility.minBondXp} Bond XP through care, feeding, and play first (current: ${pet.bondXp}/${eligibility.minBondXp}).`
    );
    (err as Error & { statusCode?: number }).statusCode = 400;
    (err as any).code = 'INELIGIBLE';
    throw err;
  }

  const recipientChecksum = ethers.getAddress(linkedWallet.address);
  const storage = getMetadataStorageConfig();

  let ipfsCid: string | null = null;
  let metadataUri: string;

  if (storage.provider === 'pinata') {
    // 1. Consent verification before any Pinata upload
    const consent = params.publicConsent;
    if (!consent || consent.accepted !== true) {
      const err = new Error(
        'Explicit user consent is required before publishing pet assets to public IPFS.'
      );
      (err as any).statusCode = 400;
      (err as any).code = 'CONSENT_REQUIRED';
      (err as any).supportedVersions = Object.keys(AUTHORITATIVE_IPFS_DISCLOSURES);
      throw err;
    }

    const consentVersion = String(
      consent.consentVersion || DEFAULT_DISCLOSURE_VERSION
    ).trim();
    const authoritativeDisclosures = AUTHORITATIVE_IPFS_DISCLOSURES[consentVersion];
    if (!authoritativeDisclosures) {
      const err = new Error(
        'Unsupported consent version. Please refresh to load updated disclosures.'
      );
      (err as any).statusCode = 400;
      (err as any).code = 'UNSUPPORTED_CONSENT_VERSION';
      (err as any).supportedVersions = Object.keys(AUTHORITATIVE_IPFS_DISCLOSURES);
      throw err;
    }

    // 2. Persist consent using Member 02's recordIpfsConsent
    try {
      await recordIpfsConsent({
        petUid: pet.petUid,
        userId: params.userId,
        userUid: params.uid,
        walletAddress: recipientChecksum,
        consentVersion,
      });
    } catch (persistErr: any) {
      const err = new Error(
        `Failed to persist consent audit record. Mint claim aborted before IPFS upload: ${persistErr?.message || persistErr}`
      );
      (err as any).statusCode = 500;
      (err as any).code = 'CONSENT_PERSISTENCE_FAILED';
      throw err;
    }

    // 3. Verify consent using hasValidIpfsConsent
    const isValidConsent = await hasValidIpfsConsent({
      petUid: pet.petUid,
      userId: params.userId,
      userUid: params.uid,
      walletAddress: recipientChecksum,
      consentVersion,
    });

    if (!isValidConsent) {
      const err = new Error(
        'Consent verification failed. Public IPFS upload aborted.'
      );
      (err as any).statusCode = 403;
      (err as any).code = 'CONSENT_VERIFICATION_FAILED';
      throw err;
    }

    // 4. Pinata Upload
    const apiKey = process.env.METADATA_STORAGE_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'METADATA_STORAGE_API_KEY is required when METADATA_STORAGE_PROVIDER=pinata.'
      );
    }

    let pinned: { imageCid: string; metadataCid: string; metadataUri: string };

    if (
      pet.metadataUri?.startsWith('ipfs://') &&
      pet.ipfsCid &&
      isValidIpfsCid(pet.ipfsCid)
    ) {
      pinned = {
        imageCid: (pet as any).ipfsImageCid || petImageCidMap.get(pet.petUid) || '',
        metadataCid: pet.ipfsCid,
        metadataUri: pet.metadataUri,
      };
    } else {
      pinned = await pinPetPassportToPinata({
        pet,
        recipientChecksum,
        apiKey,
        existingImageCid:
          (pet as any).ipfsImageCid ||
          petImageCidMap.get(pet.petUid) ||
          undefined,
        fetchFn: params.fetchFn,
        timeoutMs: params.timeoutMs,
        maxRetries: params.maxRetries,
        retryDelayMs: params.retryDelayMs,
      });
    }

    if (!isValidIpfsCid(pinned.metadataCid)) {
      throw new Error(
        `Invalid metadata CID returned: ${JSON.stringify(pinned.metadataCid)}`
      );
    }
    if (!pinned.metadataUri || !pinned.metadataUri.startsWith('ipfs://')) {
      throw new Error(
        `Invalid metadataUri constructed: ${JSON.stringify(pinned.metadataUri)}`
      );
    }

    ipfsCid = pinned.metadataCid;
    metadataUri = pinned.metadataUri;
  } else {
    const base =
      (params.publicBaseUrl ? sanitizePublicOrigin(params.publicBaseUrl) : null) ||
      getCanonicalOrigin();
    if (!base) {
      const err = new Error(
        'Verified production origin is not configured. Set APP_URL to a publicly reachable HTTPS domain before issuing Pet Passport claims.'
      );
      (err as Error & { statusCode?: number }).statusCode = 503;
      throw err;
    }

    metadataUri = `${base}/api/metadata/${encodeURIComponent(pet.petUid)}`;
  }

  const petIdNumeric = getNumericPetId(pet);
  const petIdHash = ethers.id(pet.petUid);
  const nonceBig = BigInt('0x' + crypto.randomBytes(16).toString('hex'));
  const nonceStr = nonceBig.toString();
  const deadline = Math.floor(Date.now() / 1000) + 15 * 60;

  const domain = {
    name: 'PawsAndPicketPassport',
    version: '1',
    chainId: status.chainId,
    verifyingContract: status.contractAddress,
  };

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

  const passportClaimValue = {
    recipient: recipientChecksum,
    petId: petIdNumeric,
    petName: pet.name || 'Pet',
    species: pet.species || 'pet',
    score: BigInt(pet.discoveryScore || 80),
    tokenURI: metadataUri,
    nonce: nonceBig,
    deadline: BigInt(deadline),
  };

  const signature = await signerWallet.signTypedData(domain, types, passportClaimValue);

  await recordIssuedMintClaim({
    petUid: pet.petUid,
    userId: params.userId,
    uid: params.uid,
    walletAddress: linkedWallet.address,
    contractAddress: status.contractAddress!,
    chainId: status.chainId,
    nonce: nonceStr,
    deadline,
    metadataUri,
    ipfsCid,
    signature,
  });

  return {
    chainId: status.chainId,
    contractAddress: status.contractAddress,
    claim: {
      recipient: recipientChecksum,
      petId: petIdNumeric.toString(),
      petName: pet.name || 'Pet',
      species: pet.species || 'pet',
      score: Number(pet.discoveryScore || 80),
      tokenURI: metadataUri,
      petIdHash,
      metadataUri,
      nonce: nonceStr,
      deadline,
      signature,
    },
  };
}

export async function confirmFujiMintTransaction(params: {
  userId: number;
  uid?: string;
  petUid: string;
  txHash: string;
}) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(params.txHash)) {
    throw new Error('Invalid transaction hash format.');
  }

  const status = getWeb3Status();
  if (!status.contractAddress) {
    throw new Error('PET_PASSPORT_CONTRACT_ADDRESS is not configured.');
  }

  const linkedWallet = await getLinkedWallet({
    userId: params.userId,
    uid: params.uid,
  });
  if (!linkedWallet) {
    throw new Error('No verified wallet linked to your Keeper account.');
  }

  const pet = await getPetForWeb3(params.petUid);
  if (!pet) {
    throw new Error('Pet not found in your sanctuary.');
  }
  const isOwner =
    pet.currentOwnerId === params.userId ||
    (params.uid && pet.currentOwnerUid === params.uid);
  if (!isOwner) {
    throw new Error('Pet not found in your sanctuary.');
  }
  if (pet.mintStatus === 'minted') {
    if (pet.mintTxHash?.toLowerCase() === params.txHash.toLowerCase()) {
      return { alreadyConfirmed: true, tokenId: pet.tokenId };
    }
    throw new Error('Pet is already minted on-chain.');
  }

  const provider = getFujiProvider();
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== status.chainId) {
    throw new Error(`Connected RPC is not Avalanche Fuji (${status.chainId}).`);
  }

  const receipt = await provider.getTransactionReceipt(params.txHash);
  if (!receipt) {
    throw new Error(
      'Transaction not yet confirmed on Avalanche Fuji. Wait a moment and retry confirmation.'
    );
  }
  if (receipt.status !== 1) {
    throw new Error('Mint transaction reverted on Avalanche Fuji.');
  }
  const confirmations = await receipt.confirmations();
  if (confirmations < 1) {
    throw new Error('Waiting for block confirmation on Avalanche Fuji.');
  }

  const expectedContract = status.contractAddress.toLowerCase();
  if (!receipt.to || receipt.to.toLowerCase() !== expectedContract) {
    throw new Error('Transaction target does not match the Pet Passport contract.');
  }

  const iface = new ethers.Interface(PAWS_PASSPORT_ABI);
  const expectedPetId = getNumericPetId(pet);
  const expectedPetIdHash = ethers.id(pet.petUid).toLowerCase();

  let matchedLog: {
    tokenId: string;
    discoverer: string;
    metadataUri: string;
    nonce?: string;
  } | null = null;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== expectedContract) continue;
    try {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;
      if (parsed.name === 'PetPassportMinted') {
        const eventPetId = BigInt(parsed.args.petId);
        if (eventPetId === expectedPetId) {
          matchedLog = {
            tokenId: parsed.args.tokenId.toString(),
            discoverer: String(parsed.args.recipient).toLowerCase(),
            metadataUri: String(parsed.args.tokenURI),
          };
          break;
        }
      } else if (parsed.name === 'PetMinted') {
        const eventPetHash = String(parsed.args.petIdHash).toLowerCase();
        if (eventPetHash === expectedPetIdHash) {
          matchedLog = {
            tokenId: parsed.args.tokenId.toString(),
            discoverer: String(parsed.args.discoverer).toLowerCase(),
            metadataUri: String(parsed.args.metadataUri),
            nonce: parsed.args.nonce.toString(),
          };
          break;
        }
      }
    } catch {
      // ignore unrelated logs
    }
  }

  if (!matchedLog) {
    throw new Error(
      'Verified receipt did not contain a matching PetMinted event for this pet.'
    );
  }

  if (matchedLog.discoverer !== linkedWallet.address.toLowerCase()) {
    throw new Error(
      'Minted PetMinted discoverer does not match your verified wallet.'
    );
  }

  const contract = new ethers.Contract(
    status.contractAddress,
    PAWS_PASSPORT_ABI,
    provider
  );
  const onChainOwner = String(
    await contract.ownerOf(BigInt(matchedLog.tokenId))
  ).toLowerCase();

  await recordConfirmedMint({
    petUid: pet.petUid,
    userId: params.userId,
    uid: params.uid,
    tokenId: matchedLog.tokenId,
    txHash: params.txHash,
    onChainOwner,
    contractAddress: status.contractAddress,
  });

  try {
    await markIpfsConsentMinted({
      petUid: pet.petUid,
    });
  } catch {
    // Non-fatal if no consent record existed (e.g. server mode)
  }

  return {
    tokenId: matchedLog.tokenId,
    txHash: params.txHash.toLowerCase(),
    onChainOwner,
  };
}

export async function confirmFujiAdoptionTransaction(params: {
  userId: number;
  offerUid: string;
  txHash: string;
}) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(params.txHash)) {
    throw new Error('Invalid adoption transaction hash.');
  }

  const status = getWeb3Status();
  if (!status.contractAddress) {
    throw new Error('PET_PASSPORT_CONTRACT_ADDRESS is not configured.');
  }

  const [recipientWallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, params.userId))
    .limit(1);
  if (!recipientWallet) {
    throw new Error('Verify your wallet in Keeper Profile before accepting an on-chain adoption.');
  }

  const [offer] = await db
    .select()
    .from(adoptionOffers)
    .where(eq(adoptionOffers.offerUid, params.offerUid))
    .limit(1);
  if (!offer || offer.status !== 'pending') {
    throw new Error('Adoption offer not found or no longer pending.');
  }
  if (offer.expiresAt.getTime() < Date.now()) {
    throw new Error('Adoption offer has expired.');
  }

  const [pet] = await db
    .select()
    .from(pets)
    .where(eq(pets.petUid, offer.petUid))
    .limit(1);
  if (!pet || pet.mintStatus !== 'minted' || !pet.tokenId) {
    throw new Error('Associated minted Pet Passport not found.');
  }

  const provider = getFujiProvider();
  const receipt = await provider.getTransactionReceipt(params.txHash);
  if (!receipt || receipt.status !== 1) {
    throw new Error('On-chain adoption transaction is not confirmed yet.');
  }

  const expectedContract = status.contractAddress.toLowerCase();
  if (!receipt.to || receipt.to.toLowerCase() !== expectedContract) {
    throw new Error('Adoption transaction does not target the Pet Passport contract.');
  }

  const iface = new ethers.Interface(PAWS_PASSPORT_ABI);
  let matchedAdoption = false;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== expectedContract) continue;
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === 'AdoptionCompleted') {
        if (
          parsed.args.tokenId.toString() === pet.tokenId &&
          String(parsed.args.to).toLowerCase() ===
            recipientWallet.address.toLowerCase()
        ) {
          matchedAdoption = true;
          break;
        }
      }
    } catch {
      // ignore unrelated logs
    }
  }

  if (!matchedAdoption) {
    throw new Error(
      'Transaction receipt did not emit AdoptionCompleted for your verified wallet.'
    );
  }

  const contract = new ethers.Contract(
    status.contractAddress,
    PAWS_PASSPORT_ABI,
    provider
  );
  const currentChainOwner = String(
    await contract.ownerOf(BigInt(pet.tokenId))
  ).toLowerCase();
  if (currentChainOwner !== recipientWallet.address.toLowerCase()) {
    throw new Error('On-chain ownerOf does not match your wallet yet.');
  }

  await db.transaction(async (tx) => {
    const [recipientUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);
    if (!recipientUser) throw new Error('Recipient account not found.');

    const updatedMemories = [
      ...(pet.memories || []),
      {
        id: `mem-adopt-${Date.now()}`,
        kind: 'adoption',
        note: `Adopted by ${recipientUser.displayName} via on-chain adoption.`,
        createdAt: new Date().toISOString(),
      },
    ];

    await tx
      .update(pets)
      .set({
        currentOwnerId: params.userId,
        onChainOwner: currentChainOwner,
        memories: updatedMemories,
      })
      .where(eq(pets.id, pet.id));

    await tx
      .update(adoptionOffers)
      .set({
        status: 'accepted',
        toUserId: params.userId,
        acceptTxHash: params.txHash.toLowerCase(),
        resolvedAt: new Date(),
      })
      .where(eq(adoptionOffers.id, offer.id));
  });

  return {
    petUid: pet.petUid,
    tokenId: pet.tokenId,
    newOwnerWallet: currentChainOwner,
  };
}

export async function reconcileMintedPetOwnership(petUid: string) {
  const pet = await getPetForWeb3(petUid);
  if (!pet) throw new Error('Pet not found.');

  const status = getWeb3Status();
  const contractAddress = pet.contractAddress || status.contractAddress;

  if (pet.mintStatus !== 'minted' || !pet.tokenId || !contractAddress) {
    return { reconciled: false, reason: 'Pet is not minted on-chain.' };
  }

  const provider = getFujiProvider();
  const contract = new ethers.Contract(
    contractAddress,
    PAWS_PASSPORT_ABI,
    provider
  );
  const onChainOwner = String(
    await contract.ownerOf(BigInt(pet.tokenId))
  ).toLowerCase();

  const dbOwnerWallet = await getLinkedWallet({
    userId: pet.currentOwnerId,
    uid: pet.currentOwnerUid,
  });

  const dbWalletAddress = dbOwnerWallet?.address?.toLowerCase() ?? null;
  const inSync = Boolean(dbWalletAddress && dbWalletAddress === onChainOwner);

  if (!inSync) {
    // Reconcile ONLY if a verified wallet owner exists in DB for the on-chain owner,
    // otherwise report explicit conflict without silently overwriting ownership!
    const chainUserWallet = await getWalletByAddress(onChainOwner);

    if (chainUserWallet && (chainUserWallet.userId || chainUserWallet.uid)) {
      await updatePetOnChainOwnership({
        petUid: pet.petUid,
        newOwnerId: Number(chainUserWallet.userId || 0),
        newOwnerUid: chainUserWallet.uid,
        onChainOwner,
      });
      return {
        reconciled: true,
        inSync: true,
        onChainOwner,
        conflict: false,
      };
    }

    return {
      reconciled: false,
      inSync: false,
      onChainOwner,
      dbWalletAddress,
      conflict: true,
    };
  }

  return {
    reconciled: true,
    inSync: true,
    onChainOwner,
    conflict: false,
  };
}
