'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MobileFrame from '@/components/MobileFrame';
import DemoControlPanel from '@/components/DemoControlPanel';
import { AppStore, AppStateData, Mangnon, Personality, MemoryItem, ChatMessage, AppSettings, SerializableFaceExpression, Stage, GrowthLevel, MangnonStats } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { SkeletonRig } from '@/lib/auto-rig';

// Screens
import S01NightForest from '@/screens/S01NightForest';
import S02OpenBamboo from '@/screens/S02OpenBamboo';
import S03CreateFigure from '@/screens/S03CreateFigure';
import S04NamingPersonality from '@/screens/S04NamingPersonality';
import S05FirstMeeting from '@/screens/S05FirstMeeting';
import S06HomeForest from '@/screens/S06HomeForest';
import S07StoryChat from '@/screens/S07StoryChat';
import S08Memories from '@/screens/S08Memories';
import S09JourneySheet from '@/screens/S09JourneySheet';
import S10RestingRitual from '@/screens/S10RestingRitual';
import S11MemoryStream from '@/screens/S11MemoryStream';
import S12PhuDongVillage from '@/screens/S12PhuDongVillage';
import S13Settings from '@/screens/S13Settings';
import WelcomeLoginModal from '@/components/WelcomeLoginModal';
import UserProfileModal, { UserAccount } from '@/components/UserProfileModal';
import { setupLocalhostMemoryCleanup } from '@/lib/memory-cleanup';
import {
  registerGoalOnChain,
  linkGoalsOnChain,
  recordFocusVaultOnChain,
  mintJourneyNftOnChain,
  contributeVillageTreeOnChain,
} from '@/lib/avalanche-contracts';

// Hash routes mapping
const SCREEN_HASH_MAP: Record<string, string> = {
  S01: '#/bat-dau/ong-nua',
  S02: '#/bat-dau/mo',
  S03: '#/bat-dau/tao-hinh',
  S04: '#/bat-dau/dat-ten',
  S05: '#/bat-dau/gap-dau',
  S06: '#/rung',
  S07: '#/ke',
  S08: '#/nho',
  S11: '#/vuon',
  S12: '#/lang',
  S13: '#/cai-dat',
};

const HASH_SCREEN_MAP: Record<string, string> = {
  '#/bat-dau/ong-nua': 'S01',
  '#/bat-dau/mo': 'S02',
  '#/bat-dau/tao-hinh': 'S03',
  '#/bat-dau/dat-ten': 'S04',
  '#/bat-dau/gap-dau': 'S05',
  '#/rung': 'S06',
  '#/ke': 'S07',
  '#/nho': 'S08',
  '#/vuon': 'S11',
  '#/lang': 'S12',
  '#/cai-dat': 'S13',
};

function autoSetupGoalStats(
  goalTitle: string,
  personality: Personality,
  plannedDays: number | null
): MangnonStats {
  const lower = goalTitle.toLowerCase();
  const stats: MangnonStats = {
    intelligence: 10,
    perseverance: 10,
    fitness: 10,
    creativity: 10,
  };

  // 1. Cộng điểm tự động theo từ khóa mục tiêu
  if (/(học|ôn|thi|ielts|code|ai|toán|đọc|nghiên cứu|đồ án|paper|study|research)/i.test(lower)) {
    stats.intelligence += 12;
  }
  if (/(vẽ|thiết kế|ui|ux|nhạc|viết|sáng tạo|art|game|design|paint)/i.test(lower)) {
    stats.creativity += 12;
  }
  if (/(chạy|tập|gym|ngủ|thể dục|sức khỏe|thiền|yoga|nước|walk|health|fitness)/i.test(lower)) {
    stats.fitness += 12;
  }
  if (plannedDays && plannedDays >= 14) {
    stats.perseverance += 10;
  } else {
    stats.perseverance += 6;
  }

  // 2. Cộng điểm theo Tính cách đã chọn ở S04
  if (personality === 'tomo') stats.intelligence += 6;
  if (personality === 'haohung') stats.fitness += 6;
  if (personality === 'diemtinh') stats.perseverance += 6;
  if (personality === 'nhutnhat') stats.creativity += 6;

  return stats;
}

