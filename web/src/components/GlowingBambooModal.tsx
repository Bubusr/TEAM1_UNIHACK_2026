'use client';

import React, { useState } from 'react';
import { Sparkles, X, Gift, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GlowingBambooModalProps {
  onClose: () => void;
  onClaimBonus: () => void;
}

export default function GlowingBambooModal({ onClose, onClaimBonus }: GlowingBambooModalProps) {
  const [opened, setOpened] = useState(false);

  const handleOpen = () => {
    setOpened(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    onClaimBonus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 text-center shadow-2xl shadow-amber-500/20 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
            <span className="text-5xl animate-bounce">🎋</span>
            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-40"></div>
          </div>
        </div>

        {!opened ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Sự kiện ngẫu nhiên trong Rừng Tre
            </div>
            <h3 className="text-xl font-bold text-amber-200">Ống Nứa Phát Sáng!</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Bạn tình cờ bắt gặp một ống nứa rực rỡ ánh vàng lấp lánh giữa màn đêm rừng tre. Bên trong dường như chứa một thông điệp cổ xưa và mầm lực ban phước...
            </p>

            <button
              onClick={handleOpen}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-xl shadow-amber-900/50 flex items-center justify-center gap-2 transition"
            >
              <Gift className="w-4 h-4 text-slate-950" />
              Mở Ống Nứa &amp; Nhận Phước Lành
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="text-3xl mb-2">🌟</div>
            <h3 className="text-lg font-bold text-amber-300">Phước Lành Cổ Xưa Kaguya &amp; Gióng</h3>
            <p className="text-xs text-emerald-200/90 italic mt-2 bg-emerald-950/60 p-3 rounded-2xl border border-emerald-800/60">
              &quot;Mọi sinh linh lớn lên từ rễ tre đều mang sức mạnh của sự chở che và lòng kiên định. Hãy tiếp tục bước đi cùng người bạn nhỏ của mình.&quot;
            </p>
            <div className="mt-4 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              +15 Mầm Lực lan tỏa cho tất cả Măng Non!
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
            >
              Đóng lại &amp; Tiếp tục khám phá
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
