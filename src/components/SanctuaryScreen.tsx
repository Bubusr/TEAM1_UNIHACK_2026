import React, { useEffect, useState } from 'react';
import { Camera, Heart, Droplets } from 'lucide-react';
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
import { CroppedPetCutout } from './CroppedPetCutout';
import { FOOD_META } from './FarmScreen';
import { SharedBottomDock, SharedTopHud } from './SharedHud';

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
  onSelectPet?: (petId: string) => void;
  onCarePet: (petId: string) => string;
  onFeedPet: (food: FoodItemType, petId?: string) => string;
  onPlayToy: (toy: GardenToy, petId?: string) => string;
  onTapClover: () => string;
  onOpenFarm: () => void;
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
  onSelectPet,
  onCarePet,
  onFeedPet,
  onPlayToy,
  onTapClover,
  onOpenFarm,
  onOpenModal,
  onQuickCoins,
  onQuickEnergy,
}) => {
  const activeToys = toys.filter((t) => t.owned);
  const selectedPet =
    pets.find((p) => p.id === selectedPetId || p.petUid === selectedPetId) ??
    pets[0] ??
    null;

  const [petPositions, setPetPositions] = useState<
    Record<string, { x: number; y: number; flip: boolean }>
  >({});
  const [floatingFeedback, setFloatingFeedback] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);

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

  const showToastAt = (text: string, x = 50, y = 45) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingFeedback({ id, text, x, y });
    window.setTimeout(() => {
      setFloatingFeedback((cur) => (cur?.id === id ? null : cur));
    }, 1050);
  };

  const handlePetTap = (pet: SanctuaryPet) => {
    const pos = petPositions[pet.id] ?? { x: pet.x, y: pet.y };
    onSelectPet?.(pet.id);
    const msg = onCarePet(pet.id);
    showToastAt(msg, pos.x, Math.max(20, pos.y - 12));
  };

  const handleToyTap = (toy: GardenToy) => {
    const targetPet = selectedPet;
    if (targetPet) {
      setPetPositions((prev) => ({
        ...prev,
        [targetPet.id]: {
          x: Math.max(24, toy.x - 6),
          y: Math.max(40, toy.y - 4),
          flip: (prev[targetPet.id]?.x ?? targetPet.x) > toy.x,
        },
      }));
    }
    const msg = onPlayToy(toy, targetPet?.id);
    showToastAt(
      targetPet ? `${targetPet.name}: ${msg}` : msg,
      toy.x,
      toy.y - 10
    );
  };

  const availableSnacks = (Object.keys(FOOD_META) as FoodItemType[]).filter(
    (k) => foodInventory[k] > 0
  );

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between"
      style={{ backgroundColor: '#AEE88D' }}
    >
      {/* PASTEL SKY + SUNLIT MEADOW BACKDROP */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 h-[24%]"
          style={{
            background:
              'linear-gradient(180deg, #CBEFFF 0%, #E7F7FF 72%, #C9F4B5 100%)',
          }}
        />
        <svg
          viewBox="0 0 400 120"
          className="absolute top-3 left-0 w-full h-24 opacity-95"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M38 58C30 58 24 52 24 44C24 37 29 31 36 30C40 20 51 15 62 18C69 12 82 14 87 23C95 23 102 30 102 38C102 49 93 58 82 58H38Z"
            fill="#FFFDF9"
          />
          <path
            d="M278 48C271 48 266 43 266 37C266 31 270 26 276 25C280 16 291 13 300 17C307 11 319 13 324 22C331 23 337 29 337 36C337 43 331 48 324 48H278Z"
            fill="#FFFDF9"
          />
        </svg>

        <div
          className="absolute inset-x-0 top-[17%] bottom-0"
          style={{
            background:
              'radial-gradient(circle at 50% 44%, #C7F2A7 0%, #B0E78B 60%, #98DC71 100%)',
          }}
        />

        <svg
          viewBox="0 0 390 660"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <ellipse cx="195" cy="360" rx="145" ry="155" fill="#E9FCCE" opacity="0.4" />
          <ellipse cx="135" cy="272" rx="19" ry="10" fill="#FFF7EB" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="164" cy="308" rx="20" ry="11" fill="#FFF2E0" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="190" cy="352" rx="19" ry="10" fill="#FFF7EB" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="196" cy="402" rx="21" ry="11" fill="#FFF2E0" stroke="#CEB39E" strokeWidth="1.8" />
          <ellipse cx="195" cy="452" rx="20" ry="10" fill="#FFF7EB" stroke="#CEB39E" strokeWidth="1.8" />

          {[
            { x: 56, y: 315, c: '#FFFDF9' },
            { x: 70, y: 328, c: '#FFA6C9' },
            { x: 328, y: 310, c: '#FFE07D' },
            { x: 315, y: 425, c: '#FFFDF9' },
            { x: 332, y: 440, c: '#FFA6C9' },
            { x: 64, y: 452, c: '#FFE07D' },
            { x: 282, y: 492, c: '#FFE07D' },
          ].map((f, idx) => (
            <g key={idx}>
              <circle cx={f.x} cy={f.y} r="5" fill={f.c} />
              <circle cx={f.x} cy={f.y} r="1.9" fill="#F5C34B" />
            </g>
          ))}

          <ellipse cx="300" cy="352" rx="24" ry="13" fill="#B5E8FF" stroke="#A6C8DC" strokeWidth="2.2" />
          <ellipse cx="295" cy="348" rx="11" ry="5" fill="#E3F7FF" opacity="0.8" />
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
        subRow={
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenModal('snap')}
                className="bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-3 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] flex items-center gap-1.5 text-[11.5px] font-bold text-[#4B3C46] active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5 text-[#C99D66]" />
                <span>{theme}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenModal('farmhouse')}
                className="bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-2.5 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] text-[11.5px] font-extrabold text-[#4B3C46] tabular-nums active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
                title="Daily petting coin limit"
              >
                ❤️ {limits.petCoinsUsed}/{limits.petCoinsMax}
              </button>
            </div>

            {pets.length > 0 && (
              <div
                className="flex items-center justify-center gap-1 flex-wrap max-w-full"
                aria-label="Active companion selector"
              >
                {pets.map((pet) => {
                  const isActive = selectedPet?.id === pet.id;
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => onSelectPet?.(pet.id)}
                      aria-pressed={isActive}
                      title={isActive ? `🐾 ${pet.name} (Đang chọn để chăm sóc/cho ăn/chơi bóng)` : `Chọn ${pet.name}`}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#FFE07D] border-[#C99D66] text-[#4B3C46] shadow-xs'
                          : 'bg-[#FFFDF9]/90 border-[#D9C3B4] text-[#8A747E] hover:text-[#4B3C46]'
                      }`}
                    >
                      {isActive ? `🐾 ${pet.name}` : pet.name}
                    </button>
                  );
                })}
              </div>
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
                <span className="font-display text-[11.5px] font-extrabold text-[#4B3C46] tabular-nums">
                  🔥 {streakDays}d · 🛡️ {fenceHours}h
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

          {/* Lucky Butterfly */}
          <button
            type="button"
            onClick={() => {
              const msg = onTapClover();
              showToastAt(msg, 74, 28);
            }}
            aria-label="Catch lucky butterfly"
            className="absolute right-[23%] top-[28%] z-25 animate-butterfly cursor-pointer active:scale-125 transition-transform"
          >
            <svg viewBox="0 0 28 24" className="w-7 h-7" fill="none" aria-hidden="true">
              <path d="M14 12C9 4 2 6 4 13C5 16 10 15 14 12Z" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.8" />
              <path d="M14 12C19 4 26 6 24 13C23 16 18 15 14 12Z" fill="#FFE07D" stroke="#A6826E" strokeWidth="1.8" />
              <line x1="14" y1="8" x2="14" y2="18" stroke="#4B3C46" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {/* Quick-Feed Snack Pills (from Farm Harvest) */}
          {availableSnacks.length > 0 && (
            <div className="absolute left-4 top-[29%] z-25 flex flex-wrap gap-1 max-w-[165px]">
              {availableSnacks.slice(0, 4).map((foodKey) => (
                <button
                  key={foodKey}
                  type="button"
                  onClick={() => {
                    const msg = onFeedPet(foodKey, selectedPet?.id);
                    const pos = selectedPet
                      ? petPositions[selectedPet.id] ?? {
                          x: selectedPet.x,
                          y: selectedPet.y,
                        }
                      : { x: 46, y: 48 };
                    showToastAt(
                      selectedPet ? `${selectedPet.name}: ${msg}` : msg,
                      pos.x,
                      Math.max(20, pos.y - 10)
                    );
                  }}
                  className="bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-2 py-0.5 text-[11.5px] font-extrabold text-[#4B3C46] shadow-xs flex items-center gap-0.5 active:scale-90 transition-transform cursor-pointer"
                  title={`Feed ${FOOD_META[foodKey].name} to ${selectedPet?.name ?? 'pet'}`}
                >
                  <span>{FOOD_META[foodKey].icon}</span>
                  <span className="tabular-nums">{foodInventory[foodKey]}</span>
                </button>
              ))}
            </div>
          )}

          {/* INTERACTIVE GARDEN TOYS ON THE GRASS */}
          {activeToys.map((toy) => (
            <button
              key={toy.id}
              type="button"
              onClick={() => handleToyTap(toy)}
              style={{ left: `${toy.x}%`, top: `${toy.y}%` }}
              aria-label={`Play with ${toy.name}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#FFFDF9]/90 border-2 border-[#D9C3B4] shadow-xs flex items-center justify-center text-[20px] hover:scale-110 active:scale-90 transition-transform cursor-pointer"
              title={toy.name}
            >
              {toy.icon}
            </button>
          ))}

          {/* Placed Pate Bait */}
          {activeBait && (
            <button
              type="button"
              onClick={() => onOpenModal('bag')}
              className="absolute left-[18%] top-[55%] z-15 cursor-pointer active:scale-95 transition-transform"
              title={activeBait}
            >
              <svg viewBox="0 0 42 32" className="w-9 h-7" fill="none" aria-hidden="true">
                <ellipse cx="21" cy="24" rx="16" ry="6" fill="#FFA6C9" stroke="#A6826E" strokeWidth="2.2" />
                <ellipse cx="21" cy="18" rx="13" ry="5" fill="#FFCE9E" stroke="#A6826E" strokeWidth="1.8" />
              </svg>
            </button>
          )}

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
            const isSelected = selectedPet?.id === pet.id;

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
                        <span className="text-[13px] leading-none">🥕</span>
                      ) : (
                        <Droplets className="w-4 h-4 fill-[#7CCBFF] text-[#7CCBFF]" />
                      )}
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FFFDF9] border-r-2 border-b-2 border-[#D4B8A5] rotate-45" />
                    </div>
                  </div>
                )}

                <div
                  className={`animate-pet-hop group-active:scale-110 transition-transform rounded-full ${
                    isSelected ? 'ring-2 ring-[#FFE07D]/90 ring-offset-2 ring-offset-transparent' : ''
                  }`}
                  style={{ animationDelay: `${idx * 0.45}s` }}
                >
                  <CroppedPetCutout
                    photoUrl={pet.photoUrl}
                    alt={pet.name}
                    mode={pet.cutoutMode ?? 'auto'}
                    accessory={pet.accessory}
                    flip={pos.flip}
                    className="w-[78px] h-[78px]"
                  />
                </div>
                {isSelected && (
                  <span className="mt-0.5 inline-block bg-[#FFF3BF]/95 border border-[#C99D66] rounded-full px-1.5 py-0 text-[9px] font-extrabold text-[#4B3C46] shadow-xs">
                    {pet.name}
                  </span>
                )}
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
        onSelectRescue={() => onOpenModal('rescue')}
        onSelectBag={() => onOpenModal('bag')}
        onSelectAlbum={() => onOpenModal('album')}
        primaryCta={
          <button
            type="button"
            onClick={() => onOpenModal('snap')}
            className="buttercup-cta rounded-full px-6 h-[38px] flex items-center justify-center gap-2 font-display text-[14px] font-extrabold text-[#4B3C46] whitespace-nowrap cursor-pointer"
          >
            <span>📷 Snap &amp; Renew</span>
          </button>
        }
      />
    </div>
  );
};
