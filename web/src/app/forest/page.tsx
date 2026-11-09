'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { Goal } from '@/lib/types';
import AnimatedMangNon from '@/components/AnimatedMangNon';
import ChatModal from '@/components/ChatModal';
import NewGoalModal from '@/components/NewGoalModal';
import RestGoalModal from '@/components/RestGoalModal';
import GlowingBambooModal from '@/components/GlowingBambooModal';
import { Plus, Sparkles, Link2, Info, Moon, Sun, Zap, Compass } from 'lucide-react';

export default function ForestPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [goalToRest, setGoalToRest] = useState<Goal | null>(null);
  const [showGlowingBamboo, setShowGlowingBamboo] = useState(false);
  const [linkingMode, setLinkingMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();

    // Xác suất 40% xuất hiện Ống nứa phát sáng ngẫu nhiên khi ghé thăm
    const hasGlowing = Math.random() < 0.45;
    setShowGlowingBamboo(hasGlowing);
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

  const handleLinkClick = (clickedGoalId: string) => {
    if (!linkingMode) return;

    if (!linkSourceId) {
      setLinkSourceId(clickedGoalId);
    } else {
      if (linkSourceId !== clickedGoalId) {
        // Nối 2 goals
        const allGoals = StorageService.getGoals();
        const g1 = allGoals.find((g) => g.id === linkSourceId);
        const g2 = allGoals.find((g) => g.id === clickedGoalId);

        if (g1 && g2) {
          g1.linkedGoalId = g2.id;
          g2.linkedGoalId = g1.id;
          StorageService.updateGoal(g1);
          StorageService.updateGoal(g2);
          loadGoals();
        }
      }
      setLinkingMode(false);
      setLinkSourceId(null);
    }
  };

  const activeGoals = goals.filter((g) => !g.isResting);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎋</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-300">Rừng Tre Cổ</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-semibold">
              {activeGoals.length}/5 Măng Non hoạt động
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Không gian riêng tư của bạn. Măng Non lớn lên qua việc bạn chia sẻ điều vừa học — không áp lực hạn chót, không phạt streak.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nối Goal button */}
          <button
            onClick={() => {
              setLinkingMode(!linkingMode);
              setLinkSourceId(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              linkingMode
                ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {linkingMode ? (linkSourceId ? 'Chọn Goal thứ 2 để nối...' : 'Chọn Goal thứ nhất...') : 'Map nối chỉ số'}
          </button>

          {/* Trồng Goal mới */}
          <button
            onClick={() => setShowNewGoalModal(true)}
            disabled={activeGoals.length >= 5}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            Trồng Măng Non mới
          </button>
        </div>
      </div>

      {/* Linking Mode Helper */}
      {linkingMode && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            {linkSourceId
              ? 'Bây giờ hãy nhấp vào Măng Non thứ 2 bạn muốn kết nối.'
              : 'Hãy nhấp vào Măng Non thứ nhất trên bản đồ để bắt đầu nối dây năng lượng lan toả 20% chỉ số!'}
          </span>
        </div>
      )}

      {/* Forest Field Canvas */}
      <div className="relative flex-1 mt-6 rounded-3xl bg-gradient-to-b from-slate-950 via-emerald-950/30 to-slate-950 border-2 border-emerald-900/60 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Background Bamboo Silhouette */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:24px_24px]"></div>

        {/* Floating Glowing Bamboo Tube Event */}
        {showGlowingBamboo && (
          <div
            onClick={() => setShowGlowingBamboo(true)}
            className="absolute top-8 right-8 z-20 cursor-pointer group"
          >
            <div className="relative flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/50 animate-pulse">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🎋
                </div>
              </div>
              <span className="mt-1.5 text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/60 shadow">
                Ống Nứa Phát Sáng!
              </span>
            </div>
          </div>
        )}

        {/* Bamboo Forest Spirits Grid */}
        {activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 py-8 items-center justify-items-center">
            {activeGoals.map((g) => {
              const isSelectedForLink = linkSourceId === g.id;
              const hasLink = !!g.linkedGoalId;

              return (
                <div
                  key={g.id}
                  onClick={() => {
                    if (linkingMode) {
                      handleLinkClick(g.id);
                    } else {
                      setSelectedGoal(g);
                    }
                  }}
                  className={`relative p-5 rounded-3xl transition-all duration-300 ${
                    isSelectedForLink
                      ? 'ring-4 ring-amber-400 bg-amber-950/40 scale-105'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* Energy Link indicator */}
                  {hasLink && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-800/60">
                      <Link2 className="w-3 h-3 text-amber-400" />
                      <span>Đã nối chỉ số</span>
                    </div>
                  )}

                  <AnimatedMangNon
                    goal={g}
                    size="md"
                    showStats={true}
                  />

                  {!linkingMode && (
                    <div className="mt-2 text-center">
                      <span className="text-[11px] text-emerald-400 font-medium group-hover:underline">
                        Nhấp để trò chuyện &amp; tương tác →
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <span className="text-6xl mb-3">🎋</span>
            <h3 className="text-lg font-bold text-emerald-300">Rừng Tre Cổ đang yên ắng</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Bạn chưa có sinh linh Măng Non nào đang hoạt động. Hãy khởi sinh Măng Non đầu tiên của bạn ngay nào!
            </p>
            <button
              onClick={() => setShowNewGoalModal(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
            >
              + Khởi sinh Măng Non
            </button>
          </div>
        )}

        {/* Bottom Forest Info strip */}
        <div className="pt-4 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Mẹo: Nếu bạn bận nhiều ngày, Măng Non chỉ &quot;ngủ&quot;, không bị trừ điểm hay chết.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Thời gian thực: Đêm Rừng Tre
            </span>
          </div>
        </div>
      </div>

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
            // Tặng 15 chỉ số cho tất cả active goals
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
