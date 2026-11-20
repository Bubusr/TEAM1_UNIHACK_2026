import React, { useMemo } from 'react';
import {
  CalendarDays,
  Check,
  Gift,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LightningEnergyIcon,
  PawCoinIcon,
} from './HandDrawnAssets';
import { FlameMiniIcon, ShieldMiniIcon } from './GameIcons';

export interface StreakMilestone {
  day: number;
  title: string;
  rewardLabel: string;
  coins: number;
  energy?: number;
  berrySeeds?: number;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    day: 3,
    title: 'Sunny Sprout',
    rewardLabel: '+150 Coins',
    coins: 150,
  },
  {
    day: 7,
    title: 'Cozy Keeper',
    rewardLabel: '+300 Coins & +10 Energy',
    coins: 300,
    energy: 10,
  },
  {
    day: 14,
    title: 'Berry Harvest',
    rewardLabel: '+600 Coins & 3 Berry Seeds',
    coins: 600,
    berrySeeds: 3,
  },
  {
    day: 30,
    title: 'Golden Sanctuary',
    rewardLabel: '+1,200 Coins & +20 Energy',
    coins: 1200,
    energy: 20,
  },
];

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface StreakCalendarModalProps {
  open: boolean;
  streakDays: number;
  fenceHours: number;
  checkedInToday: boolean;
  claimedMilestones: number[];
  onClose: () => void;
  onDailyCheckIn: () => void;
  onClaimMilestone: (milestone: StreakMilestone) => void;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const StreakCalendarModal: React.FC<StreakCalendarModalProps> = ({
  open,
  streakDays,
  fenceHours,
  checkedInToday,
  claimedMilestones,
  onClose,
  onDailyCheckIn,
  onClaimMilestone,
}) => {
  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    const monthName = now.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Compute which day-of-month numbers belong to the active login streak
    const streakEndDay = checkedInToday ? todayDate : todayDate - 1;
    const streakStartDay = streakEndDay - streakDays + 1;

    // Map upcoming milestone day-of-month positions in the current month
    const milestoneDayNumbers = new Map<number, number>();
    for (const ms of STREAK_MILESTONES) {
      const daysUntil = ms.day - streakDays;
      const targetDom = streakEndDay + daysUntil;
      if (targetDom >= 1 && targetDom <= daysInMonth) {
        milestoneDayNumbers.set(targetDom, ms.day);
      }
    }

    const cells: Array<{
      key: string;
      dayNum: number | null;
      isToday: boolean;
      inStreak: boolean;
      isStreakStart: boolean;
      isStreakEnd: boolean;
      milestoneDay?: number;
    }> = [];

    for (let i = 0; i < firstWeekday; i++) {
      cells.push({
        key: `empty-${i}`,
        dayNum: null,
        isToday: false,
        inStreak: false,
        isStreakStart: false,
        isStreakEnd: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const inStreak =
        streakDays > 0 && d >= Math.max(1, streakStartDay) && d <= streakEndDay;
      cells.push({
        key: `day-${d}`,
        dayNum: d,
        isToday: d === todayDate,
        inStreak,
        isStreakStart: inStreak && d === Math.max(1, streakStartDay),
        isStreakEnd: inStreak && d === streakEndDay,
        milestoneDay: milestoneDayNumbers.get(d),
      });
    }

    return { monthName, cells };
  }, [streakDays, checkedInToday]);

  if (!open) return null;

  const nextMilestone =
    STREAK_MILESTONES.find((m) => m.day > streakDays) ??
    STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const progressPercent = Math.min(
    100,
    Math.round((streakDays / nextMilestone.day) * 100)
  );

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/28 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="Daily Login Streak Calendar"
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
            <div className="w-8 h-8 rounded-xl bg-[#FFF3BF] border border-[#E5C97B] flex items-center justify-center">
              <CalendarDays className="w-4.5 h-4.5 text-[#C9852B] stroke-[2.3]" />
            </div>
            <div>
              <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46] leading-tight">
                Daily Streak
              </h3>
              <p className="text-[10.5px] font-bold text-[#8A747E] leading-tight">
                {calendarData.monthName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close calendar"
            className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto space-y-3 bg-[#FFFDF9]">
          {/* Active Streak Hero Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#FFF6D6] via-[#FFF2E4] to-[#FFEAF2] border-2 border-[#EED3A8] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border border-[#F0D5B2] flex items-center justify-center shadow-xs">
                  <FlameMiniIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-display text-[20px] font-extrabold text-[#4B3C46] leading-none tabular-nums">
                    {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-bold text-[#8A747E]">
                    <span className="inline-flex items-center gap-0.5">
                      <ShieldMiniIcon className="w-3.5 h-3.5" />
                      Fence {fenceHours}h
                    </span>
                    <span>·</span>
                    <span>Next: Day {nextMilestone.day}</span>
                  </div>
                </div>
              </div>

              {checkedInToday ? (
                <span className="rounded-full bg-[#E8F8EC] border border-[#B3DFBF] px-2.5 py-1 text-[11px] font-extrabold text-[#3B7A4A] inline-flex items-center gap-1 shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Today</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onDailyCheckIn}
                  className="buttercup-cta rounded-full px-3 min-h-[36px] text-[11.5px] font-extrabold text-[#4B3C46] inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Check In</span>
                </button>
              )}
            </div>

            {/* Progress bar to next milestone */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-[#FFFDF9]/90 border border-[#EED3A8] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF9DB8] to-[#FFCA5C] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Visual Monthly Streak Calendar */}
          <div className="rounded-2xl bg-[#FFF9F3] border border-[#EFE0D4] p-2.5 space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_LABELS.map((wd, idx) => (
                <span
                  key={`${wd}-${idx}`}
                  className="text-[10px] font-extrabold text-[#9A848E]"
                >
                  {wd}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarData.cells.map((cell) => {
                if (cell.dayNum === null) {
                  return <div key={cell.key} className="h-8" />;
                }

                const isMilestone = typeof cell.milestoneDay === 'number';
                const milestoneClaimed =
                  isMilestone &&
                  claimedMilestones.includes(cell.milestoneDay as number);

                return (
                  <div
                    key={cell.key}
                    title={
                      cell.isToday
                        ? `Today (Day ${streakDays} streak)`
                        : isMilestone
                        ? `Day ${cell.milestoneDay} Milestone`
                        : cell.inStreak
                        ? 'Streak day completed'
                        : `${calendarData.monthName.split(' ')[0]} ${cell.dayNum}`
                    }
                    className={`relative h-8 rounded-xl flex flex-col items-center justify-center text-[11px] font-extrabold tabular-nums transition-colors ${
                      cell.isToday
                        ? 'bg-[#FFE3EE] border-2 border-[#FF85A1] text-[#4B3C46] shadow-[0_2px_6px_rgba(255,133,161,0.25)]'
                        : cell.inStreak
                        ? 'bg-[#FFF3BF] border border-[#E2BE68] text-[#4B3C46]'
                        : isMilestone
                        ? 'bg-[#F3ECFF] border border-[#D4C3F2] text-[#5E4B80]'
                        : 'bg-[#FFFDF9] border border-[#F3E7DF] text-[#8E7A84]'
                    }`}
                  >
                    <span className="leading-none">{cell.dayNum}</span>

                    {/* Completed streak stamp or milestone gift pip */}
                    {cell.inStreak && !isMilestone && (
                      <span
                        aria-hidden="true"
                        className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#FF85A1]"
                      />
                    )}
                    {isMilestone && (
                      <span
                        aria-hidden="true"
                        className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-[#FFFDF9] flex items-center justify-center ${
                          milestoneClaimed
                            ? 'bg-[#8BD69D] text-[#FFFDF9]'
                            : cell.inStreak
                            ? 'bg-[#FFE07D] text-[#4B3C46]'
                            : 'bg-[#C9B3F2] text-[#FFFDF9]'
                        }`}
                      >
                        {milestoneClaimed ? (
                          <Check className="w-2 h-2 stroke-[3.5]" />
                        ) : (
                          <Gift className="w-2 h-2 stroke-[2.8]" />
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Compact Legend */}
            <div className="flex items-center justify-center gap-3 pt-1 text-[10px] font-bold text-[#8A747E]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FFF3BF] border border-[#E2BE68]" />
                Streak
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FFE3EE] border border-[#FF85A1]" />
                Today
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F3ECFF] border border-[#D4C3F2]" />
                Milestone
              </span>
            </div>
          </div>

          {/* Reward Milestones */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="font-display text-[13px] font-extrabold text-[#4B3C46]">
                Streak Milestones
              </span>
              <span className="text-[10.5px] font-bold text-[#8A747E] tabular-nums">
                {claimedMilestones.length}/{STREAK_MILESTONES.length} claimed
              </span>
            </div>

            <div className="space-y-1.5">
              {STREAK_MILESTONES.map((ms) => {
                const isClaimed = claimedMilestones.includes(ms.day);
                const isUnlocked = streakDays >= ms.day;
                const daysRemaining = Math.max(0, ms.day - streakDays);

                return (
                  <div
                    key={ms.day}
                    className={`rounded-2xl p-2.5 border flex items-center justify-between gap-2 ${
                      isUnlocked && !isClaimed
                        ? 'bg-[#FFF8DC] border-[#E5C97B]'
                        : isClaimed
                        ? 'bg-[#F2FBF4] border-[#CFEBD5]'
                        : 'bg-[#FFFDF9] border-[#EFE0D4]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex flex-col items-center justify-center shrink-0 font-display font-extrabold leading-none ${
                          isClaimed
                            ? 'bg-[#E8F8EC] border-[#B4E1BF] text-[#3B7A4A]'
                            : isUnlocked
                            ? 'bg-[#FFE07D] border-[#C99D66] text-[#4B3C46]'
                            : 'bg-[#FAF5F0] border-[#E5D7CE] text-[#8A747E]'
                        }`}
                      >
                        <span className="text-[8.5px] uppercase opacity-75">
                          Day
                        </span>
                        <span className="text-[13px] tabular-nums">
                          {ms.day}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="font-display text-[13px] font-extrabold text-[#4B3C46] truncate">
                          {ms.title}
                        </div>
                        <div className="text-[11px] font-bold text-[#8A747E] flex items-center gap-1 flex-wrap">
                          <PawCoinIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{ms.rewardLabel}</span>
                          {ms.energy && (
                            <LightningEnergyIcon className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isClaimed ? (
                      <span className="rounded-full px-2.5 py-1 bg-[#E8F8EC] border border-[#B4E1BF] text-[10.5px] font-extrabold text-[#3B7A4A] inline-flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Done</span>
                      </span>
                    ) : isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => onClaimMilestone(ms)}
                        className="buttercup-cta rounded-full px-3.5 min-h-[36px] text-[11.5px] font-extrabold text-[#4B3C46] cursor-pointer shrink-0"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="rounded-full px-2.5 py-1 bg-[#F7F1EB] border border-[#E8DAD0] text-[10.5px] font-extrabold text-[#8A747E] inline-flex items-center gap-1 shrink-0 tabular-nums">
                        <Lock className="w-3 h-3" />
                        <span>{daysRemaining}d</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
