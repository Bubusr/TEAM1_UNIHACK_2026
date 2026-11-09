'use client';

import React, { useState } from 'react';
import { Goal, JourneyNFT } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { X, Award, CheckCircle2, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RestGoalModalProps {
  goal: Goal;
  onClose: () => void;
  onFinished: () => void;
}

export default function RestGoalModal({ goal, onClose, onFinished }: RestGoalModalProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [mintedNft, setMintedNft] = useState<JourneyNFT | null>(null);

  const handleRestAndMint = async () => {
    setIsMinting(true);

    // Giả lập tương tác smart contract minting trên Avalanche C-Chain
    setTimeout(() => {
      const mockTx = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
      const tokenId = `#MN-${Math.floor(100 + Math.random() * 900)}`;

      const newNft: JourneyNFT = {
        tokenId,
        goalId: goal.id,
        goalName: goal.name,
        personality: goal.personality,
        imageUri: goal.imageUri,
        finalStats: { ...goal.stats },
        interactionCount: goal.interactionCount,
        completedAt: Date.now(),
        mockYieldContributed: goal.hasVault ? Number((goal.vaultPrincipal * 0.05).toFixed(4)) : 0.015,
        txHash: `${mockTx} (Avalanche Fuji)`,
      };

      // Cập nhật Goal trạng thái isResting
      const updatedGoal: Goal = {
        ...goal,
        isResting: true,
        restingAt: Date.now(),
        journeyNftId: tokenId,
      };

      StorageService.updateGoal(updatedGoal);
      StorageService.addNFT(newNft);

      // Nếu có vault, góp năng lượng vào Cây Làng
      const yieldContribution = Math.floor(newNft.mockYieldContributed * 1000) || 25;
      StorageService.addEnergyToTree(yieldContribution);

      setMintedNft(newNft);
      setIsMinting(false);
      setCompleted(true);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-800/60 rounded-3xl p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!completed ? (
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
              <Award className="w-4 h-4" />
              Nghi thức Hoàn thành Mục tiêu
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-3">
              Măng Non &quot;{goal.name}&quot; An Nghỉ
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Theo truyền thuyết Thánh Gióng, sau khi hoàn thành sứ mệnh nuôi lớn và bảo vệ, sinh linh sẽ an nghỉ và để lại dấu tích thiêng liêng. Măng Non sẽ chuyển vào <strong className="text-emerald-400">Vườn Ký Ức</strong>, không biến mất mà trở thành NFT hành trình vĩnh cửu on-chain.
            </p>

            {/* Recap Stats */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 mb-5">
              <div className="text-xs font-semibold text-slate-400">Thành quả hành trình:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Lượt tương tác:</span>
                  <span className="font-bold text-emerald-400">{goal.interactionCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Tổng điểm chỉ số:</span>
                  <span className="font-bold text-amber-400">
                    {goal.stats.intelligence + goal.stats.perseverance + goal.stats.fitness + goal.stats.creativity}
                  </span>
                </div>
              </div>

              {/* Vault Settlement */}
              {goal.hasVault && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Thanh toán Mầm Lực Vault (Avalanche C-Chain)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    • 100% vốn gốc: <strong className="text-emerald-300">{goal.vaultPrincipal} AVAX</strong> được hoàn trả về ví bạn ngay lập tức.
                  </p>
                  <p className="text-[11px] text-slate-300">
                    • Mock-yield cộng đồng: Trích 30% đóng góp vào <strong className="text-amber-300">Cây Làng Phù Đổng</strong> để kích hoạt sự kiện ban phước.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Chưa, tiếp tục đồng hành
              </button>
              <button
                type="button"
                disabled={isMinting}
                onClick={handleRestAndMint}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                {isMinting ? 'Đang Mint NFT on-chain...' : 'Xác nhận An Nghỉ & Mint NFT'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-emerald-300">NFT Hành Trình Đã Được Mint Thành Công!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Mã NFT <strong className="text-amber-300">{mintedNft?.tokenId}</strong> đã được lưu vĩnh viễn trên Avalanche C-Chain. Bạn có thể ghé Vườn Ký Ức để ngắm nhìn lại bất cứ lúc nào!
            </p>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 break-all">
              TxHash: {mintedNft?.txHash}
            </div>
            <button
              onClick={() => {
                onFinished();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              Đến Vườn Ký Ức ngắm nhìn →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
