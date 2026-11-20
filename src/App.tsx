import React, { useCallback, useEffect, useState } from 'react';
import { Home, Settings } from 'lucide-react';
import {
  CropPlot,
  CropType,
  DailyLimits,
  FirstBondQuestState,
  FirstBondQuestStatus,
  FoodItemType,
  GardenToy,
  HatTransform,
  JourneyPhase,
  JudgeReport,
  KeeperAuthUser,
  KeeperServerState,
  MarketListing,
  MintedPassportRecord,
  NeighborGarden,
  OrchardTree,
  PetSpecies,
  SanctuaryPet,
  ShopItem,
  WalletInfo,
  Web3ConfigStatus,
} from './types';
import { FIRST_BOND_QUEST_REWARD } from './shared/gameMeta';
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
import { DiscoverCameraModal } from './components/camera/DiscoverCameraModal';
import { IpfsConsentModal } from './components/IpfsConsentModal';
import { processedCache, processCutoutImage } from './components/CroppedPetCutout';
import { DailyMissionsModal, DailyMissionKind, DailyMissionsState, rollDailyMissions } from './components/DailyMissionsModal';
import { StreakCalendarModal, StreakMilestone, STREAK_MILESTONES, getLocalDateKey } from './components/StreakCalendarModal';
import { PetMemoryModal, PetMemoryReward } from './components/PetMemoryModal';
import { StartScreen } from './components/StartScreen';
import { AppSettingsModal } from './components/AppSettingsModal';
import { PetProfileModal } from './components/PetProfileModal';
import { PassportMintModal } from './components/PassportMintModal';
import { FirstBondQuestModal } from './components/FirstBondQuestModal';
import { WalletConnectModal } from './components/WalletConnectModal';
import { DailyMissionsHudProvider, SkyThemeProvider, UiLabelsProvider } from './components/SharedHud';
import { getTimeOfDayTheme, TimeOfDayTheme, TIME_OF_DAY_PALETTES } from './utils/timeOfDay';
import { playCameraSound, playCoinSound, playHappySound, playTapSound, playVictorySound, setAudioEnabled } from './utils/appAudio';
import { shortenAddress, computeBondLevel, isPetPassportEligible, getSnowtraceTxUrl } from './services/pawsApi';
import {
  checkRedirectResult,
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  signOutKeeper,
  subscribeToAuth,
} from './lib/firebase';
import {
  apiAddToGarden,
  apiCarePet,
  apiClaimFirstBondQuest,
  apiConfirmMint,
  apiGameAction,
  apiJudgePhoto,
  apiMergeGuestIntoKeeper,
  apiReconcilePet,
  apiRequestMintClaim,
  apiRequestWalletNonce,
  apiUnlinkWallet,
  apiVerifyWalletSignature,
  fetchKeeperState,
  fetchWeb3Status,
  getStoredGuestToken,
  initGuestSession,
  setStoredGuestToken,
} from './lib/api';
import {
  clearDemoWallet,
  connectInjectedWallet,
  ensureFujiNetwork,
  executeFujiMintTx,
  formatEvmChainName,
  getBrowserWalletState,
  signChallengeMessage,
  subscribePreferredWalletEvents,
} from './lib/walletClient';
import {
  applyLocalPetCareUpdate,
  resolveSelectedPetId,
  resolveTargetPet,
} from './lib/petInteractions';

