import React from 'react';
import {
  BookOpen,
  Home,
  Plus,
  Search,
  ShoppingBag,
  Sprout,
  Users,
} from 'lucide-react';
import { LightningEnergyIcon, PawCoinIcon } from './HandDrawnAssets';

export type ScreenTab = 'sanctuary' | 'farm' | 'visit' | 'judge';

interface TopHudProps {
  level: number;
  expPercent: number;
  coins: number;
  energy: number;
  maxEnergy: number;
  rightBadge?: React.ReactNode;
  subRow: React.ReactNode;
  onOpenProfile: () => void;
  onQuickCoins: () => void;
  onQuickEnergy: () => void;
}

export const SharedTopHud: React.FC<TopHudProps> = ({
  level,
  expPercent,
  coins,
  energy,
  maxEnergy,
  rightBadge,
  subRow,
  onOpenProfile,
  onQuickCoins,
  onQuickEnergy,
}) => {
  return (
    <header className="relative z-30 px-3 pt-2.5 flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Squircle Avatar + Level */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`Keeper level ${level}`}
          className="cream-pill rounded-[18px] px-2 py-1 flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          <div className="w-8 h-8 rounded-[12px] border-2 border-[#D9C3B4] bg-[#FFF5F8] overflow-hidden shrink-0">
            <img
              src="/src/assets/images/cropped_calico_cat_1794637541476.jpg"
              alt="Calico cat avatar"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col items-start pr-0.5">
            <span className="font-display text-[13px] font-extrabold leading-none text-[#4B3C46] whitespace-nowrap">
              Lv.{level}
            </span>
            <div className="mt-1 w-10 h-1.5 rounded-full bg-[#F3EAE2] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFE07D] transition-all duration-300"
                style={{ width: `${Math.min(100, expPercent)}%` }}
              />
            </div>
          </div>
        </button>

        {/* Right: Coins + Energy / Contextual Badge */}
        <div className="flex items-center gap-1.5 pl-1">
          <div className="relative flex items-center">
            <PawCoinIcon className="w-6.5 h-6.5 relative z-10 -mr-2.5" />
            <div className="cream-pill rounded-full pl-3.5 pr-1 py-0.5 flex items-center gap-1 min-h-[32px]">
              <span className="font-display text-[13px] font-extrabold text-[#4B3C46] tabular-nums whitespace-nowrap">
                {coins.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={onQuickCoins}
                aria-label="Open Shop"
                className="w-4.5 h-4.5 rounded-full bg-[#FFE07D] border-[1.6px] border-[#C99D66] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </button>
            </div>
          </div>

          {rightBadge ?? (
            <div className="relative flex items-center">
              <LightningEnergyIcon className="w-6.5 h-6.5 relative z-10 -mr-2" />
              <button
                type="button"
                onClick={onQuickEnergy}
                aria-label="Refill Energy"
                className="cream-pill rounded-full pl-3 pr-2 py-0.5 flex items-center gap-1 min-h-[32px] active:scale-95 transition-transform cursor-pointer"
              >
                <span className="font-display text-[13px] font-extrabold text-[#4B3C46] tabular-nums whitespace-nowrap">
                  {energy}/{maxEnergy}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Synced Sub-Pill Row */}
      <div className="flex items-center justify-center gap-1.5 min-h-[26px]">
        {subRow}
      </div>
    </header>
  );
};

interface SharedBottomDockProps {
  activeTab: ScreenTab;
  readyFarmCount: number;
  luredCount: number;
  primaryCta: React.ReactNode;
  onSelectYard: () => void;
  onSelectFarm: () => void;
  onSelectVisit: () => void;
  onSelectRescue: () => void;
  onSelectBag: () => void;
  onSelectAlbum: () => void;
}

export const SharedBottomDock: React.FC<SharedBottomDockProps> = ({
  activeTab,
  readyFarmCount,
  luredCount,
  primaryCta,
  onSelectYard,
  onSelectFarm,
  onSelectVisit,
  onSelectRescue,
  onSelectBag,
  onSelectAlbum,
}) => {
  return (
    <footer className="relative z-30 px-2.5 pb-2.5 pt-1 flex flex-col items-center gap-2 shrink-0">
      {/* Unified Primary CTA Slot */}
      <div className="w-full flex items-center justify-center">{primaryCta}</div>

      {/* Synced 6-Button Pastel Squircle Dock Across Every Screen */}
      <nav
        aria-label="Main navigation"
        className="w-full grid grid-cols-6 gap-1 pt-1"
      >
        <button
          type="button"
          onClick={onSelectYard}
          className={`cream-squircle relative pt-1.5 pb-1 px-0.5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'sanctuary' ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]' : ''
          }`}
        >
          <div className="-mt-3 w-7 h-7 rounded-xl bg-[#D8F7D6] border-2 border-[#B3CFAF] flex items-center justify-center">
            <Home className="w-3.5 h-3.5 text-[#4B3C46] stroke-[2.4]" />
          </div>
          <span className="mt-0.5 font-display text-[9.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
            Yard
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectFarm}
          className={`cream-squircle relative pt-1.5 pb-1 px-0.5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'farm' ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]' : ''
          }`}
        >
          {readyFarmCount > 0 && (
            <span className="absolute -top-1.5 -right-0.5 z-20 w-4 h-4 rounded-full bg-[#FFE07D] border border-[#FFFDF9] text-[#4B3C46] font-display text-[9.5px] font-extrabold flex items-center justify-center">
              {readyFarmCount}
            </span>
          )}
          <div className="-mt-3 w-7 h-7 rounded-xl bg-[#E8F8CE] border-2 border-[#BDD996] flex items-center justify-center">
            <Sprout className="w-3.5 h-3.5 text-[#4B3C46] stroke-[2.4]" />
          </div>
          <span className="mt-0.5 font-display text-[9.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
            Farm
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectVisit}
          className={`cream-squircle relative pt-1.5 pb-1 px-0.5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'visit' ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]' : ''
          }`}
        >
          <div className="-mt-3 w-7 h-7 rounded-xl bg-[#F3ECFF] border-2 border-[#CFC0EB] flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-[#4B3C46] stroke-[2.4]" />
          </div>
          <span className="mt-0.5 font-display text-[9.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
            Visit
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectRescue}
          className="cream-squircle relative pt-1.5 pb-1 px-0.5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          {luredCount > 0 && (
            <span
              aria-label="New lured pet"
              className="absolute -top-1.5 -right-0.5 z-20 w-4 h-4 rounded-full bg-[#FF85A1] border border-[#FFFDF9] text-[#FFFDF9] font-display text-[9.5px] font-extrabold flex items-center justify-center"
            >
              !
            </span>
          )}
          <div className="-mt-3 w-7 h-7 rounded-xl bg-[#FFE9CC] border-2 border-[#E2C2A1] flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-[#4B3C46] stroke-[2.4]" />
          </div>
          <span className="mt-0.5 font-display text-[9.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
            Rescue
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectBag}
          className="cream-squircle relative pt-1.5 pb-1 px-0.5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <div className="-mt-3 w-7 h-7 rounded-xl bg-[#FFE2EE] border-2 border-[#E2BACB] flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-[#4B3C46] stroke-[2.4]" />
          </div>
          <span className="mt-0.5 font-display text-[9.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
            Bag
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectAlbum}
          className={`cream-squircle relative pt-1.5 pb-1 px-0.5 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'judge' ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]' : ''
          }`}
        >
          <div className="-mt-3 w-7 h-7 rounded-xl bg-[#DFF3FF] border-2 border-[#B3D5E8] flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-[#4B3C46] stroke-[2.4]" />
          </div>
          <span className="mt-0.5 font-display text-[9.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
            Album
          </span>
        </button>
      </nav>
    </footer>
  );
};
