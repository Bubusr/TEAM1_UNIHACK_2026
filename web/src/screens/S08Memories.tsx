'use client';

import React, { useState } from 'react';
import { Mangnon, MemoryItem } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { ArrowLeft, Bookmark, Trash2, X, AlertCircle } from 'lucide-react';

interface S08MemoriesProps {
  mangnon: Mangnon;
  memories: MemoryItem[];
  onTogglePin: (memoryId: string) => void;
  onForget: (memoryId: string) => void;
  onBack: () => void;
}

export default function S08Memories({
  mangnon,
  memories,
  onTogglePin,
  onForget,
  onBack,
}: S08MemoriesProps) {
  const [forgetCandidate, setForgetCandidate] = useState<MemoryItem | null>(null);

  const stageInfo = content.s08_memories.stages[mangnon.stage] || {
    name: 'Đồng hành',
    poetic: 'Mình đang lắng nghe từng điều cậu kể.',
  };

  const activeMemories = memories.filter((m) => !m.forgotten);

  const handleConfirmForget = () => {
    if (forgetCandidate) {
      SoundEngine.playWaterSplash();
      onForget(forgetCandidate.id);
      setForgetCandidate(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar */}
      <div className="pt-10 pb-3 px-4 flex items-center justify-between border-b border-bamboo-mid/25 bg-forest-darker/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl text-dongho-paper/70 hover:text-warm-glow hover:bg-forest-deep transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-warm-glow">
            {content.s08_memories.title}
          </h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Cognitive Stage Card (NO XP, NO percentage bar) */}
        <div className="p-4 rounded-3xl bg-forest-darker/90 border border-warm-amber/35 shadow-xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-forest-deep border border-warm-amber/50 flex items-center justify-center p-1 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mangnon.imageUri} alt={mangnon.name} className="w-full h-full object-contain animate-pulse" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              {[...Array(4)].map((_, idx) => (
                <span
                  key={idx}
                  className={`text-sm ${
                    idx < mangnon.stage ? 'text-warm-amber drop-shadow-[0_0_6px_#FFD166]' : 'text-dongho-paper/20'
                  }`}
                >
                  🎋
                </span>
              ))}
            </div>
            <h3 className="text-xs font-bold text-warm-glow">
              {stageInfo.name}
            </h3>
            <p className="text-[11px] text-dongho-paper/70 mt-1 italic leading-relaxed">
              &quot;{stageInfo.poetic}&quot;
            </p>
          </div>
        </div>

        {/* Memory Timeline Title */}
        <div className="pt-2 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-warm-amber">
            Những điều mình đã ghi nhớ ({activeMemories.length})
          </span>
        </div>

        {/* Empty State */}
        {activeMemories.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-xs text-dongho-paper/60 italic leading-relaxed">
              {content.s08_memories.empty}
            </p>
          </div>
        ) : (
          /* Memory Cards */
          <div className="space-y-2.5">
            {activeMemories.map((mem) => (
              <div
                key={mem.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  mem.pinned
                    ? 'bg-forest-deep/90 border-warm-amber shadow-md'
                    : 'bg-forest-darker/70 border-bamboo-soft/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-dongho-paper leading-relaxed font-medium">
                    {mem.text}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-dongho-paper/60 border-t border-bamboo-mid/20 pt-2">
                  <span>{new Date(mem.createdAt).toLocaleDateString('vi-VN')}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        SoundEngine.playBambooKnock();
                        onTogglePin(mem.id);
                      }}
                      className={`hover:text-warm-glow transition flex items-center gap-1 ${
                        mem.pinned ? 'text-warm-amber font-bold' : ''
                      }`}
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>{content.s08_memories.btnPin}</span>
                    </button>
                    <button
                      onClick={() => setForgetCandidate(mem)}
                      className="hover:text-dongho-red transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{content.s08_memories.btnForget}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gentle Confirmation Modal for "Quên điều này" */}
      {forgetCandidate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-forest-abyss/85 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-forest-deep border border-warm-amber/60 rounded-3xl p-5 text-dongho-paper shadow-2xl">
            <div className="flex items-center gap-2 text-warm-amber mb-3">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-xs font-bold text-warm-glow">Lời nhắn dịu dàng</h4>
            </div>

            <p className="text-xs text-dongho-paper/85 leading-relaxed">
              {content.s08_memories.forgetConfirm}
            </p>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setForgetCandidate(null)}
                className="flex-1 py-2.5 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-xs font-medium text-dongho-paper/80 hover:text-dongho-paper"
              >
                {content.common.cancel}
              </button>
              <button
                onClick={handleConfirmForget}
                className="flex-1 py-2.5 rounded-xl bg-dongho-red/80 hover:bg-dongho-red text-white text-xs font-bold transition shadow"
              >
                {content.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

