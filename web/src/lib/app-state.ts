import { SkeletonRig, FaceExpression } from './auto-rig';
import { ImageDB } from './image-db';

export type Personality = 'tomo' | 'diemtinh' | 'haohung' | 'nhutnhat';
export type Stage = 1 | 2 | 3 | 4;

export type SerializableFaceExpression = Omit<FaceExpression, 'customFaceCanvas'>;

export interface Mangnon {
  id: string;
  name: string;
  personality: Personality;
  stage: Stage;
  imageId?: string;
  imageUri: string;
  imageSource: 'draw' | 'photo' | 'upload' | 'sample';
  status: 'active' | 'resting';
  goalTitle: string;
  goalWhy?: string;
  plannedDays?: 7 | 14 | 30 | null;
  likes: string[];
  dislike: string | null;
  sessionsCount: number;
  activeDays: string[];
  createdAt: string;
  restedAt?: string;
  lastWords?: string;
  finalMemories?: string[];
  rigData?: SkeletonRig;
  faceExpr?: SerializableFaceExpression;
  nftTxHash?: string;
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

export interface OnboardingDraft {
  imageId?: string;
  imageUri?: string;
  imageSource?: 'draw' | 'photo' | 'upload' | 'sample';
  name?: string;
  personality?: Personality;
  rigData?: SkeletonRig;
  faceExpr?: SerializableFaceExpression;
  nftTxHash?: string;
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
  lastSeenBloomAt?: string;
  settings: AppSettings;
  bambooOpened: boolean;
  draftOnboarding?: OnboardingDraft;
}

const DEFAULT_STATE: AppStateData = {
  currentScreen: 'S01',
  activeMangnon: null,
  restingMangnons: [],
  memories: [],
  messages: [],
  villageLeaves: 310, // Mức nền 62% cộng đồng giả lập
  villageThreshold: 500,
  settings: {
    demoMode: false, // Ẩn mặc định theo Prompt §6 S13; bật ở Cài đặt hoặc Ctrl+Shift+D
    timeOverride: 'real', // Đổi theo giờ thật ngoài đời (Prompt §7.7)
    seasonOverride: 'real', // Đổi theo tháng thật ngoài đời (Prompt §9.4)
    reducedMotion: false,
    soundOn: false,
    reminderOn: false,
    lastOpenedAt: new Date().toISOString(),
  },
  bambooOpened: false,
};

function persistBigImage(id: string, uri?: string): { imageId?: string; compactUri: string } {
  if (!uri) return { compactUri: '' };
  if (uri.startsWith('data:image/') && uri.length > 2048) {
    void ImageDB.save(id, uri);
    return { imageId: id, compactUri: '' };
  }
  return { imageId: id, compactUri: uri };
}

function dehydrateMangnonForLocalStorage(mn: Mangnon): Mangnon {
  const imgId = mn.imageId || `img-${mn.id}`;
  const { compactUri } = persistBigImage(imgId, mn.imageUri);
  let faceExpr = mn.faceExpr;
  if (faceExpr?.customFaceDataUrl && faceExpr.customFaceDataUrl.length > 2048) {
    void ImageDB.save(`face-${mn.id}`, faceExpr.customFaceDataUrl);
    faceExpr = { ...faceExpr, customFaceDataUrl: `idb:face-${mn.id}` };
  }
  return {
    ...mn,
    imageId: imgId,
    imageUri: compactUri || (mn.imageUri.startsWith('data:image/') ? `idb:${imgId}` : mn.imageUri),
    faceExpr,
  };
}

export const AppStore = {
  load(): AppStateData {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
        return DEFAULT_STATE;
      }
      const parsed = JSON.parse(saved) as AppStateData;
      return {
        ...DEFAULT_STATE,
        ...parsed,
        settings: {
          ...DEFAULT_STATE.settings,
          ...(parsed.settings || {}),
        },
      };
    } catch {
      return DEFAULT_STATE;
    }
  },

  /** Khôi phục dữ liệu ảnh PNG lưu trong IndexedDB vào state runtime */
  async hydrateImages(state: AppStateData): Promise<AppStateData> {
    const hydrateOne = async (mn: Mangnon): Promise<Mangnon> => {
      let uri = mn.imageUri;
      const imgId = mn.imageId || `img-${mn.id}`;
      if ((!uri || uri.startsWith('idb:')) && imgId) {
        const stored = await ImageDB.get(imgId);
        if (stored) uri = stored;
      }
      let faceExpr = mn.faceExpr;
      if (faceExpr?.customFaceDataUrl?.startsWith('idb:')) {
        const faceKey = faceExpr.customFaceDataUrl.slice(4);
        const faceData = await ImageDB.get(faceKey);
        if (faceData) faceExpr = { ...faceExpr, customFaceDataUrl: faceData };
      }
      return { ...mn, imageId: imgId, imageUri: uri, faceExpr };
    };

    const activeMangnon = state.activeMangnon ? await hydrateOne(state.activeMangnon) : null;
    const restingMangnons = await Promise.all(state.restingMangnons.map(hydrateOne));

    let draftOnboarding = state.draftOnboarding;
    if (draftOnboarding?.imageUri?.startsWith('idb:') && draftOnboarding.imageId) {
      const storedDraft = await ImageDB.get(draftOnboarding.imageId);
      if (storedDraft) {
        draftOnboarding = { ...draftOnboarding, imageUri: storedDraft };
      }
    }
    if (draftOnboarding?.faceExpr?.customFaceDataUrl?.startsWith('idb:')) {
      const faceKey = draftOnboarding.faceExpr.customFaceDataUrl.slice(4);
      const faceData = await ImageDB.get(faceKey);
      if (faceData) {
        draftOnboarding = {
          ...draftOnboarding,
          faceExpr: { ...draftOnboarding.faceExpr, customFaceDataUrl: faceData },
        };
      }
    }

    return {
      ...state,
      activeMangnon,
      restingMangnons,
      draftOnboarding,
    };
  },

  save(state: AppStateData) {
    if (typeof window === 'undefined') return;
    try {
      const draft = state.draftOnboarding ? { ...state.draftOnboarding } : undefined;
      if (draft?.imageUri && draft.imageUri.startsWith('data:image/') && draft.imageUri.length > 2048) {
        const dId = draft.imageId || 'draft-onboarding-img';
        void ImageDB.save(dId, draft.imageUri);
        draft.imageId = dId;
        draft.imageUri = `idb:${dId}`;
      }
      if (draft?.faceExpr?.customFaceDataUrl && draft.faceExpr.customFaceDataUrl.length > 2048) {
        void ImageDB.save('draft-onboarding-face', draft.faceExpr.customFaceDataUrl);
        draft.faceExpr = { ...draft.faceExpr, customFaceDataUrl: 'idb:draft-onboarding-face' };
      }

      const compact: AppStateData = {
        ...state,
        activeMangnon: state.activeMangnon ? dehydrateMangnonForLocalStorage(state.activeMangnon) : null,
        restingMangnons: state.restingMangnons.map(dehydrateMangnonForLocalStorage),
        draftOnboarding: draft,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // ignore storage quota errors gracefully
    }
  },

  resetAll(): AppStateData {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      void ImageDB.clearAll();
    }
    return DEFAULT_STATE;
  },
};
