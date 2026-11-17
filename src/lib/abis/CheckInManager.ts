/**
 * CheckInManager ABI — minimal, chỉ các hàm frontend cần.
 * Sẽ được cập nhật bằng ABI thật sau khi biên dịch hợp đồng.
 */
export const checkInManagerAbi = [
  {
    type: 'function',
    name: 'completeRoute',
    inputs: [
      { name: 'routeId', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'completed',
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'routeId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'RouteCompleted',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'routeId', type: 'uint256', indexed: true },
    ],
  },
] as const;
