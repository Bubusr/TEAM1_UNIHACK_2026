'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trees, Landmark, Waves, Coffee, Wallet, Sparkles } from 'lucide-react';

/** Helper: truncate ethereum address */
function truncAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Navigation() {
  const pathname = usePathname();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Restore wallet connection on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    // Check if previously connected
    eth.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          fetchBalance(accounts[0]);
        }
      })
      .catch(() => {});

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletConnected(false);
        setWalletAddress('');
        setBalance('');
      } else {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        fetchBalance(accounts[0]);
      }
    };
    eth.on('accountsChanged', handleAccountsChanged);
    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const fetchBalance = async (address: string) => {
    try {
      const eth = (window as any).ethereum;
      if (!eth) return;
      const rawBal: string = await eth.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      // Convert hex wei to AVAX (18 decimals)
      const wei = BigInt(rawBal);
      const avax = Number(wei) / 1e18;
      setBalance(`${avax.toFixed(4)} AVAX`);
    } catch {
      setBalance('');
    }
  };

  const connectWallet = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      window.open('https://core.app/', '_blank');
      return;
    }
    setConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        fetchBalance(accounts[0]);
      }
    } catch {
      // User rejected or error
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    setWalletAddress('');
    setBalance('');
  }, []);

  const toggleWallet = () => {
    if (walletConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const navLinks = [
    { href: '/forest', label: 'Rừng Tre Cổ', icon: Trees },
    { href: '/village', label: 'Làng Phù Đổng', icon: Landmark },
    { href: '/memory', label: 'Suối Ký Ức', icon: Waves },
    { href: '/stations', label: 'Trạm Tre', icon: Coffee },
  ];

  return (
    <header className="sticky top-0 z-50 bg-forest-darker/90 backdrop-blur-md border-b border-bamboo-mid/30 text-dongho-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-bamboo-deep via-bamboo-mid to-warm-glow p-[1.5px] shadow-lg shadow-forest-abyss">
            <div className="w-full h-full bg-forest-abyss rounded-[10px] flex items-center justify-center">
              <span className="text-xl">🎋</span>
            </div>
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide flex items-center gap-2 text-warm-glow group-hover:text-warm-light transition">
              <span>MĂNG NON</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-deep border border-bamboo-soft/40 text-bamboo-light">
                Avalanche L1 &amp; C-Chain
              </span>
            </div>
            <p className="text-[11px] text-bamboo-light/70 italic">Vùng đất giữa ký ức và cổ tích</p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-bamboo-deep/70 text-warm-glow border border-warm-amber/40 shadow-inner'
                    : 'text-dongho-paper/80 hover:text-warm-glow hover:bg-forest-deep/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-warm-glow' : 'text-bamboo-light/70'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet & Avalanche Fuji Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dongho-crimson/20 border border-dongho-red/40 text-dongho-paper text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-dongho-red animate-pulse"></span>
            Avalanche Fuji
          </div>

          <button
            onClick={toggleWallet}
            disabled={connecting}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
              walletConnected
                ? 'bg-forest-deep border-bamboo-soft/50 text-warm-glow'
                : 'bg-warm-amber hover:bg-warm-glow border-warm-amber text-forest-abyss font-bold shadow-md shadow-warm-amber/20'
            } ${connecting ? 'opacity-60 cursor-wait' : ''}`}
          >
            <Wallet className="w-4 h-4" />
            {connecting ? (
              'Đang kết nối...'
            ) : walletConnected ? (
              <div className="flex items-center gap-1.5">
                <span>{truncAddr(walletAddress)}</span>
                {balance && <span className="text-warm-light font-semibold">({balance})</span>}
              </div>
            ) : (
              'Kết nối ví Core'
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
