import React, { useEffect, useState } from 'react';
import { ArrowLeft, Droplets, Gift, Heart, Store, Users } from 'lucide-react';
import { NeighborGarden } from '../types';
import {
  CosmeticStallIllustration,
  FarmhouseIllustration,
} from './HandDrawnAssets';
import { CroppedPetCutout } from './CroppedPetCutout';
import { SanctuaryModalType } from './SanctuaryScreen';
import { SharedBottomDock, SharedTopHud } from './SharedHud';

interface NeighborGardenScreenProps {
  coins: number;
  energy: number;
  maxEnergy: number;
  level: number;
  expPercent: number;
  readyFarmCount: number;
  luredCount: number;
  neighbors: NeighborGarden[];
  visitingNeighbor: NeighborGarden | null;
  onVisitNeighbor: (neighborId: string) => void;
  onLeaveNeighbor: () => void;
  onOpenNeighborFarm: () => void;
  onSelectYard: () => void;
  onSelectFarm: () => void;
  onOpenModal: (modal: SanctuaryModalType) => void;
  onQuickCoins: () => void;
  onQuickEnergy: () => void;
  onNeighborPat: (petId: string) => string;
  onNeighborGift: () => string;
}

export const NeighborGardenScreen: React.FC<NeighborGardenScreenProps> = ({
  coins,
  energy,
  maxEnergy,
  level,
  expPercent,
  readyFarmCount,
  luredCount,
  neighbors,
  visitingNeighbor,
  onVisitNeighbor,
  onLeaveNeighbor,
  onOpenNeighborFarm,
  onSelectYard,
  onSelectFarm,
  onOpenModal,
  onQuickCoins,
  onQuickEnergy,
  onNeighborPat,
  onNeighborGift,
}) => {
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
    if (!visitingNeighbor) return;
    setPetPositions((prev) => {
      const next = { ...prev };
      for (const pet of visitingNeighbor.pets) {
        if (!next[pet.id]) {
          next[pet.id] = { x: pet.x, y: pet.y, flip: Boolean(pet.flip) };
        }
      }
      return next;
    });
  }, [visitingNeighbor]);

  useEffect(() => {
    if (!visitingNeighbor) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setPetPositions((prev) => {
        const next: Record<string, { x: number; y: number; flip: boolean }> = {};
        for (const pet of visitingNeighbor.pets) {
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
  }, [visitingNeighbor]);

  const showToastAt = (text: string, x = 50, y = 45) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingFeedback({ id, text, x, y });
    window.setTimeout(() => {
      setFloatingFeedback((cur) => (cur?.id === id ? null : cur));
    }, 1050);
  };

  const meadowPalette = visitingNeighbor
    ? visitingNeighbor.themeTint === 'peach'
      ? {
          bg: '#FFE7D6',
          sky: 'linear-gradient(180deg, #FFE6EE 0%, #FFF4EB 72%, #F5E7C4 100%)',
          lawn: 'radial-gradient(circle at 50% 44%, #DDF2B5 0%, #C6E795 62%, #B2DA7E 100%)',
        }
      : visitingNeighbor.themeTint === 'sky'
      ? {
          bg: '#DDF2FF',
          sky: 'linear-gradient(180deg, #BFE7FF 0%, #E7F7FF 72%, #CEFABF 100%)',
          lawn: 'radial-gradient(circle at 50% 44%, #C7F5CE 0%, #ADEBB8 62%, #97DFAA 100%)',
        }
      : {
          bg: '#EFE6FF',
          sky: 'linear-gradient(180deg, #E8DEFF 0%, #F7F2FF 72%, #D7F4C9 100%)',
          lawn: 'radial-gradient(circle at 50% 44%, #D2F2BA 0%, #BBE79D 62%, #A6DB85 100%)',
        }
    : {
        bg: '#F3ECFF',
        sky: 'linear-gradient(180deg, #ECE2FF 0%, #FFF6FA 72%, #DFF6D8 100%)',
        lawn: 'radial-gradient(circle at 50% 44%, #E3F6D5 0%, #CBEBB5 62%, #B8E19E 100%)',
      };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between"
      style={{ backgroundColor: meadowPalette.bg }}
    >
      {/* PASTEL NEIGHBOR GARDEN BACKDROP */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 h-[24%]"
          style={{ background: meadowPalette.sky }}
        />
        <div
          className="absolute inset-x-0 top-[17%] bottom-0"
          style={{ background: meadowPalette.lawn }}
        />
        <svg
          viewBox="0 0 390 660"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <ellipse cx="195" cy="360" rx="145" ry="155" fill="#E9FCCE" opacity="0.4" />
          <ellipse cx="300" cy="352" rx="24" ry="13" fill="#B5E8FF" stroke="#A6C8DC" strokeWidth="2.2" />
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
          visitingNeighbor ? (
            <div className="w-full flex items-center justify-between gap-1.5 px-0.5">
              <button
                type="button"
                onClick={onLeaveNeighbor}
                className="bg-[#FFFDF9] border-2 border-[#D9C3B4] rounded-full px-2.5 py-0.5 shadow-xs flex items-center gap-1 text-[11px] font-extrabold text-[#4B3C46] active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Leave</span>
              </button>

              <div className="bg-[#FFF5F8] border-2 border-[#E8CFD9] rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-[#4B3C46] whitespace-nowrap">
                🏡 {visitingNeighbor.ownerName} · ❤️ {visitingNeighbor.patsUsed}/
                {visitingNeighbor.maxPats}
              </div>

              <button
                type="button"
                onClick={onOpenNeighborFarm}
                className="bg-[#E8F8CE] border-2 border-[#BDD996] rounded-full px-2.5 py-0.5 shadow-xs text-[11px] font-extrabold text-[#4B3C46] active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              >
                🌾 Farm
              </button>
            </div>
          ) : (
            <div className="bg-[#FFFDF9]/95 border-2 border-[#D9C3B4] rounded-full px-3 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.1)] text-[11.5px] font-extrabold text-[#4B3C46] whitespace-nowrap">
              🏘️ Visit a Neighbor’s Garden
            </div>
          )
        }
      />

      {/* 2. CENTER WORLD */}
      <main className="relative z-10 flex-1 min-h-0 mx-3 mt-0.5 mb-0.5">
        {!visitingNeighbor ? (
          /* Neighbor Directory when no garden is currently visited */
          <div className="w-full h-full flex flex-col justify-center gap-2.5 px-1">
            <div className="bg-[#FFFDF9]/92 border-2 border-[#DFCBBF] rounded-[24px] p-3 shadow-[0_10px_24px_rgba(138,116,126,0.14)] space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                  🏘️ Pick a Garden to Visit
                </span>
                <Users className="w-4 h-4 text-[#8A747E]" />
              </div>

              {neighbors.map((n) => (
                <div
                  key={n.id}
                  className="bg-[#F7F3FF] border border-[#DFD2F7] rounded-2xl p-2 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#FFFDF9] border border-[#DFD2F7] overflow-hidden shrink-0">
                      <CroppedPetCutout
                        photoUrl={n.pets[0].photoUrl}
                        alt={n.pets[0].name}
                        mode="studio"
                        className="w-10 h-10"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-[13px] font-extrabold text-[#4B3C46] truncate">
                        {n.ownerName}
                      </div>
                      <div className="text-[10.5px] font-bold text-[#8A747E] truncate">
                        {n.gardenName} · 🔥 {n.streakDays}d
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onVisitNeighbor(n.id)}
                    className="buttercup-cta rounded-full px-3 py-1 text-[11.5px] font-extrabold text-[#4B3C46] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Visit
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Neighbor's Top-Down Garden */
          <div className="relative w-full h-full">
            {/* Picket Fence */}
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

            {/* Bottom Gate */}
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
                  onClick={() => onOpenModal('visit')}
                  className="absolute -bottom-2.5 bg-[#FFF3BF] border-2 border-[#C99D66] rounded-full px-3 py-0.5 shadow-[0_3px_8px_rgba(138,116,126,0.16)] flex items-center gap-1 whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
                  title="Switch Neighbor"
                >
                  <span className="font-display text-[11px] font-extrabold text-[#4B3C46] tabular-nums">
                    🔥 {visitingNeighbor.streakDays}d · 🛡️ 24h
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

            {/* Farmhouse */}
            <div className="absolute left-3 top-[3%] w-[116px] h-[98px] z-20 pointer-events-none">
              <FarmhouseIllustration className="w-full h-full" />
            </div>

            {/* Neighbor Stall (Tappable) */}
            <button
              type="button"
              onClick={() => onOpenModal('neighborMarket')}
              aria-label="Open Neighbor Stall"
              className="absolute right-3 top-[5%] w-[108px] h-[92px] z-20 transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <CosmeticStallIllustration className="w-full h-full" />
            </button>

            {/* Neighbor Toys */}
            {visitingNeighbor.toys.map((toy) => (
              <button
                key={toy.id}
                type="button"
                onClick={() => showToastAt('🎾 Fun!', toy.x, toy.y - 10)}
                style={{ left: `${toy.x}%`, top: `${toy.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#FFFDF9]/90 border-2 border-[#D9C3B4] shadow-xs flex items-center justify-center text-[18px] active:scale-90 transition-transform cursor-pointer"
                title={toy.name}
              >
                {toy.icon}
              </button>
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

            {/* Neighbor Pets */}
            {visitingNeighbor.pets.map((pet, idx) => {
              const pos = petPositions[pet.id] ?? {
                x: pet.x,
                y: pet.y,
                flip: Boolean(pet.flip),
              };
              return (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => {
                    const msg = onNeighborPat(pet.id);
                    showToastAt(msg, pos.x, Math.max(20, pos.y - 12));
                  }}
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
                    className="animate-pet-hop group-active:scale-110 transition-transform"
                    style={{ animationDelay: `${idx * 0.45}s` }}
                  >
                    <CroppedPetCutout
                      photoUrl={pet.photoUrl}
                      alt={pet.name}
                      species={pet.species}
                      mode={pet.cutoutMode ?? 'auto'}
                      accessory={pet.accessory}
                      flip={pos.flip}
                      className="w-[76px] h-[76px]"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. SYNCED BOTTOM DOCK */}
      <SharedBottomDock
        activeTab="visit"
        readyFarmCount={readyFarmCount}
        luredCount={luredCount}
        onSelectYard={onSelectYard}
        onSelectFarm={onSelectFarm}
        onSelectVisit={() => onOpenModal('visit')}
        onSelectRescue={() => onOpenModal('rescue')}
        onSelectBag={() => onOpenModal('bag')}
        onSelectAlbum={() => onOpenModal('album')}
        primaryCta={
          visitingNeighbor ? (
            <div className="w-full flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onOpenModal('neighborMarket')}
                className="cream-btn rounded-full px-4 h-[38px] font-display text-[13px] font-extrabold text-[#4B3C46] bg-[#EFF8FF] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Store className="w-4 h-4" />
                <span>Buy Crops</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = onNeighborGift();
                  showToastAt(msg, 65, 65);
                }}
                className="buttercup-cta rounded-full px-4 h-[38px] font-display text-[13px] font-extrabold text-[#4B3C46] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Gift className="w-4 h-4" />
                <span>{visitingNeighbor.gifted ? 'Gifted ✓' : 'Gift +25'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenModal('visit')}
              className="buttercup-cta rounded-full px-6 h-[38px] font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Users className="w-4 h-4 stroke-[2.4]" />
              <span>Choose Neighbor</span>
            </button>
          )
        }
      />
    </div>
  );
};
