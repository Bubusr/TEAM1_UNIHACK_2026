// BusQuest shared configuration
// Bản demo trên testnet — Avalanche Fuji C-Chain

export const config = {
  // Chain
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 43113,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',

  // Contract addresses
  CHECK_IN_MANAGER: process.env.NEXT_PUBLIC_CHECK_IN_MANAGER || '',
  BADGE_NFT: process.env.NEXT_PUBLIC_BADGE_NFT || '',
  VOUCHER_MANAGER: process.env.NEXT_PUBLIC_VOUCHER_MANAGER || '',

  // Verifier
  VERIFIER_ADDRESS: process.env.VERIFIER_ADDRESS || '',

  // Demo mode — bỏ qua kiểm tra GPS khi bật
  IS_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',

  // Gameplay constants
  MAX_CHECKIN_DISTANCE_METERS: 200,
  MIN_TIME_BETWEEN_STOPS_SECONDS: 120,
  MAX_TIME_BETWEEN_STOPS_SECONDS: 7200,
  MAX_ROUTES_PER_DAY: 3,
} as const;

export type Config = typeof config;
