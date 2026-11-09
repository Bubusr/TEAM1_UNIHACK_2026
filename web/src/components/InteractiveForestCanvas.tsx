'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Goal, Personality } from '@/lib/types';
import { Sparkles, Sun, Moon, Volume2, VolumeX, Wand2 } from 'lucide-react';

interface InteractiveForestCanvasProps {
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  onOpenNewGoal: () => void;
  onOpenGlowingBamboo: () => void;
  hasGlowingBamboo: boolean;
}

interface ForestCreature {
  id: string;
  goal: Goal;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  state: 'idle' | 'hopping' | 'sleeping';
  hopOffset: number;
  direction: 1 | -1; // 1: right, -1: left
  stateTimer: number;
  speechText?: string;
  speechTimer: number;
  imgElement?: HTMLImageElement;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  alphaSpeed: number;
  color: string;
  type: 'firefly' | 'leaf';
  rotation?: number;
  rotationSpeed?: number;
}

export default function InteractiveForestCanvas({
  goals,
  onSelectGoal,
  onOpenNewGoal,
  onOpenGlowingBamboo,
  hasGlowingBamboo,
}: InteractiveForestCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const creaturesRef = useRef<ForestCreature[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [selectedCreature, setSelectedCreature] = useState<ForestCreature | null>(null);
  const [isNight, setIsNight] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 680 });
  const animationFrameRef = useRef<number | null>(null);

  // Khởi tạo và đồng bộ sinh linh Măng Non khi goals thay đổi
  useEffect(() => {
    const width = canvasDimensions.width;
    const height = canvasDimensions.height;
    const groundY = height * 0.76;

    const existingMap = new Map(creaturesRef.current.map((c) => [c.id, c]));

    const newCreatures: ForestCreature[] = goals.map((goal, idx) => {
      const existing = existingMap.get(goal.id);
      if (existing) {
        existing.goal = goal;
        return existing;
      }

      // Vị trí xuất phát ngẫu nhiên trên mặt đất rừng
      const startX = width * 0.2 + (idx * (width * 0.55)) / Math.max(1, goals.length) + (Math.random() * 80 - 40);
      const startY = groundY + (Math.random() * 50 - 25);

      const creature: ForestCreature = {
        id: goal.id,
        goal,
        x: Math.max(80, Math.min(width - 80, startX)),
        y: startY,
        targetX: startX,
        targetY: startY,
        speed: 0.8 + Math.random() * 0.5,
        state: 'idle',
        hopOffset: 0,
        direction: Math.random() > 0.5 ? 1 : -1,
        stateTimer: 60 + Math.random() * 120,
        speechTimer: 180 + idx * 90,
      };

      // Tải trước hình ảnh vẽ tay của Măng Non
      if (goal.imageUri) {
        const img = new Image();
        img.src = goal.imageUri;
        img.onload = () => {
          creature.imgElement = img;
        };
      }

      return creature;
    });

    creaturesRef.current = newCreatures;
  }, [goals, canvasDimensions]);

  // Khởi tạo các hạt đom đóm & lá tre rơi
  useEffect(() => {
    const particles: Particle[] = [];
    // 35 Đom đóm phát sáng
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvasDimensions.width,
        y: Math.random() * (canvasDimensions.height * 0.85),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        size: 1.5 + Math.random() * 2.5,
        alpha: Math.random(),
        alphaSpeed: 0.01 + Math.random() * 0.02,
        color: Math.random() > 0.3 ? '#FFD166' : '#F4A259',
        type: 'firefly',
      });
    }

    // 15 Lá tre bay nhẹ
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * canvasDimensions.width,
        y: Math.random() * canvasDimensions.height,
        vx: 0.4 + Math.random() * 0.6,
        vy: 0.3 + Math.random() * 0.5,
        size: 6 + Math.random() * 6,
        alpha: 0.4 + Math.random() * 0.4,
        alphaSpeed: 0,
        color: '#6B8F71',
        type: 'leaf',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
      });
    }

    particlesRef.current = particles;
  }, [canvasDimensions]);

  // Cập nhật kích thước canvas theo khung chứa
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({
          width: rect.width || 1200,
          height: Math.max(560, window.innerHeight - 180),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // GAME LOOP CHÍNH: Vẽ rừng tre + chuyển động sinh linh
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const speechPhrases = [
      'Gió đêm mát quá cậu ơi...',
      'Cậu vừa học được điều gì mới thế?',
      'Rễ tre ở đây đâm sâu lắm nè!',
      'Hôm nay cậu có mệt không?',
      'Kể cho mình nghe với...',
      'Măng Non vẫn ở đây đợi cậu!',
      'Đom đóm bay đẹp thật đấy!',
    ];

    const render = () => {
      tick++;
      const { width, height } = canvasDimensions;

      // 1. VẼ NỀN RỪNG TRE NGHỆ THUẬT GHIBLI
      drawBambooForestBackground(ctx, width, height, isNight, tick);

      // 2. VẼ ỐNG NỨA PHÁT SÁNG NẰM TRONG RỪNG (NẾU CÓ)
      if (hasGlowingBamboo) {
        drawGlowingBambooInForest(ctx, width * 0.85, height * 0.72, tick);
      }

      // 3. VẼ SỢI DÂY NĂNG LƯỢNG NỐI CÁC MĂNG NON (MAP NỐI CHỈ SỐ)
      drawEnergyVines(ctx, creaturesRef.current, tick);

      // 4. CẬP NHẬT & VẼ TỪNG SINH LINH MĂNG NON DI CHUYỂN
      const groundY = height * 0.76;

      creaturesRef.current.forEach((c) => {
        // AI Logic di chuyển tự do / nhảy tưng tưng trong rừng
        c.stateTimer--;
        if (c.stateTimer <= 0) {
          if (c.state === 'idle') {
            // Chuyển sang nhảy bước đi
            c.state = 'hopping';
            c.targetX = c.x + (Math.random() * 260 - 130);
            c.targetX = Math.max(80, Math.min(width - 80, c.targetX));
            c.targetY = groundY + (Math.random() * 40 - 20);
            c.direction = c.targetX > c.x ? 1 : -1;
            c.stateTimer = 100 + Math.random() * 140;
          } else {
            // Đứng lại ngắm cảnh / thở
            c.state = 'idle';
            c.hopOffset = 0;
            c.stateTimer = 120 + Math.random() * 180;
          }
        }

        // Logic câu thoại thì thầm định kỳ
        c.speechTimer--;
        if (c.speechTimer <= 0) {
          if (!c.speechText) {
            c.speechText = speechPhrases[Math.floor(Math.random() * speechPhrases.length)];
            c.speechTimer = 160; // Hiện 2.5s
          } else {
            c.speechText = undefined;
            c.speechTimer = 300 + Math.random() * 300; // Nghỉ 5-8s rồi mới nói tiếp
          }
        }

        // Di chuyển vị trí x, y khi đang hopping
        if (c.state === 'hopping') {
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 3) {
            c.x += (dx / dist) * c.speed;
            c.y += (dy / dist) * (c.speed * 0.5);
            // Nhịp nhảy hình parabol mềm mại
            c.hopOffset = Math.sin((tick * 0.12) % Math.PI) * 14;
          } else {
            c.state = 'idle';
            c.hopOffset = 0;
          }
        } else {
          // Nhịp thở phập phồng nhẹ nhàng khi đứng yên
          c.hopOffset = Math.sin(tick * 0.04) * 2.5;
        }

        // Vẽ sinh linh Măng Non lên mặt đất
        drawCreature(ctx, c, tick);
      });

      // 5. CẬP NHẬT & VẼ CÁC HẠT ĐOM ĐÓM & LÁ TRE BAY
      updateAndDrawParticles(ctx, particlesRef.current, width, height, tick);

      // 6. TIẾP TỤC VÒNG LẶP RENDER
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [canvasDimensions, isNight, hasGlowingBamboo]);

  // Xử lý Click trên Rừng Tre
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 1. Kiểm tra nhấp vào Ống nứa phát sáng
    if (hasGlowingBamboo) {
      const bambooX = canvasDimensions.width * 0.85;
      const bambooY = canvasDimensions.height * 0.72;
      const distToBamboo = Math.hypot(clickX - bambooX, clickY - bambooY);
      if (distToBamboo < 45) {
        onOpenGlowingBamboo();
        return;
      }
    }

    // 2. Kiểm tra nhấp vào Măng Non
    for (const c of creaturesRef.current) {
      const dist = Math.hypot(clickX - c.x, clickY - (c.y - c.hopOffset - 35));
      if (dist < 45) {
        onSelectGoal(c.goal);
        return;
      }
    }

    // 3. Nếu nhấp vào mặt đất: Măng Non gần nhất sẽ nhảy lại vị trí được nhấp!
    if (creaturesRef.current.length > 0) {
      let closest = creaturesRef.current[0];
      let minDist = Math.hypot(clickX - closest.x, clickY - closest.y);

      for (let i = 1; i < creaturesRef.current.length; i++) {
        const d = Math.hypot(clickX - creaturesRef.current[i].x, clickY - creaturesRef.current[i].y);
        if (d < minDist) {
          minDist = d;
          closest = creaturesRef.current[i];
        }
      }

      closest.targetX = Math.max(60, Math.min(canvasDimensions.width - 60, clickX));
      closest.targetY = Math.max(canvasDimensions.height * 0.68, Math.min(canvasDimensions.height * 0.88, clickY));
      closest.direction = closest.targetX > closest.x ? 1 : -1;
      closest.state = 'hopping';
      closest.speechText = 'Mình tới ngay nè cậu!';
      closest.speechTimer = 120;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-3xl border-2 border-bamboo-mid/40 shadow-2xl bg-forest-abyss">
      {/* Canvas Game Interactive Screen */}
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onClick={handleCanvasClick}
        className="w-full h-auto cursor-pointer block"
      />

      {/* Top Game World HUD Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Lore status indicator */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-abyss/85 backdrop-blur-md border border-warm-amber/40 text-xs text-dongho-paper shadow-lg">
          <span className="w-2 h-2 rounded-full bg-warm-glow animate-pulse"></span>
          <span>{isNight ? '🌙 Đêm Rừng Tre Tĩnh Lặng' : '☀️ Nắng Sớm Xuyên Tán Tre'}</span>
          <span className="text-dongho-paper/50">|</span>
          <span className="text-warm-glow font-medium">{goals.length}/5 sinh linh đang sống</span>
        </div>

        {/* Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Day / Night toggle */}
          <button
            onClick={() => setIsNight(!isNight)}
            title={isNight ? 'Chuyển sang ban ngày' : 'Chuyển sang ban đêm'}
            className="p-2.5 rounded-xl bg-forest-abyss/85 backdrop-blur border border-bamboo-mid/40 text-warm-glow hover:bg-forest-deep transition shadow"
          >
            {isNight ? <Sun className="w-4 h-4 text-warm-glow" /> : <Moon className="w-4 h-4 text-bamboo-light" />}
          </button>

          {/* Nút Thêm Măng Non trực tiếp vào rừng */}
          <button
            onClick={onOpenNewGoal}
            disabled={goals.length >= 5}
            className="px-4 py-2 rounded-xl bg-warm-amber hover:bg-warm-glow disabled:opacity-40 text-forest-abyss font-bold text-xs shadow-xl flex items-center gap-1.5 transition transform hover:-translate-y-0.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-forest-abyss" />
            <span>Vẽ Măng Non thả vào rừng</span>
          </button>
        </div>
      </div>

      {/* Bottom In-Game Guide */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none text-[11px] text-dongho-paper/70 bg-forest-abyss/75 backdrop-blur-sm px-4 py-2 rounded-2xl border border-bamboo-mid/20">
        <div>
          👉 <strong>Tương tác game:</strong> Nhấp vào mặt đất để gọi Măng Non nhảy lại · Nhấp trực tiếp vào sinh linh để tâm sự &amp; đố vui.
        </div>
        <div className="hidden sm:block text-warm-glow/90 italic">
          &quot;Rừng tre đón nhận mọi nét vẽ của bạn — không generate đè, sống dậy tự nhiên.&quot;
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CÁC HÀM VẼ ĐỒ HOẠ RỪNG TRE NGHỆ THUẬT GHIBLI
// ==========================================

function drawBambooForestBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isNight: boolean,
  tick: number
) {
  // 1. Bầu trời chuyển sắc (Ghibli Sky gradient)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isNight) {
    skyGrad.addColorStop(0, '#0D1619');
    skyGrad.addColorStop(0.45, '#1B2A2F');
    skyGrad.addColorStop(1, '#132024');
  } else {
    skyGrad.addColorStop(0, '#273D44');
    skyGrad.addColorStop(0.4, '#3E5C45');
    skyGrad.addColorStop(1, '#52795B');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Vệt sáng trăng xuyên qua tán lá (Volumetric light rays)
  ctx.save();
  ctx.globalAlpha = isNight ? 0.08 : 0.15;
  const rayGrad = ctx.createLinearGradient(width * 0.3, 0, width * 0.6, height);
  rayGrad.addColorStop(0, '#FFE099');
  rayGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = rayGrad;
  ctx.beginPath();
  ctx.moveTo(width * 0.2, 0);
  ctx.lineTo(width * 0.45, 0);
  ctx.lineTo(width * 0.75, height);
  ctx.lineTo(width * 0.35, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Hàng tre xa (Background bamboo stalks - mờ & sâu)
  ctx.save();
  ctx.globalAlpha = isNight ? 0.25 : 0.35;
  const bgStalkColors = isNight ? '#273D44' : '#3E5C45';
  for (let i = 0; i < 22; i++) {
    const x = (i * width) / 20 + Math.sin(i * 9) * 20;
    const stalkWidth = 14 + (i % 4) * 4;
    drawBambooStalk(ctx, x, 0, stalkWidth, height * 0.85, bgStalkColors, tick * 0.005 + i);
  }
  ctx.restore();

  // 4. Hàng tre trung cảnh (Midground bamboo stalks - rõ nét hơn, có ánh sáng ven)
  ctx.save();
  ctx.globalAlpha = isNight ? 0.65 : 0.75;
  for (let i = 0; i < 14; i++) {
    const x = (i * width) / 12 + Math.cos(i * 7) * 35;
    const stalkWidth = 22 + (i % 3) * 6;
    const color = isNight ? (i % 2 === 0 ? '#3E5C45' : '#2A4030') : '#52795B';
    drawBambooStalk(ctx, x, 0, stalkWidth, height * 0.82, color, tick * 0.008 + i);
  }
  ctx.restore();

  // 5. Mặt đất rừng rêu phong (Forest Floor)
  const groundY = height * 0.76;
  const groundGrad = ctx.createLinearGradient(0, groundY - 40, 0, height);
  if (isNight) {
    groundGrad.addColorStop(0, '#1B2A2F');
    groundGrad.addColorStop(0.3, '#132024');
    groundGrad.addColorStop(1, '#0D1619');
  } else {
    groundGrad.addColorStop(0, '#3E5C45');
    groundGrad.addColorStop(0.4, '#2A4030');
    groundGrad.addColorStop(1, '#1B2A2F');
  }

  ctx.fillStyle = groundGrad;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  // Đường gập ghềnh tự nhiên của đồi đất
  ctx.bezierCurveTo(width * 0.25, groundY - 20, width * 0.5, groundY + 15, width * 0.75, groundY - 10);
  ctx.bezierCurveTo(width * 0.88, groundY - 25, width * 0.95, groundY, width, groundY);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 6. Thảm cỏ rêu & chồi măng nhỏ mọc ven đường
  ctx.save();
  ctx.strokeStyle = '#52795B';
  ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    const grassX = (i * width) / 28 + Math.sin(i * 11) * 15;
    const grassY = groundY + Math.sin(i * 3) * 10;
    ctx.beginPath();
    ctx.moveTo(grassX, grassY);
    ctx.quadraticCurveTo(grassX + 4, grassY - 12, grassX + 8, grassY - 10);
    ctx.moveTo(grassX + 2, grassY);
    ctx.quadraticCurveTo(grassX - 3, grassY - 10, grassX - 6, grassY - 8);
    ctx.stroke();
  }
  ctx.restore();

  // 7. Hàng tre cận cảnh 2 bên rìa màn hình (Framing bamboo)
  drawForegroundBamboo(ctx, 30, height, isNight, tick);
  drawForegroundBamboo(ctx, width - 40, height, isNight, tick);
}

function drawBambooStalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  startY: number,
  bambooWidth: number,
  endY: number,
  color: string,
  swaySeed: number
) {
  const nodeHeight = 70;
  const currentSway = Math.sin(swaySeed) * 6;

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#0D1619';
  ctx.lineWidth = 1;

  let y = startY;
  while (y < endY) {
    const nextY = Math.min(endY, y + nodeHeight);
    const nodeY = y;
    const swayX = x + (y / endY) * currentSway;

    // Đốt thân tre
    ctx.fillRect(swayX - bambooWidth / 2, nodeY, bambooWidth, nextY - nodeY - 3);

    // Vành đốt tre (bamboo joint)
    ctx.fillStyle = '#6B8F71';
    ctx.fillRect(swayX - bambooWidth / 2 - 2, nextY - 5, bambooWidth + 4, 3.5);
    ctx.fillStyle = color;

    // Vài chiếc lá tre nhỏ mọc ra từ đốt
    if (Math.sin(nodeY * 7) > 0.4) {
      drawBambooLeafCluster(ctx, swayX + (bambooWidth / 2) * (Math.sin(nodeY) > 0 ? 1 : -1), nextY - 4);
    }

    y = nextY;
  }
  ctx.restore();
}

function drawBambooLeafCluster(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#6B8F71';
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 4, 14, 3.5, Math.PI / 6, 0, Math.PI * 2);
  ctx.ellipse(x + 18, y + 10, 12, 3, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawForegroundBamboo(
  ctx: CanvasRenderingContext2D,
  x: number,
  height: number,
  isNight: boolean,
  tick: number
) {
  ctx.save();
  ctx.fillStyle = isNight ? '#132024' : '#2A4030';
  ctx.fillRect(x - 22, 0, 44, height);

  // Khớp đốt tre to
  ctx.fillStyle = '#3E5C45';
  for (let y = 60; y < height; y += 95) {
    ctx.fillRect(x - 26, y, 52, 5);
  }
  ctx.restore();
}

function drawGlowingBambooInForest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number
) {
  const pulse = Math.sin(tick * 0.08) * 0.2 + 0.8;

  ctx.save();
  // 1. Ánh sáng vàng ấm lan tỏa
  const glowGrad = ctx.createRadialGradient(x, y, 5, x, y, 75);
  glowGrad.addColorStop(0, 'rgba(255, 209, 102, 0.7)');
  glowGrad.addColorStop(0.5, 'rgba(244, 162, 89, 0.35)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, 75, 0, Math.PI * 2);
  ctx.fill();

  // 2. Thân ống nứa phát sáng
  ctx.fillStyle = '#F4A259';
  ctx.strokeStyle = '#FFD166';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - 12, y - 35, 24, 70, 6);
  ctx.fill();
  ctx.stroke();

  // 3. Khe nứt tỏa ánh sáng ấm
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 25);
  ctx.lineTo(x + 2, y);
  ctx.lineTo(x - 1, y + 25);
  ctx.stroke();

  // 4. Nhãn chữ lơ lửng
  ctx.fillStyle = '#FFD166';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('✨ Ống Nứa Phát Sáng', x, y - 48);
  ctx.restore();
}

function drawEnergyVines(
  ctx: CanvasRenderingContext2D,
  creatures: ForestCreature[],
  tick: number
) {
  if (creatures.length < 2) return;

  ctx.save();
  creatures.forEach((c) => {
    if (c.goal.linkedGoalId) {
      const target = creatures.find((other) => other.id === c.goal.linkedGoalId);
      if (target && target.id > c.id) {
        // Vẽ sợi dây năng lượng đom đóm uốn lượn nối 2 bạn
        const midX = (c.x + target.x) / 2;
        const midY = (c.y + target.y) / 2 - 25 + Math.sin(tick * 0.05) * 8;

        ctx.strokeStyle = 'rgba(255, 209, 102, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -tick * 0.5;

        ctx.beginPath();
        ctx.moveTo(c.x, c.y - 30);
        ctx.quadraticCurveTo(midX, midY, target.x, target.y - 30);
        ctx.stroke();

        // Hạt đom đóm chạy dọc theo dây
        const t = (tick * 0.02) % 1;
        const particleX = (1 - t) * (1 - t) * c.x + 2 * (1 - t) * t * midX + t * t * target.x;
        const particleY = (1 - t) * (1 - t) * (c.y - 30) + 2 * (1 - t) * t * midY + t * t * (target.y - 30);

        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  ctx.restore();
}

function drawCreature(
  ctx: CanvasRenderingContext2D,
  c: ForestCreature,
  tick: number
) {
  ctx.save();

  const spriteSize = 72;
  const drawY = c.y - c.hopOffset;

  // 1. Bóng đổ trên mặt đất (Shadow on forest ground)
  ctx.fillStyle = 'rgba(13, 22, 25, 0.45)';
  ctx.beginPath();
  const shadowScale = Math.max(0.6, 1 - c.hopOffset * 0.03);
  ctx.ellipse(c.x, c.y + 4, 22 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Vòng hào quang mầm lực nhẹ
  const haloGrad = ctx.createRadialGradient(c.x, drawY - 30, 8, c.x, drawY - 30, 45);
  haloGrad.addColorStop(0, 'rgba(107, 143, 113, 0.25)');
  haloGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(c.x, drawY - 30, 45, 0, Math.PI * 2);
  ctx.fill();

  // 3. Vẽ hình ảnh Măng Non (tự vẽ hoặc sprite)
  ctx.save();
  ctx.translate(c.x, drawY - 35);
  ctx.scale(c.direction, 1); // Đổi hướng mặt trái / phải theo bước đi

  if (c.imgElement && c.imgElement.complete) {
    ctx.drawImage(c.imgElement, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
  } else {
    // Dự phòng hình Măng tre tròn xinh
    ctx.fillStyle = '#6B8F71';
    ctx.beginPath();
    ctx.ellipse(0, 5, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mắt chớp
    ctx.fillStyle = '#1B2A2F';
    const isBlinking = tick % 150 < 6;
    if (isBlinking) {
      ctx.fillRect(-8, -2, 4, 1.5);
      ctx.fillRect(4, -2, 4, 1.5);
    } else {
      ctx.beginPath();
      ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 4. Tên Goal & Bong bóng thoại (Speech bubble)
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F7F2E7';
  ctx.fillText(c.goal.name.substring(0, 18), c.x, drawY + 16);

  if (c.speechText) {
    drawSpeechBubble(ctx, c.x, drawY - 55, c.speechText);
  }

  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string
) {
  ctx.save();
  ctx.font = '11px system-ui';
  const textWidth = ctx.measureText(text).width;
  const bubbleWidth = textWidth + 16;
  const bubbleHeight = 24;

  // Khung bong bóng thoại dạng thẻ tre
  ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
  ctx.strokeStyle = '#52795B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - bubbleWidth / 2, y - bubbleHeight, bubbleWidth, bubbleHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Đuôi nhọn bong bóng
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x + 4, y);
  ctx.fillStyle = 'rgba(247, 242, 231, 0.95)';
  ctx.fill();

  // Chữ bên trong
  ctx.fillStyle = '#1B2A2F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - bubbleHeight / 2);
  ctx.restore();
}

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
  tick: number
) {
  ctx.save();
  particles.forEach((p) => {
    if (p.type === 'firefly') {
      p.x += p.vx + Math.sin(tick * 0.03 + p.y) * 0.3;
      p.y += p.vy;
      p.alpha += p.alphaSpeed;
      if (p.alpha > 0.95 || p.alpha < 0.15) p.alphaSpeed = -p.alphaSpeed;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height * 0.85;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'leaf') {
      p.x += p.vx;
      p.y += p.vy;
      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed;
      }

      if (p.x > width) p.x = 0;
      if (p.y > height) p.y = 0;

      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
  ctx.restore();
}

