import { content } from '@/content/vi';

export type Personality = 'tomo' | 'diemtinh' | 'haohung' | 'nhutnhat';
export type Stage = 1 | 2 | 3 | 4;

export interface Mangnon {
  id: string;
  name: string;
  personality: Personality;
  stage: Stage;
  imageUri: string;
  imageSource: 'draw' | 'photo' | 'upload' | 'sample';
  status: 'active' | 'resting';
  goalTitle: string;
  likes: string[];
  dislike: string | null;
  sessionsCount: number;
  activeDays: string[];
  createdAt: string;
  restedAt?: string;
  lastWords?: string;
  finalMemories?: string[];
}

export interface MemoryItem {
  id: string;
  mangnonId: string;
  text: string;
  pinned: boolean;
  forgotten: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'mangnon';
  text: string;
  createdAt: string;
}

export interface AppSettings {
  demoMode: boolean;
  timeOverride?: 'real' | 'morning' | 'noon' | 'dusk' | 'night';
  seasonOverride?: 'real' | 'spring' | 'summer' | 'autumn' | 'winter';
  reducedMotion: boolean;
  soundOn: boolean;
  reminderOn: boolean;
  lastOpenedAt: string;
  onboardingStep?: string;
}

const STORAGE_KEY = 'mangnon_app_state_v2';

export interface AppStateData {
  currentScreen: string;
  activeMangnon: Mangnon | null;
  restingMangnons: Mangnon[];
  memories: MemoryItem[];
  messages: ChatMessage[];
  villageLeaves: number;
  villageThreshold: number;
  lastBloomedAt?: string;
  settings: AppSettings;
  bambooOpened: boolean;
}

const DEFAULT_STATE: AppStateData = {
  currentScreen: 'S01',
  activeMangnon: null,
  restingMangnons: [
    {
      id: 'mn-seed-1',
      name: 'Mầm Xanh',
      personality: 'diemtinh',
      stage: 4,
      imageUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="52" rx="26" ry="34" fill="%236B8F71"/><circle cx="43" cy="46" r="3" fill="%231B2A2F"/><circle cx="57" cy="46" r="3" fill="%231B2A2F"/><polygon points="50,15 42,28 58,28" fill="%233E5C45"/></svg>',
      imageSource: 'sample',
      status: 'resting',
      goalTitle: 'Đọc 12 cuốn sách văn học',
      likes: ['tiếng mưa', 'trang sách cũ'],
      dislike: 'nơi ồn ào',
      sessionsCount: 38,
      activeDays: ['2026-10-12', '2026-10-25'],
      createdAt: '2026-10-01',
      restedAt: '2026-11-02',
      lastWords: 'Cảm ơn cậu vì đã luôn kiên nhẫn. Giờ mình chìm vào giấc ngủ bên dòng suối trong vắt này nhé...',
      finalMemories: [
        'Cậu kể: Vừa đọc xong cuốn Hoàng Tử Bé lúc trời mưa rào',
        'Cậu kể: Thấy một chiếc lá phong vàng rơi trên bậc thềm',
        'Cậu kể: Hôm nay trong lòng cảm thấy nhẹ nhõm hơn nhiều',
      ],
    },
  ],
  memories: [],
  messages: [],
  villageLeaves: 310, // Mức nền 62%
  villageThreshold: 500,
  settings: {
    demoMode: true,
    timeOverride: 'night',
    seasonOverride: 'autumn',
    reducedMotion: false,
    soundOn: false,
    reminderOn: false,
    lastOpenedAt: new Date().toISOString(),
  },
  bambooOpened: false,
};

export const AppStore = {
  load(): AppStateData {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
        return DEFAULT_STATE;
      }
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_STATE;
    }
  },

  save(state: AppStateData) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  },

  resetAll(): AppStateData {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    return DEFAULT_STATE;
  },
};

