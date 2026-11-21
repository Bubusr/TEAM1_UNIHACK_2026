import React, { useEffect } from 'react';
import { Gift, Sparkles, X } from 'lucide-react';
import { PawCoinIcon } from './HandDrawnAssets';
import { playVictorySound } from '../utils/appAudio';

export interface NewKeeperWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  avaxGranted?: string;
  coinsGranted?: number;
  sponsor?: string;
  txHash?: string | null;
}

export const NewKeeperWelcomeModal: React.FC<NewKeeperWelcomeModalProps> = ({
  open,
  onClose,
  avaxGranted = '0.001 AVAX',
  coinsGranted = 100,
  sponsor = 'UniHack Campus Fund',
  txHash,
}) => {
  useEffect(() => {
    if (open) {
      try {
        playVictorySound();
      } catch {
        // audio might be disabled
      }
    }
  }, [open]);

  if (!open) return null;

  const isRealTx = Boolean(
    txHash && txHash.startsWith('0x') && !txHash.includes('simulated')
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[316px] overflow-hidden flex flex-col bg-[#FFFDF9] border-2 border-[#EAD9C9] rounded-2xl shadow-xl p-3.5 space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#F2E6DC]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3D6] border border-[#F2DCA2] flex items-center justify-center text-[#B45309]">
              <Gift className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-display text-[14px] font-extrabold text-[#4B3C46] leading-none">
                New Keeper Pack
              </h3>
              <span className="text-[10px] text-[#8C7A6B] font-medium flex items-center gap-0.5 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-[#D97706]" />
                Welcome Gift
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2 Compact Reward Tiles */}
        <div className="grid grid-cols-2 gap-2">
          {/* AVAX Fuji Gas */}
          <div className="bg-[#F2FBF4] border border-[#CFEBD5] rounded-xl p-2.5 flex flex-col items-center text-center space-y-0.5">
            <span className="text-lg leading-none">⛽</span>
            <div className="font-display font-extrabold text-[#236341] text-[13px] leading-tight">
              +{avaxGranted}
            </div>
            <div className="text-[9px] text-[#4A8062] font-semibold">
              Free Mint Gas
            </div>
          </div>

          {/* Paw Coins */}
          <div className="bg-[#FFF8DC] border border-[#E5C97B] rounded-xl p-2.5 flex flex-col items-center text-center space-y-0.5">
            <div className="w-5 h-5 flex items-center justify-center">
              <PawCoinIcon className="w-5 h-5" />
            </div>
            <div className="font-display font-extrabold text-[#7A5B18] text-[13px] leading-tight">
              +{coinsGranted} Coins
            </div>
            <div className="text-[9px] text-[#8C6D2B] font-semibold">
              Pet Food & Care
            </div>
          </div>
        </div>

        {/* Sponsor footer info */}
        <div className="bg-[#FFF8F0] border border-[#F3E5D6] rounded-xl px-2.5 py-1.5 text-center space-y-0.5">
          <p className="text-[9.5px] text-[#7A6458] leading-tight">
            ☕ Sponsored by <span className="font-bold text-[#5A3F2E]">{sponsor}</span>
          </p>
          {isRealTx && (
            <a
              href={`https://testnet.snowtrace.io/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-[8.5px] text-[#B45309] font-bold underline hover:opacity-80 block"
            >
              Verified on Snowtrace ↗
            </a>
          )}
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={onClose}
          className="buttercup-cta w-full py-2 rounded-full font-display text-[12.5px] font-extrabold text-[#4B3C46] shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
        >
          Awesome! 🐾
        </button>
      </div>
    </div>
  );
};
