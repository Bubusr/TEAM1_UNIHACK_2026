import React, { createContext, useContext } from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Home,
  Plus,
  Settings,
  ShoppingBag,
  Sprout,
  Users,
} from 'lucide-react';
import { LightningEnergyIcon, PawCoinIcon } from './HandDrawnAssets';
import { PET_IMAGES } from '../assets/petImages';
import {
  TIME_OF_DAY_PALETTES,
  TimeOfDayPalette,
  TimeOfDayTheme,
  getTimeOfDayTheme,
} from '../utils/timeOfDay';

export type ScreenTab = 'sanctuary' | 'farm' | 'visit' | 'judge' | 'gallery';
export type SkyTheme = TimeOfDayTheme;

const UiLabelsContext = createContext<boolean>(false);

export const UiLabelsProvider = UiLabelsContext.Provider;

export function useShowTextLabels(): boolean {
  return useContext(UiLabelsContext);
}

const SkyThemeContext = createContext<TimeOfDayTheme>(getTimeOfDayTheme());

export const SkyThemeProvider = SkyThemeContext.Provider;

export function useSkyTheme(): {
  skyTheme: TimeOfDayTheme;
  palette: TimeOfDayPalette;
} {
  const skyTheme = useContext(SkyThemeContext);
  return {
    skyTheme,
    palette: TIME_OF_DAY_PALETTES[skyTheme],
  };
}

interface DailyMissionsHudValue {
  onOpenMissions?: () => void;
  hasMissionsBadge?: boolean;
}

const DailyMissionsHudContext = createContext<DailyMissionsHudValue>({});

