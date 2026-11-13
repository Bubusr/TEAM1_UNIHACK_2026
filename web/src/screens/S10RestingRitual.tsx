'use client';

import React, { useState, useEffect } from 'react';
import { Mangnon, MemoryItem } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { Sparkles, Heart, ArrowRight } from 'lucide-react';

interface S10RestingRitualProps {
  mangnon: Mangnon;
  memories: MemoryItem[];
  onFinishRitual: (lastWords: string, finalMemories: string[], txHash?: string) => void;
  onCancel: () => void;
}

export default function S10RestingRitual({
  mangnon,
  memories,
  onFinishRitual,
  onCancel,
}: S10RestingRitualProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  // Top 3 memories or fallback samples
  const topMemories = memories
    .filter((m) => !m.forgotten)
    .slice(0, 3)
    .map((m) => m.text);

  const fallbackMemories = [
    `You shared: About the journey of ${mangnon.goalTitle}`,
    'You shared: A cool breeze on a quiet afternoon among bamboo',
    'You shared: A sense of peace after unburdening your heart',
  ];

  const ritualMemories = topMemories.length > 0 ? topMemories : fallbackMemories;

  // Last words based on personality
  const getLastWords = () => {
    switch (mangnon.personality) {
      case 'tomo':
        return 'Walking beside you, I learned how vast and beautiful the world truly is. Now, I shall take a sweet, gentle rest by the clear stream...';
      case 'diemtinh':
        return 'Thank you for your steady patience. Everything you shared lingers gently like morning dew. Now I drift into peaceful sleep...';
      case 'haohung':
        return 'Our time together was so wonderful!! Even sleeping by the river stones, I will always remember your bright smile!';
      case 'nhutnhat':
        return '...Thank you for choosing me. Sitting near you brought so much warmth. Now I become a smooth stone beside the stream, watching over you softly...';
    }
  };

  const lastWords = getLastWords();

  const handleMintOnChain = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('No Core or MetaMask wallet detected. You can still proceed and rest peacefully into the Stream of Memories.');
      return;
    }
    setMintStatus('minting');
    try {
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      let contractAddress = '0x7Db4Be38e24A710476916B4e576BD12c2e603a4E';
      try {
        const resp = await fetch('/api/deployed-addresses');
        if (resp.ok) {
          const d = await resp.json();
          if (d.JourneyNFT) contractAddress = d.JourneyNFT;
        }
      } catch {}

      const txHash: string = await eth.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to: contractAddress,
            value: '0x0',
            data: '0x',
          },
        ],
      });
      setMintTxHash(txHash);
      setMintStatus('success');
      SoundEngine.playBlessingChime();
    } catch (err: any) {
      console.warn('Mint rejected or error:', err);
      setMintStatus('error');
    }
  };

  const handleNextPhase = () => {
    SoundEngine.playBambooKnock();
    if (phase === 1) {
      setPhase(2);
    } else if (phase === 2) {
      setPhase(3);
    } else if (phase === 3) {
      setPhase(4);
      SoundEngine.playBlessingChime();
      SoundEngine.playWaterSplash();
      setTimeout(() => {
        setPhase(5);
      }, 3500);
    } else if (phase === 5) {
      SoundEngine.playBlessingChime();
      onFinishRitual(lastWords, ritualMemories, mintTxHash || undefined);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#222E30] text-dongho-paper flex flex-col justify-between overflow-hidden select-none p-6">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#141C1E] via-[#222E30] to-[#141C1E] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-warm-amber/15 blur-3xl pointer-events-none animate-pulse" />

      {/* Top indicator */}
      <div className="pt-8 text-center z-10">
        <span className="text-[10px] uppercase font-bold tracking-widest text-warm-amber/80">
          Resting Ritual · Phase {phase}/5
        </span>
      </div>

      {/* Center Emotional Ritual View */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 z-10 text-center">
        {/* NHỊP 1: MỞ LỜI */}
        {phase === 1 && (
          <div className="space-y-6 max-w-xs animate-fade-in">
            <div className="relative w-36 h-36 mx-auto rounded-full bg-forest-darker border-2 border-warm-amber/50 flex items-center justify-center p-2 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mangnon.imageUri} alt={mangnon.name} className="w-28 h-28 object-contain animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-warm-glow leading-relaxed">
              &quot;{content.s10_restingRitual.step1Title}&quot;
            </p>
          </div>
        )}

        {/* NHỊP 2: NHÌN LẠI 3 KÝ ỨC */}
        {phase === 2 && (
          <div className="space-y-4 max-w-xs w-full animate-fade-in">
            <h3 className="text-xs font-bold text-warm-glow uppercase tracking-wider mb-2">
              {content.s10_restingRitual.step2Title}
            </h3>
            <div className="space-y-2.5">
              {ritualMemories.map((mem, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-forest-darker/90 border border-warm-amber/40 shadow-lg text-left text-xs leading-relaxed"
                >
                  <span className="text-warm-amber mr-1.5 font-bold">🌾</span>
                  <span className="text-dongho-paper font-medium">{mem}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NHỊP 3: LỜI CUỐI */}
        {phase === 3 && (
          <div className="space-y-6 max-w-xs animate-fade-in">
            <div className="relative w-32 h-32 mx-auto rounded-full bg-forest-darker border border-warm-amber/50 flex items-center justify-center p-2 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mangnon.imageUri} alt={mangnon.name} className="w-24 h-24 object-contain animate-pulse" />
            </div>
            <div className="p-4 rounded-3xl bg-forest-darker/90 border border-warm-amber/40 shadow-xl">
              <p className="text-xs text-dongho-paper leading-relaxed italic">
                &quot;{lastWords}&quot;
              </p>
            </div>
          </div>
        )}

        {/* NHỊP 4: HOÁ ÁNH SÁNG & TRÔI VỀ SUỐI (≤ 120 particles) */}
        {phase === 4 && (
          <div className="relative flex flex-col items-center justify-center animate-fade-in">
            {/* Particle Burst Cloud */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {[...Array(60)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-[#F4EEDD]"
                  style={{
                    transform: `translate(${(Math.random() - 0.5) * 220}px, ${(Math.random() - 0.5) * 220}px) scale(${Math.random() * 1.5 + 0.5})`,
                    boxShadow: '0 0 10px #CFA85B, 0 0 20px #5C4D43',
                    opacity: Math.random() * 0.9 + 0.1,
                    transition: 'all 3s cubic-bezier(.22, 1, .36, 1)',
                  }}
                />
              ))}

              {/* Emerging Smooth River Stone */}
              <div className="w-28 h-20 rounded-[45%] bg-[#5A6544]/80 border-2 border-warm-amber/60 shadow-[0_0_30px_#CFA85B] flex items-center justify-center animate-pulse">
                <span className="text-2xl opacity-60">✨</span>
              </div>
            </div>

            <p className="text-xs text-warm-glow mt-4 font-medium italic">
              {content.s10_restingRitual.step4Title}
            </p>
          </div>
        )}

        {/* NHỊP 5: CÂY ĐA NHẬN LÁ & AVALANCHE GRADUATION */}
        {phase === 5 && (
          <div className="space-y-4 max-w-xs animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-forest-darker border-2 border-warm-amber flex items-center justify-center text-3xl shadow-2xl">
              🌳
            </div>
            <div className="p-3.5 rounded-3xl bg-forest-darker/90 border border-warm-amber/40 shadow-xl">
              <p className="text-xs font-bold text-warm-glow leading-relaxed">
                {content.s10_restingRitual.step5Contribution}
              </p>
              <p className="text-[11px] text-dongho-paper/70 mt-1">
                A glowing leaf has been kindled on the canopy of the Sacred Banyan Tree.
              </p>
            </div>

            {/* Imprint onto Avalanche Fuji */}
            <div className="p-3 rounded-2xl bg-forest-deep/90 border border-bamboo-mid/40 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-warm-amber">
                  ⛓️ Imprint On-Chain
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-warm-amber/20 text-warm-amber">
                  Fuji Testnet
                </span>
              </div>

              {mintStatus === 'idle' && (
                <button
                  onClick={handleMintOnChain}
                  className="w-full py-2 px-3 rounded-xl bg-forest-darker hover:bg-forest-mist border border-warm-amber/50 text-[11px] font-bold text-warm-glow flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-warm-amber" />
                  <span>Imprint onto Avalanche Fuji (Optional)</span>
                </button>
              )}

              {mintStatus === 'minting' && (
                <div className="py-2 text-center text-[11px] text-warm-amber animate-pulse font-medium">
                  ⏳ Submitting transaction to Avalanche Fuji...
                </div>
              )}

              {mintStatus === 'success' && mintTxHash && (
                <div className="p-2 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-[10px] space-y-1">
                  <div className="text-bamboo-soft font-bold flex items-center gap-1">
                    <span>✨</span>
                    <span>Journey NFT imprinted permanently!</span>
                  </div>
                  <a
                    href={`https://testnet.snowtrace.io/tx/${mintTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-warm-amber underline truncate block hover:brightness-110 font-mono text-[9px]"
                  >
                    View on Snowtrace: {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-6)}
                  </a>
                </div>
              )}

              {mintStatus === 'error' && (
                <div className="text-[10px] text-dongho-red text-center py-1 font-medium">
                  Transaction skipped. You can continue resting peacefully into the stream.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pb-6 z-10">
        {phase === 1 && (
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl bg-forest-darker border border-bamboo-soft/40 text-xs font-semibold text-dongho-paper/70 hover:text-dongho-paper transition"
            >
              {content.common.cancel}
            </button>
            <button
              onClick={handleNextPhase}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-lg hover:brightness-105 transition"
            >
              Listen to companion
            </button>
          </div>
        )}

        {(phase === 2 || phase === 3) && (
          <button
            onClick={handleNextPhase}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-lg hover:brightness-105 transition flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 text-forest-abyss" />
          </button>
        )}

        {phase === 5 && (
          <button
            onClick={handleNextPhase}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-warm-amber via-warm-glow to-warm-amber text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-forest-abyss" />
            <span>{content.s10_restingRitual.btnReturnForest}</span>
          </button>
        )}
      </div>
    </div>
  );
}

