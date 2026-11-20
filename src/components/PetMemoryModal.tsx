import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Footprints,
  Gamepad2,
  Heart,
  Layers,
  PawPrint,
  RotateCcw,
  Star,
  X,
} from 'lucide-react';
import { SanctuaryPet } from '../types';
import { PET_IMAGES, resolveAssetUrl } from '../assets/petImages';
import { PawCoinIcon } from './HandDrawnAssets';
import { FlameMiniIcon } from './GameIcons';
import { useShowTextLabels } from './SharedHud';
import {
  playCoinSound,
  playHappySound,
  playTapSound,
  playVictorySound,
} from '../utils/appAudio';

interface MemoryDeckItem {
  pairId: string;
  label: string;
  photoUrl: string;
  tintBg: string;
  tintBorder: string;
}

interface MemoryCard extends MemoryDeckItem {
  uid: string;
  flipped: boolean;
  matched: boolean;
}

const FALLBACK_DECK_ITEMS: MemoryDeckItem[] = [
  {
    pairId: 'calico',
    label: 'Mochi',
    photoUrl: PET_IMAGES.croppedCalicoCat,
    tintBg: 'bg-[#FFF0F6]',
    tintBorder: 'border-[#F2BED3]',
  },
  {
    pairId: 'golden',
    label: 'Sunny',
    photoUrl: PET_IMAGES.croppedGoldenDog,
    tintBg: 'bg-[#FFF8DC]',
    tintBorder: 'border-[#ECD28B]',
  },
  {
    pairId: 'bunny',
    label: 'Pip',
    photoUrl: PET_IMAGES.croppedFluffyBunny,
    tintBg: 'bg-[#EAF9EE]',
    tintBorder: 'border-[#B8E3C4]',
  },
  {
    pairId: 'corgi',
    label: 'Biscuit',
    photoUrl: PET_IMAGES.luredStrayCorgi,
    tintBg: 'bg-[#FFF3E4]',
    tintBorder: 'border-[#EDC9A4]',
  },
  {
    pairId: 'shiba',
    label: 'Kibo',
    photoUrl: PET_IMAGES.neighborShibaDog,
    tintBg: 'bg-[#EEF6FF]',
    tintBorder: 'border-[#BFD9F5]',
  },
  {
    pairId: 'ragdoll',
    label: 'Pearl',
    photoUrl: PET_IMAGES.neighborRagdollCat,
    tintBg: 'bg-[#F5EEFF]',
    tintBorder: 'border-[#D5C3F0]',
  },
];

const CARD_TINTS: Array<{ tintBg: string; tintBorder: string }> = [
  { tintBg: 'bg-[#FFF0F6]', tintBorder: 'border-[#F2BED3]' },
  { tintBg: 'bg-[#FFF8DC]', tintBorder: 'border-[#ECD28B]' },
  { tintBg: 'bg-[#EAF9EE]', tintBorder: 'border-[#B8E3C4]' },
  { tintBg: 'bg-[#FFF3E4]', tintBorder: 'border-[#EDC9A4]' },
  { tintBg: 'bg-[#EEF6FF]', tintBorder: 'border-[#BFD9F5]' },
  { tintBg: 'bg-[#F5EEFF]', tintBorder: 'border-[#D5C3F0]' },
];

function buildShuffledDeck(pets: SanctuaryPet[]): MemoryCard[] {
  const chosen: MemoryDeckItem[] = [];
  const usedUrls = new Set<string>();

  for (const pet of pets) {
    if (chosen.length >= 6) break;
    const url = resolveAssetUrl(pet.photoUrl);
    if (usedUrls.has(url)) continue;
    usedUrls.add(url);
    const tint = CARD_TINTS[chosen.length % CARD_TINTS.length];
    chosen.push({
      pairId: `pet-${pet.id}`,
      label: pet.name,
      photoUrl: url,
      tintBg: tint.tintBg,
      tintBorder: tint.tintBorder,
    });
  }

  for (const fallback of FALLBACK_DECK_ITEMS) {
    if (chosen.length >= 6) break;
    if (usedUrls.has(fallback.photoUrl)) continue;
    usedUrls.add(fallback.photoUrl);
    const tint = CARD_TINTS[chosen.length % CARD_TINTS.length];
    chosen.push({
      ...fallback,
      tintBg: tint.tintBg,
      tintBorder: tint.tintBorder,
    });
  }

  const doubled: MemoryCard[] = chosen.flatMap((item, idx) => [
    { ...item, uid: `${item.pairId}-a-${idx}`, flipped: false, matched: false },
    { ...item, uid: `${item.pairId}-b-${idx}`, flipped: false, matched: false },
  ]);

  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }

  return doubled;
}

