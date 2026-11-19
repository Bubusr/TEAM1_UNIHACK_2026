import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createPublicClient,
  http,
  decodeEventLog,
  isAddress,
  Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';
import { BLOCKCHAIN_CONFIG } from '../contracts/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

// Load contract ABI
const artifactPath = path.resolve(rootDir, 'src', 'contracts', 'PawsAndPicketPassport.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Format private key helper
function formatHexKey(key: string): Hex {
  return (key.startsWith('0x') ? key : `0x${key}`) as Hex;
}

const signerPrivateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY;
if (!signerPrivateKey) {
  console.warn('WARNING: BACKEND_SIGNER_PRIVATE_KEY is not set in .env!');
}

const signerAccount = signerPrivateKey
  ? privateKeyToAccount(formatHexKey(signerPrivateKey))
  : null;

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(BLOCKCHAIN_CONFIG.rpcUrl),
});

// EIP-712 Domain and Types specification (Contract compatible)
export const EIP712_DOMAIN = {
  name: 'PawsAndPicketPassport',
  version: '1',
  chainId: BLOCKCHAIN_CONFIG.chainId,
  verifyingContract: BLOCKCHAIN_CONFIG.contractAddress,
} as const;

export const EIP712_TYPES = {
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
} as const;

// In-memory cache for idempotency of verified mints
const verifiedMintsCache = new Map<string, any>();

// Used nonces tracking
let nonceCounter = BigInt(Date.now());

export interface CreateClaimRequest {
  recipient: `0x${string}`;
  petId: number | string;
  petName: string;
  species: string;
  score: number;
  imageUrl?: string;
  bio?: string;
}

/**
 * Signs an EIP-712 Passport Claim for an eligible pet
 */
export async function createPassportClaim(req: CreateClaimRequest) {
  if (!signerAccount) {
    throw new Error('Backend signer account not configured on server.');
  }

  if (!isAddress(req.recipient)) {
    throw new Error('Invalid recipient EVM wallet address.');
  }

  if (req.score < 60) {
    throw new Error('Pet score does not meet minimum eligibility criteria (Score >= 60).');
  }

  // Generate unique nonce and 15-minute deadline
  nonceCounter += 1n;
  const nonce = nonceCounter;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 900); // 15 mins

  // Numeric Pet ID
  let numericPetId: bigint;
  if (typeof req.petId === 'string') {
    // If format like "pet-calico" or alphanumeric, hash to uint256
    const clean = req.petId.replace(/[^0-9]/g, '');
    numericPetId = clean ? BigInt(clean) : BigInt(Math.abs(hashString(req.petId)));
  } else {
    numericPetId = BigInt(req.petId);
  }

  // Construct metadata object
  const metadata = {
    name: `${req.petName} - Pet Passport NFT`,
    description: `Official on-chain Pet Passport for ${req.petName} the ${req.species} in Paws & Picket. Score: ${req.score}/100.`,
    image: req.imageUrl || 'https://pawsandpicket.app/assets/default-pet.png',
    attributes: [
      { trait_type: 'Species', value: req.species },
      { trait_type: 'Score', value: req.score },
      { trait_type: 'Pet ID', value: numericPetId.toString() },
      { trait_type: 'Certified By', value: 'Paws & Picket Sanctuary AI Judge' },
    ],
  };

  // Metadata URI format (Data URI encoded JSON for 100% autonomous persistence)
  const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

  const message = {
    recipient: req.recipient,
    petId: numericPetId,
    petName: req.petName,
    species: req.species,
    score: BigInt(req.score),
    tokenURI,
    nonce,
    deadline,
  };

  // Sign EIP-712 Typed Data
  const signature = await signerAccount.signTypedData({
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: 'PassportClaim',
    message,
  });

  return {
    claim: {
      recipient: message.recipient,
      petId: message.petId.toString(),
      petName: message.petName,
      species: message.species,
      score: Number(message.score),
      tokenURI: message.tokenURI,
      nonce: message.nonce.toString(),
      deadline: message.deadline.toString(),
    },
    signature,
    contractAddress: BLOCKCHAIN_CONFIG.contractAddress,
    chainId: BLOCKCHAIN_CONFIG.chainId,
    signerAddress: signerAccount.address,
  };
}

/**
 * Verifies an on-chain mint transaction on Avalanche Fuji (Idempotent)
 */
export async function verifyMintTransaction(txHash: `0x${string}`) {
  const normalizedHash = txHash.toLowerCase();

  // Check cache for idempotent responses
  if (verifiedMintsCache.has(normalizedHash)) {
    return {
      ...verifiedMintsCache.get(normalizedHash),
      cached: true,
    };
  }

  // Fetch transaction receipt from Avalanche Fuji
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    timeout: 30000,
  });

  if (receipt.status !== 'success') {
    throw new Error('Transaction was reverted on-chain.');
  }

  if (receipt.to?.toLowerCase() !== BLOCKCHAIN_CONFIG.contractAddress.toLowerCase()) {
    throw new Error('Transaction recipient does not match PawsAndPicketPassport contract.');
  }

  // Parse PetPassportMinted event
  let mintedData: any = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === BLOCKCHAIN_CONFIG.contractAddress.toLowerCase()) {
      try {
        const decoded: any = decodeEventLog({
          abi: artifact.abi,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'PetPassportMinted') {
          mintedData = decoded.args;
          break;
        }
      } catch {
        // Continue searching logs
      }
    }
  }

  if (!mintedData) {
    throw new Error('PetPassportMinted event not found in transaction receipt.');
  }

  const result = {
    verified: true,
    txHash,
    blockNumber: Number(receipt.blockNumber),
    contractAddress: BLOCKCHAIN_CONFIG.contractAddress,
    tokenId: mintedData.tokenId.toString(),
    petId: mintedData.petId.toString(),
    recipient: mintedData.recipient,
    petName: mintedData.petName,
    species: mintedData.species,
    score: Number(mintedData.score),
    tokenURI: mintedData.tokenURI,
    explorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/${txHash}`,
    contractExplorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/address/${BLOCKCHAIN_CONFIG.contractAddress}`,
    verifiedAt: new Date().toISOString(),
  };

  // Cache for future duplicate requests
  verifiedMintsCache.set(normalizedHash, result);

  return result;
}

/**
 * Returns current blockchain status and config
 */
export async function getBlockchainStatus() {
  const currentBlock = await publicClient.getBlockNumber();
  return {
    network: BLOCKCHAIN_CONFIG.chainName,
    chainId: BLOCKCHAIN_CONFIG.chainId,
    contractAddress: BLOCKCHAIN_CONFIG.contractAddress,
    trustedSigner: signerAccount ? signerAccount.address : null,
    latestBlock: Number(currentBlock),
    explorerUrl: BLOCKCHAIN_CONFIG.explorerUrl,
    status: 'ONLINE',
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
