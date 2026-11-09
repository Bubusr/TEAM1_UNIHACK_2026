'use client';

import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { JourneyNFT } from '@/lib/types';
import { Flower2, Sparkles, ExternalLink, Calendar, Award, Zap, Brain, Flame, Activity, Palette } from 'lucide-react';

export default function MemoryPage() {
  const [nfts, setNfts] = useState<JourneyNFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<JourneyNFT | null>(null);

  useEffect(() => {
    setNfts(StorageService.getNFTs());
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col text-slate-100">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-teal-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-teal-300">Vườn Ký Ức</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-950 border border-teal-700/60 text-teal-400 font-semibold">
              {nfts.length} Măng Non đã tốt nghiệp
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bảo tàng cá nhân lưu giữ các sinh linh đã an nghỉ. Không bị xoá hay biến mất, mỗi Măng Non là một NFT hành trình độc nhất trên Avalanche C-Chain.
          </p>
        </div>
      </div>

      {/* NFT Gallery Grid */}
      {nfts.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div
              key={nft.tokenId}
              onClick={() => setSelectedNft(nft)}
              className="group relative rounded-3xl bg-slate-900/90 border border-teal-800/50 hover:border-teal-400 p-5 flex flex-col justify-between shadow-xl cursor-pointer transition transform hover:-translate-y-1"
            >
              <div>
                {/* NFT Token Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-800">
                    {nft.tokenId}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(nft.completedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Character visual */}
                <div className="w-full h-44 rounded-2xl bg-gradient-to-b from-slate-950 to-teal-950/40 border border-slate-800 flex items-center justify-center p-4 overflow-hidden group-hover:shadow-inner transition">
                  <img
                    src={nft.imageUri}
                    alt={nft.goalName}
                    className="max-h-full max-w-full object-contain filter group-hover:scale-110 transition duration-300"
                  />
                </div>

                {/* Title */}
                <h3 className="mt-4 font-bold text-base text-slate-100 group-hover:text-teal-300 transition line-clamp-1">
                  {nft.goalName}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5 capitalize">
                  Tính cách: <span className="text-emerald-400">{nft.personality}</span> · {nft.interactionCount} lượt chia sẻ
                </div>

                {/* Final Stats Pills */}
                <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-blue-400" />
                    <span>Trí tuệ: {nft.finalStats.intelligence}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Kiên trì: {nft.finalStats.perseverance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>Thể lực: {nft.finalStats.fitness}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-purple-400" />
                    <span>Sáng tạo: {nft.finalStats.creativity}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{nft.txHash.substring(0, 14)}...</span>
                <span className="text-teal-400 flex items-center gap-1 group-hover:underline">
                  Xem chi tiết <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <span className="text-6xl mb-3">🌸</span>
          <h3 className="text-lg font-bold text-teal-300">Vườn Ký Ức đang đợi những sinh linh đầu tiên</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Khi bạn hoàn thành một mục tiêu trong Rừng Tre Cổ và chọn &quot;An nghỉ&quot;, Măng Non sẽ được ghi nhận vĩnh viễn thành NFT tại đây.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-teal-800/60 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2.5 py-1 rounded-full border border-teal-800">
                {selectedNft.tokenId} (ERC-721)
              </span>
              <button
                onClick={() => setSelectedNft(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="w-full h-52 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-4 mb-4">
              <img
                src={selectedNft.imageUri}
                alt={selectedNft.goalName}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <h3 className="font-bold text-lg text-teal-200">{selectedNft.goalName}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Đã hoàn thành và lưu trữ vĩnh viễn trên Avalanche C-Chain Fuji Testnet.
            </p>

            <div className="mt-4 space-y-2 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Mạng lưới:</span>
                <span className="text-red-400">Avalanche Fuji</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Góp cho Cây Làng:</span>
                <span className="text-amber-400">+{selectedNft.mockYieldContributed} AVAX yield</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TxHash:</span>
                <span className="text-slate-300 break-all">{selectedNft.txHash}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
