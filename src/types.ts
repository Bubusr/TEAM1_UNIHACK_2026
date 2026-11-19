export type PetSpecies = 'cat' | 'dog' | 'bunny' | 'corgi' | 'shiba' | 'samoyed';

export type CutoutMode = 'studio' | 'silhouette' | 'auto';

export type PetAnimState = 'idle' | 'eating' | 'playing' | 'happy';

export type JourneyPhase =
  | 'discover'
  | 'welcome'
  | 'care'
  | 'grow'
  | 'preserve'
  | 'connect';

export type DiscoveryStatus =
  | 'Discovered'
  | 'Welcomed'
  | 'Passport Ready'
  | 'Preserved On-Chain';

/**
 * Shared Blueprint Data Model (M1 / M2 / M3 API Contract)
 */
export interface PetProfile {
  id: string;
  name: string;
  species: string;
  imageUrl: string;
  bondXp: number;
  bondLevel: number;
  discoveryStatus: DiscoveryStatus | string;
  passportEligible: boolean;
  passportTokenId?: string;
  discoveryDate: string;
  pose?: string;
  aiScore?: number;
  ipfsCid?: string;
  ipfsUri?: string;
  txHash?: string;
  ownerAddress?: string;
}

export type CropType = 'carrot' | 'berry' | 'catnip' | 'wheat';
export type FruitType = 'apple' | 'peach';
export type FoodItemType = CropType | FruitType;

export interface CropPlot {
  id: string;
  crop: CropType | null;
  plantedAt: number | null;
  durationMs: number;
  watered?: boolean;
}

export interface OrchardTree {
  id: string;
  fruit: FruitType;
  readyAt: number;
  durationMs: number;
  watered?: boolean;
}

export interface MarketListing {
  id: string;
  item: FoodItemType;
  qty: number;
  price: number;
  sold?: boolean;
  buyerName?: string;
}

export interface GardenToy {
  id: string;
  name: string;
  icon: string;
  cost: number;
  x: number;
  y: number;
  owned?: boolean;
}

export interface HatTransform {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
}

export interface SanctuaryPet {
  id: string;
  name: string;
  species: PetSpecies;
  photoUrl: string;
  cutoutMode?: CutoutMode;
  x: number;
  y: number;
  flip?: boolean;
  needsCare?: 'heart' | 'water' | 'food' | null;
  accessory?: string | null;
  hatTransform?: HatTransform;
  score?: number;
  minted?: boolean;
  // Pet Journey & Web3 Passport fields (aligned with PetProfile contract)
  bondXp: number;
  bondLevel: number;
  discoveryDate: string;
  discoveryStatus: DiscoveryStatus;
  passportEligible: boolean;
  passportTokenId?: string;
  pose?: string;
  ipfsCid?: string;
  ipfsUri?: string;
  txHash?: string;
  ownerAddress?: string;
  animState?: PetAnimState;
}

export interface NeighborGarden {
  id: string;
  ownerName: string;
  gardenName: string;
  themeTint: 'peach' | 'sky' | 'lavender';
  streakDays: number;
  pets: SanctuaryPet[];
  toys: GardenToy[];
  marketStock: MarketListing[];
  patsUsed: number;
  maxPats: number;
  wateredCrop: boolean;
  gifted: boolean;
  farmPlots: CropPlot[];
  farmTrees: OrchardTree[];
  waterHelpsUsed: number;
  maxWaterHelps: number;
}

export interface DailyLimits {
  petCoinsUsed: number;
  petCoinsMax: number;
  playCoinsUsed: number;
  playCoinsMax: number;
  feedCoinsUsed: number;
  feedCoinsMax: number;
  cloverCoinsUsed: number;
  cloverCoinsMax: number;
}

export interface JudgeReport {
  id: string;
  photoUrl: string;
  theme: string;
  overallScore: number;
  verdict: string;
  tierLabel: string;
  sharp: number;
  light: number;
  species: string;
  pose: string;
  themeScore: number;
  themeMatch: boolean;
  petName: string;
  coinsReward: number;
  expReward: number;
  cropped?: boolean;
  minted?: boolean;
  petId?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
  kind: 'accessory' | 'energy';
  owned?: boolean;
}

export interface FirstBondQuestState {
  welcomeDone: boolean;
  feedDone: boolean;
  playDone: boolean;
  claimed: boolean;
  rewardXp: number;
  targetPetId?: string;
  claimedAt?: string;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  isAvalancheFuji: boolean;
  providerLabel: 'Core Wallet' | 'Demo Wallet' | null;
  authVerified: boolean;
  connecting: boolean;
  error: string | null;
}

export interface IpfsPassportMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  cid: string;
  tokenUri: string;
}

export interface Eip712MintAuthorization {
  petId: string;
  recipient: string;
  tokenUri: string;
  nonce: number;
  deadline: number;
  signature: string;
  contractAddress: string;
  chainId: number;
}

export interface MintedPassportRecord {
  tokenId: string;
  petId: string;
  petName: string;
  species: string;
  imageUrl: string;
  bondLevel: number;
  bondXp: number;
  discoveryDate: string;
  ownerAddress: string;
  ipfsCid: string;
  ipfsUri: string;
  txHash: string;
  snowtraceUrl: string;
  mintedAt: string;
  aiScore?: number;
  pose?: string;
}