export const DailyMissionsHudProvider = DailyMissionsHudContext.Provider;

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
  onOpenCalendar?: () => void;
  hasCalendarBadge?: boolean;
  onOpenSettings?: () => void;
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
  onOpenCalendar,
  hasCalendarBadge,
  onOpenSettings,
}) => {
  const { onOpenMissions, hasMissionsBadge } = useContext(
    DailyMissionsHudContext
  );

  return (
    <header className="relative z-30 px-2.5 pt-2.5 flex flex-col gap-1.5 shrink-0">
      <div className="flex items-center justify-between gap-1.5">
        {/* Left: Squircle Avatar + Level */}
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`Keeper level ${level}`}
          className="cream-pill rounded-[18px] px-1.5 py-1 flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          <div className="w-7.5 h-7.5 rounded-[11px] border-2 border-[#D9C3B4] bg-[#FFF5F8] overflow-hidden shrink-0">
            <img
              src={PET_IMAGES.croppedCalicoCat}
              alt="Calico cat avatar"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col items-start pr-0.5">
            <span className="font-display text-[12.5px] font-extrabold leading-none text-[#4B3C46] whitespace-nowrap">
              Lv.{level}
            </span>
            <div className="mt-1 w-9 h-1.5 rounded-full bg-[#F3EAE2] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFE07D] transition-all duration-300"
                style={{ width: `${Math.min(100, expPercent)}%` }}
              />
            </div>
          </div>
        </button>

        {/* Right: Coins + Energy/Water + Top-Right Settings */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative flex items-center">
            <PawCoinIcon className="w-6 h-6 relative z-10 -mr-2" />
            <div className="cream-pill rounded-full pl-3 pr-1 py-0.5 flex items-center gap-1 min-h-[32px]">
              <span className="font-display text-[12px] font-extrabold text-[#4B3C46] tabular-nums whitespace-nowrap">
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
              <LightningEnergyIcon className="w-6 h-6 relative z-10 -mr-2" />
              <button
                type="button"
                onClick={onQuickEnergy}
                aria-label="Refill Energy"
                className="cream-pill rounded-full pl-3 pr-2 py-0.5 flex items-center gap-1 min-h-[32px] active:scale-95 transition-transform cursor-pointer"
              >
                <span className="font-display text-[12px] font-extrabold text-[#4B3C46] tabular-nums whitespace-nowrap">
                  {energy}/{maxEnergy}
                </span>
              </button>
            </div>
          )}

          {onOpenMissions && (
            <button
              type="button"
              onClick={onOpenMissions}
              aria-label="Open Daily Missions"
              title="Daily Missions"
              className="cream-pill relative rounded-full w-8.5 h-8.5 flex items-center justify-center bg-[#EAF9EE] text-[#3F7B52] active:scale-90 transition-transform cursor-pointer shrink-0"
            >
              <ClipboardCheck className="w-4 h-4 stroke-[2.4]" />
              {hasMissionsBadge && (
                <span
                  aria-label="Mission reward ready"
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF85A1] border-[1.5px] border-[#FFFDF9]"
                />
              )}
            </button>
          )}

          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              aria-label="Open Daily Login Streak Calendar"
              title="Daily Streak Calendar"
              className="cream-pill relative rounded-full w-8.5 h-8.5 flex items-center justify-center bg-[#FFF8E6] text-[#C9852B] active:scale-90 transition-transform cursor-pointer shrink-0"
            >
              <CalendarDays className="w-4 h-4 stroke-[2.4]" />
              {hasCalendarBadge && (
                <span
                  aria-label="Reward ready"
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF85A1] border-[1.5px] border-[#FFFDF9]"
                />
              )}
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings and Return Home"
              title="Settings & Home Screen"
              className="cream-pill rounded-full w-8.5 h-8.5 flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer shrink-0"
            >
              <Settings className="w-4 h-4 stroke-[2.4]" />
            </button>
          )}
        </div>
      </div>

      {/* Synced Sub-Pill Row */}
      {subRow && (
        <div className="flex items-center justify-center gap-1.5 min-h-[26px]">
          {subRow}
        </div>
      )}
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
  onSelectBag,
  onSelectAlbum,
}) => {
  const showLabels = useShowTextLabels();

  return (
    <footer className="relative z-30 px-3 pb-5 sm:pb-4 pt-1 flex flex-col items-center gap-2.5 shrink-0">
      {/* Unified Primary CTA Slot (Elevated in natural one-hand thumb arc) */}
      <div className="w-full flex items-center justify-center">{primaryCta}</div>

      {/* Clean 5-Button Pastel Squircle Dock */}
      <nav
        aria-label="Main navigation"
        className="w-full grid grid-cols-5 gap-1.5 pt-1"
      >
        <button
          type="button"
          onClick={onSelectYard}
          aria-label="Yard"
          title="Yard"
          className={`cream-squircle relative min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'sanctuary' ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]' : ''
          }`}
        >
          <div
            className={`${
              showLabels ? '-mt-3 w-7.5 h-7.5' : 'w-9.5 h-9.5'
            } rounded-xl bg-[#D8F7D6] border-2 border-[#B3CFAF] flex items-center justify-center transition-all`}
          >
            <Home
              className={`${
                showLabels ? 'w-3.5 h-3.5' : 'w-5 h-5'
              } text-[#4B3C46] stroke-[2.4]`}
            />
          </div>
          {showLabels && (
            <span className="mt-0.5 font-display text-[10.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
              Yard
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onSelectFarm}
          aria-label="Farm"
          title="Farm"
          className={`cream-squircle relative min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'farm' ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]' : ''
          }`}
        >
          {readyFarmCount > 0 && (
            <span className="absolute -top-1.5 -right-0.5 z-20 w-4.5 h-4.5 rounded-full bg-[#FFE07D] border border-[#FFFDF9] text-[#4B3C46] font-display text-[9.5px] font-extrabold flex items-center justify-center">
              {readyFarmCount}
            </span>
          )}
          <div
            className={`${
              showLabels ? '-mt-3 w-7.5 h-7.5' : 'w-9.5 h-9.5'
            } rounded-xl bg-[#E8F8CE] border-2 border-[#BDD996] flex items-center justify-center transition-all`}
          >
            <Sprout
              className={`${
                showLabels ? 'w-3.5 h-3.5' : 'w-5 h-5'
              } text-[#4B3C46] stroke-[2.4]`}
            />
          </div>
          {showLabels && (
            <span className="mt-0.5 font-display text-[10.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
              Farm
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onSelectVisit}
          aria-label="Visit Neighbors"
          title="Visit"
          className={`cream-squircle relative min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'visit' ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]' : ''
          }`}
        >
          <div
            className={`${
              showLabels ? '-mt-3 w-7.5 h-7.5' : 'w-9.5 h-9.5'
            } rounded-xl bg-[#F3ECFF] border-2 border-[#CFC0EB] flex items-center justify-center transition-all`}
          >
            <Users
              className={`${
                showLabels ? 'w-3.5 h-3.5' : 'w-5 h-5'
              } text-[#4B3C46] stroke-[2.4]`}
            />
          </div>
          {showLabels && (
            <span className="mt-0.5 font-display text-[10.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
              Visit
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onSelectBag}
          aria-label="Bag"
          title="Bag"
          className="cream-squircle relative min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          {luredCount > 0 && (
            <span
              aria-label="New lured pet"
              className="absolute -top-1.5 -right-0.5 z-20 w-4.5 h-4.5 rounded-full bg-[#FF85A1] border border-[#FFFDF9] text-[#FFFDF9] font-display text-[9.5px] font-extrabold flex items-center justify-center"
            >
              !
            </span>
          )}
          <div
            className={`${
              showLabels ? '-mt-3 w-7.5 h-7.5' : 'w-9.5 h-9.5'
            } rounded-xl bg-[#FFE2EE] border-2 border-[#E2BACB] flex items-center justify-center transition-all`}
          >
            <ShoppingBag
              className={`${
                showLabels ? 'w-3.5 h-3.5' : 'w-5 h-5'
              } text-[#4B3C46] stroke-[2.4]`}
            />
          </div>
          {showLabels && (
            <span className="mt-0.5 font-display text-[10.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
              Bag
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onSelectAlbum}
          aria-label="Album"
          title="Album"
          className={`cream-squircle relative min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center active:scale-95 transition-transform cursor-pointer ${
            activeTab === 'judge' || activeTab === 'gallery'
              ? 'ring-2 ring-[#C99D66] bg-[#FFFDF2]'
              : ''
          }`}
        >
          <div
            className={`${
              showLabels ? '-mt-3 w-7.5 h-7.5' : 'w-9.5 h-9.5'
            } rounded-xl bg-[#DFF3FF] border-2 border-[#B3D5E8] flex items-center justify-center transition-all`}
          >
            <BookOpen
              className={`${
                showLabels ? 'w-3.5 h-3.5' : 'w-5 h-5'
              } text-[#4B3C46] stroke-[2.4]`}
            />
          </div>
          {showLabels && (
            <span className="mt-0.5 font-display text-[10.5px] font-extrabold text-[#4B3C46] leading-tight whitespace-nowrap">
              Album
            </span>
          )}
        </button>
      </nav>
    </footer>
  );
};