const INITIAL_PETS: SanctuaryPet[] = [
  {
    id: 'pet-calico',
    name: 'Mochi',
    species: 'cat',
    photoUrl: '/src/assets/images/cropped_calico_cat_1794637541476.png',
    cutoutMode: 'studio',
    x: 34,
    y: 50,
    needsCare: 'heart',
    score: 94,
    bondXp: 65,
    careCount: 3,
  },
  {
    id: 'pet-retriever',
    name: 'Sunny',
    species: 'dog',
    photoUrl: '/src/assets/images/cropped_golden_dog_1794637542709.png',
    cutoutMode: 'studio',
    x: 63,
    y: 45,
    flip: true,
    score: 91,
    bondXp: 40,
    careCount: 2,
  },
  {
    id: 'pet-bunny',
    name: 'Pip',
    species: 'bunny',
    photoUrl: '/src/assets/images/cropped_fluffy_bunny_1794637542800.png',
    cutoutMode: 'studio',
    x: 50,
    y: 62,
    score: 88,
    bondXp: 25,
    careCount: 1,
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

function buildInitialNeighbors(): NeighborGarden[] {
  return [
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
          photoUrl: '/src/assets/images/lured_stray_corgi_1794627550798.png',
          cutoutMode: 'studio',
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
}

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

const INITIAL_PASSPORTS: MintedPassportRecord[] = [
  {
    tokenId: '#001',
    petId: 'n-maya-shiba',
    petName: 'Kibo',
    species: 'shiba',
    imageUrl: '/src/assets/images/neighbor_shiba_dog_1794722670611.jpg',
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
    imageUrl: '/src/assets/images/neighbor_samoyed_pup_1794722672155.jpg',
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
    mintedAt: '2026-11-10',
    aiScore: 92,
    pose: 'Playful',
  },
];

type ScreenView =
  | 'sanctuary'
  | 'farm'
  | 'neighborGarden'
  | 'neighborFarm'
  | 'judge'
  | 'gallery';

async function prepareImageForJudge(file: File): Promise<{
  dataUrl: string;
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}> {
  return new Promise((resolve) => {
    const fallbackReader = () => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawUrl = String(reader.result || '');
        const [header, b64] = rawUrl.split(',');
        const mimeMatch = header.match(/data:(.*?);base64/);
        const mimeType = (mimeMatch ? mimeMatch[1] : 'image/jpeg') as
          | 'image/jpeg'
          | 'image/png'
          | 'image/webp';
        resolve({ dataUrl: rawUrl, base64: b64, mimeType });
      };
      reader.onerror = () => {
        resolve({ dataUrl: '', base64: '', mimeType: 'image/jpeg' });
      };
      reader.readAsDataURL(file);
    };

    if (typeof window === 'undefined' || !window.Image) {
      fallbackReader();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 960;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim || file.size > 300 * 1024) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        fallbackReader();
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Quality 0.80 generates ~60KB - 110KB JPEG: ultra-fast upload & lightweight memory
      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.80);
      const [, b64] = optimizedDataUrl.split(',');
      resolve({
        dataUrl: optimizedDataUrl,
        base64: b64,
        mimeType: 'image/jpeg',
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fallbackReader();
    };
    img.src = objectUrl;
  });
}

export default function App() {
  const [desktopMode, setDesktopMode] = useState<ScreenView>('sanctuary');
  const [mobileScreen, setMobileScreen] = useState<ScreenView>('sanctuary');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const [coins, setCoins] = useState(12560);
  const [energy, setEnergy] = useState(45);
  const maxEnergy = 50;
  const [level, setLevel] = useState(12);
  const [expPercent, setExpPercent] = useState(64);
  const [streakDays, setStreakDays] = useState(7);
  const [fenceHours, setFenceHours] = useState(14);
  const [theme] = useState('Fluffy Tails');

  const [pets, setPets] = useState<SanctuaryPet[]>(INITIAL_PETS);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(
    INITIAL_PETS[0].id
  );
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

  const [neighbors, setNeighbors] = useState<NeighborGarden[]>(buildInitialNeighbors);
  const [visitingId, setVisitingId] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<SanctuaryModalType>(null);
  const [modalTarget, setModalTarget] = useState<ScreenView>('sanctuary');
  const [luredRescued, setLuredRescued] = useState(false);
  const [activeBait, setActiveBait] = useState<string | null>(null);

  const [activeReport, setActiveReport] = useState<JudgeReport>(SAMPLE_PUPPY_REPORT);
  const [album, setAlbum] = useState<JudgeReport[]>([SAMPLE_PUPPY_REPORT]);
  const [isJudging, setIsJudging] = useState(false);
  const [judgeError, setJudgeError] = useState<string | null>(null);

  // Auth, Cloud SQL Sync (Guest + Keeper), Quest & Avalanche Fuji Web3 State
  const [authUser, setAuthUser] = useState<KeeperAuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestSessionReady, setGuestSessionReady] = useState(false);
  const [firstBondQuest, setFirstBondQuest] = useState<FirstBondQuestStatus>({
    claimed: false,
    claimedAt: null,
    claimedPetUid: null,
    rewardCoins: FIRST_BOND_QUEST_REWARD.COINS,
    rewardExp: FIRST_BOND_QUEST_REWARD.EXP,
    minBondXp: FIRST_BOND_QUEST_REWARD.MIN_BOND_XP,
  });
  const [linkedWallet, setLinkedWallet] = useState<WalletInfo | null>(null);
  const [browserWallet, setBrowserWallet] = useState<{
    available: boolean;
    address: string | null;
    chainId: number | null;
    providerName: string;
    isCoreWallet: boolean;
  }>({
    available: false,
    address: null,
    chainId: null,
    providerName: 'None',
    isCoreWallet: false,
  });
  const [web3Status, setWeb3Status] = useState<Web3ConfigStatus | null>(null);
  const [profileBusy, setProfileBusy] = useState<string | null>(null);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintNotice, setMintNotice] = useState<string | null>(null);

  const [appPhase, setAppPhase] = useState<'start' | 'playing'>('start');
  const [skyTheme, setSkyTheme] = useState<TimeOfDayTheme>(() => getTimeOfDayTheme());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTextLabels, setShowTextLabels] = useState(false);
  const [lastCheckInDate, setLastCheckInDate] = useState<string | null>(getLocalDateKey());
  const [claimedStreakMilestones, setClaimedStreakMilestones] = useState<number[]>([3]);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [missionsModalOpen, setMissionsModalOpen] = useState(false);
  const [dailyMissions, setDailyMissions] = useState<DailyMissionsState>(() => rollDailyMissions(getLocalDateKey()));
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [settingsModal, setSettingsModal] = useState<{ open: boolean; tab: 'settings' | 'guide' }>({ open: false, tab: 'settings' });
  const [profileModalState, setProfileModalState] = useState<{ open: boolean; mode: 'welcome' | 'profile'; petId: string | null }>({ open: false, mode: 'profile', petId: null });
  const [mintModalPetId, setMintModalPetId] = useState<string | null>(null);
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [passports, setPassports] = useState<MintedPassportRecord[]>(INITIAL_PASSPORTS);

  useEffect(() => {
    setAudioEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const syncTimeOfDay = () => {
      const next = getTimeOfDayTheme();
      setSkyTheme((prev) => (prev === next ? prev : next));
    };
    const timer = window.setInterval(syncTimeOfDay, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncTimeOfDay();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const applyKeeperServerState = useCallback((state: KeeperServerState) => {
    setCoins(state.user.coins);
    setEnergy(state.user.energy);
    setLevel(state.user.level);
    setExpPercent(state.user.expPercent);
    setStreakDays(state.user.streakDays);
    setFenceHours(state.user.fenceHours);
    setWaterCharges(state.user.waterCharges);
    setLuredRescued(state.user.luredRescued);
    setActiveBait(state.user.activeBait);
    setLimits(state.user.limits);
    setSeedInventory(state.user.seedInventory);
    setFoodInventory(state.user.foodInventory);
    setCropPlots(state.user.farmPlots);
    setTrees(state.user.orchardTrees);
    setMarketListings(state.user.marketListings);
    setShopItems(
      INITIAL_SHOP.map((s) => ({
        ...s,
        owned:
          s.kind === 'accessory'
            ? state.user.ownedShopItems.includes(s.id)
            : false,
      }))
    );
    setToys(
      INITIAL_TOYS.map((t) => ({
        ...t,
        owned: state.user.ownedToys.includes(t.id),
      }))
    );
    setPets(
      state.pets.map((p) => {
        const cached =
          (p.petUid && processedCache.get(p.petUid)) ||
          (p.id && processedCache.get(p.id)) ||
          processedCache.get(p.photoUrl) ||
          processedCache.get(`auto:${p.photoUrl}`) ||
          processedCache.get(`studio:${p.photoUrl}`);
        if (cached) {
          return { ...p, photoUrl: cached, cutoutMode: 'studio' };
        }
        return p;
      })
    );
    setSelectedPetId((cur) => resolveSelectedPetId(state.pets, cur));
    setFirstBondQuest(state.firstBondQuest);
    setLinkedWallet(state.wallet);

    // Apply server neighbor progress cleanly onto initial neighbors
    const nState = state.user.neighborStates || {};
    setNeighbors(
      buildInitialNeighbors().map((n) => {
        const saved = nState[n.id];
        if (!saved) return n;
        const bought = saved.boughtIds || [];
        return {
          ...n,
          patsUsed: saved.patsUsed ?? n.patsUsed,
          gifted: saved.gifted ?? n.gifted,
          waterHelpsUsed: saved.waterHelpsUsed ?? n.waterHelpsUsed,
          marketStock: n.marketStock.map((m) =>
            bought.includes(m.id) ? { ...m, sold: true } : m
          ),
        };
      })
    );

    const serverAlbum =
      state.album.length > 0 ? state.album : [SAMPLE_PUPPY_REPORT];
    setAlbum(serverAlbum);
    setActiveReport((cur) => {
      const updated = serverAlbum.find(
        (a) =>
          (a.submissionUid && a.submissionUid === cur.submissionUid) ||
          a.id === cur.id
      );
      return updated ?? cur;
    });
  }, []);

  const refreshBrowserWallet = useCallback(async () => {
    try {
      const bw = await getBrowserWalletState();
      setBrowserWallet(bw);
    } catch {
      // ignore passive browser wallet read error
    }
  }, []);

  useEffect(() => {
    fetchWeb3Status()
      .then((status) => setWeb3Status(status))
      .catch(() => {});
    refreshBrowserWallet();

    const unsubWallet = subscribePreferredWalletEvents(() => {
      refreshBrowserWallet();
    });

    const isRedirectPending =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('paws_auth_redirect_pending') === '1';

    if (isRedirectPending) {
      setAuthLoading(true);
      setProfileBusy('auth');
    }

    checkRedirectResult()
      .then((user) => {
        if (user) {
          setProfileFeedback({
            type: 'ok',
            text: 'Signed in & Cloud Sanctuary synced ✓',
          });
        }
      })
      .catch((err) => {
        setProfileFeedback({
          type: 'err',
          text: err instanceof Error ? err.message : 'Google Sign-In failed.',
        });
      })
      .finally(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('paws_auth_redirect_pending');
        }
        setProfileBusy(null);
      });

    const unsubAuth = subscribeToAuth(async (firebaseUser) => {
      setAuthLoading(false);
      if (firebaseUser) {
        setAuthUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName:
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            'Keeper',
          photoURL: firebaseUser.photoURL || undefined,
        });
        try {
          const state = getStoredGuestToken()
            ? (await apiMergeGuestIntoKeeper()).state
            : await fetchKeeperState();
          setGuestSessionReady(true);
          applyKeeperServerState(state);
        } catch (err) {
          console.error('Failed to hydrate Keeper state:', err);
        }
      } else {
        setAuthUser(null);
        setLinkedWallet(null);
        try {
          const { state } = await initGuestSession();
          setGuestSessionReady(true);
          applyKeeperServerState(state);
        } catch (err) {
          console.error('Failed to initialize guest session:', err);
        }
      }
    });

    return () => {
      unsubAuth();
      unsubWallet();
    };
  }, [applyKeeperServerState, refreshBrowserWallet]);

  const visitingNeighbor =
    neighbors.find((n) => n.id === visitingId) ?? null;

  const openModalIn = (target: ScreenView, modal: SanctuaryModalType) => {
    setProfileFeedback(null);
    if (modal === 'snap') {
      setIsCameraModalOpen(true);
      return;
    }
    setModalTarget(target);
    setActiveModal(modal);
  };

  const openGalleryScreen = () => {
    setActiveModal(null);
    setMobileScreen('gallery');
    setDesktopMode('gallery');
  };

  const hasServerSession = Boolean(authUser || guestSessionReady);

  // Helper to persist server-authoritative game actions cleanly for both Guests & Keepers
  const syncKeeperCall = useCallback(
    (promise: Promise<{ state: KeeperServerState }>) => {
      promise
        .then((res) => {
          applyKeeperServerState(res.state);
        })
        .catch((err) => {
          console.error('Server sync failed:', err);
          fetchKeeperState()
            .then(applyKeeperServerState)
            .catch(() => {});
        });
    },
    [applyKeeperServerState]
  );

  const recordMissionProgress = (kind: DailyMissionKind, delta = 1) => {
    const today = getLocalDateKey();
    setDailyMissions((prev) => {
      const base = prev.dateKey === today ? prev : rollDailyMissions(today);
      let changed = false;
      const nextMissions = base.missions.map((m) => {
        if (m.kind !== kind || m.progress >= m.target) return m;
        changed = true;
        return { ...m, progress: Math.min(m.target, m.progress + delta) };
      });
      if (!changed && base === prev) return prev;
      return { ...base, missions: nextMissions };
    });
  };

  const hasClaimableDailyMission =
    dailyMissions.missions.some((m) => !m.claimed && m.progress >= m.target) ||
    (!dailyMissions.bonusClaimed &&
      dailyMissions.missions.every((m) => m.claimed));

  const checkedInToday = lastCheckInDate === getLocalDateKey();

  const handleDailyCheckIn = () => {
    const key = getLocalDateKey();
    if (lastCheckInDate === key) return;
    playVictorySound();
    setLastCheckInDate(key);
    setStreakDays((d) => d + 1);
    setCoins((c) => c + 50);
    setFenceHours((h) => Math.min(48, h + 12));
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('daily_checkin', {}));
    }
  };

  const handleClaimStreakMilestone = (milestone: StreakMilestone) => {
    if (
      streakDays < milestone.day ||
      claimedStreakMilestones.includes(milestone.day)
    ) {
      return;
    }
    playVictorySound();
    setClaimedStreakMilestones((prev) => [...prev, milestone.day]);
    setCoins((c) => c + milestone.coins);
    if (milestone.energy) {
      setEnergy((e) => Math.min(maxEnergy, e + milestone.energy!));
    }
    if (milestone.berrySeeds) {
      setSeedInventory((inv) => ({
        ...inv,
        berry: inv.berry + milestone.berrySeeds!,
      }));
    }
  };

  const handleClaimDailyMission = (missionId: string) => {
    const target = dailyMissions.missions.find((m) => m.id === missionId);
    if (!target || target.claimed || target.progress < target.target) return;
    playVictorySound();
    setDailyMissions((prev) => ({
      ...prev,
      missions: prev.missions.map((m) =>
        m.id === missionId ? { ...m, claimed: true } : m
      ),
    }));
    setCoins((c) => c + target.coins);
    awardExp(target.xp);
  };

  const handleClaimDailyMissionBonus = () => {
    if (
      dailyMissions.bonusClaimed ||
      !dailyMissions.missions.every((m) => m.claimed)
    ) {
      return;
    }
    playVictorySound();
    setDailyMissions((prev) => ({ ...prev, bonusClaimed: true }));
    setCoins((c) => c + 200);
    setEnergy((e) => Math.min(maxEnergy, e + 10));
  };

  const handleRerollDailyMissions = () => {
    playTapSound();
    setDailyMissions(rollDailyMissions(getLocalDateKey()));
  };

  const handleJumpToMission = (kind: DailyMissionKind) => {
    playTapSound();
    setMissionsModalOpen(false);
    if (kind === 'pet' || kind === 'feed' || kind === 'play') {
      openSanctuaryScreen();
      if (pets[0]) {
        setProfileModalState({
          open: true,
          mode: 'profile',
          petId: pets[0].id,
        });
      }
      return;
    }
    if (kind === 'water' || kind === 'harvest') {
      openFarmScreen();
      return;
    }
    if (kind === 'visit') {
      openNeighborGardenScreen();
      return;
    }
    if (kind === 'memory') {
      openSanctuaryScreen();
      setMemoryModalOpen(true);
    }
  };

  const handleClaimMemoryReward = (reward: PetMemoryReward) => {
    playVictorySound();
    recordMissionProgress('memory', 1);
    setCoins((c) => c + reward.coins);
    awardExp(12);
    setPets((prev) =>
      prev.map((pet) => {
        const nextXp = (pet.bondXp ?? 0) + reward.affectionXp;
        const nextEligible = isPetPassportEligible(nextXp);
        return {
          ...pet,
          bondXp: nextXp,
          bondLevel: computeBondLevel(nextXp),
          passportEligible: nextEligible,
          discoveryStatus: pet.minted
            ? 'Preserved On-Chain'
            : nextEligible
            ? 'Passport Ready'
            : pet.discoveryStatus,
        };
      })
    );
  };

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
      playHappySound();
      recordMissionProgress('feed', 1);
      return '🥣 +15 XP';
    }
    const ownedToy = toys.find((t) => t.owned) ?? toys[0];
    return handlePlayToy(ownedToy, petId);
  };

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
  };

  const handleJumpToJourneyPhase = (phase: JourneyPhase) => {
    setQuestModalOpen(false);
    if (phase === 'discover') {
      setActiveModal(null);
      setMobileScreen('judge');
      setDesktopMode('judge');
      return;
    }
    if (phase === 'welcome') {
      openSanctuaryScreen();
      return;
    }
    if (phase === 'care') {
      openSanctuaryScreen();
      if (pets[0]) {
        setProfileModalState({
          open: true,
          mode: 'profile',
          petId: pets[0].id,
        });
      }
      return;
    }
    if (phase === 'grow') {
      openFarmScreen();
      return;
    }
    if (phase === 'preserve') {
      openGalleryScreen();
      return;
    }
    if (phase === 'connect') {
      handleConnectAndVerifyWallet();
    }
  };

  const questDoneCount =
    (pets.length > 0 ? 1 : 0) +
    (pets.some((p) => (p.careCount ?? 0) >= 1) ? 1 : 0) +
    (pets.some((p) => (p.bondXp ?? 0) >= 40) ? 1 : 0);

  const questModalState: FirstBondQuestState = {
    welcomeDone: pets.length > 0,
    feedDone: pets.some((p) => (p.careCount ?? 0) >= 1),
    playDone: pets.some((p) => (p.bondXp ?? 0) >= 40),
    claimed: firstBondQuest.claimed,
    rewardXp: firstBondQuest.rewardExp ?? 100,
    targetPetId: firstBondQuest.claimedPetUid ?? pets[0]?.id,
    claimedAt: firstBondQuest.claimedAt ?? undefined,
  };

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
    : questModalState.welcomeDone
    ? 'care'
    : 'discover';

  const profileTargetPet =
    pets.find((p) => p.id === profileModalState.petId) ?? pets[0] ?? null;

  // Visiting neighbors periodically purchase unsold items in your Roadside Market
  useEffect(() => {
    const nextUnsold = marketListings.find((l) => !l.sold);
    if (!nextUnsold) return;

    const baseTotal = FOOD_META[nextUnsold.item].sellPrice * nextUnsold.qty;
    const delayMs = nextUnsold.price <= baseTotal * 1.15 ? 4200 : 8500;

    const timer = window.setTimeout(() => {
      if (hasServerSession) {
        syncKeeperCall(
          apiGameAction('mark_listing_sold', { listingId: nextUnsold.id })
        );
        return;
      }
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
  }, [marketListings, hasServerSession, syncKeeperCall]);

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

  // Petting with daily coin cap & server-authoritative Bond XP + per-pet quest flag
  const handleCarePet = (petId: string): string => {
    recordMissionProgress('pet', 1);
    const target = resolveTargetPet(pets, petId, selectedPetId);
    if (!target) return '';
    setSelectedPetId(target.id);
    setPets((prev) => applyLocalPetCareUpdate(prev, target.id, 'pet'));

    if (hasServerSession && target.petUid) {
      syncKeeperCall(
        apiCarePet({ petUid: target.petUid, actionType: 'pet' })
      );
    }

    if (limits.petCoinsUsed >= limits.petCoinsMax) {
      return '❤️ +15 Bond';
    }

    setLimits((prev) => ({ ...prev, petCoinsUsed: prev.petCoinsUsed + 1 }));
    setCoins((c) => c + 15);
    awardExp(6);
    return '+15 🪙 · +15 Bond';
  };

  // Feeding harvested crops/fruits with daily coin cap & Bond XP + per-pet quest flag
  const handleFeedPet = (food: FoodItemType, petId?: string): string => {
    if (foodInventory[food] <= 0) return 'No food';
    const target = resolveTargetPet(pets, petId, selectedPetId);
    if (!target) return '';

    recordMissionProgress('feed', 1);
    setSelectedPetId(target.id);
    setFoodInventory((prev) => ({ ...prev, [food]: prev[food] - 1 }));
    setPets((prev) => applyLocalPetCareUpdate(prev, target.id, 'feed'));

    if (hasServerSession && target.petUid) {
      syncKeeperCall(
        apiCarePet({ petUid: target.petUid, actionType: 'feed', food })
      );
    }

    if (limits.feedCoinsUsed >= limits.feedCoinsMax) {
      awardExp(10);
      return `${FOOD_META[food].icon} +25 Bond`;
    }

    setLimits((prev) => ({
      ...prev,
      feedCoinsUsed: prev.feedCoinsUsed + 1,
    }));
    setCoins((c) => c + 25);
    awardExp(12);
    return `${FOOD_META[food].icon} +25 🪙`;
  };

  const handlePlayToy = (toy: GardenToy, petId?: string): string => {
    const target = resolveTargetPet(pets, petId, selectedPetId);
    if (!target) return '';

    recordMissionProgress('play', 1);
    setSelectedPetId(target.id);
    setPets((prev) => applyLocalPetCareUpdate(prev, target.id, 'play'));

    if (hasServerSession && target.petUid) {
      syncKeeperCall(
        apiCarePet({
          petUid: target.petUid,
          actionType: 'play',
          toyId: toy.id,
        })
      );
    }

    if (limits.playCoinsUsed >= limits.playCoinsMax) {
      return `${toy.icon} +20 Bond`;
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
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('tap_clover'));
    }
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
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('refill_water'));
    }
    setWaterCharges(maxWater);
    return '💧 Full!';
  };

  const handleBuySeed = (crop: CropType): string => {
    const cost = FOOD_META[crop].seedCost ?? 15;
    if (coins < cost) return 'Need Coins';
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('buy_seed', { crop }));
    }
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

      if (hasServerSession) {
        syncKeeperCall(apiGameAction('tap_plot', { plotId, activeSeed }));
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
      recordMissionProgress('harvest', 1);
      const harvestedCrop = plot.crop;
      if (hasServerSession) {
        syncKeeperCall(apiGameAction('tap_plot', { plotId, activeSeed }));
      }
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
      recordMissionProgress('water', 1);
      if (hasServerSession) {
        syncKeeperCall(apiGameAction('tap_plot', { plotId, activeSeed }));
      }
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
      recordMissionProgress('harvest', 1);
      if (hasServerSession) {
        syncKeeperCall(apiGameAction('tap_tree', { treeId }));
      }
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
      recordMissionProgress('water', 1);
      if (hasServerSession) {
        syncKeeperCall(apiGameAction('tap_tree', { treeId }));
      }
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

    if (hasServerSession) {
      syncKeeperCall(
        apiGameAction('list_market', {
          item,
          qty: safeQty,
          price: Math.max(1, Math.round(price)),
        })
      );
    }

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
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('cancel_market', { listingId }));
    }
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
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('collect_market', { listingId }));
    }
    setCoins((c) => c + target.price);
    setMarketListings((prev) => prev.filter((l) => l.id !== listingId));
    return `+${target.price} 🪙`;
  };

  const handleBuyToy = (toy: GardenToy) => {
    if (toy.owned || coins < toy.cost) return;
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('buy_toy', { toyId: toy.id }));
    }
    setCoins((c) => c - toy.cost);
    setToys((prev) =>
      prev.map((t) => (t.id === toy.id ? { ...t, owned: true } : t))
    );
  };

  const handleBuyItem = (item: ShopItem) => {
    if (coins < item.cost) return;
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('buy_shop_item', { itemId: item.id }));
    }
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
    const target = pets.find((p) => p.id === petId);
    if (hasServerSession && target?.petUid) {
      syncKeeperCall(
        apiGameAction('equip_accessory', {
          petUid: target.petUid,
          accessoryId,
        })
      );
    }
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
    if (hasServerSession) {
      syncKeeperCall(
        apiGameAction('neighbor_pat', { neighborId: visitingNeighbor.id })
      );
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
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('neighbor_gift', { neighborId }));
    }
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
    recordMissionProgress('water', 1);
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

    if (hasServerSession) {
      syncKeeperCall(apiGameAction('neighbor_water', { neighborId }));
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
    recordMissionProgress('water', 1);
    const neighbor = neighbors.find((n) => n.id === neighborId);
    const tree = neighbor?.farmTrees.find((t) => t.id === treeId);
    if (!neighbor || !tree) return '';
    if (Date.now() >= tree.readyAt) return `${FOOD_META[tree.fruit].icon} Ready!`;
    if (tree.watered) return '💧 Watered';
    if (neighbor.waterHelpsUsed >= neighbor.maxWaterHelps) {
      return '💧 Daily Max';
    }

    if (hasServerSession) {
      syncKeeperCall(apiGameAction('neighbor_water', { neighborId }));
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

    if (hasServerSession) {
      syncKeeperCall(
        apiGameAction('neighbor_buy', { neighborId, listingId })
      );
    }
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
    setDesktopMode('farm');
  };

  const openSanctuaryScreen = () => {
    setActiveModal(null);
    setMobileScreen('sanctuary');
    setDesktopMode('sanctuary');
  };

  const openNeighborGardenScreen = () => {
    setActiveModal(null);
    setMobileScreen('neighborGarden');
    setDesktopMode('neighborGarden');
  };

  const openNeighborFarmScreen = () => {
    if (!visitingNeighbor) return;
    setActiveModal(null);
    setMobileScreen('neighborFarm');
    setDesktopMode('neighborFarm');
  };

  const handleVisitNeighbor = (neighborId: string) => {
    recordMissionProgress('visit', 1);
    setVisitingId(neighborId);
    setActiveModal(null);
    setMobileScreen('neighborGarden');
    setDesktopMode('neighborGarden');
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
    setMintNotice(null);
    setActiveModal(null);
    setMobileScreen('judge');
    setDesktopMode('judge');
  };

  const handleUseSampleSnap = () => {
    setActiveReport(SAMPLE_PUPPY_REPORT);
    setJudgeError(null);
    setMintNotice(null);
    setActiveModal(null);
    setMobileScreen('judge');
    setDesktopMode('judge');
  };

  const handleCropIntoSanctuary = async () => {
    if (isJudging || judgeError || activeReport.unjudged) return;
    if (!activeReport.cropped) {
      // 1. Ensure transparent cutout is ready before adding to sanctuary garden
      let cutoutUrl =
        processedCache.get(activeReport.photoUrl) ||
        processedCache.get(`auto:${activeReport.photoUrl}`) ||
        processedCache.get(`studio:${activeReport.photoUrl}`);

      if (!cutoutUrl) {
        try {
          const res = await processCutoutImage(
            activeReport.photoUrl,
            'auto',
            activeReport.box_2d
          );
          if (res && !res.isSilhouette) {
            cutoutUrl = res.url;
          }
        } catch {
          // fallback to silhouette/original
        }
      }

      if (cutoutUrl) {
        processedCache.set(activeReport.photoUrl, cutoutUrl);
        processedCache.set(`studio:${activeReport.photoUrl}`, cutoutUrl);
        processedCache.set(`auto:${activeReport.photoUrl}`, cutoutUrl);
        processedCache.set(cutoutUrl, cutoutUrl);
      }

      if (hasServerSession && activeReport.submissionUid) {
        try {
          const { result, state } = await apiAddToGarden(
            activeReport.submissionUid,
            cutoutUrl
          );
          if (cutoutUrl && result.petUid) {
            processedCache.set(result.petUid, cutoutUrl);
            processedCache.set(`studio:${result.petUid}`, cutoutUrl);
            processedCache.set(`auto:${result.petUid}`, cutoutUrl);
            processedCache.set(cutoutUrl, cutoutUrl);
          }
          applyKeeperServerState(state);
          setSelectedPetId(result.petUid);
          setActiveReport((r) => ({
            ...r,
            cropped: true,
            petUid: result.petUid,
          }));
          openSanctuaryScreen();
          return;
        } catch (err) {
          setJudgeError(
            err instanceof Error ? err.message : 'Could not add pet to garden.'
          );
          return;
        }
      }

      setCoins((c) => c + activeReport.coinsReward);
      awardExp(Math.round(activeReport.expReward / 2));
      setFenceHours(24);
      setEnergy((e) => Math.max(0, e - 5));

      const finalPhoto = cutoutUrl || activeReport.photoUrl;
      const newPet: SanctuaryPet = {
        id: `cropped-${activeReport.id}`,
        name: activeReport.petName,
        species: mapSpecies(activeReport.species),
        photoUrl: finalPhoto,
        cutoutMode: cutoutUrl ? 'studio' : 'auto',
        x: 48,
        y: 52,
        score: activeReport.overallScore,
        bondXp: 15,
        careCount: 0,
        minted: false,
        box_2d: activeReport.box_2d,
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

  // Real Fuji Mint Flow (EIP-712 claim -> Fuji contract tx -> Receipt & Event verification)
  const [pendingConsentPet, setPendingConsentPet] = useState<SanctuaryPet | null>(null);

  const mintPassportByPetUid = async (
    petUid: string,
    consent?: { accepted: boolean; consentVersion: string }
  ): Promise<boolean> => {
    if (!authUser) {
      const msg = 'Sign in with Google inside Keeper Profile first.';
      setMintNotice(msg);
      setProfileFeedback({ type: 'err', text: msg });
      return false;
    }
    if (!linkedWallet) {
      const msg = 'Connect and verify your Avalanche Fuji wallet in Keeper Profile.';
      setMintNotice(msg);
      setProfileFeedback({ type: 'err', text: msg });
      return false;
    }
    if (web3Status && !web3Status.readyForMint) {
      const msg = `Fuji contract not configured yet (missing: ${web3Status.missingConfig.join(', ')}).`;
      setMintNotice(msg);
      setProfileFeedback({ type: 'err', text: msg });
      return false;
    }

    setIsMinting(true);
    setProfileBusy(`mint-${petUid}`);
    setMintNotice('Requesting signed mint claim from server...');
    setProfileFeedback(null);

    try {
      const { contractAddress, claim } = await apiRequestMintClaim(petUid, consent);
      setMintNotice('Confirm Pet Passport mint in your Fuji wallet...');
      const txHash = await executeFujiMintTx({
        contractAddress,
        recipient: claim.recipient,
        petId: claim.petId,
        petName: claim.petName,
        species: claim.species,
        score: claim.score,
        tokenURI: claim.tokenURI || claim.metadataUri,
        petIdHash: claim.petIdHash,
        metadataUri: claim.metadataUri,
        nonce: claim.nonce,
        deadline: claim.deadline,
        signature: claim.signature,
      });

      setMintNotice('Verifying Avalanche Fuji receipt & PetMinted event...');
      const { confirmation, state } = await apiConfirmMint(petUid, txHash);
      applyKeeperServerState(state);
      const okMsg = `Minted Pet Passport #${confirmation.tokenId} on Avalanche Fuji ✓`;
      setMintNotice(okMsg);
      setProfileFeedback({ type: 'ok', text: okMsg });
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Fuji minting did not complete.';
      setMintNotice(msg);
      setProfileFeedback({ type: 'err', text: msg });
      return false;
    } finally {
      setIsMinting(false);
      setProfileBusy(null);
    }
  };

  const linkedPetForActiveReport = activeReport.petUid
    ? pets.find((p) => p.petUid === activeReport.petUid) ?? null
    : null;

  const handleMintPet = async () => {
    setMintNotice(null);
    if (!authUser) {
      setMintNotice('Sign in with Google inside Keeper Profile to unlock Pet Passports.');
      openModalIn('judge', 'profile');
      return;
    }
    if (!activeReport.cropped || !linkedPetForActiveReport?.petUid) {
      setMintNotice('Tap "Add to Garden" first to create this pet’s Passport.');
      return;
    }
    const elig = linkedPetForActiveReport.eligibility;
    if (elig && !elig.eligible) {
      if (!elig.scoreMet) {
        setMintNotice(`Needs AI Score ${elig.minScore}+ (this snap scored ${elig.currentScore}).`);
      } else {
        setMintNotice(
          `Build ${elig.minBondXp} Bond XP by petting/feeding/playing in Yard (${elig.currentBondXp}/${elig.minBondXp}).`
        );
      }
      return;
    }
    if (!linkedWallet) {
      setMintNotice('Verify your Avalanche Fuji wallet inside Keeper Profile first.');
      openModalIn('judge', 'profile');
      return;
    }
    setPendingConsentPet(linkedPetForActiveReport);
  };

  const handleRequestMintFromProfile = (petUid: string) => {
    const targetPet = pets.find((p) => p.petUid === petUid);
    if (!targetPet) return;
    setPendingConsentPet(targetPet);
  };

  const handleShareSnap = () => {
    const shareSummary = `🐾 ${activeReport.petName} · ${activeReport.overallScore}/100`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareSummary).catch(() => {});
    }
  };

  const handleUploadPhoto = async (file: File) => {
    setJudgeError(null);
    setMintNotice(null);
    setIsJudging(true);
    setActiveModal(null);
    setMobileScreen('judge');
    setDesktopMode('judge');

    try {
      const { dataUrl, base64, mimeType } = await prepareImageForJudge(file);

      // Pre-warm background removal concurrently in the background while Gemini judges
      void processCutoutImage(dataUrl, 'auto');

      setActiveReport({
        id: `pending-${Date.now()}`,
        submissionUid: undefined,
        petUid: null,
        photoUrl: dataUrl,
        theme,
        overallScore: 0,
        verdict: 'UNJUDGED',
        tierLabel: 'Pending AI',
        sharp: 0,
        light: 0,
        species: 'Photo',
        pose: 'Pending',
        themeScore: 0,
        themeMatch: false,
        petName: 'Uploaded Photo',
        coinsReward: 0,
        expReward: 0,
        cropped: false,
        minted: false,
        unjudged: true,
      });

      const payload = await apiJudgePhoto({
        imageBase64: base64,
        mimeType,
        theme,
      });

      const judgedReport: JudgeReport = {
        id: String(payload.id || `report-${Date.now()}`),
        submissionUid:
          typeof payload.submissionUid === 'string'
            ? payload.submissionUid
            : undefined,
        petUid: null,
        photoUrl: String(payload.photoUrl || dataUrl),
        theme: String(payload.theme || theme),
        overallScore: Number(payload.overallScore ?? 85),
        verdict: String(payload.verdict ?? 'GREAT SNAP!'),
        tierLabel: String(payload.tierLabel ?? '80+ Tier'),
        sharp: Number(payload.sharp ?? 85),
        light: Number(payload.light ?? 85),
        species: String(payload.species ?? 'Pet'),
        pose: String(payload.pose ?? 'Playful'),
        themeScore: Number(payload.themeScore ?? 85),
        themeMatch: Boolean(payload.themeMatch ?? true),
        petName: String(payload.petName ?? 'Clover'),
        coinsReward: Number(payload.coinsReward ?? 120),
        expReward: Number(payload.expReward ?? 40),
        cropped: false,
        minted: false,
        unjudged: false,
        box_2d: Array.isArray(payload.box_2d) && payload.box_2d.length === 4
          ? (payload.box_2d as [number, number, number, number])
          : undefined,
      };

      setActiveReport(judgedReport);
      // Pre-warm Pipeline B with animal detection bounding box ROI
      void processCutoutImage(dataUrl, 'auto', judgedReport.box_2d);
      if (judgedReport.photoUrl && judgedReport.photoUrl !== dataUrl) {
        void processCutoutImage(judgedReport.photoUrl, 'auto', judgedReport.box_2d);
      }
      setAlbum((prev) => [judgedReport, ...prev]);
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Unable to judge photo.';
      try {
        const parsed = JSON.parse(msg);
        if (parsed.message) msg = parsed.message;
        else if (parsed.error?.message) msg = parsed.error.message;
        else if (parsed.error && typeof parsed.error === 'string') msg = parsed.error;
      } catch {
        // Not JSON formatted, keep original
      }
      setJudgeError(msg);
      setActiveReport((prev) => ({
        ...prev,
        overallScore: 0,
        verdict: 'UNJUDGED',
        sharp: 0,
        light: 0,
        themeScore: 0,
        coinsReward: 0,
        expReward: 0,
        unjudged: true,
      }));
    } finally {
      setIsJudging(false);
    }
  };

  const handleRescueStray = () => {
    if (luredRescued) return;
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('rescue_stray'));
    }
    setLuredRescued(true);
    setPets((prev) => [
      ...prev,
      {
        id: 'pet-biscuit-corgi',
        name: 'Biscuit',
        species: 'corgi',
        photoUrl: '/src/assets/images/lured_stray_corgi_1794627550798.png',
        cutoutMode: 'studio',
        x: 72,
        y: 62,
        score: 90,
        bondXp: 30,
        careCount: 1,
        questPetDone: false,
        questFeedDone: false,
        questPlayDone: false,
      },
    ]);
    setCoins((c) => c + 100);
    setActiveModal(null);
  };

  // Profile Auth, Quest, Core Wallet & Fuji Passport Handlers
  const handleClaimFirstBondQuest = async (petUid: string) => {
    setProfileBusy('quest');
    setProfileFeedback(null);
    try {
      const { result, state } = await apiClaimFirstBondQuest(petUid);
      applyKeeperServerState(state);
      setProfileFeedback({
        type: 'ok',
        text: `First Bond Quest completed! +${result.coinsAwarded} Coins · +${result.expAwarded} EXP ✓`,
      });
    } catch (err) {
      setProfileFeedback({
        type: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'Complete Pet, Feed, Play and 100 Bond XP on one pet first.',
      });
    } finally {
      setProfileBusy(null);
    }
  };

  const handleSignInGoogle = async () => {
    setProfileBusy('auth');
    setProfileFeedback(null);
    try {
      const user = await signInWithGooglePopup();
      if (user) {
        setProfileFeedback({
          type: 'ok',
          text: `Signed in as ${user.displayName || user.email || 'Keeper'} ✓`,
        });
      }
    } catch (err: any) {
      console.warn('Google Sign-In failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setProfileFeedback({
          type: 'err',
          text: 'Sign-in window closed. Please try again.',
        });
      } else if (err?.code === 'auth/popup-blocked') {
        setProfileFeedback({
          type: 'ok',
          text: 'Pop-up blocked. Redirecting to Google Sign-In...',
        });
        await signInWithGoogleRedirect();
        return;
      } else {
        setProfileFeedback({
          type: 'err',
          text: err instanceof Error ? err.message : 'Google Sign-In failed.',
        });
      }
    } finally {
      setProfileBusy(null);
    }
  };

  const handleSignOut = async () => {
    setProfileBusy('auth');
    try {
      await signOutKeeper();
      setStoredGuestToken(null);
      const { state } = await initGuestSession();
      setGuestSessionReady(true);
      applyKeeperServerState(state);
      setProfileFeedback({
        type: 'ok',
        text: 'Signed out. Playing with a fresh guest session.',
      });
    } catch (err) {
      setProfileFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Sign-out failed.',
      });
    } finally {
      setProfileBusy(null);
    }
  };

  const handleConnectAndVerifyWallet = async (useDemoFallback: boolean = false) => {
    setProfileBusy('wallet');
    setProfileFeedback(null);
    try {
      // Step 1: Connect selected account via eth_requestAccounts without forcing a Fuji chain switch
      const { address, chainId, providerName, isCoreWallet } =
        await connectInjectedWallet(useDemoFallback);
      setBrowserWallet({
        available: true,
        address,
        chainId,
        providerName,
        isCoreWallet,
      });

      // Step 2: Request single-use server nonce challenge
      const challenge = await apiRequestWalletNonce(address);

      // Step 3: Trigger readable EIP-191 personal_sign prompt directly on the selected account
      const signature = await signChallengeMessage(challenge.message, address);

      // Step 4: Verify EIP-191 signature on server before marking wallet Verified/Linked
      const { wallet } = await apiVerifyWalletSignature({
        walletAddress: address,
        nonce: challenge.nonce,
        signature,
      });
      setLinkedWallet(wallet);
      const state = await fetchKeeperState();
      applyKeeperServerState(state);
      const chainLabel = formatEvmChainName(chainId);
      setProfileFeedback({
        type: 'ok',
        text:
          chainId === 43113
            ? `${providerName} verified on ${chainLabel} (${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}) ✓`
            : `${providerName} verified (${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}) on ${chainLabel}. Switch to Avalanche Fuji Testnet (43113) before minting.`,
      });
    } catch (err) {
      await refreshBrowserWallet();
      setProfileFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Wallet verification cancelled.',
      });
    } finally {
      setProfileBusy(null);
    }
  };

  const handleSwitchToFuji = async () => {
    setProfileBusy('switch');
    setProfileFeedback(null);
    try {
      await ensureFujiNetwork();
      await refreshBrowserWallet();
      setProfileFeedback({
        type: 'ok',
        text: 'Switched wallet to Avalanche Fuji Testnet (43113) ✓',
      });
    } catch (err) {
      setProfileFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not switch network.',
      });
    } finally {
      setProfileBusy(null);
    }
  };

  const handleUnlinkWallet = async () => {
    setProfileBusy('wallet');
    setProfileFeedback(null);
    try {
      await apiUnlinkWallet();
      clearDemoWallet();
      setLinkedWallet(null);
      setBrowserWallet({
        available: false,
        address: null,
        chainId: null,
        providerName: 'No Wallet Detected',
        isCoreWallet: false,
      });
      setProfileFeedback({ type: 'ok', text: 'Wallet unlinked and disconnected ✓' });
    } catch (err) {
      setProfileFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not unlink wallet.',
      });
    } finally {
      setProfileBusy(null);
    }
  };

  const handleReconcilePet = async (petUid: string) => {
    setProfileBusy(`reconcile-${petUid}`);
    setProfileFeedback(null);
    try {
      const { result, state } = await apiReconcilePet(petUid);
      applyKeeperServerState(state);
      if (result.conflict) {
        setProfileFeedback({
          type: 'err',
          text: `Ownership conflict: Fuji owner is ${result.onChainOwner?.slice(0, 8)}… (kept un-overwritten).`,
        });
      } else {
        setProfileFeedback({
          type: 'ok',
          text: result.reason || 'On-chain ownership reconciled ✓',
        });
      }
    } catch (err) {
      setProfileFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Reconciliation failed.',
      });
    } finally {
      setProfileBusy(null);
    }
  };

  const handleQuickEnergy = () => {
    if (hasServerSession) {
      syncKeeperCall(apiGameAction('refill_energy'));
    }
    setEnergy((e) => Math.min(maxEnergy, e + 5));
  };

  const showSanctuaryOnDesktop = desktopMode === 'sanctuary';
  const showFarmOnDesktop = desktopMode === 'farm';
  const showNeighborGardenOnDesktop = desktopMode === 'neighborGarden';
  const showNeighborFarmOnDesktop =
    Boolean(visitingNeighbor) && desktopMode === 'neighborFarm';
  const showJudgeOnDesktop = desktopMode === 'judge';
  const showGalleryOnDesktop = desktopMode === 'gallery';

  const frameSizeClass =
    'w-full max-w-[392px] h-[min(86dvh,710px)] lg:max-w-[460px] lg:h-[730px] aspect-[9/16]';

  const renderCreamSheets = (target: ScreenView) => {
    if (modalTarget !== target) return null;
    return (
      <CreamSheets
        modal={activeModal}
        onClose={() => setActiveModal(null)}
        onOpenDiscoverCamera={() => {
          setActiveModal(null);
          setIsCameraModalOpen(true);
        }}
        coins={coins}
        energy={energy}
        maxEnergy={maxEnergy}
        level={level}
        streakDays={streakDays}
        fenceHours={fenceHours}
        theme={theme}
        pets={pets}
        selectedPetId={selectedPetId}
        shopItems={shopItems}
        toys={toys}
        foodInventory={foodInventory}
        limits={limits}
        neighbors={neighbors}
        visitingNeighbor={visitingNeighbor}
        album={album}
        luredRescued={luredRescued}
        activeBait={activeBait}
        authUser={authUser}
        authLoading={authLoading}
        firstBondQuest={firstBondQuest}
        linkedWallet={linkedWallet}
        browserWallet={browserWallet}
        web3Status={web3Status}
        profileBusy={profileBusy}
        profileFeedback={profileFeedback}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOut}
        onClaimFirstBondQuest={handleClaimFirstBondQuest}
        onConnectAndVerifyWallet={handleConnectAndVerifyWallet}
        onSwitchToFuji={handleSwitchToFuji}
        onUnlinkWallet={handleUnlinkWallet}
        onMintPassportFromProfile={handleRequestMintFromProfile}
        onReconcilePet={handleReconcilePet}
        onSelectPet={setSelectedPetId}
        onBuyItem={handleBuyItem}
        onBuyToy={handleBuyToy}
        onFeedPet={(food, petId) => {
          handleFeedPet(food, petId);
        }}
        onVisitNeighbor={handleVisitNeighbor}
        onBuyFromNeighborMarket={handleBuyFromNeighborMarket}
        onEquipAccessory={handleEquipAccessory}
        onBuyAndEquipHat={handleBuyAndEquipHat}
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
          walletState.connected ? shortenAddress(walletState.address) : 'Connect Core'
        }
        keeperName={authUser?.displayName || 'Keeper'}
        onCarePet={(petId) => {
          handleCarePet(petId);
        }}
        onUseSampleSnap={handleUseSampleSnap}
        onUploadPhoto={handleUploadPhoto}
        onRescueStray={handleRescueStray}
        onPlaceBait={(baitName) => {
          if (hasServerSession) {
            syncKeeperCall(apiGameAction('place_bait', { baitName }));
          }
          setActiveBait(baitName);
          setActiveModal(null);
        }}
        onOpenAlbumItem={handleOpenAlbumItem}
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

  const isLinkedMatch = Boolean(
    linkedWallet?.address &&
      (!browserWallet.address ||
        linkedWallet.address.toLowerCase() === browserWallet.address.toLowerCase())
  );

  const walletState: {
    connected: boolean;
    address: string | null;
    chainId: number | null;
    isAvalancheFuji: boolean;
    providerLabel: 'Core Wallet' | 'Demo Wallet' | null;
    authVerified: boolean;
    connecting: boolean;
    error: string | null;
  } = {
    connected: Boolean(linkedWallet?.address || browserWallet.address),
    address: linkedWallet?.address || browserWallet.address,
    chainId: browserWallet.chainId,
    isAvalancheFuji: browserWallet.chainId === 43113,
    providerLabel: browserWallet.isCoreWallet ? 'Core Wallet' : 'Demo Wallet',
    authVerified: isLinkedMatch,
    connecting: Boolean(profileBusy === 'wallet'),
    error: profileFeedback?.type === 'err' ? profileFeedback.text : null,
  };

  return (
    <SkyThemeProvider value={skyTheme}>
    <DailyMissionsHudProvider
      value={{
        onOpenMissions: () => {
          playTapSound();
          setMissionsModalOpen(true);
        },
        hasMissionsBadge: hasClaimableDailyMission,
      }}
    >
    <UiLabelsProvider value={showTextLabels}>
    <div className={`min-h-dvh w-full ${TIME_OF_DAY_PALETTES[skyTheme]?.studioBgClass || 'pastel-studio-bg'} flex flex-col items-center justify-center sm:p-4 lg:p-5 transition-colors duration-1000`}>
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
          title={appPhase === 'playing' ? 'Return to Title' : 'Paws & Picket'}
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
              const active = desktopMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setDesktopMode(tab.id);
                    setMobileScreen(tab.id);
                  }}
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
                mobileScreen === 'gallery'
                  ? openSanctuaryScreen()
                  : openGalleryScreen()
              }
              className={`lg:hidden cream-pill rounded-full px-2.5 py-1 font-display text-[11.5px] font-extrabold cursor-pointer whitespace-nowrap active:scale-95 transition-transform ${
                mobileScreen === 'gallery'
                  ? 'bg-[#FFE07D] text-[#4B3C46]'
                  : 'bg-[#FFFDF9] text-[#4B3C46]'
              }`}
            >
              {mobileScreen === 'gallery' ? '🏡 Yard' : `🏛️ ${passports.length}`}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setWalletModalOpen(true);
            }}
            className={`cream-pill rounded-full px-3 py-1 font-display text-[11.5px] font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-transform ${
              walletState.connected
                ? 'bg-[#E8F8EC] text-[#3F7B52]'
                : 'bg-[#FFFDF9] text-[#4B3C46]'
            }`}
            title="Core Wallet & Avalanche Fuji"
          >
            <span>{shortenAddress(walletState.address)}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSettingsModal({ open: true, tab: 'settings' });
            }}
            aria-label="Settings"
            className="cream-pill rounded-full w-8 h-8 flex items-center justify-center text-[#4B3C46] cursor-pointer active:scale-95 transition-transform"
            title="Settings & Guide"
          >
            <Settings className="w-4 h-4 text-[#8A747E]" />
          </button>
        </div>
      </header>

      {/* 9:16 MOBILE PORTRAIT FRAMES OR START SCREEN */}
      {appPhase === 'start' ? (
        <div className="w-full max-w-[1620px] flex-1 flex items-center justify-center px-2 py-3">
          <div className={`relative ${frameSizeClass} rounded-[36px] border-[3px] border-[#DFCBBF] shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFFDF9]`}>
            <StartScreen
              keeperName={authUser?.displayName || 'Keeper'}
              level={level}
              coins={coins}
              streakDays={streakDays}
              pets={pets}
              passportsCount={passports.length}
              hasSavedSession={true}
              soundEnabled={soundEnabled}
              wallet={walletState}
              onStartPlay={() => {
                playVictorySound();
                setAppPhase('playing');
              }}
              onOpenGallery={() => {
                playTapSound();
                setAppPhase('playing');
                openGalleryScreen();
              }}
              onOpenGuide={() => setSettingsModal({ open: true, tab: 'guide' })}
              onOpenSettings={() => setSettingsModal({ open: true, tab: 'settings' })}
              onToggleSound={handleToggleSound}
              onOpenWallet={() => setWalletModalOpen(true)}
            />
          </div>
        </div>
      ) : (
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
              selectedPetId={selectedPetId}
              toys={toys}
              foodInventory={foodInventory}
              limits={limits}
              luredCount={luredRescued ? 0 : 1}
              activeBait={activeBait}
              readyFarmCount={readyFarmCount}
              questProgressLabel={questProgressLabel}
              onSelectPet={setSelectedPetId}
              onCarePet={handleCarePet}
              onFeedPet={handleFeedPet}
              onPlayToy={handlePlayToy}
              onTapClover={handleTapClover}
              onOpenFarm={openFarmScreen}
              onOpenQuest={() => setQuestModalOpen(true)}
              onOpenCalendar={() => setCalendarModalOpen(true)}
              hasCalendarBadge={!checkedInToday}
              onOpenSettings={() => setSettingsModal({ open: true, tab: 'settings' })}
              onOpenPetProfile={(petId) => setProfileModalState({ open: true, mode: 'profile', petId })}
              onOpenMemoryGame={() => setMemoryModalOpen(true)}
              onOpenModal={(m) => openModalIn('sanctuary', m)}
              onQuickCoins={() => openModalIn('sanctuary', 'shop')}
              onQuickEnergy={handleQuickEnergy}
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
              onOpenSettings={() => setSettingsModal({ open: true, tab: 'settings' })}
            />
            {renderCreamSheets('farm')}
          </section>

          {/* 3. VISITING NEIGHBOR GARDEN FRAME */}
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
              onQuickEnergy={handleQuickEnergy}
              onNeighborPat={handleNeighborPat}
              onNeighborGift={handleNeighborGift}
            />
            {renderCreamSheets('neighborGarden')}
          </section>

          {/* 4. VISITING NEIGHBOR FARM FRAME */}
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
                onQuickEnergy={handleQuickEnergy}
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
              linkedPet={linkedPetForActiveReport}
              isJudging={isJudging}
              judgeError={judgeError}
              isAuthenticated={Boolean(authUser)}
              walletLinked={Boolean(linkedWallet)}
              web3Status={web3Status}
              isMinting={isMinting}
              mintNotice={mintNotice}
              onSelectYard={openSanctuaryScreen}
              onSelectFarm={openFarmScreen}
              onOpenModal={(m) => openModalIn('judge', m)}
              onQuickCoins={() => openModalIn('judge', 'shop')}
              onQuickEnergy={handleQuickEnergy}
              onCropIntoSanctuary={handleCropIntoSanctuary}
              onMintPet={handleMintPet}
              onShareSnap={handleShareSnap}
              onUploadPhoto={handleUploadPhoto}
              onOpenDiscoverCamera={() => setIsCameraModalOpen(true)}
              onResetSample={() => {
                setActiveReport(SAMPLE_PUPPY_REPORT);
                setJudgeError(null);
                setMintNotice(null);
              }}
              onOpenSettings={() => setSettingsModal({ open: true, tab: 'settings' })}
            />
            {renderCreamSheets('judge')}
          </section>

          {/* 6. PASSPORT GALLERY FRAME */}
          <section
            aria-label="Passport Gallery"
            className={`relative ${frameSizeClass} rounded-[36px] border-[3px] border-[#C6E1F5] shadow-[0_14px_34px_rgba(138,116,126,0.16)] overflow-hidden bg-[#FFFDF9] ${
              mobileScreen === 'gallery' ? 'block' : 'hidden'
            } ${showGalleryOnDesktop ? 'lg:block' : 'lg:hidden'}`}
          >
            <PassportGalleryScreen
              coins={coins}
              energy={energy}
              maxEnergy={maxEnergy}
              level={level}
              expPercent={expPercent}
              readyFarmCount={readyFarmCount}
              luredCount={luredRescued ? 0 : 1}
              passports={passports}
              walletAddress={linkedWallet?.address || browserWallet.address}
              onSelectYard={openSanctuaryScreen}
              onSelectFarm={openFarmScreen}
              onSelectVisit={openNeighborGardenScreen}
              onOpenModal={(m) => openModalIn('gallery', m)}
              onQuickCoins={() => openModalIn('gallery', 'shop')}
              onQuickEnergy={handleQuickEnergy}
              onOpenMintModal={() => {
                const target = pets.find((p) => p.passportEligible && !p.minted) ?? pets[0];
                setMintModalPetId(target?.id ?? null);
                setMintModalOpen(true);
              }}
              onRefreshGallery={() => setPassports((prev) => [...prev])}
              onOpenSettings={() => setSettingsModal({ open: true, tab: 'settings' })}
            />
            {renderCreamSheets('gallery')}
          </section>
        </div>
      )}

      {/* Responsive Mobile + Desktop Discover Camera Modal */}
      <DiscoverCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapturePhoto={handleUploadPhoto}
        currentTheme={theme}
        isSubmitting={isJudging}
      />

      {/* Public IPFS Consent Modal before Fuji NFT Mint */}
      <IpfsConsentModal
        isOpen={Boolean(pendingConsentPet)}
        pet={pendingConsentPet}
        isMinting={isMinting}
        onClose={() => setPendingConsentPet(null)}
        onConfirm={async (consent) => {
          if (!pendingConsentPet?.petUid) return;
          const targetPetUid = pendingConsentPet.petUid;
          setPendingConsentPet(null);
          await mintPassportByPetUid(targetPetUid, consent);
        }}
      />

      {/* GLOBAL MODALS */}
      <AppSettingsModal
        open={settingsModal.open}
        initialTab={settingsModal.tab}
        keeperName={authUser?.displayName || 'Keeper'}
        soundEnabled={soundEnabled}
        showTextLabels={showTextLabels}
        streakDays={streakDays}
        hasCalendarBadge={!checkedInToday}
        inGame={appPhase === 'playing'}
        walletLabel={shortenAddress(walletState.address)}
        onClose={() => setSettingsModal((s) => ({ ...s, open: false }))}
        onChangeKeeperName={() => {}}
        onToggleSound={handleToggleSound}
        onToggleShowTextLabels={handleToggleShowTextLabels}
        onOpenCalendar={() => setCalendarModalOpen(true)}
        onOpenWallet={() => setWalletModalOpen(true)}
        onReturnToTitle={() => {
          setActiveModal(null);
          setAppPhase('start');
        }}
        onResetSave={() => {
          setCoins(12560);
          setEnergy(45);
        }}
      />

      <DailyMissionsModal
        open={missionsModalOpen}
        state={dailyMissions}
        onClose={() => setMissionsModalOpen(false)}
        onClaimMission={handleClaimDailyMission}
        onClaimDailyBonus={handleClaimDailyMissionBonus}
        onRerollMissions={handleRerollDailyMissions}
        onJumpToMission={handleJumpToMission}
      />

      <StreakCalendarModal
        open={calendarModalOpen}
        streakDays={streakDays}
        fenceHours={fenceHours}
        checkedInToday={checkedInToday}
        claimedMilestones={claimedStreakMilestones}
        onClose={() => setCalendarModalOpen(false)}
        onDailyCheckIn={handleDailyCheckIn}
        onClaimMilestone={handleClaimStreakMilestone}
      />

      <PetMemoryModal
        open={memoryModalOpen}
        pets={pets}
        onClose={() => setMemoryModalOpen(false)}
        onClaimReward={handleClaimMemoryReward}
      />

      <FirstBondQuestModal
        open={questModalOpen}
        quest={questModalState}
        pets={pets}
        currentPhase={currentJourneyPhase}
        hasMintedPassport={pets.some((p) => p.minted)}
        walletConnected={Boolean(walletState.connected && walletState.isAvalancheFuji)}
        onClose={() => setQuestModalOpen(false)}
        onJumpToPhase={handleJumpToJourneyPhase}
        onQuickWelcome={() => {
          setQuestModalOpen(false);
          openModalIn('sanctuary', 'snap');
        }}
        onQuickFeed={() => {
          setQuestModalOpen(false);
          const firstFood = (Object.keys(foodInventory) as FoodItemType[]).find((k) => foodInventory[k] > 0);
          if (firstFood) {
            handleFeedPet(firstFood, pets[0]?.id);
            openSanctuaryScreen();
          }
        }}
        onQuickPlay={() => {
          setQuestModalOpen(false);
          const ownedToy = toys.find((t) => t.owned) ?? toys[0];
          handlePlayToy(ownedToy, pets[0]?.id);
          openSanctuaryScreen();
        }}
        onClaimReward={async () => {
          if (pets[0]?.petUid) {
            await handleClaimFirstBondQuest(pets[0].petUid);
          }
        }}
      />

      <PetProfileModal
        open={profileModalState.open}
        mode={profileModalState.mode}
        pet={profileTargetPet}
        pendingReport={profileModalState.mode === 'welcome' ? activeReport : null}
        shopItems={shopItems}
        foodInventory={foodInventory}
        coins={coins}
        onClose={() => setProfileModalState((s) => ({ ...s, open: false }))}
        onConfirmWelcome={() => {
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
        wallet={walletState}
        nextTokenNumber={passports.length + 1}
        existingPassports={passports}
        onClose={() => setMintModalOpen(false)}
        onOpenWallet={handleConnectAndVerifyWallet}
        onOpenQuest={() => {
          setMintModalOpen(false);
          setQuestModalOpen(true);
        }}
        onPassportMinted={handlePassportMinted}
        onOpenGallery={() => {
          setMintModalOpen(false);
          openGalleryScreen();
        }}
      />

      <WalletConnectModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        authUser={authUser}
        linkedWallet={linkedWallet}
        browserWallet={browserWallet}
        web3Status={web3Status}
        profileBusy={profileBusy}
        profileFeedback={profileFeedback}
        onSignInGoogle={handleSignInGoogle}
        onConnectAndVerifyWallet={handleConnectAndVerifyWallet}
        onSwitchToFuji={handleSwitchToFuji}
        onUnlinkWallet={handleUnlinkWallet}
      />
    </div>
    </UiLabelsProvider>
    </DailyMissionsHudProvider>
    </SkyThemeProvider>
  );
}
