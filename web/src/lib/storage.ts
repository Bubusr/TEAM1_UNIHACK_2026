import { Goal, VillageTreeState, Station, JourneyNFT } from './types';

const STORAGE_KEYS = {
  GOALS: 'mangnon_goals',
  VILLAGE_TREE: 'mangnon_village_tree',
  STATIONS: 'mangnon_stations',
  NFTS: 'mangnon_nfts',
  GLOWING_BAMBOO_COUNT: 'mangnon_glowing_bamboo_count',
};

// Initial seed data when launching the app
const SEED_GOALS: Goal[] = [
  {
    id: 'goal-1',
    name: 'Mastering IELTS 7.5',
    level: 'intermediate',
    personality: 'curious',
    cognitiveStage: 'association',
    imageUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="30" ry="40" fill="%234ade80"/><circle cx="40" cy="40" r="5" fill="%230f172a"/><circle cx="60" cy="40" r="5" fill="%230f172a"/><path d="M42 55 Q50 65 58 55" stroke="%230f172a" stroke-width="3" fill="none"/><polygon points="50,10 40,25 60,25" fill="%2322c55e"/></svg>',
    stats: {
      intelligence: 68,
      perseverance: 54,
      fitness: 30,
      creativity: 45,
    },
    interactionCount: 8,
    createdAt: Date.now() - 86400000 * 5,
    lastInteraction: Date.now() - 3600000 * 2,
    hasVault: true,
    vaultPrincipal: 0.5,
    mockYieldAccumulated: 0.012,
    isResting: false,
    linkedGoalId: 'goal-2',
    journal: [
      {
        id: 'j-1',
        timestamp: Date.now() - 86400000 * 3,
        type: 'chat',
        userMessage: 'I just finished learning 20 vocabulary words on the Environment topic today!',
        companionReply: 'Oh, environment vocabulary? So when a bamboo leaf falls to the ground, is it considered biodegradable, my friend?',
        statGained: { type: 'intelligence', amount: 5 },
      },
    ],
  },
  {
    id: 'goal-2',
    name: 'Read 10 pages of English books daily',
    level: 'beginner',
    personality: 'excited',
    cognitiveStage: 'association',
    imageUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="28" ry="38" fill="%2386efac"/><circle cx="42" cy="45" r="4" fill="%230f172a"/><circle cx="58" cy="45" r="4" fill="%230f172a"/><path d="M43 56 Q50 68 57 56" stroke="%23e11d48" stroke-width="3" fill="%23fda4af"/><polygon points="45,15 35,30 55,30" fill="%2316a34a"/><polygon points="55,15 45,30 65,30" fill="%2315803d"/></svg>',
    stats: {
      intelligence: 52,
      perseverance: 60,
      fitness: 25,
      creativity: 58,
    },
    interactionCount: 11,
    createdAt: Date.now() - 86400000 * 4,
    lastInteraction: Date.now() - 3600000 * 6,
    hasVault: false,
    vaultPrincipal: 0,
    mockYieldAccumulated: 0,
    isResting: false,
    linkedGoalId: 'goal-1',
    journal: [],
  },
];

const SEED_TREE: VillageTreeState = {
  totalLifetimeEnergy: 1250,
  currentCycleEnergy: 340,
  threshold: 500,
  blessingCycleCount: 2,
  lastBlessingTime: Date.now() - 86400000 * 2,
};

const SEED_STATIONS: Station[] = [
  {
    id: 'station-1',
    name: 'Bamboo Study Station - The Workshop Coffee',
    address: '27 Ngo Duc Ke St, District 1, HCMC',
    lat: 10.7725,
    lng: 106.7042,
    voucherReward: '20% off Specialty Coffee during study sessions',
    voucherCode: 'MN-WORKSHOP-2026',
    claimed: false,
    description: 'Quiet study sanctuary overlooking a mini bamboo garden, perfect for reading and studying with your companion.',
  },
  {
    id: 'station-2',
    name: 'Knowledge Bamboo Station - Ca Chep Bookshop',
    address: '211 Vo Van Tan St, District 3, HCMC',
    lat: 10.7742,
    lng: 106.6888,
    voucherReward: '50,000 VND voucher for academic & literature books',
    voucherCode: 'MN-CACHEP-50K',
    claimed: false,
    description: 'A quiet gathering place of thousands of titles supporting diverse self-learning goals.',
  },
  {
    id: 'station-3',
    name: 'Avalanche Hub Creative Station',
    address: 'VNU-HCM University Village, Thu Duc City',
    lat: 10.8701,
    lng: 106.8032,
    voucherReward: 'Soulbound Dev Badge + UniHack Builder Kit',
    voucherCode: 'AVAX-BUILDER-MANGNON',
    claimed: true,
    description: 'Web3 study sanctuary hosting group study sessions, Subnet workshops, and smart contract labs.',
  },
];

const SEED_NFTS: JourneyNFT[] = [];

export const StorageService = {
  getGoals(): Goal[] {
    if (typeof window === 'undefined') return SEED_GOALS;
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(SEED_GOALS));
      return SEED_GOALS;
    }
    return JSON.parse(data);
  },

  saveGoals(goals: Goal[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  addGoal(goal: Goal) {
    const goals = this.getGoals();
    goals.push(goal);
    this.saveGoals(goals);
  },

  updateGoal(updated: Goal) {
    const goals = this.getGoals().map((g) => (g.id === updated.id ? updated : g));
    this.saveGoals(goals);
  },

  getVillageTree(): VillageTreeState {
    if (typeof window === 'undefined') return SEED_TREE;
    const data = localStorage.getItem(STORAGE_KEYS.VILLAGE_TREE);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.VILLAGE_TREE, JSON.stringify(SEED_TREE));
      return SEED_TREE;
    }
    return JSON.parse(data);
  },

  updateVillageTree(tree: VillageTreeState) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.VILLAGE_TREE, JSON.stringify(tree));
  },

  addEnergyToTree(amount: number): { tree: VillageTreeState; blessed: boolean } {
    const tree = this.getVillageTree();
    tree.totalLifetimeEnergy += amount;
    tree.currentCycleEnergy += amount;
    let blessed = false;

    if (tree.currentCycleEnergy >= tree.threshold) {
      tree.blessingCycleCount += 1;
      tree.currentCycleEnergy = 0;
      tree.lastBlessingTime = Date.now();
      blessed = true;
    }

    this.updateVillageTree(tree);
    return { tree, blessed };
  },

  getStations(): Station[] {
    if (typeof window === 'undefined') return SEED_STATIONS;
    const data = localStorage.getItem(STORAGE_KEYS.STATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(SEED_STATIONS));
      return SEED_STATIONS;
    }
    return JSON.parse(data);
  },

  checkinStation(stationId: string): Station | null {
    const stations = this.getStations();
    const station = stations.find((s) => s.id === stationId);
    if (station && !station.claimed) {
      station.claimed = true;
      localStorage.setItem(STORAGE_KEYS.STATIONS, JSON.stringify(stations));
      return station;
    }
    return null;
  },

  getNFTs(): JourneyNFT[] {
    if (typeof window === 'undefined') return SEED_NFTS;
    const data = localStorage.getItem(STORAGE_KEYS.NFTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.NFTS, JSON.stringify(SEED_NFTS));
      return SEED_NFTS;
    }
    return JSON.parse(data);
  },

  addNFT(nft: JourneyNFT) {
    const nfts = this.getNFTs();
    nfts.unshift(nft);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NFTS, JSON.stringify(nfts));
    }
  },
};

