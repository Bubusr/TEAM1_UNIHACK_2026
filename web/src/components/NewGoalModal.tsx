'use client';

import React, { useState } from 'react';
import { Goal, GoalLevel, Personality, GoalStats, CognitiveStage } from '@/lib/types';
import BambooCanvas from './BambooCanvas';
import { X, Sparkles, Wand2, ShieldCheck, Zap } from 'lucide-react';

interface NewGoalModalProps {
  onClose: () => void;
  onGoalCreated: (goal: Goal) => void;
}

export default function NewGoalModal({ onClose, onGoalCreated }: NewGoalModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
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
    { id: 'curious', name: 'Tò mò', desc: 'Hỏi dồn dập, tò mò về thế giới' },
    { id: 'calm', name: 'Điềm tĩnh', desc: 'Trầm lặng, kiên định lắng nghe' },
    { id: 'excited', name: 'Hào hứng', desc: 'Năng nổ, hay đố vui & động viên' },
    { id: 'shy', name: 'Nhút nhát', desc: 'Rụt rè, cần cậu chủ động bắt chuyện' },
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
        setSuggestionNote(data.explanation || 'AI đã gợi ý chỉ số phù hợp!');
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
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="28" ry="38" fill="%236B8F71"/><circle cx="42" cy="42" r="4" fill="%231B2A2F"/><circle cx="58" cy="42" r="4" fill="%231B2A2F"/><path d="M44 54 Q50 62 56 54" stroke="%231B2A2F" stroke-width="2.5" fill="none"/><polygon points="50,14 40,28 60,28" fill="%233E5C45"/></svg>';

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: name.trim(),
      level,
      personality,
      cognitiveStage: 'raw_curiosity', // Giai đoạn 1: Tò mò thô
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-abyss/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-forest-deep border-2 border-bamboo-mid/50 rounded-3xl shadow-2xl p-5 sm:p-6 text-dongho-paper max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-dongho-paper/60 hover:text-dongho-paper hover:bg-forest-mist transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-warm-glow text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-warm-glow" />
            {step === 1 ? 'Bước 1 / 2: Điểm xuất phát' : 'Bước 2 / 2: Thổi hồn sinh mệnh'}
          </div>
          <h2 className="text-xl font-bold text-warm-glow mt-1">
            {step === 1 ? 'Khởi tạo Goal & Chỉ số Măng Non' : 'Vẽ hoặc Tải ảnh sinh linh của riêng cậu'}
          </h2>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Tên Goal */}
            <div>
              <label className="block text-xs font-medium text-dongho-paper/80 mb-1">
                Tên Mục Tiêu (Goal):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Chinh phục IELTS 7.5, Đọc 10 trang sách mỗi ngày..."
                  className="flex-1 bg-forest-darker border border-bamboo-mid/40 rounded-xl px-3.5 py-2 text-sm text-dongho-paper focus:outline-none focus:border-warm-amber"
                />
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={!name.trim() || suggesting}
                  className="px-3.5 py-2 rounded-xl bg-forest-mist hover:bg-bamboo-deep border border-bamboo-soft text-warm-glow text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {suggesting ? 'Đang phân tích...' : 'AI gợi ý'}
                </button>
              </div>
              {suggestionNote && (
                <p className="text-[11px] text-warm-glow mt-1.5 bg-forest-darker/80 p-2.5 rounded-lg border border-warm-amber/30">
                  💡 {suggestionNote}
                </p>
              )}
            </div>

            {/* Cấp độ */}
            <div>
              <label className="block text-xs font-medium text-dongho-paper/80 mb-1.5">
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
                        ? 'bg-bamboo-deep border-warm-amber text-warm-glow shadow'
                        : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/60 hover:text-dongho-paper'
                    }`}
                  >
                    {lvl === 'beginner' ? 'Khởi đầu' : lvl === 'intermediate' ? 'Vững bước' : 'Đào sâu'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tính cách */}
            <div>
              <label className="block text-xs font-medium text-dongho-paper/80 mb-1.5">
                Tính cách Măng Non đồng hành:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {personalities.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersonality(p.id as Personality)}
                    className={`text-left p-2.5 rounded-xl border transition ${
                      personality === p.id
                        ? 'bg-bamboo-deep border-warm-amber text-warm-glow shadow'
                        : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/60 hover:text-dongho-paper'
                    }`}
                  >
                    <div className="text-xs font-semibold text-dongho-paper">{p.name}</div>
                    <div className="text-[10px] text-dongho-paper/60 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mầm Lực Vault */}
            <div className="p-3.5 rounded-2xl bg-warm-wood/15 border border-warm-amber/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warm-amber" />
                  <span className="text-xs font-semibold text-warm-glow">
                    Gửi Mầm Lực Vault (Cam kết On-chain)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasVault}
                  onChange={(e) => setHasVault(e.target.checked)}
                  className="accent-warm-amber w-4 h-4 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-dongho-paper/75 leading-relaxed">
                Khoá một khoản testnet AVAX cam kết. Khi hoàn thành: 100% vốn gốc hoàn trả về ví cậu, trích 30% mock-yield sẻ chia nuôi Cây Đa Phù Đổng!
              </p>
              {hasVault && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-dongho-paper/70">Số lượng:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={vaultAmount}
                    onChange={(e) => setVaultAmount(e.target.value)}
                    className="w-28 bg-forest-darker border border-warm-amber/60 rounded-lg px-2.5 py-1 text-xs text-warm-glow focus:outline-none"
                  />
                  <span className="text-xs text-warm-amber font-bold">AVAX (Fuji Testnet)</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs transition disabled:opacity-40 shadow-lg"
              >
                Tiếp theo: Họa hình Măng Non →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <BambooCanvas onSave={(data) => setDrawnImage(data)} initialImage={drawnImage} />

            <div className="w-full flex items-center justify-between pt-3 border-t border-bamboo-mid/20">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-dongho-paper/60 hover:text-dongho-paper transition"
              >
                ← Quay lại điều chỉnh
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs shadow-xl flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-forest-abyss" />
                Khởi sinh Măng Non!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
