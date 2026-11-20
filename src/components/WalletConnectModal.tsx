import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { WalletState } from '../types';
import {
  AVALANCHE_FUJI_CHAIN_ID,
  shortenAddress,
} from '../services/pawsApi';

interface WalletConnectModalProps {
  open: boolean;
  wallet: WalletState;
  onClose: () => void;
  onConnectCore: (useDemoFallback: boolean) => Promise<void>;
  onSwitchFuji: () => Promise<void>;
  onVerifyAuth: () => Promise<void>;
  onDisconnect: () => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  open,
  wallet,
  onClose,
  onConnectCore,
  onSwitchFuji,
  onVerifyAuth,
  onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    if (!wallet.address) return;
    navigator.clipboard?.writeText(wallet.address).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="Core Wallet Connection"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[360px] max-h-[86%] flex flex-col overflow-hidden"
      >
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>
        <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FFE9EB] border border-[#F5B8C0] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#C64353]" />
            </div>
            <h3 className="font-display text-[15.5px] font-extrabold text-[#4B3C46]">
              Core Wallet · Avalanche Fuji
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wallet dialog"
            className="w-9 h-9 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-3.5 overflow-y-auto space-y-3 bg-[#FFFDF9]">
          {wallet.error && (
            <div className="bg-[#FFEAF0] border border-[#E6B8C5] rounded-2xl px-3 py-2 text-[11.5px] font-bold text-[#9B3B52]">
              {wallet.error}
            </div>
          )}

          {!wallet.connected ? (
            <div className="space-y-2.5">
              <div className="bg-[#FFF7EC] border border-[#EFE0D4] rounded-2xl p-3 text-[12px] font-medium text-[#6C5863] leading-relaxed">
                Connect your <strong className="text-[#4B3C46]">Core Wallet</strong> on{' '}
                <strong className="text-[#4B3C46]">Avalanche Fuji Testnet</strong> to sign ownership and mint immutable ERC-721 Pet Passports.
              </div>

              <button
                type="button"
                disabled={wallet.connecting}
                onClick={() => onConnectCore(false)}
                className="buttercup-cta w-full rounded-full py-2.5 px-4 font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {wallet.connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span>Connect Core Wallet</span>
              </button>

              <button
                type="button"
                disabled={wallet.connecting}
                onClick={() => onConnectCore(true)}
                className="cream-btn w-full rounded-full py-2 px-4 font-display text-[12.5px] font-extrabold text-[#4B3C46] bg-[#EFF8FF] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>Use Preview Wallet (Fuji 43113)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="bg-[#F6FBF7] border border-[#CFEBD5] rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#5E8268]">
                    {wallet.providerLabel}
                  </span>
                  <span
                    className={`text-[11px] font-extrabold ${
                      wallet.isAvalancheFuji ? 'text-[#3F7B52]' : 'text-[#B6536D]'
                    }`}
                  >
                    {wallet.isAvalancheFuji
                      ? `Fuji Testnet (${AVALANCHE_FUJI_CHAIN_ID})`
                      : `Chain ${wallet.chainId} (Wrong Network)`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-[#FFFDF9] border border-[#DFCBBF] rounded-xl px-2.5 py-2">
                  <span className="font-mono text-[12.5px] font-bold text-[#4B3C46] tabular-nums">
                    {shortenAddress(wallet.address)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] font-extrabold text-[#8A747E] hover:text-[#4B3C46] flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3F7B52]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11.5px] font-bold text-[#4B3C46]">
                  <span className="flex items-center gap-1">
                    <ShieldCheck
                      className={`w-3.5 h-3.5 ${
                        wallet.authVerified ? 'text-[#3F7B52]' : 'text-[#8A747E]'
                      }`}
                    />
                    <span>
                      {wallet.authVerified
                        ? 'Address Authenticated'
                        : 'Signature Needed'}
                    </span>
                  </span>
                  <a
                    href="https://core.app/tools/testnet-faucet/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4F7EA6] hover:underline flex items-center gap-0.5"
                  >
                    <span>Fuji Faucet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {!wallet.isAvalancheFuji && (
                <button
                  type="button"
                  disabled={wallet.connecting}
                  onClick={onSwitchFuji}
                  className="buttercup-cta w-full rounded-full py-2 px-4 font-display text-[13px] font-extrabold text-[#4B3C46] cursor-pointer"
                >
                  Switch to Avalanche Fuji (43113)
                </button>
              )}

              {!wallet.authVerified && (
                <button
                  type="button"
                  disabled={wallet.connecting}
                  onClick={onVerifyAuth}
                  className="buttercup-cta w-full rounded-full py-2 px-4 font-display text-[13px] font-extrabold text-[#4B3C46] cursor-pointer"
                >
                  Sign Address Auth Challenge
                </button>
              )}

              <button
                type="button"
                onClick={onDisconnect}
                className="cream-btn w-full rounded-full py-2 px-4 font-display text-[12.5px] font-extrabold text-[#8A747E] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
