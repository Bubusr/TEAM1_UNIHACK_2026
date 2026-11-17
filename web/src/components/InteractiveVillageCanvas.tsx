'use client';

import React, { useRef, useEffect, useState } from 'react';
import { sound } from '@/lib/sound-engine';

interface InteractiveVillageCanvasProps {
  currentEnergy: number;
  threshold: number;
  cycle: number;
  isBlessed: boolean;
  onTriggerBlessing: () => void;
}

interface VillageSpirit {
  x: number;
  y: number;
  hopOffset: number;
  direction: 1 | -1;
  color: string;
  name: string;
}

export default function InteractiveVillageCanvas({
  currentEnergy,
  threshold,
  cycle,
  isBlessed,
  onTriggerBlessing,
}: InteractiveVillageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 550 });
  const animationRef = useRef<number | null>(null);

  // Sinh linh của cộng đồng tụ họp về quanh Cây Đa (vô danh, ấm áp)
  const spiritsRef = useRef<VillageSpirit[]>([
    { x: 220, y: 430, hopOffset: 0, direction: 1, color: '#7E9A85', name: '' },
    { x: 380, y: 440, hopOffset: 0, direction: -1, color: '#CFA85B', name: '' },
    { x: 620, y: 435, hopOffset: 0, direction: 1, color: '#5C4D43', name: '' },
    { x: 780, y: 445, hopOffset: 0, direction: -1, color: '#6B818C', name: '' },
  ]);

  // Đom đóm & hoa gạo bay
  const blessingParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }>>([]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 1000,
          height: 520,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (isBlessed) {
      sound.playBlessingChime();
      // Sinh 120 đom đóm & hoa gạo bay vút lên từ Cây Đa
      const particles: any[] = [];
      for (let i = 0; i < 120; i++) {
        particles.push({
          x: dimensions.width * 0.5 + (Math.random() * 220 - 110),
          y: dimensions.height * 0.55 + (Math.random() * 100 - 50),
          vx: (Math.random() - 0.5) * 3,
          vy: -2 - Math.random() * 4,
          color: Math.random() > 0.4 ? '#A84D3D' : '#CFA85B',
          size: Math.random() > 0.5 ? 4 : 2.5,
          alpha: 1,
        });
      }
      blessingParticlesRef.current = particles;
    }
  }, [isBlessed, dimensions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      // Không vẽ gì nếu người dùng ẩn tab hoặc gập máy (giải phóng GPU/CPU)
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      tick++;
      const { width, height } = dimensions;

      // 1. Vẽ cảnh Làng Phù Đổng về đêm
      drawVillageScene(ctx, width, height, tick, currentEnergy / threshold, isBlessed);

      // 2. Cập nhật các sinh linh đang đi dạo quanh cây đa
      spiritsRef.current.forEach((s, idx) => {
        s.hopOffset = Math.abs(Math.sin(tick * 0.08 + idx)) * 8;
        s.x += Math.sin(tick * 0.02 + idx) * 0.4;
        drawLittleSpirit(ctx, s, tick);
      });

      // 3. Cập nhật hạt đom đóm & hoa gạo khi bùng nổ
      if (blessingParticlesRef.current.length > 0) {
        blessingParticlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.007;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        blessingParticlesRef.current = blessingParticlesRef.current.filter((p) => p.alpha > 0);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(render);
      }
    };

    animationRef.current = requestAnimationFrame(render);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dimensions, currentEnergy, threshold, isBlessed]);

  // Vị trí các đèn lồng đỏ / nụ hoa trên tán cây đa
  const lanternPositions = [
    { x: 100, y: 150 },
    { x: 135, y: 100 },
    { x: 195, y: 65 },
    { x: 260, y: 80 },
    { x: 310, y: 130 },
    { x: 270, y: 170 },
    { x: 160, y: 175 },
    { x: 215, y: 135 },
    { x: 80, y: 185 },
    { x: 335, y: 180 },
  ];

  return (
    <div ref={containerRef} className="relative w-full rounded-3xl overflow-hidden border-2 border-warm-amber/40 shadow-2xl bg-forest-abyss">
      {/* 1. Canvas Background Scene (Sky, Hills, Ground, Wandering Spirits) */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto block"
      />

      {/* 2. Full Moon Paper Cutout with Warm Glow */}
      <div
        className="absolute top-24 right-10 w-16 h-16 rounded-full bg-[#FFE599] pointer-events-none"
        style={{
          boxShadow: '0 0 40px rgba(255, 229, 153, 0.55)',
        }}
      />

      {/* 3. Sacred Banyan Tree (SVG Liền Mạch + Soft Bioluminescent Glow) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          viewBox="0 0 400 320"
          className="w-[340px] sm:w-[410px] h-auto overflow-visible select-none translate-y-4"
          style={{
            filter: 'drop-shadow(0 0 35px rgba(79, 119, 90, 0.35))',
          }}
        >
          <defs>
            <radialGradient id="banyanCanopyGrad" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#4F775A" />
              <stop offset="65%" stopColor="#233B2E" />
              <stop offset="100%" stopColor="#16261E" />
            </radialGradient>
            <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#CFA85B" />
              <stop offset="70%" stopColor="#A84D3D" />
              <stop offset="100%" stopColor="#8E3E30" />
            </radialGradient>
          </defs>

          {/* Thân cây và rễ phụ uốn lượn màu nâu trầm ấm #3A2618 (không viền đen cứng) */}
          <g stroke="none">
            {/* Thân chính */}
            <path
              d="M175,310 C180,240 185,210 170,170 C190,165 210,165 230,170 C215,210 220,240 225,310 Z"
              fill="#3A2618"
            />
            {/* Rễ phụ buông mềm mại */}
            <path d="M162,190 C155,230 148,270 142,310" stroke="#3A2618" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M185,210 C180,250 175,280 170,310" stroke="#3A2618" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M215,210 C220,250 225,280 230,310" stroke="#3A2618" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M238,190 C245,230 252,270 258,310" stroke="#3A2618" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>

          {/* Tán lá: 1 thẻ path duy nhất tạo hình đám mây lá đa mềm mại không viền đen cứng */}
          <path
            d="M85,210 C40,210 20,170 40,130 C25,90 60,45 110,50 C140,15 215,10 255,45 C305,35 355,70 350,120 C380,155 360,205 315,210 C250,225 150,225 85,210 Z"
            fill="url(#banyanCanopyGrad)"
            stroke="none"
          />

          {/* Đèn Lồng Đỏ / Hoa Gạo phát sáng gắn class interactive-cutout */}
          {lanternPositions.slice(0, isBlessed ? 10 : Math.max(3, Math.floor((currentEnergy / threshold) * 10))).map((lp, idx) => (
            <g
              key={idx}
              className="interactive-cutout pointer-events-auto cursor-pointer"
              transform={`translate(${lp.x}, ${lp.y})`}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(168, 77, 61, 0.8))',
              }}
              onClick={onTriggerBlessing}
            >
              <circle cx="0" cy="0" r="8.5" fill="#A84D3D" stroke="#26292B" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3" fill="#CFA85B" />
              <line x1="0" y1="-12" x2="0" y2="-8.5" stroke="#26292B" strokeWidth="1.5" />
              <line x1="0" y1="8.5" x2="0" y2="12" stroke="#A84D3D" strokeWidth="1.5" />
            </g>
          ))}
        </svg>

        {/* Linh Vật Trắng dưới gốc cây (Die-cut sticker + Cuphead Wiggle khi chạm) */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-12 z-20 cursor-pointer pointer-events-auto"
          onClick={onTriggerBlessing}
          title="Bạch Linh Đồng — Chạm để chúc phúc"
        >
          <svg viewBox="0 0 50 65" className="interactive-cutout w-12 h-14 overflow-visible">
            {/* Thân bạch linh trắng */}
            <ellipse cx="25" cy="35" rx="16" ry="20" fill="#FFFFFF" stroke="#26292B" strokeWidth="2.5" />
            {/* Chiếc lá xanh trên đầu */}
            <path d="M22,15 C24,6 32,8 30,15 Z" fill="#7E9A85" stroke="#26292B" strokeWidth="2" />
            {/* Mắt chớp đen mộc bản */}
            <circle cx="20" cy="32" r="2.5" fill="#26292B" />
            <circle cx="30" cy="32" r="2.5" fill="#26292B" />
            {/* Má hồng pastel */}
            <circle cx="16" cy="38" r="2.5" fill="#D48C7F" />
            <circle cx="34" cy="38" r="2.5" fill="#D48C7F" />
            {/* Nụ cười */}
            <path d="M22,40 Q25,43 28,40" fill="none" stroke="#26292B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Village Banner */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto px-4 py-1.5 rounded-xl bg-[#1A2426]/90 text-xs text-dongho-paper/70 flex items-center gap-2 select-none border-0 shadow-none">
          <span className="w-2 h-2 rounded-full bg-[#A84D3D]"></span>
          <span><strong>Phù Đổng Sacred Tree</strong> · Season {cycle}</span>
          <span className="text-dongho-paper/40">|</span>
          <span className="text-warm-glow">
            {Array.from({ length: Math.min(Math.round((currentEnergy / threshold) * 5), 5) }).map((_, i) => (
              <span key={i}>🍃</span>
            ))}
          </span>
        </div>

        {currentEnergy >= threshold && (
          <button
            onClick={onTriggerBlessing}
            className="pointer-events-auto btn-woodblock-red px-3 py-1.5 rounded-full text-xs font-bold shadow-[2px_3px_0px_#26292B] flex items-center gap-1"
          >
            🌸 Kích Hoạt Hoa Gạo!
          </button>
        )}
      </div>
    </div>
  );
}

function drawVillageScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number,
  energyRatio: number,
  isBlessed: boolean
) {
  // 1. Flat 2D Deep Night Sky
  ctx.fillStyle = '#0D1619';
  ctx.fillRect(0, 0, width, height);

  // 2. Flat 2D Distant Hills & Cottages
  ctx.fillStyle = '#132024';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  ctx.bezierCurveTo(width * 0.25, height * 0.58, width * 0.75, height * 0.68, width, height * 0.62);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  drawCottage(ctx, width * 0.12, height * 0.62);
  drawCottage(ctx, width * 0.82, height * 0.64);

  // 3. Flat 2D Ground Plane (Mặt sân đình phẳng lì)
  const groundY = height * 0.78;
  ctx.fillStyle = '#1A2920';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.bezierCurveTo(width * 0.3, groundY - 12, width * 0.7, groundY + 8, width, groundY - 4);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();
}

function drawCottage(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#2A4030';
  ctx.beginPath();
  ctx.moveTo(x - 28, y);
  ctx.lineTo(x, y - 22);
  ctx.lineTo(x + 28, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#222E30';
  ctx.fillRect(x - 20, y, 40, 26);

  ctx.fillStyle = '#CFA85B';
  ctx.fillRect(x - 5, y + 8, 10, 8);
  ctx.restore();
}

function drawLittleSpirit(ctx: CanvasRenderingContext2D, s: VillageSpirit, tick: number) {
  ctx.save();
  const y = s.y - s.hopOffset;

  // 1. Hard Flat Cutout Shadow under feet (#191B1D - ZERO BLUR!)
  ctx.fillStyle = '#191B1D';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 4, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. White Mascot / Spirit Sticker Body (Pure Solid White/Cream with 2.8px Ink Contour)
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.ellipse(s.x, y - 18, 13, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Little Green/Gold Folk Leaf Headband
  ctx.fillStyle = s.color;
  ctx.beginPath();
  ctx.moveTo(s.x - 6, y - 34);
  ctx.quadraticCurveTo(s.x, y - 42, s.x + 6, y - 34);
  ctx.quadraticCurveTo(s.x, y - 30, s.x - 6, y - 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Expressive Ink Eyes & Smile
  ctx.fillStyle = '#26292B';
  ctx.beginPath();
  ctx.arc(s.x - 4, y - 20, 2.2, 0, Math.PI * 2);
  ctx.arc(s.x + 4, y - 20, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(s.x, y - 15, 3.5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Cute rosy cheeks
  ctx.fillStyle = '#D48C7F';
  ctx.beginPath();
  ctx.arc(s.x - 7, y - 16, 2, 0, Math.PI * 2);
  ctx.arc(s.x + 7, y - 16, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
