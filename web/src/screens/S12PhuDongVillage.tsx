'use client';

import React, { useState } from 'react';
import InteractiveVillageCanvas from '@/components/InteractiveVillageCanvas';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { Landmark, Sparkles, RefreshCw, Flower2 } from 'lucide-react';

interface S12PhuDongVillageProps {
  leaves: number;
  threshold: number;
  lastBloomedAt?: string;
  onTriggerBloom: () => void;
}

export default function S12PhuDongVillage({
  leaves,
  threshold,
  lastBloomedAt,
  onTriggerBloom,
}: S12PhuDongVillageProps) {
  const [showRewatchCard, setShowRewatchCard] = useState(Boolean(lastBloomedAt));
  const [isBlooming, setIsBlooming] = useState(false);

  const handleBloom = () => {
    SoundEngine.playBlessingChime();
    setIsBlooming(true);
    onTriggerBloom();
    setTimeout(() => {
      setIsBlooming(false);
    }, 8000);
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-hidden select-none">
      {/* Header */}
      <div className="pt-12 px-6 pb-3 border-b border-bamboo-mid/25 bg-forest-darker/90 backdrop-blur-md z-20 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-warm-amber" />
            <h2 className="text-sm font-bold text-warm-glow">
              {content.s12_villageTree.title}
            </h2>
          </div>
          <p className="text-[11px] text-dongho-paper/65 mt-0.5">
            {content.s12_villageTree.banyanName}
          </p>
        </div>

        {/* Leaves Counter Badge (Mộc bản) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-deep border border-warm-amber/40 shadow">
          <span className="text-xs">🍃</span>
          <span className="text-xs font-bold text-warm-glow">{leaves}</span>
          <span className="text-[10px] text-dongho-paper/60">lá sáng</span>
        </div>
      </div>

      {/* Interactive Village Canvas Container */}
      <div className="relative flex-1 w-full overflow-hidden z-10 flex flex-col items-center justify-center">
        <InteractiveVillageCanvas
          currentEnergy={leaves}
          threshold={threshold}
          cycle={1}
          isBlessed={isBlooming}
          onTriggerBlessing={handleBloom}
        />

        {/* "Đêm qua Cây Đa đã nở hoa" Rewatch Notification */}
        {showRewatchCard && !isBlooming && (
          <div className="absolute top-4 left-6 right-6 z-30 p-3.5 rounded-2xl bg-forest-darker/95 border-2 border-warm-amber shadow-2xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌺</span>
              <div>
                <h4 className="text-xs font-bold text-warm-glow">
                  {content.s12_villageTree.afterBloomText}
                </h4>
                <p className="text-[10px] text-dongho-paper/70">
                  {content.s12_villageTree.newSeasonText}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowRewatchCard(false);
                handleBloom();
              }}
              className="px-3 py-1.5 rounded-xl bg-warm-amber text-forest-abyss font-bold text-xs flex items-center gap-1 hover:brightness-105"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{content.s12_villageTree.btnRewatch}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Information (No pressure, community sense of belonging) */}
      <div className="pb-20 pt-2 px-6 text-center z-20">
        <p className="text-[11px] text-dongho-paper/60 italic leading-relaxed">
          Mỗi hành trình khép lại góp một chiếc lá nuôi Cây Đa. Khi đủ mầm lực, hoa gạo đỏ rực sẽ nở khắp trời làng.
        </p>
      </div>
    </div>
  );
}

