'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { Station } from '@/lib/types';
import { SoundEngine } from '@/lib/sound-engine';
import { Coffee, MapPin, CheckCircle2, Ticket, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  useEffect(() => {
    setStations(StorageService.getStations());
  }, []);

  const handleCheckin = (stationId: string) => {
    SoundEngine.playBambooKnock();
    setCheckingInId(stationId);

    setTimeout(() => {
      const claimed = StorageService.checkinStation(stationId);
      if (claimed) {
        SoundEngine.playBlessingChime();
        setStations(StorageService.getStations());
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD166', '#F4A259', '#6B8F71', '#E63946'],
        });
      }
      setCheckingInId(null);
    }, 1200);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-dongho-paper">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-bamboo-mid/30">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏮</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-warm-glow">Trạm Tre (Đối Tác Đời Thực)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-bamboo-soft text-warm-amber font-semibold">
              Không gian học tập &amp; Ưu đãi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dongho-paper/70 mt-1 italic">
            Quán cà phê và trung tâm giáo dục đối tác. Check-in GPS nhẹ nhàng để nhận ưu đãi thực tế và kích hoạt phản ứng từ Măng Non.
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 rounded-2xl bg-forest-deep border border-bamboo-mid/40 flex items-start gap-3 text-xs text-dongho-paper/80">
        <ShieldCheck className="w-5 h-5 text-warm-amber flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-warm-glow">Tôn trọng quyền riêng tư (Privacy-first):</strong> Cơ chế check-in chỉ xác thực toạ độ tương đối tại trạm đối tác để chống gian lận voucher — tuyệt đối không theo dõi hành trình di chuyển hay lưu GPS cá nhân lên blockchain.
        </div>
      </div>

      {/* Stations List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.map((st) => (
          <div
            key={st.id}
            className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${
              st.claimed
                ? 'bg-forest-deep/60 border-bamboo-mid/20 opacity-80'
                : 'bg-forest-deep/90 border-bamboo-mid/50 hover:border-warm-glow shadow-2xl'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-forest-darker border border-bamboo-soft text-warm-glow flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-warm-amber" />
                  Trạm Tre
                </span>
                {st.claimed && (
                  <span className="text-xs font-bold text-warm-glow flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-warm-glow" /> Đã nhận ưu đãi
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-dongho-paper">{st.name}</h3>
              <p className="text-xs text-dongho-paper/60 flex items-start gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-bamboo-soft flex-shrink-0 mt-0.5" />
                <span>{st.address}</span>
              </p>

              <p className="text-xs text-dongho-paper/75 mt-3 leading-relaxed">
                {st.description}
              </p>

              {/* Voucher Card */}
              <div className="mt-4 p-3.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/30 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-forest-deep text-warm-glow">
                  <Ticket className="w-5 h-5 text-warm-amber" />
                </div>
                <div>
                  <div className="text-[11px] text-warm-amber font-semibold">Ưu đãi đối tác:</div>
                  <div className="text-xs font-bold text-dongho-paper mt-0.5">{st.voucherReward}</div>
                </div>
              </div>
            </div>

            {/* Checkin Button or Code display */}
            <div className="mt-6 pt-4 border-t border-bamboo-mid/20">
              {st.claimed ? (
                <div className="flex items-center justify-between text-xs font-mono bg-forest-darker px-3.5 py-2 rounded-xl border border-bamboo-mid/30">
                  <span className="text-dongho-paper/60">Mã voucher:</span>
                  <span className="text-warm-glow font-bold">{st.voucherCode}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleCheckin(st.id)}
                  disabled={checkingInId === st.id}
                  className="w-full py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <MapPin className="w-4 h-4 text-forest-abyss" />
                  {checkingInId === st.id ? 'Đang xác thực GPS...' : 'Check-in GPS tại quán'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
