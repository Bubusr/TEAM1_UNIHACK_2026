export type Personality = 'curious' | 'calm' | 'excited' | 'shy';
export type GoalLevel = 'beginner' | 'intermediate' | 'advanced';

// 4 Vòng đời nhận thức theo Idea03_MangNon_CoreDesign.md (thay vì cấp độ số khô khan)
export type CognitiveStage = 'raw_curiosity' | 'association' | 'own_perspective' | 'deep_companionship';

export interface GoalStats {
  intelligence: number; // Trí tuệ (Hiểu biết thế giới)
  perseverance: number; // Kiên trì (Rễ đâm sâu)
  fitness: number;      // Thể lực (Sức sống)
  creativity: number;   // Sáng tạo (Tâm hồn tự do)
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
  cognitiveStage: CognitiveStage; // Giai đoạn nhận thức
  imageUri: string; // Nét vẽ tay hoặc ảnh người chơi tải lên
  stats: GoalStats;
  interactionCount: number;
  createdAt: number;
  lastInteraction: number;
  hasVault: boolean;
  vaultPrincipal: number; // AVAX testnet cam kết
  mockYieldAccumulated: number;
  isResting: boolean; // True nếu đã "an nghỉ" dưới lòng Suối Ký Ức
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
