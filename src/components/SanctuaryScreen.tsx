import React, { useEffect, useState } from 'react';
import {
  Camera,
  Droplets,
  Gamepad2,
  Heart,
  PawPrint,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  DailyLimits,
  FoodItemType,
  GardenToy,
  SanctuaryPet,
} from '../types';
import {
  CosmeticStallIllustration,
  FarmhouseIllustration,
} from './HandDrawnAssets';
import {
  BaitStickerIcon,
  CropFoodIcon,
  FlameMiniIcon,
  ShieldMiniIcon,
  ToyStickerIcon,
  TrophyMiniIcon,
} from './GameIcons';
import { CroppedPetCutout } from './CroppedPetCutout';
import {
  SharedBottomDock,
  SharedTopHud,
  useShowTextLabels,
  useSkyTheme,
} from './SharedHud';

export type SanctuaryModalType =
  | null
  | 'farmhouse'
  | 'shop'
  | 'snap'
  | 'rescue'
  | 'bag'
  | 'album'
  | 'profile'
  | 'visit'
  | 'neighborMarket';

interface SanctuaryScreenProps {
  coins: number;
  energy: number;
  maxEnergy: number;
  level: number;
  expPercent: number;
  streakDays: number;
  fenceHours: number;
  theme: string;
  pets: SanctuaryPet[];
  selectedPetId?: string | null;
  toys: GardenToy[];
  foodInventory: Record<FoodItemType, number>;
  limits: DailyLimits;
  luredCount: number;
  activeBait: string | null;
  readyFarmCount: number;
  questProgressLabel?: string;
  onSelectPet?: (petId: string) => void;
  onCarePet: (petId: string) => string;
  onOpenPetProfile?: (petId: string) => void;
  onFeedPet: (food: FoodItemType, petId?: string) => string;
  onPlayToy: (toy: GardenToy, petId?: string) => string;
  onTapClover: () => string;
  onOpenFarm: () => void;
  onOpenQuest?: () => void;
  onOpenMemoryGame?: () => void;
  onOpenCalendar?: () => void;
  hasCalendarBadge?: boolean;
  onOpenSettings?: () => void;
  onOpenModal: (modal: SanctuaryModalType) => void;
  onQuickCoins: () => void;
  onQuickEnergy: () => void;
}

