'use client';

import React, { useState } from 'react';
import { Personality } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { Send, ArrowRight } from 'lucide-react';

interface S05FirstMeetingProps {
  name: string;
  personality: Personality;
  imageUri: string;
  onComplete: (goalTitle: string, durationDays: number | null) => void;
}

interface Message {
  role: 'mangnon' | 'user';
  text: string;
}

export default function S05FirstMeeting({
  name,
  personality,
  imageUri,
  onComplete,
}: S05FirstMeetingProps) {
  const [turn, setTurn] = useState<number>(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [duration, setDuration] = useState<number | null>(null);

  // Initial greeting according to personality
  const greeting = content.s04_namingPersonality.personalities[personality].sample;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'mangnon', text: `Chào cậu, mình là ${name}! ${greeting}` },
  ]);

  const handleChooseGoalChip = (chipText: string) => {
    SoundEngine.playBambooKnock();
    setGoalTitle(chipText);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: chipText },
      { role: 'mangnon', text: content.s05_firstMeeting.turn3_askDuration },
    ]);
    setTurn(3);
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const chosen = customInput.trim();
    SoundEngine.playBambooKnock();
    setGoalTitle(chosen);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: chosen },
      { role: 'mangnon', text: content.s05_firstMeeting.turn3_askDuration },
    ]);
    setCustomInput('');
    setTurn(3);
  };

  const handleSkipGoal = () => {
    SoundEngine.playBambooKnock();
    setGoalTitle('Hành trình tự do');
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: 'Để sau nhé Măng Non' },
      { role: 'mangnon', text: content.s05_firstMeeting.turn3_askDuration },
    ]);
    setTurn(3);
  };

  const handleChooseDuration = (days: number | null, label: string) => {
    SoundEngine.playBlessingChime();
    setDuration(days);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: label },
      { role: 'mangnon', text: 'Vậy mình bắt đầu nhé. Mình sẽ ở đây chờ cậu.' },
    ]);
    setTurn(4);

    setTimeout(() => {
      onComplete(goalTitle || 'Hành trình tự do', days);
    }, 1800);
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between select-none p-5 overflow-hidden">
      {/* Top Bar with mini avatar */}
      <div className="pt-6 pb-3 flex items-center gap-3 border-b border-bamboo-mid/20">
        <div className="w-12 h-12 rounded-full bg-forest-darker border border-warm-amber/50 flex items-center justify-center p-1 overflow-hidden shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUri} alt={name} className="w-full h-full object-contain animate-pulse" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-warm-glow">{name}</h3>
          <p className="text-[10px] text-dongho-paper/60">Lần đầu gặp gỡ tại Rừng Tre</p>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 my-3 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl shadow leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#F6EBD4] text-[#1B2A2F] font-medium rounded-tr-sm'
                  : 'bg-forest-deep text-dongho-paper border border-bamboo-soft/40 rounded-tl-sm relative'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Scripted Turn Actions */}
      <div className="pb-3 border-t border-bamboo-mid/20 pt-3">
        {/* Turn 1 -> 2: Next button to ask goal */}
        {turn === 1 && (
          <button
            onClick={() => {
              SoundEngine.playBambooKnock();
              setMessages((prev) => [
                ...prev,
                { role: 'mangnon', text: content.s05_firstMeeting.turn2_askJourney },
              ]);
              setTurn(2);
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow hover:brightness-105 transition flex items-center justify-center gap-1.5"
          >
            <span>Lắng nghe bạn ấy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Turn 2: Chips and input for journey */}
        {turn === 2 && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {content.s05_firstMeeting.turn2_chips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChooseGoalChip(chip)}
                  className="px-3 py-1.5 rounded-xl bg-forest-darker hover:bg-forest-deep border border-bamboo-soft/30 hover:border-warm-amber text-[11px] text-dongho-paper transition"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomGoalSubmit} className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={content.s05_firstMeeting.turn2_placeholder}
                className="flex-1 py-2 px-3 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-xs text-dongho-paper focus:border-warm-glow outline-none"
              />
              <button
                type="submit"
                className="px-3 rounded-xl bg-warm-amber text-forest-abyss font-bold text-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={handleSkipGoal}
                className="text-[11px] text-dongho-paper/50 hover:text-dongho-paper underline underline-offset-4"
              >
                {content.common.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Turn 3: Duration chips */}
        {turn === 3 && (
          <div>
            <p className="text-[11px] text-dongho-paper/70 mb-2 italic text-center">
              {content.s05_firstMeeting.turn3_askDuration}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { days: 7, label: '7 ngày' },
                { days: 14, label: '14 ngày' },
                { days: 30, label: '30 ngày' },
                { days: null, label: 'Mình tự báo khi xong' },
              ].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChooseDuration(opt.days, opt.label)}
                  className="py-2.5 px-3 rounded-xl bg-forest-darker hover:bg-forest-deep border border-bamboo-soft/30 hover:border-warm-amber text-xs font-semibold text-dongho-paper transition text-center"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Turn 4: Finishing transition */}
        {turn === 4 && (
          <div className="text-center py-2 text-xs font-bold text-warm-glow animate-pulse">
            Đang bước vào Rừng Tre Cổ...
          </div>
        )}
      </div>
    </div>
  );
}

