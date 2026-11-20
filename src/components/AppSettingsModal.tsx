import React, { useState } from 'react';
import {
  CalendarDays,
  Camera,
  Check,
  Home,
  RotateCcw,
  ShieldCheck,
  Sprout,
  Type,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from 'lucide-react';
import { playTapSound } from '../utils/appAudio';

interface AppSettingsModalProps {
  open: boolean;
  initialTab?: 'settings' | 'guide';
  keeperName: string;
  soundEnabled: boolean;
  showTextLabels: boolean;
  streakDays: number;
  hasCalendarBadge?: boolean;
  inGame: boolean;
  walletLabel: string;
  onClose: () => void;
  onChangeKeeperName: (name: string) => void;
  onToggleSound: () => void;
  onToggleShowTextLabels: () => void;
  onOpenCalendar: () => void;
  onOpenWallet: () => void;
  onReturnToTitle: () => void;
  onResetSave: () => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  open,
  initialTab = 'settings',
  keeperName,
  soundEnabled,
  showTextLabels,
  streakDays,
  hasCalendarBadge,
  inGame,
  walletLabel,
  onClose,
  onChangeKeeperName,
  onToggleSound,
  onToggleShowTextLabels,
  onOpenCalendar,
  onOpenWallet,
  onReturnToTitle,
  onResetSave,
}) => {
  const [tab, setTab] = useState<'settings' | 'guide'>(initialTab);
  const [draftName, setDraftName] = useState(keeperName);
  const [confirmReset, setConfirmReset] = useState(false);

  React.useEffect(() => {
    if (open) {
      setTab(initialTab);
      setDraftName(keeperName);
      setConfirmReset(false);
    }
  }, [open, initialTab, keeperName]);

  if (!open) return null;

  const handleSaveName = () => {
    const cleaned = draftName.trim().slice(0, 18) || 'Keeper';
    onChangeKeeperName(cleaned);
    playTapSound();
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#FFFDF9]/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="Game Settings and Guide"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[368px] max-h-[86%] flex flex-col overflow-hidden"
      >
        {/* Drag Handle Affordance */}
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-[#E5D3CA]" />
        </div>

        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <h3 className="font-display text-[16px] font-extrabold text-[#4B3C46]">
            {tab === 'guide' ? 'How to Play' : 'Settings & Home'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Clean Segmented Tabs */}
        <div className="px-3.5 pt-2.5 bg-[#FFFDF9]">
          <div className="grid grid-cols-2 gap-1 bg-[#F7F1EB] rounded-full p-1">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setTab('settings');
              }}
              className={`rounded-full min-h-[38px] font-display text-[12px] font-extrabold cursor-pointer transition-colors ${
                tab === 'settings'
                  ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                  : 'text-[#8A747E]'
              }`}
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setTab('guide');
              }}
              className={`rounded-full min-h-[38px] font-display text-[12px] font-extrabold cursor-pointer transition-colors ${
                tab === 'guide'
                  ? 'bg-[#FFFDF9] text-[#4B3C46] shadow-xs'
                  : 'text-[#8A747E]'
              }`}
            >
              How to Play
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-2.5 bg-[#FFFDF9]">
          {tab === 'settings' ? (
            <>
              {/* Quick Return to Home Screen when inside the game */}
              {inGame && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onClose();
                    onReturnToTitle();
                  }}
                  className="buttercup-cta w-full rounded-full min-h-[46px] px-4 font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4 stroke-[2.4]" />
                  <span>Return to Home Screen</span>
                </button>
              )}

              {/* Keeper Profile Name */}
              <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-3 space-y-2">
                <label
                  htmlFor="keeper-name-input"
                  className="block text-[12px] font-extrabold text-[#4B3C46]"
                >
                  Keeper Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="keeper-name-input"
                    type="text"
                    maxLength={18}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                    }}
                    className="flex-1 bg-[#FFFDF9] border border-[#D9C3B4] rounded-full px-3 min-h-[42px] text-[13px] font-bold text-[#4B3C46] focus:outline-none focus:border-[#C99D66]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    aria-label="Save Keeper Name"
                    className="buttercup-cta rounded-full w-10.5 h-10.5 flex items-center justify-center text-[#4B3C46] cursor-pointer shrink-0"
                  >
                    <Check className="w-4 h-4 stroke-[2.6]" />
                  </button>
                </div>
              </div>

              {/* Sound FX Toggle */}
              <div className="bg-[#F6FBF7] border border-[#CFEBD5] rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4.5 h-4.5 text-[#3F7B52]" />
                  ) : (
                    <VolumeX className="w-4.5 h-4.5 text-[#8A747E]" />
                  )}
                  <div>
                    <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                      Sound Effects
                    </div>
                    <div className="text-[11px] font-bold text-[#8A747E]">
                      Cozy chimes for pets &amp; harvests
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`rounded-full min-h-[40px] px-4 font-display text-[12px] font-extrabold cursor-pointer transition-colors ${
                    soundEnabled
                      ? 'bg-[#FFE07D] border border-[#C99D66] text-[#4B3C46]'
                      : 'bg-[#EFE7E0] border border-[#D9C3B4] text-[#8A747E]'
                  }`}
                >
                  {soundEnabled ? 'On' : 'Off'}
                </button>
              </div>

              {/* Show Button Text Toggle */}
              <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Type
                    className={`w-4.5 h-4.5 ${
                      showTextLabels ? 'text-[#C99D66]' : 'text-[#8A747E]'
                    }`}
                  />
                  <div>
                    <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                      Show Button Text
                    </div>
                    <div className="text-[11px] font-bold text-[#8A747E]">
                      {showTextLabels
                        ? 'Labels shown on buttons & dock'
                        : 'Clean icon-only UI mode'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleShowTextLabels}
                  className={`rounded-full min-h-[40px] px-4 font-display text-[12px] font-extrabold cursor-pointer transition-colors ${
                    showTextLabels
                      ? 'bg-[#FFE07D] border border-[#C99D66] text-[#4B3C46]'
                      : 'bg-[#EFE7E0] border border-[#D9C3B4] text-[#8A747E]'
                  }`}
                >
                  {showTextLabels ? 'On' : 'Off'}
                </button>
              </div>

              {/* Daily Login Streak Calendar Shortcut */}
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onClose();
                  onOpenCalendar();
                }}
                className="w-full bg-[#FFF8E6] border border-[#EED3A8] rounded-2xl p-3 min-h-[56px] flex items-center justify-between gap-2 text-left cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4.5 h-4.5 text-[#C9852B]" />
                  <div>
                    <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center gap-1.5">
                      <span>Daily Streak Calendar</span>
                      {hasCalendarBadge && (
                        <span className="w-2 h-2 rounded-full bg-[#FF85A1]" />
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-[#9C6C28] tabular-nums">
                      {streakDays}-day streak &amp; reward milestones
                    </div>
                  </div>
                </div>
                <span className="text-[11.5px] font-extrabold text-[#C9852B]">
                  View
                </span>
              </button>

              {/* Wallet Connection Shortcut */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWallet();
                }}
                className="w-full bg-[#EFF8FF] border border-[#C6E1F5] rounded-2xl p-3 min-h-[56px] flex items-center justify-between gap-2 text-left cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4.5 h-4.5 text-[#4F7EA6]" />
                  <div>
                    <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                      Core Wallet &amp; Network
                    </div>
                    <div className="text-[11px] font-bold text-[#4F7EA6] tabular-nums">
                      {walletLabel}
                    </div>
                  </div>
                </div>
                <span className="text-[11.5px] font-extrabold text-[#4F7EA6]">
                  Manage
                </span>
              </button>

              {/* Reset Action */}
              <div className="pt-0.5">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="w-full rounded-full min-h-[44px] px-4 font-display text-[12.5px] font-extrabold text-[#9B3B52] bg-[#FFF2F5] border border-[#F0CFD8] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Sanctuary Save</span>
                  </button>
                ) : (
                  <div className="bg-[#FFF2F5] border border-[#E6B8C5] rounded-2xl p-2.5 space-y-2 text-center">
                    <div className="text-[11.5px] font-extrabold text-[#9B3B52]">
                      Start a fresh sanctuary? Progress auto-saves.
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="cream-btn rounded-full min-h-[42px] text-[12px] font-extrabold text-[#4B3C46] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetSave();
                          setConfirmReset(false);
                          onClose();
                        }}
                        className="rounded-full min-h-[42px] bg-[#E05375] text-white text-[12px] font-extrabold cursor-pointer"
                      >
                        Confirm Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* HOW TO PLAY 3-STEP GUIDE */
            <div className="space-y-2.5">
              <div className="bg-[#FFF5F8] border border-[#F3D7E2] rounded-2xl p-3 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFE07D] border border-[#C99D66] flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4 text-[#4B3C46]" />
                </div>
                <div>
                  <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                    1. Snap &amp; Discover Pets
                  </div>
                  <p className="text-[11.5px] font-medium text-[#7B6670] leading-snug">
                    Upload a pet photo for AI judging, welcome new companions into your yard, and renew your Streak Fence.
                  </p>
                </div>
              </div>

              <div className="bg-[#F0FAF2] border border-[#CFEBD5] rounded-2xl p-3 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8F8CE] border border-[#BDD996] flex items-center justify-center shrink-0">
                  <Sprout className="w-4 h-4 text-[#4B3C46]" />
                </div>
                <div>
                  <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                    2. Farm, Visit &amp; Trade
                  </div>
                  <p className="text-[11.5px] font-medium text-[#7B6670] leading-snug">
                    Grow crops and fruit trees, set your own prices in the Roadside Market, and visit neighbors to water plants or trade.
                  </p>
                </div>
              </div>

              <div className="bg-[#EFF8FF] border border-[#C6E1F5] rounded-2xl p-3 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#DFF3FF] border border-[#B3D5E8] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#4F7EA6]" />
                </div>
                <div>
                  <div className="font-display text-[13.5px] font-extrabold text-[#4B3C46]">
                    3. Build Bond &amp; Mint Passports
                  </div>
                  <p className="text-[11.5px] font-medium text-[#7B6670] leading-snug">
                    Pet, feed, and play with pets to reach 80+ Bond XP, connect Core Wallet on Avalanche Fuji, and preserve their ERC-721 Passport.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="buttercup-cta w-full rounded-full py-2.5 font-display text-[13.5px] font-extrabold text-[#4B3C46] cursor-pointer"
              >
                Got It
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
