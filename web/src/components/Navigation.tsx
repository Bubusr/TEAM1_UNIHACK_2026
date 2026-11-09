'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trees, Landmark, Waves, Coffee, Wallet, Sparkles } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('0x71C...3Fa9');
  const [balance, setBalance] = useState('2.45 AVAX');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mangnon_wallet_connected');
      if (saved === 'true') {
        setWalletConnected(true);
      }
    }
  }, []);

  const toggleWallet = () => {
    if (!walletConnected) {
      setWalletConnected(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mangnon_wallet_connected', 'true');
      }
    } else {
      setWalletConnected(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mangnon_wallet_connected', 'false');
      }
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
              walletConnected
                ? 'bg-forest-deep border-bamboo-soft/50 text-warm-glow'
                : 'bg-warm-amber hover:bg-warm-glow border-warm-amber text-forest-abyss font-bold shadow-md shadow-warm-amber/20'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {walletConnected ? (
              <div className="flex items-center gap-1.5">
                <span>{walletAddress}</span>
                <span className="text-warm-light font-semibold">({balance})</span>
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
