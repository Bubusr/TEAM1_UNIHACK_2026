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
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD166', '#F4A259', '#6B8F71', '#E63946'],
    });
    onClaimBonus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-gradient-to-b from-forest-darker via-forest-deep to-forest-abyss border-2 border-warm-amber/60 rounded-3xl p-6 text-center shadow-2xl text-dongho-paper">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-dongho-paper/60 hover:text-dongho-paper transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24 rounded-full bg-warm-amber/20 flex items-center justify-center animate-pulse">
            <span className="text-5xl animate-bounce">🎋</span>
            <div className="absolute inset-0 rounded-full border-2 border-warm-glow animate-ping opacity-30"></div>
          </div>
        </div>

        {!opened ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-forest-deep border border-warm-amber/60 text-warm-glow text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-warm-glow" />
              Ống Nứa Phát Sáng Giữa Rừng Đêm
            </div>
            <h3 className="text-xl font-bold text-warm-glow">Ánh Sáng Cổ Tích</h3>
            <p className="text-xs text-dongho-paper/80 mt-2 leading-relaxed italic">
              &quot;Rừng tre chỉ mở ra cánh cửa bằng ánh sáng ấm áp, còn hình hài sinh mệnh bên trong là do chính tay cậu vẽ nên và thổi hồn.&quot;
            </p>

            <button
              onClick={handleOpen}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow hover:from-warm-glow hover:to-warm-amber text-forest-abyss font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition"
            >
              <Gift className="w-4 h-4 text-forest-abyss" />
              Mở Ống Nứa &amp; Nhận Mầm Lực Cổ Xưa
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="text-4xl mb-2">🌟</div>
            <h3 className="text-lg font-bold text-warm-glow">Phước Lành Rừng Tre Kaguya &amp; Gióng</h3>
            <p className="text-xs text-dongho-paper/85 italic mt-2 bg-forest-darker/90 p-3.5 rounded-2xl border border-bamboo-mid/40 leading-relaxed">
              &quot;Mọi sinh linh lớn lên từ rễ tre đều mang sức mạnh của sự chở che và lòng kiên định. Cứ sống cuộc đời của cậu thật rực rỡ, rồi mang về kể lại nhé.&quot;
            </p>
            <div className="mt-4 p-2.5 rounded-xl bg-forest-deep border border-warm-amber/50 text-xs font-semibold text-warm-glow flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-warm-glow fill-warm-glow" />
              +15 Mầm Lực lan tỏa cho tất cả Măng Non!
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-forest-deep hover:bg-forest-mist text-dongho-paper font-medium text-xs transition border border-bamboo-mid/30"
            >
              Đóng lại &amp; Tiếp tục bước đi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