function StudioIncubationBadge({ startedAt }: { startedAt?: number }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!startedAt) return 120;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, 120 - elapsed);
  });

  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSecondsLeft(Math.max(0, 120 - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <aside
      aria-label="Tiến trình mầm măng lớn ngoài rừng"
      className="absolute top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-max max-w-[92%]"
    >
      <div className="px-3.5 py-1 rounded-full bg-[#F4EEDD]/95 border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] flex items-center gap-1.5 backdrop-blur-sm animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-[#7E9A85] animate-pulse flex-shrink-0" />
        <span className="text-[11px] font-extrabold text-[#26292B] leading-tight">
          {secondsLeft > 0 ? (
            <>🎋 Mầm măng đang lớn ngoài rừng: <span className="font-mono text-[#A84D3D]">{timeFormatted}</span></>
          ) : (
            <>✨ Cây tre đã lớn! Hoàn tất thiết kế để mở đốt nứa!</>
          )}
        </span>
      </div>
    </aside>
  );
}

export default function MangNonApp() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [showJourneySheet, setShowJourneySheet] = useState(false);
  const [showRestingRitual, setShowRestingRitual] = useState(false);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);
  const [showWelcomeLogin, setShowWelcomeLogin] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);

  // Temporary onboarding creation draft
  const [draftImageUri, setDraftImageUri] = useState<string>('');
  const [draftImageSource, setDraftImageSource] = useState<'draw' | 'photo' | 'upload' | 'sample'>('draw');
  const [draftName, setDraftName] = useState<string>('Mang');
  const [draftPersonality, setDraftPersonality] = useState<Personality>('haohung');
  const [draftRigData, setDraftRigData] = useState<SkeletonRig | undefined>(undefined);
  const [draftFaceExpr, setDraftFaceExpr] = useState<SerializableFaceExpression | undefined>(undefined);

  // Load initial state + hydrate images from IndexedDB
  useEffect(() => {
    // Tự động giải phóng RAM khi đóng tab / reload trên localhost
    setupLocalhostMemoryCleanup();

    const loaded = AppStore.load();

    // Check user account for Avalanche wallet
    let parsedUser: UserAccount | null = null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('mangnon_user_account') : null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
        setUserAccount(parsedUser);
      } catch {}
    } else {
      // Tự động khởi tạo phiên Học Giả Măng Non (+100 Giọt Sương) để trải nghiệm liền mạch
      const guestUser: UserAccount = {
        email: 'hoc.gia.khach@mangnon.vn',
        name: 'Học Giả Măng Non',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=mangnon_guest',
        embeddedAddress: '0x372587d6BF5B3c3a2D267df6a22f87E3F9ebb0AA',
        walletType: 'embedded',
        provider: 'embedded',
        connectedAt: new Date().toISOString(),
        dewdrops: 100,
        isStudent: false,
      };
      parsedUser = guestUser;
      setUserAccount(guestUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mangnon_user_account', JSON.stringify(guestUser));
      }
    }

    // Kiểm tra nếu người chơi mở trực tiếp đường dẫn URL có hash (ví dụ: http://localhost:3000/#/rung)
    const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashTargetScreen = HASH_SCREEN_MAP[currentHash];

    // Ưu tiên:
    // 1. Hash người chơi chủ động gõ trên thanh URL (e.g. #/rung -> S06)
    // 2. Mặc định: S06 nếu đã đăng nhập / có tài khoản, S01 nếu chưa
    const isLoggedIn = !!parsedUser || !!loaded.userProfile?.walletAddress;
    const initialScreen = hashTargetScreen || (isLoggedIn ? 'S06' : 'S01');

    // Check Welcome Back (UC08)
    if (loaded.activeMangnon && loaded.settings.lastOpenedAt) {
      const daysDiff = (Date.now() - new Date(loaded.settings.lastOpenedAt).getTime()) / (1000 * 3600 * 24);
      if (daysDiff >= 7) {
        setWelcomeBanner(content.s06_homeForest.welcomeBackLong);
      } else if (daysDiff >= 3) {
        setWelcomeBanner(content.s06_homeForest.welcomeBackMild);
      }
    }

    // Update lastOpenedAt & reset currentScreen to initialScreen
    const withTimestamp = {
      ...loaded,
      currentScreen: initialScreen,
      settings: {
        ...loaded.settings,
        lastOpenedAt: new Date().toISOString(),
      },
    };

    // Sync SoundEngine muted state to saved setting (default: muted = true per §9.7)
    SoundEngine.setMuted(!withTimestamp.settings.soundOn);

    // Hydrate images from IndexedDB (async), then set state
    AppStore.hydrateImages(withTimestamp).then((hydrated) => {
      setState(hydrated);
      AppStore.save(hydrated);
    });

    // Chỉ đồng bộ hash nếu hash hiện tại chưa khớp với màn hình khởi động
    if (SCREEN_HASH_MAP[initialScreen] && window.location.hash !== SCREEN_HASH_MAP[initialScreen]) {
      window.location.hash = SCREEN_HASH_MAP[initialScreen];
    }
  }, []);

  // Sync SoundEngine when soundOn setting changes after mount
  useEffect(() => {
    if (state) {
      SoundEngine.setMuted(!state.settings.soundOn);
    }
  }, [state?.settings.soundOn]);

  // Listen to hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash;
      const targetScreen = HASH_SCREEN_MAP[h];
      if (targetScreen && state && state.currentScreen !== targetScreen) {
        setState((prev) => {
          if (!prev) return prev;
          const next = { ...prev, currentScreen: targetScreen };
          AppStore.save(next);
          return next;
        });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [state]);

  // Navigate helper
  const navigateTo = useCallback((screen: string) => {
    SoundEngine.playBambooKnock();
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, currentScreen: screen };
      AppStore.save(next);
      return next;
    });
    if (SCREEN_HASH_MAP[screen]) {
      window.location.hash = SCREEN_HASH_MAP[screen];
    }
  }, []);

  if (!state) return null;

  // Determine current effective time of day and season
  const getTimeOfDay = (): 'morning' | 'noon' | 'dusk' | 'night' => {
    if (state.settings.timeOverride && state.settings.timeOverride !== 'real') {
      return state.settings.timeOverride;
    }
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'noon';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  };

  const getSeason = (): 'spring' | 'summer' | 'autumn' | 'winter' => {
    if (state.settings.seasonOverride && state.settings.seasonOverride !== 'real') {
      return state.settings.seasonOverride;
    }
    const month = new Date().getMonth() + 1;
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  };

  const timeOfDay = getTimeOfDay();
  const season = getSeason();

  // Bottom Navigation visibility
  const isBottomNavVisible = ['S06', 'S11', 'S12'].includes(state.currentScreen) && !showJourneySheet && !showRestingRitual;

  // FLOW A: Onboarding Steps
  const handleTapBambooS01 = () => {
    navigateTo('S02');
  };

  const handleCompleteS02 = () => {
    setState((prev) => {
      if (!prev) return prev;
      const currentDewdrops = typeof prev.dewdrops === 'number' ? prev.dewdrops : 100;
      const nextDewdrops = Math.max(0, currentDewdrops - 20);
      const next: AppStateData = {
        ...prev,
        dewdrops: nextDewdrops,
        incubationStartedAt: prev.incubationStartedAt || Date.now(),
        bambooOpened: true,
      };
      AppStore.save(next);
      return next;
    });
    navigateTo('S03');
  };

  const handleConfirmFigureS03 = (
    imageUri: string,
    source: 'draw' | 'photo' | 'upload' | 'sample',
    rigData?: SkeletonRig,
    faceExpr?: SerializableFaceExpression
  ) => {
    setDraftImageUri(imageUri);
    setDraftImageSource(source);
    if (rigData) setDraftRigData(rigData);
    if (faceExpr) setDraftFaceExpr(faceExpr);
    navigateTo('S04');
  };

  const handleNextNamingS04 = (name: string, personality: Personality) => {
    setDraftName(name);
    setDraftPersonality(personality);
    navigateTo('S05');
  };

  const handleCompleteFirstMeetingS05 = (goalTitle: string, durationDays: number | null) => {
    const startedAt = state?.incubationStartedAt || Date.now();
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const initialHatchStage: Stage = elapsedSeconds >= 120 ? 3 : 2;

    const newMangnon: Mangnon = {
      id: `mn-${Date.now()}`,
      name: draftName,
      personality: draftPersonality,
      stage: initialHatchStage,
      growthLevel: 1,
      stats: autoSetupGoalStats(goalTitle, draftPersonality, durationDays),
      incubationStartedAt: startedAt,
      imageUri: draftImageUri,
      imageSource: draftImageSource,
      status: 'active',
      goalTitle,
      plannedDays: durationDays as (7 | 14 | 30 | null),
      likes: ['whispering wind', 'watching falling leaves'],
      dislike: 'crowded noise',
      sessionsCount: 1,
      activeDays: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString(),
      rigData: draftRigData,
      faceExpr: draftFaceExpr,
    };

    const initialGreetingMessage: ChatMessage = {
      id: `msg-init-${Date.now()}`,
      role: 'mangnon',
      text: `Chào bạn, mình là ${draftName}. Mình rất vui được đồng hành cùng bạn trên hành trình "${goalTitle}"!`,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => {
      if (!prev) return prev;
      const next: AppStateData = {
        ...prev,
        activeMangnon: newMangnon,
        currentScreen: 'S06',
        messages: [initialGreetingMessage],
      };
      AppStore.save(next);
      return next;
    });

    // 🔗 Register goal on Avalanche Fuji GoalRegistry.sol
    const personalityIndex = draftPersonality === 'tomo' ? 0 : draftPersonality === 'haohung' ? 1 : draftPersonality === 'diemtinh' ? 2 : 3;
    registerGoalOnChain({
      name: goalTitle,
      personality: personalityIndex,
      plannedDays: durationDays || 14,
    }).then((res) => {
      setState((prev) => {
        if (!prev || !prev.activeMangnon) return prev;
        const next = {
          ...prev,
          activeMangnon: {
            ...prev.activeMangnon,
            goalTxHash: res.txHash,
          },
        };
        AppStore.save(next);
        return next;
      });
    }).catch(console.warn);

    SoundEngine.playBlessingChime();
    navigateTo('S06');
  };

  // FLOW B: Story Chat & Memories
  const handleSendMessageS07 = (userText: string, replyText: string, newMemoryCandidate?: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const userMsg: ChatMessage = {
        id: `msg-u-${Date.now()}`,
        role: 'user',
        text: userText,
        createdAt: new Date().toISOString(),
      };
      const botMsg: ChatMessage = {
        id: `msg-b-${Date.now() + 1}`,
        role: 'mangnon',
        text: replyText,
        createdAt: new Date().toISOString(),
      };

      let newMems = prev.memories;
      if (newMemoryCandidate && prev.activeMangnon) {
        const memItem: MemoryItem = {
          id: `mem-${Date.now()}`,
          mangnonId: prev.activeMangnon.id,
          text: newMemoryCandidate,
          pinned: false,
          forgotten: false,
          createdAt: new Date().toISOString(),
        };
        newMems = [memItem, ...prev.memories];
      }

      // Check cognitive growthLevel progression (levels 1..4), NEVER overwrite hatching stage!
      const active = prev.activeMangnon;
      let nextGrowth: GrowthLevel = active?.growthLevel || 1;
      const sessions = (active?.sessionsCount || 0) + 1;
      if (sessions >= 35) nextGrowth = 4;
      else if (sessions >= 15) nextGrowth = 3;
      else if (sessions >= 5) nextGrowth = 2;

      // Update stats: chat increases intelligence +2, creativity +1 (+ resonance if linked)
      let updatedStats = active?.stats;
      let updatedResting = prev.restingMangnons;
      if (active) {
        const currentStats = active.stats || { intelligence: 10, perseverance: 10, fitness: 10, creativity: 10 };
        const nextStats = {
          ...currentStats,
          intelligence: currentStats.intelligence + 2,
          creativity: currentStats.creativity + 1,
        };
        if (active.linkedMangnonId) {
          const keys: (keyof MangnonStats)[] = ['intelligence', 'perseverance', 'fitness', 'creativity'];
          let minKey = keys[0];
          for (const k of keys) {
            if (nextStats[k] < nextStats[minKey]) minKey = k;
          }
          nextStats[minKey] += 1; // +25% resonance bonus to weakest stat

          // +20% to linked resting mangnon
          updatedResting = prev.restingMangnons.map((r) => {
            if (r.id === active.linkedMangnonId && r.stats) {
              return { ...r, stats: { ...r.stats, intelligence: r.stats.intelligence + 1 } };
            }
            return r;
          });
        }
        updatedStats = nextStats;
      }

      const next: AppStateData = {
        ...prev,
        messages: [...prev.messages, userMsg, botMsg],
        memories: newMems,
        restingMangnons: updatedResting,
        activeMangnon: active
          ? {
              ...active,
              sessionsCount: sessions,
              growthLevel: Math.max(active.growthLevel || 1, nextGrowth) as GrowthLevel,
              stats: updatedStats,
            }
          : null,
      };
      AppStore.save(next);
      return next;
    });
  };

  const handleLinkMangnon = (targetId: string, txHash?: string) => {
    let finalTx = txHash;
    if (!finalTx) {
      linkGoalsOnChain(1, 2).then((res) => {
        setState((prev) => {
          if (!prev || !prev.activeMangnon) return prev;
          const next = {
            ...prev,
            activeMangnon: {
              ...prev.activeMangnon,
              linkedMangnonId: targetId,
              synergyTxHash: res.txHash,
            },
          };
          AppStore.save(next);
          return next;
        });
      }).catch(console.warn);
      finalTx = `0xRoot${Date.now().toString(16).slice(-8)}...fuji`;
    }

    setState((prev) => {
      if (!prev || !prev.activeMangnon) return prev;
      const next: AppStateData = {
        ...prev,
        activeMangnon: {
          ...prev.activeMangnon,
          linkedMangnonId: targetId,
          synergyTxHash: finalTx,
        },
      };
      AppStore.save(next);
      return next;
    });
  };

  // Toggle Pin Memory
  const handleTogglePinMemory = (memoryId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const updated = prev.memories.map((m) =>
        m.id === memoryId ? { ...m, pinned: !m.pinned } : m
      );
      const next = { ...prev, memories: updated };
      AppStore.save(next);
      return next;
    });
  };

  // Forget Memory (UC07)
  const handleForgetMemory = (memoryId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const updated = prev.memories.map((m) =>
        m.id === memoryId ? { ...m, forgotten: true } : m
      );
      const next = { ...prev, memories: updated };
      AppStore.save(next);
      return next;
    });
  };

  // FLOW C: Resting Ritual (S10)
  const handleFinishRestingRitual = (lastWords: string, finalMemories: string[], txHash?: string) => {
    let finalNftTx = txHash;
    if (!finalNftTx && state?.activeMangnon) {
      const recipient = userAccount?.embeddedAddress || '0x372587d6BF5B3c3a2D267df6a22f87E3F9ebb0AA';
      mintJourneyNftOnChain({
        toAddress: recipient,
        goalId: 1,
        goalName: state.activeMangnon.goalTitle,
        daysActive: state.activeMangnon.activeDays.length,
        sessionsCount: state.activeMangnon.sessionsCount,
        memoryUri: `ipfs://mangnon-${state.activeMangnon.id}`,
      }).then((res) => {
        setState((prev) => {
          if (!prev) return prev;
          const updatedResting = prev.restingMangnons.map((r) =>
            r.id === state.activeMangnon?.id ? { ...r, nftTxHash: res.txHash } : r
          );
          const next = { ...prev, restingMangnons: updatedResting };
          AppStore.save(next);
          return next;
        });
      }).catch(console.warn);
      finalNftTx = `0xNFT${Date.now().toString(16).slice(-8)}...fuji`;
    }

    setState((prev) => {
      if (!prev || !prev.activeMangnon) return prev;
      const rested: Mangnon = {
        ...prev.activeMangnon,
        status: 'resting',
        restedAt: new Date().toISOString(),
        lastWords,
        finalMemories,
        nftTxHash: finalNftTx,
      };

      const next: AppStateData = {
        ...prev,
        activeMangnon: null,
        restingMangnons: [rested, ...prev.restingMangnons],
        villageLeaves: prev.villageLeaves + 1,
        currentScreen: 'S06',
      };
      AppStore.save(next);
      return next;
    });

    setShowRestingRitual(false);
    setShowJourneySheet(false);
    navigateTo('S06');
  };

  // FLOW D: Trigger Bloom on Village Tree
  const handleTriggerBloom = () => {
    setState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        villageLeaves: Math.max(prev.villageLeaves, prev.villageThreshold),
        lastBloomedAt: new Date().toISOString(),
      };
      AppStore.save(next);
      return next;
    });
  };

  // FLOW H: Reset All Data (UC14)
  const handleResetAllData = () => {
    const fresh = AppStore.resetAll();
    setState(fresh);
    navigateTo('S01');
  };

  return (
    <MobileFrame>
      <div
        className="relative w-full h-full flex flex-col overflow-hidden bg-forest-abyss"
        data-reduced-motion={state.settings.reducedMotion ? 'true' : undefined}
      >
        {/* Welcome Back Mild Toast (UC08) */}
        {welcomeBanner && (
          <div className="absolute top-12 left-4 right-4 z-40 p-3 rounded-2xl bg-forest-darker/95 border border-warm-amber/60 text-dongho-paper text-xs shadow-2xl flex items-center justify-between animate-fade-in">
            <span className="italic">{welcomeBanner}</span>
            <button
              onClick={() => setWelcomeBanner(null)}
              className="text-dongho-paper/60 hover:text-dongho-paper text-xs ml-2 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* UNIFIED COMPACT HUD PILL (Chỉ hiện ở 3 màn hình chính S06, S11, S12) */}
        {['S06', 'S11', 'S12'].includes(state.currentScreen) && !showJourneySheet && !showRestingRitual && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <button
              onClick={() => setShowUserProfile(true)}
              className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4EEDD]/95 text-[#26292B] border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] text-[11px] font-extrabold transition active:translate-y-0.5"
              title="Mở Túi Gấm Học Giả & Ví Avalanche Fuji"
            >
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#7E9A85]" />
                <span>
                  {userAccount?.embeddedAddress
                    ? `${userAccount.embeddedAddress.slice(0, 4)}...${userAccount.embeddedAddress.slice(-3)}`
                    : 'Túi Gấm'}
                </span>
              </span>
              <span className="text-[#26292B]/30">|</span>
              <span className="flex items-center gap-0.5">
                <span>💧</span>
                <span>{typeof state.dewdrops === 'number' ? state.dewdrops : 100}</span>
              </span>
              <span className="text-[#26292B]/30">|</span>
              <span className="flex items-center gap-0.5 text-[#5A6544]">
                <span>🍃</span>
                <span>{state.villageLeaves}</span>
              </span>
            </button>
          </div>
        )}

        {/* SCREEN ROUTING */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          {['S03', 'S04', 'S05'].includes(state.currentScreen) && (
            <StudioIncubationBadge startedAt={state.incubationStartedAt} />
          )}

          {state.currentScreen === 'S01' && (
            <S01NightForest
              onTapBamboo={handleTapBambooS01}
              isNightTime={timeOfDay === 'night'}
            />
          )}

          {state.currentScreen === 'S02' && (
            <S02OpenBamboo onComplete={handleCompleteS02} allowSkip={state.bambooOpened} />
          )}

          {state.currentScreen === 'S03' && (
            <S03CreateFigure onConfirm={handleConfirmFigureS03} />
          )}

          {state.currentScreen === 'S04' && (
            <S04NamingPersonality
              imageUri={draftImageUri}
              onNext={handleNextNamingS04}
            />
          )}

          {state.currentScreen === 'S05' && (
            <S05FirstMeeting
              name={draftName}
              personality={draftPersonality}
              imageUri={draftImageUri}
              onComplete={handleCompleteFirstMeetingS05}
            />
          )}

          {state.currentScreen === 'S06' && (
            <S06HomeForest
              mangnon={state.activeMangnon}
              restingMangnons={state.restingMangnons}
              timeOfDay={timeOfDay}
              season={season}
              lastOpenedAt={state.settings.lastOpenedAt}
              dewdrops={state.dewdrops}
              onOpenStoryChat={() => navigateTo('S07')}
              onOpenJourney={() => setShowJourneySheet(true)}
              onOpenSettings={() => navigateTo('S13')}
              onLinkMangnon={handleLinkMangnon}
              onOpenBambooStalk={() => {
                setState((prev) => {
                  if (!prev) return prev;
                  const currentDewdrops = typeof prev.dewdrops === 'number' ? prev.dewdrops : 100;
                  const nextDewdrops = Math.max(0, currentDewdrops - 20);
                  const next: AppStateData = {
                    ...prev,
                    dewdrops: nextDewdrops,
                    incubationStartedAt: Date.now(),
                    bambooOpened: true,
                  };
                  AppStore.save(next);
                  return next;
                });
                navigateTo('S03');
              }}
              onUpdateStage={(stage) => {
                setState((prev) => {
                  if (!prev) return prev;
                  if (!prev.activeMangnon) return prev;
                  const next: AppStateData = {
                    ...prev,
                    activeMangnon: { ...prev.activeMangnon, stage },
                  };
                  AppStore.save(next);
                  return next;
                });
              }}
              onFocusReward={(leaves, note) => {
                setState((prev) => {
                  if (!prev) return prev;
                  const active = prev.activeMangnon;
                  let updatedStats = active?.stats;
                  let updatedResting = prev.restingMangnons;

                  if (active) {
                    const currentStats = active.stats || { intelligence: 10, perseverance: 10, fitness: 10, creativity: 10 };
                    // Default focus increases perseverance +3, intelligence +2
                    const nextStats = {
                      ...currentStats,
                      perseverance: currentStats.perseverance + 3,
                      intelligence: currentStats.intelligence + 2,
                    };

                    // Root resonance if linked
                    if (active.linkedMangnonId) {
                      const keys: (keyof MangnonStats)[] = ['intelligence', 'perseverance', 'fitness', 'creativity'];
                      let minKey = keys[0];
                      for (const k of keys) {
                        if (nextStats[k] < nextStats[minKey]) minKey = k;
                      }
                      nextStats[minKey] += 2; // +25% bonus to weakest stat

                      // Pass +20% (1 point) to linked resting mangnon if found
                      updatedResting = prev.restingMangnons.map((r) => {
                        if (r.id === active.linkedMangnonId && r.stats) {
                          return {
                            ...r,
                            stats: { ...r.stats, perseverance: r.stats.perseverance + 1 },
                          };
                        }
                        return r;
                      });
                    }
                    updatedStats = nextStats;
                  }

                  const memItem = {
                    id: `mem-${Date.now()}`,
                    mangnonId: prev.activeMangnon?.id || 'mn-default',
                    text: `You shared: Wrapped up a study session (${note || 'Deep Focus'})`,
                    pinned: false,
                    forgotten: false,
                    createdAt: new Date().toISOString(),
                  };
                  const next: AppStateData = {
                    ...prev,
                    villageLeaves: prev.villageLeaves + leaves,
                    memories: [memItem, ...prev.memories],
                    restingMangnons: updatedResting,
                    activeMangnon: active
                      ? {
                          ...active,
                          stats: updatedStats,
                        }
                      : null,
                  };
                  AppStore.save(next);

                  // 🔗 Record Proof-of-Focus on Avalanche Fuji MamLucVault.sol
                  recordFocusVaultOnChain({
                    goalId: 1,
                    minutesFocused: 25,
                    leavesEarned: leaves,
                  }).catch(console.warn);

                  return next;
                });
              }}
            />
          )}

          {state.currentScreen === 'S07' && state.activeMangnon && (
            <S07StoryChat
              mangnon={state.activeMangnon}
              memories={state.memories}
              messages={state.messages}
              onSendMessage={handleSendMessageS07}
              onOpenMemories={() => navigateTo('S08')}
              onBack={() => navigateTo('S06')}
            />
          )}

          {state.currentScreen === 'S08' && state.activeMangnon && (
            <S08Memories
              mangnon={state.activeMangnon}
              memories={state.memories}
              onTogglePin={handleTogglePinMemory}
              onForget={handleForgetMemory}
              onBack={() => navigateTo('S07')}
            />
          )}

          {state.currentScreen === 'S11' && (
            <S11MemoryStream restingMangnons={state.restingMangnons} />
          )}

          {state.currentScreen === 'S12' && (
            <S12PhuDongVillage
              leaves={state.villageLeaves}
              threshold={state.villageThreshold}
              lastBloomedAt={state.lastBloomedAt}
              onTriggerBloom={handleTriggerBloom}
              onContributeLeaves={(amt) => {
                setState((prev) => {
                  if (!prev) return prev;
                  const next = { ...prev, villageLeaves: Math.max(0, prev.villageLeaves - amt) };
                  AppStore.save(next);
                  return next;
                });
              }}
            />
          )}

          {state.currentScreen === 'S13' && (
            <S13Settings
              mangnon={state.activeMangnon}
              settings={state.settings}
              onUpdateSettings={(updater) => {
                setState((prev) => {
                  if (!prev) return prev;
                  const nextSettings = updater(prev.settings);
                  const next = { ...prev, settings: nextSettings };
                  AppStore.save(next);
                  return next;
                });
              }}
              onRenameMangnon={(newName) => {
                setState((prev) => {
                  if (!prev || !prev.activeMangnon) return prev;
                  const next = {
                    ...prev,
                    activeMangnon: { ...prev.activeMangnon, name: newName },
                  };
                  AppStore.save(next);
                  return next;
                });
              }}
              onResetAllData={handleResetAllData}
              onBack={() => navigateTo('S06')}
            />
          )}
        </div>

        {/* S09 Journey Bottom Sheet Overlay */}
        {showJourneySheet && state.activeMangnon && (
          <S09JourneySheet
            mangnon={state.activeMangnon}
            onUpdateTitle={(newTitle) => {
              setState((prev) => {
                if (!prev || !prev.activeMangnon) return prev;
                const next = {
                  ...prev,
                  activeMangnon: { ...prev.activeMangnon, goalTitle: newTitle },
                };
                AppStore.save(next);
                return next;
              });
            }}
            onCloseJourney={() => {
              setShowJourneySheet(false);
              setShowRestingRitual(true);
            }}
            onCloseSheet={() => setShowJourneySheet(false)}
          />
        )}

        {/* S10 Resting Ritual Overlay */}
        {showRestingRitual && state.activeMangnon && (
          <div className="absolute inset-0 z-50 bg-forest-abyss">
            <S10RestingRitual
              mangnon={state.activeMangnon}
              memories={state.memories}
              onFinishRitual={handleFinishRestingRitual}
              onCancel={() => setShowRestingRitual(false)}
            />
          </div>
        )}

        {/* BOTTOM NAVIGATION (3 Tabs: Forest · Village · Memory) */}
        {isBottomNavVisible && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#1A2426] border-t-2 border-[#26292B] z-30 flex items-center justify-around px-4 select-none">
            {/* Tab 1: Bamboo Grove */}
            <button
              onClick={() => navigateTo('S06')}
              className={`flex flex-col items-center gap-1 transition-transform hover:animate-wiggle-2d ${
                state.currentScreen === 'S06' ? 'text-warm-glow scale-105' : 'text-dongho-paper/60 hover:text-dongho-paper'
              }`}
            >
              <span className="text-base">🎋</span>
              <span className={`text-[10px] font-bold ${state.currentScreen === 'S06' ? 'text-warm-glow' : ''}`}>
                {content.navigation.forest}
              </span>
            </button>

            {/* Tab 2: Phu Dong Village */}
            <button
              onClick={() => navigateTo('S12')}
              className={`flex flex-col items-center gap-1 transition-transform hover:animate-wiggle-2d ${
                state.currentScreen === 'S12' ? 'text-warm-amber scale-105' : 'text-dongho-paper/60 hover:text-dongho-paper'
              }`}
            >
              <span className="text-base">🌳</span>
              <span className={`text-[10px] font-bold ${state.currentScreen === 'S12' ? 'text-warm-amber' : ''}`}>
                {content.navigation.village}
              </span>
            </button>

            {/* Tab 3: Stream of Memories */}
            <button
              onClick={() => navigateTo('S11')}
              className={`flex flex-col items-center gap-1 transition-transform hover:animate-wiggle-2d ${
                state.currentScreen === 'S11' ? 'text-bamboo-light scale-105' : 'text-dongho-paper/60 hover:text-dongho-paper'
              }`}
            >
              <span className="text-base">🌊</span>
              <span className={`text-[10px] font-bold ${state.currentScreen === 'S11' ? 'text-bamboo-light' : ''}`}>
                {content.navigation.memory}
              </span>
            </button>
          </div>
        )}

        {/* S14 Demo Control Panel Overlay (Always available when demoMode is active) */}
        <DemoControlPanel
          state={state}
          onUpdateState={(updater) => {
            setState((prev) => {
              if (!prev) return prev;
              const next = updater(prev);
              AppStore.save(next);
              return next;
            });
          }}
          onNavigate={(s) => {
            if (s === 'S10') {
              setShowRestingRitual(true);
            } else {
              navigateTo(s);
            }
          }}
          onTriggerBloom={handleTriggerBloom}
        />

        {/* Welcome Login Modal */}
        <WelcomeLoginModal
          isOpen={showWelcomeLogin}
          onClose={() => setShowWelcomeLogin(false)}
          onLogin={(user) => {
            setUserAccount(user);
            setState((prev) => {
              if (!prev) return prev;
              const next = {
                ...prev,
                currentScreen: 'S06',
                dewdrops: Math.max(prev.dewdrops, user.dewdrops || 100),
                userProfile: {
                  username: user.name,
                  walletAddress: user.embeddedAddress,
                  walletType: user.walletType || 'embedded',
                  hasClaimedStarter: true,
                },
              };
              AppStore.save(next);
              return next;
            });
            window.location.hash = '#/rung';
            setShowWelcomeLogin(false);
          }}
        />

        {/* User Profile / Avalanche Wallet Modal */}
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          onUserChange={(user) => {
            setUserAccount(user);
            if (user) {
              setState((prev) => {
                if (!prev) return prev;
                const next = {
                  ...prev,
                  dewdrops: typeof user.dewdrops === 'number' ? user.dewdrops : prev.dewdrops,
                  userProfile: {
                    username: user.name,
                    walletAddress: user.embeddedAddress,
                    walletType: user.walletType || 'embedded',
                    hasClaimedStarter: true,
                  },
                };
                AppStore.save(next);
                return next;
              });
            }
          }}
          villageLeaves={state.villageLeaves}
          dewdrops={typeof state.dewdrops === 'number' ? state.dewdrops : 100}
        />
      </div>
    </MobileFrame>
  );
}
