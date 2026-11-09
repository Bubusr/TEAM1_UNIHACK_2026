'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { JourneyNFT } from '@/lib/types';
import { Waves, Sparkles, ExternalLink, Calendar, Award, Zap, Brain, Flame, Activity, Palette } from 'lucide-react';

export default function MemoryPage() {
  const [nfts, setNfts] = useState<JourneyNFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<JourneyNFT | null>(null);

  useEffect(() => {
    setNfts(StorageService.getNFTs());
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-dongho-paper">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-bamboo-mid/30">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌊</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-bamboo-light">Suối Ký Ức</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-forest-deep border border-bamboo-soft text-warm-glow font-semibold">
              {nfts.length} phiến đá an nghỉ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dongho-paper/70 mt-1 italic">
            Dòng suối trong vắt giữa Rừng Tre và Làng Phù Đổng. Nước chảy qua nhưng phiến đá không mòn — ký ức vĩnh cửu thành NFT on-chain.
          </p>
        </div>
      </div>

      {/* NFT Stones Stream Gallery */}
      {nfts.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div
              key={nft.tokenId}
              onClick={() => setSelectedNft(nft)}
              className="group relative rounded-3xl bg-forest-deep/85 border-2 border-bamboo-mid/40 hover:border-warm-glow p-5 flex flex-col justify-between shadow-2xl cursor-pointer transition transform hover:-translate-y-1"
            >
              <div>
                {/* NFT Token Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-warm-glow bg-forest-darker px-2.5 py-0.5 rounded-md border border-warm-amber/40">
                    {nft.tokenId}
                  </span>
                  <span className="text-[11px] text-dongho-paper/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-bamboo-light" />
                    {new Date(nft.completedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Phiến đá dưới lòng suối */}
                <div className="w-full h-44 rounded-2xl bg-gradient-to-b from-forest-darker to-forest-abyss border border-bamboo-mid/30 flex items-center justify-center p-4 overflow-hidden group-hover:shadow-inner transition">
                  <img
                    src={nft.imageUri}
                    alt={nft.goalName}
                    className="max-h-full max-w-full object-contain filter group-hover:scale-110 transition duration-500 opacity-90 group-hover:opacity-100"
                  />
                </div>

                {/* Title */}
                <h3 className="mt-4 font-bold text-base text-dongho-paper group-hover:text-warm-glow transition line-clamp-1">
                  {nft.goalName}
                </h3>
                <div className="text-xs text-dongho-paper/60 mt-0.5 capitalize">
                  Tính cách: <span className="text-warm-amber">{nft.personality}</span> · {nft.interactionCount} lần tâm sự
                </div>

                {/* Final Stats */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-dongho-paper/80 bg-forest-darker/90 p-2.5 rounded-xl border border-bamboo-mid/30">
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-bamboo-light" />
                    <span>Hiểu biết: {nft.finalStats.intelligence}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-warm-amber" />
                    <span>Kiên trì: {nft.finalStats.perseverance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-bamboo-soft" />
                    <span>Sức sống: {nft.finalStats.fitness}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-dongho-ochre" />
                    <span>Tự do: {nft.finalStats.creativity}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-bamboo-mid/20 flex items-center justify-between text-[11px] text-dongho-paper/60 font-mono">
                <span>{nft.txHash.substring(0, 14)}...</span>
                <span className="text-warm-amber flex items-center gap-1 group-hover:underline">
                  Ngắm nhìn ký ức <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <span className="text-6xl mb-3">🌊</span>
          <h3 className="text-lg font-bold text-bamboo-light">Dòng Suối Ký Ức đang đón chờ</h3>
          <p className="text-xs text-dongho-paper/70 max-w-sm mt-1">
            Khi một hành trình khép lại, Măng Non sẽ an nghỉ như một phiến đá nhẵn dưới lòng suối này và trở thành NFT hành trình bất biến on-chain.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-forest-deep border-2 border-bamboo-soft/50 rounded-3xl p-6 text-dongho-paper shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold text-warm-glow bg-forest-darker px-2.5 py-1 rounded-md border border-warm-amber/50">
                {selectedNft.tokenId} (ERC-721 NFT Hành Trình)
              </span>
              <button
                onClick={() => setSelectedNft(null)}
                className="text-dongho-paper/60 hover:text-dongho-paper text-sm"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="w-full h-52 rounded-2xl bg-forest-darker border border-bamboo-mid/30 flex items-center justify-center p-4 mb-4">
              <img
                src={selectedNft.imageUri}
                alt={selectedNft.goalName}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <h3 className="font-bold text-lg text-warm-glow">{selectedNft.goalName}</h3>
            <p className="text-xs text-dongho-paper/70 mt-1">
              Đã hoàn thành và khắc ghi vĩnh cửu trên Avalanche C-Chain Fuji Testnet.
            </p>

            <div className="mt-4 space-y-2 text-xs bg-forest-darker p-3.5 rounded-2xl border border-bamboo-mid/30 font-mono">
              <div className="flex justify-between">
                <span className="text-dongho-paper/60">Mạng lưới:</span>
                <span className="text-dongho-red font-semibold">Avalanche Fuji</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dongho-paper/60">Góp cho Cây Đa:</span>
                <span className="text-warm-amber">+{selectedNft.mockYieldContributed} AVAX yield</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dongho-paper/60">Giao dịch on-chain:</span>
                <span className="text-dongho-paper break-all">{selectedNft.txHash}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
