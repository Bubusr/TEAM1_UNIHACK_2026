'use client';

import React, { useState } from 'react';
import { AppStateData } from '@/lib/app-state';
import { Settings2, X, Sun, Moon, Sparkles, RefreshCw, FastForward, Heart, Flower2 } from 'lucide-react';

interface DemoControlPanelProps {
  state: AppStateData;
  onUpdateState: (updater: (prev: AppStateData) => AppStateData) => void;
  onNavigate: (screen: string) => void;
  onTriggerBloom: () => void;
}

export default function DemoControlPanel({
  state,
  onUpdateState,
  onNavigate,
  onTriggerBloom,
}: DemoControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!state.settings.demoMode) return null;

  const handleSeedMemories = () => {
    const seedTexts = [
      'Cậu kể: Hôm nay vừa tìm thấy một quán cà phê nhỏ ngập nắng',
      'Cậu kể: Bắt đầu học bài học đầu tiên về thuật toán',
      'Cậu kể: Thấy một chú mèo mướp nằm ngủ trên bờ tường',
      'Cậu kể: Cảm thấy hơi đuối sức sau một ngày dài',
      'Cậu kể: Tự thưởng một ly trà hoa cúc ấm',
      'Cậu kể: Đã hoàn thành 5 trang viết đầu tiên',
      'Cậu kể: Nhớ lại kỷ niệm chuyến đi biển cùng gia đình',
      'Cậu kể: Thấy lòng nhẹ nhõm khi nói ra được suy nghĩ',
    ];

    onUpdateState((prev) => {
      const activeId = prev.activeMangnon?.id || 'mn-current';
      const newItems = seedTexts.map((text, idx) => ({
        id: `mem-seed-${Date.now()}-${idx}`,
        mangnonId: activeId,
        text,
        pinned: idx === 0,
        forgotten: false,
        createdAt: new Date(Date.now() - (8 - idx) * 86400000).toISOString(),
      }));

      return {
        ...prev,
        memories: [...newItems, ...prev.memories],
      };
    });
  };

  const handleSimulate7Days = () => {
    onUpdateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        lastOpenedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    }));
    onNavigate('S06');
  };

  return (
    <>
      {/* Nút bật Demo Control Panel nổi ở góc */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Bảng điều khiển thuyết trình 3 phút"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-2.5 rounded-full bg-warm-amber text-forest-abyss font-bold shadow-2xl hover:scale-110 transition border border-forest-abyss"
      >
        <Settings2 className="w-5 h-5 text-forest-abyss" />
      </button>

      {/* Modal Overlay Demo Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-abyss/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-forest-deep border-2 border-warm-amber/60 rounded-3xl p-5 text-dongho-paper shadow-2xl max-h-[88vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-bamboo-mid/30">
              <div className="flex items-center gap-2 font-bold text-warm-glow text-sm">
                <Sparkles className="w-4 h-4 text-warm-amber" />
                Demo Control Panel (3 Phút)
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-dongho-paper/60 hover:text-dongho-paper"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* CHUYỂN NHANH MÀN HÌNH (SCREEN SWITCHER) */}
              <div className="p-2.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-warm-glow uppercase tracking-wider">
                    📍 Chuyển Nhanh Màn Hình
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-warm-amber/20 text-warm-amber font-mono">
                    Hiện tại: {state.currentScreen}
                  </span>
                </div>

                {/* 2 Nút Canvas chính to rõ */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onNavigate('S03');
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                      state.currentScreen === 'S03'
                        ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold shadow-lg'
                        : 'bg-forest-deep hover:bg-forest-mist border-bamboo-mid/40 text-dongho-paper'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span>🎨</span>
                      <span>Studio Vẽ (S03)</span>
                    </div>
                    <span className="text-[9px] opacity-80 mt-1">
                      Nền trắng, 4 cọ, đổ màu, gắn xương
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('S06');
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl text-left border transition flex flex-col justify-between ${
                      state.currentScreen === 'S06'
                        ? 'bg-bamboo-soft text-forest-abyss border-bamboo-soft font-bold shadow-lg'
                        : 'bg-forest-deep hover:bg-forest-mist border-bamboo-mid/40 text-dongho-paper'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span>🎋</span>
                      <span>Rừng Tre (S06)</span>
                    </div>
                    <span className="text-[9px] opacity-80 mt-1">
                      Game canvas tương tác 2D Ghibli
                    </span>
                  </button>
                </div>

                {/* Grid các màn hình còn lại */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
                  {[
                    { id: 'S01', name: 'Ống nứa' },
                    { id: 'S02', name: 'Tách nứa' },
                    { id: 'S04', name: 'Đặt tên' },
                    { id: 'S05', name: 'Gặp đầu' },
                    { id: 'S07', name: 'Kể chuyện' },
                    { id: 'S08', name: 'Kỷ niệm' },
                    { id: 'S11', name: 'Suối ký ức' },
                    { id: 'S12', name: 'Cây Đa Làng' },
                    { id: 'S13', name: 'Cài đặt' },
                  ].map((scr) => (
                    <button
                      key={scr.id}
                      onClick={() => {
                        onNavigate(scr.id);
                        setIsOpen(false);
                      }}
                      className={`py-1 px-1.5 rounded-lg border text-center transition ${
                        state.currentScreen === scr.id
                          ? 'bg-warm-glow text-forest-abyss font-bold border-warm-glow'
                          : 'bg-forest-darker/60 hover:bg-forest-deep text-dongho-paper/70 border-bamboo-mid/20'
                      }`}
                    >
                      {scr.id}: {scr.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Giờ trong ngày */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Giờ trong ngày:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['real', 'morning', 'dusk', 'night'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        onUpdateState((p) => ({
                          ...p,
                          settings: { ...p.settings, timeOverride: t },
                        }))
                      }
                      className={`py-1.5 rounded-lg border font-medium text-[11px] transition ${
                        state.settings.timeOverride === t
                          ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {t === 'real' ? 'Thật' : t === 'morning' ? 'Sáng' : t === 'dusk' ? 'Chiều' : 'Đêm'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mùa trong năm */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Mùa trong năm:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['spring', 'summer', 'autumn', 'winter'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        onUpdateState((p) => ({
                          ...p,
                          settings: { ...p.settings, seasonOverride: s },
                        }))
                      }
                      className={`py-1.5 rounded-lg border font-medium text-[11px] transition ${
                        state.settings.seasonOverride === s
                          ? 'bg-bamboo-soft text-forest-abyss border-bamboo-soft font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {s === 'spring' ? 'Xuân' : s === 'summer' ? 'Hạ' : s === 'autumn' ? 'Thu' : 'Đông'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Giai đoạn nhận thức (1 - 4 lá) */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Giai đoạn nhận thức Măng Non:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([1, 2, 3, 4] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        onUpdateState((p) => {
                          if (!p.activeMangnon) return p;
                          return {
                            ...p,
                            activeMangnon: { ...p.activeMangnon, stage: lvl },
                          };
                        });
                      }}
                      className={`py-1.5 rounded-lg border font-medium text-[11px] transition ${
                        state.activeMangnon?.stage === lvl
                          ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {lvl} Lá
                    </button>
                  ))}
                </div>
              </div>

              {/* Tính cách (chỉ demo) */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Tính cách (Demo):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['tomo', 'diemtinh', 'haohung', 'nhutnhat'] as const).map((pers) => (
                    <button
                      key={pers}
                      onClick={() => {
                        onUpdateState((p) => {
                          if (!p.activeMangnon) return p;
                          return {
                            ...p,
                            activeMangnon: { ...p.activeMangnon, personality: pers },
                          };
                        });
                      }}
                      className={`py-1.5 rounded-lg border font-medium text-[10px] transition ${
                        state.activeMangnon?.personality === pers
                          ? 'bg-warm-glow text-forest-abyss border-warm-glow font-bold'
                          : 'bg-forest-darker border-bamboo-mid/30 text-dongho-paper/70'
                      }`}
                    >
                      {pers === 'tomo' ? 'Tò mò' : pers === 'diemtinh' ? 'Điềm tĩnh' : pers === 'haohung' ? 'Hào hứng' : 'Nhút nhát'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Động tác sinh vật hình người chuẩn Meta Demo Lab & Teri Gumball */}
              <div>
                <label className="block text-[11px] text-dongho-paper/70 font-semibold mb-1">
                  Động tác Meta Demo Lab &amp; Gấu giấy Teri (Gumball):
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  {[
                    { label: '🚶 Đi bộ', action: 'walk' },
                    { label: '🏃 Chạy bộ', action: 'run' },
                    { label: '🤫 Rón rén', action: 'sneak' },
                    { label: '🎉 Nhảy vui', action: 'happy_jump' },
                    { label: '🍃 Bay lơ lửng', action: 'paper_flutter' },
                    { label: '🦘 Lò cò', action: 'hop' },
                    { label: '💃 Múa lượn', action: 'dance' },
                    { label: '👋 Vẫy tay', action: 'wave' },
                    { label: '💫 Xoay tròn', action: 'spin' },
                    { label: '😱 Gấu Teri', action: 'teri_panic' },
                    { label: '😔 Ủ rũ', action: 'sad' },
                    { label: '😴 Gấp giấy', action: 'sleep' },
                  ].map((act) => (
                    <button
                      key={act.action}
                      onClick={() => {
                        onNavigate('S06');
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('mangnon_action', { detail: act.action })
                          );
                        }
                      }}
                      className="py-1.5 rounded-lg bg-forest-darker hover:bg-forest-deep border border-bamboo-mid/30 text-dongho-paper font-medium transition active:scale-95 text-center"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Các nút bấm thao tác nhanh thuyết trình */}
              <div className="pt-2 border-t border-bamboo-mid/30 space-y-2">
                <button
                  onClick={handleSeedMemories}
                  className="w-full py-2 px-3 rounded-xl bg-forest-darker hover:bg-forest-mist border border-bamboo-soft/40 text-left font-medium text-warm-glow flex items-center justify-between"
                >
                  <span>🌱 Thêm 8 ký ức mẫu để thấy callback</span>
                  <Sparkles className="w-3.5 h-3.5 text-warm-amber" />
                </button>

                <button
                  onClick={handleSimulate7Days}
                  className="w-full py-2 px-3 rounded-xl bg-forest-darker hover:bg-forest-mist border border-bamboo-soft/40 text-left font-medium text-bamboo-light flex items-center justify-between"
                >
                  <span>🌙 Mô phỏng quay lại sau 7 ngày</span>
                  <FastForward className="w-3.5 h-3.5 text-bamboo-light" />
                </button>

                <button
                  onClick={() => {
                    onNavigate('S12');
                    onTriggerBloom();
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-dongho-red/30 hover:bg-dongho-red/50 border border-dongho-red/60 text-left font-bold text-dongho-paper flex items-center justify-between"
                >
                  <span>🌸 Kích hoạt hoa gạo bùng nổ Cây Đa</span>
                  <Flower2 className="w-3.5 h-3.5 text-dongho-red" />
                </button>

                <button
                  onClick={() => {
                    onNavigate('S10');
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-warm-wood/30 hover:bg-warm-wood/50 border border-warm-amber/60 text-left font-semibold text-warm-glow flex items-center justify-between"
                >
                  <span>🌊 Nhảy tới Nghi thức An nghỉ (S10)</span>
                  <Heart className="w-3.5 h-3.5 text-warm-glow" />
                </button>

                <button
                  onClick={() => {
                    onUpdateState(() => ({
                      ...state,
                      currentScreen: 'S01',
                      activeMangnon: null,
                      bambooOpened: false,
                    }));
                    onNavigate('S01');
                    setIsOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-forest-abyss hover:bg-forest-darker border border-bamboo-mid/30 text-left font-medium text-dongho-paper/60 hover:text-dongho-red flex items-center justify-between"
                >
                  <span>🔄 Đặt lại từ đầu (Về S01)</span>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
