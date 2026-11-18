import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { ethers } from 'ethers';
import { db } from '../db/index.ts';
import {
  adoptionOffers,
  mintClaims,
  pets,
  users,
  wallets,
} from '../db/schema.ts';
import {
  getLinkedWallet,
  getPetForWeb3,
  getWalletByAddress,
  recordConfirmedMint,
  recordIssuedMintClaim,
  updatePetOnChainOwnership,
} from '../db/web3Repository.ts';
import { MINT_ELIGIBILITY_RULES } from '../shared/gameMeta.ts';
import { computeMintEligibility } from './rewards.ts';

export const PAWS_PASSPORT_ABI = [
  'function mintWithClaim(address recipient, bytes32 petIdHash, string metadataUri, uint256 nonce, uint256 deadline, bytes signature) external returns (uint256)',
  'function createAdoptionOffer(uint256 tokenId, address to, uint64 durationSeconds) external',
  'function cancelAdoptionOffer(uint256 tokenId) external',
  'function acceptAdoption(uint256 tokenId) external',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenByPetId(bytes32 petIdHash) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function passports(uint256 tokenId) view returns (bytes32 petIdHash, address originalDiscoverer, uint64 discoveredAt, uint64 mintedAt)',
  'function adoptionOffers(uint256 tokenId) view returns (address from, address to, uint64 expiresAt, bool active)',
  'event PetMinted(uint256 indexed tokenId, bytes32 indexed petIdHash, address indexed discoverer, string metadataUri, uint256 nonce)',
  'event AdoptionOffered(uint256 indexed tokenId, address indexed from, address indexed to, uint64 expiresAt)',
  'event AdoptionCancelled(uint256 indexed tokenId, address indexed cancelledBy)',
  'event AdoptionCompleted(uint256 indexed tokenId, address indexed from, address indexed to, bytes32 petIdHash)',
] as const;

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
    process.env.PET_PASSPORT_CONTRACT_ADDRESS?.trim() || ''
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
  const bond = Number(pet.bondXp ?? 0);
  return score >= 80 && bond >= 100;
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

  // Automated test runner deterministic fallback
  if (process.env.NODE_ENV === 'test') {
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
  };
  recipientChecksum: string;
  apiKey: string;
  fetchFn?: typeof fetch;
}): Promise<{
  imageCid: string;
  metadataCid: string;
  metadataUri: string;
}> {
  const doFetch = params.fetchFn ?? fetch;
  const { buffer, mimeType, ext } = await readPetPortraitBytes(params.pet.photoUrl);

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  formData.append('file', blob, `paws-passport-${params.pet.petUid}.${ext}`);
  formData.append(
    'pinataMetadata',
    JSON.stringify({ name: `paws-passport-image-${params.pet.petUid}` })
  );

  const imgRes = await doFetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: formData,
  });

  if (!imgRes.ok) {
    const body = await imgRes.text().catch(() => '');
    throw new Error(`Pinata image upload failed (${imgRes.status}): ${body}`);
  }

  const imgJson = (await imgRes.json()) as { IpfsHash?: string };
  if (!imgJson.IpfsHash) {
    throw new Error('Pinata image upload did not return an IpfsHash.');
  }

  const imageCid = imgJson.IpfsHash;
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

  const metaRes = await doFetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name: `paws-passport-${params.pet.petUid}` },
      pinataContent: metadataJson,
    }),
  });

  if (!metaRes.ok) {
    const body = await metaRes.text().catch(() => '');
    throw new Error(`Pinata metadata upload failed (${metaRes.status}): ${body}`);
  }

  const metaJson = (await metaRes.json()) as { IpfsHash?: string };
  if (!metaJson.IpfsHash) {
    throw new Error('Pinata metadata upload did not return an IpfsHash.');
  }

  return {
    imageCid,
    metadataCid: metaJson.IpfsHash,
    metadataUri: `ipfs://${metaJson.IpfsHash}`,
  };
}

export async function issueSignedMintClaim(params: {
  userId: number;
  uid?: string;
  petUid: string;
  publicBaseUrl?: string | null;
}) {
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

  const linkedWallet = await getLinkedWallet({
    userId: params.userId,
    uid: params.uid,
  });

  if (!linkedWallet) {
    throw new Error('Link and verify your wallet in Keeper Profile before minting.');
  }

  const pet = await getPetForWeb3(params.petUid);

  if (!pet) {
    throw new Error('Pet passport not found.');
  }
  const isOwner =
    pet.currentOwnerId === params.userId ||
    (params.uid && pet.currentOwnerUid === params.uid);
  if (!isOwner) {
    throw new Error('Only the current pet owner can request a mint claim.');
  }

  const eligibility = computeMintEligibility(pet);
  if (pet.mintStatus === 'minted') {
    throw new Error('This pet has already been minted on-chain.');
  }
  if (!eligibility.scoreMet) {
    throw new Error(
      `Pet needs an AI score of ${eligibility.minScore}+ to mint (current: ${pet.discoveryScore}).`
    );
  }
  if (!eligibility.bondMet) {
    throw new Error(
      `Build ${eligibility.minBondXp} Bond XP through care, feeding, and play first (current: ${pet.bondXp}/${eligibility.minBondXp}).`
    );
  }

  const recipientChecksum = ethers.getAddress(linkedWallet.address);
  const storage = getMetadataStorageConfig();

  let ipfsCid: string | null = null;
  let metadataUri: string;

  if (storage.provider === 'pinata') {
    const apiKey = process.env.METADATA_STORAGE_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'METADATA_STORAGE_API_KEY is required when METADATA_STORAGE_PROVIDER=pinata.'
      );
    }
    const pinned = await pinPetPassportToPinata({
      pet,
      recipientChecksum,
      apiKey,
    });
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
    MintClaim: [
      { name: 'recipient', type: 'address' },
      { name: 'petIdHash', type: 'bytes32' },
      { name: 'metadataUriHash', type: 'bytes32' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const value = {
    recipient: recipientChecksum,
    petIdHash,
    metadataUriHash: ethers.keccak256(ethers.toUtf8Bytes(metadataUri)),
    nonce: nonceBig,
    deadline,
  };

  const signature = await signerWallet.signTypedData(domain, types, value);

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
  const expectedPetIdHash = ethers.id(pet.petUid).toLowerCase();

  let matchedLog: {
    tokenId: string;
    discoverer: string;
    metadataUri: string;
    nonce: string;
  } | null = null;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== expectedContract) continue;
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === 'PetMinted') {
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
