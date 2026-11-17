import React, { useEffect, useState } from 'react';
import { ArrowLeft, Droplets, Gift, Store } from 'lucide-react';
import { NeighborGarden } from '../types';
import { FOOD_META } from './FarmScreen';
import { SanctuaryModalType } from './SanctuaryScreen';
import { SharedBottomDock, SharedTopHud } from './SharedHud';

interface NeighborFarmScreenProps {
  coins: number;
  energy: number;
  maxEnergy: number;
  level: number;
  expPercent: number;
  readyFarmCount: number;
  luredCount: number;
  activeNeighbor: NeighborGarden;
  onSelectNeighborGarden: () => void;
  onSelectYard: () => void;
  onSelectFarm: () => void;
  onOpenModal: (modal: SanctuaryModalType) => void;
  onQuickCoins: () => void;
  onQuickEnergy: () => void;
  onWaterNeighborPlot: (neighborId: string, plotId: string) => string;
  onWaterNeighborTree: (neighborId: string, treeId: string) => string;
  onGiftNeighbor: (neighborId: string) => string;
}

export const NeighborFarmScreen: React.FC<NeighborFarmScreenProps> = ({
  coins,
  energy,
  maxEnergy,
  level,
  expPercent,
  readyFarmCount,
  luredCount,
  activeNeighbor,
  onSelectNeighborGarden,
  onSelectYard,
  onSelectFarm,
  onOpenModal,
  onQuickCoins,
  onQuickEnergy,
  onWaterNeighborPlot,
  onWaterNeighborTree,
  onGiftNeighbor,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = (msg: string | void) => {
    if (!msg) return;
    setToast(msg);
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur));
    }, 1100);
  };

  const palette =
    activeNeighbor.themeTint === 'peach'
      ? {
          bg: '#FFE7D6',
          sky: 'linear-gradient(180deg, #FFE6EE 0%, #FFF4EB 72%, #F5E7C4 100%)',
          lawn: 'radial-gradient(circle at 50% 48%, #DDF2B5 0%, #C6E795 62%, #B2DA7E 100%)',
        }
      : activeNeighbor.themeTint === 'sky'
      ? {
          bg: '#DDF2FF',
          sky: 'linear-gradient(180deg, #BFE7FF 0%, #E7F7FF 72%, #CEFABF 100%)',
          lawn: 'radial-gradient(circle at 50% 48%, #C7F5CE 0%, #ADEBB8 62%, #97DFAA 100%)',
        }
      : {
          bg: '#EFE6FF',
          sky: 'linear-gradient(180deg, #E8DEFF 0%, #F7F2FF 72%, #D7F4C9 100%)',
          lawn: 'radial-gradient(circle at 50% 48%, #D2F2BA 0%, #BBE79D 62%, #A6DB85 100%)',
        };

  const availableStallCount = activeNeighbor.marketStock.filter(
    (m) => !m.sold
  ).length;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between"
      style={{ backgroundColor: palette.bg }}
    >
      {/* PASTEL NEIGHBOR ORCHARD & STREAM BACKDROP */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 h-[22%]"
          style={{ background: palette.sky }}
        />
        <div
          className="absolute inset-x-0 top-[16%] bottom-0"
          style={{ background: palette.lawn }}
        />

        <svg
          viewBox="0 0 390 660"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M42 120 C70 185 26 250 56 320 C80 385 32 455 46 535"
            stroke="#A5E2FF"
            strokeWidth="30"
            strokeLinecap="round"
          />
          <path
            d="M42 120 C70 185 26 250 56 320 C80 385 32 455 46 535"
            stroke="#D6F3FF"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M195 145 L195 540"
            stroke="#FFF4E3"
            strokeWidth="24"
            strokeLinecap="round"
            opacity="0.65"
          />
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
        rightBadge={
          <div className="relative flex items-center">
            <div className="w-6.5 h-6.5 rounded-full bg-[#DFF3FF] border-2 border-[#8DC3E8] flex items-center justify-center relative z-10 -mr-2 shadow-xs">
              <Droplets className="w-3.5 h-3.5 fill-[#7CCBFF] text-[#499AD3]" />
            </div>
            <div
              className="cream-pill rounded-full pl-3 pr-2 py-0.5 flex items-center gap-1 min-h-[32px]"
              title="Daily neighbor watering helps"
            >
              <span className="font-display text-[13px] font-extrabold text-[#4B3C46] tabular-nums whitespace-nowrap">
                {activeNeighbor.waterHelpsUsed}/{activeNeighbor.maxWaterHelps}
              </span>
            </div>
          </div>
        }
        subRow={
          <div className="w-full flex items-center justify-between gap-2 px-0.5">
            <button
              type="button"
              onClick={onSelectNeighborGarden}
              className="bg-[#FFFDF9] border-2 border-[#D9C3B4] rounded-full px-2.5 py-0.5 shadow-xs flex items-center gap-1 text-[11px] font-extrabold text-[#4B3C46] active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{activeNeighbor.ownerName}’s Garden</span>
            </button>

            <div className="bg-[#FFF5F8] border-2 border-[#E8CFD9] rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-[#4B3C46] whitespace-nowrap">
              🌾 {activeNeighbor.ownerName}’s Farm
            </div>
          </div>
        }
      />

      {/* 2. NEIGHBOR FARM WORLD */}
      <main className="relative z-20 flex-1 min-h-0 px-3.5 py-1 flex flex-col justify-between">
        {/* Top Row: Neighbor Signpost + 2 Orchard Trees */}
        <div className="flex items-end justify-between gap-2 pt-0.5">
          <div className="bg-[#FFF7EC] border-2 border-[#D4B8A5] rounded-2xl px-2.5 py-1.5 shadow-xs flex flex-col items-start">
            <span className="font-display text-[11px] font-extrabold text-[#4B3C46] leading-tight">
              🚜 {activeNeighbor.gardenName}
            </span>
            <span className="text-[9.5px] font-bold text-[#8A747E]">
              Tap 💧 to help {activeNeighbor.ownerName}!
            </span>
          </div>

          <div className="flex items-end gap-2">
            {activeNeighbor.farmTrees.map((tree) => {
              const meta = FOOD_META[tree.fruit];
              const isReady = nowMs >= tree.readyAt;
              const secsLeft = Math.max(
                1,
                Math.ceil((tree.readyAt - nowMs) / 1000)
              );

              return (
                <button
                  key={tree.id}
                  type="button"
                  onClick={() =>
                    showToast(onWaterNeighborTree(activeNeighbor.id, tree.id))
                  }
                  aria-label={`Help ${activeNeighbor.ownerName}'s ${meta.name} tree`}
                  className="relative flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="relative w-15 h-15 rounded-full bg-[#92DC7E] border-2 border-[#75BD63] shadow-[inset_0_-4px_0_#7AC768,0_4px_10px_rgba(75,60,70,0.12)] flex items-center justify-center">
                    <div className="absolute top-1.5 left-2.5 w-5 h-3 rounded-full bg-[#B4EC9F]/70" />
                    {isReady ? (
                      <div className="grid grid-cols-2 gap-0.5 text-[14px] leading-none">
                        <span>{meta.icon}</span>
                        <span>{meta.icon}</span>
                      </div>
                    ) : (
                      <span className="bg-[#FFFDF9]/90 border border-[#D9C3B4] rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-[#4B3C46] tabular-nums">
                        {!tree.watered ? '💧 ' : ''}
                        {secsLeft}s
                      </span>
                    )}
                  </div>
                  <div className="w-3 h-3 bg-[#E6B88A] border-2 border-[#B38964] -mt-1 rounded-b-md" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Neighbor's 3x2 Crop Plots */}
        <div className="bg-[#FFFDF9]/55 border-2 border-[#E2D2C5] rounded-[24px] p-2.5 shadow-[0_8px_20px_rgba(138,116,126,0.12)] w-full max-w-[300px] mx-auto">
          <div className="grid grid-cols-3 gap-2">
            {activeNeighbor.farmPlots.map((plot) => {
              const meta = plot.crop ? FOOD_META[plot.crop] : null;
              const effectiveMs = plot.watered
                ? plot.durationMs * 0.55
                : plot.durationMs;
              const elapsed = plot.plantedAt ? nowMs - plot.plantedAt : 0;
              const progress = plot.crop
                ? Math.min(1, elapsed / effectiveMs)
                : 0;
              const isReady = Boolean(plot.crop && progress >= 1);

              return (
                <button
                  key={plot.id}
                  type="button"
                  onClick={() =>
                    showToast(onWaterNeighborPlot(activeNeighbor.id, plot.id))
                  }
                  className={`aspect-[1.06/1] rounded-[18px] border-2 flex flex-col items-center justify-center relative transition-transform active:scale-92 cursor-pointer ${
                    isReady
                      ? 'bg-[#FFF3BF] border-[#D4A64F] shadow-[0_4px_10px_rgba(226,174,72,0.25)]'
                      : plot.crop
                      ? 'bg-[#EAD2BA] border-[#C9A686]'
                      : 'bg-[#F5E4D3] border-[#D6B89C]'
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-2 h-1 rounded-full bg-[#CFAF95]/50"
                  />

                  {!plot.crop && (
                    <span className="text-[12px] font-extrabold text-[#A6826E]">
                      Empty
                    </span>
                  )}

                  {plot.crop && !isReady && (
                    <>
                      <span className="text-[19px] leading-none">
                        {progress > 0.5 ? '🪴' : '🌱'}
                      </span>
                      <span className="mt-1 bg-[#FFFDF9]/90 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-[#4B3C46] tabular-nums">
                        {plot.watered ? '✓ ' : '💧 '}
                        {Math.max(
                          1,
                          Math.ceil((effectiveMs - elapsed) / 1000)
                        )}
                        s
                      </span>
                    </>
                  )}

                  {plot.crop && isReady && (
                    <span className="text-[24px] leading-none animate-bounce">
                      {meta?.icon}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast + Linked Garden Notice */}
        <div className="min-h-[26px] flex items-center justify-center pb-1">
          {toast ? (
            <div className="bg-[#FFFDF9] border-2 border-[#D9C3B4] rounded-full px-3 py-0.5 text-[11.5px] font-extrabold text-[#4B3C46] shadow-sm animate-bounce">
              {toast}
            </div>
          ) : (
            <button
              type="button"
              onClick={onSelectNeighborGarden}
              className="bg-[#FFFDF9]/90 border border-[#DFCBBF] rounded-full px-3 py-0.5 text-[11px] font-bold text-[#7B6670] hover:text-[#4B3C46] cursor-pointer"
            >
              Visiting {activeNeighbor.ownerName}’s Garden 🏡
            </button>
          )}
        </div>
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
          <div className="w-full flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onOpenModal('neighborMarket')}
              className="buttercup-cta rounded-full px-4 h-[38px] font-display text-[13px] font-extrabold text-[#4B3C46] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Store className="w-4 h-4 stroke-[2.4]" />
              <span>
                {activeNeighbor.ownerName}’s Stall ({availableStallCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => showToast(onGiftNeighbor(activeNeighbor.id))}
              className="cream-btn rounded-full px-3.5 h-[38px] font-display text-[12.5px] font-extrabold text-[#4B3C46] bg-[#FFF3F8] flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{activeNeighbor.gifted ? 'Gifted ✓' : 'Gift +25'}</span>
            </button>
          </div>
        }
      />
    </div>
  );
};
