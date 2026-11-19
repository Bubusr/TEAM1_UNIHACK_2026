import React, { useState, useEffect } from 'react';
import {
  isWalletInstalled,
  connectCoreWallet,
  ensureFujiChain,
  getWalletProvider,
} from '../lib/wallet';
import { BLOCKCHAIN_CONFIG } from '../contracts/config';

interface WalletButtonProps {
  account: `0x${string}` | null;
  chainId: number | null;
  onAccountChange: (account: `0x${string}` | null) => void;
  onChainChange: (chainId: number | null) => void;
}

export const WalletButton: React.FC<WalletButtonProps> = ({
  account,
  chainId,
  onAccountChange,
  onChainChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFuji = chainId === BLOCKCHAIN_CONFIG.chainId;

  useEffect(() => {
    const provider = getWalletProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        onAccountChange(accounts[0] as `0x${string}`);
      } else {
        onAccountChange(null);
      }
    };

    const handleChainChanged = (chainHex: string) => {
      const parsed = parseInt(chainHex, 16);
      onChainChange(parsed);
    };

    // Initial check if already connected
    provider
      .request({ method: 'eth_accounts' })
      .then((accs: string[]) => {
        if (accs && accs.length > 0) {
          onAccountChange(accs[0] as `0x${string}`);
        }
      })
      .catch(() => {});

    provider
      .request({ method: 'eth_chainId' })
      .then((c: string) => {
        onChainChange(parseInt(c, 16));
      })
      .catch(() => {});

    if (provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleConnect = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      if (!isWalletInstalled()) {
        window.open('https://core.app/', '_blank');
        throw new Error('Please install Core Wallet extension from core.app');
      }

      const acc = await connectCoreWallet();
      onAccountChange(acc);

      // Check / switch chain
      await ensureFujiChain();
      const provider = getWalletProvider();
      const currentChain = await provider.request({ method: 'eth_chainId' });
      onChainChange(parseInt(currentChain, 16));
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchChain = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await ensureFujiChain();
      onChainChange(BLOCKCHAIN_CONFIG.chainId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch chain');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleConnect}
          disabled={loading}
          className="cream-pill rounded-full px-2.5 py-1 flex items-center gap-1.5 min-h-[30px] border border-[#E8D4C8] bg-[#FFF5F8] text-[#E84142] font-display text-[11.5px] font-extrabold active:scale-95 transition-transform cursor-pointer shadow-sm hover:bg-[#FFEBF0]"
          title="Connect Core Wallet on Avalanche Fuji"
        >
          <span className="w-2 h-2 rounded-full bg-[#E84142] animate-pulse" />
          <span>{loading ? 'Connecting...' : 'Connect Ví'}</span>
        </button>

        {errorMsg && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#4B3C46] text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap max-w-[220px]">
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  if (!isFuji) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleSwitchChain}
          disabled={loading}
          className="cream-pill rounded-full px-2.5 py-1 flex items-center gap-1.5 min-h-[30px] border border-[#F3B775] bg-[#FFF8E7] text-[#D97706] font-display text-[11px] font-extrabold active:scale-95 transition-transform cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#D97706]" />
          <span>Switch Fuji</span>
        </button>
      </div>
    );
  }

  const shortAddress = `${account.slice(0, 5)}...${account.slice(-4)}`;

  return (
    <a
      href={`${BLOCKCHAIN_CONFIG.explorerUrl}/address/${account}`}
      target="_blank"
      rel="noreferrer"
      className="cream-pill rounded-full px-2.5 py-1 flex items-center gap-1.5 min-h-[30px] border border-[#CDEBD4] bg-[#F0FDF4] text-[#15803D] font-display text-[11px] font-extrabold active:scale-95 transition-transform cursor-pointer hover:bg-[#DCFCE7]"
      title={`Connected: ${account} (Click to open Explorer)`}
    >
      <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
      <span className="font-mono">{shortAddress}</span>
      <span className="text-[9px] bg-[#BBF7D0] px-1 py-0.5 rounded font-sans uppercase">Fuji</span>
    </a>
  );
};
