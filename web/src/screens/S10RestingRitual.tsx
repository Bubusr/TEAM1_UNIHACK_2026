'use client';

import React, { useState, useEffect } from 'react';
import { Mangnon, MemoryItem } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';

interface S10RestingRitualProps {
  mangnon: Mangnon;
  memories: MemoryItem[];
  onFinishRitual: (lastWords: string, finalMemories: string[]) => void;
  onCancel: () => void;
}

export default function S10RestingRitual({
  mangnon,
  memories,
  onFinishRitual,
  onCancel,
}: S10RestingRitualProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Top 3 memories or fallback samples
  const topMemories = memories
    .filter((m) => !m.forgotten)
    .slice(0, 3)
    .map((m) => m.text);

  const fallbackMemories = [
    `Cậu kể: Về hành trình ${mangnon.goalTitle}`,
    'Cậu kể: Một buổi chiều gió mát trong rừng tre',
    'Cậu kể: Cảm giác nhẹ nhõm sau khi chia sẻ',
  ];

  const ritualMemories = topMemories.length > 0 ? topMemories : fallbackMemories;

  // Last words based on personality
  const getLastWords = () => {
    switch (mangnon.personality) {
      case 'tomo':
        return 'Đi cùng cậu, mình đã biết thế giới bên ngoài bao la và đẹp đẽ đến nhường nào. Giờ mình chợp mắt một giấc thật ngon bên dòng suối trong vắt nhé...';
      case 'diemtinh':
        return 'Cảm ơn cậu vì đã luôn kiên nhẫn. Mọi điều cậu kể đều đọng lại như những giọt sương mai. Giờ mình chìm vào giấc ngủ êm đềm nhé...';
      case 'haohung':
        return 'Khoảng thời gian bên cậu vui ơi là vui!! Dù có ngủ dưới lòng suối, mình vẫn sẽ luôn nhớ nụ cười của cậu!';
      case 'nhutnhat':
        return '...Cảm ơn cậu vì đã chọn mình. Ở cạnh cậu, mình thấy ấm áp lắm. Giờ mình hoá thành phiến đá nhỏ bên suối, mãi dõi theo cậu...';
    }
  };

  const lastWords = getLastWords();

  const handleNextPhase = () => {
    SoundEngine.playBambooKnock();
    if (phase === 1) {
      setPhase(2);
    } else if (phase === 2) {
      setPhase(3);
    } else if (phase === 3) {
      setPhase(4);
      SoundEngine.playBlessingChime();
      SoundEngine.playWaterSplash();
      setTimeout(() => {
        setPhase(5);
      }, 3500);
    } else if (phase === 5) {
      SoundEngine.playBlessingChime();
      onFinishRitual(lastWords, ritualMemories);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-hidden select-none p-6">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F191C] via-[#1B2A2F] to-[#0A1113] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-warm-amber/15 blur-3xl pointer-events-none animate-pulse" />

      {/* Top indicator */}
      <div className="pt-8 text-center z-10">
        <span className="text-[10px] uppercase font-bold tracking-widest text-warm-amber/80">
          Nghi Thức An Nghỉ · Nhịp {phase}/5
        </span>
      </div>

      {/* Center Emotional Ritual View */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 z-10 text-center">
        {/* NHỊP 1: MỞ LỜI */}
        {phase === 1 && (
          <div className="space-y-6 max-w-xs animate-fade-in">
            <div className="relative w-36 h-36 mx-auto rounded-full bg-forest-darker border-2 border-warm-amber/50 flex items-center justify-center p-2 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mangnon.imageUri} alt={mangnon.name} className="w-28 h-28 object-contain animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-warm-glow leading-relaxed">
              &quot;{content.s10_restingRitual.step1Title}&quot;
            </p>
          </div>
        )}

        {/* NHỊP 2: NHÌN LẠI 3 KÝ ỨC */}
        {phase === 2 && (
          <div className="space-y-4 max-w-xs w-full animate-fade-in">
            <h3 className="text-xs font-bold text-warm-glow uppercase tracking-wider mb-2">
              {content.s10_restingRitual.step2Title}
            </h3>
            <div className="space-y-2.5">
              {ritualMemories.map((mem, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/40 shadow-lg text-left text-xs leading-relaxed"
                >
                  <span className="text-warm-amber mr-1.5 font-bold">🌾</span>
                  <span className="text-dongho-paper font-medium">{mem}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NHỊP 3: LỜI CUỐI */}
        {phase === 3 && (
          <div className="space-y-6 max-w-xs animate-fade-in">
            <div className="relative w-32 h-32 mx-auto rounded-full bg-forest-darker border border-warm-amber/50 flex items-center justify-center p-2 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mangnon.imageUri} alt={mangnon.name} className="w-24 h-24 object-contain animate-pulse" />
            </div>
            <div className="p-4 rounded-3xl bg-forest-darker/90 border border-warm-amber/40 shadow-xl">
              <p className="text-xs text-dongho-paper leading-relaxed italic">
                &quot;{lastWords}&quot;
              </p>
            </div>
          </div>
        )}

        {/* NHỊP 4: HOÁ ÁNH SÁNG & TRÔI VỀ SUỐI (≤ 120 particles) */}
        {phase === 4 && (
          <div className="relative flex flex-col items-center justify-center animate-fade-in">
            {/* Particle Burst Cloud */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {[...Array(60)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-[#FFFDF0]"
                  style={{
                    transform: `translate(${(Math.random() - 0.5) * 220}px, ${(Math.random() - 0.5) * 220}px) scale(${Math.random() * 1.5 + 0.5})`,
                    boxShadow: '0 0 10px #FFD166, 0 0 20px #F4A259',
                    opacity: Math.random() * 0.9 + 0.1,
                    transition: 'all 3s cubic-bezier(.22, 1, .36, 1)',
                  }}
                />
              ))}

              {/* Emerging Smooth River Stone */}
              <div className="w-28 h-20 rounded-[45%] bg-[#3E5C45]/80 border-2 border-warm-amber/60 shadow-[0_0_30px_#FFD166] flex items-center justify-center animate-pulse">
                <span className="text-2xl opacity-60">✨</span>
              </div>
            </div>

            <p className="text-xs text-warm-glow mt-4 font-medium italic">
              {content.s10_restingRitual.step4Title}
            </p>
          </div>
        )}

        {/* NHỊP 5: CÂY ĐA NHẬN LÁ */}
        {phase === 5 && (
          <div className="space-y-6 max-w-xs animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-forest-darker border-2 border-warm-amber flex items-center justify-center text-4xl shadow-2xl">
              🌳
            </div>
            <div className="p-4 rounded-3xl bg-forest-darker/90 border border-warm-amber/40 shadow-xl">
              <p className="text-xs font-bold text-warm-glow leading-relaxed">
                {content.s10_restingRitual.step5Contribution}
              </p>
              <p className="text-[11px] text-dongho-paper/70 mt-2">
                Một chiếc lá vàng đã thắp sáng trên tán Cây Đa Phù Đổng.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pb-6 z-10">
        {phase === 1 && (
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl bg-forest-darker border border-bamboo-soft/40 text-xs font-semibold text-dongho-paper/70 hover:text-dongho-paper transition"
            >
              {content.common.cancel}
            </button>
            <button
              onClick={handleNextPhase}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-lg hover:brightness-105 transition"
            >
              Lắng nghe bạn ấy
            </button>
          </div>
        )}

        {(phase === 2 || phase === 3) && (
          <button
            onClick={handleNextPhase}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-lg hover:brightness-105 transition flex items-center justify-center gap-2"
          >
            <span>Tiếp tục</span>
            <ArrowRight className="w-4 h-4 text-forest-abyss" />
          </button>
        )}

        {phase === 5 && (
          <button
            onClick={handleNextPhase}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-warm-amber via-warm-glow to-warm-amber text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-forest-abyss" />
            <span>{content.s10_restingRitual.btnReturnForest}</span>
          </button>
        )}
      </div>
    </div>
  );
}

