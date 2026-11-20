import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  FirstBondQuestState,
  JourneyPhase,
  SanctuaryPet,
} from '../types';
import { CroppedPetCutout } from './CroppedPetCutout';

interface FirstBondQuestModalProps {
  open: boolean;
  quest: FirstBondQuestState;
  pets: SanctuaryPet[];
  currentPhase: JourneyPhase;
  hasMintedPassport: boolean;
  walletConnected: boolean;
  onClose: () => void;
  onJumpToPhase: (phase: JourneyPhase) => void;
  onQuickWelcome: () => void;
  onQuickFeed: () => void;
  onQuickPlay: () => void;
  onClaimReward: (targetPetId: string) => Promise<void>;
}

const JOURNEY_STEPS: Array<{
  id: JourneyPhase;
  num: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'discover',
    num: '01',
    title: 'Discover',
    subtitle: 'Snap or upload photo for AI Judge',
  },
  {
    id: 'welcome',
    num: '02',
    title: 'Welcome',
    subtitle: 'Name your pet & add to Sanctuary',
  },
  {
    id: 'care',
    num: '03',
    title: 'Care',
    subtitle: 'Feed, Play & Pet to build Bond XP',
  },
  {
    id: 'grow',
    num: '04',
    title: 'Grow',
    subtitle: 'Farm crops, unlock toys & visit friends',
  },
  {
    id: 'preserve',
    num: '05',
    title: 'Preserve',
    subtitle: '100 Bond XP unlocks IPFS Passport',
  },
  {
    id: 'connect',
    num: '06',
    title: 'Connect',
    subtitle: 'Core Wallet mint on Avalanche Fuji',
  },
];

