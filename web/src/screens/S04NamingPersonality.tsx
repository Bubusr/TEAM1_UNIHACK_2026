'use client';

import React, { useState } from 'react';
import { Personality } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { Sparkles, ArrowRight } from 'lucide-react';

interface S04NamingPersonalityProps {
  imageUri: string;
  onNext: (name: string, personality: Personality) => void;
}

export default function S04NamingPersonality({ imageUri, onNext }: S04NamingPersonalityProps) {
  const [name, setName] = useState('Măng');
  const [personality, setPersonality] = useState<Personality>('haohung');
  const [creatureReaction, setCreatureReaction] = useState<'idle' | 'tilt' | 'bounce' | 'shy'>('idle');

  const handleSelectPersonality = (p: Personality) => {
    setPersonality(p);
    SoundEngine.playBambooKnock();

    if (p === 'haohung') {
      setCreatureReaction('bounce');
    } else if (p === 'tomo') {
      setCreatureReaction('tilt');
    } else if (p === 'nhutnhat') {
      setCreatureReaction('shy');
    } else {
      setCreatureReaction('idle');
    }

    setTimeout(() => {
      setCreatureReaction('idle');
    }, 1200);
  };

  const pData = content.s04_namingPersonality.personalities;

  const personalityList: { key: Personality; name: string; desc: string; sample: string }[] = [
    { key: 'tomo', name: pData.tomo.name, desc: pData.tomo.desc, sample: pData.tomo.sample },
    { key: 'diemtinh', name: pData.diemtinh.name, desc: pData.diemtinh.desc, sample: pData.diemtinh.sample },
    { key: 'haohung', name: pData.haohung.name, desc: pData.haohung.desc, sample: pData.haohung.sample },
    { key: 'nhutnhat', name: pData.nhutnhat.name, desc: pData.nhutnhat.desc, sample: pData.nhutnhat.sample },
  ];

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-y-auto select-none p-5">
      {/* Top Half: Breathing Creature with Reactive Animation */}
      <div className="flex flex-col items-center pt-8">
        <div className="relative w-36 h-36 rounded-full bg-forest-darker/90 border border-warm-amber/40 shadow-xl flex items-center justify-center overflow-hidden">
          <div className="absolute w-24 h-24 rounded-full bg-warm-amber/15 blur-xl pointer-events-none animate-pulse" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUri}
            alt="Măng Non"
            className={`w-28 h-28 object-contain transition-all duration-500 ease-soft ${
              creatureReaction === 'bounce'
                ? '-translate-y-4 scale-110'
                : creatureReaction === 'tilt'
                ? 'rotate-12 scale-105'
                : creatureReaction === 'shy'
                ? 'scale-95 translate-y-1 rotate-[-6deg] opacity-80'
                : 'scale-100 rotate-0'
            }`}
          />
        </div>

        {/* Naming Input */}
        <div className="mt-5 w-full max-w-xs text-center">
          <label className="block text-xs font-semibold text-dongho-paper/80 mb-1.5">
            {content.s04_namingPersonality.heading}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={content.s04_namingPersonality.placeholderName}
            maxLength={16}
            className="w-full text-center py-2.5 px-4 rounded-2xl bg-forest-darker border-2 border-warm-amber/50 focus:border-warm-glow text-warm-glow font-bold text-sm outline-none transition shadow-inner"
          />
        </div>
      </div>

      {/* Bottom Half: 4 Personality Cards */}
      <div className="my-4">
        <div className="flex items-center gap-1.5 mb-2.5 px-1">
          <Sparkles className="w-3.5 h-3.5 text-warm-glow" />
          <h3 className="text-xs font-bold text-warm-glow uppercase tracking-wider">
            {content.s04_namingPersonality.personalityTitle}
          </h3>
        </div>

        <div className="space-y-2">
          {personalityList.map((item) => {
            const isSelected = personality === item.key;
            return (
              <div
                key={item.key}
                onClick={() => handleSelectPersonality(item.key)}
                className={`p-3 rounded-2xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-forest-deep border-warm-glow shadow-lg shadow-forest-abyss scale-[1.01]'
                    : 'bg-forest-darker/70 border-bamboo-soft/30 hover:border-bamboo-soft/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? 'text-warm-glow' : 'text-dongho-paper'}`}>
                    {item.name}
                  </span>
                  <span className="text-[10px] text-dongho-paper/60">{item.desc}</span>
                </div>
                <p className="text-[11px] text-dongho-paper/75 mt-1.5 italic bg-forest-abyss/40 p-2 rounded-xl border border-bamboo-mid/20">
                  &quot;{item.sample}&quot;
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button Next */}
      <div className="pb-4">
        <button
          onClick={() => onNext(name.trim() || 'Măng', personality)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-warm-amber via-warm-glow to-warm-amber text-forest-abyss font-bold text-sm shadow-xl hover:brightness-105 transition flex items-center justify-center gap-2"
        >
          <span>{content.s04_namingPersonality.btnMeet}</span>
          <ArrowRight className="w-4 h-4 text-forest-abyss" />
        </button>
      </div>
    </div>
  );
}

