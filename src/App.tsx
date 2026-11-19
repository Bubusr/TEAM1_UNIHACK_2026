import React, { useEffect, useState } from 'react';
import { Home, Settings, Sun, Sunset, Wallet } from 'lucide-react';
import {
  CropPlot,
  CropType,
  DailyLimits,
  FirstBondQuestState,
  FoodItemType,
  GardenToy,
  HatTransform,
  JourneyPhase,
  JudgeReport,
  MarketListing,
  MintedPassportRecord,
  NeighborGarden,
  OrchardTree,
  PetAnimState,
  PetSpecies,
  SanctuaryPet,
  ShopItem,
  WalletState,
} from './types';
import {
  SanctuaryModalType,
  SanctuaryScreen,
} from './components/SanctuaryScreen';
import { FOOD_META, FarmScreen } from './components/FarmScreen';
import { NeighborGardenScreen } from './components/NeighborGardenScreen';
import { NeighborFarmScreen } from './components/NeighborFarmScreen';
import { JudgeCardScreen } from './components/JudgeCardScreen';
import { PassportGalleryScreen } from './components/PassportGalleryScreen';
import { CreamSheets } from './components/CreamSheets';
import { WalletConnectModal } from './components/WalletConnectModal';
import { FirstBondQuestModal } from './components/FirstBondQuestModal';
import {
  PetProfileModal,
  isFavoriteFoodForSpecies,
} from './components/PetProfileModal';
import { PassportMintModal } from './components/PassportMintModal';
import { StartScreen } from './components/StartScreen';
import { AppSettingsModal } from './components/AppSettingsModal';
import { SkyTheme, SkyThemeProvider, UiLabelsProvider } from './components/SharedHud';
import {
  playCameraSound,
  playCoinSound,
  playHappySound,
  playTapSound,
  playVictorySound,
  setAudioEnabled,
} from './utils/appAudio';
import {
  authenticateWalletAddress,
  claimFirstBondQuestApi,
  computeBondLevel,
  connectCoreWallet,
  getSnowtraceTxUrl,
  isPetPassportEligible,
  shortenAddress,
  switchToAvalancheFuji,
  syncCareAction,
  syncPetCreated,
  toPetProfile,
} from './services/pawsApi';

import { PET_IMAGES, resolveAssetUrl } from './assets/petImages';

const INITIAL_PETS: SanctuaryPet[] = [
  {
    id: 'pet-calico',
    name: 'Mochi',
    species: 'cat',
    photoUrl: PET_IMAGES.croppedCalicoCat,
    cutoutMode: 'studio',
    x: 34,
    y: 50,
    needsCare: 'heart',
    score: 94,
    pose: 'Cozy',
    bondXp: 110,
    bondLevel: 3,
    discoveryDate: '2026-11-10',
    discoveryStatus: 'Passport Ready',
    passportEligible: true,
    animState: 'idle',
  },
  {
    id: 'pet-retriever',
    name: 'Sunny',
    species: 'dog',
    photoUrl: PET_IMAGES.croppedGoldenDog,
    cutoutMode: 'studio',
    x: 63,
    y: 45,
    flip: true,
    score: 91,
    pose: 'Playful',
    bondXp: 65,
    bondLevel: 2,
    discoveryDate: '2026-11-12',
    discoveryStatus: 'Welcomed',
    passportEligible: false,
    animState: 'idle',
  },
  {
    id: 'pet-bunny',
    name: 'Pip',
    species: 'bunny',
    photoUrl: PET_IMAGES.croppedFluffyBunny,
    cutoutMode: 'studio',
    x: 50,
    y: 62,
    score: 88,
    pose: 'Curious',
    bondXp: 40,
    bondLevel: 2,
    discoveryDate: '2026-11-14',
    discoveryStatus: 'Welcomed',
    passportEligible: false,
    animState: 'idle',
  },
];

const INITIAL_PASSPORTS: MintedPassportRecord[] = [
  {
    tokenId: '#001',
    petId: 'n-maya-shiba',
    petName: 'Kibo',
    species: 'shiba',
    imageUrl: PET_IMAGES.neighborShibaDog,
    bondLevel: 4,
    bondXp: 150,
    discoveryDate: '2026-11-04',
    ownerAddress: '0xA41E92c08B7F3D190C12a874f3B590e2112B4E91',
    ipfsCid: 'bafybeigkiboshibapawsfuji1passport',
    ipfsUri: 'ipfs://bafybeigkiboshibapawsfuji1passport/metadata.json',
    txHash: '0x8a1c3f9d4b20e7a158c340b91f2a7e5c8d30b41f92a7c6e1d0b54a8f12c9e301',
    snowtraceUrl: getSnowtraceTxUrl(
      '0x8a1c3f9d4b20e7a158c340b91f2a7e5c8d30b41f92a7c6e1d0b54a8f12c9e301'
    ),
    mintedAt: '2026-11-08',
    aiScore: 95,
    pose: 'Happy',
  },
  {
    tokenId: '#002',
    petId: 'n-leo-samoyed',
    petName: 'Cloud',
    species: 'samoyed',
    imageUrl: PET_IMAGES.neighborSamoyedPup,
    bondLevel: 3,
    bondXp: 125,
    discoveryDate: '2026-11-06',
    ownerAddress: '0x3B82D1f7C09E4a12B85f6C90E23D4b87A1F50C22',
    ipfsCid: 'bafybeigcloudsamoyedpawsfuji2passport',
    ipfsUri: 'ipfs://bafybeigcloudsamoyedpawsfuji2passport/metadata.json',
    txHash: '0x3d7e91b2c40f6a8d15e390c42b1a8f7d6e20c31b84f9a5d2e1c67b3f04d8a219',
    snowtraceUrl: getSnowtraceTxUrl(
      '0x3d7e91b2c40f6a8d15e390c42b1a8f7d6e20c31b84f9a5d2e1c67b3f04d8a219'
    ),
    mintedAt: '2026-11-11',
    aiScore: 93,
    pose: 'Playful',
  },
  {
    tokenId: '#003',
    petId: 'n-maya-ragdoll',
    petName: 'Pearl',
    species: 'cat',
    imageUrl: PET_IMAGES.neighborRagdollCat,
    bondLevel: 4,
    bondXp: 140,
    discoveryDate: '2026-11-09',
    ownerAddress: '0xA41E92c08B7F3D190C12a874f3B590e2112B4E91',
    ipfsCid: 'bafybeigpearlragdollpawsfuji3passport',
    ipfsUri: 'ipfs://bafybeigpearlragdollpawsfuji3passport/metadata.json',
    txHash: '0x5c2f48a1e90b3d7c62f481a30e9b7c5d2f10a48e73b6c9f2d0e41a7b85c6d402',
    snowtraceUrl: getSnowtraceTxUrl(
      '0x5c2f48a1e90b3d7c62f481a30e9b7c5d2f10a48e73b6c9f2d0e41a7b85c6d402'
    ),
    mintedAt: '2026-11-13',
    aiScore: 96,
    pose: 'Cozy',
  },
];

const INITIAL_SHOP: ShopItem[] = [
  { id: 'straw-hat', name: 'Straw Hat', cost: 0, icon: '👒', kind: 'accessory', owned: true },
  { id: 'ribbon-bow', name: 'Pink Bow', cost: 0, icon: '🎀', kind: 'accessory', owned: true },
  { id: 'sunny-cap', name: 'Sunny Cap', cost: 300, icon: '🧢', kind: 'accessory' },
  { id: 'flower-crown', name: 'Daisy Crown', cost: 350, icon: '🌸', kind: 'accessory' },
  { id: 'top-hat', name: 'Dapper Hat', cost: 450, icon: '🎩', kind: 'accessory' },
  { id: 'royal-crown', name: 'Royal Crown', cost: 550, icon: '👑', kind: 'accessory' },
  { id: 'camera-film', name: '+10 Energy', cost: 250, icon: '⚡', kind: 'energy' },
];

function mergeShopItems(saved?: ShopItem[]): ShopItem[] {
  if (!saved || !Array.isArray(saved)) return INITIAL_SHOP;
  const savedMap = new Map(saved.map((item) => [item.id, item]));
  return INITIAL_SHOP.map((base) => {
    const prev = savedMap.get(base.id);
    if (!prev) return base;
    return {
      ...base,
      owned: Boolean(base.owned || prev.owned),
    };
  });
}

const INITIAL_TOYS: GardenToy[] = [
  { id: 'toy-yarn', name: 'Yarn Ball', icon: '🧶', cost: 120, x: 76, y: 74, owned: true },
  { id: 'toy-tennis', name: 'Tennis Ball', icon: '🎾', cost: 150, x: 64, y: 76, owned: false },
  { id: 'toy-duck', name: 'Plush Duck', icon: '🧸', cost: 220, x: 84, y: 64, owned: false },
];

const INITIAL_PLOTS: CropPlot[] = [
  { id: 'plot-1', crop: 'carrot', plantedAt: Date.now() - 8000, durationMs: 10000 },
  { id: 'plot-2', crop: 'wheat', plantedAt: Date.now() - 5000, durationMs: 8000 },
  { id: 'plot-3', crop: null, plantedAt: null, durationMs: 10000 },
  { id: 'plot-4', crop: null, plantedAt: null, durationMs: 10000 },
  { id: 'plot-5', crop: null, plantedAt: null, durationMs: 10000 },
  { id: 'plot-6', crop: null, plantedAt: null, durationMs: 10000 },
];

const INITIAL_TREES: OrchardTree[] = [
  { id: 'tree-apple', fruit: 'apple', readyAt: Date.now() - 1000, durationMs: 16000 },
  { id: 'tree-peach', fruit: 'peach', readyAt: Date.now() + 9000, durationMs: 20000 },
];