export const FirstBondQuestModal: React.FC<FirstBondQuestModalProps> = ({
  open,
  quest,
  pets,
  currentPhase,
  hasMintedPassport,
  walletConnected,
  onClose,
  onJumpToPhase,
  onQuickWelcome,
  onQuickFeed,
  onQuickPlay,
  onClaimReward,
}) => {
  const [tab, setTab] = useState<'quest' | 'journey'>('quest');
  const [selectedPetId, setSelectedPetId] = useState<string>(
    pets[0]?.id ?? ''
  );
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const allDone = quest.welcomeDone && quest.feedDone && quest.playDone;
  const activeTargetId =
    pets.find((p) => p.id === selectedPetId)?.id ?? pets[0]?.id ?? '';

  const handleClaim = async () => {
    if (!allDone || quest.claimed || !activeTargetId) return;
    setClaiming(true);
    setError(null);
    try {
      await onClaimReward(activeTargetId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to claim quest reward.'
      );
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="First Bond Quest and Pet Journey"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[360px] max-h-[86%] flex flex-col overflow-hidden"
      >
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>
        <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FFF3BF] border border-[#E0BE63] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#A97B2B]" />
            </div>
            <h3 className="font-display text-[15.5px] font-extrabold text-[#4B3C46]">
              {tab === 'quest' ? 'First Bond Quest' : 'Pet Journey (6 Phases)'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Quest"
            className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto flex-1 space-y-3 bg-[#FFFDF9]">
          <div className="grid grid-cols-2 gap-1 bg-[#F7F1EB] rounded-full p-1">
            <button
              type="button"
              onClick={() => setTab('quest')}
              className={`rounded-full min-h-[40px] text-[12px] font-extrabold cursor-pointer transition-colors ${
                tab === 'quest'
                  ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                  : 'text-[#8A747E]'
              }`}
            >
              First Bond Quest
            </button>
            <button
              type="button"
              onClick={() => setTab('journey')}
              className={`rounded-full min-h-[40px] text-[12px] font-extrabold cursor-pointer transition-colors ${
                tab === 'journey'
                  ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                  : 'text-[#8A747E]'
              }`}
            >
              6-Phase Journey
            </button>
          </div>

          {error && (
            <div className="bg-[#FFEAF0] border border-[#E6B8C5] rounded-2xl px-3 py-2 text-[11.5px] font-bold text-[#9B3B52]">
              {error}
            </div>
          )}

          {tab === 'quest' ? (
            <div className="space-y-2.5">
              <div className="bg-[#FFF8DC] border border-[#EFE0A8] rounded-2xl p-2.5 flex items-center justify-between">
                <div className="text-[12px] font-extrabold text-[#4B3C46]">
                  Tutorial Reward
                </div>
                <div className="font-display text-[13px] font-extrabold text-[#8B682E] tabular-nums">
                  +{quest.rewardXp} Bond XP (Passport Ready!)
                </div>
              </div>

              {/* 3 Tutorial Steps: Welcome -> Feed -> Play */}
              <div className="space-y-2">
                {[
                  {
                    key: 'welcome',
                    label: '1. Welcome a Pet',
                    hint: 'Name & add a discovered snap to Yard',
                    done: quest.welcomeDone,
                    actionLabel: 'Welcome',
                    onAction: onQuickWelcome,
                  },
                  {
                    key: 'feed',
                    label: '2. Feed a Pet',
                    hint: 'Share harvested crops or basket food',
                    done: quest.feedDone,
                    actionLabel: 'Feed',
                    onAction: onQuickFeed,
                  },
                  {
                    key: 'play',
                    label: '3. Play Together',
                    hint: 'Tap a toy or play from Pet Profile',
                    done: quest.playDone,
                    actionLabel: 'Play',
                    onAction: onQuickPlay,
                  },
                ].map((step) => (
                  <div
                    key={step.key}
                    className={`rounded-2xl p-2.5 border flex items-center justify-between gap-2 ${
                      step.done
                        ? 'bg-[#F0FAF2] border-[#CFEBD5]'
                        : 'bg-[#FFF9F2] border-[#EFE0D4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#4EA866] shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#C8B2A4] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                          {step.label}
                        </div>
                        <div className="text-[10.5px] font-bold text-[#8A747E] truncate">
                          {step.hint}
                        </div>
                      </div>
                    </div>

                    {!step.done && (
                      <button
                        type="button"
                        onClick={step.onAction}
                        className="cream-btn rounded-full px-3.5 min-h-[40px] text-[12px] font-extrabold text-[#4B3C46] shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        {step.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Select Pet to receive 100 Bond XP */}
              {!quest.claimed && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#8A747E]">
                    Award +100 Bond XP to:
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {pets.map((pet) => {
                      const active = pet.id === activeTargetId;
                      return (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => setSelectedPetId(pet.id)}
                          className={`rounded-2xl px-2.5 min-h-[40px] border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                            active
                              ? 'bg-[#FFE07D] border-[#C99D66]'
                              : 'bg-[#FFF9F2] border-[#EFE0D4]'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg overflow-hidden bg-[#E8F8EC]">
                            <CroppedPetCutout
                              photoUrl={pet.photoUrl}
                              alt={pet.name}
                              mode={pet.cutoutMode ?? 'auto'}
                              className="w-6 h-6"
                            />
                          </div>
                          <span className="font-display text-[11.5px] font-extrabold text-[#4B3C46] whitespace-nowrap">
                            {pet.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!allDone || quest.claimed || claiming}
                onClick={handleClaim}
                className={`w-full rounded-full min-h-[48px] px-4 font-display text-[13.5px] font-extrabold flex items-center justify-center gap-2 ${
                  quest.claimed
                    ? 'bg-[#E8F8EC] border-2 border-[#B3CFAF] text-[#3F7B52]'
                    : 'buttercup-cta text-[#4B3C46] disabled:opacity-50 cursor-pointer'
                }`}
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Quest...</span>
                  </>
                ) : quest.claimed ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Claimed +100 Bond XP (Anti-Cheat Locked)</span>
                  </>
                ) : (
                  <span>Claim +100 Bond XP</span>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {JOURNEY_STEPS.map((phase) => {
                const isCurrent = currentPhase === phase.id;
                const isCompleted =
                  (phase.id === 'discover' && pets.length >= 3) ||
                  (phase.id === 'welcome' && quest.welcomeDone) ||
                  (phase.id === 'care' && (quest.feedDone || quest.playDone)) ||
                  (phase.id === 'grow' &&
                    pets.some((p) => (p.bondLevel ?? 1) >= 2 || (p.bondXp ?? 0) >= 40)) ||
                  (phase.id === 'preserve' &&
                    pets.some((p) => p.passportEligible)) ||
                  (phase.id === 'connect' &&
                    walletConnected &&
                    hasMintedPassport);

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => onJumpToPhase(phase.id)}
                    className={`w-full rounded-2xl p-2.5 border flex items-center justify-between gap-2 text-left cursor-pointer active:scale-[0.99] transition-transform ${
                      isCurrent
                        ? 'bg-[#FFF3BF] border-[#C99D66]'
                        : isCompleted
                        ? 'bg-[#F0FAF2] border-[#CFEBD5]'
                        : 'bg-[#FFF9F2] border-[#EFE0D4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-[#FFFDF9] border border-[#D9C3B4] font-display text-[12px] font-extrabold text-[#4B3C46] flex items-center justify-center shrink-0 tabular-nums">
                        {phase.num}
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                          {phase.title}
                        </div>
                        <div className="text-[10.5px] font-bold text-[#8A747E] truncate">
                          {phase.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#4B3C46] shrink-0 whitespace-nowrap">
                      {isCompleted ? 'Done · Open' : 'Open →'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
