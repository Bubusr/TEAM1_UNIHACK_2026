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

export interface HatTransform {
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
}

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

export interface PetMemoryEntry {
  id: string;
  kind: string;
  note: string;
  createdAt: string;
}

export interface MintEligibilityInfo {
  eligible: boolean;
  scoreMet: boolean;
  bondMet: boolean;
  notAlreadyMinted: boolean;
  minScore: number;
  minBondXp: number;
  currentScore: number;
  currentBondXp: number;
}

export interface SanctuaryPet {
  id: string;
  petUid?: string;
  name: string;
  species: PetSpecies;
  pose?: string;
  photoUrl: string;
  cutoutMode?: CutoutMode;
  x: number;
  y: number;
  flip?: boolean;
  needsCare?: 'heart' | 'water' | 'food' | null;
  accessory?: string | null;
  hatTransform?: HatTransform;
  score?: number;
  bondXp?: number;
  bondLevel?: number;
  careCount?: number;
  memories?: PetMemoryEntry[];
  originalDiscovererUid?: string;
  originalDiscovererWallet?: string | null;
  discoveredAt?: string;
  discoveryDate?: string;
  discoveryStatus?: DiscoveryStatus | string;
  minted?: boolean;
  mintStatus?: string;
  tokenId?: string | null;
  contractAddress?: string | null;
  mintTxHash?: string | null;
  metadataUri?: string | null;
  ipfsCid?: string | null;
  ipfsUri?: string | null;
  txHash?: string | null;
  onChainOwner?: string | null;
  ownerAddress?: string | null;
  eligibility?: MintEligibilityInfo;
  passportEligible?: boolean;
  passportTokenId?: string | null;
  questPetDone?: boolean;
  questFeedDone?: boolean;
  questPlayDone?: boolean;
  animState?: PetAnimState;
  box_2d?: [number, number, number, number];
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
  submissionUid?: string;
  petUid?: string | null;
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
  unjudged?: boolean;
  box_2d?: [number, number, number, number];
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
  kind: 'accessory' | 'energy';
  owned?: boolean;
}

export interface WalletInfo {
  address: string;
  chainId: number;
  verifiedAt: string;
}

export interface Web3ConfigStatus {
  chainId: number;
  chainName: string;
  explorerBaseUrl: string;
  rpcConfigured: boolean;
  contractConfigured: boolean;
  signerConfigured: boolean;
  readyForMint: boolean;
  contractAddress: string | null;
  pawBadgesContractAddress?: string | null;
  metadataProvider?: 'server' | 'pinata';
  ipfsConfigured: boolean;
  geminiConfigured?: boolean;
  missingConfig: string[];
  phase?: number;
}

export interface AdoptionOfferInfo {
  offerUid: string;
  petUid: string;
  petName?: string;
  petSpecies?: string;
  petPhotoUrl?: string | null;
  tokenId?: string | null;
  contractAddress?: string | null;
  discoveryScore?: number | null;
  bondXp?: number | null;
  fromUserId: number;
  fromWallet: string | null;
  toUserId: number | null;
  toEmail: string | null;
  toWallet: string | null;
  note: string | null;
  isOnChain: boolean;
  offerTxHash: string | null;
  acceptTxHash: string | null;
  status: 'pending' | 'accepted' | 'cancelled' | string;
  direction: 'outgoing' | 'incoming';
  expiresAt: string;
  createdAt: string;
}

export interface KeeperAuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface FirstBondQuestStatus {
  claimed: boolean;
  claimedAt: string | null;
  claimedPetUid: string | null;
  rewardCoins: number;
  rewardExp: number;
  minBondXp: number;
}

export interface KeeperServerState {
  user: {
    uid: string;
    email: string;
    displayName: string;
    isGuest?: boolean;
    coins: number;
    energy: number;
    maxEnergy: number;
    level: number;
    expPercent: number;
    streakDays: number;
    fenceHours: number;
    waterCharges: number;
    maxWater: number;
    luredRescued: boolean;
    activeBait: string | null;
    limits: DailyLimits;
    seedInventory: Record<CropType, number>;
    foodInventory: Record<FoodItemType, number>;
    ownedShopItems: string[];
    ownedToys: string[];
    farmPlots: CropPlot[];
    orchardTrees: OrchardTree[];
    marketListings: MarketListing[];
    neighborStates: Record<
      string,
      {
        patsUsed?: number;
        gifted?: boolean;
        waterHelpsUsed?: number;
        boughtIds?: string[];
      }
    >;
  };
  firstBondQuest: FirstBondQuestStatus;
  wallet: WalletInfo | null;
  pets: SanctuaryPet[];
  album: JudgeReport[];
  adoptionOffers: AdoptionOfferInfo[];
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
