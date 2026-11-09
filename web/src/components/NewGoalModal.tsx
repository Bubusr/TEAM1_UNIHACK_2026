'use client';

import React, { useState } from 'react';
import { Goal, GoalLevel, Personality, GoalStats } from '@/lib/types';
import BambooCanvas from './BambooCanvas';
import { X, Sparkles, Wand2, ShieldCheck, Zap } from 'lucide-react';

interface NewGoalModalProps {
  onClose: () => void;
  onGoalCreated: (goal: Goal) => void;
}

export default function NewGoalModal({ onClose, onGoalCreated }: NewGoalModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Info & Stats, 2: Vẽ Măng Non
  const [name, setName] = useState('');
  const [level, setLevel] = useState<GoalLevel>('beginner');
  const [personality, setPersonality] = useState<Personality>('curious');
  const [stats, setStats] = useState<GoalStats>({
    intelligence: 50,
    perseverance: 50,
    fitness: 30,
    creativity: 40,
  });
  const [hasVault, setHasVault] = useState(false);
  const [vaultAmount, setVaultAmount] = useState('0.1');
  const [drawnImage, setDrawnImage] = useState<string>('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState('');

  const personalities = [
    { id: 'curious', name: 'Tò mò', desc: 'Hỏi nhiều, hỏi sâu về thế giới' },
    { id: 'calm', name: 'Điềm tĩnh', desc: 'Trầm lặng, kiên định lắng nghe' },
    { id: 'excited', name: 'Hào hứng', desc: 'Năng nổ, thích đố vui & động viên' },
    { id: 'shy', name: 'Nhút nhát', desc: 'Rụt rè, cần bạn chủ động bắt chuyện' },
  ];

  const handleAiSuggest = async () => {
    if (!name.trim()) return;
    setSuggesting(true);
    try {
      const res = await fetch('/api/suggest-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalName: name }),
      });
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        if (data.suggestedPersonality) setPersonality(data.suggestedPersonality);
        setSuggestionNote(data.explanation || 'AI đã điều chỉnh chỉ số phù hợp!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSuggesting(false);
    }
  };

  const handleFinish = () => {
    if (!name.trim()) return;

    const defaultSvg =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="28" ry="38" fill="%234ade80"/><circle cx="42" cy="42" r="4" fill="%230f172a"/><circle cx="58" cy="42" r="4" fill="%230f172a"/><path d="M44 54 Q50 62 56 54" stroke="%230f172a" stroke-width="2.5" fill="none"/><polygon points="50,14 40,28 60,28" fill="%2322c55e"/></svg>';

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: name.trim(),
      level,
      personality,
      imageUri: drawnImage || defaultSvg,
      stats,
      interactionCount: 0,
      createdAt: Date.now(),
      lastInteraction: Date.now(),
      hasVault,
      vaultPrincipal: hasVault ? parseFloat(vaultAmount) || 0.1 : 0,
      mockYieldAccumulated: 0,
      isResting: false,
      journal: [],
    };

    onGoalCreated(newGoal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-800/60 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            {step === 1 ? 'Bước 1 / 2: Xác lập mục tiêu' : 'Bước 2 / 2: Thổi hồn sinh mệnh'}
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            {step === 1 ? 'Khởi tạo Goal & Chỉ số Măng Non' : 'Vẽ hoặc Tải ảnh sinh linh Măng Non'}
          </h2>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Tên Goal */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tên Mục Tiêu (Goal):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Luyện IELTS 7.5, Học bơi sải, Đọc 12 cuốn sách..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={!name.trim() || suggesting}
                  className="px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {suggesting ? 'Đang phân tích...' : 'AI gợi ý'}
                </button>
              </div>
              {suggestionNote && (
                <p className="text-[11px] text-emerald-400 mt-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/50">
                  💡 {suggestionNote}
                </p>
              )}
            </div>

            {/* Cấp độ */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cấp độ trải nghiệm:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as GoalLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border capitalize transition ${
                      level === lvl
                        ? 'bg-emerald-800/80 border-emerald-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl === 'beginner' ? 'Mới bắt đầu' : lvl === 'intermediate' ? 'Trung bình' : 'Nâng cao'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tính cách */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tính cách của Măng Non đồng hành:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {personalities.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersonality(p.id as Personality)}
                    className={`text-left p-2.5 rounded-xl border transition ${
                      personality === p.id
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mầm Lực Vault (DeFi Cam kết) */}
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">
                    Gửi Mầm Lực Vault (Cam kết On-chain)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasVault}
                  onChange={(e) => setHasVault(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-amber-200/80">
                Khoá một khoản testnet AVAX cam kết. Giữ càng lâu sinh mock-yield càng cao. Khi Goal an nghỉ: Hoàn trả 100% vốn gốc, trích 30% mock-yield góp vào Cây Làng!
              </p>
              {hasVault && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-300">Số lượng:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={vaultAmount}
                    onChange={(e) => setVaultAmount(e.target.value)}
                    className="w-28 bg-slate-950 border border-amber-700/60 rounded-lg px-2.5 py-1 text-xs text-amber-300 focus:outline-none"
                  />
                  <span className="text-xs text-amber-400 font-bold">AVAX (Fuji Testnet)</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition disabled:opacity-50 shadow-lg shadow-emerald-950"
              >
                Tiếp theo: Họa hình Măng Non →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <BambooCanvas onSave={(data) => setDrawnImage(data)} initialImage={drawnImage} />

            <div className="w-full flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                ← Quay lại điều chỉnh
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-950 flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Khởi sinh Măng Non!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
