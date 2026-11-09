'use client';

import React, { useState, useEffect } from 'react';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';

interface S02OpenBambooProps {
  onComplete: () => void;
}

export default function S02OpenBamboo({ onComplete }: S02OpenBambooProps) {
  const [phase, setPhase] = useState<'shake' | 'crack' | 'open' | 'particles' | 'burst'>('shake');
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Sound FX
    SoundEngine.playBambooKnock();

    const tSkip = setTimeout(() => setCanSkip(true), 1500);

    const tCrack = setTimeout(() => {
      setPhase('crack');
      SoundEngine.playWindChime();
    }, 800);

    const tOpen = setTimeout(() => {
      setPhase('open');
      SoundEngine.playBlessingChime();
    }, 1600);

    const tParticles = setTimeout(() => {
      setPhase('particles');
    }, 3200);

    const tBurst = setTimeout(() => {
      setPhase('burst');
    }, 5000);

    const tEnd = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearTimeout(tSkip);
      clearTimeout(tCrack);
      clearTimeout(tOpen);
      clearTimeout(tParticles);
      clearTimeout(tBurst);
      clearTimeout(tEnd);
    };
  }, [onComplete]);

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Skip button appears after 1.5s */}
      {canSkip && (
        <button
          onClick={onComplete}
          className="absolute top-12 right-6 z-50 text-xs px-3 py-1.5 rounded-full bg-forest-deep/80 border border-warm-amber/30 text-dongho-paper/80 hover:text-warm-glow hover:border-warm-amber transition"
        >
          {content.s02_openBamboo.skip}
        </button>
      )}

      {/* Screen White/Gold Burst overlay in final phase */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-[#FFF5DC] via-[#FFE18A] to-[#F4A259] z-40 transition-opacity duration-1000 pointer-events-none ${
          phase === 'burst' ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {/* Full screen ambient warm glow */}
      <div
        className={`absolute inset-0 bg-warm-amber/20 blur-3xl transition-opacity duration-1000 pointer-events-none ${
          phase !== 'shake' ? 'opacity-100' : 'opacity-30'
        }`}
      />

      {/* Centered Bamboo Transformation Animation */}
      <div
        className={`relative flex flex-col items-center justify-center transition-transform duration-1000 ${
          phase === 'open' || phase === 'particles' ? 'scale-110' : 'scale-100'
        } ${phase === 'shake' ? 'animate-bounce' : ''}`}
      >
        {/* Particle Cloud (≤ 120 particles) */}
        {(phase === 'particles' || phase === 'burst') && (
          <div className="absolute inset-0 w-80 h-80 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none z-30">
            {[...Array(60)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#FFFDF0]"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(${(Math.random() - 0.5) * 240}px, ${(Math.random() - 0.5) * 240}px) scale(${Math.random() * 1.5 + 0.5})`,
                  boxShadow: '0 0 12px #FFD166, 0 0 24px #F4A259',
                  transition: 'all 2s cubic-bezier(.22, 1, .36, 1)',
                  opacity: Math.random() * 0.9 + 0.1,
                }}
              />
            ))}
          </div>
        )}

        {/* Silhouette of emerging creature */}
        {(phase === 'particles' || phase === 'burst') && (
          <div className="absolute z-20 flex flex-col items-center animate-pulse transition-opacity duration-1000">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FFD166] to-[#FFF8E7] blur-md shadow-[0_0_50px_#FFD166]" />
            <div className="w-16 h-20 -mt-10 rounded-t-full bg-[#FFE18A]/90 blur-sm" />
          </div>
        )}

        {/* Splitting Bamboo Halves */}
        <div className="relative w-44 h-72 flex items-center justify-center">
          {/* Left Half of Stalk */}
          <div
            className={`transition-all duration-1000 transform ${
              phase === 'open' || phase === 'particles' || phase === 'burst'
                ? '-translate-x-12 rotate-[-8deg] opacity-60'
                : 'translate-x-0 rotate-0'
            }`}
          >
            <svg width="45" height="180" viewBox="0 0 45 180" fill="none">
              <path d="M45 0 C25 5, 10 20, 5 45 L5 135 C10 160, 25 175, 45 180 Z" fill="#F4A259" />
              <path d="M45 0 C30 5, 20 20, 15 45 L15 135 C20 160, 30 175, 45 180 Z" fill="#FFE18A" opacity="0.6" />
            </svg>
          </div>

          {/* Golden Center Bursting Light Beam */}
          <div
            className={`w-12 h-64 bg-gradient-to-b from-[#FFFDF0] via-[#FFD166] to-transparent rounded-full blur-md transition-all duration-700 ${
              phase === 'crack' ? 'scale-y-100 opacity-80' : phase === 'open' || phase === 'particles' ? 'scale-y-125 scale-x-150 opacity-100' : 'scale-y-0 opacity-0'
            }`}
          />

          {/* Right Half of Stalk */}
          <div
            className={`transition-all duration-1000 transform ${
              phase === 'open' || phase === 'particles' || phase === 'burst'
                ? 'translate-x-12 rotate-[8deg] opacity-60'
                : 'translate-x-0 rotate-0'
            }`}
          >
            <svg width="45" height="180" viewBox="0 0 45 180" fill="none">
              <path d="M0 0 C20 5, 35 20, 40 45 L40 135 C35 160, 20 175, 0 180 Z" fill="#F4A259" />
              <path d="M0 0 C15 5, 25 20, 30 45 L30 135 C25 160, 15 175, 0 180 Z" fill="#FFE18A" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Microcopy */}
        <div className="mt-8 text-center px-4">
          <p className="text-sm font-semibold text-warm-glow">
            {content.s02_openBamboo.title}
          </p>
          <p className="text-xs text-dongho-paper/70 mt-1">
            {content.s02_openBamboo.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

