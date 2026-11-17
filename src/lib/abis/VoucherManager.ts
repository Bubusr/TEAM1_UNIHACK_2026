/**
 * VoucherManager ABI — minimal, chỉ các hàm frontend cần.
 * Sẽ được cập nhật bằng ABI thật sau khi biên dịch hợp đồng.
 */
export const voucherManagerAbi = [
  {
    type: 'function',
    name: 'vouchers',
    inputs: [{ name: 'voucherId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'partner', type: 'address' },
      { name: 'routeId', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'used', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'redeem',
    inputs: [
      { name: 'voucherId', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'VoucherIssued',
    inputs: [
      { name: 'voucherId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'partner', type: 'address', indexed: false },
      { name: 'routeId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VoucherRedeemed',
    inputs: [
      { name: 'voucherId', type: 'uint256', indexed: true },
      { name: 'partner', type: 'address', indexed: true },
    ],
  },
] as const;
