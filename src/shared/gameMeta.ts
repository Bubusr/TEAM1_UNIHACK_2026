import type { CropType, FoodItemType } from '../types.ts';

export const FOOD_META: Record<
  FoodItemType,
  {
    icon: string;
    name: string;
    seedCost?: number;
    growMs?: number;
    sellPrice: number;
  }
> = {
  wheat: { icon: '🌾', name: 'Wheat', seedCost: 10, growMs: 8000, sellPrice: 24 },
  carrot: { icon: '🥕', name: 'Carrot', seedCost: 15, growMs: 10000, sellPrice: 36 },
  berry: { icon: '🍓', name: 'Berry', seedCost: 25, growMs: 14000, sellPrice: 55 },
  catnip: { icon: '🌿', name: 'Catnip', seedCost: 35, growMs: 18000, sellPrice: 75 },
  apple: { icon: '🍎', name: 'Apple', sellPrice: 45 },
  peach: { icon: '🍑', name: 'Peach', sellPrice: 52 },
};

export const SEED_LIST: CropType[] = ['wheat', 'carrot', 'berry', 'catnip'];

export const MINT_ELIGIBILITY_RULES = {
  MIN_SCORE: 80,
  MIN_BOND_XP: 100,
  FUJI_CHAIN_ID: 43113,
} as const;

export const FIRST_BOND_QUEST_REWARD = {
  COINS: 250,
  EXP: 60,
  MIN_BOND_XP: 100,
} as const;
