'use client';

import React, { useState } from 'react';
import { Goal, JourneyNFT } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { X, Award, CheckCircle2, ShieldCheck, Waves, Sparkles, Heart } from 'lucide-react';
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

      const updatedGoal: Goal = {
        ...goal,
        isResting: true,
        restingAt: Date.now(),
        journeyNftId: tokenId,
      };

      StorageService.updateGoal(updatedGoal);
      StorageService.addNFT(newNft);

      const yieldContribution = Math.floor(newNft.mockYieldContributed * 1000) || 25;
      StorageService.addEnergyToTree(yieldContribution);

      setMintedNft(newNft);
      setIsMinting(false);
      setCompleted(true);

      // Hoa gạo đỏ & đom đóm vàng
      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.5 },
        colors: ['#E63946', '#FFD166', '#F4A259', '#6B8F71'],
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-forest-deep border-2 border-warm-amber/50 rounded-3xl p-6 text-dongho-paper shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-dongho-paper/60 hover:text-dongho-paper hover:bg-forest-mist transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!completed ? (
          <div>
            <div className="flex items-center gap-2 text-warm-amber text-xs font-semibold mb-1">
              <Waves className="w-4 h-4" />
              Nghi thức tiễn đưa bên Suối Ký Ức
            </div>
            <h2 className="text-xl font-bold text-warm-glow mb-3">
              Một hành trình đã khép lại rồi...
            </h2>

            <p className="text-xs text-dongho-paper/80 leading-relaxed mb-4 italic">
              &quot;Măng Non muốn nói lời cảm ơn trước khi ngủ. Cảm ơn cậu vì đã luôn nhớ mang những câu chuyện ngoài thế giới về kể lại. Măng Non sẽ hóa thành một phiến đá nhẵn dưới lòng suối trong vắt, nước chảy qua nhưng kỷ niệm không bao giờ phai mờ.&quot;
            </p>

            {/* Recap Stats */}
            <div className="p-4 rounded-2xl bg-forest-darker/90 border border-bamboo-mid/30 space-y-3 mb-5">
              <div className="text-xs font-semibold text-dongho-paper/70">Dấu ấn cùng nhau:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-forest-deep border border-bamboo-mid/30 flex justify-between">
                  <span className="text-dongho-paper/60">Lần tâm sự:</span>
                  <span className="font-bold text-warm-glow">{goal.interactionCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-forest-deep border border-bamboo-mid/30 flex justify-between">
                  <span className="text-dongho-paper/60">Tổng điểm mầm lực:</span>
                  <span className="font-bold text-warm-amber">
                    {goal.stats.intelligence + goal.stats.perseverance + goal.stats.fitness + goal.stats.creativity}
                  </span>
                </div>
              </div>

              {/* Vault Settlement */}
              {goal.hasVault && (
                <div className="p-3 rounded-xl bg-warm-wood/20 border border-warm-amber/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-warm-glow font-bold">
                    <ShieldCheck className="w-4 h-4 text-warm-amber" />
                    Thanh toán Mầm Lực Vault (Avalanche C-Chain)
                  </div>
                  <p className="text-[11px] text-dongho-paper/80">
                    • 100% vốn gốc: <strong className="text-warm-glow">{goal.vaultPrincipal} AVAX</strong> được hoàn trả trọn vẹn về ví cậu.
                  </p>
                  <p className="text-[11px] text-dongho-paper/80">
                    • Trích 30% mock-yield góp vào <strong className="text-warm-amber">Cây Đa Phù Đổng</strong> để hoa gạo nở ban phước cho cả cộng đồng.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-dongho-paper/60 hover:text-dongho-paper transition"
              >
                Cứ thong thả, để sau nhé
              </button>
              <button
                type="button"
                disabled={isMinting}
                onClick={handleRestAndMint}
                className="px-5 py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4 text-forest-abyss" />
                {isMinting ? 'Đang khắc ghi NFT on-chain...' : 'Tiễn đưa Măng Non an nghỉ & Mint NFT'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-warm-glow/20 text-warm-glow flex items-center justify-center mx-auto text-3xl">
              <CheckCircle2 className="w-10 h-10 text-warm-glow" />
            </div>
            <h3 className="text-lg font-bold text-warm-glow">Phiến Đá NFT Đã Được An Nghỉ Dưới Dòng Suối!</h3>
            <p className="text-xs text-dongho-paper/80 max-w-sm mx-auto leading-relaxed">
              Mã NFT <strong className="text-warm-amber">{mintedNft?.tokenId}</strong> đã được lưu vĩnh viễn trên Avalanche C-Chain. Cậu có thể ghé Suối Ký Ức để ngắm nhìn lại bất cứ lúc nào!
            </p>
            <div className="p-3 rounded-2xl bg-forest-darker border border-bamboo-mid/30 text-xs font-mono text-dongho-paper/60 break-all">
              TxHash: {mintedNft?.txHash}
            </div>
            <button
              onClick={() => {
                onFinished();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-warm-amber hover:bg-warm-glow text-forest-abyss font-bold text-xs transition shadow-md"
            >
              Ghé Suối Ký Ức ngắm nhìn →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
