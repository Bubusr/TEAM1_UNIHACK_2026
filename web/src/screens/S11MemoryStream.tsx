'use client';

import React, { useState } from 'react';
import { Mangnon } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { Waves, X, Calendar, Sparkles } from 'lucide-react';

interface S11MemoryStreamProps {
  restingMangnons: Mangnon[];
}

export default function S11MemoryStream({ restingMangnons }: S11MemoryStreamProps) {
  const [selectedCompanion, setSelectedCompanion] = useState<Mangnon | null>(null);

  const handleSelectStone = (mn: Mangnon) => {
    SoundEngine.playWaterSplash();
    setSelectedCompanion(mn);
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-hidden select-none">
      {/* Stream Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#142327] via-[#1B2A2F] to-[#0D181A] pointer-events-none" />

      {/* Vertical River Path with Water Ripples */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-48 bg-gradient-to-r from-transparent via-[#2A443A]/40 to-transparent pointer-events-none">
        <div className="w-full h-full opacity-30 bg-[radial-gradient(#6B8F71_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      {/* Header */}
      <div className="pt-12 px-6 pb-4 border-b border-bamboo-mid/25 bg-forest-darker/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-warm-glow" />
          <h2 className="text-sm font-bold text-warm-glow">
            {content.s11_memoryStream.title}
          </h2>
        </div>
        <p className="text-[11px] text-dongho-paper/65 mt-0.5">
          {content.s11_memoryStream.subtitle}
        </p>
      </div>

      {/* River Bed with Smooth Resting Stones */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 z-10">
        {restingMangnons.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-forest-darker/80 border border-bamboo-soft/30 flex items-center justify-center text-2xl mb-3">
              🌊
            </div>
            <p className="text-xs text-dongho-paper/60 italic leading-relaxed">
              {content.s11_memoryStream.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {restingMangnons.map((mn, idx) => (
              <div
                key={mn.id}
                onClick={() => handleSelectStone(mn)}
                className={`relative flex items-center gap-4 cursor-pointer group ${
                  idx % 2 === 0 ? 'justify-start pl-4' : 'justify-end pr-4'
                }`}
              >
                {/* The River Stone Element */}
                <div className="relative p-4 rounded-[40px] bg-gradient-to-tr from-[#253930] to-[#3E5C45] border-2 border-bamboo-soft/40 shadow-xl group-hover:border-warm-amber transition-all duration-300 transform group-hover:scale-105 flex items-center gap-3">
                  {/* Subtle Silhouette of Creature */}
                  <div className="w-12 h-12 rounded-full bg-forest-abyss/40 flex items-center justify-center p-1 overflow-hidden opacity-80 group-hover:opacity-100 transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mn.imageUri} alt={mn.name} className="w-full h-full object-contain filter grayscale contrast-125" />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-warm-glow">{mn.name}</h4>
                    <span className="text-[10px] text-dongho-paper/70 line-clamp-1 max-w-[120px]">
                      {mn.goalTitle}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resting Stone Detail Modal */}
      {selectedCompanion && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-forest-abyss/80 backdrop-blur-sm">
          <div className="w-full bg-forest-deep border-t-2 border-warm-amber/60 rounded-t-[36px] p-6 text-dongho-paper shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header / Close */}
            <div className="flex items-center justify-between pb-4 border-b border-bamboo-mid/25">
              <div className="flex items-center gap-2">
                <span className="text-sm">🪨</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-warm-glow">
                  Phiến Đá Kỷ Niệm
                </h3>
              </div>
              <button
                onClick={() => setSelectedCompanion(null)}
                className="p-1 rounded-full text-dongho-paper/60 hover:text-dongho-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Companion Portrait & Info */}
            <div className="mt-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-forest-darker border-2 border-warm-amber/50 flex items-center justify-center p-1.5 overflow-hidden shadow-lg shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedCompanion.imageUri} alt={selectedCompanion.name} className="w-full h-full object-contain animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-warm-glow">
                  {selectedCompanion.name}
                </h3>
                <p className="text-xs font-semibold text-dongho-paper/90 mt-0.5">
                  {selectedCompanion.goalTitle}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-forest-darker border border-warm-amber/30 text-warm-amber font-medium">
                    {selectedCompanion.personality === 'tomo'
                      ? 'Tò mò'
                      : selectedCompanion.personality === 'diemtinh'
                      ? 'Điềm tĩnh'
                      : selectedCompanion.personality === 'haohung'
                      ? 'Hào hứng'
                      : 'Nhút nhát'}
                  </span>
                  <span className="text-[9px] text-dongho-paper/60 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-warm-amber" />
                    <span>
                      {new Date(selectedCompanion.createdAt).toLocaleDateString('vi-VN')}
                      {selectedCompanion.restedAt &&
                        ` — ${new Date(selectedCompanion.restedAt).toLocaleDateString('vi-VN')}`}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Last Words */}
            {selectedCompanion.lastWords && (
              <div className="mt-5 p-4 rounded-2xl bg-forest-darker/90 border border-warm-amber/35">
                <span className="text-[10px] uppercase font-bold tracking-wider text-warm-amber block mb-1">
                  Lời cuối của {selectedCompanion.name}:
                </span>
                <p className="text-xs text-dongho-paper leading-relaxed italic">
                  &quot;{selectedCompanion.lastWords}&quot;
                </p>
              </div>
            )}

            {/* Final Memories */}
            {selectedCompanion.finalMemories && selectedCompanion.finalMemories.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-dongho-paper/70 block">
                  Những điều sâu sắc nhất:
                </span>
                {selectedCompanion.finalMemories.map((mem, i) => (
                  <div key={i} className="p-3 rounded-xl bg-forest-darker/70 border border-bamboo-soft/20 text-xs">
                    <span className="text-warm-amber mr-1.5">🌾</span>
                    <span className="text-dongho-paper/85">{mem}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Avalanche On-chain Badge */}
            {selectedCompanion.nftTxHash && (
              <div className="mt-4 p-3 rounded-2xl bg-forest-darker border border-warm-amber/40 text-[10px] space-y-1">
                <div className="flex items-center gap-1.5 text-warm-glow font-bold">
                  <span>⛓️</span>
                  <span>Đã khắc dấu vĩnh cửu trên Avalanche Fuji</span>
                </div>
                <a
                  href={`https://testnet.snowtrace.io/tx/${selectedCompanion.nftTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-warm-amber underline truncate block font-mono text-[9px] hover:brightness-110"
                >
                  TX: {selectedCompanion.nftTxHash.slice(0, 16)}...{selectedCompanion.nftTxHash.slice(-8)}
                </a>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setSelectedCompanion(null)}
                className="w-full py-3 rounded-2xl bg-forest-darker border border-bamboo-soft/40 text-xs font-semibold text-dongho-paper hover:border-warm-amber transition"
              >
                {content.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for nav */}
      <div className="pb-16" />
    </div>
  );
}

