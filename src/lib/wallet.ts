import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  decodeEventLog,
  encodeFunctionData,
  parseAbiItem,
} from 'viem';
import { avalancheFuji } from 'viem/chains';
import { BLOCKCHAIN_CONFIG } from '../contracts/config';
import { PawsAndPicketPassportABI } from '../contracts/PawsAndPicketPassportABI';

export interface WalletState {
  isInstalled: boolean;
  isConnected: boolean;
  account: `0x${string}` | null;
  chainId: number | null;
  isFuji: boolean;
  error: string | null;
}

export interface MintResult {
  txHash: string;
  tokenId?: string;
  petId?: string;
  explorerUrl: string;
  verified: boolean;
}

const FUJI_CHAIN_ID = 43113;
const FUJI_CHAIN_HEX = '0xa869';

/**
 * Returns the active Ethereum / Core Wallet provider
 */
export function getWalletProvider(): any {
  if (typeof window === 'undefined') return null;
  // Core Wallet exposes window.avalanche, but also implements EIP-1193 on window.ethereum
  return (window as any).avalanche || (window as any).ethereum || null;
}

/**
 * Check if Core Wallet or compatible EIP-1193 wallet is installed
 */
export function isWalletInstalled(): boolean {
  return Boolean(getWalletProvider());
}

/**
 * Connect to Core Wallet via EIP-1193 eth_requestAccounts
 */
export async function connectCoreWallet(): Promise<`0x${string}`> {
  const provider = getWalletProvider();
  if (!provider) {
    throw new Error('Core Wallet is not detected. Please install Core Wallet from https://core.app/');
  }

  try {
    const accounts: string[] = await provider.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts selected or request rejected by user.');
    }

    return accounts[0] as `0x${string}`;
  } catch (err: any) {
    if (err.code === 4001) {
      throw new Error('Wallet connection rejected by user.');
    }
    throw new Error(err.message || 'Failed to connect Core Wallet.');
  }
}

/**
 * Ensures the wallet is connected to Avalanche Fuji Testnet (43113)
 */
export async function ensureFujiChain(): Promise<void> {
  const provider = getWalletProvider();
  if (!provider) throw new Error('Wallet provider not found.');

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: FUJI_CHAIN_HEX }],
    });
  } catch (switchError: any) {
    // Error code 4902 indicates that the chain has not been added to the wallet
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: FUJI_CHAIN_HEX,
              chainName: 'Avalanche Fuji Testnet',
              nativeCurrency: {
                name: 'Avalanche',
                symbol: 'AVAX',
                decimals: 18,
              },
              rpcUrls: [BLOCKCHAIN_CONFIG.rpcUrl],
              blockExplorerUrls: [BLOCKCHAIN_CONFIG.explorerUrl],
            },
          ],
        });
      } catch (addError: any) {
        throw new Error(addError.message || 'Failed to add Avalanche Fuji network to wallet.');
      }
    } else if (switchError.code === 4001) {
      throw new Error('User declined to switch to Avalanche Fuji Testnet.');
    } else {
      throw switchError;
    }
  }
}

/**
 * Mint Pet Passport NFT end-to-end:
 * 1. Request signed claim from Backend API
 * 2. Send mintWithClaim transaction via Core Wallet
 * 3. Wait for confirmation receipt
 * 4. Verify transaction with Backend API
 */
export async function mintPetPassportNFT(params: {
  recipient: `0x${string}`;
  petId: string | number;
  petName: string;
  species: string;
  score: number;
  imageUrl?: string;
}): Promise<MintResult> {
  const provider = getWalletProvider();
  if (!provider) {
    throw new Error('Wallet provider not found.');
  }

  // 1. Ensure connected to Fuji
  await ensureFujiChain();

  // 2. Request Claim from Backend
  const claimRes = await fetch('/api/blockchain/claim-passport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!claimRes.ok) {
    const errorData = await claimRes.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to get passport claim (${claimRes.status})`);
  }

  const { claim, signature, contractAddress } = await claimRes.json();

  // 3. Prepare wallet client & public client
  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(BLOCKCHAIN_CONFIG.rpcUrl),
  });

  const walletClient = createWalletClient({
    chain: avalancheFuji,
    transport: custom(provider),
  });

  // Prepare struct argument matching contract
  const formattedClaim = {
    recipient: claim.recipient as `0x${string}`,
    petId: BigInt(claim.petId),
    petName: claim.petName,
    species: claim.species,
    score: BigInt(claim.score),
    tokenURI: claim.tokenURI,
    nonce: BigInt(claim.nonce),
    deadline: BigInt(claim.deadline),
  };

  // 4. Send transaction
  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: PawsAndPicketPassportABI,
    functionName: 'mintWithClaim',
    args: [formattedClaim, signature as `0x${string}`],
    account: params.recipient,
  });

  // 5. Wait for on-chain receipt
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  if (receipt.status !== 'success') {
    throw new Error('Mint transaction reverted on Avalanche Fuji.');
  }

  // 6. Verify with backend API
  let verifiedData: any = null;
  try {
    const verifyRes = await fetch('/api/blockchain/verify-mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash }),
    });
    if (verifyRes.ok) {
      verifiedData = await verifyRes.json();
    }
  } catch (err) {
    console.warn('Backend verification call warning:', err);
  }

  return {
    txHash,
    tokenId: verifiedData?.tokenId || '1',
    petId: String(params.petId),
    explorerUrl: `${BLOCKCHAIN_CONFIG.explorerUrl}/tx/${txHash}`,
    verified: Boolean(verifiedData?.verified),
  };
}
