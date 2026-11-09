'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Trees, Landmark, Flower2, Coffee, Wallet, CheckCircle2 } from 'lucide-react';

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
    { href: '/memory', label: 'Vườn Ký Ức', icon: Flower2 },
    { href: '/stations', label: 'Trạm Tre', icon: Coffee },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-emerald-900/40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-bamboo-500 to-amber-400 p-[2px] shadow-lg shadow-emerald-900/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">🎋</span>
            </div>
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide flex items-center gap-1.5 text-emerald-300 group-hover:text-emerald-200 transition">
              MĂNG NON
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                UniHack 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Avalanche L1 &amp; C-Chain</p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 shadow-inner'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet & Network Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Avalanche Fuji
          </div>

          <button
            onClick={toggleWallet}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
              walletConnected
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-900/40'
            }`}
          >
            <Wallet className="w-4 h-4" />
            {walletConnected ? (
              <div className="flex items-center gap-2">
                <span>{walletAddress}</span>
                <span className="text-emerald-400 font-semibold">({balance})</span>
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
