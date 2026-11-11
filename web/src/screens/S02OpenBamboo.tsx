'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface S02OpenBambooProps {
  onComplete: () => void;
  allowSkip?: boolean; // Từ lần thứ 2 trở đi mới có nút Bỏ qua (Prompt §6 S02)
  reducedMotion?: boolean;
}

export default function S02OpenBamboo({
  onComplete,
  allowSkip = false,
  reducedMotion: settingReducedMotion = false,
}: S02OpenBambooProps) {
  const isReducedMotion = useReducedMotion(settingReducedMotion);
  const [phase, setPhase] = useState<'shake' | 'crack' | 'open' | 'particles' | 'burst'>('shake');
  const [canSkip, setCanSkip] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const angle = (i * 137.5 * Math.PI) / 180;
        const radius = 30 + ((i * 23) % 105);
        return {
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
          scale: 0.6 + (i % 5) * 0.25,
          opacity: 0.3 + (i % 7) * 0.1,
        };
      }),
    []
  );

  useEffect(() => {
    SoundEngine.playBambooKnock();

    if (isReducedMotion) {
      // Giảm chuyển động: crossfade ánh sáng 1.2s, không hạt (Prompt §6 S02)
      setPhase('burst');
      const tEnd = setTimeout(onComplete, 1200);
      return () => clearTimeout(tEnd);
    }

    const tSkip = allowSkip ? setTimeout(() => setCanSkip(true), 1500) : null;
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
      if (tSkip) clearTimeout(tSkip);
      clearTimeout(tCrack);
      clearTimeout(tOpen);
      clearTimeout(tParticles);
      clearTimeout(tBurst);
      clearTimeout(tEnd);
    };
  }, [onComplete, allowSkip, isReducedMotion]);

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] overflow-hidden flex flex-col items-center justify-center select-none">
      {/* Nút Bỏ qua chỉ hiện từ Măng Non thứ 2 trở đi */}
      {allowSkip && canSkip && (
        <button
          onClick={onComplete}
          aria-label="Bỏ qua hoạt ảnh mở ống nứa"
          className="absolute top-12 right-6 z-50 text-xs px-3 py-1.5 rounded-full bg-forest-deep/80 border border-warm-amber/30 text-dongho-paper/80 hover:text-warm-glow hover:border-warm-amber transition"
        >
          {content.s02_openBamboo.skip}
        </button>
      )}

      {/* Lớp ánh sáng lan toả chuyển sang S03 */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-[#FFF5DC] via-[#FFE18A] to-[#F4A259] z-40 transition-opacity duration-1000 pointer-events-none ${
          phase === 'burst' ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {/* Ánh sáng ấm nền */}
      <div
        className={`absolute inset-0 bg-warm-amber/20 blur-3xl transition-opacity duration-1000 pointer-events-none ${
          phase !== 'shake' ? 'opacity-100' : 'opacity-30'
        }`}
      />

      {/* Ống nứa tách đôi & hạt sáng */}
      <div
        className={`relative flex flex-col items-center justify-center transition-transform duration-1000 ${
          !isReducedMotion && (phase === 'open' || phase === 'particles') ? 'scale-110' : 'scale-100'
        } ${!isReducedMotion && phase === 'shake' ? 'animate-bounce' : ''}`}
      >
        {/* Đám mây hạt sáng (≤ 60 hạt, tắt khi Reduced Motion) */}
        {!isReducedMotion && (phase === 'particles' || phase === 'burst') && (
          <div className="absolute inset-0 w-80 h-80 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 pointer-events-none z-30">
            {particles.map((p, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#FFFDF0]"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(${p.x}px, ${p.y}px) scale(${p.scale})`,
                  boxShadow: '0 0 12px #FFD166, 0 0 24px #F4A259',
                  transition: 'all 2s cubic-bezier(.22, 1, .36, 1)',
                  opacity: p.opacity,
                }}
              />
            ))}
          </div>
        )}

        {/* Hình bóng sinh linh nhỏ chớm hiện */}
        {(phase === 'particles' || phase === 'burst') && (
          <div className="absolute z-20 flex flex-col items-center transition-opacity duration-1000">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FFD166] to-[#FFF8E7] blur-md shadow-[0_0_50px_#FFD166]" />
            <div className="w-16 h-20 -mt-10 rounded-t-full bg-[#FFE18A]/90 blur-sm" />
          </div>
        )}

        {/* Hai nửa thân nứa tách ra */}
        <div className="relative w-44 h-72 flex items-center justify-center">
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

          <div
            className={`w-12 h-64 bg-gradient-to-b from-[#FFFDF0] via-[#FFD166] to-transparent rounded-full blur-md transition-all duration-700 ${
              phase === 'crack'
                ? 'scale-y-100 opacity-80'
                : phase === 'open' || phase === 'particles'
                ? 'scale-y-125 scale-x-150 opacity-100'
                : 'scale-y-0 opacity-0'
            }`}
          />

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
