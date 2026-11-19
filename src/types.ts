export type PetSpecies = 'cat' | 'dog' | 'bunny' | 'corgi' | 'shiba' | 'samoyed';

export type CutoutMode = 'studio' | 'silhouette' | 'auto';

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
  score?: number;
  minted?: boolean;
  txHash?: string;
  tokenId?: string;
  explorerUrl?: string;
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
  txHash?: string;
  tokenId?: string;
  explorerUrl?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
  kind: 'accessory' | 'energy';
  owned?: boolean;
}
