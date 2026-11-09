'use client';

import React from 'react';
import { Goal, Personality } from '@/lib/types';
import { Sparkles, Brain, Flame, Activity, Palette, Zap } from 'lucide-react';

interface AnimatedMangNonProps {
  goal: Goal;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
}

export default function AnimatedMangNon({
  goal,
  onClick,
  size = 'md',
  showStats = true,
}: AnimatedMangNonProps) {
  const personalityLabels: Record<Personality, { label: string; color: string; badgeBg: string }> = {
    curious: { label: 'Tò mò', color: 'text-sky-300', badgeBg: 'bg-sky-950/70 border-sky-700/60' },
    calm: { label: 'Điềm tĩnh', color: 'text-emerald-300', badgeBg: 'bg-emerald-950/70 border-emerald-700/60' },
    excited: { label: 'Hào hứng', color: 'text-amber-300', badgeBg: 'bg-amber-950/70 border-amber-700/60' },
    shy: { label: 'Nhút nhát', color: 'text-purple-300', badgeBg: 'bg-purple-950/70 border-purple-700/60' },
  };

  const pInfo = personalityLabels[goal.personality];

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-44 h-44',
    lg: 'w-64 h-64',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center cursor-pointer transition-transform duration-300 ${
        onClick ? 'hover:scale-105' : ''
      }`}
    >
      {/* Halo / Aura glow */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-400/25 transition-all"></div>

      {/* Main animated sprite */}
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center animate-breathe drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)]`}
      >
        {/* Bamboo Character */}
        {goal.imageUri.startsWith('data:image/svg') || goal.imageUri.startsWith('data:image/png') || goal.imageUri.startsWith('http') ? (
          <img
            src={goal.imageUri}
            alt={goal.name}
            className="w-full h-full object-contain filter group-hover:brightness-110 transition animate-sway"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400 flex items-center justify-center text-4xl shadow-inner animate-sway">
            🎋
          </div>
        )}

        {/* Floating Sparks */}
        <div className="absolute -top-1 -right-1 text-amber-300 animate-pulse text-xs">
          ✨
        </div>
      </div>

      {/* Goal Title & Personality Badge */}
      <div className="mt-3 text-center flex flex-col items-center max-w-[200px]">
        <span className="font-semibold text-sm text-slate-100 group-hover:text-emerald-300 transition truncate w-full">
          {goal.name}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${pInfo.badgeBg} ${pInfo.color}`}
          >
            {pInfo.label}
          </span>
          {goal.hasVault && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-300 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-amber-400" />
              Vault
            </span>
          )}
        </div>
      </div>

      {/* Stats bar (if enabled) */}
      {showStats && (
        <div className="mt-2 grid grid-cols-2 gap-1.5 w-full max-w-[200px] text-[10px] text-slate-300 bg-slate-900/80 backdrop-blur p-2 rounded-xl border border-emerald-900/50 shadow-sm">
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3 text-blue-400" />
            <span>Trí tuệ:</span>
            <span className="font-semibold text-white ml-auto">{goal.stats.intelligence}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Kiên trì:</span>
            <span className="font-semibold text-white ml-auto">{goal.stats.perseverance}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Thể lực:</span>
            <span className="font-semibold text-white ml-auto">{goal.stats.fitness}</span>
          </div>
          <div className="flex items-center gap-1">
            <Palette className="w-3 h-3 text-purple-400" />
            <span>Sáng tạo:</span>
            <span className="font-semibold text-white ml-auto">{goal.stats.creativity}</span>
          </div>
        </div>
      )}
    </div>
  );
}
