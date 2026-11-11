'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MobileFrame from '@/components/MobileFrame';
import DemoControlPanel from '@/components/DemoControlPanel';
import { AppStore, AppStateData, Mangnon, Personality, MemoryItem, ChatMessage, AppSettings, SerializableFaceExpression } from '@/lib/app-state';
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

export default function MangNonApp() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [showJourneySheet, setShowJourneySheet] = useState(false);
  const [showRestingRitual, setShowRestingRitual] = useState(false);
  const [welcomeBanner, setWelcomeBanner] = useState<string | null>(null);

  // Temporary onboarding creation draft
  const [draftImageUri, setDraftImageUri] = useState<string>('');
  const [draftImageSource, setDraftImageSource] = useState<'draw' | 'photo' | 'upload' | 'sample'>('draw');
  const [draftName, setDraftName] = useState<string>('Măng');
  const [draftPersonality, setDraftPersonality] = useState<Personality>('haohung');
  const [draftRigData, setDraftRigData] = useState<SkeletonRig | undefined>(undefined);
  const [draftFaceExpr, setDraftFaceExpr] = useState<SerializableFaceExpression | undefined>(undefined);

  // Load initial state + hydrate images from IndexedDB
  useEffect(() => {
    const loaded = AppStore.load();
    const hash = window.location.hash;
    const mappedScreen = HASH_SCREEN_MAP[hash];

    let initialScreen = loaded.currentScreen;
    if (mappedScreen) {
      initialScreen = mappedScreen;
    } else if (!loaded.activeMangnon && loaded.currentScreen === 'S06') {
      initialScreen = 'S01';
    }

    // Check Welcome Back (UC08)
    if (loaded.activeMangnon && loaded.settings.lastOpenedAt) {
      const daysDiff = (Date.now() - new Date(loaded.settings.lastOpenedAt).getTime()) / (1000 * 3600 * 24);
      if (daysDiff >= 7) {
        setWelcomeBanner(content.s06_homeForest.welcomeBackLong);
      } else if (daysDiff >= 3) {
        setWelcomeBanner(content.s06_homeForest.welcomeBackMild);
      }
    }

    // Update lastOpenedAt
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

    // Sync hash
    if (SCREEN_HASH_MAP[initialScreen]) {
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
      const next = { ...prev, bambooOpened: true };
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
    const newMangnon: Mangnon = {
      id: `mn-${Date.now()}`,
      name: draftName,
      personality: draftPersonality,
      stage: 1,
      imageUri: draftImageUri,
      imageSource: draftImageSource,
      status: 'active',
      goalTitle,
      plannedDays: durationDays as (7 | 14 | 30 | null),
      likes: ['tiếng gió reo', 'ngắm lá rơi'],
      dislike: 'nơi ồn ào',
      sessionsCount: 1,
      activeDays: [new Date().toISOString().split('T')[0]],
      createdAt: new Date().toISOString(),
      rigData: draftRigData,
      faceExpr: draftFaceExpr,
    };

    const initialGreetingMessage: ChatMessage = {
      id: `msg-init-${Date.now()}`,
      role: 'mangnon',
      text: `Chào cậu, mình là ${draftName}. Mình rất vui vì được đồng hành cùng cậu trên hành trình "${goalTitle}"!`,
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

      // Check stage progression
      const active = prev.activeMangnon;
      let nextStage = active?.stage || 1;
      const sessions = (active?.sessionsCount || 0) + 1;
      if (sessions >= 35) nextStage = 4;
      else if (sessions >= 15) nextStage = 3;
      else if (sessions >= 5) nextStage = 2;

      const next: AppStateData = {
        ...prev,
        messages: [...prev.messages, userMsg, botMsg],
        memories: newMems,
        activeMangnon: active
          ? {
              ...active,
              sessionsCount: sessions,
              stage: Math.max(active.stage, nextStage) as 1 | 2 | 3 | 4,
            }
          : null,
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
  const handleFinishRestingRitual = (lastWords: string, finalMemories: string[]) => {
    setState((prev) => {
      if (!prev || !prev.activeMangnon) return prev;
      const rested: Mangnon = {
        ...prev.activeMangnon,
        status: 'resting',
        restedAt: new Date().toISOString(),
        lastWords,
        finalMemories,
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

        {/* SCREEN ROUTING */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
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
              timeOfDay={timeOfDay}
              season={season}
              onOpenStoryChat={() => navigateTo('S07')}
              onOpenJourney={() => setShowJourneySheet(true)}
              onOpenSettings={() => navigateTo('S13')}
              onOpenBambooStalk={() => navigateTo('S01')}
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

        {/* BOTTOM NAVIGATION (3 Tabs: Rừng · Làng · Vườn) */}
        {isBottomNavVisible && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-forest-darker/95 border-t border-bamboo-mid/30 backdrop-blur-md z-30 flex items-center justify-around px-4 select-none">
            {/* Tab 1: Rừng Tre Cổ */}
            <button
              onClick={() => navigateTo('S06')}
              className={`flex flex-col items-center gap-1 transition ${
                state.currentScreen === 'S06' ? 'text-warm-glow scale-105' : 'text-dongho-paper/50 hover:text-dongho-paper'
              }`}
            >
              <span className="text-base">🎋</span>
              <span className={`text-[10px] font-bold ${state.currentScreen === 'S06' ? 'text-warm-glow' : ''}`}>
                {content.navigation.forest}
              </span>
            </button>

            {/* Tab 2: Làng Phù Đổng (Cây Đa) */}
            <button
              onClick={() => navigateTo('S12')}
              className={`flex flex-col items-center gap-1 transition ${
                state.currentScreen === 'S12' ? 'text-warm-amber scale-105' : 'text-dongho-paper/50 hover:text-dongho-paper'
              }`}
            >
              <span className="text-base">🌳</span>
              <span className={`text-[10px] font-bold ${state.currentScreen === 'S12' ? 'text-warm-amber' : ''}`}>
                {content.navigation.village}
              </span>
            </button>

            {/* Tab 3: Suối Ký Ức (Vườn) */}
            <button
              onClick={() => navigateTo('S11')}
              className={`flex flex-col items-center gap-1 transition ${
                state.currentScreen === 'S11' ? 'text-bamboo-light scale-105' : 'text-dongho-paper/50 hover:text-dongho-paper'
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
      </div>
    </MobileFrame>
  );
}
