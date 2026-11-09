'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Trees, Landmark, Flower2, Coffee, ShieldCheck, ArrowRight, Wand2, Zap } from 'lucide-react';
import NewGoalModal from '@/components/NewGoalModal';
import { StorageService } from '@/lib/storage';
import { Goal } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const handleGoalCreated = (goal: Goal) => {
    StorageService.addGoal(goal);
    setShowOnboardModal(false);
    router.push('/forest');
  };

  return (
    <div className="relative overflow-hidden text-slate-100 pb-20">
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow ambient */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[350px] h-[200px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Tag badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-6 shadow-lg shadow-emerald-950/60">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>UniHack 2026 · Avalanche L1 &amp; C-Chain Prototype</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-400">
          MĂNG NON
        </h1>
        <p className="mt-4 text-base sm:text-xl text-emerald-200/90 max-w-2xl font-light leading-relaxed">
          Sinh linh đồng hành học tập độc lập — sinh ra từ ống tre phát sáng, lớn lên cùng tri thức của bạn, nuôi dưỡng sức mạnh cộng đồng.
        </p>

        {/* Lore Hook */}
        <div className="mt-6 max-w-xl p-4 rounded-2xl bg-slate-900/60 border border-emerald-900/50 backdrop-blur-sm text-xs sm:text-sm text-slate-300 italic">
          &quot;Lấy cảm hứng từ truyền thuyết <strong className="text-amber-300">Thánh Gióng</strong> (sức mạnh lớn lên nhờ cộng đồng) và <strong className="text-emerald-300">Công chúa Kaguya</strong> (sinh linh kỳ diệu trong thân tre phát sáng).&quot;
        </div>

        {/* Glowing Bamboo Call to Action */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => setShowOnboardModal(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-bamboo-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base shadow-xl shadow-emerald-950 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5"
          >
            <span className="text-xl">🎋</span>
            <span>Khởi sinh Măng Non đầu tiên</span>
            <ArrowRight className="w-5 h-5 text-amber-300" />
          </button>

          <Link
            href="/forest"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-800/60 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <Trees className="w-4 h-4 text-emerald-400" />
            <span>Vào Rừng Tre Cổ</span>
          </Link>
        </div>

        {/* Key Features Banner */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left">
          {/* Feature 1 */}
          <div className="p-5 rounded-3xl bg-slate-900/70 border border-emerald-900/40 backdrop-blur-sm hover:border-emerald-700/60 transition group">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Độc nhất do bạn tự vẽ</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Tự vẽ tay hoặc chụp ảnh sinh linh của bạn. Hệ thống animate trực tiếp nét vẽ gốc để Măng Non thở và chuyển động trước mắt bạn.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-3xl bg-slate-900/70 border border-emerald-900/40 backdrop-blur-sm hover:border-emerald-700/60 transition group">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/80 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Không phạt, không streak</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Bạn không làm nhiệm vụ hằng ngày? Măng Non chỉ &quot;ngủ&quot;, không bệnh, không chết. Khi quay lại, hai bên tiếp tục đúng nơi đã dừng.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-3xl bg-slate-900/70 border border-emerald-900/40 backdrop-blur-sm hover:border-emerald-700/60 transition group">
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800/80 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-110 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Avalanche On-Chain Minh Bạch</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Mầm Lực Vault hoàn vốn 100%, trích mock-yield nuôi Cây Làng. Mint NFT Hành Trình bất biến khi hoàn thành mục tiêu.
            </p>
          </div>
        </div>

        {/* 3 Lands Showcase */}
        <div className="mt-20 w-full">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">Hành Trình Khám Phá</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1">3 Vùng Đất Tâm Hồn</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Land 1 */}
            <Link
              href="/forest"
              className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-emerald-950/40 border border-emerald-800/50 hover:border-emerald-500 transition text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <Trees className="w-7 h-7 text-emerald-400 group-hover:rotate-6 transition" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300">
                  Cá nhân
                </span>
              </div>
              <h3 className="text-lg font-bold text-emerald-300 group-hover:text-emerald-200 transition">
                Rừng Tre Cổ
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Không gian riêng tư nơi các Măng Non lớn lên cùng bạn. Tương tác trò chuyện tự do, quiz đố vui nhẹ nhàng và bắt gặp ống nứa phát sáng ngẫu nhiên.
              </p>
            </Link>

            {/* Land 2 */}
            <Link
              href="/village"
              className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-amber-950/40 border border-amber-800/50 hover:border-amber-500 transition text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <Landmark className="w-7 h-7 text-amber-400 group-hover:rotate-6 transition" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300">
                  Cộng đồng
                </span>
              </div>
              <h3 className="text-lg font-bold text-amber-300 group-hover:text-amber-200 transition">
                Làng Phù Đổng
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Nơi Cây Làng vươn cao nhờ tổng đóng góp on-chain từ mock-yield và nhà tài trợ. Khi đạt mốc, Cây Làng bùng nổ ban phước ngược lại cho mọi sinh linh.
              </p>
            </Link>

            {/* Land 3 */}
            <Link
              href="/memory"
              className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-teal-950/40 border border-teal-800/50 hover:border-teal-500 transition text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <Flower2 className="w-7 h-7 text-teal-400 group-hover:rotate-6 transition" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 border border-teal-700 text-teal-300">
                  Bảo tàng NFT
                </span>
              </div>
              <h3 className="text-lg font-bold text-teal-300 group-hover:text-teal-200 transition">
                Vườn Ký Ức
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Nơi những Măng Non đã hoàn thành Goal &quot;an nghỉ&quot; dưới dạng NFT hành trình chuẩn ERC-721 với đầy đủ nhật ký, chỉ số và bằng chứng on-chain vĩnh cửu.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboardModal && (
        <NewGoalModal
          onClose={() => setShowOnboardModal(false)}
          onGoalCreated={handleGoalCreated}
        />
      )}
    </div>
  );
}