const INITIAL_NEIGHBORS: NeighborGarden[] = [
  {
    id: 'neighbor-maya',
    ownerName: 'Maya',
    gardenName: 'Peach Meadow',
    themeTint: 'peach',
    streakDays: 12,
    patsUsed: 0,
    maxPats: 3,
    wateredCrop: false,
    gifted: false,
    waterHelpsUsed: 0,
    maxWaterHelps: 3,
    farmPlots: [
      { id: 'maya-p1', crop: 'berry', plantedAt: Date.now() - 4000, durationMs: 26000, watered: false },
      { id: 'maya-p2', crop: 'carrot', plantedAt: Date.now() - 5000, durationMs: 22000, watered: false },
      { id: 'maya-p3', crop: 'wheat', plantedAt: Date.now() - 9000, durationMs: 9000, watered: true },
      { id: 'maya-p4', crop: 'berry', plantedAt: Date.now() - 3000, durationMs: 28000, watered: false },
      { id: 'maya-p5', crop: 'carrot', plantedAt: Date.now() - 12000, durationMs: 12000, watered: true },
      { id: 'maya-p6', crop: null, plantedAt: null, durationMs: 10000 },
    ],
    farmTrees: [
      { id: 'maya-t1', fruit: 'peach', readyAt: Date.now() + 24000, durationMs: 26000, watered: false },
      { id: 'maya-t2', fruit: 'apple', readyAt: Date.now() - 1000, durationMs: 18000, watered: true },
    ],
    marketStock: [
      { id: 'm-1', item: 'peach', qty: 2, price: 60 },
      { id: 'm-2', item: 'berry', qty: 2, price: 70 },
      { id: 'm-3', item: 'carrot', qty: 3, price: 65 },
    ],
    toys: [
      { id: 'n-toy-1', name: 'Tennis Ball', icon: '🎾', cost: 150, x: 74, y: 74, owned: true },
    ],
    pets: [
      {
        id: 'n-maya-shiba',
        name: 'Kibo',
        species: 'shiba',
        photoUrl: PET_IMAGES.neighborShibaDog,
        cutoutMode: 'studio',
        x: 38,
        y: 52,
        needsCare: 'heart',
        bondXp: 150,
        bondLevel: 4,
        discoveryDate: '2026-11-04',
        discoveryStatus: 'Preserved On-Chain',
        passportEligible: true,
        passportTokenId: '#001',
        minted: true,
      },
      {
        id: 'n-maya-ragdoll',
        name: 'Pearl',
        species: 'cat',
        photoUrl: PET_IMAGES.neighborRagdollCat,
        cutoutMode: 'studio',
        x: 64,
        y: 55,
        flip: true,
        bondXp: 140,
        bondLevel: 4,
        discoveryDate: '2026-11-09',
        discoveryStatus: 'Preserved On-Chain',
        passportEligible: true,
        passportTokenId: '#003',
        minted: true,
      },
    ],
  },
  {
    id: 'neighbor-leo',
    ownerName: 'Leo',
    gardenName: 'Sky Yard',
    themeTint: 'sky',
    streakDays: 9,
    patsUsed: 0,
    maxPats: 3,
    wateredCrop: false,
    gifted: false,
    waterHelpsUsed: 0,
    maxWaterHelps: 3,
    farmPlots: [
      { id: 'leo-p1', crop: 'wheat', plantedAt: Date.now() - 3000, durationMs: 20000, watered: false },
      { id: 'leo-p2', crop: 'carrot', plantedAt: Date.now() - 6000, durationMs: 24000, watered: false },
      { id: 'leo-p3', crop: 'wheat', plantedAt: Date.now() - 10000, durationMs: 10000, watered: true },
      { id: 'leo-p4', crop: 'catnip', plantedAt: Date.now() - 2000, durationMs: 30000, watered: false },
      { id: 'leo-p5', crop: null, plantedAt: null, durationMs: 10000 },
      { id: 'leo-p6', crop: null, plantedAt: null, durationMs: 10000 },
    ],
    farmTrees: [
      { id: 'leo-t1', fruit: 'apple', readyAt: Date.now() + 22000, durationMs: 24000, watered: false },
      { id: 'leo-t2', fruit: 'peach', readyAt: Date.now() - 1000, durationMs: 20000, watered: true },
    ],
    marketStock: [
      { id: 'l-1', item: 'apple', qty: 2, price: 55 },
      { id: 'l-2', item: 'wheat', qty: 4, price: 50 },
    ],
    toys: [
      { id: 'n-toy-2', name: 'Plush Duck', icon: '🧸', cost: 220, x: 72, y: 73, owned: true },
    ],
    pets: [
      {
        id: 'n-leo-samoyed',
        name: 'Cloud',
        species: 'samoyed',
        photoUrl: PET_IMAGES.neighborSamoyedPup,
        cutoutMode: 'studio',
        x: 42,
        y: 54,
        needsCare: 'food',
        bondXp: 125,
        bondLevel: 3,
        discoveryDate: '2026-11-06',
        discoveryStatus: 'Preserved On-Chain',
        passportEligible: true,
        passportTokenId: '#002',
        minted: true,
      },
      {
        id: 'n-leo-corgi',
        name: 'Toast',
        species: 'corgi',
        photoUrl: PET_IMAGES.luredStrayCorgi,
        cutoutMode: 'silhouette',
        x: 66,
        y: 49,
        bondXp: 70,
        bondLevel: 2,
        discoveryDate: '2026-11-11',
        discoveryStatus: 'Welcomed',
        passportEligible: false,
      },
    ],
  },
  {
    id: 'neighbor-hana',
    ownerName: 'Hana',
    gardenName: 'Clover Patch',
    themeTint: 'lavender',
    streakDays: 19,
    patsUsed: 0,
    maxPats: 3,
    wateredCrop: false,
    gifted: false,
    waterHelpsUsed: 0,
    maxWaterHelps: 3,
    farmPlots: [
      { id: 'hana-p1', crop: 'catnip', plantedAt: Date.now() - 4000, durationMs: 28000, watered: false },
      { id: 'hana-p2', crop: 'berry', plantedAt: Date.now() - 5000, durationMs: 25000, watered: false },
      { id: 'hana-p3', crop: 'berry', plantedAt: Date.now() - 15000, durationMs: 14000, watered: true },
      { id: 'hana-p4', crop: 'carrot', plantedAt: Date.now() - 3000, durationMs: 22000, watered: false },
      { id: 'hana-p5', crop: 'wheat', plantedAt: Date.now() - 9000, durationMs: 8000, watered: true },
      { id: 'hana-p6', crop: null, plantedAt: null, durationMs: 10000 },
    ],
    farmTrees: [
      { id: 'hana-t1', fruit: 'peach', readyAt: Date.now() + 26000, durationMs: 28000, watered: false },
      { id: 'hana-t2', fruit: 'apple', readyAt: Date.now() + 18000, durationMs: 22000, watered: false },
    ],
    marketStock: [
      { id: 'h-1', item: 'catnip', qty: 1, price: 65 },
      { id: 'h-2', item: 'berry', qty: 3, price: 95 },
    ],
    toys: [
      { id: 'n-toy-3', name: 'Yarn Ball', icon: '🧶', cost: 120, x: 76, y: 72, owned: true },
    ],
    pets: [
      {
        id: 'n-hana-cat',
        name: 'Miso',
        species: 'cat',
        photoUrl: PET_IMAGES.neighborRagdollCat,
        cutoutMode: 'studio',
        x: 36,
        y: 55,
        bondXp: 80,
        bondLevel: 3,
        discoveryDate: '2026-11-10',
        discoveryStatus: 'Welcomed',
        passportEligible: false,
      },
      {
        id: 'n-hana-bunny',
        name: 'Snow',
        species: 'bunny',
        photoUrl: PET_IMAGES.croppedFluffyBunny,
        cutoutMode: 'studio',
        x: 62,
        y: 56,
        flip: true,
        bondXp: 55,
        bondLevel: 2,
        discoveryDate: '2026-11-12',
        discoveryStatus: 'Welcomed',
        passportEligible: false,
      },
    ],
  },
];

const SAMPLE_PUPPY_REPORT: JudgeReport = {
  id: 'report-golden-puppy',
  photoUrl: PET_IMAGES.polaroidGoldenPuppy,
  theme: 'Fluffy Tails',
  overallScore: 92,
  verdict: 'EXCELLENT!',
  tierLabel: '80+ Tier',
  sharp: 95,
  light: 90,
  species: 'Dog',
  pose: 'Playful',
  themeScore: 94,
  themeMatch: true,
  petName: 'Buttercup',
  coinsReward: 150,
  expReward: 50,
  cropped: false,
  minted: false,
};

function mapSpecies(speciesText: string): PetSpecies {
  const s = speciesText.toLowerCase();
  if (s.includes('cat') || s.includes('kitten')) return 'cat';
  if (s.includes('bun') || s.includes('rabbit')) return 'bunny';
  if (s.includes('corgi')) return 'corgi';
  if (s.includes('shiba')) return 'shiba';
  if (s.includes('samoyed')) return 'samoyed';
  return 'dog';
}

const BUYER_NAMES = ['Maya', 'Leo', 'Hana'];

type ScreenView =
  | 'sanctuary'
  | 'farm'
  | 'neighborGarden'
  | 'neighborFarm'
  | 'judge'
  | 'gallery';

const SAVE_STORAGE_KEY = 'paws_and_picket_save_v1';

interface SavedAppState {
  keeperName?: string;
  soundEnabled?: boolean;
  showTextLabels?: boolean;
  skyTheme?: SkyTheme;
  coins?: number;
  energy?: number;
  level?: number;
  expPercent?: number;
  fenceHours?: number;
  pets?: SanctuaryPet[];
  shopItems?: ShopItem[];
  toys?: GardenToy[];
  waterCharges?: number;
  cropPlots?: CropPlot[];
  trees?: OrchardTree[];
  seedInventory?: Record<CropType, number>;
  foodInventory?: Record<FoodItemType, number>;
  marketListings?: MarketListing[];
  limits?: DailyLimits;
  neighbors?: NeighborGarden[];
  luredRescued?: boolean;
  activeBait?: string | null;
  album?: JudgeReport[];
  passports?: MintedPassportRecord[];
  firstBondQuest?: FirstBondQuestState;
}

