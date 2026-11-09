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
    // Hoa gạo nở đỏ rực (#E63946) & đom đóm rợp trời (#FFD166, #F4A259)
    confetti({
      particleCount: 140,
      spread: 100,
      origin: { y: 0.4 },
      colors: ['#E63946', '#FFD166', '#F4A259', '#6B8F71', '#C1121F'],
    });
    setTimeout(() => setJustBlessed(false), 5000);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-dongho-paper">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-warm-amber/30">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏛️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-warm-amber">Làng Phù Đổng</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-warm-amber/60 text-warm-glow font-semibold">
              Mùa thứ {treeState.blessingCycleCount}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dongho-paper/70 mt-1 italic">
            Hiện thân của cộng đồng. Mỗi mục tiêu an nghỉ sẽ trích mock-yield từ Mầm Lực Vault để nuôi Cây Đa Phù Đổng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-forest-deep border border-warm-amber/40 text-xs text-warm-glow flex items-center gap-1.5 shadow">
            <Flame className="w-4 h-4 text-warm-amber fill-warm-amber" />
            <span>Tổng mầm lực cộng đồng: <strong>{treeState.totalLifetimeEnergy}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Village Tree Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cây Đa Phù Đổng Visualization */}
        <div className="lg:col-span-2 relative rounded-3xl bg-gradient-to-b from-forest-darker via-forest-deep to-forest-abyss border-2 border-warm-amber/40 p-6 sm:p-10 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-warm-amber/10 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Tree Avatar */}
          <div className="relative mb-6">
            <div className={`w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-t from-forest-abyss to-bamboo-deep/60 border-2 border-warm-amber/50 flex items-center justify-center text-7xl sm:text-8xl shadow-2xl ${justBlessed ? 'animate-bounce' : 'animate-breathe'}`}>
              🌳
            </div>
            {justBlessed && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-dongho-red to-warm-amber text-dongho-paper font-extrabold text-xs px-5 py-2 rounded-full shadow-xl animate-pulse whitespace-nowrap">
                🌸 HOA GẠO NỞ ĐỎ RỰC · ĐOM ĐÓM BAY RỢP TRỜI! 🌟
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-warm-glow">
            Cây Đa Phù Đổng (Cây Làng Cổ Thụ)
          </h2>
          <p className="text-xs text-dongho-paper/80 max-w-md mt-2 leading-relaxed">
            Rễ cây ăn sâu vào lòng đất tượng trưng cho cội rễ chung của cộng đồng. Khi mầm lực đạt ngưỡng, hoa gạo đỏ rực sẽ bung nở và đom đóm bay rợp trời, ban phước ngược lại cho mọi Măng Non đang sống.
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-md mt-6">
            <div className="flex justify-between text-xs text-dongho-paper/80 mb-2 font-medium">
              <span>Tiến trình mùa {treeState.blessingCycleCount}:</span>
              <span className="font-mono text-warm-glow">
                {treeState.currentCycleEnergy} / {treeState.threshold} Mầm Lực ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3.5 bg-forest-abyss rounded-full p-0.5 border border-warm-amber/40 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-warm-amber via-warm-glow to-dongho-red rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Sidebar: CSR Sponsors & Contributions */}
        <div className="flex flex-col gap-6">
          {/* CSR Sponsor Box */}
          <div className="p-6 rounded-3xl bg-forest-deep/80 border border-warm-amber/40 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warm-amber mb-2">
              <HeartHandshake className="w-4 h-4" />
              Doanh nghiệp / Nhà tài trợ CSR
            </div>
            <h3 className="font-bold text-base text-dongho-paper">Đóng Góp Năng Lượng Cộng Đồng</h3>
            <p className="text-xs text-dongho-paper/70 mt-1.5 leading-relaxed">
              Mô hình &quot;khắc tên vào truyền thuyết&quot;: Doanh nghiệp tài trợ mầm lực cho Cây Đa sẽ được khắc ghi danh tính trong sự kiện hoa nở ban phước của cả làng.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min="10"
                step="20"
                value={sponsorAmount}
                onChange={(e) => setSponsorAmount(e.target.value)}
                className="w-24 bg-forest-abyss border border-warm-amber/50 rounded-xl px-3 py-2 text-xs text-warm-glow focus:outline-none"
              />
              <span className="text-xs text-dongho-paper/60">Mầm lực</span>
              <button
                onClick={handleSponsorContribute}
                className="flex-1 py-2 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs transition shadow-md"
              >
                + Góp mầm lực
              </button>
            </div>
          </div>

          {/* On-chain Transparency Box */}
          <div className="p-6 rounded-3xl bg-forest-deep/80 border border-bamboo-soft/40 backdrop-blur-md shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bamboo-light mb-2">
                <ShieldCheck className="w-4 h-4" />
                Minh Bạch Tuyệt Đối On-Chain
              </div>
              <h3 className="font-bold text-base text-dongho-paper">Vì sao cần Avalanche?</h3>
              <ul className="mt-3 space-y-2 text-xs text-dongho-paper/75">
                <li className="flex items-start gap-2">
                  <span className="text-warm-glow">✓</span>
                  <span>Không ai (kể cả ban quản trị) có thể sửa số liệu hay rút ruột quỹ Cây Đa Phù Đổng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warm-glow">✓</span>
                  <span>Thời gian hoàn tất giao dịch ~1 giây giúp sự kiện bùng nổ ban phước diễn ra tức thì.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-warm-glow">✓</span>
                  <span>Game L1 Subnet xử lý tương tác thường nhật, C-Chain lưu trữ tài sản bền vững.</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-bamboo-mid/20 flex items-center justify-between text-[11px] text-dongho-paper/60 font-mono">
              <span>Hợp đồng: 0x93F...1c7E</span>
              <span className="text-warm-glow">Avalanche Fuji</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
