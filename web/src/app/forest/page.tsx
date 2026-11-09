'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { Goal } from '@/lib/types';
import InteractiveForestCanvas from '@/components/InteractiveForestCanvas';
import ChatModal from '@/components/ChatModal';
import NewGoalModal from '@/components/NewGoalModal';
import RestGoalModal from '@/components/RestGoalModal';
import GlowingBambooModal from '@/components/GlowingBambooModal';
import { Plus, Sparkles, Link2, Info, Moon, Sun, Zap, Compass, Trees } from 'lucide-react';

export default function ForestPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [goalToRest, setGoalToRest] = useState<Goal | null>(null);
  const [showGlowingBamboo, setShowGlowingBamboo] = useState(false);

  useEffect(() => {
    loadGoals();
    setShowGlowingBamboo(true); // Luôn có ống nứa phát sáng lấp lánh trong rừng để tương tác
  }, []);

  const loadGoals = () => {
    const all = StorageService.getGoals();
    setGoals(all.filter((g) => !g.isResting));
  };

  const handleGoalCreated = (newGoal: Goal) => {
    StorageService.addGoal(newGoal);
    setShowNewGoalModal(false);
    loadGoals();
  };

  const handleGoalUpdated = (updated: Goal) => {
    setSelectedGoal(updated);
    loadGoals();
  };

  const activeGoals = goals.filter((g) => !g.isResting);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto flex flex-col text-dongho-paper">
      {/* Header bar gọn gàng kiểu game */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-bamboo-mid/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎋</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-warm-glow">Rừng Tre Cổ (Interactive World)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-bamboo-soft text-bamboo-light font-semibold">
              {activeGoals.length}/5 Măng Non đang dạo chơi
            </span>
          </div>
          <p className="text-xs text-dongho-paper/70 mt-0.5 italic">
            Thế giới mở sinh động: Măng Non tự do nhảy nhót và khám phá khu rừng. Nhấp vào mặt đất để gọi sinh linh hoặc nhấp trực tiếp để tâm sự!
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewGoalModal(true)}
            disabled={activeGoals.length >= 5}
            className="px-4 py-2 rounded-xl bg-warm-amber hover:bg-warm-glow disabled:opacity-40 text-forest-abyss text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4 text-forest-abyss" />
            Vẽ Măng Non thả vào rừng
          </button>
        </div>
      </div>

      {/* 2D Interactive Game World Canvas */}
      <div className="mt-4 flex-1">
        <InteractiveForestCanvas
          goals={activeGoals}
          onSelectGoal={(goal) => setSelectedGoal(goal)}
          onOpenNewGoal={() => setShowNewGoalModal(true)}
          onOpenGlowingBamboo={() => setShowGlowingBamboo(true)}
          hasGlowingBamboo={showGlowingBamboo}
        />
      </div>

      {/* Danh sách thẻ sinh linh nhỏ bên dưới để xem nhanh chỉ số */}
      {activeGoals.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-dongho-paper/80 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-warm-glow" />
            Sinh linh đang sống trong khu rừng của bạn:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeGoals.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGoal(g)}
                className="p-3 rounded-2xl bg-forest-deep/85 border border-bamboo-mid/40 hover:border-warm-amber/60 cursor-pointer transition flex items-center gap-3 shadow-md group"
              >
                <div className="w-12 h-12 rounded-xl bg-forest-darker border border-bamboo-mid/30 flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={g.imageUri}
                    alt={g.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-dongho-paper group-hover:text-warm-glow truncate">
                    {g.name}
                  </div>
                  <div className="text-[10px] text-dongho-paper/60 mt-0.5">
                    {g.interactionCount} lần tâm sự · {g.personality}
                  </div>
                  <div className="text-[10px] text-warm-amber font-mono mt-1">
                    Trí tuệ: {g.stats.intelligence} | Kiên trì: {g.stats.perseverance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedGoal && (
        <ChatModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onGoalUpdated={handleGoalUpdated}
          onRestGoal={(goal) => {
            setSelectedGoal(null);
            setGoalToRest(goal);
          }}
        />
      )}

      {showNewGoalModal && (
        <NewGoalModal
          onClose={() => setShowNewGoalModal(false)}
          onGoalCreated={handleGoalCreated}
        />
      )}

      {goalToRest && (
        <RestGoalModal
          goal={goalToRest}
          onClose={() => setGoalToRest(null)}
          onFinished={() => {
            setGoalToRest(null);
            loadGoals();
          }}
        />
      )}

      {showGlowingBamboo && (
        <GlowingBambooModal
          onClose={() => setShowGlowingBamboo(false)}
          onClaimBonus={() => {
            const all = StorageService.getGoals();
            all.forEach((g) => {
              if (!g.isResting) {
                g.stats.intelligence += 15;
                g.stats.perseverance += 15;
              }
            });
            StorageService.saveGoals(all);
            loadGoals();
          }}
        />
      )}
    </div>
  );
}
