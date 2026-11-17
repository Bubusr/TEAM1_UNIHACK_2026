/**
 * EIP-712 signing helper — server-side only.
 * Dùng viem để ký xác nhận hoàn thành lộ trình.
 */

import { createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from './config';

// EIP-712 domain for BusQuest
export function getEIP712Domain() {
  return {
    name: 'BusQuest',
    version: '1',
    chainId: config.CHAIN_ID,
    verifyingContract: config.CHECK_IN_MANAGER as `0x${string}`,
  } as const;
}

// Completion type used by CheckInManager.completeRoute
const completionTypes = {
  Completion: [
    { name: 'player', type: 'address' },
    { name: 'routeId', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export interface CompletionMessage {
  player: `0x${string}`;
  routeId: bigint;
  nonce: bigint;
  deadline: bigint;
}

/**
 * Ký EIP-712 Completion bằng khoá riêng của verifier (server).
 * Khoá đọc từ biến môi trường VERIFIER_PRIVATE_KEY.
 */
export async function signCompletion(message: CompletionMessage): Promise<Hex> {
  const pk = process.env.VERIFIER_PRIVATE_KEY;
  if (!pk) {
    throw new Error('VERIFIER_PRIVATE_KEY chưa được cấu hình');
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createWalletClient({
    account,
    transport: http(config.RPC_URL),
  });

  const signature = await client.signTypedData({
    domain: getEIP712Domain(),
    types: completionTypes,
    primaryType: 'Completion',
    message: {
      player: message.player,
      routeId: message.routeId,
      nonce: message.nonce,
      deadline: message.deadline,
    },
  });

  return signature;
}
