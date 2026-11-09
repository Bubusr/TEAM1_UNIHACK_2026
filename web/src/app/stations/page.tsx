'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { Station } from '@/lib/types';
import { Coffee, MapPin, CheckCircle2, Ticket, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  useEffect(() => {
    setStations(StorageService.getStations());
  }, []);

  const handleCheckin = (stationId: string) => {
    setCheckingInId(stationId);

    setTimeout(() => {
      const claimed = StorageService.checkinStation(stationId);
      if (claimed) {
        setStations(StorageService.getStations());
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      setCheckingInId(null);
    }, 1200);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏮</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-300">Trạm Tre (Đối Tác Đời Thực)</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 font-semibold">
              Không gian học tập &amp; Ưu đãi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quán cà phê và trung tâm giáo dục đối tác. Check-in GPS nhẹ nhàng để nhận ưu đãi thực tế và kích hoạt phản ứng đặc biệt từ Măng Non.
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-emerald-800/40 flex items-start gap-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-300">Tôn trọng quyền riêng tư (Privacy-first):</strong> Cơ chế check-in chỉ xác thực toạ độ tương đối tại trạm đối tác để chống gian lận voucher — tuyệt đối không lưu vết lịch sử di chuyển hay hành trình cá nhân của bạn.
        </div>
      </div>

      {/* Stations List */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.map((st) => (
          <div
            key={st.id}
            className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
              st.claimed
                ? 'bg-slate-900/60 border-slate-800 opacity-90'
                : 'bg-slate-900/90 border-emerald-800/60 hover:border-emerald-500 shadow-xl'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5" />
                  Trạm Tre
                </span>
                {st.claimed && (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhận ưu đãi
                  </span>
                )}
              </div>

              <h3 className="font-bold text-base text-slate-100">{st.name}</h3>
              <p className="text-xs text-slate-400 flex items-start gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>{st.address}</span>
              </p>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {st.description}
              </p>

              {/* Voucher Card */}
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-900/80 text-emerald-300">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-emerald-400 font-semibold">Ưu đãi độc quyền:</div>
                  <div className="text-xs font-bold text-white mt-0.5">{st.voucherReward}</div>
                </div>
              </div>
            </div>

            {/* Checkin Button or Code display */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              {st.claimed ? (
                <div className="flex items-center justify-between text-xs font-mono bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Mã voucher:</span>
                  <span className="text-amber-300 font-bold">{st.voucherCode}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleCheckin(st.id)}
                  disabled={checkingInId === st.id}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" />
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
