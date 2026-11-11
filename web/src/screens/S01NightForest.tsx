'use client';

import React, { useState, useEffect } from 'react';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';

interface S01NightForestProps {
  onTapBamboo: () => void;
  isNightTime?: boolean;
}

export default function S01NightForest({ onTapBamboo, isNightTime = true }: S01NightForestProps) {
  const [showHint, setShowHint] = useState(false);

  const fireflies = React.useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        size: ((i * 7) % 4) + 2,
        top: ((i * 19 + 11) % 75) + 10,
        left: ((i * 29 + 7) % 85) + 5,
        opacity: 0.35 + ((i * 13) % 6) * 0.1,
        duration: 2.2 + (i % 4) * 0.7,
        delay: (i % 5) * 0.4,
      })),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleClickStalk = () => {
    SoundEngine.playBambooKnock();
    SoundEngine.playBlessingChime();
    onTapBamboo();
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] overflow-hidden flex flex-col justify-between items-center select-none">
      {/* Parallax Layer 1: Sky & Misty Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F191C] via-[#1B2A2F] to-[#0A1113] pointer-events-none" />

      {/* Volumetric light ray coming down from top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-[450px] bg-gradient-to-b from-warm-amber/15 via-warm-glow/5 to-transparent blur-3xl pointer-events-none" />

      {/* Parallax Layer 2: Distant Bamboo silhouettes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none" viewBox="0 0 390 844">
        <line x1="40" y1="0" x2="45" y2="844" stroke="#3E5C45" strokeWidth="12" />
        <line x1="120" y1="0" x2="115" y2="844" stroke="#3E5C45" strokeWidth="16" />
        <line x1="280" y1="0" x2="285" y2="844" stroke="#3E5C45" strokeWidth="14" />
        <line x1="350" y1="0" x2="340" y2="844" stroke="#3E5C45" strokeWidth="18" />
      </svg>

      {/* Floating Fireflies */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fireflies.map((f, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-warm-glow animate-pulse"
            style={{
              width: `${f.size}px`,
              height: `${f.size}px`,
              top: `${f.top}%`,
              left: `${f.left}%`,
              opacity: isNightTime ? f.opacity : f.opacity * 0.45,
              boxShadow: '0 0 10px #FFD166, 0 0 20px #F4A259',
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Top quiet spacer (Không logo, không menu theo Prompt §6 S01) */}
      <div className="pt-16 z-10" />

      {/* Center/Lower: Glowing Bamboo Stalk (The focal point of S01) */}
      <button
        type="button"
        aria-label="Chạm vào ống nứa phát sáng"
        className="relative z-20 flex flex-col items-center justify-center cursor-pointer group pb-10 bg-transparent border-0 focus:outline-none"
        onClick={handleClickStalk}
      >
        {/* Glow halo behind bamboo */}
        <div className="absolute w-44 h-72 rounded-full bg-warm-amber/25 blur-3xl animate-pulse -z-10 group-hover:bg-warm-amber/40 transition-all duration-700" />
        <div className="absolute w-28 h-48 rounded-full bg-warm-glow/30 blur-xl animate-ping opacity-25 -z-10" />

        {/* The Bamboo Stalk SVG */}
        <div className="relative transition-transform duration-500 transform group-hover:scale-105 active:scale-95">
          <svg width="110" height="230" viewBox="0 0 110 230" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bambooGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE18A" />
                <stop offset="50%" stopColor="#F4A259" />
                <stop offset="100%" stopColor="#E2843A" />
              </linearGradient>
              <filter id="outerGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Bamboo Trunk Segments */}
            {/* Top Node */}
            <path d="M28 25 C30 18, 80 18, 82 25 L80 85 C78 90, 32 90, 30 85 Z" fill="url(#bambooGlow)" filter="url(#outerGlow)" />
            <ellipse cx="55" cy="23" rx="27" ry="6" fill="#FFF3CD" />
            <line x1="30" y1="86" x2="80" y2="86" stroke="#B98B3E" strokeWidth="4" strokeLinecap="round" />

            {/* Middle Node (Brighter glow - where the living creature awaits) */}
            <path d="M30 88 C32 86, 78 86, 80 88 L84 155 C82 160, 28 160, 26 155 Z" fill="url(#bambooGlow)" filter="url(#outerGlow)" />
            <line x1="26" y1="156" x2="84" y2="156" stroke="#B98B3E" strokeWidth="4" strokeLinecap="round" />

            {/* Bottom Node */}
            <path d="M26 158 C28 156, 82 156, 84 158 L87 215 C85 220, 25 220, 23 215 Z" fill="url(#bambooGlow)" />

            {/* Vertical Golden Split/Seam of Light */}
            <line x1="55" y1="35" x2="55" y2="205" stroke="#FFFDF0" strokeWidth="3" strokeDasharray="6 3" className="animate-pulse" />

            {/* Bamboo leaf sprout */}
            <path d="M80 85 C95 75, 105 60, 108 45 C100 58, 85 75, 80 85 Z" fill="#6B8F71" opacity="0.9" />
            <path d="M30 155 C15 145, 5 130, 2 115 C10 128, 25 145, 30 155 Z" fill="#6B8F71" opacity="0.9" />
          </svg>
        </div>

        {/* Microcopy Under Stalk */}
        <div className="mt-6 text-center transition-opacity duration-1000 min-h-[48px] flex flex-col items-center">
          <p className="text-sm font-medium text-dongho-paper/90 drop-shadow">
            {content.s01_nightForest.hintTitle}
          </p>
          <p className={`text-xs text-warm-glow mt-1.5 transition-opacity duration-700 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
            {content.s01_nightForest.hintTap}
          </p>
        </div>
      </button>

      {/* Bottom Ground silhouette */}
      <div className="w-full relative z-10 pb-6 px-4 flex justify-center">
        <div className="w-48 h-1.5 rounded-full bg-forest-mid/30" />
      </div>
    </div>
  );
}

