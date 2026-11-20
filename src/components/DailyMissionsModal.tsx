import React from 'react';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Droplets,
  Gamepad2,
  Gift,
  Heart,
  RefreshCw,
  Sparkles,
  Sprout,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { LightningEnergyIcon, PawCoinIcon } from './HandDrawnAssets';
import { ToyStickerIcon } from './GameIcons';
import { useShowTextLabels } from './SharedHud';

export type DailyMissionKind =
  | 'pet'
  | 'feed'
  | 'play'
  | 'water'
  | 'harvest'
  | 'visit'
  | 'memory';

export interface DailyMission {
  id: string;
  kind: DailyMissionKind;
  title: string;
  target: number;
  progress: number;
  coins: number;
  xp: number;
  claimed: boolean;
}

export interface DailyMissionsState {
  dateKey: string;
  missions: DailyMission[];
  bonusClaimed: boolean;
}

interface MissionTemplate {
  kind: DailyMissionKind;
  title: string;
  target: number;
  coins: number;
  xp: number;
  category: 'care' | 'farm' | 'social';
}

const MISSION_POOL: MissionTemplate[] = [
  {
    kind: 'feed',
    title: 'Feed 3 times',
    target: 3,
    coins: 120,
    xp: 20,
    category: 'care',
  },
  {
    kind: 'pet',
    title: 'Pet 3 times',
    target: 3,
    coins: 90,
    xp: 15,
    category: 'care',
  },
  {
    kind: 'play',
    title: 'Play 2 times',
    target: 2,
    coins: 100,
    xp: 16,
    category: 'care',
  },
  {
    kind: 'water',
    title: 'Water 2 crops',
    target: 2,
    coins: 110,
    xp: 18,
    category: 'farm',
  },
  {
    kind: 'harvest',
    title: 'Harvest 2 crops',
    target: 2,
    coins: 130,
    xp: 22,
    category: 'farm',
  },
  {
    kind: 'visit',
    title: 'Visit 1 friend',
    target: 1,
    coins: 100,
    xp: 18,
    category: 'social',
  },
  {
    kind: 'memory',
    title: 'Win 1 Pet Memory',
    target: 1,
    coins: 150,
    xp: 25,
    category: 'social',
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates 3 randomized, varied daily missions (1 care, 1 farm, 1 social/minigame)
 * so every day's task list feels balanced and distinct.
 */
export function rollDailyMissions(dateKey: string): DailyMissionsState {
  const carePool = MISSION_POOL.filter((m) => m.category === 'care');
  const farmPool = MISSION_POOL.filter((m) => m.category === 'farm');
  const socialPool = MISSION_POOL.filter((m) => m.category === 'social');

  const picked = [
    pickRandom(carePool),
    pickRandom(farmPool),
    pickRandom(socialPool),
  ];

  // Shuffle display order
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return {
    dateKey,
    bonusClaimed: false,
    missions: picked.map((tpl, idx) => ({
      id: `dm-${dateKey}-${tpl.kind}-${idx}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      kind: tpl.kind,
      title: tpl.title,
      target: tpl.target,
      progress: 0,
      coins: tpl.coins,
      xp: tpl.xp,
      claimed: false,
    })),
  };
}

function renderMissionIcon(kind: DailyMissionKind) {
  switch (kind) {
    case 'pet':
      return <Heart className="w-5 h-5 fill-[#FF85A1] text-[#FF85A1]" />;
    case 'feed':
      return <Utensils className="w-5 h-5 text-[#4EA866]" />;
    case 'play':
      return <ToyStickerIcon toyId="toy-tennis" className="w-5.5 h-5.5" />;
    case 'water':
      return <Droplets className="w-5 h-5 text-[#4A9EE0]" />;
    case 'harvest':
      return <Sprout className="w-5 h-5 text-[#58A348]" />;
    case 'visit':
      return <Users className="w-5 h-5 text-[#7A5BA8]" />;
    case 'memory':
      return <Gamepad2 className="w-5 h-5 text-[#7A5BA8]" />;
  }
}

function getMissionTint(kind: DailyMissionKind): string {
  switch (kind) {
    case 'pet':
      return 'bg-[#FFF0F6] border-[#F4C8DA]';
    case 'feed':
      return 'bg-[#EAF9EE] border-[#BEE5C8]';
    case 'play':
      return 'bg-[#EFF8FF] border-[#C8E2F7]';
    case 'water':
      return 'bg-[#E9F6FF] border-[#BFE0F7]';
    case 'harvest':
      return 'bg-[#F4FAE4] border-[#CFE3A4]';
    case 'visit':
    case 'memory':
      return 'bg-[#F4EEFF] border-[#D8C6F2]';
  }
}

interface DailyMissionsModalProps {
  open: boolean;
  state: DailyMissionsState;
  onClose: () => void;
  onClaimMission: (missionId: string) => void;
  onClaimDailyBonus: () => void;
  onRerollMissions: () => void;
  onJumpToMission: (kind: DailyMissionKind) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  open,
  state,
  onClose,
  onClaimMission,
  onClaimDailyBonus,
  onRerollMissions,
  onJumpToMission,
}) => {
  const showLabels = useShowTextLabels();
  if (!open) return null;

  const claimedCount = state.missions.filter((m) => m.claimed).length;
  const allClaimed = claimedCount === state.missions.length;
  const bonusReady = allClaimed && !state.bonusClaimed;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/28 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="Daily Missions"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[366px] max-h-[88%] flex flex-col overflow-hidden"
      >
        {/* Mobile drag affordance */}
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>

        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8F8EC] border border-[#B8E3C4] flex items-center justify-center">
              <ClipboardCheck className="w-4.5 h-4.5 text-[#3F7B52] stroke-[2.4]" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46]">
                Daily Missions
              </h3>
              <span className="rounded-full bg-[#FFF8DC] border border-[#EFE0A8] px-2 py-0.5 text-[10.5px] font-extrabold text-[#4B3C46] tabular-nums">
                {claimedCount}/{state.missions.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRerollMissions}
              aria-label="Shuffle new daily missions"
              title="New Random Tasks"
              className="w-9 h-9 rounded-full bg-[#F2FBF4] border border-[#CFEBD5] flex items-center justify-center text-[#3F7B52] active:scale-90 transition-transform cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.4]" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Daily Missions"
              className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="p-3.5 overflow-y-auto space-y-2.5 bg-[#FFFDF9]">
          {/* 3 Randomized Daily Tasks */}
          <div className="space-y-2">
            {state.missions.map((mission) => {
              const clampedProgress = Math.min(mission.target, mission.progress);
              const pct = Math.round((clampedProgress / mission.target) * 100);
              const isReady = clampedProgress >= mission.target && !mission.claimed;

              return (
                <div
                  key={mission.id}
                  className={`rounded-2xl p-2.5 border transition-colors ${
                    isReady
                      ? 'bg-[#FFF8DC] border-[#E5C97B]'
                      : mission.claimed
                      ? 'bg-[#F2FBF4] border-[#CFEBD5]'
                      : 'bg-[#FFFDF9] border-[#EFE0D4]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getMissionTint(
                          mission.kind
                        )}`}
                      >
                        {renderMissionIcon(mission.kind)}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-display text-[13.5px] font-extrabold text-[#4B3C46] truncate">
                            {mission.title}
                          </span>
                          <span className="text-[10.5px] font-extrabold text-[#8A747E] tabular-nums shrink-0">
                            {clampedProgress}/{mission.target}
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-[#F3EAE2] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              mission.claimed
                                ? 'bg-[#7CD191]'
                                : isReady
                                ? 'bg-[#F5C34B]'
                                : 'bg-[#FFA6C9]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center gap-2 text-[10.5px] font-extrabold text-[#8A747E] tabular-nums">
                          <span className="inline-flex items-center gap-0.5 text-[#4B3C46]">
                            <PawCoinIcon className="w-3.5 h-3.5" />+
                            {mission.coins}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[#5D7EA8]">
                            <Sparkles className="w-3 h-3" />+{mission.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    {mission.claimed ? (
                      <span
                        aria-label="Claimed"
                        className="w-9 h-9 rounded-full bg-[#E8F8EC] border border-[#B4E1BF] flex items-center justify-center text-[#3B7A4A] shrink-0"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : isReady ? (
                      <button
                        type="button"
                        onClick={() => onClaimMission(mission.id)}
                        className="buttercup-cta rounded-full px-3.5 min-h-[38px] text-[12px] font-extrabold text-[#4B3C46] cursor-pointer shrink-0"
                      >
                        Claim
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onJumpToMission(mission.kind)}
                        aria-label={`Go to ${mission.title}`}
                        title="Go"
                        className="cream-btn rounded-full min-w-[38px] min-h-[38px] px-2.5 flex items-center justify-center gap-1 text-[11.5px] font-extrabold text-[#4B3C46] cursor-pointer shrink-0"
                      >
                        {showLabels && <span>Go</span>}
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3/3 Daily Completion Bonus Chest */}
          <div
            className={`rounded-2xl p-3 border-2 flex items-center justify-between gap-2.5 ${
              bonusReady
                ? 'bg-gradient-to-r from-[#FFF6D4] to-[#FFEAF3] border-[#E5C97B]'
                : state.bonusClaimed
                ? 'bg-[#F2FBF4] border-[#CFEBD5]'
                : 'bg-[#FFF9F3] border-[#EFE0D4]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#EED3A8] flex items-center justify-center shrink-0">
                <Gift
                  className={`w-5 h-5 ${
                    bonusReady
                      ? 'text-[#D9822B] animate-bounce'
                      : state.bonusClaimed
                      ? 'text-[#4EA866]'
                      : 'text-[#B59A8B]'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                  All 3 Bonus
                </div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#8A747E] tabular-nums">
                  <span className="inline-flex items-center gap-0.5 text-[#4B3C46]">
                    <PawCoinIcon className="w-3.5 h-3.5" />
                    +200
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[#4B3C46]">
                    <LightningEnergyIcon className="w-3.5 h-3.5" />
                    +10
                  </span>
                </div>
              </div>
            </div>

            {state.bonusClaimed ? (
              <span className="rounded-full px-3 py-1 bg-[#E8F8EC] border border-[#B4E1BF] text-[11px] font-extrabold text-[#3B7A4A] inline-flex items-center gap-1 shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Done</span>
              </span>
            ) : bonusReady ? (
              <button
                type="button"
                onClick={onClaimDailyBonus}
                className="buttercup-cta rounded-full px-4 min-h-[40px] text-[12px] font-extrabold text-[#4B3C46] cursor-pointer shrink-0"
              >
                Claim
              </button>
            ) : (
              <span className="rounded-full px-2.5 py-1 bg-[#F7F1EB] border border-[#E8DAD0] text-[11px] font-extrabold text-[#8A747E] tabular-nums shrink-0">
                {claimedCount}/3
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
