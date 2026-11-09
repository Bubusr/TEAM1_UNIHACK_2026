'use client';

import React, { useState } from 'react';
import { Mangnon } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { X, Edit3, Check, Moon, Calendar } from 'lucide-react';

interface S09JourneySheetProps {
  mangnon: Mangnon;
  onUpdateTitle: (newTitle: string) => void;
  onCloseJourney: () => void;
  onCloseSheet: () => void;
}

export default function S09JourneySheet({
  mangnon,
  onUpdateTitle,
  onCloseJourney,
  onCloseSheet,
}: S09JourneySheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleText, setTitleText] = useState(mangnon.goalTitle);

  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleText.trim()) return;
    SoundEngine.playBambooKnock();
    onUpdateTitle(titleText.trim());
    setIsEditing(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-forest-abyss/80 backdrop-blur-sm select-none">
      <div className="w-full bg-forest-deep border-t-2 border-warm-amber/60 rounded-t-[36px] p-6 text-dongho-paper shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Top Handle / Close */}
        <div className="flex items-center justify-between pb-4 border-b border-bamboo-mid/25">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎋</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-warm-glow">
              {content.s09_journeySheet.title}
            </h3>
          </div>
          <button
            onClick={onCloseSheet}
            className="p-1 rounded-full text-dongho-paper/60 hover:text-dongho-paper"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Journey Details */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-dongho-paper/70 mb-1.5">
              Tên hành trình cùng Măng Non:
            </label>
            {isEditing ? (
              <form onSubmit={handleSaveTitle} className="flex gap-2">
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  className="flex-1 py-2 px-3 rounded-xl bg-forest-darker border border-warm-amber text-xs text-warm-glow outline-none font-medium"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-warm-amber text-forest-abyss font-bold"
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-forest-darker border border-bamboo-soft/30">
                <span className="text-xs font-bold text-warm-glow">{mangnon.goalTitle}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-dongho-paper/60 hover:text-warm-amber transition"
                  title={content.s09_journeySheet.btnEdit}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Dates & Companion details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-forest-darker/70 border border-bamboo-soft/20">
              <span className="text-[10px] text-dongho-paper/60 block">Bắt đầu cùng nhau</span>
              <span className="font-semibold text-dongho-paper mt-0.5 block">
                {new Date(mangnon.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-forest-darker/70 border border-bamboo-soft/20">
              <span className="text-[10px] text-dongho-paper/60 block">Số buổi chuyện trò</span>
              <span className="font-semibold text-warm-amber mt-0.5 block">
                {mangnon.sessionsCount} buổi kể
              </span>
            </div>
          </div>

          {/* Gentle Rest Notice */}
          <div className="p-4 rounded-2xl bg-forest-darker/80 border border-warm-amber/30 text-xs">
            <p className="text-dongho-paper/85 italic leading-relaxed">
              &quot;{content.s09_journeySheet.journeyRestNotice}&quot;
            </p>
          </div>

          {/* Close Journey Button (Gentle Secondary Action) */}
          <div className="pt-2">
            <button
              onClick={() => {
                SoundEngine.playWindChime();
                onCloseJourney();
              }}
              className="w-full py-3.5 rounded-2xl bg-forest-darker hover:bg-forest-mist border border-warm-amber/40 hover:border-warm-amber text-warm-glow font-bold text-xs transition flex items-center justify-center gap-2 shadow"
            >
              <Moon className="w-4 h-4 text-warm-amber" />
              <span>{content.s09_journeySheet.btnCloseJourney}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

