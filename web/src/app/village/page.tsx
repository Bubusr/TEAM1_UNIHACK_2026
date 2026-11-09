'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { VillageTreeState } from '@/lib/types';
import { Landmark, Sparkles, HeartHandshake, ShieldCheck, Flame, Gift, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VillagePage() {
  const [treeState, setTreeState] = useState<VillageTreeState>(StorageService.getVillageTree());
  const [sponsorAmount, setSponsorAmount] = useState('50');
  const [justBlessed, setJustBlessed] = useState(false);

  useEffect(() => {
    setTreeState(StorageService.getVillageTree());
  }, []);

  const progressPercent = Math.min(100, Math.round((treeState.currentCycleEnergy / treeState.threshold) * 100));

  const handleSponsorContribute = () => {
    const val = parseInt(sponsorAmount, 10) || 50;
    const { tree, blessed } = StorageService.addEnergyToTree(val);
    setTreeState({ ...tree });

    if (blessed) {
      triggerBlessingAnimation();
    }
  };

  const triggerBlessingAnimation = () => {
    setJustBlessed(true);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.4 },
      colors: ['#f59e0b', '#10b981', '#34d399', '#fbbf24'],
    });
    setTimeout(() => setJustBlessed(false), 5000);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-300">Làng Phù Đổng</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-400 font-semibold">
              Mùa thứ {treeState.blessingCycleCount}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Không gian chung của cộng đồng. Mỗi mục tiêu an nghỉ sẽ trích một phần mock-yield từ Mầm Lực Vault để nuôi lớn Cây Làng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Tổng mầm lực tích lũy: <strong>{treeState.totalLifetimeEnergy}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Village Tree Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sacred Village Tree Visualization */}
        <div className="lg:col-span-2 relative rounded-3xl bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950 border-2 border-amber-800/50 p-6 sm:p-10 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none"></div>

          {/* Tree Avatar */}
          <div className="relative mb-6">
            <div className={`w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-t from-emerald-950/80 to-amber-950/60 border-2 border-amber-600/40 flex items-center justify-center text-7xl sm:text-8xl shadow-2xl ${justBlessed ? 'animate-bounce' : 'animate-breathe'}`}>
              🌳
            </div>
            {justBlessed && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg animate-pulse whitespace-nowrap">
                🌟 CÂY LÀNG BÙNG NỔ BAN PHƯỚC! 🌟
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-amber-200">
            Cây Làng Phù Đổng (Village Tree)
          </h2>
          <p className="text-xs text-slate-300 max-w-md mt-2 leading-relaxed">
            Hợp đồng trên <strong className="text-emerald-300">Avalanche C-Chain</strong> ghi nhận minh bạch từng giọt mầm lực đóng góp. Khi năng lượng đạt ngưỡng, cây sẽ bùng nổ ban phước hào quang và sức mạnh ngược lại cho mọi Măng Non đang sống.
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-md mt-6">
            <div className="flex justify-between text-xs text-slate-300 mb-2 font-medium">
              <span>Tiến trình mùa {treeState.blessingCycleCount}:</span>
              <span className="font-mono text-amber-300">
                {treeState.currentCycleEnergy} / {treeState.threshold} Mầm Lực ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-900 rounded-full p-0.5 border border-amber-900/60 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Sidebar: CSR Sponsors & Contributions */}
        <div className="flex flex-col gap-6">
          {/* CSR Sponsor Box */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-amber-800/50 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              <HeartHandshake className="w-4 h-4" />
              Doanh nghiệp / Nhà tài trợ CSR
            </div>
            <h3 className="font-bold text-base text-slate-100">Đóng Góp Năng Lượng Cộng Đồng</h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Mô hình &quot;khắc tên vào truyền thuyết&quot;: Khi tài trợ năng lượng cho Cây Làng, tên doanh nghiệp sẽ xuất hiện trong sự kiện bùng nổ ban phước của cả cộng đồng.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min="10"
                step="20"
                value={sponsorAmount}
                onChange={(e) => setSponsorAmount(e.target.value)}
                className="w-24 bg-slate-950 border border-amber-700/60 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none"
              />
              <span className="text-xs text-slate-400">Mầm lực</span>
              <button
                onClick={handleSponsorContribute}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition shadow-md"
              >
                + Tài trợ ngay
              </button>
            </div>
          </div>

          {/* On-chain Transparency Box */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-800/50 backdrop-blur-md shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                <ShieldCheck className="w-4 h-4" />
                Minh Bạch Tuyệt Đối On-Chain
              </div>
              <h3 className="font-bold text-base text-slate-100">Tại sao cần Avalanche?</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Không ai (kể cả admin) có thể rút ruột quỹ đóng góp hoặc sửa số liệu Cây Làng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>ICM (Teleporter) truyền tín hiệu mầm lực giữa Game Subnet L1 và C-Chain mượt mà.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Thời gian hoàn tất giao dịch ~1 giây giúp trải nghiệm bùng nổ diễn ra tức thì.</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Hợp đồng: 0x93F...1c7E</span>
              <span className="text-emerald-400">Fuji Testnet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
