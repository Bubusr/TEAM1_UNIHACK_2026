'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Goal, JournalEntry, Personality } from '@/lib/types';
import { generatePersonaGreeting, getCognitiveStageName } from '@/lib/ai-companion';
import { StorageService } from '@/lib/storage';
import { X, Send, HelpCircle, MessageSquare, Sparkles, Waves, Heart } from 'lucide-react';
import AnimatedMangNon from './AnimatedMangNon';

interface ChatModalProps {
  goal: Goal;
  onClose: () => void;
  onGoalUpdated: (updated: Goal) => void;
  onRestGoal: (goal: Goal) => void;
}

export default function ChatModal({
  goal,
  onClose,
  onGoalUpdated,
  onRestGoal,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'companion'; text: string; statGain?: any }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [mode, setMode] = useState<'chat' | 'quiz'>('chat');
  const [loading, setLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [statNotification, setStatNotification] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const greeting = generatePersonaGreeting(goal.personality, goal.name);
    setMessages([{ sender: 'companion', text: greeting }]);
  }, [goal]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeQuiz]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: userText, goal, mode }),
      });

      const data = await res.json();
      if (data.reply) {
        const reply = data.reply;
        setMessages((prev) => [
          ...prev,
          { sender: 'companion', text: reply.text, statGain: reply.statGain },
        ]);

        if (reply.quizQuestion) {
          setActiveQuiz(reply.quizQuestion);
          setQuizAnswered(null);
        }

        applyStatGain(reply.statGain, reply.cognitiveStageUpdated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyStatGain = (
    statGain: { type: 'intelligence' | 'perseverance' | 'fitness' | 'creativity'; amount: number },
    newStage?: any
  ) => {
    const updated = { ...goal };
    updated.stats[statGain.type] += statGain.amount;
    updated.interactionCount += 1;
    updated.lastInteraction = Date.now();
    if (newStage) updated.cognitiveStage = newStage;

    // Cơ chế lan toả 20% sang Goal được nối
    if (updated.linkedGoalId) {
      const allGoals = StorageService.getGoals();
      const linked = allGoals.find((g) => g.id === updated.linkedGoalId && !g.isResting);
      if (linked) {
        const spreadAmount = Math.max(1, Math.floor(statGain.amount * 0.2));
        linked.stats[statGain.type] += spreadAmount;
        StorageService.updateGoal(linked);
        setStatNotification(`+${statGain.amount} mầm lực (Lan toả +${spreadAmount} sang ${linked.name})`);
      } else {
        setStatNotification(`+${statGain.amount} mầm lực`);
      }
    } else {
      setStatNotification(`+${statGain.amount} mầm lực`);
    }

    setTimeout(() => setStatNotification(null), 3500);

    StorageService.updateGoal(updated);
    onGoalUpdated(updated);
  };

  const handleAnswerQuiz = (index: number) => {
    if (quizAnswered !== null || !activeQuiz) return;
    setQuizAnswered(index);

    if (index === activeQuiz.correctIndex) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'companion',
          text: `🎯 Hay quá cậu ơi! ${activeQuiz.explanation}`,
          statGain: { type: 'intelligence', amount: 8 },
        },
      ]);
      applyStatGain({ type: 'intelligence', amount: 8 });
    } else {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'companion',
          text: `Gần đúng rồi nè cậu! ${activeQuiz.explanation}`,
          statGain: { type: 'perseverance', amount: 4 },
        },
      ]);
      applyStatGain({ type: 'perseverance', amount: 4 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-abyss/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-forest-deep border-2 border-bamboo-mid/50 rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[720px] overflow-hidden text-dongho-paper">
        {/* Header dạng thẻ tre mộc bản */}
        <div className="p-4 sm:p-5 border-b border-bamboo-mid/30 bg-forest-darker/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-abyss border border-bamboo-soft/40 flex items-center justify-center overflow-hidden">
              <AnimatedMangNon goal={goal} size="sm" showStats={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-warm-glow">{goal.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-forest-mist border border-bamboo-soft text-bamboo-light capitalize">
                  {goal.personality}
                </span>
              </div>
              <p className="text-xs text-dongho-paper/70">
                Giai đoạn: <span className="text-warm-amber font-medium">{getCognitiveStageName(goal.cognitiveStage || 'raw_curiosity')}</span> · {goal.interactionCount} lần tâm sự
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRestGoal(goal)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-warm-wood/30 hover:bg-warm-wood/50 border border-warm-amber text-warm-glow transition flex items-center gap-1.5 shadow"
            >
              <Waves className="w-3.5 h-3.5 text-warm-glow" />
              <span>Tiễn đưa an nghỉ</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-dongho-paper/60 hover:text-dongho-paper hover:bg-forest-mist transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Stat Notification */}
        {statNotification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-bamboo-deep to-forest-mist text-warm-glow text-xs font-bold px-4 py-1.5 rounded-full border border-warm-amber/60 shadow-lg animate-bounce flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-warm-glow" />
            {statNotification}
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex items-center px-4 py-2 bg-forest-darker/40 border-b border-bamboo-mid/20 gap-2">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-medium transition ${
              mode === 'chat'
                ? 'bg-bamboo-deep text-warm-glow border border-warm-amber/50'
                : 'text-dongho-paper/60 hover:text-dongho-paper'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Tâm sự cùng Măng Non
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-medium transition ${
              mode === 'quiz'
                ? 'bg-warm-wood/40 text-warm-glow border border-warm-amber'
                : 'text-dongho-paper/60 hover:text-dongho-paper'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Đố vui nhẹ nhàng
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-bamboo-deep text-dongho-paper border border-bamboo-soft/40 rounded-br-sm shadow'
                    : 'bg-forest-mist/90 border border-bamboo-mid/40 text-dongho-paper rounded-bl-sm shadow'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Active Quiz if any */}
          {activeQuiz && (
            <div className="bg-forest-darker/90 border border-warm-amber/50 rounded-2xl p-4 my-2 text-dongho-paper shadow-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-warm-glow mb-2">
                <HelpCircle className="w-4 h-4 text-warm-amber" />
                Câu đố nhỏ từ Măng Non:
              </div>
              <p className="text-sm font-medium mb-3">{activeQuiz.question}</p>
              <div className="space-y-2">
                {activeQuiz.options.map((opt: string, i: number) => {
                  let btnClass = 'bg-forest-deep hover:bg-forest-mist border-bamboo-mid/40 text-dongho-paper';
                  if (quizAnswered !== null) {
                    if (i === activeQuiz.correctIndex) {
                      btnClass = 'bg-bamboo-deep border-warm-amber text-warm-glow font-semibold';
                    } else if (i === quizAnswered) {
                      btnClass = 'bg-dongho-crimson/40 border-dongho-red text-dongho-paper';
                    } else {
                      btnClass = 'opacity-40 bg-forest-deep border-forest-deep';
                    }
                  }
                  return (
                    <button
                      key={i}
                      disabled={quizAnswered !== null}
                      onClick={() => handleAnswerQuiz(i)}
                      className={`w-full text-left text-xs p-2.5 rounded-xl border transition ${btnClass}`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-warm-glow italic">
              <span className="w-2 h-2 rounded-full bg-warm-glow animate-ping"></span>
              Măng Non đang lắng nghe và suy ngẫm...
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-forest-darker/90 border-t border-bamboo-mid/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                mode === 'chat'
                  ? 'Kể cho Măng Non nghe điều cậu vừa trải nghiệm hôm nay...'
                  : 'Gợi ý một chủ đề để Măng Non đố cậu...'
              }
              className="flex-1 bg-forest-deep border border-bamboo-mid/40 rounded-xl px-4 py-2.5 text-sm text-dongho-paper placeholder-dongho-paper/40 focus:outline-none focus:border-warm-amber transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-4 py-2.5 bg-warm-amber hover:bg-warm-glow disabled:opacity-40 text-forest-abyss font-bold rounded-xl text-sm transition flex items-center gap-1 shadow-md"
            >
              <Send className="w-4 h-4 text-forest-abyss" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
