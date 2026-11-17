import React, { useState } from 'react';
import { Camera, Check, Share2, Sparkles } from 'lucide-react';
import { JudgeReport } from '../types';
import { CrystalMintIcon } from './HandDrawnAssets';
import { SanctuaryModalType } from './SanctuaryScreen';
import { SharedBottomDock, SharedTopHud } from './SharedHud';

interface JudgeCardScreenProps {
  coins: number;
  energy: number;
  maxEnergy: number;
  level: number;
  expPercent: number;
  readyFarmCount: number;
  luredCount: number;
  report: JudgeReport;
  isJudging: boolean;
  judgeError: string | null;
  onSelectYard: () => void;
  onSelectFarm: () => void;
  onOpenModal: (modal: SanctuaryModalType) => void;
  onQuickCoins: () => void;
  onQuickEnergy: () => void;
  onCropIntoSanctuary: () => void;
  onMintPet: () => void;
  onShareSnap: () => void;
  onUploadPhoto: (file: File) => void;
  onResetSample: () => void;
}

export const JudgeCardScreen: React.FC<JudgeCardScreenProps> = ({
  coins,
  energy,
  maxEnergy,
  level,
  expPercent,
  readyFarmCount,
  luredCount,
  report,
  isJudging,
  judgeError,
  onSelectYard,
  onSelectFarm,
  onOpenModal,
  onQuickCoins,
  onQuickEnergy,
  onCropIntoSanctuary,
  onMintPet,
  onShareSnap,
  onUploadPhoto,
  onResetSample,
}) => {
  const [sharedFeedback, setSharedFeedback] = useState(false);

  const handleShareClick = () => {
    onShareSnap();
    setSharedFeedback(true);
    window.setTimeout(() => setSharedFeedback(false), 1800);
  };

  return (
    <div className="relative w-full h-full pastel-scrapbook-bg flex flex-col justify-between overflow-hidden select-none">
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
          <div className="flex items-center justify-center gap-1.5">
            <div className="bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-full px-3 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.08)] flex items-center gap-1 text-[11.5px] font-extrabold text-[#4B3C46] whitespace-nowrap">
              <span>📸 {report.theme}</span>
              <span className="text-[#4EA866]">
                {report.themeMatch ? '✓' : '•'}
              </span>
            </div>

            <label
              className="bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-full px-2.5 py-0.5 shadow-[0_2px_8px_rgba(138,116,126,0.08)] flex items-center gap-1 text-[11.5px] font-extrabold text-[#4B3C46] cursor-pointer hover:bg-[#FFF5F8] active:scale-95 transition-transform whitespace-nowrap"
              title="Snap or upload a pet photo"
              aria-label="Upload pet photo"
            >
              <Camera className="w-3.5 h-3.5 text-[#C99D66]" />
              <span>Snap</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadPhoto(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        }
      />

      {/* 2. CENTER POLAROID + STICKER REPORT */}
      <main className="relative z-10 flex-1 min-h-0 px-3.5 py-1 flex flex-col items-center justify-evenly">
        {judgeError && (
          <div className="w-full bg-[#FFEAF0] border-2 border-[#E6B8C5] rounded-2xl px-3 py-1 text-[11px] font-bold text-[#4B3C46] flex items-center justify-between gap-2">
            <span className="truncate">{judgeError}</span>
            <button
              type="button"
              onClick={onResetSample}
              className="underline shrink-0 cursor-pointer"
            >
              Sample
            </button>
          </div>
        )}

        {/* Tilted Locket Polaroid */}
        <div className="relative w-full max-w-[min(226px,68%)] -rotate-1 bg-[#FFFDF9] border-2 border-[#DFCBBF] rounded-[24px] p-2.5 pb-3 shadow-[0_10px_24px_rgba(138,116,126,0.16)]">
          <div
            aria-hidden="true"
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#FFE3EC]/90 border border-[#EABCCB] rounded-md rotate-1 z-20"
          />

          <div className="relative aspect-square w-full rounded-[17px] overflow-hidden bg-[#FFF6FA]">
            <img
              src={report.photoUrl}
              alt={`${report.petName} snapshot`}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                isJudging ? 'opacity-55' : 'opacity-100'
              }`}
            />

            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 w-full h-full pointer-events-none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M100 32 C126 32 142 46 146 68 C154 78 152 94 140 100 C142 122 152 146 144 172 C136 184 118 186 100 186 C82 186 64 184 56 172 C48 146 58 122 60 100 C48 94 46 78 54 68 C58 46 74 32 100 32 Z"
                stroke="#FFFDF9"
                strokeWidth="4.5"
                strokeDasharray="7 7"
                strokeLinecap="round"
                opacity="0.92"
              />
              <path
                d="M100 32 C126 32 142 46 146 68 C154 78 152 94 140 100 C142 122 152 146 144 172 C136 184 118 186 100 186 C82 186 64 184 56 172 C48 146 58 122 60 100 C48 94 46 78 54 68 C58 46 74 32 100 32 Z"
                stroke="#C99D66"
                strokeWidth="2.2"
                strokeDasharray="7 7"
                strokeLinecap="round"
                className="animate-dash-march"
              />
            </svg>

            <div className="absolute top-2.5 left-2.5 bg-[#FFFDF9]/95 rounded-full w-6.5 h-6.5 flex items-center justify-center text-[12px] shadow-sm">
              ✂️
            </div>

            {isJudging && (
              <div className="absolute inset-0 bg-[#FFFDF9]/85 flex flex-col items-center justify-center gap-1.5">
                <Sparkles className="w-6 h-6 text-[#F5C34B] animate-spin" />
                <span className="font-display text-xs font-extrabold text-[#4B3C46]">
                  Judging...
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 px-1 flex items-center justify-between">
            <span className="font-display text-[14px] font-extrabold text-[#4B3C46]">
              {report.petName}
            </span>
            <span className="text-[11px] font-bold text-[#8A747E]">
              {report.species} · {report.pose}
            </span>
          </div>

          <div
            className="absolute -bottom-3.5 -right-3 rotate-[-8deg] w-[72px] h-[72px] rounded-full bg-[#FFE07D] border-[2.5px] border-[#C99D66] shadow-[inset_0_0_0_3px_#FFFDF9,0_6px_14px_rgba(201,157,102,0.28)] flex flex-col items-center justify-center text-center z-30"
            aria-label={`Score ${report.overallScore} out of 100`}
          >
            <span className="font-display text-[20px] font-extrabold text-[#4B3C46] leading-none tabular-nums">
              {report.overallScore}
            </span>
            <span className="font-display text-[8px] font-extrabold text-[#7B5D42] tracking-wide mt-0.5">
              {report.verdict}
            </span>
          </div>
        </div>

        {/* 1-Row Pastel Criteria Chips */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span className="bg-[#FFFDF9] border border-[#E5D7CE] rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#4B3C46] tabular-nums whitespace-nowrap">
            🔍 {report.sharp}
          </span>
          <span className="bg-[#FFF8DC] border border-[#EFE0A8] rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#4B3C46] tabular-nums whitespace-nowrap">
            ☀️ {report.light}
          </span>
          <span className="bg-[#E8F8EC] border border-[#C3E8CD] rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#4B3C46] whitespace-nowrap">
            🐾 {report.species}
          </span>
          <span className="bg-[#E6F4FF] border border-[#C2E1F7] rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[#4B3C46] tabular-nums whitespace-nowrap">
            🎯 {report.themeScore}
          </span>
        </div>

        {/* Rewards + Mint / Share */}
        <div className="w-full max-w-[290px] flex flex-col gap-1.5">
          <div className="text-center text-[11.5px] font-extrabold text-[#7B6670] whitespace-nowrap">
            +{report.coinsReward} 🪙 · +{report.expReward} EXP · 🛡️ 24h
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onMintPet}
              className="cream-btn rounded-full py-1.5 px-3 font-display text-[12px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap bg-[#F0F8FF]"
            >
              <CrystalMintIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{report.minted ? 'Minted ✓' : 'Mint'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareClick}
              className="cream-btn rounded-full py-1.5 px-3 font-display text-[12px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap bg-[#FFF3F8]"
            >
              <Share2 className="w-3.5 h-3.5 text-[#8A747E] shrink-0" />
              <span>{sharedFeedback ? 'Copied ✓' : 'Share'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* 3. SYNCED BOTTOM DOCK */}
      <SharedBottomDock
        activeTab="judge"
        readyFarmCount={readyFarmCount}
        luredCount={luredCount}
        onSelectYard={onSelectYard}
        onSelectFarm={onSelectFarm}
        onSelectVisit={() => onOpenModal('visit')}
        onSelectRescue={() => onOpenModal('rescue')}
        onSelectBag={() => onOpenModal('bag')}
        onSelectAlbum={() => onOpenModal('album')}
        primaryCta={
          <button
            type="button"
            onClick={onCropIntoSanctuary}
            disabled={isJudging}
            className="buttercup-cta rounded-full px-6 h-[38px] font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {report.cropped ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Added to Garden</span>
              </>
            ) : (
              <span>✂️ Add to Garden</span>
            )}
          </button>
        }
      />
    </div>
  );
};
