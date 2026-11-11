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
    { x: 220, y: 430, hopOffset: 0, direction: 1, color: '#A7C4AC', name: '' },
    { x: 380, y: 440, hopOffset: 0, direction: -1, color: '#FFD166', name: '' },
    { x: 620, y: 435, hopOffset: 0, direction: 1, color: '#F4A259', name: '' },
    { x: 780, y: 445, hopOffset: 0, direction: -1, color: '#6B8F71', name: '' },
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
          color: Math.random() > 0.4 ? '#E63946' : '#FFD166',
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

    const render = () => {
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

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, currentEnergy, threshold, isBlessed]);

  return (
    <div ref={containerRef} className="relative w-full rounded-3xl overflow-hidden border-2 border-warm-amber/40 shadow-2xl bg-forest-abyss">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto block"
      />

      {/* Village Banner */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto px-4 py-1.5 rounded-full bg-forest-abyss/85 backdrop-blur border border-warm-amber/50 text-xs text-dongho-paper flex items-center gap-2 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-dongho-red animate-pulse"></span>
          <span><strong>Cây Đa Phù Đổng</strong> · Mùa thứ {cycle}</span>
          <span className="text-dongho-paper/50">|</span>
          <span className="text-warm-glow">
            {Array.from({ length: Math.min(Math.round((currentEnergy / threshold) * 5), 5) }).map((_, i) => (
              <span key={i}>🍃</span>
            ))}
          </span>
        </div>

        {currentEnergy >= threshold && (
          <button
            onClick={onTriggerBlessing}
            className="pointer-events-auto px-4 py-2 rounded-xl bg-dongho-red hover:bg-dongho-crimson text-dongho-paper font-bold text-xs shadow-xl animate-bounce transition flex items-center gap-1.5 border border-warm-amber"
          >
            🌸 Kích Hoạt Bùng Nổ Hoa Gạo!
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
  // Bầu trời đêm làng quê
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#0D1619');
  skyGrad.addColorStop(0.5, '#1B2A2F');
  skyGrad.addColorStop(1, '#273D44');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Ánh trăng rằm tròn vành vạnh
  ctx.save();
  const moonX = width * 0.78;
  const moonY = 85;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 80);
  moonGlow.addColorStop(0, 'rgba(255, 209, 102, 0.9)');
  moonGlow.addColorStop(0.3, 'rgba(244, 162, 89, 0.4)');
  moonGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 80, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFE099';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Đồi xa và những mái nhà tranh nhấp nhô
  ctx.fillStyle = '#132024';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  ctx.bezierCurveTo(width * 0.25, height * 0.58, width * 0.75, height * 0.68, width, height * 0.62);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // Vài mái nhà tranh làng quê với ánh đèn dầu vàng ấm trong khe cửa
  drawCottage(ctx, width * 0.12, height * 0.62);
  drawCottage(ctx, width * 0.82, height * 0.64);

  // Mặt sân đình làng
  const groundY = height * 0.78;
  const groundGrad = ctx.createLinearGradient(0, groundY - 20, 0, height);
  groundGrad.addColorStop(0, '#2A4030');
  groundGrad.addColorStop(0.4, '#1B2A2F');
  groundGrad.addColorStop(1, '#0D1619');
  ctx.fillStyle = groundGrad;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.bezierCurveTo(width * 0.3, groundY - 15, width * 0.7, groundY + 10, width, groundY - 5);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // TÂM ĐIỂM: CÂY ĐA PHÙ ĐỔNG CỔ THỤ KHỔNG LỒ
  drawSacredBanyanTree(ctx, width * 0.5, groundY + 15, tick, energyRatio, isBlessed);
}

function drawCottage(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Mái nhà tranh tam giác
  ctx.fillStyle = '#3E5C45';
  ctx.beginPath();
  ctx.moveTo(x - 30, y);
  ctx.lineTo(x, y - 24);
  ctx.lineTo(x + 30, y);
  ctx.closePath();
  ctx.fill();

  // Thân nhà đất
  ctx.fillStyle = '#1B2A2F';
  ctx.fillRect(x - 22, y, 44, 28);

  // Ánh đèn dầu ấm trong cửa sổ
  ctx.fillStyle = '#FFD166';
  ctx.fillRect(x - 6, y + 8, 12, 10);
  ctx.restore();
}

function drawSacredBanyanTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  tick: number,
  energyRatio: number,
  isBlessed: boolean
) {
  ctx.save();

  // 1. Thân Cây Đa cổ thụ xù xì và rễ phụ buông xuống
  const trunkWidth = 75;
  const trunkHeight = 170;
  const treeTopY = groundY - trunkHeight;

  // Hào quang mầm lực quanh gốc cây đa
  const auraSize = 90 + energyRatio * 40;
  const auraGrad = ctx.createRadialGradient(x, groundY - 60, 20, x, groundY - 60, auraSize);
  auraGrad.addColorStop(0, isBlessed ? 'rgba(230, 57, 70, 0.45)' : 'rgba(255, 209, 102, 0.3)');
  auraGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, groundY - 60, auraSize, 0, Math.PI * 2);
  ctx.fill();

  // Thân chính
  ctx.fillStyle = '#2A4030';
  ctx.beginPath();
  ctx.moveTo(x - trunkWidth / 2, groundY);
  ctx.quadraticCurveTo(x - trunkWidth * 0.3, groundY - trunkHeight * 0.5, x - trunkWidth * 0.4, treeTopY);
  ctx.lineTo(x + trunkWidth * 0.4, treeTopY);
  ctx.quadraticCurveTo(x + trunkWidth * 0.3, groundY - trunkHeight * 0.5, x + trunkWidth / 2, groundY);
  ctx.closePath();
  ctx.fill();

  // Rễ phụ buông từ cành xuống đất (đặc trưng Cây Đa)
  ctx.strokeStyle = '#3E5C45';
  ctx.lineWidth = 4;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const rootX = x + i * 22;
    ctx.beginPath();
    ctx.moveTo(rootX, treeTopY + 25);
    ctx.quadraticCurveTo(rootX + Math.sin(i * 3) * 10, groundY - 60, rootX + i * 4, groundY);
    ctx.stroke();
  }

  // Mạch mầm lực phát sáng chạy dọc thân cây theo tỷ lệ nạp
  const energySapHeight = trunkHeight * Math.min(1, energyRatio);
  ctx.strokeStyle = '#FFD166';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -tick * 0.4;
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  ctx.lineTo(x, groundY - energySapHeight);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Tán lá Cây Đa rợp bóng
  const canopyRadius = 145;
  const leafGrad = ctx.createRadialGradient(x, treeTopY, 40, x, treeTopY, canopyRadius);
  leafGrad.addColorStop(0, '#52795B');
  leafGrad.addColorStop(0.6, '#3E5C45');
  leafGrad.addColorStop(1, '#1B2A2F');

  ctx.fillStyle = leafGrad;
  ctx.beginPath();
  ctx.arc(x, treeTopY, canopyRadius, 0, Math.PI * 2);
  ctx.arc(x - 90, treeTopY + 25, 80, 0, Math.PI * 2);
  ctx.arc(x + 90, treeTopY + 25, 80, 0, Math.PI * 2);
  ctx.fill();

  // 3. HOA GẠO ĐỎ RỰC NỞ TRÊN CÀNH (khi bùng nổ hoặc tích lũy mầm lực cao)
  const flowerCount = isBlessed ? 28 : Math.floor(energyRatio * 18);
  for (let i = 0; i < flowerCount; i++) {
    const angle = i * 2.39996; // Golden angle
    const r = (canopyRadius - 25) * Math.sqrt((i + 1) / 28);
    const fx = x + Math.cos(angle) * r;
    const fy = treeTopY + Math.sin(angle) * (r * 0.7);

    drawGaoFlower(ctx, fx, fy, isBlessed ? 1 : 0.85);
  }

  ctx.restore();
}

function drawGaoFlower(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#E63946'; // Đỏ hoa gạo Đông Hồ
  for (let p = 0; p < 5; p++) {
    ctx.beginPath();
    ctx.ellipse(0, -6, 3, 7, (p * Math.PI * 2) / 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nhị vàng
  ctx.fillStyle = '#FFD166';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLittleSpirit(ctx: CanvasRenderingContext2D, s: VillageSpirit, tick: number) {
  ctx.save();
  const y = s.y - s.hopOffset;

  // Bóng đổ
  ctx.fillStyle = 'rgba(13, 22, 25, 0.4)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 4, 14, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thân sinh linh măng tre
  ctx.fillStyle = s.color;
  ctx.beginPath();
  ctx.ellipse(s.x, y - 18, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mắt chớp
  ctx.fillStyle = '#1B2A2F';
  ctx.beginPath();
  ctx.arc(s.x - 4, y - 20, 1.8, 0, Math.PI * 2);
  ctx.arc(s.x + 4, y - 20, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Không hiển thị tên người chơi khác (tuân thủ quy tắc riêng tư)
  ctx.restore();
}
