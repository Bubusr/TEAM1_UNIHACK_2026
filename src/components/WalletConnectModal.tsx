import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Wallet,
  X,
} from 'lucide-react';
import {
  KeeperAuthUser,
  WalletInfo,
  WalletState,
  Web3ConfigStatus,
} from '../types';
import { formatEvmChainName } from '../lib/walletClient';
import { MINT_ELIGIBILITY_RULES } from '../shared/gameMeta';

interface WalletConnectModalProps {
  open: boolean;
  onClose: () => void;
  authUser?: KeeperAuthUser | null;
  linkedWallet?: WalletInfo | null;
  browserWallet?: {
    available: boolean;
    address: string | null;
    chainId: number | null;
    providerName: string;
    isCoreWallet: boolean;
  };
  web3Status?: Web3ConfigStatus | null;
  profileBusy?: string | null;
  profileFeedback?: { type: 'ok' | 'err'; text: string } | null;
  onSignInGoogle?: () => void;
  onConnectAndVerifyWallet?: (useDemoFallback?: boolean) => Promise<void>;
  onSwitchToFuji?: () => Promise<void>;
  onUnlinkWallet?: () => Promise<void>;
  // Backwards compatibility props
  wallet?: WalletState;
  onConnectCore?: (useDemoFallback: boolean) => Promise<void>;
  onSwitchFuji?: () => Promise<void>;
  onVerifyAuth?: () => Promise<void>;
  onDisconnect?: () => void;
}

