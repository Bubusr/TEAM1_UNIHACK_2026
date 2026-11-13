'use client';

import React, { useState } from 'react';
import { AppStateData, Mangnon } from '@/lib/app-state';
import { Settings2, X, Sun, Moon, Sparkles, RefreshCw, FastForward, Heart, Flower2, Waves, Leaf } from 'lucide-react';

interface DemoControlPanelProps {
  state: AppStateData;
  onUpdateState: (updater: (prev: AppStateData) => AppStateData) => void;
  onNavigate: (screen: string) => void;
  onTriggerBloom: () => void;
}

export default function DemoControlPanel({
  state,
  onUpdateState,
  onNavigate,
  onTriggerBloom,
}: DemoControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!state.settings.demoMode) return null;

  const handleSeedMemories = () => {
    const seedTexts = [
      'You shared: Found a quiet sunlit cafe around the corner',
      'You shared: Started my first lesson on algorithms',
      'You shared: Watched a gentle tabby cat dozing on a stone wall',
      'You shared: Felt a bit exhausted after a long day of classes',
      'You shared: Brewed a warm cup of chamomile tea',
      'You shared: Wrote the first 5 pages of my story draft',
      'You shared: Remembered a peaceful childhood beach trip',
      'You shared: Felt at peace after speaking my mind honestly',
    ];

    onUpdateState((prev) => {
      const activeId = prev.activeMangnon?.id || 'mn-current';
      const newItems = seedTexts.map((text, idx) => ({
        id: `mem-seed-${Date.now()}-${idx}`,
        mangnonId: activeId,
        text,
        pinned: idx === 0,
        forgotten: false,
        createdAt: new Date(Date.now() - (8 - idx) * 86400000).toISOString(),
      }));

      return {
        ...prev,
        memories: [...newItems, ...prev.memories],
      };
    });
  };

  const handleSimulateDays = (days: number) => {
    onUpdateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        lastOpenedAt: new Date(Date.now() - days * 86400000).toISOString(),
      },
    }));
    onNavigate('S06');
    setIsOpen(false);
  };

  const handleSeedRestingMangnons = () => {
    onUpdateState((prev) => {
      const seedResting: Mangnon[] = [
        {
          id: 'rested-1',
          name: 'Golden Bamboo',
          personality: 'diemtinh',
          stage: 4,
          imageUri: '/presets/figure1.png',
          imageSource: 'sample',
          status: 'resting',
          goalTitle: 'Read 12 classic literature books',
          likes: ['Reading', 'Cool breeze'],
          dislike: null,
          sessionsCount: 36,
          activeDays: ['2026-10-01', '2026-10-15', '2026-11-01'],
          createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
          restedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          lastWords: 'Thank you for your steady patience. Everything you shared lingers like morning dew.',
          finalMemories: [
            'You shared: Reading by the balcony listening to rain',
            'You shared: Finished the last chapter of my favorite book',
            'You shared: Felt calm like water flowing over river stones',
          ],
          nftTxHash: '0x7db4be38e24a710476916b4e576bd12c2e603a4eb9237ff449d21ecd304407d9',
        },
        {
          id: 'rested-2',
          name: 'Green Bud',
          personality: 'haohung',
          stage: 3,
          imageUri: '/presets/figure2.png',
          imageSource: 'sample',
          status: 'resting',
          goalTitle: 'Morning 5km run around the lake',
          likes: ['Running', 'Sunrise'],
          dislike: null,
          sessionsCount: 18,
          activeDays: ['2026-10-12', '2026-10-25', '2026-11-05'],
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          restedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          lastWords: 'Our time together was so wonderful!! Even resting by the river stones, I cherish your smile!',
          finalMemories: [
            'You shared: Woke up early to greet the golden sunrise',
            'You shared: Pushed through tiredness to finish 5km',
            'You shared: Morning breeze through bamboo made my heart light',
          ],
          nftTxHash: '0xae9e327a569146e2d59f2fa4b4749f3060591da1c05de09a4af5eda0b5e191a1',
        },
        {
          id: 'rested-3',
          name: 'Emerald Sprout',
          personality: 'tomo',
          stage: 2,
          imageUri: '/presets/figure3.png',
          imageSource: 'sample',
          status: 'resting',
          goalTitle: 'Learn 50 new vocabulary words weekly',
          likes: ['New words', 'Storytelling'],
          dislike: null,
          sessionsCount: 8,
          activeDays: ['2026-10-20', '2026-11-02'],
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          restedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          lastWords: 'Walking with you, I learned how vast and gentle this world can be.',
          finalMemories: [
            'You shared: Learned a poetic new word today',
            'You shared: Spoke with friends with quiet confidence',
            'You shared: Remembered the flutter of first taking courage',
          ],
        },
      ];

      return {
        ...prev,
        restingMangnons: [
          ...seedResting,
          ...prev.restingMangnons.filter((r) => !r.id.startsWith('rested-')),
        ],
      };
    });
    onNavigate('S11');
    setIsOpen(false);
  };

  const handleAddLeaves = (count: number) => {
    onUpdateState((prev) => ({
      ...prev,
      villageLeaves: prev.villageLeaves + count,
    }));
  };

  return (
    <>
      {/* Floating Demo Control Panel Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="3-Minute Demo Control Panel"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-2.5 rounded-full bg-warm-amber text-forest-abyss font-bold shadow-2xl hover:scale-110 transition border border-forest-abyss"
      >
        <Settings2 className="w-5 h-5 text-forest-abyss" />
      </button>

      {/* Modal Overlay Demo Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-abyss/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-forest-deep border-2 border-warm-amber/60 rounded-3xl p-5 text-dongho-paper shadow-2xl max-h-[88vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-bamboo-mid/30">
              <div className="flex items-center gap-2 font-bold text-warm-glow text-sm">
                <Sparkles className="w-4 h-4 text-warm-amber" />
                Demo Control Panel (3-Minute Tour)
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-dongho-paper/60 hover:text-dongho-paper"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* SCREEN SWITCHER */}
              <div className="p-2.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-warm-glow uppercase tracking-wider">
                    📍 Screen Switcher
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-warm-amber/20 text-warm-amber font-mono">
                    Current: {state.currentScreen}
                  </span>
                </div>

                {/* 2 Main Canvas Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onNavigate('S03');
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                      state.currentScreen === 'S03'
                        ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold shadow-lg'
                        : 'bg-forest-deep hover:bg-forest-mist border-bamboo-mid/40 text-dongho-paper'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span>🎨</span>
                      <span>Studio (S03)</span>
                    </div>
                    <span className="text-[9px] opacity-80 mt-1">
                      Canvas, 4 pigments, rigging
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('S06');
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                      state.currentScreen === 'S06'
                        ? 'bg-bamboo-soft text-forest-abyss border-bamboo-soft font-bold shadow-lg'
                        : 'bg-forest-deep hover:bg-forest-mist border-bamboo-mid/40 text-dongho-paper'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span>🎋</span>
                      <span>Grove (S06)</span>
                    </div>
                    <span className="text-[9px] opacity-80 mt-1">
                      Interactive 2D Ghibli canvas
                    </span>
                  </button>
                </div>

                {/* Grid for other screens */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
                  {[
                    { id: 'S01', name: 'Bamboo Stalk' },
                    { id: 'S02', name: 'Crack Open' },
                    { id: 'S04', name: 'Name & Trait' },
                    { id: 'S05', name: 'First Meet' },
                    { id: 'S07', name: 'Story Chat' },
                    { id: 'S08', name: 'Memories' },
                    { id: 'S11', name: 'Stream' },
                    { id: 'S12', name: 'Village Tree' },
                    { id: 'S13', name: 'Settings' },
                  ].map((scr) => (
                    <button
                      key={scr.id}
                      onClick={() => {
                        onNavigate(scr.id);
                        setIsOpen(false);
                      }}
                      className={`py-1 px-1.5 rounded-lg border text-center transition ${
                        state.currentScreen === scr.id
                          ? 'bg-warm-glow text-forest-abyss font-bold border-warm-glow'
                          : 'bg-forest-darker/60 hover:bg-forest-deep text-dongho-paper/70 border-bamboo-mid/20'
                      }`}
                    >
                      {scr.id}: {scr.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Time of Day:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['real', 'morning', 'dusk', 'night'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        onUpdateState((p) => ({
                          ...p,
                          settings: { ...p.settings, timeOverride: t },
                        }))
                      }
                      className={`py-1.5 rounded-lg border font-medium text-[11px] transition ${
                        state.settings.timeOverride === t
                          ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {t === 'real' ? 'Real' : t === 'morning' ? 'Morning' : t === 'dusk' ? 'Dusk' : 'Night'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seasons */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Season:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['spring', 'summer', 'autumn', 'winter'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        onUpdateState((p) => ({
                          ...p,
                          settings: { ...p.settings, seasonOverride: s },
                        }))
                      }
                      className={`py-1.5 rounded-lg border font-medium text-[11px] transition ${
                        state.settings.seasonOverride === s
                          ? 'bg-bamboo-soft text-forest-abyss border-bamboo-soft font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {s === 'spring' ? 'Spring' : s === 'summer' ? 'Summer' : s === 'autumn' ? 'Autumn' : 'Winter'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cognitive Stage */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Companion Cognitive Stage:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([1, 2, 3, 4] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        onUpdateState((p) => {
                          if (!p.activeMangnon) return p;
                          return {
                            ...p,
                            activeMangnon: { ...p.activeMangnon, stage: lvl },
                          };
                        });
                      }}
                      className={`py-1.5 rounded-lg border font-medium text-[11px] transition ${
                        state.activeMangnon?.stage === lvl
                          ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {lvl} Leaf
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Personality (Demo):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['tomo', 'diemtinh', 'haohung', 'nhutnhat'] as const).map((pers) => (
                    <button
                      key={pers}
                      onClick={() => {
                        onUpdateState((p) => {
                          if (!p.activeMangnon) return p;
                          return {
                            ...p,
                            activeMangnon: { ...p.activeMangnon, personality: pers },
                          };
                        });
                      }}
                      className={`py-1.5 rounded-lg border font-medium text-[10px] transition ${
                        state.activeMangnon?.personality === pers
                          ? 'bg-warm-glow text-forest-abyss border-warm-glow font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {pers === 'tomo' ? 'Curious' : pers === 'diemtinh' ? 'Tranquil' : pers === 'haohung' ? 'Playful' : 'Shy'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meta Demo Lab & Teri Paper Puppet Kinematics */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Meta Demo Lab &amp; Teri Paper Puppet Kinematics:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {[
                    { label: '🚶 Walk', action: 'walk' },
                    { label: '🏃 Run', action: 'run' },
                    { label: '🤫 Sneak', action: 'sneak' },
                    { label: '🎉 Happy Jump', action: 'happy_jump' },
                    { label: '🍃 Flutter', action: 'paper_flutter' },
                    { label: '🦘 Hop', action: 'hop' },
                    { label: '💃 Dance', action: 'dance' },
                    { label: '👋 Wave', action: 'wave' },
                    { label: '💫 Spin', action: 'spin' },
                    { label: '😱 Teri Panic', action: 'teri_panic' },
                    { label: '😔 Melancholy', action: 'sad' },
                    { label: '😴 Sleep', action: 'sleep' },
                  ].map((act) => (
                    <button
                      key={act.action}
                      onClick={() => {
                        onNavigate('S06');
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('mangnon_action', { detail: act.action })
                          );
                        }
                      }}
                      className="py-1.5 rounded-lg bg-forest-darker hover:bg-forest-deep border border-bamboo-mid/30 text-dongho-paper font-medium transition active:scale-95 text-center"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-bamboo-mid/30 space-y-2">
                <button
                  onClick={handleSeedMemories}
                  className="w-full py-2 px-3 rounded-xl bg-forest-darker hover:bg-forest-mist border border-bamboo-soft/40 text-left font-medium text-warm-glow flex items-center justify-between"
                >
                  <span>🌱 Seed 8 sample memories for callbacks</span>
                  <Sparkles className="w-3.5 h-3.5 text-warm-amber" />
                </button>

                {/* Simulate Absence */}
                <div>
                  <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                    Simulate Absence (Flow E):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <button
                      onClick={() => handleSimulateDays(1)}
                      className="py-1.5 rounded-lg bg-forest-darker hover:bg-forest-deep border border-bamboo-mid/30 text-dongho-paper font-medium"
                    >
                      1 Day
                    </button>
                    <button
                      onClick={() => handleSimulateDays(7)}
                      className="py-1.5 rounded-lg bg-forest-darker hover:bg-forest-deep border border-bamboo-mid/30 text-warm-glow font-bold"
                    >
                      7 Days (Warm)
                    </button>
                    <button
                      onClick={() => handleSimulateDays(30)}
                      className="py-1.5 rounded-lg bg-forest-darker hover:bg-forest-deep border border-bamboo-mid/30 text-bamboo-soft font-medium"
                    >
                      30 Days
                    </button>
                  </div>
                </div>

                {/* Village Tree Contribution */}
                <div>
                  <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                    Village Tree Energy:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <button
                      onClick={() => handleAddLeaves(1)}
                      className="py-1.5 rounded-lg bg-forest-darker hover:bg-forest-deep border border-warm-amber/40 text-warm-glow flex items-center justify-center gap-1 font-semibold"
                    >
                      <Leaf className="w-3 h-3 text-bamboo-soft" />
                      <span>+1 Glowing Leaf</span>
                    </button>
                    <button
                      onClick={() => handleAddLeaves(10)}
                      className="py-1.5 rounded-lg bg-forest-darker hover:bg-forest-deep border border-warm-amber/40 text-warm-amber flex items-center justify-center gap-1 font-bold"
                    >
                      <Sparkles className="w-3 h-3 text-warm-amber" />
                      <span>+10 Glowing Leaves</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSeedRestingMangnons}
                  className="w-full py-2 px-3 rounded-xl bg-forest-darker hover:bg-forest-mist border border-warm-amber/40 text-left font-bold text-warm-glow flex items-center justify-between"
                >
                  <span>🌊 Seed 3 resting companions in Stream</span>
                  <Waves className="w-3.5 h-3.5 text-warm-glow" />
                </button>

                <button
                  onClick={() => {
                    onNavigate('S12');
                    onTriggerBloom();
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-dongho-red/30 hover:bg-dongho-red/50 border border-dongho-red/60 text-left font-bold text-dongho-paper flex items-center justify-between"
                >
                  <span>🌸 Trigger Village Tree Crimson Blossom</span>
                  <Flower2 className="w-3.5 h-3.5 text-dongho-red" />
                </button>

                <button
                  onClick={() => {
                    onNavigate('S10');
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-warm-wood/30 hover:bg-warm-wood/50 border border-warm-amber/60 text-left font-semibold text-warm-glow flex items-center justify-between"
                >
                  <span>🌊 Jump to Resting Ritual (S10)</span>
                  <Heart className="w-3.5 h-3.5 text-warm-glow" />
                </button>

                <button
                  onClick={() => {
                    onUpdateState(() => ({
                      ...state,
                      currentScreen: 'S01',
                      activeMangnon: null,
                      bambooOpened: false,
                    }));
                    onNavigate('S01');
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-forest-abyss hover:bg-forest-darker border border-bamboo-mid/30 text-left font-medium text-dongho-paper/60 hover:text-dongho-red flex items-center justify-between"
                >
                  <span>🔄 Reset to New Grove (S01)</span>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