export interface PetMemoryReward {
  coins: number;
  affectionXp: number;
  moves: number;
  stars: number;
}

interface PetMemoryModalProps {
  open: boolean;
  pets: SanctuaryPet[];
  onClose: () => void;
  onClaimReward: (reward: PetMemoryReward) => void;
}

export const PetMemoryModal: React.FC<PetMemoryModalProps> = ({
  open,
  pets,
  onClose,
  onClaimReward,
}) => {
  const showLabels = useShowTextLabels();
  const [cards, setCards] = useState<MemoryCard[]>(() =>
    buildShuffledDeck(pets)
  );
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const mismatchTimerRef = useRef<number | null>(null);

  const resetGame = () => {
    if (mismatchTimerRef.current) {
      window.clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
    setCards(buildShuffledDeck(pets));
    setSelectedUids([]);
    setMoves(0);
    setCombo(0);
    setBestCombo(0);
    setIsChecking(false);
    setRewardClaimed(false);
  };

  useEffect(() => {
    if (open) {
      resetGame();
    }
    return () => {
      if (mismatchTimerRef.current) {
        window.clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const matchedPairs = cards.filter((c) => c.matched).length / 2;
  const totalPairs = cards.length / 2;
  const isComplete = matchedPairs === totalPairs && totalPairs > 0;

  const stars = moves <= 9 ? 3 : moves <= 13 ? 2 : 1;
  const coinsEarned =
    60 + (stars === 3 ? 60 : stars === 2 ? 30 : 10) + bestCombo * 10;
  const affectionXpEarned = stars === 3 ? 25 : stars === 2 ? 18 : 12;

  const handleCardTap = (uid: string) => {
    if (isChecking || isComplete) return;
    const target = cards.find((c) => c.uid === uid);
    if (!target || target.flipped || target.matched) return;

    playTapSound();
    const nextCards = cards.map((c) =>
      c.uid === uid ? { ...c, flipped: true } : c
    );
    const nextSelected = [...selectedUids, uid];
    setCards(nextCards);
    setSelectedUids(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const first = nextCards.find((c) => c.uid === nextSelected[0]);
      const second = nextCards.find((c) => c.uid === nextSelected[1]);

      if (first && second && first.pairId === second.pairId) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setBestCombo((b) => Math.max(b, nextCombo));
        const matchedBoard = nextCards.map((c) =>
          c.pairId === first.pairId ? { ...c, matched: true } : c
        );
        setCards(matchedBoard);
        setSelectedUids([]);

        const allDone = matchedBoard.every((c) => c.matched);
        if (allDone) {
          playVictorySound();
        } else if (nextCombo >= 2) {
          playCoinSound();
        } else {
          playHappySound();
        }
      } else {
        setCombo(0);
        setIsChecking(true);
        mismatchTimerRef.current = window.setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              nextSelected.includes(c.uid) ? { ...c, flipped: false } : c
            )
          );
          setSelectedUids([]);
          setIsChecking(false);
          mismatchTimerRef.current = null;
        }, 620);
      }
    }
  };

  const handleCollectAnd = (playAgain: boolean) => {
    if (!rewardClaimed) {
      setRewardClaimed(true);
      onClaimReward({
        coins: coinsEarned,
        affectionXp: affectionXpEarned,
        moves,
        stars,
      });
    }
    if (playAgain) {
      resetGame();
    } else {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/28 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="Pet Memory Minigame"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[356px] max-h-[88%] flex flex-col overflow-hidden"
      >
        {/* Mobile drag affordance */}
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>

        {/* Clean Icon-First Header */}
        <div className="px-4 py-2 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F3ECFF] border border-[#D4C3F2] flex items-center justify-center">
              <Gamepad2 className="w-4.5 h-4.5 text-[#7A5BA8] stroke-[2.3]" />
            </div>
            <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46]">
              Memory
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                resetGame();
              }}
              aria-label="Shuffle new game"
              title="Reshuffle"
              className="w-9 h-9 rounded-full bg-[#F7F3FF] border border-[#DFD2F7] flex items-center justify-center text-[#7A5BA8] active:scale-90 transition-transform cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.4]" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Pet Memory"
              className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <div className="p-3.5 overflow-y-auto space-y-3 bg-[#FFFDF9]">
          {/* Icon-Only Scoreboard Strip */}
          <div className="grid grid-cols-3 gap-1.5">
            <div
              title="Matched Pairs"
              aria-label={`Matched pairs ${matchedPairs} of ${totalPairs}`}
              className="rounded-2xl bg-[#FFF6FA] border border-[#F3DCE6] py-1.5 px-2 flex items-center justify-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-[#DF6E9B] stroke-[2.4]" />
              <span className="font-display text-[14px] font-extrabold text-[#4B3C46] tabular-nums">
                {matchedPairs}/{totalPairs}
              </span>
            </div>

            <div
              title="Moves"
              aria-label={`${moves} moves`}
              className="rounded-2xl bg-[#EFF8FF] border border-[#CBE4F8] py-1.5 px-2 flex items-center justify-center gap-1.5"
            >
              <Footprints className="w-4 h-4 text-[#5A8BB5] stroke-[2.4]" />
              <span className="font-display text-[14px] font-extrabold text-[#4B3C46] tabular-nums">
                {moves}
              </span>
            </div>

            <div
              title="Match Streak Combo"
              aria-label={`Combo ${combo}`}
              className={`rounded-2xl border py-1.5 px-2 flex items-center justify-center gap-1 transition-colors ${
                combo >= 2
                  ? 'bg-[#FFE89A] border-[#D9AA4C]'
                  : 'bg-[#FFF8DC] border-[#EFE0A8]'
              }`}
            >
              <FlameMiniIcon className="w-4 h-4" />
              <span className="font-display text-[14px] font-extrabold text-[#4B3C46] tabular-nums">
                x{combo}
              </span>
            </div>
          </div>

          {/* 4x3 Clean Visual Pet Card Grid */}
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card) => {
              const isRevealed = card.flipped || card.matched;
              return (
                <button
                  key={card.uid}
                  type="button"
                  disabled={isRevealed || isChecking}
                  onClick={() => handleCardTap(card.uid)}
                  aria-label={isRevealed ? card.label : 'Flip card'}
                  className={`relative aspect-square rounded-2xl border-2 flex items-center justify-center p-1.5 transition-all duration-200 cursor-pointer active:scale-92 ${
                    card.matched
                      ? `${card.tintBg} ${card.tintBorder} ring-2 ring-[#8BD69D] scale-[0.97]`
                      : isRevealed
                      ? `${card.tintBg} ${card.tintBorder} shadow-sm`
                      : 'bg-gradient-to-b from-[#FFF2F7] to-[#FCE4EE] border-[#E7C2D1] shadow-[0_3px_0_#E7C2D1] hover:-translate-y-0.5'
                  }`}
                >
                  {isRevealed ? (
                    <>
                      <div className="w-full h-full rounded-xl bg-[#FFFDF9]/90 border border-white/85 overflow-hidden flex items-center justify-center p-0.5">
                        <img
                          src={card.photoUrl}
                          alt={card.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {card.matched && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#7CD191] border-[1.5px] border-[#FFFDF9] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-[#FFFDF9] stroke-[3.5]" />
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#FFFDF9]/85 border border-[#F0CEDC] flex items-center justify-center">
                      <PawPrint className="w-4.5 h-4.5 text-[#E88BAE] stroke-[2.3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Compact Visual Reward Card */}
          {isComplete && (
            <div className="rounded-2xl bg-gradient-to-br from-[#FFF7D6] via-[#FFF4E8] to-[#FFEAF3] border-2 border-[#EED3A8] p-3 space-y-2.5">
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3].map((idx) => (
                  <Star
                    key={idx}
                    className={`w-6 h-6 ${
                      idx <= stars
                        ? 'fill-[#FFD24C] text-[#D99B26]'
                        : 'fill-[#EFE5DC] text-[#D8C7BA]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="rounded-full bg-[#FFFDF9] border border-[#EED3A8] px-3 py-1 text-[13px] font-extrabold text-[#4B3C46] inline-flex items-center gap-1 tabular-nums">
                  <PawCoinIcon className="w-4.5 h-4.5" />+{coinsEarned}
                </span>
                <span className="rounded-full bg-[#FFF5F8] border border-[#F2C3D5] px-3 py-1 text-[13px] font-extrabold text-[#B84C71] inline-flex items-center gap-1 tabular-nums">
                  <Heart className="w-4 h-4 fill-[#FF85A1] text-[#FF85A1]" />+
                  {affectionXpEarned}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCollectAnd(true)}
                  aria-label="Claim and play again"
                  title="Claim & Play Again"
                  className="cream-btn rounded-full min-h-[44px] px-3 font-display text-[13px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4.5 h-4.5 stroke-[2.5]" />
                  {showLabels && <span>Replay</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleCollectAnd(false)}
                  aria-label="Claim rewards"
                  title="Claim Rewards"
                  className="buttercup-cta rounded-full min-h-[44px] px-3 font-display text-[13px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  {showLabels && <span>Claim</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