function shortAddr(addr: string | null | undefined): string {
  if (!addr) return 'Unlinked';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  open,
  onClose,
  authUser,
  linkedWallet,
  browserWallet: propBrowserWallet,
  web3Status,
  profileBusy,
  profileFeedback,
  onSignInGoogle,
  onConnectAndVerifyWallet,
  onSwitchToFuji,
  onUnlinkWallet,
  wallet,
  onConnectCore,
  onSwitchFuji,
  onDisconnect,
}) => {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedLinked, setCopiedLinked] = useState(false);

  if (!open) return null;

  // Resolve values supporting both new rich props and backwards compatibility
  const effectiveBrowserWallet = propBrowserWallet ?? {
    available: Boolean(wallet?.connected || wallet?.address),
    address: wallet?.address ?? null,
    chainId: wallet?.chainId ?? null,
    providerName: wallet?.providerLabel ?? 'No Wallet Detected',
    isCoreWallet: wallet?.providerLabel === 'Core Wallet',
  };

  const effectiveLinkedWallet =
    linkedWallet ??
    (wallet?.authVerified && wallet.address
      ? {
          address: wallet.address,
          chainId: wallet.chainId ?? 43113,
          linkedAt: '',
          authType: 'eip191' as const,
        }
      : null);

  const isFuji =
    effectiveBrowserWallet.chainId === MINT_ELIGIBILITY_RULES.FUJI_CHAIN_ID;
  const isWrongNetwork =
    effectiveBrowserWallet.available &&
    effectiveBrowserWallet.chainId !== null &&
    !isFuji;
  const isBusy = Boolean(
    profileBusy === 'wallet' || profileBusy === 'switch' || wallet?.connecting
  );

  const handleCopyAccount = () => {
    if (!effectiveBrowserWallet.address) return;
    navigator.clipboard
      ?.writeText(effectiveBrowserWallet.address)
      .catch(() => {});
    setCopiedAccount(true);
    window.setTimeout(() => setCopiedAccount(false), 1500);
  };

  const handleCopyLinked = () => {
    if (!effectiveLinkedWallet?.address) return;
    navigator.clipboard?.writeText(effectiveLinkedWallet.address).catch(() => {});
    setCopiedLinked(true);
    window.setTimeout(() => setCopiedLinked(false), 1500);
  };

  const handleConnect = async (useDemo: boolean) => {
    if (onConnectAndVerifyWallet) {
      await onConnectAndVerifyWallet(useDemo);
    } else if (onConnectCore) {
      await onConnectCore(useDemo);
    }
  };

  const handleSwitchNetwork = async () => {
    if (onSwitchToFuji) {
      await onSwitchToFuji();
    } else if (onSwitchFuji) {
      await onSwitchFuji();
    }
  };

  const handleUnlink = async () => {
    if (onUnlinkWallet) {
      await onUnlinkWallet();
    } else if (onDisconnect) {
      onDisconnect();
    }
  };

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-50 bg-[#4B3C46]/25 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 pb-7 sm:pb-3"
      role="dialog"
      aria-modal="true"
      aria-label="Avalanche Fuji Wallet"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cream-card w-full max-w-[390px] max-h-[88%] flex flex-col overflow-hidden"
      >
        <div className="pt-2 pb-0.5 flex justify-center bg-[#FFFDF9] sm:hidden">
          <span className="w-10 h-1 rounded-full bg-[#E5D3CA]" />
        </div>

        {/* Modal Top Header */}
        <div className="px-4 py-2.5 border-b border-[#F2E6DC] flex items-center justify-between bg-[#FFFDF9]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#F0F7FF] border border-[#D4E7FA] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#4B7DA6]" />
            </div>
            <h3 className="font-display text-[15px] font-extrabold text-[#4B3C46]">
              Avalanche Fuji Wallet
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wallet dialog"
            className="w-8.5 h-8.5 rounded-full bg-[#FFF5F8] border border-[#E5D3CA] flex items-center justify-center text-[#4B3C46] active:scale-90 transition-transform cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 bg-[#FFFDF9]">
          {/* Status Badge & Explanatory Lead */}
          <div className="bg-[#F2F8FF] border border-[#D4E7FA] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-[13px] font-extrabold text-[#4B3C46] flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#4B7DA6]" />
                <span>Web3 Keeper Wallet</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  effectiveLinkedWallet
                    ? 'bg-[#E8F8EC] text-[#356845]'
                    : 'bg-[#FFFDF9] text-[#8A747E] border border-[#E5D7CE]'
                }`}
              >
                {effectiveLinkedWallet ? 'Verified ✓' : 'Optional'}
              </span>
            </div>

            <p className="text-[11px] font-bold text-[#6E6068] leading-snug">
              All Sanctuary &amp; Farm gameplay works without a wallet. Connect
              Core Extension (recommended) or Demo Wallet with a signed nonce
              only when minting an immutable Pet Passport.
            </p>

            {/* Google Sync Requirement Warning if guest */}
            {!authUser && onSignInGoogle && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="w-full cream-btn rounded-full py-2 px-3 text-[12px] font-extrabold text-[#4B3C46] bg-white border border-[#E0E0E0] shadow-xs cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-[#F8F9FA] active:scale-98 transition-transform"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google First</span>
                </button>
              </div>
            )}

            {/* Information Card: Provider, Account, Linked, Network */}
            <div className="bg-[#FFFDF9] border border-[#D4E7FA] rounded-xl p-2.5 text-[11px] font-bold text-[#4B3C46] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#8A747E]">Detected Provider:</span>
                <span
                  className={
                    effectiveBrowserWallet.isCoreWallet
                      ? 'text-[#356845] font-extrabold'
                      : !effectiveBrowserWallet.available
                      ? 'text-[#B54B65] font-extrabold'
                      : 'text-[#4B3C46] font-extrabold'
                  }
                >
                  {effectiveBrowserWallet.available
                    ? effectiveBrowserWallet.isCoreWallet
                      ? 'Core Extension ✓'
                      : effectiveBrowserWallet.providerName
                    : 'No Extension Detected'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8A747E]">Selected Account:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold tabular-nums">
                    {effectiveBrowserWallet.address
                      ? shortAddr(effectiveBrowserWallet.address)
                      : 'None Selected'}
                  </span>
                  {effectiveBrowserWallet.address && (
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      title="Copy account address"
                      className="text-[#8A747E] hover:text-[#4B3C46] cursor-pointer"
                    >
                      {copiedAccount ? (
                        <Check className="w-3 h-3 text-[#356845]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8A747E]">Linked Wallet:</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-extrabold tabular-nums ${
                      effectiveLinkedWallet?.address
                        ? 'text-[#356845]'
                        : 'text-[#8A747E]'
                    }`}
                  >
                    {shortAddr(effectiveLinkedWallet?.address)}
                  </span>
                  {effectiveLinkedWallet?.address && (
                    <button
                      type="button"
                      onClick={handleCopyLinked}
                      title="Copy linked address"
                      className="text-[#8A747E] hover:text-[#4B3C46] cursor-pointer"
                    >
                      {copiedLinked ? (
                        <Check className="w-3 h-3 text-[#356845]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[#8A747E] shrink-0">
                  Browser Network:
                </span>
                <span
                  className={
                    !effectiveBrowserWallet.available
                      ? 'text-[#B54B65] font-extrabold text-right'
                      : isFuji
                      ? 'text-[#356845] font-extrabold text-right'
                      : 'text-[#B2772D] font-extrabold text-right'
                  }
                >
                  {!effectiveBrowserWallet.available
                    ? 'No Extension Detected'
                    : isFuji
                    ? 'Avalanche Fuji Testnet (43113) ✓'
                    : effectiveBrowserWallet.chainId
                    ? formatEvmChainName(effectiveBrowserWallet.chainId)
                    : 'Not Connected'}
                </span>
              </div>
            </div>

            {/* Network Switch Button */}
            {isWrongNetwork && (
              <button
                type="button"
                disabled={isBusy}
                onClick={handleSwitchNetwork}
                className="buttercup-cta w-full rounded-full py-2 text-[12px] font-extrabold text-[#4B3C46] cursor-pointer disabled:opacity-60"
              >
                {profileBusy === 'switch'
                  ? 'Switching Network...'
                  : 'Switch to Avalanche Fuji (43113)'}
              </button>
            )}

            {/* Action Buttons Row */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleConnect(false)}
                  className="buttercup-cta flex-1 rounded-full py-2 px-3 text-[12px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 whitespace-nowrap"
                >
                  {profileBusy === 'wallet' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Awaiting Signature...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      <span>
                        {effectiveLinkedWallet
                          ? 'Re-Verify Wallet'
                          : 'Connect & Sign Nonce'}
                      </span>
                    </>
                  )}
                </button>

                {(effectiveLinkedWallet || effectiveBrowserWallet.address) && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleUnlink}
                    className="cream-btn rounded-full py-2 px-3.5 text-[12px] font-extrabold text-[#7D3A4F] cursor-pointer hover:bg-[#FFEBF0] transition-colors"
                  >
                    Unlink
                  </button>
                )}
              </div>

              {/* Demo Wallet Fallback if no extension */}
              {!effectiveBrowserWallet.available && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleConnect(true)}
                  className="cream-btn w-full rounded-full py-2 px-3 text-[11.5px] font-extrabold text-[#4F7EA6] bg-[#EFF8FF] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Use Preview / Demo Wallet (Fuji 43113)</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback & Error Banner */}
          {(profileFeedback || wallet?.error) && (
            <div
              className={`rounded-2xl p-2.5 text-[11.5px] font-bold border leading-snug flex items-center gap-2 ${
                profileFeedback?.type === 'ok'
                  ? 'bg-[#E8F8EC] border-[#CFEBD5] text-[#2F6B43]'
                  : 'bg-[#FFF0F0] border-[#FBD2D2] text-[#B83232]'
              }`}
            >
              {profileFeedback?.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3F7B52]" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#B83232]" />
              )}
              <span className="truncate">
                {profileFeedback?.text || wallet?.error}
              </span>
            </div>
          )}

          {/* Honest Web3 Contract & Minting Configuration Box */}
          <div className="bg-[#FFF9F2] border border-[#EFE0D4] rounded-2xl p-2.5 space-y-1.5 text-[11px] font-bold text-[#5E4C56]">
            <div className="font-display text-[12.5px] font-extrabold text-[#4B3C46] flex items-center justify-between">
              <span>Fuji Contract Status</span>
              <span
                className={
                  web3Status?.readyForMint
                    ? 'text-[#356845]'
                    : 'text-[#B2772D]'
                }
              >
                {web3Status?.readyForMint ? 'Ready ✓' : 'Config Needed'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8A747E]">Passport Contract:</span>
              <span className="font-mono">
                {web3Status?.contractAddress
                  ? shortAddr(web3Status.contractAddress)
                  : 'Not Set'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8A747E]">Metadata Storage:</span>
              <span>
                {web3Status?.metadataProvider === 'pinata'
                  ? web3Status.ipfsConfigured
                    ? 'Pinata IPFS ✓'
                    : 'Pinata (API Key Missing)'
                  : 'Server Passport JSON'}
              </span>
            </div>

            <div className="pt-1 flex items-center justify-between border-t border-[#F2E6DC]">
              <span className="text-[#8A747E]">Fuji Testnet Faucet:</span>
              <a
                href="https://core.app/tools/testnet-faucet/"
                target="_blank"
                rel="noreferrer"
                className="text-[#4F7EA6] hover:underline flex items-center gap-1 text-[10.5px]"
              >
                <span>core.app Faucet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
