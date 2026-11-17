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
        color: Math.random() > 0.3 ? '#CFA85B' : '#5C4D43',
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
        color: '#7E9A85',
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
    let isMounted = true;

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
      if (!isMounted) return;

      // Không vẽ gì nếu người dùng ẩn tab hoặc gập máy (giải phóng GPU/CPU)
      if (document.hidden) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

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

    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-3xl border-3 border-[#26292B] shadow-[6px_6px_0px_#26292B] bg-[#141C1E]">
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
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A2426] border-2 border-[#26292B] text-xs text-dongho-paper shadow-[2px_2px_0px_#26292B]">
          <span className="w-2 h-2 rounded-full bg-[#CFA85B]"></span>
          <span>{isNight ? '🌙 Đêm Rừng Tre Tĩnh Lặng' : '☀️ Nắng Sớm Xuyên Tán Tre'}</span>
          <span className="text-dongho-paper/50">|</span>
          <span className="text-[#CFA85B] font-medium">{goals.length}/5 sinh linh đang sống</span>
        </div>

        {/* Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Day / Night toggle */}
          <button
            onClick={() => setIsNight(!isNight)}
            title={isNight ? 'Chuyển sang ban ngày' : 'Chuyển sang ban đêm'}
            className="btn-woodblock p-2.5 rounded-xl bg-[#F4EEDD] text-[#26292B]"
          >
            {isNight ? <Sun className="w-4 h-4 text-[#A84D3D]" /> : <Moon className="w-4 h-4 text-[#26292B]" />}
          </button>

          {/* Nút Thêm Măng Non trực tiếp vào rừng */}
          <button
            onClick={onOpenNewGoal}
            disabled={goals.length >= 5}
            className="btn-woodblock px-4 py-2 rounded-xl bg-[#CFA85B] disabled:opacity-40 text-[#26292B] font-bold text-xs flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-[#26292B]" />
            <span>Vẽ Măng Non thả vào rừng</span>
          </button>
        </div>
      </div>

      {/* Bottom In-Game Guide */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none text-[11px] text-dongho-paper/70 bg-[#1A2426] px-4 py-2 rounded-2xl border-2 border-[#26292B]">
        <div>
          👉 <strong>Tương tác game:</strong> Nhấp vào mặt đất để gọi Măng Non nhảy lại · Nhấp trực tiếp vào sinh linh để tâm sự &amp; đố vui.
        </div>
        <div className="hidden sm:block text-[#CFA85B]/90 italic">
          &quot;Rừng tre đón nhận mọi nét vẽ của bạn — không generate đè, sống dậy tự nhiên.&quot;
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CÁC HÀM VẼ ĐỒ HOẠ RỪNG TRE 2D DÔNG HỒ FLAT CUTOUT
// ==========================================

function drawBambooForestBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isNight: boolean,
  tick: number
) {
  // 1. Bầu trời phẳng lì (Flat 2D Solid Sky - Zero gradients/blur)
  ctx.fillStyle = isNight ? '#0E171A' : '#1F3036';
  ctx.fillRect(0, 0, width, height);

  // 2. Hàng tre xa (Background bamboo stalks - phẳng, tối màu, không viền)
  ctx.save();
  const bgStalkColor = isNight ? '#162327' : '#273D44';
  for (let i = 0; i < 22; i++) {
    const x = (i * width) / 20 + Math.sin(i * 9) * 20;
    const stalkWidth = 14 + (i % 4) * 4;
    drawBambooStalk(ctx, x, 0, stalkWidth, height * 0.85, bgStalkColor, tick * 0.005 + i, '#26292B');
  }
  ctx.restore();

  // 3. Hàng tre trung cảnh (Midground bamboo stalks - trầm, không tranh chấp thị giác)
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const x = (i * width) / 12 + Math.cos(i * 7) * 35;
    const stalkWidth = 22 + (i % 3) * 6;
    const color = isNight ? (i % 2 === 0 ? '#1C2C32' : '#23383E') : '#324C45';
    drawBambooStalk(ctx, x, 0, stalkWidth, height * 0.82, color, tick * 0.008 + i, '#273D44');
  }
  ctx.restore();

  // 4. Mặt đất rừng phẳng sắc nét (Flat 2D Cutout Ground)
  const groundY = height * 0.76;
  ctx.fillStyle = isNight ? '#0A1113' : '#132024';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.bezierCurveTo(width * 0.25, groundY - 15, width * 0.5, groundY + 10, width * 0.75, groundY - 8);
  ctx.bezierCurveTo(width * 0.88, groundY - 18, width * 0.95, groundY, width, groundY);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 5. Thảm cỏ rêu phẳng (Flat 2D Grass Lines - No blur)
  ctx.save();
  ctx.strokeStyle = '#273D44';
  ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    const grassX = (i * width) / 28 + Math.sin(i * 11) * 15;
    const grassY = groundY + Math.sin(i * 3) * 8;
    ctx.beginPath();
    ctx.moveTo(grassX, grassY);
    ctx.quadraticCurveTo(grassX + 4, grassY - 10, grassX + 8, grassY - 8);
    ctx.moveTo(grassX + 2, grassY);
    ctx.quadraticCurveTo(grassX - 3, grassY - 8, grassX - 6, grassY - 6);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Hàng tre cận cảnh 2 bên rìa (Flat Framing bamboo)
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
  swaySeed: number,
  jointColor: string = 'rgba(255, 209, 102, 0.35)'
) {
  const nodeHeight = 70;
  const currentSway = Math.sin(swaySeed) * 5;

  ctx.save();
  ctx.fillStyle = color;

  let y = startY;
  while (y < endY) {
    const nextY = Math.min(endY, y + nodeHeight);
    const nodeY = y;
    const swayX = x + (y / endY) * currentSway;

    // Đốt thân tre
    ctx.fillRect(swayX - bambooWidth / 2, nodeY, bambooWidth, nextY - nodeY - 3);

    // Vành đốt tre vàng ấm mờ (rgba(255, 209, 102, 0.35))
    ctx.fillStyle = jointColor;
    ctx.fillRect(swayX - bambooWidth / 2 - 1, nextY - 5, bambooWidth + 2, 3);
    ctx.fillStyle = color;

    // Vài chiếc lá tre nhỏ phẳng
    if (Math.sin(nodeY * 7) > 0.4) {
      drawBambooLeafCluster(ctx, swayX + (bambooWidth / 2) * (Math.sin(nodeY) > 0 ? 1 : -1), nextY - 4);
    }

    y = nextY;
  }
  ctx.restore();
}

function drawBambooLeafCluster(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#273D44';
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
  ctx.fillStyle = isNight ? '#0D1619' : '#1A2A2E';
  ctx.fillRect(x - 22, 0, 44, height);

  // Khớp đốt tre to phẳng trầm
  ctx.fillStyle = '#23383E';
  for (let y = 60; y < height; y += 95) {
    ctx.fillRect(x - 24, y, 48, 4);
  }
  ctx.restore();
}

function drawGlowingBambooInForest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number
) {
  ctx.save();
  // 1. Bóng phẳng sắc nét (Flat 2D Cutout Shadow - Zero Blur)
  ctx.fillStyle = '#0D1619';
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 31, 28, 74, 8);
  ctx.fill();

  // 2. Thân ống nứa dạng sticker khắc gỗ (Woodblock sticker)
  ctx.fillStyle = '#CFA85B';
  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 14, y - 35, 28, 70, 8);
  ctx.fill();
  ctx.stroke();

  // 3. Khe nứt khắc gỗ chu sa
  ctx.strokeStyle = '#A84D3D';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 22);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x - 1, y + 22);
  ctx.stroke();

  // 4. Khung nhãn dạng giấy Dó
  const labelText = 'Ống Nứa';
  ctx.font = 'bold 11px system-ui';
  const textWidth = ctx.measureText(labelText).width;
  ctx.fillStyle = '#F4EEDD';
  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - textWidth / 2 - 8, y - 56, textWidth + 16, 20, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#26292B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, x, y - 46);
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

        ctx.fillStyle = '#CFA85B';
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

  // 1. Bóng đổ phẳng sắc nét (Flat 2D Cutout Shadow - Zero blur)
  ctx.fillStyle = '#0D1619';
  ctx.beginPath();
  const shadowScale = Math.max(0.6, 1 - c.hopOffset * 0.03);
  ctx.ellipse(c.x, c.y + 4, 22 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Vẽ hình ảnh Măng Non (tự vẽ hoặc sprite dạng Cutout Sticker)
  ctx.save();
  ctx.translate(c.x, drawY - 35);
  ctx.scale(c.direction, 1); // Đổi hướng mặt trái / phải theo bước đi

  if (c.imgElement && c.imgElement.complete) {
    ctx.drawImage(c.imgElement, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
  } else {
    // Dự phòng hình Măng tre 2D Đông Hồ Cutout
    // Lớp bóng cứng cắt giấy (Misprint black ink)
    ctx.fillStyle = '#0D1619';
    ctx.beginPath();
    ctx.ellipse(3, 8, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân Măng tre Dó paper / Bamboo Green
    ctx.fillStyle = '#7E9A85';
    ctx.strokeStyle = '#26292B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 5, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mắt Cuphead đặc trưng
    ctx.fillStyle = '#26292B';
    const isBlinking = tick % 150 < 6;
    if (isBlinking) {
      ctx.fillRect(-8, -2, 4, 2);
      ctx.fillRect(4, -2, 4, 2);
    } else {
      ctx.beginPath();
      ctx.arc(-6, -2, 3, 0, Math.PI * 2);
      ctx.arc(6, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 3. Tên Goal (Dó Paper Pill) & Bong bóng thoại (Speech bubble)
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F4EEDD';
  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 2.5;
  ctx.strokeText(c.goal.name.substring(0, 18), c.x, drawY + 16);
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
  const bubbleWidth = textWidth + 18;
  const bubbleHeight = 24;

  // Bóng đổ phẳng sắc nét của bong bóng (Flat 2D Cutout Shadow)
  ctx.fillStyle = '#191B1D';
  ctx.beginPath();
  ctx.roundRect(x - bubbleWidth / 2 + 3, y - bubbleHeight + 3, bubbleWidth, bubbleHeight, 8);
  ctx.fill();

  // Khung bong bóng thoại dạng thẻ giấy Dó
  ctx.fillStyle = '#F4EEDD';
  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - bubbleWidth / 2, y - bubbleHeight, bubbleWidth, bubbleHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Đuôi nhọn bong bóng
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x + 4, y);
  ctx.fillStyle = '#F4EEDD';
  ctx.fill();
  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Chữ bên trong (Mực than mềm)
  ctx.fillStyle = '#26292B';
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

      ctx.save();
      ctx.fillStyle = '#CFA85B';
      ctx.shadowColor = '#CFA85B';
      ctx.shadowBlur = 4;
      ctx.globalAlpha = Math.max(0.25, Math.min(1, p.alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

