import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { getAvalancheChainId } from './web3Service.ts';
import {
  consumeNonceAndBindWallet,
  removeBoundWallet,
  storeWalletAuthNonce,
} from '../db/web3Repository.ts';

export function buildWalletVerificationMessage(params: {
  uid: string;
  walletAddress: string;
  nonce: string;
  chainId: number;
}): string {
  return [
    'Paws & Picket Keeper Wallet Verification',
    `Account: ${params.uid}`,
    `Wallet: ${params.walletAddress}`,
    `Chain ID: ${params.chainId}`,
    `Nonce: ${params.nonce}`,
  ].join('\n');
}

export async function issueWalletNonce(params: {
  userId: number;
  uid: string;
  rawAddress: string;
}) {
  let checksumAddress: string;
  try {
    checksumAddress = ethers.getAddress(params.rawAddress.trim());
  } catch {
    throw new Error('Invalid Ethereum/Avalanche wallet address.');
  }

  const normalizedAddress = checksumAddress.toLowerCase();
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await storeWalletAuthNonce({
      nonce,
      userId: params.userId,
      uid: params.uid,
      walletAddress: normalizedAddress,
      expiresAt,
    });
  } catch (error) {
    console.error('Failed to store wallet auth nonce:', error);
    throw new Error('Could not issue wallet verification challenge.', {
      cause: error,
    });
  }

  const message = buildWalletVerificationMessage({
    uid: params.uid,
    walletAddress: checksumAddress,
    nonce,
    chainId: getAvalancheChainId(),
  });

  return {
    nonce,
    walletAddress: checksumAddress,
    message,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifyAndBindWallet(params: {
  userId: number;
  uid: string;
  rawAddress: string;
  nonce: string;
  signature: string;
}) {
  let checksumAddress: string;
  try {
    checksumAddress = ethers.getAddress(params.rawAddress.trim());
  } catch {
    throw new Error('Invalid wallet address.');
  }
  const normalizedAddress = checksumAddress.toLowerCase();

  if (!params.nonce || !params.signature) {
    throw new Error('Missing nonce or wallet signature.');
  }

  const chainId = getAvalancheChainId();
  const expectedMessage = buildWalletVerificationMessage({
    uid: params.uid,
    walletAddress: checksumAddress,
    nonce: params.nonce,
    chainId,
  });

  let recoveredAddress: string;
  try {
    recoveredAddress = ethers.verifyMessage(expectedMessage, params.signature);
  } catch {
    throw new Error('Malformed wallet signature.');
  }

  if (recoveredAddress.toLowerCase() !== normalizedAddress) {
    throw new Error('Signature does not match the submitted wallet address.');
  }

  try {
    return await consumeNonceAndBindWallet({
      nonce: params.nonce,
      userId: params.userId,
      uid: params.uid,
      walletAddress: normalizedAddress,
      chainId,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to verify wallet linkage.', { cause: error });
  }
}

export async function unlinkWallet(userId: number, uid?: string) {
  try {
    await removeBoundWallet({ userId, uid });
  } catch (error) {
    console.error('Failed to unlink wallet:', error);
    throw new Error('Failed to unlink wallet.', { cause: error });
  }
}
