import React, { useEffect, useState } from 'react';
import {
  CropPlot,
  CropType,
  DailyLimits,
  FoodItemType,
  GardenToy,
  JudgeReport,
  MarketListing,
  NeighborGarden,
  OrchardTree,
  PetSpecies,
  SanctuaryPet,
  ShopItem,
} from './types';
import {
  SanctuaryModalType,
  SanctuaryScreen,
} from './components/SanctuaryScreen';
import { FOOD_META, FarmScreen } from './components/FarmScreen';
import { NeighborGardenScreen } from './components/NeighborGardenScreen';
import { NeighborFarmScreen } from './components/NeighborFarmScreen';
import { JudgeCardScreen } from './components/JudgeCardScreen';
import { CreamSheets } from './components/CreamSheets';

const INITIAL_PETS: SanctuaryPet[] = [
  {
    id: 'pet-calico',
    name: 'Mochi',
    species: 'cat',
    photoUrl: '/src/assets/images/cropped_calico_cat_1794637541476.jpg',
    cutoutMode: 'studio',
    x: 34,
    y: 50,
    needsCare: 'heart',
    score: 94,
  },
  {
    id: 'pet-retriever',
    name: 'Sunny',
    species: 'dog',
    photoUrl: '/src/assets/images/cropped_golden_dog_1794637542709.jpg',
    cutoutMode: 'studio',
    x: 63,
    y: 45,
    flip: true,
    score: 91,
  },
  {
    id: 'pet-bunny',
    name: 'Pip',
    species: 'bunny',
    photoUrl: '/src/assets/images/cropped_fluffy_bunny_1794637542800.jpg',
    cutoutMode: 'studio',
    x: 50,
    y: 62,
    score: 88,
  },
];

const INITIAL_SHOP: ShopItem[] = [
  { id: 'straw-hat', name: 'Straw Hat', cost: 400, icon: '👒', kind: 'accessory' },
  { id: 'flower-crown', name: 'Daisy Crown', cost: 550, icon: '🌸', kind: 'accessory' },
  { id: 'camera-film', name: '+10 Energy', cost: 250, icon: '⚡', kind: 'energy' },
];

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
        photoUrl: '/src/assets/images/neighbor_shiba_dog_1794722670611.jpg',
        cutoutMode: 'studio',
        x: 38,
        y: 52,
        needsCare: 'heart',
      },
      {
        id: 'n-maya-ragdoll',
        name: 'Pearl',
        species: 'cat',
        photoUrl: '/src/assets/images/neighbor_ragdoll_cat_1794722671151.jpg',
        cutoutMode: 'studio',
        x: 64,
        y: 55,
        flip: true,
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
        photoUrl: '/src/assets/images/neighbor_samoyed_pup_1794722672155.jpg',
        cutoutMode: 'studio',
        x: 42,
        y: 54,
        needsCare: 'food',
      },
      {
        id: 'n-leo-corgi',
        name: 'Toast',
        species: 'corgi',
        photoUrl: '/src/assets/images/lured_stray_corgi_1794627550798.jpg',
        cutoutMode: 'silhouette',
        x: 66,
        y: 49,
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
        photoUrl: '/src/assets/images/neighbor_ragdoll_cat_1794722671151.jpg',
        cutoutMode: 'studio',
        x: 36,
        y: 55,
      },
      {
        id: 'n-hana-bunny',
        name: 'Snow',
        species: 'bunny',
        photoUrl: '/src/assets/images/cropped_fluffy_bunny_1794637542800.jpg',
        cutoutMode: 'studio',
        x: 62,
        y: 56,
        flip: true,
      },
    ],
  },
];