function loadSavedState(): SavedAppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as SavedAppState) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [initialSave] = useState<SavedAppState | null>(() => loadSavedState());
  const [appPhase, setAppPhase] = useState<'start' | 'playing'>('start');
  const [activeScreen, setActiveScreen] = useState<ScreenView>('sanctuary');
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(() =>
    Boolean(initialSave)
  );

  const [keeperName, setKeeperName] = useState<string>(
    initialSave?.keeperName || 'Keeper'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    initialSave?.soundEnabled ?? true
  );
  const [showTextLabels, setShowTextLabels] = useState<boolean>(
    initialSave?.showTextLabels ?? false
  );
  const [skyTheme, setSkyTheme] = useState<SkyTheme>(
    initialSave?.skyTheme === 'sunset' ? 'sunset' : 'morning'
  );

  const [coins, setCoins] = useState(initialSave?.coins ?? 12560);
  const [energy, setEnergy] = useState(initialSave?.energy ?? 45);
  const maxEnergy = 50;
  const [level, setLevel] = useState(initialSave?.level ?? 12);
  const [expPercent, setExpPercent] = useState(initialSave?.expPercent ?? 64);
  const [streakDays] = useState(7);
  const [fenceHours, setFenceHours] = useState(initialSave?.fenceHours ?? 14);
  const [theme] = useState('Fluffy Tails');

  const [pets, setPets] = useState<SanctuaryPet[]>(() =>
    (initialSave?.pets ?? INITIAL_PETS).map((p) => ({
      ...p,
      photoUrl: resolveAssetUrl(p.photoUrl),
    }))
  );
  const [shopItems, setShopItems] = useState<ShopItem[]>(() =>
    mergeShopItems(initialSave?.shopItems)
  );
  const [toys, setToys] = useState<GardenToy[]>(
    initialSave?.toys ?? INITIAL_TOYS
  );

  // Crop Farm State
  const [waterCharges, setWaterCharges] = useState(
    initialSave?.waterCharges ?? 8
  );
  const maxWater = 8;
  const [cropPlots, setCropPlots] = useState<CropPlot[]>(
    initialSave?.cropPlots ?? INITIAL_PLOTS
  );
  const [trees, setTrees] = useState<OrchardTree[]>(
    initialSave?.trees ?? INITIAL_TREES
  );
  const [seedInventory, setSeedInventory] = useState<Record<CropType, number>>(
    initialSave?.seedInventory ?? {
      wheat: 3,
      carrot: 2,
      berry: 1,
      catnip: 0,
    }
  );
  const [foodInventory, setFoodInventory] = useState<
    Record<FoodItemType, number>
  >(
    initialSave?.foodInventory ?? {
      wheat: 0,
      carrot: 1,
      berry: 0,
      catnip: 0,
      apple: 0,
      peach: 0,
    }
  );
  const [marketListings, setMarketListings] = useState<MarketListing[]>(
    initialSave?.marketListings ?? [
      { id: 'init-sale', item: 'carrot', qty: 1, price: 36, sold: true, buyerName: 'Maya' },
    ]
  );

  // Daily Currency Limits
  const [limits, setLimits] = useState<DailyLimits>(
    initialSave?.limits ?? {
      petCoinsUsed: 2,
      petCoinsMax: 10,
      playCoinsUsed: 0,
      playCoinsMax: 5,
      feedCoinsUsed: 0,
      feedCoinsMax: 6,
      cloverCoinsUsed: 0,
      cloverCoinsMax: 5,
    }
  );

  const [neighbors, setNeighbors] = useState<NeighborGarden[]>(() =>
    (initialSave?.neighbors ?? INITIAL_NEIGHBORS).map((n) => ({
      ...n,
      pets: n.pets.map((p) => ({ ...p, photoUrl: resolveAssetUrl(p.photoUrl) })),
    }))
  );
  const [visitingId, setVisitingId] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<SanctuaryModalType>(null);
  const [modalTarget, setModalTarget] = useState<ScreenView>('sanctuary');
  const [luredRescued, setLuredRescued] = useState(
    initialSave?.luredRescued ?? false
  );
  const [activeBait, setActiveBait] = useState<string | null>(
    initialSave?.activeBait ?? null
  );

  const [activeReport, setActiveReport] = useState<JudgeReport>(SAMPLE_PUPPY_REPORT);
  const [album, setAlbum] = useState<JudgeReport[]>(() =>
    (initialSave?.album ?? [SAMPLE_PUPPY_REPORT]).map((r) => ({
      ...r,
      photoUrl: resolveAssetUrl(r.photoUrl),
    }))
  );
  const [isJudging, setIsJudging] = useState(false);
  const [judgeError, setJudgeError] = useState<string | null>(null);

  // Member 01: Pet Journey, First Bond Quest, Core Wallet & Public Passport Gallery State
  const [firstBondQuest, setFirstBondQuest] = useState<FirstBondQuestState>(
    initialSave?.firstBondQuest ?? {
      welcomeDone: false,
      feedDone: false,
      playDone: false,
      claimed: false,
      rewardXp: 100,
    }
  );

  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    isAvalancheFuji: false,
    providerLabel: null,
    authVerified: false,
    connecting: false,
    error: null,
  });

  const [passports, setPassports] = useState<MintedPassportRecord[]>(() =>
    (initialSave?.passports ?? INITIAL_PASSPORTS).map((p) => ({
      ...p,
      imageUrl: resolveAssetUrl(p.imageUrl),
    }))
  );
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [mintModalPetId, setMintModalPetId] = useState<string | null>(null);
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState<{
    open: boolean;
    tab: 'settings' | 'guide';
  }>({ open: false, tab: 'settings' });
  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    mode: 'welcome' | 'profile';
    petId: string | null;
  }>({ open: false, mode: 'profile', petId: null });

  const visitingNeighbor =
    neighbors.find((n) => n.id === visitingId) ?? null;

  useEffect(() => {
    setAudioEnabled(soundEnabled);
  }, [soundEnabled]);

  // Persist Sanctuary progress automatically
  useEffect(() => {
    if (!hasSavedSession && appPhase === 'start') return;
    try {
      const snapshot: SavedAppState = {
        keeperName,
        soundEnabled,
        showTextLabels,
        coins,
        energy,
        level,
        expPercent,
        fenceHours,
        pets,
        shopItems,
        toys,
        waterCharges,
        cropPlots,
        trees,
        seedInventory,
        foodInventory,
        marketListings,
        limits,
        neighbors,
        luredRescued,
        activeBait,
        album,
        passports,
        firstBondQuest,
        skyTheme,
      };
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore quota errors in restricted frames
    }
  }, [
    hasSavedSession,
    appPhase,
    keeperName,
    soundEnabled,
    showTextLabels,
    skyTheme,
    coins,
    energy,
    level,
    expPercent,
    fenceHours,
    pets,
    shopItems,
    toys,
    waterCharges,
    cropPlots,
    trees,
    seedInventory,
    foodInventory,
    marketListings,
    limits,
    neighbors,
    luredRescued,
    activeBait,
    album,
    passports,
    firstBondQuest,
  ]);

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      setAudioEnabled(next);
      if (next) playTapSound();
      return next;
    });
  };

  const handleToggleShowTextLabels = () => {
    playTapSound();
    setShowTextLabels((prev) => !prev);
  };

  const handleToggleSkyTheme = () => {
    playTapSound();
    setSkyTheme((prev) => (prev === 'morning' ? 'sunset' : 'morning'));
  };

  const handleResetSave = () => {
    try {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setHasSavedSession(false);
    setKeeperName('Keeper');
    setCoins(12560);
    setEnergy(45);
    setLevel(12);
    setExpPercent(64);
    setFenceHours(14);
    setPets(INITIAL_PETS);
    setShopItems(INITIAL_SHOP);
    setToys(INITIAL_TOYS);
    setWaterCharges(8);
    setCropPlots(INITIAL_PLOTS);
    setTrees(INITIAL_TREES);
    setSeedInventory({ wheat: 3, carrot: 2, berry: 1, catnip: 0 });
    setFoodInventory({ wheat: 0, carrot: 1, berry: 0, catnip: 0, apple: 0, peach: 0 });
    setMarketListings([
      { id: 'init-sale', item: 'carrot', qty: 1, price: 36, sold: true, buyerName: 'Maya' },
    ]);
    setLimits({
      petCoinsUsed: 2,
      petCoinsMax: 10,
      playCoinsUsed: 0,
      playCoinsMax: 5,
      feedCoinsUsed: 0,
      feedCoinsMax: 6,
      cloverCoinsUsed: 0,
      cloverCoinsMax: 5,
    });
    setNeighbors(INITIAL_NEIGHBORS);
    setVisitingId(null);
    setLuredRescued(false);
    setActiveBait(null);
    setActiveReport(SAMPLE_PUPPY_REPORT);
    setAlbum([SAMPLE_PUPPY_REPORT]);
    setPassports(INITIAL_PASSPORTS);
    setFirstBondQuest({
      welcomeDone: false,
      feedDone: false,
      playDone: false,
      claimed: false,
      rewardXp: 100,
    });
    setActiveModal(null);
    setActiveScreen('sanctuary');
    setAppPhase('start');
  };

  const openModalIn = (target: ScreenView, modal: SanctuaryModalType) => {
    playTapSound();
    setModalTarget(target);
    setActiveModal(modal);
  };

  // Visiting neighbors periodically purchase unsold items in your Roadside Market
  useEffect(() => {
    const nextUnsold = marketListings.find((l) => !l.sold);
    if (!nextUnsold) return;

    const baseTotal = FOOD_META[nextUnsold.item].sellPrice * nextUnsold.qty;
    const delayMs = nextUnsold.price <= baseTotal * 1.15 ? 4200 : 8500;

    const timer = window.setTimeout(() => {
      setMarketListings((prev) => {
        let purchasedOne = false;
        return prev.map((listing) => {
          if (!purchasedOne && !listing.sold) {
            purchasedOne = true;
            const buyer =
              BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];
            return { ...listing, sold: true, buyerName: buyer };
          }
          return listing;
        });
      });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [marketListings]);

  const readyFarmCount =
    cropPlots.filter((p) => {
      if (!p.crop || !p.plantedAt) return false;
      const eff = p.watered ? p.durationMs * 0.55 : p.durationMs;
      return Date.now() - p.plantedAt >= eff;
    }).length + trees.filter((t) => Date.now() >= t.readyAt).length;

  const awardExp = (gain: number) => {
    setExpPercent((prev) => {
      const next = prev + gain;
      if (next >= 100) {
        setLevel((lv) => lv + 1);
        return next - 100;
      }
      return next;
    });
  };

  const applyPetBondGain = (
    petId: string,
    xpGain: number,
    anim: PetAnimState = 'happy'
  ) => {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id !== petId) return p;
        const nextXp = p.bondXp + xpGain;
        const nextLv = computeBondLevel(nextXp);
        const eligible = isPetPassportEligible(nextXp);
        return {
          ...p,
          bondXp: nextXp,
          bondLevel: nextLv,
          passportEligible: eligible,
          discoveryStatus: p.minted
            ? 'Preserved On-Chain'
            : eligible
            ? 'Passport Ready'
            : p.discoveryStatus,
          needsCare: null,
          animState: anim,
        };
      })
    );

    window.setTimeout(() => {
      setPets((prev) =>
        prev.map((p) => (p.id === petId ? { ...p, animState: 'idle' } : p))
      );
    }, 1700);
  };

  // Petting with daily coin cap + Bond XP
  const handleCarePet = (petId: string): string => {
    playHappySound();
    applyPetBondGain(petId, 10, 'happy');
    void syncCareAction(petId, 'pet', 10);

    if (limits.petCoinsUsed >= limits.petCoinsMax) {
      return '❤️ +10 XP';
    }

    setLimits((prev) => ({ ...prev, petCoinsUsed: prev.petCoinsUsed + 1 }));
    setCoins((c) => c + 15);
    awardExp(6);
    return '+15 🪙 · +10 XP';
  };

  // Feeding harvested crops/fruits with species-favorite bonus + daily coin cap
  const handleFeedPet = (food: FoodItemType, targetPetId?: string): string => {
    if (foodInventory[food] <= 0) return 'No food';
    playHappySound();

    const recipientPet =
      pets.find((p) => p.id === targetPetId) ?? pets[0];
    setFoodInventory((prev) => ({ ...prev, [food]: prev[food] - 1 }));

    const isFav = recipientPet
      ? isFavoriteFoodForSpecies(recipientPet.species, food)
      : false;
    const bondGain = isFav ? 20 : 15;

    if (recipientPet) {
      applyPetBondGain(recipientPet.id, bondGain, 'eating');
      void syncCareAction(recipientPet.id, 'feed', bondGain);
    }

    setFirstBondQuest((q) => (q.feedDone ? q : { ...q, feedDone: true }));

    if (limits.feedCoinsUsed >= limits.feedCoinsMax) {
      awardExp(10);
      return `${FOOD_META[food].icon} +${bondGain} XP${isFav ? ' ⭐' : ''}`;
    }

    setLimits((prev) => ({
      ...prev,
      feedCoinsUsed: prev.feedCoinsUsed + 1,
    }));
    setCoins((c) => c + 25);
    awardExp(12);
    return `${FOOD_META[food].icon} +25 🪙 · +${bondGain} XP${isFav ? ' ⭐' : ''}`;
  };

  const handlePlayToy = (toy: GardenToy, targetPetId?: string): string => {
    playHappySound();
    const recipientPet =
      pets.find((p) => p.id === targetPetId) ?? pets[0];
    if (recipientPet) {
      applyPetBondGain(recipientPet.id, 15, 'playing');
      void syncCareAction(recipientPet.id, 'play', 15);
    }

    setFirstBondQuest((q) => (q.playDone ? q : { ...q, playDone: true }));

    if (limits.playCoinsUsed >= limits.playCoinsMax) {
      return `${toy.icon} +15 XP`;
    }
    setLimits((prev) => ({
      ...prev,
      playCoinsUsed: prev.playCoinsUsed + 1,
    }));
    setCoins((c) => c + 20);
    awardExp(8);
    return `${toy.icon} +20 🪙 · +15 XP`;
  };

  const handleProfileCareAction = (
    petId: string,
    action: 'pet' | 'feed' | 'play'
  ): string => {
    if (action === 'pet') {
      return handleCarePet(petId);
    }
    if (action === 'feed') {
      const firstFood = (Object.keys(foodInventory) as FoodItemType[]).find(
        (k) => foodInventory[k] > 0
      );
      if (firstFood) {
        return handleFeedPet(firstFood, petId);
      }
      // Always allow gentle kibble care from Pet Profile so Quest/Bond test never deadlocks
      applyPetBondGain(petId, 15, 'eating');
      void syncCareAction(petId, 'feed', 15);
      setFirstBondQuest((q) => (q.feedDone ? q : { ...q, feedDone: true }));
      return '🥣 +15 XP';
    }
    const ownedToy = toys.find((t) => t.owned) ?? toys[0];
    return handlePlayToy(ownedToy, petId);
  };

  const handleTapClover = (): string => {
    if (limits.cloverCoinsUsed >= limits.cloverCoinsMax) {
      return '🦋 Maxed';
    }
    setLimits((prev) => ({
      ...prev,
      cloverCoinsUsed: prev.cloverCoinsUsed + 1,
    }));
    setCoins((c) => c + 10);
    return '🦋 +10 🪙';
  };

  // Crop Farm Handlers
  const handleRefillWater = (): string => {
    setWaterCharges(maxWater);
    return '💧 Full!';
  };

  const handleBuySeed = (crop: CropType): string => {
    const cost = FOOD_META[crop].seedCost ?? 15;
    if (coins < cost) return 'Need Coins';
    setCoins((c) => c - cost);
    setSeedInventory((prev) => ({ ...prev, [crop]: prev[crop] + 1 }));
    return `+1 ${FOOD_META[crop].icon} Seed`;
  };

  const handleTapPlot = (
    plotId: string,
    activeSeed: CropType | null
  ): string | void => {
    const plot = cropPlots.find((p) => p.id === plotId);
    if (!plot) return;

    if (!plot.crop) {
      if (!activeSeed) return;
      if (seedInventory[activeSeed] <= 0) {
        const cost = FOOD_META[activeSeed].seedCost ?? 15;
        if (coins < cost) return 'Need Coins';
        setCoins((c) => c - cost);
      } else {
        setSeedInventory((prev) => ({
          ...prev,
          [activeSeed]: prev[activeSeed] - 1,
        }));
      }

      setCropPlots((prev) =>
        prev.map((p) =>
          p.id === plotId
            ? {
                ...p,
                crop: activeSeed,
                plantedAt: Date.now(),
                durationMs: FOOD_META[activeSeed].growMs ?? 10000,
                watered: false,
              }
            : p
        )
      );
      return `Planted ${FOOD_META[activeSeed].icon}`;
    }

    const effectiveMs = plot.watered
      ? plot.durationMs * 0.55
      : plot.durationMs;
    const elapsed = plot.plantedAt ? Date.now() - plot.plantedAt : 0;

    if (elapsed >= effectiveMs) {
      const harvestedCrop = plot.crop;
      setFoodInventory((prev) => ({
        ...prev,
        [harvestedCrop]: prev[harvestedCrop] + 1,
      }));
      setCropPlots((prev) =>
        prev.map((p) =>
          p.id === plotId
            ? { ...p, crop: null, plantedAt: null, watered: false }
            : p
        )
      );
      awardExp(8);
      return `+1 ${FOOD_META[harvestedCrop].icon}`;
    }

    if (!plot.watered) {
      if (waterCharges <= 0) return 'Tap Well 💧';
      setWaterCharges((w) => w - 1);
      setCropPlots((prev) =>
        prev.map((p) => (p.id === plotId ? { ...p, watered: true } : p))
      );
      return '💧 Watered!';
    }

    return '🌱 Growing...';
  };

  const handleTapTree = (treeId: string): string => {
    const tree = trees.find((t) => t.id === treeId);
    if (!tree) return '';

    if (Date.now() >= tree.readyAt) {
      setFoodInventory((prev) => ({
        ...prev,
        [tree.fruit]: prev[tree.fruit] + 2,
      }));
      setTrees((prev) =>
        prev.map((t) =>
          t.id === treeId
            ? { ...t, readyAt: Date.now() + t.durationMs, watered: false }
            : t
        )
      );
      awardExp(10);
      return `+2 ${FOOD_META[tree.fruit].icon}`;
    }

    if (!tree.watered && waterCharges > 0) {
      setWaterCharges((w) => w - 1);
      setTrees((prev) =>
        prev.map((t) =>
          t.id === treeId
            ? {
                ...t,
                watered: true,
                readyAt: Date.now() + Math.max(2000, (t.readyAt - Date.now()) * 0.5),
              }
            : t
        )
      );
      return '💧 Faster!';
    }

    return '🌳 Growing...';
  };

  const handleListOnMarket = (
    item: FoodItemType,
    qty: number,
    price: number
  ): string => {
    const safeQty = Math.max(1, Math.min(foodInventory[item], qty));
    if (foodInventory[item] < safeQty || safeQty <= 0) return 'Not enough';
    if (marketListings.length >= 6) return 'Stall Full';

    setFoodInventory((prev) => ({ ...prev, [item]: prev[item] - safeQty }));
    setMarketListings((prev) => [
      ...prev,
      {
        id: `sale-${Date.now()}-${Math.random()}`,
        item,
        qty: safeQty,
        price: Math.max(1, Math.round(price)),
        sold: false,
      },
    ]);
    return `Listed ${FOOD_META[item].icon}x${safeQty}`;
  };

  const handleCancelMarketListing = (listingId: string): string => {
    const target = marketListings.find((l) => l.id === listingId);
    if (!target || target.sold) return '';
    setFoodInventory((prev) => ({
      ...prev,
      [target.item]: prev[target.item] + target.qty,
    }));
    setMarketListings((prev) => prev.filter((l) => l.id !== listingId));
    return `Returned ${FOOD_META[target.item].icon}x${target.qty}`;
  };

  const handleCollectMarketSale = (listingId: string): string => {
    const target = marketListings.find((l) => l.id === listingId);
    if (!target || !target.sold) return '';
    playCoinSound();
    setCoins((c) => c + target.price);
    setMarketListings((prev) => prev.filter((l) => l.id !== listingId));
    return `+${target.price} 🪙`;
  };

  const handleBuyToy = (toy: GardenToy) => {
    if (toy.owned || coins < toy.cost) return;
    setCoins((c) => c - toy.cost);
    setToys((prev) =>
      prev.map((t) => (t.id === toy.id ? { ...t, owned: true } : t))
    );
  };

  const handleBuyItem = (item: ShopItem) => {
    if (coins < item.cost) return;
    playCoinSound();
    setCoins((c) => c - item.cost);
    if (item.kind === 'energy') {
      setEnergy((e) => Math.min(maxEnergy, e + 10));
      return;
    }
    setShopItems((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, owned: true } : s))
    );
    setPets((prev) => {
      let equipped = false;
      return prev.map((p) => {
        if (!equipped && !p.accessory) {
          equipped = true;
          return { ...p, accessory: item.id };
        }
        return p;
      });
    });
  };

  const handleEquipAccessory = (petId: string, accessoryId: string | null) => {
    playTapSound();
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId
          ? { ...p, accessory: accessoryId, animState: accessoryId ? 'happy' : 'idle' }
          : p
      )
    );
    if (accessoryId) {
      window.setTimeout(() => {
        setPets((prev) =>
          prev.map((p) => (p.id === petId ? { ...p, animState: 'idle' } : p))
        );
      }, 1100);
    }
  };

  const handleBuyAndEquipHat = (petId: string, item: ShopItem): boolean => {
    if (item.kind !== 'accessory') return false;
    if (item.owned) {
      handleEquipAccessory(petId, item.id);
      return true;
    }
    if (coins < item.cost) return false;
    playCoinSound();
    setCoins((c) => c - item.cost);
    setShopItems((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, owned: true } : s))
    );
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId ? { ...p, accessory: item.id, animState: 'happy' } : p
      )
    );
    window.setTimeout(() => {
      setPets((prev) =>
        prev.map((p) => (p.id === petId ? { ...p, animState: 'idle' } : p))
      );
    }, 1200);
    return true;
  };

  const handleUpdateHatTransform = (petId: string, next: HatTransform) => {
    setPets((prev) =>
      prev.map((p) => (p.id === petId ? { ...p, hatTransform: next } : p))
    );
  };

  // Neighbor Visit Handlers
  const handleNeighborPat = (petId: string): string => {
    if (!visitingNeighbor) return '';
    if (visitingNeighbor.patsUsed >= visitingNeighbor.maxPats) {
      return '❤️ Maxed';
    }
    setNeighbors((prev) =>
      prev.map((n) =>
        n.id === visitingNeighbor.id
          ? {
              ...n,
              patsUsed: n.patsUsed + 1,
              pets: n.pets.map((p) =>
                p.id === petId ? { ...p, needsCare: null } : p
              ),
            }
          : n
      )
    );
    setCoins((c) => c + 15);
    awardExp(5);
    return '+15 🪙';
  };

  const handleGiftNeighborById = (neighborId: string): string => {
    const target = neighbors.find((n) => n.id === neighborId);
    if (!target) return '';
    if (target.gifted) return '🎁 Sent';
    setNeighbors((prev) =>
      prev.map((n) => (n.id === neighborId ? { ...n, gifted: true } : n))
    );
    setCoins((c) => c + 25);
    awardExp(10);
    return '🎁 +25 🪙';
  };

  const handleNeighborGift = (): string => {
    if (!visitingNeighbor) return '';
    return handleGiftNeighborById(visitingNeighbor.id);
  };

  const handleWaterNeighborPlot = (
    neighborId: string,
    plotId: string
  ): string => {
    const neighbor = neighbors.find((n) => n.id === neighborId);
    const plot = neighbor?.farmPlots.find((p) => p.id === plotId);
    if (!neighbor || !plot) return '';
    if (!plot.crop) return 'Empty';
    const eff = plot.watered ? plot.durationMs * 0.55 : plot.durationMs;
    const elapsed = plot.plantedAt ? Date.now() - plot.plantedAt : 0;
    if (elapsed >= eff) return 'Ready!';
    if (plot.watered) return '💧 Watered';
    if (neighbor.waterHelpsUsed >= neighbor.maxWaterHelps) {
      return '💧 Daily Max';
    }

    setNeighbors((prev) =>
      prev.map((n) =>
        n.id === neighborId
          ? {
              ...n,
              waterHelpsUsed: n.waterHelpsUsed + 1,
              farmPlots: n.farmPlots.map((p) =>
                p.id === plotId ? { ...p, watered: true } : p
              ),
            }
          : n
      )
    );
    setCoins((c) => c + 15);
    awardExp(8);
    return '💧 +15 🪙';
  };

  const handleWaterNeighborTree = (
    neighborId: string,
    treeId: string
  ): string => {
    const neighbor = neighbors.find((n) => n.id === neighborId);
    const tree = neighbor?.farmTrees.find((t) => t.id === treeId);
    if (!neighbor || !tree) return '';
    if (Date.now() >= tree.readyAt) return `${FOOD_META[tree.fruit].icon} Ready!`;
    if (tree.watered) return '💧 Watered';
    if (neighbor.waterHelpsUsed >= neighbor.maxWaterHelps) {
      return '💧 Daily Max';
    }

    setNeighbors((prev) =>
      prev.map((n) =>
        n.id === neighborId
          ? {
              ...n,
              waterHelpsUsed: n.waterHelpsUsed + 1,
              farmTrees: n.farmTrees.map((t) =>
                t.id === treeId
                  ? {
                      ...t,
                      watered: true,
                      readyAt:
                        Date.now() +
                        Math.max(2000, (t.readyAt - Date.now()) * 0.5),
                    }
                  : t
              ),
            }
          : n
      )
    );
    setCoins((c) => c + 15);
    awardExp(8);
    return '💧 +15 🪙';
  };

  const handleBuyFromNeighborMarket = (
    neighborId: string,
    listingId: string
  ) => {
    const neighbor = neighbors.find((n) => n.id === neighborId);
    const listing = neighbor?.marketStock.find((m) => m.id === listingId);
    if (!listing || listing.sold || coins < listing.price) return;

    setCoins((c) => c - listing.price);
    setFoodInventory((prev) => ({
      ...prev,
      [listing.item]: prev[listing.item] + listing.qty,
    }));
    setNeighbors((prev) =>
      prev.map((n) =>
        n.id === neighborId
          ? {
              ...n,
              marketStock: n.marketStock.map((m) =>
                m.id === listingId ? { ...m, sold: true } : m
              ),
            }
          : n
      )
    );
  };

  const switchScreen = (screen: ScreenView) => {
    playTapSound();
    setActiveModal(null);
    setHasSavedSession(true);
    setAppPhase('playing');
    setActiveScreen(screen);
  };

  const openFarmScreen = () => switchScreen('farm');
  const openSanctuaryScreen = () => switchScreen('sanctuary');
  const openNeighborGardenScreen = () => switchScreen('neighborGarden');
  const openGalleryScreen = () => switchScreen('gallery');

  const openNeighborFarmScreen = () => {
    if (!visitingNeighbor) return;
    switchScreen('neighborFarm');
  };

  const handleVisitNeighbor = (neighborId: string) => {
    setVisitingId(neighborId);
    switchScreen('neighborGarden');
  };

  const handleLeaveNeighbor = () => {
    playTapSound();
    setVisitingId(null);
    setActiveModal(null);
    if (activeScreen === 'neighborFarm') {
      setActiveScreen('neighborGarden');
    }
  };

  const handleOpenAlbumItem = (entry: JudgeReport) => {
    setActiveReport(entry);
    switchScreen('judge');
  };

  const handleUseSampleSnap = () => {
    setActiveReport(SAMPLE_PUPPY_REPORT);
    setJudgeError(null);
    switchScreen('judge');
  };

  const welcomeDiscoveredPet = (customName: string): SanctuaryPet => {
    const petId = `cropped-${activeReport.id}`;
    const existing = pets.find((p) => p.id === petId);
    if (existing) return existing;

    setCoins((c) => c + activeReport.coinsReward);
    awardExp(Math.round(activeReport.expReward / 2));
    setFenceHours(24);
    setEnergy((e) => Math.max(0, e - 5));

    const initialXp = activeReport.overallScore >= 90 ? 40 : 25;
    const newPet: SanctuaryPet = {
      id: petId,
      name: customName || activeReport.petName,
      species: mapSpecies(activeReport.species),
      photoUrl: activeReport.photoUrl,
      cutoutMode: 'auto',
      x: 48,
      y: 52,
      score: activeReport.overallScore,
      pose: activeReport.pose,
      minted: activeReport.minted,
      bondXp: initialXp,
      bondLevel: computeBondLevel(initialXp),
      discoveryDate: new Date().toISOString().slice(0, 10),
      discoveryStatus: 'Welcomed',
      passportEligible: isPetPassportEligible(initialXp),
      animState: 'happy',
    };

    setPets((prev) =>
      prev.some((p) => p.id === newPet.id) ? prev : [...prev, newPet]
    );
    setActiveReport((r) => ({
      ...r,
      petName: newPet.name,
      cropped: true,
      petId: newPet.id,
    }));
    setAlbum((prev) =>
      prev.map((item) =>
        item.id === activeReport.id
          ? { ...item, petName: newPet.name, cropped: true, petId: newPet.id }
          : item
      )
    );
    setFirstBondQuest((q) => (q.welcomeDone ? q : { ...q, welcomeDone: true }));
    void syncPetCreated(toPetProfile(newPet));
    return newPet;
  };

  // Phase 2 Welcome trigger from Judge Card
  const handleCropIntoSanctuary = () => {
    if (!activeReport.cropped) {
      setProfileModalState({ open: true, mode: 'welcome', petId: null });
      return;
    }
    openSanctuaryScreen();
  };

  // Phase 5/6 Passport Mint Modal trigger from Judge Card
  const handleMintPet = () => {
    let targetId = `cropped-${activeReport.id}`;
    if (!activeReport.cropped) {
      const welcomed = welcomeDiscoveredPet(activeReport.petName);
      targetId = welcomed.id;
    }
    setMintModalPetId(targetId);
    setMintModalOpen(true);
  };

  const handleShareSnap = () => {
    const shareSummary = `🐾 ${activeReport.petName} · ${activeReport.overallScore}/100`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareSummary).catch(() => {});
    }
  };

  const handleUploadPhoto = async (file: File) => {
    playCameraSound();
    setJudgeError(null);
    setIsJudging(true);
    switchScreen('judge');

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read photo file.'));
        reader.readAsDataURL(file);
      });

      const [header, base64] = dataUrl.split(',');
      const mimeMatch = header.match(/data:(.*?);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      setActiveReport((prev) => ({
        ...prev,
        id: `report-${Date.now()}`,
        photoUrl: dataUrl,
        cropped: false,
        minted: false,
      }));

      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          theme,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'AI Judge unavailable.');
      }

      const judgedReport: JudgeReport = {
        id: `report-${Date.now()}`,
        photoUrl: dataUrl,
        theme,
        overallScore: payload.overallScore ?? 90,
        verdict: payload.verdict ?? 'EXCELLENT!',
        tierLabel: payload.tierLabel ?? '80+ Tier',
        sharp: payload.sharp ?? 92,
        light: payload.light ?? 89,
        species: payload.species ?? 'Pet',
        pose: payload.pose ?? 'Playful',
        themeScore: payload.themeScore ?? 91,
        themeMatch: Boolean(payload.themeMatch ?? true),
        petName: payload.petName ?? 'Clover',
        coinsReward: payload.coinsReward ?? 150,
        expReward: payload.expReward ?? 50,
        cropped: false,
        minted: false,
      };

      setActiveReport(judgedReport);
      setAlbum((prev) => [judgedReport, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to judge photo.';
      setJudgeError(msg);
    } finally {
      setIsJudging(false);
    }
  };

  const handleRescueStray = () => {
    if (luredRescued) return;
    playVictorySound();
    setLuredRescued(true);
    const rescued: SanctuaryPet = {
      id: 'pet-biscuit-corgi',
      name: 'Biscuit',
      species: 'corgi',
      photoUrl: PET_IMAGES.luredStrayCorgi,
      cutoutMode: 'silhouette',
      x: 72,
      y: 62,
      score: 90,
      pose: 'Happy',
      bondXp: 45,
      bondLevel: 2,
      discoveryDate: new Date().toISOString().slice(0, 10),
      discoveryStatus: 'Welcomed',
      passportEligible: false,
      animState: 'happy',
    };
    setPets((prev) => [...prev, rescued]);
    setCoins((c) => c + 100);
    setFirstBondQuest((q) => (q.welcomeDone ? q : { ...q, welcomeDone: true }));
    void syncPetCreated(toPetProfile(rescued));
    setActiveModal(null);
  };

  // Core Wallet Handlers (Member 03)
  const handleConnectCore = async (useDemoFallback: boolean) => {
    setWallet((w) => ({ ...w, connecting: true, error: null }));
    try {
      const result = await connectCoreWallet(useDemoFallback);
      const auth = await authenticateWalletAddress(
        result.address,
        result.providerLabel
      );
      setWallet({
        connected: true,
        address: result.address,
        chainId: result.chainId,
        isAvalancheFuji: result.isAvalancheFuji,
        providerLabel: result.providerLabel,
        authVerified: auth.verified,
        connecting: false,
        error: null,
      });
    } catch (err) {
      setWallet((w) => ({
        ...w,
        connecting: false,
        error:
          err instanceof Error ? err.message : 'Failed to connect Core Wallet.',
      }));
    }
  };

  const handleSwitchFuji = async () => {
    setWallet((w) => ({ ...w, connecting: true, error: null }));
    try {
      const chainId = await switchToAvalancheFuji(wallet.providerLabel);
      setWallet((w) => ({
        ...w,
        chainId,
        isAvalancheFuji: true,
        connecting: false,
      }));
    } catch (err) {
      setWallet((w) => ({
        ...w,
        connecting: false,
        error: err instanceof Error ? err.message : 'Failed to switch network.',
      }));
    }
  };

  const handleVerifyAuth = async () => {
    if (!wallet.address) return;
    setWallet((w) => ({ ...w, connecting: true, error: null }));
    try {
      const auth = await authenticateWalletAddress(
        wallet.address,
        wallet.providerLabel
      );
      setWallet((w) => ({
        ...w,
        authVerified: auth.verified,
        connecting: false,
      }));
    } catch (err) {
      setWallet((w) => ({
        ...w,
        connecting: false,
        error: err instanceof Error ? err.message : 'Signature declined.',
      }));
    }
  };

  const handleDisconnectWallet = () => {
    setWallet({
      connected: false,
      address: null,
      chainId: null,
      isAvalancheFuji: false,
      providerLabel: null,
      authVerified: false,
      connecting: false,
      error: null,
    });
  };

  // First Bond Quest Claim (Anti-Cheat Protected)
  const handleClaimQuestReward = async (targetPetId: string) => {
    if (firstBondQuest.claimed) return;
    const res = await claimFirstBondQuestApi(targetPetId);
    if (!res.claimed) return;

    playVictorySound();
    applyPetBondGain(targetPetId, res.rewardXp, 'happy');
    setFirstBondQuest((prev) => ({
      ...prev,
      claimed: true,
      targetPetId,
      claimedAt: new Date().toISOString(),
    }));
  };

  // Passport Minted Callback -> Update Pet + Album + Public Gallery
  const handlePassportMinted = (record: MintedPassportRecord) => {
    playVictorySound();
    setPassports((prev) => [record, ...prev]);
    setPets((prev) =>
      prev.map((p) =>
        p.id === record.petId
          ? {
              ...p,
              minted: true,
              passportEligible: true,
              passportTokenId: record.tokenId,
              discoveryStatus: 'Preserved On-Chain',
              ipfsCid: record.ipfsCid,
              ipfsUri: record.ipfsUri,
              txHash: record.txHash,
              ownerAddress: record.ownerAddress,
            }
          : p
      )
    );
    setAlbum((prev) =>
      prev.map((entry) =>
        `cropped-${entry.id}` === record.petId
          ? { ...entry, minted: true, petId: record.petId }
          : entry
      )
    );
    if (`cropped-${activeReport.id}` === record.petId) {
      setActiveReport((r) => ({ ...r, minted: true, petId: record.petId }));
    }
  };

  const handleJumpToJourneyPhase = (phase: JourneyPhase) => {
    setQuestModalOpen(false);
    if (phase === 'discover') {
      switchScreen('judge');
      return;
    }
    if (phase === 'welcome') {
      if (!activeReport.cropped) {
        switchScreen('judge');
        setProfileModalState({ open: true, mode: 'welcome', petId: null });
      } else {
        openSanctuaryScreen();
      }
      return;
    }
    if (phase === 'care') {
      openSanctuaryScreen();
      setProfileModalState({
        open: true,
        mode: 'profile',
        petId: pets[0]?.id ?? null,
      });
      return;
    }
    if (phase === 'grow') {
      openFarmScreen();
      return;
    }
    if (phase === 'preserve') {
      const readyPet =
        pets.find((p) => p.passportEligible && !p.minted) ?? pets[0];
      setMintModalPetId(readyPet?.id ?? null);
      setMintModalOpen(true);
      return;
    }
    if (phase === 'connect') {
      setWalletModalOpen(true);
    }
  };

  const questDoneCount =
    (firstBondQuest.welcomeDone ? 1 : 0) +
    (firstBondQuest.feedDone ? 1 : 0) +
    (firstBondQuest.playDone ? 1 : 0);

  const questProgressLabel = firstBondQuest.claimed
    ? 'Quest ✓'
    : `${questDoneCount}/3`;

  const currentJourneyPhase: JourneyPhase = passports.some((p) =>
    pets.some((own) => own.id === p.petId)
  )
    ? 'connect'
    : pets.some((p) => p.passportEligible)
    ? 'preserve'
    : questDoneCount >= 2
    ? 'grow'
    : firstBondQuest.welcomeDone
    ? 'care'
    : 'discover';

  const frameSizeClass =
    'w-full h-dvh sm:w-full sm:max-w-[420px] sm:h-[min(86dvh,756px)] sm:aspect-[9/16]';

  const renderCreamSheets = (target: ScreenView) => {
    if (modalTarget !== target) return null;
    return (
      <CreamSheets
        modal={activeModal}
        onClose={() => setActiveModal(null)}
        coins={coins}
        energy={energy}
        maxEnergy={maxEnergy}
        level={level}
        streakDays={streakDays}
        fenceHours={fenceHours}
        theme={theme}
        pets={pets}
        shopItems={shopItems}
        toys={toys}
        foodInventory={foodInventory}
        limits={limits}
        neighbors={neighbors}
        visitingNeighbor={visitingNeighbor}
        album={album}
        luredRescued={luredRescued}
        activeBait={activeBait}
        keeperName={keeperName}
        onBuyItem={handleBuyItem}
        onBuyToy={handleBuyToy}
        onFeedPet={(food) => {
          handleFeedPet(food);
        }}
        onVisitNeighbor={handleVisitNeighbor}
        onBuyFromNeighborMarket={handleBuyFromNeighborMarket}
        onEquipAccessory={handleEquipAccessory}
        onBuyAndEquipHat={handleBuyAndEquipHat}
        onCarePet={(petId) => {
          handleCarePet(petId);
        }}
        onUseSampleSnap={handleUseSampleSnap}
        onRescueStray={handleRescueStray}
        onPlaceBait={(baitName) => {
          playHappySound();
          setActiveBait(baitName);
          setActiveModal(null);
          if (activeScreen !== 'sanctuary') {
            setActiveScreen('sanctuary');
          }
        }}
        onOpenAlbumItem={handleOpenAlbumItem}
        onOpenPetProfile={(petId) => {
          setActiveModal(null);
          setProfileModalState({ open: true, mode: 'profile', petId });
        }}
        onOpenMintPassport={(petId) => {
          setActiveModal(null);
          setMintModalPetId(petId);
          setMintModalOpen(true);
        }}
        onOpenGallery={openGalleryScreen}
        onOpenWallet={() => setWalletModalOpen(true)}
        onOpenQuest={() => setQuestModalOpen(true)}
        walletLabel={
          wallet.connected ? shortenAddress(wallet.address) : 'Connect Core'
        }
      />
    );
  };

  const navTabs: { id: ScreenView; label: string }[] = [
    { id: 'sanctuary', label: 'Sanctuary' },
    { id: 'farm', label: 'Crop Farm' },
    { id: 'neighborGarden', label: 'Visit' },
    ...(visitingNeighbor
      ? [
          {
            id: 'neighborFarm' as const,
            label: `${visitingNeighbor.ownerName}’s Farm`,
          },
        ]
      : []),
    { id: 'judge', label: 'AI Judge' },
    { id: 'gallery', label: `Passports (${passports.length})` },
  ];

  const profileTargetPet =
    pets.find((p) => p.id === profileModalState.petId) ?? null;

  const openSettings = () => {
    playTapSound();
    setSettingsModal({ open: true, tab: 'settings' });
  };

  return (
    <SkyThemeProvider value={{ skyTheme, toggleSkyTheme: handleToggleSkyTheme }}>
    <UiLabelsProvider value={showTextLabels}>
    <div
      className={`min-h-dvh w-full ${
        skyTheme === 'sunset' ? 'pastel-studio-bg-sunset' : 'pastel-studio-bg'
      } flex flex-col items-center justify-center sm:p-4 lg:p-5 transition-colors duration-500`}
    >
      {/* Desktop Studio Header Bar (Hidden on mobile so full-screen app has a single clean in-frame top bar) */}
      <header className="hidden sm:flex w-full max-w-[1160px] px-3 pb-3 items-center justify-between gap-4">
        {/* Zone 1: Wordmark / Return to Title */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setActiveModal(null);
            setAppPhase('start');
          }}
          className="cream-pill rounded-full px-3.5 py-1 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
          title="Return to Start Screen"
        >
          {appPhase === 'playing' && (
            <Home className="w-3.5 h-3.5 text-[#8A747E]" />
          )}
          <span className="font-display text-[14px] font-extrabold text-[#4B3C46] whitespace-nowrap">
            🐾 Paws &amp; Picket
          </span>
        </button>

        {/* Zone 2: In-Game Screen Navigation (Desktop) */}
        {appPhase === 'playing' && (
          <nav
            aria-label="Screens"
            className="hidden lg:flex items-center gap-1 cream-pill rounded-full p-1"
          >
            {navTabs.map((tab) => {
              const active = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchScreen(tab.id)}
                  className={`rounded-full px-3 py-1 font-display text-[12px] font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#FFE07D] text-[#4B3C46]'
                      : 'text-[#8A747E] hover:text-[#4B3C46]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Primary Actions (Wallet + Settings Menu) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {appPhase === 'playing' && (
            <button
              type="button"
              onClick={() =>
                activeScreen === 'gallery'
                  ? openSanctuaryScreen()
                  : openGalleryScreen()
              }
              className={`lg:hidden cream-pill rounded-full px-2.5 py-1 font-display text-[11.5px] font-extrabold cursor-pointer whitespace-nowrap active:scale-95 transition-transform ${
                activeScreen === 'gallery'
                  ? 'bg-[#FFE07D] text-[#4B3C46]'
                  : 'bg-[#FFFDF9] text-[#4B3C46]'
              }`}
            >
              {activeScreen === 'gallery' ? '🏡 Yard' : `🏛️ ${passports.length}`}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setWalletModalOpen(true);
            }}
            className={`cream-pill rounded-full px-3 py-1 font-display text-[11.5px] font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-transform ${
              wallet.connected
                ? 'bg-[#E8F8EC] text-[#3F7B52]'
                : 'bg-[#FFFDF9] text-[#4B3C46]'
            }`}
            title="Core Wallet & Avalanche Fuji"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {wallet.connected ? shortenAddress(wallet.address) : 'Core Wallet'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleSkyTheme}
            aria-label={
              skyTheme === 'sunset'
                ? 'Switch to Sunny Morning sky'
                : 'Switch to Golden Hour Sunset sky'
            }
            className={`cream-pill rounded-full px-2.5 h-8.5 flex items-center gap-1 font-display text-[11.5px] font-extrabold cursor-pointer active:scale-95 transition-transform whitespace-nowrap ${
              skyTheme === 'sunset'
                ? 'bg-[#FFE7D6] text-[#C95E45]'
                : 'bg-[#FFF8D8] text-[#C88A1E]'
            }`}
            title="Switch Meadow Sky Theme"
          >
            {skyTheme === 'sunset' ? (
              <Sunset className="w-3.5 h-3.5 stroke-[2.4]" />
            ) : (
              <Sun className="w-3.5 h-3.5 stroke-[2.4]" />
            )}
            <span>{skyTheme === 'sunset' ? 'Sunset' : 'Morning'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSettingsModal({ open: true, tab: 'settings' });
            }}
            aria-label="Open Settings and Menu"
            className="cream-pill rounded-full w-8.5 h-8.5 flex items-center justify-center text-[#4B3C46] cursor-pointer active:scale-95 transition-transform"
            title="Settings & How to Play"
          >
            <Settings className="w-4 h-4 stroke-[2.3]" />
          </button>
        </div>
      </header>

      {/* ACTIVE APP VIEWPORT */}
      <div className="w-full flex-1 flex items-center justify-center sm:px-2">
        <section
          aria-label={appPhase === 'start' ? 'Start Screen' : 'Paws and Picket App'}
          className={`relative ${frameSizeClass} rounded-none sm:rounded-[36px] border-0 sm:border-[3px] ${
            appPhase === 'playing' && activeScreen === 'judge'
              ? 'sm:border-[#E8CFD9]'
              : appPhase === 'playing' && activeScreen === 'gallery'
              ? 'sm:border-[#C6E1F5]'
              : 'sm:border-[#DFCBBF]'
          } shadow-none sm:shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFFDF9]`}
        >
          {appPhase === 'start' ? (
            <StartScreen
              keeperName={keeperName}
              level={level}
              coins={coins}
              streakDays={streakDays}
              pets={pets}
              passportsCount={passports.length}
              hasSavedSession={hasSavedSession}
              soundEnabled={soundEnabled}
              wallet={wallet}
              onStartPlay={() => {
                playVictorySound();
                setHasSavedSession(true);
                setAppPhase('playing');
              }}
              onOpenGallery={() => {
                playTapSound();
                setHasSavedSession(true);
                setAppPhase('playing');
                setActiveScreen('gallery');
              }}
              onOpenGuide={() => {
                playTapSound();
                setSettingsModal({ open: true, tab: 'guide' });
              }}
              onOpenSettings={() => {
                playTapSound();
                setSettingsModal({ open: true, tab: 'settings' });
              }}
              onToggleSound={handleToggleSound}
              onOpenWallet={() => {
                playTapSound();
                setWalletModalOpen(true);
              }}
            />
          ) : (
            <>
              {activeScreen === 'sanctuary' && (
                <>
                  <SanctuaryScreen
                    coins={coins}
                    energy={energy}
                    maxEnergy={maxEnergy}
                    level={level}
                    expPercent={expPercent}
                    streakDays={streakDays}
                    fenceHours={fenceHours}
                    theme={theme}
                    pets={pets}
                    toys={toys}
                    foodInventory={foodInventory}
                    limits={limits}
                    luredCount={luredRescued ? 0 : 1}
                    activeBait={activeBait}
                    readyFarmCount={readyFarmCount}
                    questProgressLabel={questProgressLabel}
                    onCarePet={handleCarePet}
                    onOpenPetProfile={(petId) => {
                      playTapSound();
                      setProfileModalState({ open: true, mode: 'profile', petId });
                    }}
                    onFeedPet={(food) => handleFeedPet(food)}
                    onPlayToy={(toy) => handlePlayToy(toy)}
                    onTapClover={handleTapClover}
                    onOpenFarm={openFarmScreen}
                    onOpenQuest={() => setQuestModalOpen(true)}
                    onOpenModal={(m) => openModalIn('sanctuary', m)}
                    onQuickCoins={() => openModalIn('sanctuary', 'shop')}
                    onQuickEnergy={() =>
                      setEnergy((e) => Math.min(maxEnergy, e + 5))
                    }
                    onOpenSettings={openSettings}
                  />
                  {renderCreamSheets('sanctuary')}
                </>
              )}

              {activeScreen === 'farm' && (
                <>
                  <FarmScreen
                    coins={coins}
                    energy={energy}
                    maxEnergy={maxEnergy}
                    level={level}
                    expPercent={expPercent}
                    waterCharges={waterCharges}
                    maxWater={maxWater}
                    cropPlots={cropPlots}
                    trees={trees}
                    seedInventory={seedInventory}
                    foodInventory={foodInventory}
                    marketListings={marketListings}
                    readyFarmCount={readyFarmCount}
                    luredCount={luredRescued ? 0 : 1}
                    onSelectYard={openSanctuaryScreen}
                    onOpenModal={(m) => openModalIn('farm', m)}
                    onQuickCoins={() => openModalIn('farm', 'shop')}
                    onRefillWater={handleRefillWater}
                    onTapPlot={handleTapPlot}
                    onTapTree={handleTapTree}
                    onBuySeed={handleBuySeed}
                    onListOnMarket={handleListOnMarket}
                    onCancelMarketListing={handleCancelMarketListing}
                    onCollectMarketSale={handleCollectMarketSale}
                    onOpenSettings={openSettings}
                  />
                  {renderCreamSheets('farm')}
                </>
              )}

              {activeScreen === 'neighborGarden' && (
                <>
                  <NeighborGardenScreen
                    coins={coins}
                    energy={energy}
                    maxEnergy={maxEnergy}
                    level={level}
                    expPercent={expPercent}
                    readyFarmCount={readyFarmCount}
                    luredCount={luredRescued ? 0 : 1}
                    neighbors={neighbors}
                    visitingNeighbor={visitingNeighbor}
                    onVisitNeighbor={handleVisitNeighbor}
                    onLeaveNeighbor={handleLeaveNeighbor}
                    onOpenNeighborFarm={openNeighborFarmScreen}
                    onSelectYard={openSanctuaryScreen}
                    onSelectFarm={openFarmScreen}
                    onOpenModal={(m) => openModalIn('neighborGarden', m)}
                    onQuickCoins={() => openModalIn('neighborGarden', 'shop')}
                    onQuickEnergy={() =>
                      setEnergy((e) => Math.min(maxEnergy, e + 5))
                    }
                    onNeighborPat={handleNeighborPat}
                    onNeighborGift={handleNeighborGift}
                    onOpenSettings={openSettings}
                  />
                  {renderCreamSheets('neighborGarden')}
                </>
              )}

              {activeScreen === 'neighborFarm' && visitingNeighbor && (
                <>
                  <NeighborFarmScreen
                    coins={coins}
                    energy={energy}
                    maxEnergy={maxEnergy}
                    level={level}
                    expPercent={expPercent}
                    readyFarmCount={readyFarmCount}
                    luredCount={luredRescued ? 0 : 1}
                    activeNeighbor={visitingNeighbor}
                    onSelectNeighborGarden={openNeighborGardenScreen}
                    onSelectYard={openSanctuaryScreen}
                    onSelectFarm={openFarmScreen}
                    onOpenModal={(m) => openModalIn('neighborFarm', m)}
                    onQuickCoins={() => openModalIn('neighborFarm', 'shop')}
                    onQuickEnergy={() =>
                      setEnergy((e) => Math.min(maxEnergy, e + 5))
                    }
                    onWaterNeighborPlot={handleWaterNeighborPlot}
                    onWaterNeighborTree={handleWaterNeighborTree}
                    onGiftNeighbor={handleGiftNeighborById}
                    onOpenSettings={openSettings}
                  />
                  {renderCreamSheets('neighborFarm')}
                </>
              )}

              {activeScreen === 'judge' && (
                <>
                  <JudgeCardScreen
                    coins={coins}
                    energy={energy}
                    maxEnergy={maxEnergy}
                    level={level}
                    expPercent={expPercent}
                    readyFarmCount={readyFarmCount}
                    luredCount={luredRescued ? 0 : 1}
                    report={activeReport}
                    isJudging={isJudging}
                    judgeError={judgeError}
                    onSelectYard={openSanctuaryScreen}
                    onSelectFarm={openFarmScreen}
                    onOpenModal={(m) => openModalIn('judge', m)}
                    onQuickCoins={() => openModalIn('judge', 'shop')}
                    onQuickEnergy={() =>
                      setEnergy((e) => Math.min(maxEnergy, e + 5))
                    }
                    onCropIntoSanctuary={handleCropIntoSanctuary}
                    onMintPet={handleMintPet}
                    onShareSnap={handleShareSnap}
                    onUploadPhoto={handleUploadPhoto}
                    onResetSample={() => {
                      setActiveReport(SAMPLE_PUPPY_REPORT);
                      setJudgeError(null);
                    }}
                    onOpenSettings={openSettings}
                  />
                  {renderCreamSheets('judge')}
                </>
              )}

              {activeScreen === 'gallery' && (
                <>
                  <PassportGalleryScreen
                    coins={coins}
                    energy={energy}
                    maxEnergy={maxEnergy}
                    level={level}
                    expPercent={expPercent}
                    readyFarmCount={readyFarmCount}
                    luredCount={luredRescued ? 0 : 1}
                    passports={passports}
                    walletAddress={wallet.address}
                    onSelectYard={openSanctuaryScreen}
                    onSelectFarm={openFarmScreen}
                    onSelectVisit={openNeighborGardenScreen}
                    onOpenModal={(m) => openModalIn('gallery', m)}
                    onQuickCoins={() => openModalIn('gallery', 'shop')}
                    onQuickEnergy={() =>
                      setEnergy((e) => Math.min(maxEnergy, e + 5))
                    }
                    onOpenMintModal={() => {
                      const target =
                        pets.find((p) => p.passportEligible && !p.minted) ??
                        pets[0];
                      setMintModalPetId(target?.id ?? null);
                      setMintModalOpen(true);
                    }}
                    onRefreshGallery={() => {
                      setPassports((prev) => [...prev]);
                    }}
                    onOpenSettings={openSettings}
                  />
                  {renderCreamSheets('gallery')}
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* GLOBAL MODALS (Settings/Guide, Welcome/Profile, Quest/Journey, Core Wallet, Passport Mint) */}
      {(walletModalOpen ||
        questModalOpen ||
        mintModalOpen ||
        settingsModal.open ||
        profileModalState.open) && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          <AppSettingsModal
            open={settingsModal.open}
            initialTab={settingsModal.tab}
            keeperName={keeperName}
            soundEnabled={soundEnabled}
            showTextLabels={showTextLabels}
            skyTheme={skyTheme}
            inGame={appPhase === 'playing'}
            walletLabel={
              wallet.connected
                ? shortenAddress(wallet.address)
                : 'Not Connected'
            }
            onClose={() => setSettingsModal((s) => ({ ...s, open: false }))}
            onChangeKeeperName={setKeeperName}
            onToggleSound={handleToggleSound}
            onToggleShowTextLabels={handleToggleShowTextLabels}
            onToggleSkyTheme={handleToggleSkyTheme}
            onOpenWallet={() => setWalletModalOpen(true)}
            onReturnToTitle={() => {
              setActiveModal(null);
              setAppPhase('start');
            }}
            onResetSave={handleResetSave}
          />

          <WalletConnectModal
            open={walletModalOpen}
            wallet={wallet}
            onClose={() => setWalletModalOpen(false)}
            onConnectCore={handleConnectCore}
            onSwitchFuji={handleSwitchFuji}
            onVerifyAuth={handleVerifyAuth}
            onDisconnect={handleDisconnectWallet}
          />

          <FirstBondQuestModal
            open={questModalOpen}
            quest={firstBondQuest}
            pets={pets}
            currentPhase={currentJourneyPhase}
            hasMintedPassport={pets.some((p) => p.minted)}
            walletConnected={wallet.connected && wallet.isAvalancheFuji}
            onClose={() => setQuestModalOpen(false)}
            onJumpToPhase={handleJumpToJourneyPhase}
            onQuickWelcome={() => {
              setQuestModalOpen(false);
              if (!activeReport.cropped) {
                setProfileModalState({
                  open: true,
                  mode: 'welcome',
                  petId: null,
                });
              } else {
                openModalIn('sanctuary', 'snap');
              }
            }}
            onQuickFeed={() => {
              setQuestModalOpen(false);
              const firstFood = (
                Object.keys(foodInventory) as FoodItemType[]
              ).find((k) => foodInventory[k] > 0);
              if (firstFood) {
                handleFeedPet(firstFood, pets[0]?.id);
                openSanctuaryScreen();
              } else {
                setProfileModalState({
                  open: true,
                  mode: 'profile',
                  petId: pets[0]?.id ?? null,
                });
              }
            }}
            onQuickPlay={() => {
              setQuestModalOpen(false);
              const ownedToy = toys.find((t) => t.owned) ?? toys[0];
              handlePlayToy(ownedToy, pets[0]?.id);
              openSanctuaryScreen();
            }}
            onClaimReward={handleClaimQuestReward}
          />

          <PetProfileModal
            open={profileModalState.open}
            mode={profileModalState.mode}
            pet={profileTargetPet}
            pendingReport={
              profileModalState.mode === 'welcome' ? activeReport : null
            }
            shopItems={shopItems}
            foodInventory={foodInventory}
            coins={coins}
            onClose={() =>
              setProfileModalState((s) => ({ ...s, open: false }))
            }
            onConfirmWelcome={(customName) => {
              welcomeDiscoveredPet(customName);
              setProfileModalState((s) => ({ ...s, open: false }));
              openSanctuaryScreen();
            }}
            onCareAction={handleProfileCareAction}
            onFeedSpecificPet={(petId, food) => handleFeedPet(food, petId)}
            onEquipAccessory={handleEquipAccessory}
            onBuyAndEquipHat={handleBuyAndEquipHat}
            onUpdateHatTransform={handleUpdateHatTransform}
            onOpenFarm={openFarmScreen}
            onOpenMintPassport={(petId) => {
              setProfileModalState((s) => ({ ...s, open: false }));
              setMintModalPetId(petId);
              setMintModalOpen(true);
            }}
          />

          <PassportMintModal
            open={mintModalOpen}
            pets={pets}
            initialPetId={mintModalPetId}
            wallet={wallet}
            nextTokenNumber={passports.length + 1}
            existingPassports={passports}
            onClose={() => setMintModalOpen(false)}
            onOpenWallet={() => setWalletModalOpen(true)}
            onOpenQuest={() => {
              setMintModalOpen(false);
              setQuestModalOpen(true);
            }}
            onPassportMinted={handlePassportMinted}
            onOpenGallery={openGalleryScreen}
          />
        </div>
      )}
    </div>
    </UiLabelsProvider>
    </SkyThemeProvider>
  );
}
