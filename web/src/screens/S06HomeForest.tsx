'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mangnon } from '@/lib/app-state';
import { ImageDB } from '@/lib/image-db';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import { calculateRigPose, drawAnimatedFigure, CreatureAction, autoCropCharacterDataUrl } from '@/lib/auto-rig';
import { Settings, Sparkles, MessageSquareHeart, ScrollText, User, Clock } from 'lucide-react';
import type { UserAccount } from '@/components/UserProfileModal';
import FocusSessionModal from '@/components/FocusSessionModal';

interface S06HomeForestProps {
  mangnon: Mangnon | null;
  timeOfDay: 'morning' | 'noon' | 'dusk' | 'night';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  lastOpenedAt?: string;
  dewdrops?: number;
  onOpenStoryChat: () => void;
  onOpenJourney: () => void;
  onOpenSettings: () => void;
  onOpenBambooStalk?: () => void;
  onFocusReward?: (leaves: number, note: string) => void;
  onUpdateStage?: (stage: 1 | 2 | 3 | 4 | 5) => void;
  restingMangnons?: Mangnon[];
  onLinkMangnon?: (targetId: string, txHash?: string) => void;
}

const STAGE_LABELS: Record<number, string> = {
  1: 'Giai đoạn 1: Mầm Măng Say Ngủ',
  2: 'Giai đoạn 2: Tre Non Vươn Lớn',
  3: 'Giai đoạn 3: Đốt Nứa Phát Sáng',
  4: 'Giai đoạn 4: Ống Nứa Mở Nắp',
  5: 'Giai đoạn 5: Đồng Hành Rừng Tre',
};

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
  restingMangnons,
  timeOfDay,
  season,
  lastOpenedAt,
  dewdrops,
  onOpenStoryChat,
  onOpenJourney,
  onOpenSettings,
  onOpenBambooStalk,
  onFocusReward,
  onUpdateStage,
  onLinkMangnon,
}: S06HomeForestProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechBubbleBtnRef = useRef<HTMLButtonElement | null>(null);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showStatsPopover, setShowStatsPopover] = useState(false);
  // 5 Giai đoạn tăng trưởng của Thánh Khí Tre Măng Non (Mặc định GĐ 5 khi vào Rừng để hiển thị đầy đủ linh hồn & dock)
  const [currentStage, setCurrentStage] = useState<number>(mangnon?.stage || 5);
  const [growingTimeLeft, setGrowingTimeLeft] = useState<number>(() => {
    if (mangnon?.incubationStartedAt) {
      const elapsed = Math.floor((Date.now() - mangnon.incubationStartedAt) / 1000);
      return Math.max(0, 120 - elapsed);
    }
    return 120;
  }); // 2 phút = 120s
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  const changeStage = (stage: 1 | 2 | 3 | 4 | 5) => {
    setCurrentStage(stage);
    if (onUpdateStage) onUpdateStage(stage);
  };

  useEffect(() => {
    if (mangnon?.stage) {
      setCurrentStage(mangnon.stage);
    }
  }, [mangnon?.stage]);

  // Đồng bộ thời gian ấp mầm ngoài rừng theo thời gian thực (wall-clock time)
  useEffect(() => {
    if (mangnon?.incubationStartedAt && currentStage === 2) {
      const elapsed = Math.floor((Date.now() - mangnon.incubationStartedAt) / 1000);
      const left = Math.max(0, 120 - elapsed);
      setGrowingTimeLeft(left);
      if (left <= 0) {
        changeStage(3);
        SoundEngine.playBlessingChime();
        setSpeechBubble('Cây tre đã trưởng thành! Đốt nứa thần kỳ đang phát sáng...');
        setTimeout(() => setSpeechBubble(null), 4000);
      }
    }
  }, [mangnon?.incubationStartedAt, currentStage]);

  // Tự động kích hoạt đếm ngược khi ở Giai đoạn 2 (Growing)
  useEffect(() => {
    if (currentStage === 2 && !isTimerRunning && growingTimeLeft > 0) {
      setIsTimerRunning(true);
    }
  }, [currentStage, isTimerRunning, growingTimeLeft]);

  // Bộ đếm 2 phút cho Giai đoạn 2 (Growing)
  useEffect(() => {
    if (!isTimerRunning) return;
    const timer = setInterval(() => {
      setGrowingTimeLeft((prev) => {
        const left = mangnon?.incubationStartedAt
          ? Math.max(0, 120 - Math.floor((Date.now() - mangnon.incubationStartedAt) / 1000))
          : prev - 1;
        if (left <= 0) {
          setIsTimerRunning(false);
          changeStage(3); // Time's up -> Tự động chuyển sang Stage 3!
          SoundEngine.playBlessingChime();
          setSpeechBubble('Cây tre đã trưởng thành! Đốt nứa thần kỳ đang phát sáng...');
          setTimeout(() => setSpeechBubble(null), 4000);
          return 0;
        }
        return left;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, mangnon?.incubationStartedAt]);

  const handleStageClick = () => {
    if (currentStage === 1) {
      SoundEngine.playBambooKnock();
      setShowUnlockModal(true); // Mở Modal Thức Tỉnh Mầm Măng (-20 Giọt Sương -> Vào Studio)
    } else if (currentStage === 2) {
      if (growingTimeLeft <= 0) {
        SoundEngine.playBlessingChime();
        setIsTimerRunning(false);
        changeStage(3);
        setSpeechBubble('Cây tre đã trưởng thành! Đốt nứa thần kỳ đang phát sáng...');
        setTimeout(() => setSpeechBubble(null), 4000);
      } else {
        SoundEngine.playBambooKnock();
        setSpeechBubble(`Đang tích mầm lực: còn ${Math.floor(growingTimeLeft / 60)}p ${growingTimeLeft % 60}s!`);
        setTimeout(() => setSpeechBubble(null), 3000);
      }
    } else if (currentStage === 3) {
      SoundEngine.playBlessingChime();
      changeStage(4);
      setSpeechBubble('Ống nứa đã hé mở! Sinh linh bé nhỏ đang say giấc nồng...');
      setTimeout(() => setSpeechBubble(null), 4000);
    } else if (currentStage === 4) {
      SoundEngine.playBlessingChime();
      changeStage(5);
      if (creatureRef?.current) {
        creatureRef.current.action = 'happy_jump';
        creatureRef.current.actionTimer = 150;
      }
      setSpeechBubble(`${mangnon?.name || 'Măng Non'} đã thức tỉnh và bước ra Rừng Tre!`);
      setTimeout(() => setSpeechBubble(null), 3500);
    }
  };

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
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mangnon_user_account');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (typeof u.dewdrops === 'undefined') u.dewdrops = 100;
        setUserAccount(u);
      } catch {}
    }
  }, []);

  // UC08: Lời chào khi quay lại sau nhiều ngày (Luồng E)
  useEffect(() => {
    if (lastOpenedAt && mangnon) {
      const elapsedMs = Date.now() - new Date(lastOpenedAt).getTime();
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      if (elapsedDays >= 7) {
        let greeting = 'It has been a little while. No need to explain anything — just sitting together is enough.';
        if (mangnon.personality === 'haohung') {
          greeting = 'You are back! I missed you so much, come sit with me!';
        } else if (mangnon.personality === 'diemtinh') {
          greeting = 'Good to see you again. The bamboo grove remains as peaceful as always. Rest for a moment.';
        } else if (mangnon.personality === 'nhutnhat') {
          greeting = '...You came back. I missed you...';
        }
        setSpeechBubble(greeting);
        const timer = setTimeout(() => setSpeechBubble(null), 6000);
        return () => clearTimeout(timer);
      } else if (elapsedDays >= 3) {
        setSpeechBubble('Welcome back. I have been here all along.');
        const timer = setTimeout(() => setSpeechBubble(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastOpenedAt, mangnon?.personality]);

  const [croppedUri, setCroppedUri] = useState<string>('');

  // Load and auto-crop creature drawing for Stage 4
  useEffect(() => {
    let isMounted = true;
    async function updateCropped() {
      let rawUri = mangnon?.imageUri || '';
      if ((!rawUri || rawUri.startsWith('idb:')) && typeof window !== 'undefined') {
        const idbKey = mangnon?.imageId || (rawUri ? rawUri.slice(4) : '');
        if (idbKey) {
          try {
            const stored = await ImageDB.get(idbKey);
            if (stored) rawUri = stored;
          } catch {}
        }
      }
      if (!rawUri && typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('mangnon_app_state_v2') || localStorage.getItem('mangnon_app_state_v1');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.activeMangnon?.imageUri) {
              rawUri = parsed.activeMangnon.imageUri;
            } else if (parsed.draftImageUri) {
              rawUri = parsed.draftImageUri;
            }
          }
        } catch {}
      }
      if (!rawUri || rawUri.includes('<ellipse')) {
        // Mẫu sinh linh Áo Yếm dân gian mặc định
        rawUri =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">' +
          '<ellipse cx="44" cy="128" rx="8" ry="6" fill="%236B8F71"/>' +
          '<ellipse cx="76" cy="128" rx="8" ry="6" fill="%236B8F71"/>' +
          '<ellipse cx="60" cy="85" rx="28" ry="32" fill="%236B8F71"/>' +
          '<polygon points="60,65 38,105 82,105" fill="%23C8412F"/>' +
          '<circle cx="60" cy="42" r="20" fill="%23F6EBD4"/>' +
          '<circle cx="53" cy="40" r="2.5" fill="%232B2118"/>' +
          '<circle cx="67" cy="40" r="2.5" fill="%232B2118"/>' +
          '<path d="M56,48 Q60,52 64,48" fill="none" stroke="%232B2118" stroke-width="2"/>' +
          '<circle cx="48" cy="46" r="3" fill="%23E8837A"/>' +
          '<circle cx="72" cy="46" r="3" fill="%23E8837A"/>' +
          '<path d="M60,22 C58,10 66,6 70,12 C66,18 62,22 60,22 Z" fill="%23A7C4AC"/>' +
          '</svg>';
      }

      if (rawUri) {
        const cropped = await autoCropCharacterDataUrl(rawUri, 8);
        if (isMounted) {
          setCroppedUri(cropped);
          const img = new Image();
          img.src = cropped;
          img.onload = () => {
            if (isMounted) {
              creatureImgRef.current = img;
            }
          };
        }
      }
    }
    void updateCropped();
    return () => {
      isMounted = false;
    };
  }, [mangnon?.imageUri, mangnon?.imageId]);

  // Load creature image
  useEffect(() => {
    let active = true;
    const uriToLoad = croppedUri || mangnon?.imageUri;
    if (uriToLoad && !uriToLoad.startsWith('idb:')) {
      const img = new Image();
      img.src = uriToLoad;
      img.onload = () => {
        if (active) {
          creatureImgRef.current = img;
        }
      };
    }
    return () => {
      active = false;
    };
  }, [croppedUri, mangnon?.imageUri]);

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
        color: season === 'autumn' ? '#5C4D43' : '#CFA85B',
      };
    });

    const render = () => {
      tick++;
      const w = 390;
      const h = 844;

      // 1. Draw Flat 2D Bamboo Forest Background (Zero 3D Gradients, Zero Blur)
      ctx.clearRect(0, 0, w, h);

      // Flat solid night sky (No blur, no ambient light ray)
      ctx.fillStyle = timeOfDay === 'night' ? '#141C1E' : timeOfDay === 'dusk' ? '#222E30' : '#1E2B25';
      ctx.fillRect(0, 0, w, h);

      // Distant Layer Bamboo (Naturally curved, dark muted green, zero border)
      ctx.fillStyle = '#1A2426';
      [35, 105, 180, 265, 335].forEach((bx, idx) => {
        const lean = (idx % 2 === 0 ? 1 : -1) * 8;
        ctx.beginPath();
        ctx.moveTo(bx - 7, 0);
        ctx.quadraticCurveTo(bx + lean, h * 0.5, bx - 8, h);
        ctx.lineTo(bx + 8, h);
        ctx.quadraticCurveTo(bx + lean + 16, h * 0.5, bx + 7, 0);
        ctx.closePath();
        ctx.fill();

        // Vạch đốt tre màu vàng đất mờ (rgba(207, 168, 91, 0.35))
        for (let y = 60; y < h; y += 100) {
          ctx.fillStyle = 'rgba(207, 168, 91, 0.35)';
          ctx.fillRect(bx - 9, y, 18, 3.5);
          ctx.fillStyle = '#1A2426';
        }
      });

      // Midground Bamboo Stalks (Subtle natural curve, dark forest color, no borders)
      [15, 75, 150, 225, 305, 370].forEach((bx, idx) => {
        const lean = (idx % 2 === 0 ? -1 : 1) * 12;
        ctx.fillStyle = '#2D3C3F';
        ctx.beginPath();
        ctx.moveTo(bx - 9, 0);
        ctx.quadraticCurveTo(bx + lean, h * 0.5, bx - 10, h);
        ctx.lineTo(bx + 10, h);
        ctx.quadraticCurveTo(bx + lean + 20, h * 0.5, bx + 9, 0);
        ctx.closePath();
        ctx.fill();

        // Vạch đốt tre màu vàng đất mờ
        for (let y = 80; y < h; y += 115) {
          ctx.fillStyle = 'rgba(207, 168, 91, 0.35)';
          ctx.fillRect(bx - 11, y, 22, 4);
        }
      });

      // Ground Plane: Flat Solid Surface (No blurry gradient)
      ctx.fillStyle = '#141C1E';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.9, w * 0.65, 150, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Fireflies with warm glow (#CFA85B with shadowBlur 4)
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(tick * 0.02 + p.y) * 0.2;
        p.y += p.vy;
        if (p.y < 0) p.y = h;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;

        ctx.save();
        ctx.fillStyle = '#CFA85B';
        ctx.shadowColor = '#CFA85B';
        ctx.shadowBlur = 4;
        ctx.globalAlpha = Math.max(0.35, Math.min(0.95, p.alpha + Math.sin(tick * 0.04) * 0.25));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. STAGE 5: Render Puppet on Forest Ground when Awakened
      if (currentStage === 5) {
        const c = creatureRef.current;
        const dx = c.targetX - c.x;
        const dy = c.targetY - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
          c.x += (dx / dist) * 1.6;
          c.y += (dy / dist) * 1.2;
          c.direction = dx > 0 ? 1 : -1;
          if (c.actionTimer <= 0) {
            c.action = 'walk';
          }
        } else {
          if (c.actionTimer <= 0) {
            c.action = 'idle';
          }
        }

        if (c.actionTimer > 0) {
          c.actionTimer--;
          if (c.actionTimer === 0) {
            c.action = 'idle';
          }
        }

        const creatureImg = creatureImgRef.current;
        if (creatureImg) {
          const pose = calculateRigPose(tick, c.action, 1);
          drawAnimatedFigure(
            ctx,
            creatureImg,
            pose,
            c.x,
            c.y,
            110,
            120,
            c.direction,
            c.action,
            tick,
            mangnon?.faceExpr,
            mangnon?.rigData,
            true
          );
        } else {
          // Fallback khi ảnh chưa tải xong hoặc đang dùng linh hồn mẫu: Vẽ nhân vật mộc bản Đông Hồ 2D doodle
          drawSolidShootCutout(
            ctx,
            c.x,
            c.y,
            110,
            120,
            c.direction,
            tick,
            c.action
          );
        }

        // Sợi dây năng lượng rễ tre On-chain nếu đã kết nối (Skill Root Graph)
        if (mangnon?.linkedMangnonId) {
          const rootTargetX = 345;
          const rootTargetY = 660;
          const midX = (c.x + rootTargetX) / 2;
          const midY = (c.y + rootTargetY) / 2 + 35 + Math.sin(tick * 0.05) * 8;

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.lineDashOffset = -tick * 0.8;

          ctx.beginPath();
          ctx.moveTo(c.x, c.y + 40);
          ctx.quadraticCurveTo(midX, midY, rootTargetX, rootTargetY);
          ctx.stroke();

          // Hạt đom đóm chạy dọc theo rễ tre
          const t = (tick * 0.02) % 1;
          const px = (1 - t) * (1 - t) * c.x + 2 * (1 - t) * t * midX + t * t * rootTargetX;
          const py = (1 - t) * (1 - t) * (c.y + 40) + 2 * (1 - t) * t * midY + t * t * rootTargetY;

          ctx.fillStyle = '#CFA85B';
          ctx.shadowColor = '#CFA85B';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Cập nhật vị trí Bong Bóng Thoại "Tâm sự" bay theo đỉnh đầu nhân vật theo thời gian thực (60fps)
        if (speechBubbleBtnRef.current) {
          const creatureX = c.x;
          const hop = c.action === 'happy_jump' || c.action === 'run' ? Math.abs(Math.sin(tick * 0.15)) * 14 : 0;
          const creatureHeadY = c.y - 65 - hop;
          const bubbleX = Math.max(72, Math.min(390 - 72, creatureX + 34));
          const floatY = Math.sin(tick * 0.06) * 4;
          const bubbleY = Math.max(95, creatureHeadY - 12 + floatY);
          speechBubbleBtnRef.current.style.transform = `translate3d(${bubbleX}px, ${bubbleY}px, 0) translate(-50%, -100%)`;
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mangnon, timeOfDay, season, currentStage]);

  // Handle click on canvas to navigate creature
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 390;
    const clickY = ((e.clientY - rect.top) / rect.height) * 844;

    if (currentStage === 5) {
      const c = creatureRef.current;
      const distToCreature = Math.sqrt((clickX - c.x) ** 2 + (clickY - c.y) ** 2);

      if (distToCreature < 55) {
        // Tap on creature: vẫy tay chào hoặc nhảy cẫng lên ăn mừng!
        SoundEngine.playBlessingChime();
        c.action = Math.random() > 0.4 ? 'wave' : 'happy_jump';
        c.actionTimer = 90; // ~1.5 giây

        const speechOptions = content.s06_homeForest.idleSpeech;
        const chosen = speechOptions[Math.floor(Math.random() * speechOptions.length)];
        setSpeechBubble(chosen);
        setTimeout(() => setSpeechBubble(null), 3000);
      } else if (clickY > 400 && clickY < 720) {
        // Navigate creature to ground target
        SoundEngine.playBambooKnock();
        c.targetX = Math.max(60, Math.min(330, clickX));
        c.targetY = clickY;
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-[#222E30] text-dongho-paper overflow-hidden select-none">
      {/* 2D Interactive Game Canvas */}
      <canvas
        ref={canvasRef}
        width={390}
        height={844}
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full cursor-pointer z-0"
      />

      {/* 4 GIAI ĐOẠN SÂN KHẤU BAMBOO GROVE (Ẩn khi Stage 5 đã bước ra Rừng Tre) */}
      {currentStage < 5 && (
        <div
          onClick={handleStageClick}
          className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center justify-center cursor-pointer pointer-events-auto bg-transparent border-0 shadow-none p-0 select-none group"
        >
          {currentStage === 1 && (
            /* STAGE 1: BÚP MĂNG NON (IDLE / CLICK TO UNLOCK) */
            <div className="flex flex-col items-center">
            {/* Animated hint label */}
            <div className="mb-2 px-3 py-1 bg-[#F4EEDD] text-[#26292B] text-[11px] font-black border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] rounded-full flex items-center gap-1.5 animate-bounce">
              <span>🎋 Mầm măng say ngủ</span>
              <span className="text-[9px] text-[#A84D3D] font-black underline">Chạm thức tỉnh (-20 💧)</span>
            </div>
            {/* STAGE 1: BÚP MĂNG NON (ROUGH DOODLE & MUTED PASTEL) */}
            <svg
              viewBox="0 0 140 160"
              className="interactive-cutout h-36 w-32 overflow-visible"
            >
              {/* 1. Khung búp măng tổng thể (Dusty sage green #7E9A85) */}
              <path
                d="M70,14 C44,50 30,96 34,142 C58,150 82,150 106,142 C110,96 96,50 70,14 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* 2. Chóp măng non màu thổ hoàng nhạt (#CFA85B) */}
              <path
                d="M70,14 C57,34 49,54 46,72 C60,64 73,50 84,35 C80,26 75,19 70,14 Z"
                fill="#CFA85B"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* 3. Bẹ măng trái ôm chéo (#7E9A85) */}
              <path
                d="M42,58 C33,86 31,115 34,142 C54,148 74,148 92,144 C78,118 58,88 42,58 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* 4. Bẹ măng phải ôm trọn phần gốc (Muted olive #5A6544) */}
              <path
                d="M100,66 C78,98 54,122 34,136 L34,142 C58,150 82,150 106,142 C108,116 106,90 100,66 Z"
                fill="#5A6544"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* 5. Nét gân phác thảo doodle mộc */}
              <path
                d="M68,26 C63,40 59,52 57,62 M86,98 C82,114 76,128 70,140"
                fill="none"
                stroke="#26292B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {currentStage === 2 && (
          /* STAGE 2: MĂNG ĐANG VƯƠN THÀNH TRE NON (2-MINUTE GROWING) */
          <div className="flex flex-col items-center">
            <svg
              viewBox="0 0 160 220"
              className="interactive-cutout h-52 w-40 overflow-visible"
            >
              {/* Lá tre non vươn ra bên phải (Dusty sage light) */}
              <path
                d="M96,92 C118,80 136,82 146,94 C130,104 112,102 96,92 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Lá tre non vươn ra bên trái */}
              <path
                d="M64,142 C42,130 24,132 14,144 C30,154 48,152 64,142 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Đốt tre gốc (Muted olive #5A6544) */}
              <path
                d="M52,144 C56,168 54,188 48,206 C70,212 90,212 112,206 C106,188 104,168 108,144 Z"
                fill="#5A6544"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Bẹ măng còn ôm ở sát gốc (#7E9A85) */}
              <path
                d="M48,206 C68,186 86,168 106,156 L112,206 C90,212 70,212 48,206 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Đốt tre giữa (#7E9A85) */}
              <path
                d="M56,92 C60,110 60,126 54,144 L106,144 C100,126 100,110 104,92 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Búp măng ngọn trên cùng (#8FA996) */}
              <path
                d="M80,14 C62,40 56,66 56,92 L104,92 C104,66 98,40 80,14 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Chóp trên đỉnh màu thổ hoàng (#CFA85B) */}
              <path
                d="M80,14 C70,30 64,46 62,60 C74,52 84,40 92,28 C88,22 84,17 80,14 Z"
                fill="#CFA85B"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Hai mắt đốt tre nét mực đen thô mộc */}
              <rect x="48" y="88" width="64" height="8" rx="4" fill="#CFA85B" stroke="#26292B" strokeWidth="3.2" />
              <rect x="46" y="140" width="68" height="8" rx="4" fill="#CFA85B" stroke="#26292B" strokeWidth="3.2" />

              {/* Gân nét doodle trên thân tre */}
              <path
                d="M72,104 L70,130 M90,156 L92,186"
                fill="none"
                stroke="#26292B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            {/* Bộ đếm 2 phút */}
            <div className="mt-1 px-3 py-1 bg-[#F4EEDD] text-[#26292B] text-[11px] font-bold border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] rounded-full flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3 h-3 text-[#A84D3D]" />
              <span>{Math.floor(growingTimeLeft / 60).toString().padStart(2, '0')}:{(growingTimeLeft % 60).toString().padStart(2, '0')}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTimerRunning(false);
                  setGrowingTimeLeft(0);
                  changeStage(3);
                  SoundEngine.playBlessingChime();
                  setSpeechBubble('Cây tre đã trưởng thành! Đốt nứa thần kỳ đang phát sáng...');
                  setTimeout(() => setSpeechBubble(null), 4000);
                }}
                className="text-[9px] text-[#A84D3D] underline ml-1 hover:text-[#26292B] font-bold cursor-pointer"
                title="Bỏ qua thời gian chờ để lên Cây Tre ngay"
              >
                xong ngay
              </button>
            </div>
          </div>
        )}

        {currentStage === 3 && (
          /* STAGE 3: TIME'S UP - CÂY TRE VỚI 1 ĐỐT NỨA PHÁT SÁNG (CLICK TO OPEN) */
          <div className="flex flex-col items-center">
            <svg
              viewBox="0 0 160 220"
              className="interactive-cutout h-56 w-40 overflow-visible"
            >
              {/* Lá tre non vươn ra bên phải (#8FA996) */}
              <path
                d="M96,92 C118,80 136,82 146,94 C130,104 112,102 96,92 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Lá tre non vươn ra bên trái */}
              <path
                d="M64,142 C42,130 24,132 14,144 C30,154 48,152 64,142 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Đốt tre gốc (Muted olive #5A6544) */}
              <path
                d="M52,144 C56,168 54,188 48,206 C70,212 90,212 112,206 C106,188 104,168 108,144 Z"
                fill="#5A6544"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Bẹ măng ôm sát gốc */}
              <path
                d="M48,206 C68,186 86,168 106,156 L112,206 C90,212 70,212 48,206 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Búp măng ngọn trên cùng */}
              <path
                d="M80,14 C62,40 56,66 56,92 L104,92 C104,66 98,40 80,14 Z"
                fill="#5A6544"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Chóp trên đỉnh */}
              <path
                d="M80,14 C70,30 64,46 62,60 C74,52 84,40 92,28 C88,22 84,17 80,14 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* ĐỐT NỨA THẦN KỲ PHÁT SÁNG Ở GIỮA (Muted ochre #CFA85B) */}
              <path
                d="M56,92 C50,110 50,126 54,144 L106,144 C110,126 110,110 104,92 Z"
                fill="#CFA85B"
                stroke="#26292B"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* Khe nứt ánh sáng báo hiệu linh vật chuẩn bị thức tỉnh */}
              <path
                d="M80,98 L74,114 L85,124 L78,138"
                fill="none"
                stroke="#F4EEDD"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M74,114 L65,112 M85,124 L94,126"
                fill="none"
                stroke="#F4EEDD"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Hai mắt đốt tre viền mực đen nét thô mộc */}
              <rect x="48" y="88" width="64" height="8" rx="4" fill="#5C4D43" stroke="#26292B" strokeWidth="3.2" />
              <rect x="46" y="140" width="68" height="8" rx="4" fill="#5C4D43" stroke="#26292B" strokeWidth="3.2" />
            </svg>
            <div className="mt-1 px-3 py-0.5 bg-[#CFA85B] text-[#1F2224] text-[10px] font-black border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] rounded-full animate-bounce">
              ✨ Chạm mở đốt nứa
            </div>
          </div>
        )}

        {currentStage === 4 && (
          /* STAGE 4: ỐNG TRE MỞ NẮP + NHÂN VẬT DO NGƯỜI CHƠI TỰ THIẾT KẾ */
          <div className="flex flex-col items-center">
            <svg
              viewBox="0 0 180 240"
              className="interactive-cutout h-64 w-48 overflow-visible"
            >
              {/* 1. Cành lá tre hai bên (Dusty sage green) */}
              <path
                d="M116,66 C140,52 160,54 170,68 C150,78 130,76 116,66 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M64,172 C40,158 20,160 10,174 C30,184 50,182 64,172 Z"
                fill="#8FA996"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* 2. Đốt ngọn trên cùng */}
              <path
                d="M90,10 C72,32 64,50 64,68 L116,68 C116,50 108,32 90,10 Z"
                fill="#5A6544"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M90,10 C76,28 68,46 66,58 C82,48 96,34 104,22 C100,16 95,12 90,10 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* 3. Đốt gốc dưới cùng (Muted olive) */}
              <path
                d="M62,170 C64,192 60,210 54,228 C78,234 102,234 126,228 C120,210 116,192 118,170 Z"
                fill="#5A6544"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M54,228 C78,204 100,186 118,176 L126,228 C102,234 78,234 54,228 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* 4. MẢNH NẮP VỎ TRE BẬT MỞ SANG BÊN PHẢI */}
              <path
                d="M118,74 C146,82 158,112 150,158 C140,166 126,168 114,166 C122,136 122,104 118,74 Z"
                fill="#7E9A85"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M118,78 C136,86 144,112 138,154 C130,160 120,162 114,162 C120,134 120,104 118,78 Z"
                fill="#5C4D43"
                stroke="#26292B"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />

              {/* 5. THÂN ĐỐT TRE BỔ DỌC + THÀNH GỖ DÀY + LÒNG ỐNG TRE RỖNG */}
              <path
                d="M58,70 C50,102 50,136 58,168 L122,168 C130,136 130,102 122,70 Z"
                fill="#5A6544"
                stroke="#26292B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Thành thịt tre màu mộc trầm (#5C4D43) */}
              <rect
                x="60"
                y="72"
                width="60"
                height="94"
                rx="24"
                fill="#5C4D43"
                stroke="#26292B"
                strokeWidth="3.2"
              />
              {/* Khoang rỗng lòng ống tre màu giấy Dó kem (#F4EEDD) */}
              <rect
                x="66"
                y="78"
                width="48"
                height="82"
                rx="19"
                fill="#F4EEDD"
                stroke="#26292B"
                strokeWidth="3"
              />
              {/* Vòm bóng cel shading 2D trong lòng ống */}
              <path
                d="M66,96 C66,84 76,78 90,78 C104,78 114,84 114,96 C102,90 78,90 66,96 Z"
                fill="#EDE5D2"
              />
              <ellipse cx="90" cy="148" rx="19" ry="9" fill="#CFA85B" />

              {/* 6. NHÂN VẬT DO NGƯỜI CHƠI TỰ VẼ (Đã Auto-Crop & Auto-Fit vừa khít lòng ống x=69..111, y=84..152) */}
              {(croppedUri || mangnon?.imageUri) && (
                <g className="origin-center animate-[breathe_3.6s_ease-in-out_infinite]">
                  <image
                    href={croppedUri || mangnon?.imageUri}
                    x="69"
                    y="84"
                    width="42"
                    height="68"
                    preserveAspectRatio="xMidYMid meet"
                  />
                  <text x="103" y="94" fill="#26292B" fontSize="11" fontWeight="bold">z</text>
                  <text x="110" y="85" fill="#A84D3D" fontSize="14" fontWeight="bold">Z</text>
                </g>
              )}

              {/* 7. Hai mắt đốt tre khóa trên và dưới */}
              <rect x="52" y="65" width="76" height="9" rx="4.5" fill="#5C4D43" stroke="#26292B" strokeWidth="3.5" />
              <rect x="52" y="165" width="76" height="9" rx="4.5" fill="#5C4D43" stroke="#26292B" strokeWidth="3.5" />
            </svg>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                SoundEngine.playBlessingChime();
                changeStage(5);
                if (creatureRef?.current) {
                  creatureRef.current.action = 'happy_jump';
                  creatureRef.current.actionTimer = 150;
                }
                setSpeechBubble(`${mangnon?.name || 'Măng Non'} đã thức tỉnh và bước ra Rừng Tre!`);
                setTimeout(() => setSpeechBubble(null), 3500);
              }}
              className="btn-woodblock mt-2 px-4 py-2 rounded-2xl bg-[#CFA85B] text-[#1F2224] font-black text-xs flex items-center gap-1.5 animate-bounce border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D]"
            >
              <span>✨ Đánh thức {mangnon?.name || 'Sinh Linh'} bước ra Rừng Tre!</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* TOP RIGHT ICONS (Hành trình, Cài đặt & Nút chuyển đổi Giai đoạn 1..5) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
        {/* Nút bấm chuyển nhanh 5 Giai đoạn để kiểm thử & khám phá */}
        <button
          onClick={() => {
            const nextStage = ((currentStage % 5) + 1) as 1 | 2 | 3 | 4 | 5;
            changeStage(nextStage);
            SoundEngine.playBambooKnock();
          }}
          className="h-7 px-2 rounded-full bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] flex items-center justify-center gap-0.5 text-[10px] font-black transition hover:scale-105 active:translate-y-0.5"
          title={`Giai đoạn ${currentStage}/5 (Nhấn để chuyển sang GĐ ${((currentStage % 5) + 1)})`}
        >
          <span>🌱</span>
          <span>{currentStage}/5</span>
        </button>

        {mangnon?.goalTitle && (
          <button
            onClick={onOpenJourney}
            className="w-7 h-7 rounded-full bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] flex items-center justify-center text-xs transition hover:scale-105 active:translate-y-0.5"
            title={`Sổ Hành Trình: ${mangnon.goalTitle}`}
          >
            📜
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="w-7 h-7 rounded-full bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[2px_2px_0px_#191B1D] flex items-center justify-center text-xs transition hover:scale-105 active:translate-y-0.5"
          title="Cài đặt"
        >
          ⚙️
        </button>
      </div>

      {/* FLOATING HAND-DRAWN SPEECH BUBBLE BUTTON (Đi theo đầu nhân vật ở Stage 5) */}
      {currentStage === 5 && (
        <button
          ref={speechBubbleBtnRef}
          type="button"
          onClick={() => {
            SoundEngine.playBambooKnock();
            onOpenStoryChat();
          }}
          aria-label="Tâm sự cùng Sinh Linh"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: 'translate3d(195px, 380px, 0) translate(-50%, -100%)',
            willChange: 'transform',
          }}
          className="group z-20 pointer-events-auto focus:outline-none cursor-pointer select-none"
        >
          <div className="relative flex items-center justify-center w-28 h-20 transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
            <svg
              viewBox="0 0 150 115"
              fill="none"
              className="w-full h-full overflow-visible drop-shadow-[2px_3px_0px_#14110E]"
            >
              {/* 1. Các nét vạch rung vẽ tay bên ngoài viền (Outer Sketch Motion Lines) */}
              <path
                d="M16 42 C12 30, 18 18, 30 12 M22 36 C19 27, 24 19, 33 15"
                stroke="#2B2118"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M128 24 C138 35, 140 52, 134 66 M123 30 C130 39, 132 50, 128 60"
                stroke="#2B2118"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M28 76 C38 86, 54 91, 70 89"
                stroke="#2B2118"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* 2. Lớp bóng dày có gạch sọc Cross-hatching ở cạnh dưới bên phải */}
              <path
                d="M66 83 C95 86, 124 73, 128 48 C131 68, 104 91, 64 89 L46 105 L53 84 Z"
                fill="#DFD5C3"
                stroke="#2B2118"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              {/* Các vạch gạch bóng cross-hatching thủ công */}
              <path
                d="M72 84 L70 89 M82 83 L80 88 M92 81 L91 87 M102 78 L101 84 M111 73 L112 79 M119 66 L121 72"
                stroke="#2B2118"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* 3. Thân Bong Bóng Thoại chính (Dáng bầu dục vẽ tay hơi méo tự nhiên + Đuôi nhọn chỉ xuống) */}
              <path
                d="M24 47 C22 22, 52 10, 82 13 C114 16, 131 31, 127 54 C123 75, 96 85, 65 82 L46 103 L52 79 C33 74, 25 62, 24 47 Z"
                fill="#F6EBD4"
                stroke="#2B2118"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 4. Dấu ngoặc bóng sáng nhỏ bên trong góc bong bóng */}
              <path
                d="M104 25 C112 28, 116 34, 116 41 M101 30 C106 32, 109 36, 109 40"
                stroke="#2B2118"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>

            {/* Nội dung chữ hoặc lời thủ thỉ ngắn bên trong bong bóng */}
            <div className="absolute inset-0 pb-3 pr-1 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="font-hand font-extrabold text-[13px] text-[#2B2118] leading-tight">
                Tâm sự...
              </span>
              <span className="text-[9px] font-bold text-[#6E5A4F] leading-none mt-0.5">
                (Chạm trò chuyện)
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Speech Bubble when tapped */}
      {speechBubble && (
        <div
          className="absolute z-30 px-3.5 py-2 bg-[#F4EEDD] text-[#1F2224] text-xs font-bold border-2 border-[#26292B] shadow-[3px_3.5px_0px_#191B1D] pointer-events-none"
          style={{
            left: `${currentStage === 5 ? creatureRef.current.x - 70 : 125}px`,
            top: `${currentStage === 5 ? creatureRef.current.y - 100 : 380}px`,
            borderRadius: 'var(--radius-doodle-1)',
          }}
        >
          {speechBubble}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#26292B]" />
        </div>
      )}

      {/* STAGE 5 FLOATING DOCK (2 NÚT GỌN GÀNG Ở ĐÁY) */}
      {currentStage === 5 && mangnon && (
        <div className="absolute bottom-20 left-4 right-4 z-20 flex flex-col items-center">
          {/* Popover 4 chỉ số & Rễ tre On-chain */}
          {showStatsPopover && (
            <div className="mb-2 p-3 bg-[#F4EEDD] text-[#26292B] border-2 border-[#26292B] shadow-[4px_4px_0px_#191B1D] rounded-2xl w-full max-w-xs animate-fade-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#26292B]/20 mb-2">
                <span className="text-[11px] font-black uppercase text-[#26292B]">
                  🎋 Rễ Tre Đan Lưới ({(mangnon.stats?.intelligence || 10) + (mangnon.stats?.perseverance || 10) + (mangnon.stats?.fitness || 10) + (mangnon.stats?.creativity || 10)} pts)
                </span>
                <button
                  onClick={() => setShowStatsPopover(false)}
                  className="text-xs font-black text-[#5C4D43] hover:text-[#26292B] px-1"
                >
                  ✕
                </button>
              </div>

              {/* 4 Stats Grid */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-1 rounded-lg bg-white/70 border border-[#26292B]/20">
                  <div className="text-[8px] text-[#5C4D43]">🧠 Hiểu biết</div>
                  <div className="text-xs font-black text-[#1F2224] mt-0.5">{mangnon.stats?.intelligence || 10}</div>
                </div>
                <div className="p-1 rounded-lg bg-white/70 border border-[#26292B]/20">
                  <div className="text-[8px] text-[#5C4D43]">🔥 Kiên trì</div>
                  <div className="text-xs font-black text-[#A84D3D] mt-0.5">{mangnon.stats?.perseverance || 10}</div>
                </div>
                <div className="p-1 rounded-lg bg-white/70 border border-[#26292B]/20">
                  <div className="text-[8px] text-[#5C4D43]">🌱 Sức sống</div>
                  <div className="text-xs font-black text-[#5A6544] mt-0.5">{mangnon.stats?.fitness || 10}</div>
                </div>
                <div className="p-1 rounded-lg bg-white/70 border border-[#26292B]/20">
                  <div className="text-[8px] text-[#5C4D43]">🎨 Sáng tạo</div>
                  <div className="text-xs font-black text-[#CFA85B] mt-0.5">{mangnon.stats?.creativity || 10}</div>
                </div>
              </div>

              {/* Button to open Link Modal */}
              <button
                onClick={() => {
                  setShowStatsPopover(false);
                  setShowLinkModal(true);
                }}
                className="w-full mt-2 py-1.5 px-2 rounded-xl bg-[#CFA85B] hover:bg-[#b8934a] text-[#1F2224] font-black text-[10px] border border-[#26292B] shadow-[1px_1px_0px_#191B1D] flex items-center justify-center gap-1 transition"
              >
                <span>{mangnon.linkedMangnonId ? '🔗 Quản Lý Nối Rễ On-chain' : '🔗 Nối Rễ Tre On-chain'}</span>
              </button>
            </div>
          )}

          {/* Dock 2 Nút (Rút gọn từ 3 nút vì Tâm Sự đã thành Bong Bóng Thoại bay trên đầu) */}
          <div className="flex items-center justify-center gap-2.5 w-full max-w-xs">
            {/* Nút Chính: Học Focus */}
            <button
              onClick={() => setShowFocusModal(true)}
              className="btn-woodblock flex-[1.3] py-3 px-4 rounded-2xl bg-[#CFA85B] text-[#1F2224] text-xs font-black flex items-center justify-center gap-2 transition hover:scale-[1.02] active:translate-y-0.5"
              title="Bắt đầu phiên học tập trung không phạt"
            >
              <span className="text-sm">🧘</span>
              <span>Tập trung (+🍃)</span>
            </button>

            {/* Nút Phụ: Rễ Tre */}
            <button
              onClick={() => setShowStatsPopover(!showStatsPopover)}
              className={`btn-woodblock-paper flex-1 py-3 px-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition hover:scale-[1.02] active:translate-y-0.5 ${
                showStatsPopover ? 'bg-[#CFA85B]' : ''
              }`}
              title="Xem 4 chỉ số và nối rễ kỹ năng"
            >
              <span className="text-sm">🔗</span>
              <span>Rễ Tre ({(mangnon.stats?.intelligence || 10) + (mangnon.stats?.perseverance || 10) + (mangnon.stats?.fitness || 10) + (mangnon.stats?.creativity || 10)})</span>
            </button>
          </div>
        </div>
      )}
      {/* Modal Thức Tỉnh Mầm Măng (Tiêu 20 Giọt Sương -> Vào Studio Thiết Kế) */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 animate-fade-in">
          <div className="relative w-full max-w-xs bamboo-card p-5 text-[#1F2224] flex flex-col items-center text-center">
            <span className="text-3xl mb-1">🎋</span>
            <h3 className="text-base font-extrabold text-[#1F2224]">
              Thức Tỉnh Mầm Măng
            </h3>
            <p className="text-xs text-[#5C4D43] mt-2 leading-relaxed">
              Ống nứa ngàn năm đang đợi một linh hồn. Dùng <strong>20 Giọt Sương 💧</strong> để bắt đầu nét vẽ đầu tiên thổi hồn cho sinh linh!
            </p>

            <div className="my-3 px-3.5 py-1.5 rounded-xl bg-[#26292B]/5 border border-[#26292B]/20 flex items-center gap-2 text-xs font-bold text-[#1F2224]">
              <span>Số dư của bạn:</span>
              <span className="text-[#A84D3D] font-extrabold">
                {typeof dewdrops === 'number' ? dewdrops : (userAccount?.dewdrops ?? 100)} 💧
              </span>
            </div>

            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  SoundEngine.playBlessingChime();
                  const currentDewdrops = typeof dewdrops === 'number' ? dewdrops : (userAccount?.dewdrops ?? 100);
                  const updated = {
                    ...(userAccount || {
                      email: 'si.tu.tap.su@mangnon.vn',
                      name: 'Sĩ Tử Tập Sự',
                      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=mangnon_student',
                      embeddedAddress: '0x7E348BF5B3c3a2D267df6a22f87E3F9ebb0AA',
                      provider: 'guest' as const,
                      connectedAt: new Date().toISOString(),
                    }),
                    dewdrops: Math.max(0, currentDewdrops - 20),
                  };
                  localStorage.setItem('mangnon_user_account', JSON.stringify(updated));
                  setUserAccount(updated);
                  setShowUnlockModal(false);
                  if (onOpenBambooStalk) {
                    onOpenBambooStalk();
                  } else if (typeof window !== 'undefined') {
                    window.location.hash = '#/bat-dau/tao-hinh';
                  }
                }}
                className="btn-woodblock w-full py-2.5 text-xs text-[#1F2224] font-black flex items-center justify-center gap-1.5"
              >
                <span>Thổi Hồn Nét Vẽ</span>
                <span className="text-[10px] text-[#A84D3D] font-bold">(-20 💧)</span>
              </button>

              <button
                onClick={() => setShowUnlockModal(false)}
                className="py-1 text-xs text-[#26292B]/60 hover:text-[#26292B] font-medium"
              >
                Để lúc khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Map Rễ Tre On-chain (Skill Root Graph) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 animate-fade-in">
          <div className="relative w-full max-w-sm bamboo-card p-5 text-[#26292B] flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-[#26292B]/20 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🎋</span>
                <h3 className="text-sm font-extrabold text-[#26292B]">
                  Khế Ước Rễ Tre On-chain
                </h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-xs text-[#26292B]/60 hover:text-[#26292B] font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5C4D43] leading-relaxed">
              Trong văn hóa Việt, rễ tre chùm đan chặt dưới lòng đất giúp cây tre đứng vững trước bão giông. Khi nối rễ với mục tiêu khác, bạn nhận <strong>+25% điểm cộng hưởng</strong> vào chỉ số yếu nhất, đồng thời truyền <strong>+20% điểm</strong> sang bạn đồng hành!
            </p>

            <div className="my-3 space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[10px] font-black uppercase text-[#26292B]/70">
                Chọn đối tượng nối rễ:
              </span>

              {/* Option 1: Đại Thụ Tri Thức Phù Đổng (Mặc định) */}
              <div
                onClick={() => {
                  const tx = `0xRoot${Date.now().toString(16).slice(-8)}...fuji`;
                  SoundEngine.playBlessingChime();
                  onLinkMangnon?.('root-phudong', tx);
                  setShowLinkModal(false);
                  setSpeechBubble('Đã kích hoạt Khế Ước Rễ Tre! Năng lượng đang cộng hưởng...');
                  setTimeout(() => setSpeechBubble(null), 3500);
                }}
                className={`p-2.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                  mangnon?.linkedMangnonId === 'root-phudong'
                    ? 'border-[#5A6544] bg-[#5A6544]/10'
                    : 'border-[#26292B]/20 bg-white/50 hover:border-[#26292B]'
                }`}
              >
                <div>
                  <div className="text-xs font-black text-[#26292B]">🌳 Đại Thụ Tri Thức Phù Đổng</div>
                  <div className="text-[10px] text-[#5C4D43]">Nguồn năng lượng cộng đồng • Buff cân bằng 4 chỉ số</div>
                </div>
                {mangnon?.linkedMangnonId === 'root-phudong' && (
                  <span className="text-xs text-[#5A6544] font-black">✓ Đang nối</span>
                )}
              </div>

              {/* Option 2: Sinh linh tiền bối từ restingMangnons */}
              {restingMangnons && restingMangnons.length > 0 && restingMangnons.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    const tx = `0xRoot${Date.now().toString(16).slice(-8)}...fuji`;
                    SoundEngine.playBlessingChime();
                    onLinkMangnon?.(r.id, tx);
                    setShowLinkModal(false);
                    setSpeechBubble(`Đã nối rễ với tiền bối ${r.name}! Chỉ số đang truyền dẫn...`);
                    setTimeout(() => setSpeechBubble(null), 3500);
                  }}
                  className={`p-2.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                    mangnon?.linkedMangnonId === r.id
                      ? 'border-[#5A6544] bg-[#5A6544]/10'
                      : 'border-[#26292B]/20 bg-white/50 hover:border-[#26292B]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-[#26292B]">🎋 {r.name} ({r.goalTitle})</div>
                    <div className="text-[10px] text-[#5C4D43]">
                      🧠 {r.stats?.intelligence || 10} • 🔥 {r.stats?.perseverance || 10} • 🌱 {r.stats?.fitness || 10} • 🎨 {r.stats?.creativity || 10}
                    </div>
                  </div>
                  {mangnon?.linkedMangnonId === r.id && (
                    <span className="text-xs text-[#5A6544] font-black">✓ Đang nối</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#26292B]/15 flex items-center justify-between text-[10px] text-[#26292B]/60">
              <span>Composable Soulbound Token</span>
              <span className="font-mono text-[#A84D3D]">Avalanche C-Chain</span>
            </div>
          </div>
        </div>
      )}

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

/**
 * 2D Solid Cutout Bamboo Shoot Sticker (Thủ công mộc bản, viền đen 3px, bóng phẳng 0px blur)
 */
function drawSolidShootCutout(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  dir: 1 | -1,
  tick: number,
  action: string
) {
  ctx.save();
  const hop = action === 'happy_jump' || action === 'run' ? Math.abs(Math.sin(tick * 0.15)) * 14 : 0;
  const bounceY = cy - hop;
  const squash = action === 'happy_jump' ? 1 + Math.sin(tick * 0.15) * 0.08 : 1;

  // 1. Hard Flat Cutout Shadow (#0D1619 - Zero Blur!)
  ctx.fillStyle = '#0D1619';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.45, w * 0.38, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, bounceY);
  ctx.scale(dir * squash, (2 - squash));

  // 2. Thick 3.5px Charcoal Ink Contour & Solid Color Fills
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#26292B';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Body Base Shape (Muted Ochre)
  ctx.fillStyle = '#CFA85B';
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.48);
  ctx.bezierCurveTo(w * 0.45, -h * 0.2, w * 0.42, h * 0.35, 0, h * 0.4);
  ctx.bezierCurveTo(-w * 0.42, h * 0.35, -w * 0.45, -h * 0.2, 0, -h * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fresh Bamboo Leaf Cloak (Sage #7E9A85)
  ctx.fillStyle = '#7E9A85';
  ctx.beginPath();
  ctx.moveTo(-w * 0.32, h * 0.32);
  ctx.quadraticCurveTo(-w * 0.15, 0, 0, -h * 0.15);
  ctx.quadraticCurveTo(w * 0.15, 0, w * 0.32, h * 0.32);
  ctx.quadraticCurveTo(0, h * 0.42, -w * 0.32, h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Expressive 2D Eyes (Mực than #26292B, pie-cut Cuphead pupils)
  ctx.fillStyle = '#26292B';
  ctx.beginPath();
  ctx.ellipse(-w * 0.14, -h * 0.12, 4.5, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.14, -h * 0.12, 4.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-w * 0.14 - 1.5, -h * 0.12 - 2, 2, 0, Math.PI * 2);
  ctx.arc(w * 0.14 - 1.5, -h * 0.12 - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Happy ink mouth
  ctx.strokeStyle = '#26292B';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Cute rosy cheeks
  ctx.fillStyle = '#D48C7F';
  ctx.beginPath();
  ctx.arc(-w * 0.26, -h * 0.04, 4, 0, Math.PI * 2);
  ctx.arc(w * 0.26, -h * 0.04, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

