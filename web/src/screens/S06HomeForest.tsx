'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mangnon } from '@/lib/app-state';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { calculateRigPose, drawAnimatedFigure, CreatureAction } from '@/lib/auto-rig';
import { Settings, Sparkles, MessageSquareHeart, ScrollText, User, Clock } from 'lucide-react';
import UserProfileModal, { UserAccount } from '@/components/UserProfileModal';
import FocusSessionModal from '@/components/FocusSessionModal';

interface S06HomeForestProps {
  mangnon: Mangnon | null;
  timeOfDay: 'morning' | 'noon' | 'dusk' | 'night';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  lastOpenedAt?: string;
  onOpenStoryChat: () => void;
  onOpenJourney: () => void;
  onOpenSettings: () => void;
  onOpenBambooStalk?: () => void;
  onFocusReward?: (leaves: number, note: string) => void;
}

interface CreaturePosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 1 | -1;
  hopOffset: number;
  action: CreatureAction;
  actionTimer: number;
  speechText?: string;
  speechTimer: number;
}

export default function S06HomeForest({
  mangnon,
  timeOfDay,
  season,
  lastOpenedAt,
  onOpenStoryChat,
  onOpenJourney,
  onOpenSettings,
  onOpenBambooStalk,
  onFocusReward,
}: S06HomeForestProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const creatureRef = useRef<CreaturePosition>({
    x: 195,
    y: 520,
    targetX: 195,
    targetY: 520,
    direction: 1,
    hopOffset: 0,
    action: 'idle',
    actionTimer: 0,
    speechTimer: 0,
  });

  const creatureImgRef = useRef<HTMLImageElement | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mangnon_user_account');
    if (stored) {
      try {
        setUserAccount(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // UC08: Lời chào khi quay lại sau nhiều ngày (Luồng E)
  useEffect(() => {
    if (lastOpenedAt && mangnon) {
      const elapsedMs = Date.now() - new Date(lastOpenedAt).getTime();
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      if (elapsedDays >= 7) {
        let greeting = 'Lâu rồi mới gặp. Không cần kể gì cũng được, ngồi cạnh mình một lát cũng tốt.';
        if (mangnon.personality === 'haohung') {
          greeting = 'Cậu về rồi! Mình chờ cậu mãi, ngồi xuống đây với mình nhé!';
        } else if (mangnon.personality === 'diemtinh') {
          greeting = 'Lâu rồi mới gặp. Rừng tre vẫn êm đềm như ngày cậu đi. Cậu ngồi nghỉ một lát nhé.';
        } else if (mangnon.personality === 'nhutnhat') {
          greeting = '...Cậu về rồi. Mình nhớ cậu lắm...';
        }
        setSpeechBubble(greeting);
        const timer = setTimeout(() => setSpeechBubble(null), 6000);
        return () => clearTimeout(timer);
      } else if (elapsedDays >= 3) {
        setSpeechBubble('Cậu về rồi. Mình vẫn ở đây.');
        const timer = setTimeout(() => setSpeechBubble(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastOpenedAt, mangnon?.personality]);

  // Load creature image
  useEffect(() => {
    if (mangnon?.imageUri) {
      const img = new Image();
      img.src = mangnon.imageUri;
      img.onload = () => {
        creatureImgRef.current = img;
      };
    }
  }, [mangnon?.imageUri]);

  // Listen to Demo action triggers (walk, run, happy_jump, dance, wave, sad)
  useEffect(() => {
    const handleAction = (e: Event) => {
      const custom = e as CustomEvent<CreatureAction>;
      if (custom.detail) {
        creatureRef.current.action = custom.detail;
        creatureRef.current.actionTimer = 240; // ~4s để người chơi ngắm trọn vẹn hoạt ảnh
      }
    };
    window.addEventListener('mangnon_action', handleAction);
    return () => window.removeEventListener('mangnon_action', handleAction);
  }, []);

  // Canvas dimensions and 2D Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let tick = 0;

    // Create ambient particles (fireflies or leaves) using deterministic positions
    const particleCount = timeOfDay === 'night' ? 24 : 16;
    const particles = Array.from({ length: particleCount }).map((_, i) => {
      // Golden angle seeding for even distribution without Math.random()
      const phi = (i * 137.508) % 360;
      const r = ((i * 0.618 + 0.3) % 1);
      return {
        x: (phi / 360) * 390,
        y: (r * 844),
        vx: (((i * 7 + 3) % 10) / 10 - 0.5) * 0.4,
        vy: (((i * 13 + 5) % 10) / 10) * 0.3 - 0.6,
        size: ((i * 3 + 1) % 5) * 0.5 + 1.5,
        alpha: ((i * 11 + 2) % 8) * 0.1 + 0.2,
        color: season === 'autumn' ? '#F4A259' : '#FFD166',
      };
    });

    const render = () => {
      tick++;
      const w = 390;
      const h = 844;

      // 1. Draw Environmental Ghibli Bamboo Background
      ctx.clearRect(0, 0, w, h);

      // Deep sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (timeOfDay === 'night') {
        skyGrad.addColorStop(0, '#0E171A');
        skyGrad.addColorStop(0.6, '#1B2A2F');
        skyGrad.addColorStop(1, '#0C1416');
      } else if (timeOfDay === 'dusk') {
        skyGrad.addColorStop(0, '#2D1B28');
        skyGrad.addColorStop(0.5, '#4A3331');
        skyGrad.addColorStop(1, '#202D24');
      } else {
        skyGrad.addColorStop(0, '#2E4C38');
        skyGrad.addColorStop(0.5, '#3E5C45');
        skyGrad.addColorStop(1, '#1E2F23');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Ambient Light Ray
      ctx.save();
      const lightGrad = ctx.createLinearGradient(w * 0.5, 0, w * 0.5, h * 0.7);
      lightGrad.addColorStop(0, timeOfDay === 'night' ? 'rgba(255, 209, 102, 0.08)' : 'rgba(255, 240, 180, 0.18)');
      lightGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, 0);
      ctx.lineTo(w * 0.7, 0);
      ctx.lineTo(w * 0.9, h * 0.75);
      ctx.lineTo(w * 0.1, h * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Distant Layer Bamboo (Parallax deep)
      ctx.fillStyle = timeOfDay === 'night' ? '#142327' : '#2A4432';
      [45, 110, 190, 275, 340].forEach((bx) => {
        ctx.fillRect(bx, 0, 14, h);
        for (let y = 50; y < h; y += 90) {
          ctx.strokeStyle = '#1D3527';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bx - 2, y);
          ctx.lineTo(bx + 16, y);
          ctx.stroke();
        }
      });

      // Midground Bamboo Stalks
      ctx.fillStyle = timeOfDay === 'night' ? '#1E3238' : '#3E5C45';
      [15, 80, 155, 230, 310, 375].forEach((bx) => {
        ctx.fillRect(bx, 0, 18, h);
        for (let y = 70; y < h; y += 110) {
          ctx.strokeStyle = '#B98B3E';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(bx - 3, y);
          ctx.lineTo(bx + 21, y);
          ctx.stroke();
        }
      });

      // Ground Silhouette
      ctx.fillStyle = timeOfDay === 'night' ? '#0A1113' : '#142217';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.88, w * 0.65, 160, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floating Fireflies
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(tick * 0.02 + p.y) * 0.2;
        p.y += p.vy;
        if (p.y < 0) p.y = h;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, p.alpha + Math.sin(tick * 0.04) * 0.3));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 2. Creature Behavior & Skeletal Humanoid Action Physics
      const c = creatureRef.current;
      const dx = c.targetX - c.x;
      const dy = c.targetY - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (c.actionTimer > 0) {
        c.actionTimer--;
      } else if (dist > 75) {
        // Chạy bộ nhanh khi mục tiêu ở xa (RUN)
        c.action = 'run';
        c.direction = dx > 0 ? 1 : -1;
        const speed = 3.2;
        c.x += (dx / dist) * speed;
        c.y += (dy / dist) * speed;
      } else if (dist > 6) {
        // Đi bộ sải bước nhịp nhàng khi gần (WALK)
        c.action = 'walk';
        c.direction = dx > 0 ? 1 : -1;
        const speed = 1.8;
        c.x += (dx / dist) * speed;
        c.y += (dy / dist) * speed;
      } else {
        // Đứng thở êm dịu (IDLE)
        c.action = 'idle';
      }

      const pose = calculateRigPose(tick, c.action, 1);

      // Draw Creature with Articulated Humanoid Skeletal Layers
      if (mangnon && creatureImgRef.current) {
        // Draw character with animated Head, Torso/Clothes, Arms, Legs, Tail
        // (drawAnimatedFigure draws its own shadow internally)
        drawAnimatedFigure(
          ctx,
          creatureImgRef.current,
          pose,
          c.x,
          c.y,
          90,
          96,
          c.direction,
          c.action,
          tick
        );
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mangnon, timeOfDay, season]);

  // Handle click on canvas to navigate creature
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 390;
    const clickY = ((e.clientY - rect.top) / rect.height) * 844;

    // Check if clicked close to creature
    const c = creatureRef.current;
    const distToCreature = Math.sqrt((clickX - c.x) ** 2 + (clickY - c.y) ** 2);

    if (distToCreature < 50) {
      // Tap on creature: vẫy tay chào hoặc nhảy cẫng lên ăn mừng!
      SoundEngine.playBlessingChime();
      c.action = Math.random() > 0.4 ? 'wave' : 'happy_jump';
      c.actionTimer = 90; // ~1.5 giây

      const speechOptions = content.s06_homeForest.idleSpeech;
      const chosen = speechOptions[Math.floor(Math.random() * speechOptions.length)];
      setSpeechBubble(chosen);
      setTimeout(() => setSpeechBubble(null), 3000);
    } else if (clickY > 400 && clickY < 680) {
      // Navigate creature to ground target
      SoundEngine.playBambooKnock();
      c.targetX = Math.max(50, Math.min(340, clickX));
      c.targetY = clickY;
    }
  };

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper overflow-hidden select-none">
      {/* 2D Interactive Game Canvas */}
      <canvas
        ref={canvasRef}
        width={390}
        height={844}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
      />

      {/* TOP HUD (Header) */}
      <div className="relative z-20 pt-12 px-5 flex items-center justify-between">
        {/* Left: Creature Name & Stage Leaf Stamp */}
        {mangnon ? (
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-warm-glow drop-shadow">
                {mangnon.name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(4)].map((_, idx) => (
                  <span
                    key={idx}
                    className={`text-xs ${
                      idx < mangnon.stage ? 'text-warm-amber drop-shadow-[0_0_6px_#FFD166]' : 'text-dongho-paper/25'
                    }`}
                  >
                    🎋
                  </span>
                ))}
                <span className="text-[10px] text-dongho-paper/60 ml-1 font-medium">
                  {content.s08_memories.stages[mangnon.stage]?.name || ''}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs font-bold text-warm-glow">
            {content.common.appName}
          </div>
        )}

        {/* Right: Studio Canvas Shortcut & Settings */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.hash = '#/bat-dau/tao-hinh';
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-forest-darker/90 border border-warm-amber/50 text-warm-glow text-[11px] font-semibold flex items-center gap-1 hover:border-warm-amber hover:scale-105 transition shadow"
            title="Mở Studio Vẽ Canvas Măng Non"
          >
            <span>🎨</span>
            <span>Vẽ Canvas</span>
          </button>
          <button
            onClick={() => setShowUserModal(true)}
            className="p-1.5 rounded-xl bg-forest-darker/80 border border-bamboo-soft/40 text-dongho-paper/80 hover:text-warm-glow hover:border-warm-amber transition shadow"
            title={userAccount ? `Hồ sơ ${userAccount.name}` : 'Đăng nhập Google'}
          >
            {userAccount ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={userAccount.avatarUrl}
                alt={userAccount.name}
                className="w-5 h-5 rounded-full border border-warm-amber"
              />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-forest-darker/80 border border-bamboo-soft/40 text-dongho-paper/80 hover:text-warm-glow hover:border-warm-amber transition shadow"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hanging Bamboo Journey Slip & Focus Session Button */}
      {mangnon && mangnon.goalTitle && (
        <div className="relative z-20 px-5 mt-2.5 flex items-center gap-2">
          <div
            onClick={onOpenJourney}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-darker/85 border border-warm-amber/40 text-xs text-dongho-paper/90 shadow-lg hover:border-warm-glow cursor-pointer transition"
          >
            <ScrollText className="w-3.5 h-3.5 text-warm-amber" />
            <span className="font-medium truncate max-w-[140px]">{mangnon.goalTitle}</span>
          </div>

          <button
            onClick={() => setShowFocusModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-darker/90 border border-warm-amber/60 text-xs text-warm-glow shadow hover:border-warm-amber hover:scale-105 transition active:scale-95"
            title="Bắt đầu giờ tự học tĩnh lặng cùng Măng Non"
          >
            <Clock className="w-3.5 h-3.5 text-warm-amber" />
            <span className="font-bold text-[11px]">Tập trung</span>
          </button>
        </div>
      )}

      {/* Speech Bubble when tapped */}
      {speechBubble && (
        <div
          className="absolute z-30 px-3.5 py-2 rounded-2xl bg-[#F6EBD4] text-[#1B2A2F] text-xs font-semibold shadow-2xl transition-all duration-300 pointer-events-none"
          style={{
            left: `${creatureRef.current.x - 70}px`,
            top: `${creatureRef.current.y - 100}px`,
          }}
        >
          {speechBubble}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#F6EBD4]" />
        </div>
      )}

      {/* Empty State: Bamboo Stalk Waiting if no creature */}
      {!mangnon && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-auto">
          <div
            onClick={onOpenBambooStalk}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="w-24 h-48 rounded-full bg-warm-amber/25 blur-2xl group-hover:bg-warm-amber/45 transition animate-pulse" />
            <div className="text-4xl -mt-36 group-hover:scale-110 transition duration-300">
              🎋
            </div>
            <p className="text-xs font-medium text-warm-glow mt-8 text-center max-w-xs px-4">
              {timeOfDay === 'night' ? content.s06_homeForest.emptyNight : content.s06_homeForest.emptyDay}
            </p>
            <button className="mt-3 px-5 py-2 rounded-xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow">
              {content.s06_homeForest.btnOpenNow}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating CTA Button: "Kể cho Măng Non nghe" */}
      {mangnon && (
        <div className="absolute bottom-20 left-0 right-0 z-20 px-6 flex justify-center">
          <button
            onClick={onOpenStoryChat}
            className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-warm-amber via-warm-glow to-dongho-ochre text-forest-abyss font-bold text-sm shadow-[0_10px_25px_rgba(244,162,89,0.35)] hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 border border-warm-amber"
          >
            <MessageSquareHeart className="w-5 h-5 text-forest-abyss" />
            <span>{content.s06_homeForest.actionTell}</span>
          </button>
        </div>
      )}
      {/* User Profile / Google Modal */}
      <UserProfileModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onUserChange={(u) => setUserAccount(u)}
      />

      {/* Focus Session Modal (Proof of Output) */}
      <FocusSessionModal
        isOpen={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        mangnon={mangnon}
        onCompleteSession={(leaves, note) => {
          if (onFocusReward) onFocusReward(leaves, note);
        }}
      />
    </div>
  );
}

