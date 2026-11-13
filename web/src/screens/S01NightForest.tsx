'use client';

import React, { useState, useEffect } from 'react';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { Sparkles } from 'lucide-react';

interface S01NightForestProps {
  onTapBamboo: () => void;
  isNightTime?: boolean;
}

export default function S01NightForest({ onTapBamboo }: S01NightForestProps) {
  const [showHint, setShowHint] = useState(false);

  // Flat 2D Fireflies (Zero 3D Blur)
  const fireflies = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        size: ((i * 7) % 5) + 4,
        top: ((i * 19 + 11) % 65) + 12,
        left: ((i * 29 + 7) % 80) + 10,
        delay: (i % 4) * 0.3,
      })),
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClickStalk = () => {
    SoundEngine.playBambooKnock();
    SoundEngine.playBlessingChime();
    onTapBamboo();
  };

  return (
    <div className="relative w-full h-full bg-[#222E30] overflow-hidden flex flex-col justify-between items-center select-none p-5">
      {/* Eerie Vintage Forest Background (Zero 3D Gradients or Blur) */}
      <div className="absolute inset-0 bg-[#222E30] pointer-events-none" />

      {/* 2D Cutout Bamboo silhouettes in background (Flat paper cutouts) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" preserveAspectRatio="none" viewBox="0 0 390 844">
        {/* Bamboo silhouettes with thick dark ink borders */}
        <line x1="45" y1="0" x2="45" y2="844" stroke="#26292B" strokeWidth="18" />
        <line x1="45" y1="0" x2="45" y2="844" stroke="#5A6544" strokeWidth="14" />
        <line x1="125" y1="0" x2="125" y2="844" stroke="#26292B" strokeWidth="22" />
        <line x1="125" y1="0" x2="125" y2="844" stroke="#5A6544" strokeWidth="18" />
        <line x1="295" y1="0" x2="295" y2="844" stroke="#26292B" strokeWidth="20" />
        <line x1="295" y1="0" x2="295" y2="844" stroke="#5A6544" strokeWidth="16" />
        <line x1="355" y1="0" x2="355" y2="844" stroke="#26292B" strokeWidth="24" />
        <line x1="355" y1="0" x2="355" y2="844" stroke="#5A6544" strokeWidth="20" />
      </svg>

      {/* Flat 2D Stepped Fireflies (Muted Ochre) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fireflies.map((f, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#CFA85B] border border-[#26292B] animate-firefly"
            style={{
              width: `${f.size}px`,
              height: `${f.size}px`,
              top: `${f.top}%`,
              left: `${f.left}%`,
              boxShadow: '2px 2px 0px #191B1D',
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Top Header Card (Warm Cream Dó Paper) */}
      <div className="pt-10 z-20 w-full flex justify-center">
        <div className="bamboo-card px-4 py-2.5 max-w-[320px] text-center select-none">
          <div className="flex items-center justify-center gap-1.5 text-[#A84D3D] text-[11px] font-black uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-[#A84D3D]" />
            <span>Rough Doodle & Muted Pastel</span>
          </div>
          <p className="text-xs font-bold text-[#1F2224] leading-tight">
            {content.s01_nightForest.hintTitle}
          </p>
        </div>
      </div>

      {/* Center: The Glowing Bamboo Stalk (Rough Doodle + Muted Pastel) */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto">
        <button
          type="button"
          onClick={handleClickStalk}
          className="group relative flex flex-col items-center justify-center cursor-pointer outline-none transition-transform active:translate-y-1"
          aria-label="Tap to open the bamboo shoot"
        >
          {/* Misprint Shadow Plate: Dusty Sage Green */}
          <div
            className="absolute -inset-1 bg-[#7E9A85] border-2 border-[#26292B] transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5 -z-10"
            style={{
              borderRadius: 'var(--radius-doodle-1)',
              transform: 'translate(6px, 6px)',
            }}
          />

          {/* Dó Paper Canvas Base behind Bamboo Stalk */}
          <div
            className="relative px-6 py-8 bg-[#F4EEDD] border-[3px] border-[#26292B] shadow-woodblock flex flex-col items-center justify-center transition-all group-hover:animate-wiggle-2d"
            style={{
              borderRadius: 'var(--radius-doodle-1)',
            }}
          >
            {/* Hand-drawn 2D Bamboo Cutout SVG */}
            <svg width="110" height="200" viewBox="0 0 110 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:scale-105">
              {/* Top Segment: Muted Ochre */}
              <path
                d="M28 20 C32 14, 78 14, 82 20 L80 75 C76 80, 34 80, 30 75 Z"
                fill="#CFA85B"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <ellipse cx="55" cy="18" rx="27" ry="6" fill="#EDE5D2" stroke="#26292B" strokeWidth="3" />
              <line x1="28" y1="76" x2="82" y2="76" stroke="#26292B" strokeWidth="5" strokeLinecap="round" />

              {/* Middle Segment: Sacred Sprout Core (Warm Cream / Ochre) */}
              <path
                d="M30 78 C34 76, 76 76, 80 78 L84 140 C80 145, 30 145, 26 140 Z"
                fill="#CFA85B"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <line x1="24" y1="141" x2="86" y2="141" stroke="#26292B" strokeWidth="5" strokeLinecap="round" />

              {/* Bottom Segment: Desaturated Brown */}
              <path
                d="M26 143 C30 140, 80 140, 84 143 L87 190 C84 195, 26 195, 23 190 Z"
                fill="#5C4D43"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Vertical Glowing Seam */}
              <line x1="55" y1="28" x2="55" y2="185" stroke="#F4EEDD" strokeWidth="4" strokeDasharray="8 4" />
              <line x1="55" y1="28" x2="55" y2="185" stroke="#26292B" strokeWidth="1" strokeDasharray="8 4" />

              {/* Dusty Sage Green Bamboo Leaves */}
              <path
                d="M80 75 C100 65, 110 45, 110 30 C100 45, 85 65, 80 75 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3"
              />
              <path
                d="M30 140 C10 130, 0 110, 0 95 C10 110, 25 130, 30 140 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Bottom Interactive CTA: Primary Rough Doodle Button */}
      <div className="w-full z-20 pb-8 px-4 flex flex-col items-center gap-2.5">
        <button
          onClick={handleClickStalk}
          className="btn-woodblock w-full max-w-xs py-3.5 px-6 text-sm flex items-center justify-center gap-2"
        >
          <span className="text-base">✨</span>
          <span>{content.s01_nightForest.hintTap}</span>
        </button>

        <p className={`text-[11px] text-[#8FA996] italic text-center transition-opacity duration-500 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
          Touch the glowing stalk to awaken your folk art companion
        </p>
      </div>
    </div>
  );
}
