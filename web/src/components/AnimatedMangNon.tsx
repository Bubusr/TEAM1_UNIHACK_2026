'use client';

import React from 'react';
import { Goal, Personality } from '@/lib/types';
import { getCognitiveStageName } from '@/lib/ai-companion';
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
  const personalityLabels: Record<Personality, { label: string; badge: string }> = {
    curious: { label: 'Tò mò', badge: 'bg-forest-mist border-bamboo-soft text-warm-glow' },
    calm: { label: 'Điềm tĩnh', badge: 'bg-bamboo-deep border-bamboo-soft text-bamboo-light' },
    excited: { label: 'Hào hứng', badge: 'bg-warm-wood/30 border-warm-amber text-warm-glow' },
    shy: { label: 'Nhút nhát', badge: 'bg-forest-deep border-bamboo-mid text-dongho-ochre' },
  };

  const pInfo = personalityLabels[goal.personality];
  const stageName = getCognitiveStageName(goal.cognitiveStage || 'raw_curiosity');

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-44 h-44',
    lg: 'w-60 h-60',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center cursor-pointer transition-transform duration-500 ${
        onClick ? 'hover:scale-105' : ''
      }`}
    >
      {/* Soft warm aura (ánh sáng đom đóm & trăng rằm, không dùng neon) */}
      <div className="absolute inset-0 rounded-full bg-warm-glow/10 blur-2xl group-hover:bg-warm-amber/20 transition-all duration-700"></div>

      {/* Main animated sprite - Giữ nguyên nét vẽ gốc của người dùng */}
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center animate-breathe drop-shadow-[0_12px_24px_rgba(27,42,47,0.8)]`}
      >
        {goal.imageUri.startsWith('data:image/svg') || goal.imageUri.startsWith('data:image/png') || goal.imageUri.startsWith('http') ? (
          <img
            src={goal.imageUri}
            alt={goal.name}
            className="w-full h-full object-contain filter group-hover:brightness-105 transition duration-500 animate-sway-gentle"
          />
        ) : (
          <div className="w-full h-full rounded-3xl bg-bamboo-deep/80 border-2 border-bamboo-mid flex items-center justify-center text-4xl shadow-inner animate-sway-gentle">
            🎋
          </div>
        )}

        {/* Floating tiny firefly spark */}
        <div className="absolute -top-1 -right-1 text-warm-glow animate-firefly text-xs">
          ✨
        </div>
      </div>

      {/* Goal Title & Cognitive Stage */}
      <div className="mt-3 text-center flex flex-col items-center max-w-[210px]">
        <span className="font-semibold text-sm text-dongho-paper group-hover:text-warm-glow transition truncate w-full">
          {goal.name}
        </span>

        {/* Badges theo phong cách mộc bản Đông Hồ */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${pInfo.badge}`}>
            {pInfo.label}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-forest-deep border border-bamboo-mid text-bamboo-light">
            {stageName}
          </span>
          {goal.hasVault && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-warm-wood/30 border border-warm-amber text-warm-glow flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-warm-glow" />
              Mầm Lực
            </span>
          )}
        </div>
      </div>

      {/* Stats bar dạng thẻ tre mộc bản */}
      {showStats && (
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 w-full max-w-[210px] text-[10px] text-dongho-paper/85 bg-forest-darker/90 backdrop-blur p-2.5 rounded-xl border border-bamboo-mid/40 shadow-sm">
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3 text-bamboo-light" />
            <span>Hiểu biết:</span>
            <span className="font-semibold text-warm-glow ml-auto">{goal.stats.intelligence}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-warm-amber" />
            <span>Kiên trì:</span>
            <span className="font-semibold text-warm-glow ml-auto">{goal.stats.perseverance}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-bamboo-soft" />
            <span>Sức sống:</span>
            <span className="font-semibold text-warm-glow ml-auto">{goal.stats.fitness}</span>
          </div>
          <div className="flex items-center gap-1">
            <Palette className="w-3 h-3 text-dongho-ochre" />
            <span>Tự do:</span>
            <span className="font-semibold text-warm-glow ml-auto">{goal.stats.creativity}</span>
          </div>
        </div>
      )}
    </div>
  );
}