export const SanctuaryScreen: React.FC<SanctuaryScreenProps> = ({
  coins,
  energy,
  maxEnergy,
  level,
  expPercent,
  streakDays,
  fenceHours,
  theme,
  pets,
  selectedPetId,
  toys,
  foodInventory,
  limits,
  luredCount,
  activeBait,
  readyFarmCount,
  questProgressLabel,
  onSelectPet,
  onCarePet,
  onOpenPetProfile,
  onFeedPet,
  onPlayToy,
  onTapClover,
  onOpenFarm,
  onOpenQuest,
  onOpenMemoryGame,
  onOpenCalendar,
  hasCalendarBadge,
  onOpenSettings,
  onOpenModal,
  onQuickCoins,
  onQuickEnergy,
}) => {
  const showLabels = useShowTextLabels();
  const { palette } = useSkyTheme();
  const activeToys = toys.filter((t) => t.owned);

  const [petPositions, setPetPositions] = useState<
    Record<string, { x: number; y: number; flip: boolean }>
  >({});
  const [floatingFeedback, setFloatingFeedback] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [heartBursts, setHeartBursts] = useState<
    Array<{ id: string; x: number; y: number }>
  >([]);
  const prevBaitRef = React.useRef<string | null>(activeBait);

  useEffect(() => {
    if (activeBait && activeBait !== prevBaitRef.current) {
      const icon =
        activeBait === 'Salmon Pate'
          ? '🐟'
          : activeBait === 'Honey Biscuit'
          ? '🦴'
          : '🥕';
      const id = `bait-${Date.now()}`;
      setFloatingFeedback({
        id,
        text: `${icon} ${activeBait} set!`,
        x: 26,
        y: 53,
      });
      const timer = window.setTimeout(() => {
        setFloatingFeedback((cur) => (cur?.id === id ? null : cur));
      }, 1500);
      prevBaitRef.current = activeBait;
      return () => window.clearTimeout(timer);
    }
    prevBaitRef.current = activeBait;
  }, [activeBait]);

  useEffect(() => {
    setPetPositions((prev) => {
      const next = { ...prev };
      for (const pet of pets) {
        if (!next[pet.id]) {
          next[pet.id] = { x: pet.x, y: pet.y, flip: Boolean(pet.flip) };
        }
      }
      return next;
    });
  }, [pets]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setPetPositions((prev) => {
        const next: Record<string, { x: number; y: number; flip: boolean }> = {};
        for (const pet of pets) {
          const cur = prev[pet.id] ?? { x: pet.x, y: pet.y, flip: false };
          const dx = (Math.random() - 0.5) * 14;
          const dy = (Math.random() - 0.5) * 10;
          const nx = Math.max(20, Math.min(80, cur.x + dx));
          const ny = Math.max(38, Math.min(75, cur.y + dy));
          next[pet.id] = {
            x: nx,
            y: ny,
            flip: dx < -0.5 ? true : dx > 0.5 ? false : cur.flip,
          };
        }
        return next;
      });
    }, 2800);

    return () => window.clearInterval(timer);
  }, [pets]);

  const spawnHeartBurst = (x: number, y: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setHeartBursts((prev) => [...prev.slice(-4), { id, x, y }]);
    window.setTimeout(() => {
      setHeartBursts((prev) => prev.filter((b) => b.id !== id));
    }, 950);
  };

  const showToastAt = (text: string, x = 50, y = 45) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingFeedback({ id, text, x, y });
    window.setTimeout(() => {
      setFloatingFeedback((cur) => (cur?.id === id ? null : cur));
    }, 1050);
  };

  const handlePetTap = (pet: SanctuaryPet) => {
    if (onSelectPet) onSelectPet(pet.id);
    const pos = petPositions[pet.id] ?? { x: pet.x, y: pet.y };
    if (!pet.needsCare && onOpenPetProfile) {
      spawnHeartBurst(pos.x, Math.max(22, pos.y - 8));
      onOpenPetProfile(pet.id);
      return;
    }
    spawnHeartBurst(pos.x, Math.max(22, pos.y - 8));
    const msg = onCarePet(pet.id);
    showToastAt(msg, pos.x, Math.max(20, pos.y - 12));
  };

  const handleToyTap = (toy: GardenToy) => {
    // Select the pet that the user actively picked, or the pet closest to this toy
    const activePet =
      pets.find((p) => p.id === selectedPetId) ??
      pets.slice().sort((a, b) => {
        const posA = petPositions[a.id] ?? { x: a.x, y: a.y };
        const posB = petPositions[b.id] ?? { x: b.x, y: b.y };
        const distA = Math.hypot(posA.x - toy.x, posA.y - toy.y);
        const distB = Math.hypot(posB.x - toy.x, posB.y - toy.y);
        return distA - distB;
      })[0] ??
      pets[0];

    if (activePet) {
      if (onSelectPet) onSelectPet(activePet.id);
      setPetPositions((prev) => ({
        ...prev,
        [activePet.id]: {
          x: Math.max(24, Math.min(80, toy.x - 6)),
          y: Math.max(40, Math.min(78, toy.y - 4)),
          flip: (prev[activePet.id]?.x ?? 50) > toy.x,
        },
      }));
    }
    spawnHeartBurst(toy.x, Math.max(22, toy.y - 6));
    const msg = onPlayToy(toy, activePet?.id);
    showToastAt(msg, toy.x, toy.y - 10);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between transition-colors duration-700"
      style={{ backgroundColor: palette.sanctuaryBaseBg }}
    >
      {/* TIME-OF-DAY PASTEL SKY + MEADOW BACKDROP */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 h-[24%] transition-all duration-700"
          style={{
            background: palette.sanctuarySkyGradient,
          }}
        />
        <svg
          viewBox="0 0 400 120"
          className="absolute top-2.5 left-0 w-full h-24 opacity-95"
          fill="none"
          aria-hidden="true"
        >
          {palette.showStars && (
            <g className="animate-petal-twinkle">
              <circle cx="110" cy="18" r="1.9" fill="#FFF8DC" />
              <circle cx="288" cy="15" r="1.8" fill="#FFFDF9" />
              <circle cx="348" cy="24" r="1.5" fill="#FFF8DC" />
              {palette.isNight && (
                <>
                  <circle cx="62" cy="22" r="1.4" fill="#FFE794" />
                  <circle cx="242" cy="12" r="1.6" fill="#FFFDF9" />
                </>
              )}
            </g>
          )}
          {/* Smiling Pastel Sun or Crescent Moon */}
          <g transform={`translate(200, ${palette.sunYSanctuary})`}>
            <circle
              cx="0"
              cy="0"
              r={palette.isNight ? 22 : 24}
              fill={palette.sunHaloFill}
              opacity={palette.isNight ? '0.32' : '0.58'}
            />
            {palette.isNight ? (
              <>
                <circle
                  cx="0"
                  cy="0"
                  r="13.5"
                  fill={palette.sunFill}
                  stroke={palette.sunStroke}
                  strokeWidth="1.4"
                />
                <circle cx="5.5" cy="-4" r="10.2" fill="#5D5994" />
                <circle cx="-4.2" cy="0.8" r="1.2" fill="#5A4A63" />
                <ellipse cx="-6.4" cy="3" rx="1.6" ry="0.9" fill="#FFA6C9" opacity="0.85" />
                <path
                  d="M-2.6 3.8C-1.4 5 -0.1 4.9 0.8 3.8"
                  stroke="#5A4A63"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <circle
                  cx="0"
                  cy="0"
                  r="14"
                  fill={palette.sunFill}
                  stroke={palette.sunStroke}
                  strokeWidth="1.6"
                />
                <circle cx="-4.2" cy="-1" r="1.3" fill="#6E5448" />
                <circle cx="4.2" cy="-1" r="1.3" fill="#6E5448" />
                <ellipse cx="-6.8" cy="1.6" rx="1.9" ry="1.1" fill="#FF8DB4" opacity="0.85" />
                <ellipse cx="6.8" cy="1.6" rx="1.9" ry="1.1" fill="#FF8DB4" opacity="0.85" />
                <path d="M-2.2 2C-1 3.6 1 3.6 2.2 2" stroke="#6E5448" strokeWidth="1.3" strokeLinecap="round" />
              </>
            )}
          </g>
          <g className="animate-cloud-drift">
            <path
              d="M38 58C30 58 24 52 24 44C24 37 29 31 36 30C40 20 51 15 62 18C69 12 82 14 87 23C95 23 102 30 102 38C102 49 93 58 82 58H38Z"
              fill={palette.cloudFill}
              opacity={palette.isNight ? '0.78' : '1'}
            />
            <path
              d="M278 48C271 48 266 43 266 37C266 31 270 26 276 25C280 16 291 13 300 17C307 11 319 13 324 22C331 23 337 29 337 36C337 43 331 48 324 48H278Z"
              fill={palette.cloudFill}
              opacity={palette.isNight ? '0.78' : '1'}
            />
          </g>
        </svg>

        <div
          className="absolute inset-x-0 top-[17%] bottom-0 transition-all duration-700"
          style={{
            background: palette.sanctuaryMeadowGradient,
          }}
        />

        <svg
          viewBox="0 0 390 660"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="195"
            cy="360"
            rx="148"
            ry="158"
            fill={palette.meadowGlowFill}
            opacity={palette.meadowGlowOpacity}
          />
          <ellipse cx="135" cy="272" rx="19" ry="10" fill="#FFF7EB" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="164" cy="308" rx="20" ry="11" fill="#FFF2E0" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="190" cy="352" rx="19" ry="10" fill="#FFF7EB" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="196" cy="402" rx="21" ry="11" fill="#FFF2E0" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="195" cy="452" rx="20" ry="10" fill="#FFF7EB" stroke="#CEB39E" strokeWidth="1.8" />

          {/* 5-Petal Storybook Meadow Daisies */}
          {[
            { x: 56, y: 315, c: '#FFFDF9' },
            { x: 72, y: 332, c: '#FFB3CF' },
            { x: 328, y: 310, c: '#FFE48C' },
            { x: 315, y: 425, c: '#FFFDF9' },
            { x: 332, y: 442, c: '#FFB3CF' },
            { x: 64, y: 452, c: '#FFE48C' },
            { x: 282, y: 492, c: '#C7E9FF' },
          ].map((f, idx) => (
            <g key={idx} transform={`translate(${f.x}, ${f.y})`}>
              <circle cx="0" cy="-4.2" r="3.1" fill={f.c} />
              <circle cx="4" cy="-1.3" r="3.1" fill={f.c} />
              <circle cx="2.5" cy="3.4" r="3.1" fill={f.c} />
              <circle cx="-2.5" cy="3.4" r="3.1" fill={f.c} />
              <circle cx="-4" cy="-1.3" r="3.1" fill={f.c} />
              <circle cx="0" cy="0" r="2.2" fill="#FFD45E" />
            </g>
          ))}

          {/* Soft Grass Tufts */}
          {[
            { x: 95, y: 382 },
            { x: 262, y: 294 },
            { x: 112, y: 468 },
            { x: 274, y: 446 },
          ].map((g, i) => (
            <path
              key={i}
              d={`M${g.x - 4} ${g.y}Q${g.x - 2} ${g.y - 6} ${g.x - 6} ${g.y - 7}M${g.x} ${g.y}V${g.y - 7}M${g.x + 4} ${g.y}Q${g.x + 2} ${g.y - 6} ${g.x + 6} ${g.y - 7}`}
              stroke={palette.grassStroke}
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.72"
            />
          ))}

          {/* Cozy Pastel Pond with Lilypad & Pink Lotus */}
          <ellipse
            cx="300"
            cy="352"
            rx="25"
            ry="13.5"
            fill={palette.pondFill}
            stroke={palette.pondStroke}
            strokeWidth="2.2"
          />
          <ellipse
            cx="294"
            cy="348"
            rx="11"
            ry="4.5"
            fill={palette.pondHighlight}
            opacity="0.88"
          />
          <ellipse cx="310" cy="355" rx="6.5" ry="3.8" fill="#89D67B" stroke="#62AB57" strokeWidth="1.3" />
          <circle cx="311" cy="353" r="2.8" fill="#FFA6C9" />
          <circle cx="311" cy="353" r="1.1" fill="#FFE07D" />
        </svg>
      </div>

      {/* 1. SYNCED TOP HUD */}
      <SharedTopHud
        level={level}
        expPercent={expPercent}
        coins={coins}
        energy={energy}
        maxEnergy={maxEnergy}
        onOpenProfile={() => onOpenModal('profile')}
        onQuickCoins={onQuickCoins}
        onQuickEnergy={onQuickEnergy}
        onOpenCalendar={onOpenCalendar}
        hasCalendarBadge={hasCalendarBadge}
        onOpenSettings={onOpenSettings}
        subRow={
          <div className="flex items-center justify-center gap-1.5">
            {showLabels && (
              <button
                type="button"
                onClick={() => onOpenModal('snap')}
                className="bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-3 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] flex items-center gap-1 text-[11px] font-bold text-[#4B3C46] active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5 text-[#C99D66]" />
                <span>{theme}</span>
              </button>
            )}

            {onOpenQuest && (
              <button
                type="button"
                onClick={onOpenQuest}
                aria-label="First Bond Quest and Journey"
                className="bg-[#FFF3BF] border-2 border-[#C99D66] rounded-full px-2.5 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] text-[11px] font-extrabold text-[#4B3C46] tabular-nums active:scale-95 transition-transform cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                title="First Bond Quest & Journey"
              >
                <TrophyMiniIcon className="w-3.5 h-3.5" />
                <span>
                  {showLabels
                    ? questProgressLabel ?? 'Quest'
                    : (questProgressLabel ?? '').replace('Quest ', '')}
                </span>
              </button>
            )}

            {onOpenMemoryGame && (
              <button
                type="button"
                onClick={onOpenMemoryGame}
                aria-label="Play Pet Memory Minigame"
                className="bg-[#F3ECFF] border-2 border-[#C8B4EC] rounded-full px-2.5 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] text-[11px] font-extrabold text-[#563F7A] active:scale-95 transition-transform cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                title="Pet Memory"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#7A5BA8] stroke-[2.4]" />
                {showLabels && <span>Memory</span>}
              </button>
            )}
          </div>
        }
      />

      {/* 2. CENTER WORLD (Unobstructed Pastel Garden) */}
      <main className="relative z-10 flex-1 min-h-0 mx-3 mt-0.5 mb-0.5">
        <div className="relative w-full h-full">
          {/* WHITE-CREAM PASTEL PAINTED PICKET FENCE */}
          <div className="absolute inset-x-3 top-[9%] h-5 flex items-center justify-between pointer-events-none z-10">
            <div className="absolute inset-x-0 top-2 h-2.5 bg-[#F6ECE3] border-2 border-[#D4B8A5] rounded-full" />
            {Array.from({ length: 13 }).map((_, i) => (
              <div
                key={i}
                className="relative w-3.5 h-7 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-t-full shadow-[inset_0_-2px_0_#F2E6DC]"
              />
            ))}
          </div>

          <div className="absolute left-1 top-[10%] bottom-[13%] w-4 flex flex-col justify-between pointer-events-none z-10">
            <div className="absolute inset-y-2 left-1.5 w-2 bg-[#F6ECE3] border-2 border-[#D4B8A5] rounded-full" />
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="relative w-4 h-5 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-md"
              />
            ))}
          </div>

          <div className="absolute right-1 top-[10%] bottom-[13%] w-4 flex flex-col justify-between pointer-events-none z-10">
            <div className="absolute inset-y-2 right-1.5 w-2 bg-[#F6ECE3] border-2 border-[#D4B8A5] rounded-full" />
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="relative w-4 h-5 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-md"
              />
            ))}
          </div>

          {/* Bottom Picket Fence + Pastel Gate Sign */}
          <div className="absolute inset-x-2 bottom-[11.5%] h-9 flex items-end justify-between pointer-events-none z-20">
            <div className="relative flex-1 h-7 flex items-end justify-between pr-2">
              <div className="absolute inset-x-0 bottom-2 h-2.5 bg-[#F6ECE3] border-2 border-[#D4B8A5] rounded-full" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="relative w-4 h-7 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-t-full"
                />
              ))}
            </div>

            <div className="relative mx-1 flex flex-col items-center pointer-events-auto">
              <div className="flex items-end gap-1">
                <div className="w-3.5 h-10 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-t-md" />
                <div className="w-28 h-8 bg-[#FFF7EC] border-2 border-[#D4B8A5] rounded-md flex items-center justify-center relative">
                  <div className="absolute inset-x-1 top-1.5 h-1 bg-[#EFE0D2] rounded-full" />
                </div>
                <div className="w-3.5 h-10 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-t-md" />
              </div>

              <button
                type="button"
                onClick={() => onOpenModal('snap')}
                className="absolute -bottom-2.5 bg-[#FFF3BF] border-2 border-[#C99D66] rounded-full px-3 py-0.5 shadow-[0_3px_8px_rgba(138,116,126,0.16)] flex items-center gap-1 whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
                title="Streak Fence Gate"
              >
                <span className="font-display text-[11.5px] font-extrabold text-[#4B3C46] tabular-nums inline-flex items-center gap-1">
                  <FlameMiniIcon className="w-3.5 h-3.5" />
                  <span>{streakDays}d</span>
                  <span className="opacity-50">·</span>
                  <ShieldMiniIcon className="w-3.5 h-3.5" />
                  <span>{fenceHours}h</span>
                </span>
              </button>
            </div>

            <div className="relative flex-1 h-7 flex items-end justify-between pl-2">
              <div className="absolute inset-x-0 bottom-2 h-2.5 bg-[#F6ECE3] border-2 border-[#D4B8A5] rounded-full" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="relative w-4 h-7 bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-t-full"
                />
              ))}
            </div>
          </div>

          {/* Farmhouse (Top-Left) */}
          <button
            type="button"
            onClick={() => onOpenModal('farmhouse')}
            aria-label="Open Farmhouse"
            className="absolute left-3 top-[3%] w-[122px] h-[104px] z-20 transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <FarmhouseIllustration className="w-full h-full" />
          </button>

          {/* Cosmetic & Toy Stall (Top-Right) */}
          <button
            type="button"
            onClick={() => onOpenModal('shop')}
            aria-label="Open Shop"
            className="absolute right-3 top-[5%] w-[112px] h-[96px] z-20 transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <CosmeticStallIllustration className="w-full h-full" />
          </button>

          {/* Lucky Butterfly (Positioned in comfortable thumb reach with 44px hit area) */}
          <button
            type="button"
            onClick={() => {
              spawnHeartBurst(78, 44);
              const msg = onTapClover();
              showToastAt(msg, 74, 44);
            }}
            aria-label="Catch lucky butterfly"
            className="absolute right-[18%] top-[44%] z-25 w-11 h-11 flex items-center justify-center animate-butterfly cursor-pointer active:scale-125 transition-transform"
          >
            <svg viewBox="0 0 28 24" className="w-7 h-7" fill="none" aria-hidden="true">
              <path d="M14 12C9 4 2 6 4 13C5 16 10 15 14 12Z" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.8" />
              <path d="M14 12C19 4 26 6 24 13C23 16 18 15 14 12Z" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.8" />
              <line x1="14" y1="8" x2="14" y2="18" stroke="#4B3C46" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* INTERACTIVE GARDEN TOYS ON THE GRASS */}
          {activeToys.map((toy) => (
            <button
              key={toy.id}
              type="button"
              onClick={() => handleToyTap(toy)}
              style={{ left: `${toy.x}%`, top: `${toy.y}%` }}
              aria-label={`Play with ${toy.name}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#FFFDF9]/92 border-2 border-[#D9C3B4] shadow-xs flex items-center justify-center hover:scale-110 active:scale-90 transition-transform cursor-pointer"
              title={toy.name}
            >
              <ToyStickerIcon toyId={toy.id} name={toy.name} className="w-6 h-6" />
            </button>
          ))}

          {/* Placed Bait Dish Visual */}
          {activeBait && (() => {
            const baitStyle =
              activeBait === 'Salmon Pate'
                ? {
                    bowl: '#FFA6C9',
                    rim: '#FFD2E4',
                    fill: '#FF9A85',
                    accent: '#FFD9C8',
                  }
                : activeBait === 'Honey Biscuit'
                ? {
                    bowl: '#FFE07D',
                    rim: '#FFF2BD',
                    fill: '#E8AD63',
                    accent: '#FFE5B4',
                  }
                : {
                    bowl: '#A6E6B8',
                    rim: '#D6F8DF',
                    fill: '#7FD17A',
                    accent: '#FF9B54',
                  };

            return (
              <button
                type="button"
                onClick={() => onOpenModal('bag')}
                aria-label={`Active bait: ${activeBait}. Tap to change bait.`}
                className="absolute left-[22%] top-[60%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer active:scale-90 transition-transform group flex flex-col items-center"
                title={activeBait}
              >
                {/* Floating Scent & Food Bubble */}
                <div className="mb-0.5 flex items-center gap-0.5 bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-1.5 py-0.5 shadow-xs animate-bubble-float">
                  <BaitStickerIcon baitName={activeBait} className="w-4 h-4" />
                  <Sparkles className="w-3 h-3 text-[#F5C34B] shrink-0" />
                </div>

                {/* Hand-Drawn Pastel Bait Bowl */}
                <svg
                  viewBox="0 0 64 46"
                  className="w-14 h-10 drop-shadow-xs group-hover:scale-105 transition-transform"
                  fill="none"
                  aria-hidden="true"
                >
                  {/* Grass contact shadow */}
                  <ellipse cx="32" cy="40" rx="23" ry="5.5" fill="#69B558" opacity="0.38" />
                  {/* Aroma wisps */}
                  <path
                    d="M22 10C20 7 23 5 22 2"
                    stroke="#FFFDF9"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <path
                    d="M32 8C30 5 33 3 32 1"
                    stroke="#FFFDF9"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <path
                    d="M42 10C40 7 43 5 42 2"
                    stroke="#FFFDF9"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  {/* Bowl body */}
                  <path
                    d="M11 23H53L48 37C47 39.5 41 41 32 41C23 41 17 39.5 16 37L11 23Z"
                    fill={baitStyle.bowl}
                    stroke="#9B755D"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Bowl rim */}
                  <ellipse
                    cx="32"
                    cy="23"
                    rx="21"
                    ry="7.5"
                    fill={baitStyle.rim}
                    stroke="#9B755D"
                    strokeWidth="2.4"
                  />
                  {/* Mound of bait food inside bowl */}
                  <ellipse
                    cx="32"
                    cy="21.5"
                    rx="15"
                    ry="5.8"
                    fill={baitStyle.fill}
                    stroke="#9B755D"
                    strokeWidth="2"
                  />
                  <circle cx="26" cy="20" r="3" fill={baitStyle.accent} />
                  <circle cx="35" cy="19.5" r="3.4" fill={baitStyle.accent} />
                  <circle cx="38" cy="22.5" r="2.2" fill="#FFFDF9" opacity="0.85" />
                  {/* Tiny paw emblem on bowl front */}
                  <circle cx="32" cy="34" r="2.3" fill="#FFFDF9" opacity="0.9" />
                  <circle cx="28.8" cy="31.3" r="1.2" fill="#FFFDF9" opacity="0.9" />
                  <circle cx="32" cy="30.2" r="1.2" fill="#FFFDF9" opacity="0.9" />
                  <circle cx="35.2" cy="31.3" r="1.2" fill="#FFFDF9" opacity="0.9" />
                </svg>

                {showLabels && (
                  <span className="mt-0.5 bg-[#FFFDF9]/95 border border-[#D9C3B4] rounded-full px-2 py-0.5 text-[9.5px] font-extrabold text-[#4B3C46] whitespace-nowrap shadow-xs">
                    {activeBait}
                  </span>
                )}
              </button>
            );
          })()}

          {/* Floating Heart & Sparkle Particle Bursts */}
          {heartBursts.map((b) => (
            <div
              key={b.id}
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
              className="absolute z-40 pointer-events-none animate-heart-float flex items-center gap-1"
              aria-hidden="true"
            >
              <Heart className="w-3.5 h-3.5 fill-[#FFB3CF] text-[#FF85A1] -mt-2" />
              <Heart className="w-4.5 h-4.5 fill-[#FF85A1] text-[#FF6B8E] drop-shadow-xs" />
              <Sparkles className="w-3.5 h-3.5 text-[#F5C34B] -mt-2.5" />
            </div>
          ))}

          {floatingFeedback && (
            <div
              style={{
                left: `${floatingFeedback.x}%`,
                top: `${floatingFeedback.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none bg-[#FFFDF9] border-2 border-[#D9C3B4] rounded-full px-2.5 py-0.5 text-[11.5px] font-extrabold text-[#4B3C46] shadow-sm whitespace-nowrap animate-bounce"
            >
              {floatingFeedback.text}
            </div>
          )}

          {/* ROAMING CROPPED REAL PET PHOTOS */}
          {pets.map((pet, idx) => {
            const pos = petPositions[pet.id] ?? {
              x: pet.x,
              y: pet.y,
              flip: Boolean(pet.flip),
            };

            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => handlePetTap(pet)}
                aria-label={`Pet ${pet.name}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transition: 'left 2.4s ease-in-out, top 2.4s ease-in-out',
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer focus:outline-none group"
              >
                {pet.needsCare && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 animate-bubble-float">
                    <div className="relative bg-[#FFFDF9] border-2 border-[#D4B8A5] rounded-full w-8 h-8 flex items-center justify-center shadow-[0_2px_6px_rgba(138,116,126,0.16)]">
                      {pet.needsCare === 'heart' ? (
                        <Heart className="w-4 h-4 fill-[#FF85A1] text-[#FF85A1]" />
                      ) : pet.needsCare === 'food' ? (
                        <CropFoodIcon item="carrot" className="w-4 h-4" />
                      ) : (
                        <Droplets className="w-4 h-4 fill-[#7CCBFF] text-[#7CCBFF]" />
                      )}
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FFFDF9] border-r-2 border-b-2 border-[#D4B8A5] rotate-45" />
                    </div>
                  </div>
                )}

                <div
                  className={`group-active:scale-110 transition-transform ${
                    pet.animState === 'eating'
                      ? 'animate-pet-eat'
                      : pet.animState === 'playing'
                      ? 'animate-pet-play'
                      : pet.animState === 'happy'
                      ? 'animate-pet-happy'
                      : 'animate-pet-hop'
                  }`}
                  style={{ animationDelay: `${idx * 0.45}s` }}
                >
                  <CroppedPetCutout
                    photoUrl={pet.photoUrl}
                    alt={pet.name}
                    species={pet.species}
                    mode={pet.cutoutMode ?? 'auto'}
                    accessory={pet.accessory}
                    hatTransform={pet.hatTransform}
                    bbox={pet.box_2d}
                    flip={pos.flip}
                    className="w-[78px] h-[78px]"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* 3. SYNCED BOTTOM DOCK */}
      <SharedBottomDock
        activeTab="sanctuary"
        readyFarmCount={readyFarmCount}
        luredCount={luredCount}
        onSelectYard={() => {}}
        onSelectFarm={onOpenFarm}
        onSelectVisit={() => onOpenModal('visit')}
        onSelectBag={() => onOpenModal('bag')}
        onSelectAlbum={() => onOpenModal('album')}
        primaryCta={
          <div className="w-full flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenModal('farmhouse')}
              aria-label="Pets & Farmhouse"
              title="Pets"
              className="cream-pill w-12 h-12 rounded-full flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
            >
              <PawPrint className="w-5 h-5 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('snap')}
              aria-label="Snap"
              title="Snap"
              className="buttercup-cta w-16 h-16 rounded-full flex items-center justify-center text-[#4B3C46] active:scale-95 transition-transform cursor-pointer shrink-0"
            >
              <Camera className="w-7 h-7 stroke-[2.3]" />
            </button>

            <button
              type="button"
              onClick={() => onOpenModal('shop')}
              aria-label="Shop"
              title="Shop"
              className="cream-pill w-12 h-12 rounded-full bg-[#FFF5F8] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        }
      />
    </div>
  );
};
