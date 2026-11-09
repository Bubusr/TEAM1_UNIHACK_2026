export type Personality = 'curious' | 'calm' | 'excited' | 'shy';
export type GoalLevel = 'beginner' | 'intermediate' | 'advanced';

export interface GoalStats {
  intelligence: number; // Trí tuệ
  perseverance: number; // Kiên trì
  fitness: number;      // Thể lực
  creativity: number;   // Sáng tạo
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  type: 'chat' | 'quiz' | 'reflection' | 'station' | 'blessing';
  userMessage?: string;
  companionReply?: string;
  statGained?: {
    type: keyof GoalStats;
    amount: number;
  };
}

export interface Goal {
  id: string;
  name: string;
  level: GoalLevel;
  personality: Personality;
  imageUri: string; // Data URL hoặc ảnh vẽ tay
  stats: GoalStats;
  interactionCount: number;
  createdAt: number;
  lastInteraction: number;
  hasVault: boolean;
  vaultPrincipal: number; // Đơn vị AVAX
  mockYieldAccumulated: number;
  isResting: boolean; // True nếu đã "an nghỉ" và chuyển vào Vườn Ký Ức
  linkedGoalId?: string; // Nối chỉ số với Măng Non khác
  journal: JournalEntry[];
  restingAt?: number;
  journeyNftId?: string;
}

export interface VillageTreeState {
  totalLifetimeEnergy: number;
  currentCycleEnergy: number;
  threshold: number;
  blessingCycleCount: number;
  lastBlessingTime?: number;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  voucherReward: string;
  voucherCode: string;
  claimed: boolean;
  description: string;
}

export interface JourneyNFT {
  tokenId: string;
  goalId: string;
  goalName: string;
  personality: Personality;
  imageUri: string;
  finalStats: GoalStats;
  interactionCount: number;
  completedAt: number;
  mockYieldContributed: number;
  txHash: string;
}
