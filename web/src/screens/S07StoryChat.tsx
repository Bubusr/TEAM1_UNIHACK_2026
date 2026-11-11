'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mangnon, MemoryItem, ChatMessage } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { generateReply } from '@/lib/dialogue-engine';
import { ArrowLeft, BookOpen, Send, Sparkles } from 'lucide-react';

interface S07StoryChatProps {
  mangnon: Mangnon;
  memories: MemoryItem[];
  messages: ChatMessage[];
  onSendMessage: (userText: string, replyText: string, newMemory?: string) => void;
  onOpenMemories: () => void;
  onBack: () => void;
}

export default function S07StoryChat({
  mangnon,
  memories,
  messages,
  onSendMessage,
  onOpenMemories,
  onBack,
}: S07StoryChatProps) {
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);
  const [avatarBounce, setAvatarBounce] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isThinking) return;
    const cleanText = text.trim();
    setInputText('');

    SoundEngine.playBambooKnock();
    setAvatarBounce(true);
    setTimeout(() => setAvatarBounce(false), 800);
    setIsThinking(true);

    let replyText = '';
    let newMemoryCandidate: string | undefined = undefined;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userMessage: cleanText,
          mangnon,
          memories,
        }),
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        replyText = data.replyText || data.reply?.text || '';
        newMemoryCandidate = data.newMemory;
      }
    } catch {
      // Offline or timeout: silently fall back to local dialogue engine
    }

    if (!replyText) {
      const sim = generateReply(cleanText, mangnon, memories);
      replyText = sim.replyText;
      newMemoryCandidate = sim.newMemory;
    }

    setIsThinking(false);
    SoundEngine.playWindChime();

    if (newMemoryCandidate) {
      SoundEngine.playBlessingChime();
      setMemoryToast(content.s07_chat.memorySavedToast);
      setTimeout(() => setMemoryToast(null), 2400);
    }

    onSendMessage(cleanText, replyText, newMemoryCandidate);
  };

  const handleChipClick = (chip: string) => {
    setInputText(chip + ' ');
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar Header */}
      <div className="pt-10 pb-3 px-4 flex items-center justify-between border-b border-bamboo-mid/25 bg-forest-darker/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl text-dongho-paper/70 hover:text-warm-glow hover:bg-forest-deep transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Mini breathing avatar */}
          <div className="relative w-9 h-9 rounded-full bg-forest-deep border border-warm-amber/50 flex items-center justify-center p-0.5 overflow-hidden shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mangnon.imageUri}
              alt={mangnon.name}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                avatarBounce ? 'scale-125 -translate-y-1' : 'scale-100'
              }`}
            />
          </div>

          <div>
            <h3 className="text-xs font-bold text-warm-glow">{mangnon.name}</h3>
            <span className="text-[10px] text-dongho-paper/60">
              {content.s08_memories.stages[mangnon.stage]?.name || ''}
            </span>
          </div>
        </div>

        {/* Button to S08: Điều Măng Non nhớ */}
        <button
          onClick={onOpenMemories}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-deep/80 border border-warm-amber/35 hover:border-warm-glow text-[11px] font-semibold text-warm-glow shadow transition"
          title="Điều Măng Non nhớ"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Ký ức</span>
        </button>
      </div>

      {/* Memory Toast notification */}
      {memoryToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-warm-amber text-forest-abyss font-bold text-xs shadow-xl animate-fade-in flex items-center gap-1.5 border border-forest-abyss">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{memoryToast}</span>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 text-xs">
        {messages.length === 0 && (
          <div className="text-center py-10 px-6">
            <p className="text-dongho-paper/60 text-xs italic">
              {mangnon.name} đang ngồi trong rừng tre, lặng lẽ chờ nghe cậu kể...
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl shadow leading-relaxed ${
                  isUser
                    ? 'bg-[#F6EBD4] text-[#1B2A2F] font-medium rounded-tr-sm shadow-md'
                    : 'bg-forest-deep text-dongho-paper border border-bamboo-soft/40 rounded-tl-sm relative shadow-md'
                }`}
              >
                {/* Bamboo leaf edge accent on companion messages */}
                {!isUser && (
                  <span className="absolute -left-1.5 top-3 w-2 h-2 rounded-full bg-warm-amber/60" />
                )}
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator: Swaying Bamboo Leaf */}
        {isThinking && (
          <div className="flex justify-start items-center gap-2 py-1">
            <div className="px-3.5 py-2 rounded-2xl bg-forest-deep/80 border border-bamboo-soft/30 text-warm-glow text-xs flex items-center gap-2">
              <span className="inline-block animate-bounce text-sm">🎋</span>
              <span className="text-[11px] text-dongho-paper/70 italic">Măng Non đang ngẫm nghĩ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-3 border-t border-bamboo-mid/20 bg-forest-darker/95 z-20">
        {/* Starter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {content.s07_chat.starterChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip)}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-forest-deep hover:bg-forest-mist border border-bamboo-soft/30 hover:border-warm-amber text-[10px] text-dongho-paper/85 transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Field & Send Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex items-center gap-2 mt-1"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={content.s07_chat.inputPlaceholder}
            className="flex-1 py-2.5 px-3.5 rounded-2xl bg-forest-abyss/80 border border-bamboo-soft/40 text-xs text-dongho-paper placeholder:text-dongho-paper/40 focus:border-warm-glow outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold shadow hover:brightness-105 active:scale-95 disabled:opacity-40 transition"
          >
            <Send className="w-4 h-4 text-forest-abyss" />
          </button>
        </form>
      </div>
    </div>
  );
}

