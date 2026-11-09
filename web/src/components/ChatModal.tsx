'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Goal, JournalEntry, Personality } from '@/lib/types';
import { generatePersonaGreeting } from '@/lib/ai-companion';
import { StorageService } from '@/lib/storage';
import { X, Send, HelpCircle, MessageSquare, Sparkles, Award, ArrowRight } from 'lucide-react';
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
    // Khởi tạo lời chào đầu tiên
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

        // Tăng chỉ số
        applyStatGain(reply.statGain);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyStatGain = (statGain: { type: 'intelligence' | 'perseverance' | 'fitness' | 'creativity'; amount: number }) => {
    const updated = { ...goal };
    updated.stats[statGain.type] += statGain.amount;
    updated.interactionCount += 1;
    updated.lastInteraction = Date.now();

    // Map liên kết chỉ số: nếu có linkedGoalId, tăng 20%
    if (updated.linkedGoalId) {
      const allGoals = StorageService.getGoals();
      const linked = allGoals.find((g) => g.id === updated.linkedGoalId && !g.isResting);
      if (linked) {
        const spreadAmount = Math.max(1, Math.floor(statGain.amount * 0.2));
        linked.stats[statGain.type] += spreadAmount;
        StorageService.updateGoal(linked);
        setStatNotification(`+${statGain.amount} ${statGain.type} (Lan tỏa +${spreadAmount} sang ${linked.name})`);
      } else {
        setStatNotification(`+${statGain.amount} ${statGain.type}`);
      }
    } else {
      setStatNotification(`+${statGain.amount} ${statGain.type}`);
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
          text: `🎯 Hoan hô bạn! ${activeQuiz.explanation}`,
          statGain: { type: 'intelligence', amount: 10 },
        },
      ]);
      applyStatGain({ type: 'intelligence', amount: 10 });
    } else {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'companion',
          text: `Gần đúng rồi nè! Cùng xem nhé: ${activeQuiz.explanation}`,
          statGain: { type: 'perseverance', amount: 4 },
        },
      ]);
      applyStatGain({ type: 'perseverance', amount: 4 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-800/60 rounded-3xl shadow-2xl flex flex-col h-[90vh] max-h-[720px] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-900/40 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center overflow-hidden">
              <AnimatedMangNon goal={goal} size="sm" showStats={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-emerald-300">{goal.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 capitalize">
                  {goal.personality}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lượt tương tác: <span className="text-emerald-400 font-semibold">{goal.interactionCount}</span> · Cấp độ: {goal.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRestGoal(goal)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 transition flex items-center gap-1 shadow"
            >
              <Award className="w-3.5 h-3.5" />
              <span>An nghỉ &amp; Mint NFT</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Stat Notification */}
        {statNotification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {statNotification}
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex items-center px-4 py-2 bg-slate-950/30 border-b border-slate-800/60 gap-2">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-medium transition ${
              mode === 'chat'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Tâm sự &amp; Kể chuyện
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-medium transition ${
              mode === 'quiz'
                ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Quiz thử tài nhẹ nhàng
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
                className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-700 text-white rounded-br-sm shadow-md'
                    : 'bg-slate-800/90 border border-emerald-900/40 text-slate-200 rounded-bl-sm shadow'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Active Quiz if any */}
          {activeQuiz && (
            <div className="bg-gradient-to-br from-amber-950/50 to-slate-900 border border-amber-700/50 rounded-2xl p-4 my-2 text-slate-100 shadow-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
                <HelpCircle className="w-4 h-4" />
                Câu đố từ Măng Non:
              </div>
              <p className="text-sm font-medium mb-3">{activeQuiz.question}</p>
              <div className="space-y-2">
                {activeQuiz.options.map((opt: string, i: number) => {
                  let btnClass = 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200';
                  if (quizAnswered !== null) {
                    if (i === activeQuiz.correctIndex) {
                      btnClass = 'bg-emerald-800/90 border-emerald-500 text-white font-semibold';
                    } else if (i === quizAnswered) {
                      btnClass = 'bg-red-900/70 border-red-600 text-red-200';
                    } else {
                      btnClass = 'opacity-50 bg-slate-800 border-slate-800';
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
            <div className="flex items-center gap-2 text-xs text-emerald-400 italic">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Măng Non đang lắng nghe và suy ngẫm...
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800">
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
                  ? 'Kể cho Măng Non nghe điều bạn vừa học được...'
                  : 'Gợi ý chủ đề để Măng Non đố bạn...'
              }
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition flex items-center gap-1 shadow-md shadow-emerald-950"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