const SAMPLE_PUPPY_REPORT: JudgeReport = {
  id: 'report-golden-puppy',
  photoUrl: '/src/assets/images/polaroid_golden_puppy_1794627548886.jpg',
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
  | 'judge';

export default function App() {
  const [desktopMode, setDesktopMode] = useState<'both' | ScreenView>('both');
  const [mobileScreen, setMobileScreen] = useState<ScreenView>('sanctuary');

  const [coins, setCoins] = useState(12560);
  const [energy, setEnergy] = useState(45);
  const maxEnergy = 50;
  const [level, setLevel] = useState(12);
  const [expPercent, setExpPercent] = useState(64);
  const [streakDays] = useState(7);
  const [fenceHours, setFenceHours] = useState(14);
  const [theme] = useState('Fluffy Tails');

  const [pets, setPets] = useState<SanctuaryPet[]>(INITIAL_PETS);
  const [shopItems, setShopItems] = useState<ShopItem[]>(INITIAL_SHOP);
  const [toys, setToys] = useState<GardenToy[]>(INITIAL_TOYS);

  // Crop Farm State
  const [waterCharges, setWaterCharges] = useState(8);
  const maxWater = 8;
  const [cropPlots, setCropPlots] = useState<CropPlot[]>(INITIAL_PLOTS);
  const [trees, setTrees] = useState<OrchardTree[]>(INITIAL_TREES);
  const [seedInventory, setSeedInventory] = useState<Record<CropType, number>>({
    wheat: 3,
    carrot: 2,
    berry: 1,
    catnip: 0,
  });
  const [foodInventory, setFoodInventory] = useState<Record<FoodItemType, number>>({
    wheat: 0,
    carrot: 1,
    berry: 0,
    catnip: 0,
    apple: 0,
    peach: 0,
  });
  const [marketListings, setMarketListings] = useState<MarketListing[]>([
    { id: 'init-sale', item: 'carrot', qty: 1, price: 36, sold: true, buyerName: 'Maya' },
  ]);

  // Daily Currency Limits
  const [limits, setLimits] = useState<DailyLimits>({
    petCoinsUsed: 2,
    petCoinsMax: 10,
    playCoinsUsed: 0,
    playCoinsMax: 5,
    feedCoinsUsed: 0,
    feedCoinsMax: 6,
    cloverCoinsUsed: 0,
    cloverCoinsMax: 5,
  });

  const [neighbors, setNeighbors] = useState<NeighborGarden[]>(INITIAL_NEIGHBORS);
  const [visitingId, setVisitingId] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<SanctuaryModalType>(null);
  const [modalTarget, setModalTarget] = useState<ScreenView>('sanctuary');
  const [luredRescued, setLuredRescued] = useState(false);
  const [activeBait, setActiveBait] = useState<string | null>(null);

  const [activeReport, setActiveReport] = useState<JudgeReport>(SAMPLE_PUPPY_REPORT);
  const [album, setAlbum] = useState<JudgeReport[]>([SAMPLE_PUPPY_REPORT]);
  const [isJudging, setIsJudging] = useState(false);
  const [judgeError, setJudgeError] = useState<string | null>(null);

  const visitingNeighbor =
    neighbors.find((n) => n.id === visitingId) ?? null;

  const openModalIn = (target: ScreenView, modal: SanctuaryModalType) => {
    setModalTarget(target);
    setActiveModal(modal);
  };

  // Visiting neighbors periodically purchase unsold items in your Roadside Market (faster for fair/low prices)
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

  // Petting with daily coin cap
  const handleCarePet = (petId: string): string => {
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId
          ? { ...p, needsCare: p.needsCare ? null : undefined }
          : p
      )
    );

    if (limits.petCoinsUsed >= limits.petCoinsMax) {
      return '❤️ Daily Max';
    }

    setLimits((prev) => ({ ...prev, petCoinsUsed: prev.petCoinsUsed + 1 }));
    setCoins((c) => c + 15);
    awardExp(6);
    return '+15 🪙';
  };

  // Feeding harvested crops/fruits with daily coin cap
  const handleFeedPet = (food: FoodItemType): string => {
    if (foodInventory[food] <= 0) return 'No food';

    setFoodInventory((prev) => ({ ...prev, [food]: prev[food] - 1 }));
    setPets((prev) =>
      prev.map((p, i) => (i === 0 ? { ...p, needsCare: null } : p))
    );

    if (limits.feedCoinsUsed >= limits.feedCoinsMax) {
      awardExp(10);
      return `${FOOD_META[food].icon} Yummy!`;
    }

    setLimits((prev) => ({
      ...prev,
      feedCoinsUsed: prev.feedCoinsUsed + 1,
    }));
    setCoins((c) => c + 25);
    awardExp(12);
    return `${FOOD_META[food].icon} +25 🪙`;
  };

  const handlePlayToy = (toy: GardenToy): string => {
    if (limits.playCoinsUsed >= limits.playCoinsMax) {
      return `${toy.icon} Fun!`;
    }
    setLimits((prev) => ({
      ...prev,
      playCoinsUsed: prev.playCoinsUsed + 1,
    }));
    setCoins((c) => c + 20);
    awardExp(8);
    return `${toy.icon} +20 🪙`;
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
    setPets((prev) =>
      prev.map((p) => (p.id === petId ? { ...p, accessory: accessoryId } : p))
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

  const openFarmScreen = () => {
    setActiveModal(null);
    setMobileScreen('farm');
    if (desktopMode !== 'both') {
      setDesktopMode('farm');
    }
  };

  const openSanctuaryScreen = () => {
    setActiveModal(null);
    setMobileScreen('sanctuary');
    if (desktopMode !== 'both') {
      setDesktopMode('sanctuary');
    }
  };

  const openNeighborGardenScreen = () => {
    setActiveModal(null);
    setMobileScreen('neighborGarden');
    if (desktopMode !== 'both') {
      setDesktopMode('neighborGarden');
    }
  };

  const openNeighborFarmScreen = () => {
    if (!visitingNeighbor) return;
    setActiveModal(null);
    setMobileScreen('neighborFarm');
    if (desktopMode !== 'both') {
      setDesktopMode('neighborFarm');
    }
  };

  const handleVisitNeighbor = (neighborId: string) => {
    setVisitingId(neighborId);
    setActiveModal(null);
    setMobileScreen('neighborGarden');
    if (desktopMode !== 'both') {
      setDesktopMode('neighborGarden');
    }
  };

  const handleLeaveNeighbor = () => {
    setVisitingId(null);
    setActiveModal(null);
    if (mobileScreen === 'neighborFarm') {
      setMobileScreen('neighborGarden');
    }
    if (desktopMode === 'neighborFarm') {
      setDesktopMode('neighborGarden');
    }
  };

  const handleOpenAlbumItem = (entry: JudgeReport) => {
    setActiveReport(entry);
    setActiveModal(null);
    setMobileScreen('judge');
    if (desktopMode !== 'both') {
      setDesktopMode('judge');
    }
  };

  const handleUseSampleSnap = () => {
    setActiveReport(SAMPLE_PUPPY_REPORT);
    setJudgeError(null);
    setActiveModal(null);
    setMobileScreen('judge');
    if (desktopMode !== 'both') {
      setDesktopMode('judge');
    }
  };

  const handleCropIntoSanctuary = () => {
    if (!activeReport.cropped) {
      setCoins((c) => c + activeReport.coinsReward);
      awardExp(Math.round(activeReport.expReward / 2));
      setFenceHours(24);
      setEnergy((e) => Math.max(0, e - 5));

      const newPet: SanctuaryPet = {
        id: `cropped-${activeReport.id}`,
        name: activeReport.petName,
        species: mapSpecies(activeReport.species),
        photoUrl: activeReport.photoUrl,
        cutoutMode: 'auto',
        x: 48,
        y: 52,
        score: activeReport.overallScore,
        minted: activeReport.minted,
      };

      setPets((prev) =>
        prev.some((p) => p.id === newPet.id) ? prev : [...prev, newPet]
      );
      setActiveReport((r) => ({ ...r, cropped: true }));
      setAlbum((prev) =>
        prev.map((item) =>
          item.id === activeReport.id ? { ...item, cropped: true } : item
        )
      );
    }

    openSanctuaryScreen();
  };

  const handleMintPet = () => {
    if (activeReport.minted) return;
    setActiveReport((r) => ({ ...r, minted: true }));
    setPets((prev) =>
      prev.map((p) =>
        p.id === `cropped-${activeReport.id}` ? { ...p, minted: true } : p
      )
    );
    setAlbum((prev) =>
      prev.map((item) =>
        item.id === activeReport.id ? { ...item, minted: true } : item
      )
    );
  };

  const handleShareSnap = () => {
    const shareSummary = `🐾 ${activeReport.petName} · ${activeReport.overallScore}/100`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareSummary).catch(() => {});
    }
  };

  const handleUploadPhoto = async (file: File) => {
    setJudgeError(null);
    setIsJudging(true);
    setActiveModal(null);
    setMobileScreen('judge');
    if (desktopMode !== 'both') {
      setDesktopMode('judge');
    }

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
    setLuredRescued(true);
    setPets((prev) => [
      ...prev,
      {
        id: 'pet-biscuit-corgi',
        name: 'Biscuit',
        species: 'corgi',
        photoUrl: '/src/assets/images/lured_stray_corgi_1794627550798.jpg',
        cutoutMode: 'silhouette',
        x: 72,
        y: 62,
        score: 90,
      },
    ]);
    setCoins((c) => c + 100);
    setActiveModal(null);
  };

  const showSanctuaryOnDesktop =
    desktopMode === 'both' || desktopMode === 'sanctuary';
  const showFarmOnDesktop =
    desktopMode === 'both' || desktopMode === 'farm';
  const showNeighborGardenOnDesktop =
    desktopMode === 'both' || desktopMode === 'neighborGarden';
  const showNeighborFarmOnDesktop =
    Boolean(visitingNeighbor) &&
    (desktopMode === 'both' || desktopMode === 'neighborFarm');
  const showJudgeOnDesktop =
    desktopMode === 'both' || desktopMode === 'judge';

  const frameSizeClass =
    desktopMode === 'both'
      ? 'w-full max-w-[392px] h-[min(86dvh,710px)] lg:w-[310px] lg:h-[552px] aspect-[9/16]'
      : 'w-full max-w-[392px] h-[min(86dvh,710px)] aspect-[9/16]';

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
        onBuyItem={handleBuyItem}
        onBuyToy={handleBuyToy}
        onFeedPet={(food) => {
          handleFeedPet(food);
        }}
        onVisitNeighbor={handleVisitNeighbor}
        onBuyFromNeighborMarket={handleBuyFromNeighborMarket}
        onEquipAccessory={handleEquipAccessory}
        onCarePet={(petId) => {
          handleCarePet(petId);
        }}
        onUseSampleSnap={handleUseSampleSnap}
        onUploadPhoto={handleUploadPhoto}
        onRescueStray={handleRescueStray}
        onPlaceBait={(baitName) => {
          setActiveBait(baitName);
          setActiveModal(null);
        }}
        onOpenAlbumItem={handleOpenAlbumItem}
      />
    );
  };

  const desktopTabs: { id: 'both' | ScreenView; label: string }[] = [
    { id: 'both', label: `Both · All (${visitingNeighbor ? 5 : 4})` },
    { id: 'sanctuary', label: 'Sanctuary' },
    { id: 'farm', label: 'Crop Farm' },
    { id: 'neighborGarden', label: 'Visit Garden' },
    ...(visitingNeighbor
      ? [
          {
            id: 'neighborFarm' as const,
            label: `${visitingNeighbor.ownerName}’s Farm`,
          },
        ]
      : []),
    { id: 'judge', label: 'AI Judge' },
  ];

  return (
    <div className="min-h-dvh w-full pastel-studio-bg flex flex-col items-center justify-center sm:p-4 lg:p-5">
      {/* Minimal Pastel Top Bar */}
      <div className="w-full max-w-[1440px] px-3 pt-2.5 pb-2 sm:pt-0 sm:pb-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="cream-pill rounded-full px-3.5 py-1 flex items-center gap-1.5">
          <span className="font-display text-[14px] font-extrabold text-[#4B3C46] whitespace-nowrap">
            🐾 Paws &amp; Picket
          </span>
        </div>

        {/* Desktop Switcher */}
        <div className="hidden lg:flex items-center gap-1 cream-pill rounded-full p-1">
          {desktopTabs.map((tab) => {
            const active = desktopMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setDesktopMode(tab.id);
                }}
                className={`rounded-full px-3 py-1 font-display text-[12.5px] font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#FFE07D] text-[#4B3C46]'
                    : 'text-[#8A747E] hover:text-[#4B3C46]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile / Tablet Switcher */}
        <div className="flex lg:hidden items-center gap-1 cream-pill rounded-full p-1">
          <button
            type="button"
            onClick={openSanctuaryScreen}
            className={`rounded-full px-2 py-1 font-display text-[11px] font-extrabold cursor-pointer whitespace-nowrap ${
              mobileScreen === 'sanctuary'
                ? 'bg-[#FFE07D] text-[#4B3C46]'
                : 'text-[#8A747E]'
            }`}
          >
            🏡 Yard
          </button>
          <button
            type="button"
            onClick={openFarmScreen}
            className={`rounded-full px-2 py-1 font-display text-[11px] font-extrabold cursor-pointer whitespace-nowrap ${
              mobileScreen === 'farm'
                ? 'bg-[#FFE07D] text-[#4B3C46]'
                : 'text-[#8A747E]'
            }`}
          >
            🌾 Farm
          </button>
          <button
            type="button"
            onClick={openNeighborGardenScreen}
            className={`rounded-full px-2 py-1 font-display text-[11px] font-extrabold cursor-pointer whitespace-nowrap ${
              mobileScreen === 'neighborGarden'
                ? 'bg-[#FFE07D] text-[#4B3C46]'
                : 'text-[#8A747E]'
            }`}
          >
            🏘️ Visit
          </button>
          {visitingNeighbor && (
            <button
              type="button"
              onClick={openNeighborFarmScreen}
              className={`rounded-full px-2 py-1 font-display text-[11px] font-extrabold cursor-pointer whitespace-nowrap ${
                mobileScreen === 'neighborFarm'
                  ? 'bg-[#FFE07D] text-[#4B3C46]'
                  : 'text-[#8A747E]'
              }`}
            >
              🚜 {visitingNeighbor.ownerName}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setActiveModal(null);
              setMobileScreen('judge');
            }}
            className={`rounded-full px-2 py-1 font-display text-[11px] font-extrabold cursor-pointer whitespace-nowrap ${
              mobileScreen === 'judge'
                ? 'bg-[#FFE07D] text-[#4B3C46]'
                : 'text-[#8A747E]'
            }`}
          >
            📸 Judge
          </button>
        </div>
      </div>

      {/* 9:16 MOBILE PORTRAIT FRAMES */}
      <div className="w-full max-w-[1620px] flex-1 flex flex-wrap items-center justify-center gap-4 px-2 pb-3 sm:pb-0">
        {/* 1. HOME SANCTUARY FRAME */}
        <section
          aria-label="Pet Sanctuary"
          className={`relative ${frameSizeClass} rounded-[36px] border-[3px] border-[#DFCBBF] shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFFDF9] ${
            mobileScreen === 'sanctuary' ? 'block' : 'hidden'
          } ${showSanctuaryOnDesktop ? 'lg:block' : 'lg:hidden'}`}
        >
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
            onCarePet={handleCarePet}
            onFeedPet={handleFeedPet}
            onPlayToy={handlePlayToy}
            onTapClover={handleTapClover}
            onOpenFarm={openFarmScreen}
            onOpenModal={(m) => openModalIn('sanctuary', m)}
            onQuickCoins={() => openModalIn('sanctuary', 'shop')}
            onQuickEnergy={() => setEnergy((e) => Math.min(maxEnergy, e + 5))}
          />
          {renderCreamSheets('sanctuary')}
        </section>

        {/* 2. MY CROP FARM FRAME */}
        <section
          aria-label="My Crop Farm"
          className={`relative ${frameSizeClass} rounded-[36px] border-[3px] border-[#DFCBBF] shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFFDF9] ${
            mobileScreen === 'farm' ? 'block' : 'hidden'
          } ${showFarmOnDesktop ? 'lg:block' : 'lg:hidden'}`}
        >
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
          />
          {renderCreamSheets('farm')}
        </section>

        {/* 3. VISITING NEIGHBOR GARDEN FRAME (Separate Screen) */}
        <section
          aria-label="Visit Neighbor Garden"
          className={`relative ${frameSizeClass} rounded-[36px] border-[3px] border-[#DFCBBF] shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFFDF9] ${
            mobileScreen === 'neighborGarden' ? 'block' : 'hidden'
          } ${showNeighborGardenOnDesktop ? 'lg:block' : 'lg:hidden'}`}
        >
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
            onQuickEnergy={() => setEnergy((e) => Math.min(maxEnergy, e + 5))}
            onNeighborPat={handleNeighborPat}
            onNeighborGift={handleNeighborGift}
          />
          {renderCreamSheets('neighborGarden')}
        </section>

        {/* 4. VISITING NEIGHBOR FARM FRAME (Only shown when visiting a player's garden) */}
        {visitingNeighbor && (
          <section
            aria-label={`${visitingNeighbor.ownerName}'s Crop Farm`}
            className={`relative ${frameSizeClass} rounded-[36px] border-[3px] border-[#DFCBBF] shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFFDF9] ${
              mobileScreen === 'neighborFarm' ? 'block' : 'hidden'
            } ${showNeighborFarmOnDesktop ? 'lg:block' : 'lg:hidden'}`}
          >
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
              onQuickEnergy={() => setEnergy((e) => Math.min(maxEnergy, e + 5))}
              onWaterNeighborPlot={handleWaterNeighborPlot}
              onWaterNeighborTree={handleWaterNeighborTree}
              onGiftNeighbor={handleGiftNeighborById}
            />
            {renderCreamSheets('neighborFarm')}
          </section>
        )}

        {/* 5. AI PHOTO JUDGE FRAME */}
        <section
          aria-label="AI Photo Judge Card"
          className={`relative ${frameSizeClass} rounded-[36px] border-[3px] border-[#E8CFD9] shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFF5F8] ${
            mobileScreen === 'judge' ? 'block' : 'hidden'
          } ${showJudgeOnDesktop ? 'lg:block' : 'lg:hidden'}`}
        >
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
            onQuickEnergy={() => setEnergy((e) => Math.min(maxEnergy, e + 5))}
            onCropIntoSanctuary={handleCropIntoSanctuary}
            onMintPet={handleMintPet}
            onShareSnap={handleShareSnap}
            onUploadPhoto={handleUploadPhoto}
            onResetSample={() => {
              setActiveReport(SAMPLE_PUPPY_REPORT);
              setJudgeError(null);
            }}
          />
          {renderCreamSheets('judge')}
        </section>
      </div>
    </div>
  );
}
