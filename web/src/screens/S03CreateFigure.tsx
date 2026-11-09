'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { content } from '@/content/vi';
import { SoundEngine } from '@/lib/sound-engine';
import {
  generateDefaultHumanoidRig,
  generateArmlessChibiRig,
  generateQuadrupedRig,
  generateRigByType,
  detectHumanoidRigFromCanvas,
  extractPaperCutoutWithStickerBorder,
  calculateRigPose,
  drawInteractiveSkeleton,
  drawReferenceMannequin,
  drawSkeletonWireframe,
  drawPaperPuppet,
  PaperTouchSpring,
  SkeletonRig,
  SkeletonType,
  SKELETON_TYPE_OPTIONS,
  CreatureAction,
  FaceExpression,
  EyeShape,
  MouthShape,
} from '@/lib/auto-rig';
import {
  RotateCcw,
  Redo2,
  Trash2,
  Upload,
  Paintbrush,
  Sparkles,
  Check,
  RefreshCw,
  Move,
  Sliders,
  Palette,
  Undo2,
  ArrowRight,
  ArrowLeft,
  PaintBucket,
  PenTool,
  Feather,
  Wand2,
  Rotate3d,
  ArrowUp,
  ArrowDown,
  Box,
  Compass,
  Footprints,
  Video,
  Download,
  X,
  Film,
  PlayCircle,
  Crop,
  Layers,
  Eraser,
  Eye,
  User,
  Shield,
  Smile,
  Zap,
  Settings,
} from 'lucide-react';

interface S03CreateFigureProps {
  onConfirm: (imageUri: string, source: 'draw' | 'photo' | 'upload' | 'sample') => void;
}

// Bảng màu 14 màu phong phú Đông Hồ & Mở Rộng
const FOLK_PALETTE = [
  { name: 'Đen mực tàu', hex: '#1B2A2F' },
  { name: 'Đỏ chu sa', hex: '#C8412F' },
  { name: 'Vàng hoa cúc', hex: '#FFD166' },
  { name: 'Cam đom đóm', hex: '#F4A259' },
  { name: 'Xanh lá tre', hex: '#3E5C45' },
  { name: 'Xanh măng non', hex: '#6B8F71' },
  { name: 'Xanh chàm rừng', hex: '#1E3F5A' },
  { name: 'Xanh dương nhạt', hex: '#7EB0D5' },
  { name: 'Hồng sen Đông Hồ', hex: '#E8837A' },
  { name: 'Tím khói', hex: '#8F6885' },
  { name: 'Nâu đất đỏ', hex: '#8D5B4C' },
  { name: 'Nâu vỏ tre', hex: '#5C3D2E' },
  { name: 'Trắng điệp', hex: '#FFFFFF' },
  { name: 'Xám tro', hex: '#7A8B8B' },
];

// 3 Mẫu Toàn Thân Sinh Vật Đông Hồ
const SAMPLE_HUMANOID_FIGURES = [
  {
    id: 'sample-yem',
    name: 'Bé Măng Áo Yếm',
    desc: 'Hình người mặc áo yếm đỏ Đông Hồ, 2 tay tròn và 2 chân nhảy nhót',
    svgUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">' +
      '<ellipse cx="44" cy="128" rx="8" ry="6" fill="%236B8F71"/>' +
      '<ellipse cx="76" cy="128" rx="8" ry="6" fill="%236B8F71"/>' +
      '<ellipse cx="60" cy="85" rx="28" ry="32" fill="%236B8F71"/>' +
      '<polygon points="60,65 38,105 82,105" fill="%23C8412F"/>' +
      '<circle cx="60" cy="72" r="3" fill="%23FFD166"/>' +
      '<path d="M35 75 Q18 80 24 95 Q32 90 38 82" fill="%236B8F71"/>' +
      '<path d="M85 75 Q102 80 96 95 Q88 90 82 82" fill="%236B8F71"/>' +
      '<circle cx="60" cy="42" r="24" fill="%236B8F71"/>' +
      '<polygon points="60,10 52,24 68,24" fill="%23FFD166"/>' +
      '<circle cx="52" cy="40" r="3.5" fill="%231B2A2F"/>' +
      '<circle cx="68" cy="40" r="3.5" fill="%231B2A2F"/>' +
      '<circle cx="46" cy="48" r="4.5" fill="%23E8837A" opacity="0.7"/>' +
      '<circle cx="74" cy="48" r="4.5" fill="%23E8837A" opacity="0.7"/>' +
      '<path d="M56 48 Q60 52 64 48" stroke="%231B2A2F" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</svg>',
  },
  {
    id: 'sample-fox',
    name: 'Bé Cáo Áo Tơi',
    desc: 'Hình người đầu cáo có đôi tai nhọn, áo tơi nâu ấm áp, 2 tay và 2 chân',
    svgUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">' +
      '<ellipse cx="46" cy="128" rx="9" ry="5.5" fill="%238D5B4C"/>' +
      '<ellipse cx="74" cy="128" rx="9" ry="5.5" fill="%238D5B4C"/>' +
      '<ellipse cx="60" cy="88" rx="26" ry="28" fill="%23F4A259"/>' +
      '<path d="M40 75 Q60 68 80 75 L82 110 Q60 115 38 110 Z" fill="%238D5B4C"/>' +
      '<ellipse cx="32" cy="85" rx="7" ry="14" transform="rotate(25 32 85)" fill="%23F4A259"/>' +
      '<ellipse cx="88" cy="85" rx="7" ry="14" transform="rotate(-25 88 85)" fill="%23F4A259"/>' +
      '<polygon points="40,20 48,42 32,42" fill="%23F4A259"/>' +
      '<polygon points="80,20 72,42 88,42" fill="%23F4A259"/>' +
      '<ellipse cx="60" cy="46" rx="25" ry="20" fill="%23F4A259"/>' +
      '<ellipse cx="60" cy="52" rx="14" ry="10" fill="%23F6EBD4"/>' +
      '<circle cx="51" cy="44" r="3" fill="%231B2A2F"/>' +
      '<circle cx="69" cy="44" r="3" fill="%231B2A2F"/>' +
      '<circle cx="60" cy="49" r="2.5" fill="%231B2A2F"/>' +
      '</svg>',
  },
  {
    id: 'sample-bup',
    name: 'Búp Tre Nhanh Nhẹn',
    desc: 'Dáng người cao thon, áo bẹ rơm, đôi tay lá giang rộng và 2 chân linh hoạt',
    svgUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140">' +
      '<ellipse cx="46" cy="128" rx="8" ry="6" fill="%233E5C45"/>' +
      '<ellipse cx="74" cy="128" rx="8" ry="6" fill="%233E5C45"/>' +
      '<polygon points="60,18 36,112 84,112" fill="%23F4A259"/>' +
      '<polygon points="60,25 42,108 78,108" fill="%23FFD166"/>' +
      '<path d="M38 72 C12 60 16 48 34 58 Z" fill="%236B8F71"/>' +
      '<path d="M82 72 C108 60 104 48 86 58 Z" fill="%236B8F71"/>' +
      '<circle cx="52" cy="56" r="3" fill="%231B2A2F"/>' +
      '<circle cx="68" cy="56" r="3" fill="%231B2A2F"/>' +
      '<path d="M57 66 Q60 70 63 66" stroke="%231B2A2F" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="46" cy="62" r="3.5" fill="%23E8837A" opacity="0.6"/>' +
      '<circle cx="74" cy="62" r="3.5" fill="%23E8837A" opacity="0.6"/>' +
      '</svg>',
  },
];

// Thuật toán Đổ Màu (Flood Fill)
function executeFloodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string
) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const rFill = parseInt(fillColorHex.slice(1, 3), 16);
  const gFill = parseInt(fillColorHex.slice(3, 5), 16);
  const bFill = parseInt(fillColorHex.slice(5, 7), 16);
  const aFill = 255;

  const startPixelX = Math.floor(startX);
  const startPixelY = Math.floor(startY);
  if (startPixelX < 0 || startPixelX >= width || startPixelY < 0 || startPixelY >= height) return;

  const startIndex = (startPixelY * width + startPixelX) * 4;
  const targetR = data[startIndex];
  const targetG = data[startIndex + 1];
  const targetB = data[startIndex + 2];
  const targetA = data[startIndex + 3];

  if (
    Math.abs(targetR - rFill) < 12 &&
    Math.abs(targetG - gFill) < 12 &&
    Math.abs(targetB - bFill) < 12 &&
    Math.abs(targetA - aFill) < 12
  ) {
    return;
  }

  const colorMatch = (idx: number) => {
    return (
      Math.abs(data[idx] - targetR) <= 40 &&
      Math.abs(data[idx + 1] - targetG) <= 40 &&
      Math.abs(data[idx + 2] - targetB) <= 40 &&
      Math.abs(data[idx + 3] - targetA) <= 40
    );
  };

  const queue: [number, number][] = [[startPixelX, startPixelY]];
  const visited = new Uint8Array(width * height);

  let count = 0;
  const maxPixels = width * height;

  while (queue.length > 0 && count < maxPixels) {
    const [x, y] = queue.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const pixelIdx = y * width + x;
    if (visited[pixelIdx]) continue;
    visited[pixelIdx] = 1;

    const dataIdx = pixelIdx * 4;
    if (!colorMatch(dataIdx)) continue;

    data[dataIdx] = rFill;
    data[dataIdx + 1] = gFill;
    data[dataIdx + 2] = bFill;
    data[dataIdx + 3] = aFill;
    count++;

    if (x > 0) queue.push([x - 1, y]);
    if (x < width - 1) queue.push([x + 1, y]);
    if (y > 0) queue.push([x, y - 1]);
    if (y < height - 1) queue.push([x, y + 1]);
  }

  ctx.putImageData(imgData, 0, 0);
}

export default function S03CreateFigure({ onConfirm }: S03CreateFigureProps) {
  // QUY TRÌNH 5 BƯỚC CHUẨN META DEMO LAB (sketch.metademolab.com):
  // 1: Upload / Draw (Vẽ giấy trắng / Tải ảnh)
  // 2: Resize the Box (Định vị nhân vật bằng Bounding Box)
  // 3: Separate Character (Tách nền nhân vật & Tinh chỉnh mặt nạ bằng Bút/Tẩy)
  // 4: Finding Character Joints (Gắn khung xương, Mannequin đối chiếu, Đổi loại khung xương)
  // 5: Add Animation & 3D Paper World (Hoạt ảnh Meta 4 danh mục + Rối giấy 3D Teri Gumball)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Tabs cho Bước 1
  const [tab, setTab] = useState<'draw' | 'photo' | 'samples'>('draw');
  const [rawImageUri, setRawImageUri] = useState<string | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'draw' | 'photo' | 'upload' | 'sample'>('draw');

  // STEP 1: Drawing State
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#1B2A2F');
  const [brushSize, setBrushSize] = useState(6);
  const [activeTool, setActiveTool] = useState<
    'point_pen' | 'brush' | 'brush_giggle' | 'crayon' | 'fill' | 'eraser'
  >('point_pen');
  const [showBodyGuide, setShowBodyGuide] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // STEP 2: Resize Bounding Box
  const boxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [boundingBox, setBoundingBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 25,
    y: 20,
    w: 270,
    h: 280,
  });
  const [dragHandle, setDragHandle] = useState<
    'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right' | 'move' | null
  >(null);
  const dragStartRef = useRef<{ x: number; y: number; initBox: typeof boundingBox }>({
    x: 0,
    y: 0,
    initBox: { x: 25, y: 20, w: 270, h: 280 },
  });

  // STEP 3: Separate Character (Mask Editing & AI Auto-Segmentation)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maskTool, setMaskTool] = useState<'pen' | 'eraser'>('pen');
  const [maskBrushSize, setMaskBrushSize] = useState(16);
  const [isMasking, setIsMasking] = useState(false);
  const [showStickerPreview, setShowStickerPreview] = useState(false);
  const maskHistoryRef = useRef<ImageData[]>([]);

  // AI Auto-Segmentation (rembg AI, Remove.bg, Clipdrop, Replicate)
  const [aiSegmenting, setAiSegmenting] = useState(false);
  const [segmentEngine, setSegmentEngine] = useState<string>('rembg AI Local (u2netp)');
  const [aiCutoutUri, setAiCutoutUri] = useState<string | null>(null);
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);
  const [aiModelChoice, setAiModelChoice] = useState<'auto' | 'u2netp' | 'birefnet' | 'remove_bg' | 'clipdrop' | 'replicate'>('auto');
  const [removeBgKey, setRemoveBgKey] = useState<string>('');
  const [clipdropKey, setClipdropKey] = useState<string>('');
  const [replicateKey, setReplicateKey] = useState<string>('');
  const userEditedMaskRef = useRef(false);

  useEffect(() => {
    try {
      const savedRb = localStorage.getItem('mangnon_rb_key');
      if (savedRb) setRemoveBgKey(savedRb);
      const savedCd = localStorage.getItem('mangnon_cd_key');
      if (savedCd) setClipdropKey(savedCd);
      const savedRep = localStorage.getItem('mangnon_rep_key');
      if (savedRep) setReplicateKey(savedRep);
      const savedModel = localStorage.getItem('mangnon_ai_model');
      if (savedModel) setAiModelChoice(savedModel as any);
    } catch {}
  }, []);

  // STEP 4: Finding Character Joints & Skeleton Types
  const rigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mannequinCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [skeletonType, setSkeletonType] = useState<SkeletonType>('meta_humanoid');
  const [rigData, setRigData] = useState<SkeletonRig>(generateDefaultHumanoidRig());
  const [activeJointId, setActiveJointId] = useState<string | null>(null);
  const [hoverJointId, setHoverJointId] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);

  // STEP 5: Animation & 3D Paper World (Phong cách Teri the Paper Bear trong Gumball)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animationCategory, setAnimationCategory] = useState<
    'walking' | 'jumping' | 'dancing' | 'funny'
  >('walking');
  const [previewMotion, setPreviewMotion] = useState<CreatureAction>('walk');
  const [worldMode, setWorldMode] = useState<'3d_world' | 'turntable'>('3d_world');
  const [showSkeletonWireframe, setShowSkeletonWireframe] = useState(false);
  const [showCreasePattern, setShowCreasePattern] = useState(true);
  const touchSpringRef = useRef<PaperTouchSpring>({
    pressure: 0,
    deflectX: 0,
    deflectY: 0,
    springTick: 0,
  });
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const turntableRotationRef = useRef<number>(0);
  const [turntableRotation, setTurntableRotation] = useState<number>(0);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const step2BaseImgRef = useRef<HTMLImageElement | null>(null);

  // STEP 5: Quản lý Tab & Biểu cảm nét mặt tự chọn (Pull-tab & Nét vẽ Đông Hồ)
  const [step5Tab, setStep5Tab] = useState<'motion' | 'expression'>('motion');
  const [faceExpr, setFaceExpr] = useState<FaceExpression>({
    isAuto: true,
    eye: 'normal',
    mouth: 'smile',
    customFaceCanvas: null,
  });
  const [faceCustomMode, setFaceCustomMode] = useState<'preset' | 'draw'>('preset');
  const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isFaceDrawingRef = useRef<boolean>(false);

  // Xử lý vẽ nét mặt thủ công trên mini-canvas
  const handleFacePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = faceCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isFaceDrawingRef.current = true;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1B2A2F';
    ctx.beginPath();
    ctx.moveTo(x, y);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleFacePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isFaceDrawingRef.current) return;
    const canvas = faceCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleFacePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isFaceDrawingRef.current) return;
    isFaceDrawingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const canvas = faceCanvasRef.current;
    if (canvas) {
      setFaceExpr((prev) => ({
        ...prev,
        isAuto: false,
        customFaceCanvas: canvas,
      }));
    }
  };

  const handleClearCustomFace = () => {
    const canvas = faceCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setFaceExpr((prev) => ({
      ...prev,
      customFaceCanvas: null,
    }));
    SoundEngine.playBambooKnock();
  };

  // Tọa độ nhân vật giấy 3D trong rừng tre (X, Y jump, Z depth)
  const char3DRef = useRef({
    x: 0,
    z: 0,
    y: 0,
    vy: 0,
    targetX: 0,
    targetZ: 0,
    direction: 1 as 1 | -1,
    rotationY: 0,
    targetRotationY: 0,
    action: 'idle' as CreatureAction,
    isJumping: false,
  });

  // Python FastAPI Server & Replicate API Video Generation
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerationStep, setVideoGenerationStep] = useState<string>('');
  const [generatedVideoUri, setGeneratedVideoUri] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedMotionForApi, setSelectedMotionForApi] = useState<string>('walk');

  // Photo Upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // =========================================================================
  // GỬI LÊN PYTHON FASTAPI SERVER TẠO VIDEO HOẠT ẢNH
  // =========================================================================
  const handleTriggerServerAnimation = async (chosenMotion = 'walk') => {
    if (!currentImageUri) return;

    setSelectedMotionForApi(chosenMotion);
    setIsGeneratingVideo(true);
    setVideoGenerationStep('Đang tải nét vẽ lên Python Server...');
    SoundEngine.playBlessingChime();

    setTimeout(() => {
      setVideoGenerationStep('Server định vị 16 khớp Meta Demo Lab & Render MP4...');
    }, 500);

    try {
      const res = await fetch('/api/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: currentImageUri,
          motion: chosenMotion,
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        const vid = data.video_base64 || data.webp_base64;
        setGeneratedVideoUri(vid);
        setShowVideoModal(true);
        SoundEngine.playBlessingChime();
      }
    } catch (e) {
      console.error('Error generating animation video:', e);
    } finally {
      setIsGeneratingVideo(false);
      setVideoGenerationStep('');
    }
  };

  // =========================================================================
  // BƯỚC 1: XỬ LÝ VẼ GIẤY TRẮNG
  // =========================================================================
  useEffect(() => {
    if (step === 1 && tab === 'draw' && drawCanvasRef.current) {
      const cvs = drawCanvasRef.current;
      const ctx = cvs.getContext('2d');
      if (ctx && historyRef.current.length === 0) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const blank = ctx.getImageData(0, 0, cvs.width, cvs.height);
        historyRef.current = [blank];
        historyIndexRef.current = 0;
      }
    }
  }, [step, tab]);

  const saveHistoryState = useCallback(() => {
    const cvs = drawCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(ctx.getImageData(0, 0, cvs.width, cvs.height));
    if (newHistory.length > 25) newHistory.shift();

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    const cvs = drawCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    historyIndexRef.current--;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    SoundEngine.playBambooKnock();
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const cvs = drawCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    historyIndexRef.current++;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    SoundEngine.playBambooKnock();
  };

  const handleClear = () => {
    const cvs = drawCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    saveHistoryState();
    SoundEngine.playWaterSplash();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, cvs: HTMLCanvasElement) => {
    const rect = cvs.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = cvs.width / rect.width;
    const scaleY = cvs.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const cvs = drawCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e, cvs);

    if (activeTool === 'fill') {
      executeFloodFill(ctx, pos.x, pos.y, brushColor);
      saveHistoryState();
      SoundEngine.playWaterSplash();
      return;
    }

    setIsDrawing(true);
    lastPointRef.current = pos;

    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      if (activeTool === 'point_pen') {
        ctx.lineWidth = Math.max(2, brushSize * 0.7);
      } else if (activeTool === 'brush') {
        ctx.lineWidth = brushSize * 1.3;
      } else if (activeTool === 'brush_giggle') {
        ctx.lineWidth = brushSize;
      } else if (activeTool === 'crayon') {
        ctx.lineWidth = brushSize * 1.2;
        ctx.setLineDash([1, 2]);
      }
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (ctx.lineWidth || brushSize) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    const cvs = drawCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const currentPos = getCoordinates(e, cvs);

    ctx.save();
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      if (activeTool === 'point_pen') {
        ctx.lineWidth = Math.max(2, brushSize * 0.7);
      } else if (activeTool === 'brush') {
        ctx.lineWidth = brushSize * 1.3;
      } else if (activeTool === 'brush_giggle') {
        ctx.lineWidth = brushSize;
      } else if (activeTool === 'crayon') {
        ctx.lineWidth = brushSize * 1.2;
        ctx.setLineDash([1, 2]);
      }
    }

    const midX = (lastPointRef.current.x + currentPos.x) / 2;
    const midY = (lastPointRef.current.y + currentPos.y) / 2;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = currentPos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    saveHistoryState();
  };

  // Vẽ tự do xong -> Đi thẳng sang Gắn Khung Xương (Không cần tách nền vì nét vẽ số đã sạch 100%)
  const handleProceedDirectToRigging = () => {
    const cvs = drawCanvasRef.current;
    if (!cvs) return;

    // 1. Quét định vị khớp từ nét vẽ thực tế
    const detected = detectHumanoidRigFromCanvas(cvs, skeletonType);
    setRigData(detected);

    // 2. Tách viền sticker giấy trắng nổi 3D (phong cách Gấu giấy Teri trong Gumball)
    const cutoutCanvas = extractPaperCutoutWithStickerBorder(cvs, 6);
    const cutoutUri = cutoutCanvas.toDataURL('image/png');
    setRawImageUri(cutoutUri);
    setCurrentImageUri(cutoutUri);
    setImageSource('draw');

    const img = new Image();
    img.src = cutoutUri;
    img.onload = () => {
      loadedImgRef.current = img;
      setStep(4); // Nhảy thẳng sang Bước 4 (Gắn khung xương & Mannequin)
      SoundEngine.playBlessingChime();
    };
  };

  // Bước 1 -> Bước 2: Chuyển sang Căn chỉnh khung Bounding Box (Resize the Box - dành cho ảnh chụp tải lên)
  const handleProceedToStep2Resize = () => {
    const cvs = drawCanvasRef.current;
    if (!cvs) return;

    const dataUri = cvs.toDataURL('image/png');
    setRawImageUri(dataUri);
    setImageSource('draw');

    // Tự động phân tích pixel nét vẽ để đặt bounding box ban đầu ôm khít
    const ctx = cvs.getContext('2d');
    if (ctx) {
      const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
      let minX = cvs.width;
      let maxX = 0;
      let minY = cvs.height;
      let maxY = 0;
      let found = false;

      for (let y = 0; y < cvs.height; y++) {
        for (let x = 0; x < cvs.width; x++) {
          const idx = (y * cvs.width + x) * 4;
          if (imgData[idx + 3] > 35 && (imgData[idx] < 235 || imgData[idx + 1] < 235 || imgData[idx + 2] < 235)) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (found && maxX > minX + 10 && maxY > minY + 10) {
        const pad = 12;
        const bx = Math.max(8, minX - pad);
        const by = Math.max(8, minY - pad);
        const bw = Math.min(cvs.width - bx - 8, maxX - minX + pad * 2);
        const bh = Math.min(cvs.height - by - 8, maxY - minY + pad * 2);
        setBoundingBox({ x: bx, y: by, w: bw, h: bh });
      }
    }

    const img = new Image();
    img.src = dataUri;
    img.onload = () => {
      step2BaseImgRef.current = img;
      loadedImgRef.current = img;
      setStep(2);
      SoundEngine.playBambooKnock();
    };
  };

  const handleSelectSampleAndProceed = (sample: (typeof SAMPLE_HUMANOID_FIGURES)[0]) => {
    setRawImageUri(sample.svgUri);
    setCurrentImageUri(sample.svgUri);
    setImageSource('sample');
    setRigData(generateRigByType(skeletonType));
    SoundEngine.playBambooKnock();

    const img = new Image();
    img.src = sample.svgUri;
    img.onload = () => {
      step2BaseImgRef.current = img;
      loadedImgRef.current = img;
      setStep(4);
    };
  };

  const handleUploadAndProceed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(content.s03_createFigure.cameraDenied);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawImg = new Image();
      rawImg.onload = () => {
        // Chuẩn hóa vào khung canvas 330x320 giữ nguyên tỉ lệ (aspect ratio) trên nền giấy trắng
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 330;
        tempCanvas.height = 320;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 330, 320);

        const scale = Math.min(330 / rawImg.naturalWidth, 320 / rawImg.naturalHeight);
        const dw = Math.round(rawImg.naturalWidth * scale);
        const dh = Math.round(rawImg.naturalHeight * scale);
        const dx = Math.round((330 - dw) / 2);
        const dy = Math.round((320 - dh) / 2);

        ctx.drawImage(rawImg, dx, dy, dw, dh);

        // Tự động dò pixel nét vẽ trên ảnh tải lên để đặt khung bounding box ôm sát nhân vật
        const imgData = ctx.getImageData(0, 0, 330, 320).data;
        let minX = 330;
        let maxX = 0;
        let minY = 320;
        let maxY = 0;
        let found = false;

        for (let y = 0; y < 320; y++) {
          for (let x = 0; x < 330; x++) {
            const idx = (y * 330 + x) * 4;
            // Điểm ảnh có nét vẽ (không phải màu trắng tinh hay trong suốt)
            if (imgData[idx + 3] > 35 && (imgData[idx] < 235 || imgData[idx + 1] < 235 || imgData[idx + 2] < 235)) {
              found = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (found && maxX > minX + 15 && maxY > minY + 15) {
          const pad = 12;
          const bx = Math.max(8, minX - pad);
          const by = Math.max(8, minY - pad);
          const bw = Math.min(330 - bx - 8, maxX - minX + pad * 2);
          const bh = Math.min(320 - by - 8, maxY - minY + pad * 2);
          setBoundingBox({ x: bx, y: by, w: bw, h: bh });
        } else {
          // Fallback: Ôm sát vùng ảnh tải lên
          const padX = Math.max(10, Math.round(dw * 0.05));
          const padY = Math.max(10, Math.round(dh * 0.05));
          setBoundingBox({
            x: Math.max(6, dx + padX),
            y: Math.max(6, dy + padY),
            w: Math.min(330 - dx - 12, dw - padX * 2),
            h: Math.min(320 - dy - 12, dh - padY * 2),
          });
        }

        const uri = tempCanvas.toDataURL('image/png');
        setRawImageUri(uri);
        setImageSource('upload');

        const normImg = new Image();
        normImg.onload = () => {
          step2BaseImgRef.current = normImg;
          loadedImgRef.current = normImg;
          setStep(2);
          SoundEngine.playBlessingChime();
        };
        normImg.src = uri;
      };
      rawImg.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // BƯỚC 2: RESIZE THE BOX (ĐỊNH VỊ KHUNG CHỮ NHẬT BAO QUANH NHÂN VẬT)
  // =========================================================================
  useEffect(() => {
    if (step !== 2) return;
    const cvs = boxCanvasRef.current;
    const sourceImg = step2BaseImgRef.current || loadedImgRef.current;
    if (!cvs || !sourceImg) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // 1. Vẽ hình ảnh gốc đã chuẩn hóa tỉ lệ
    ctx.drawImage(sourceImg, 0, 0, cvs.width, cvs.height);

    // 2. Làm tối vùng ngoài Bounding Box
    ctx.save();
    ctx.fillStyle = 'rgba(15, 25, 28, 0.6)';
    // Top
    ctx.fillRect(0, 0, cvs.width, boundingBox.y);
    // Bottom
    ctx.fillRect(0, boundingBox.y + boundingBox.h, cvs.width, cvs.height - (boundingBox.y + boundingBox.h));
    // Left
    ctx.fillRect(0, boundingBox.y, boundingBox.x, boundingBox.h);
    // Right
    ctx.fillRect(
      boundingBox.x + boundingBox.w,
      boundingBox.y,
      cvs.width - (boundingBox.x + boundingBox.w),
      boundingBox.h
    );

    // 3. Viền nét đứt của Bounding Box
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.w, boundingBox.h);
    ctx.setLineDash([]);

    // 4. Vẽ 8 chốt kéo handles
    const { x, y, w, h } = boundingBox;
    const handles = [
      { id: 'tl', px: x, py: y },
      { id: 'top', px: x + w / 2, py: y },
      { id: 'tr', px: x + w, py: y },
      { id: 'right', px: x + w, py: y + h / 2 },
      { id: 'br', px: x + w, py: y + h },
      { id: 'bottom', px: x + w / 2, py: y + h },
      { id: 'bl', px: x, py: y + h },
      { id: 'left', px: x, py: y + h / 2 },
    ];

    handles.forEach((hd) => {
      ctx.fillStyle = '#06D6A0';
      ctx.strokeStyle = '#1B2A2F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hd.px, hd.py, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  }, [step, boundingBox]);

  const handleBoxMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = boxCanvasRef.current;
    if (!cvs) return;
    const pos = getCoordinates(e, cvs);
    const { x, y, w, h } = boundingBox;

    const handles = [
      { id: 'tl', px: x, py: y },
      { id: 'top', px: x + w / 2, py: y },
      { id: 'tr', px: x + w, py: y },
      { id: 'right', px: x + w, py: y + h / 2 },
      { id: 'br', px: x + w, py: y + h },
      { id: 'bottom', px: x + w / 2, py: y + h },
      { id: 'bl', px: x, py: y + h },
      { id: 'left', px: x, py: y + h / 2 },
    ];

    let found: typeof dragHandle = null;
    handles.forEach((hd) => {
      if (Math.hypot(pos.x - hd.px, pos.y - hd.py) < 16) {
        found = hd.id as any;
      }
    });

    if (!found) {
      if (pos.x > x && pos.x < x + w && pos.y > y && pos.y < y + h) {
        found = 'move';
      }
    }

    if (found) {
      setDragHandle(found);
      dragStartRef.current = { x: pos.x, y: pos.y, initBox: { ...boundingBox } };
      SoundEngine.playBambooKnock();
    }
  };

  const handleBoxMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragHandle) return;
    const cvs = boxCanvasRef.current;
    if (!cvs) return;
    const pos = getCoordinates(e, cvs);
    const dx = pos.x - dragStartRef.current.x;
    const dy = pos.y - dragStartRef.current.y;
    const { initBox } = dragStartRef.current;

    let nx = initBox.x;
    let ny = initBox.y;
    let nw = initBox.w;
    let nh = initBox.h;

    if (dragHandle === 'move') {
      nx = Math.max(4, Math.min(cvs.width - nw - 4, initBox.x + dx));
      ny = Math.max(4, Math.min(cvs.height - nh - 4, initBox.y + dy));
    } else if (dragHandle === 'br') {
      nw = Math.max(60, initBox.w + dx);
      nh = Math.max(60, initBox.h + dy);
    } else if (dragHandle === 'tl') {
      nx = Math.min(initBox.x + initBox.w - 60, initBox.x + dx);
      ny = Math.min(initBox.y + initBox.h - 60, initBox.y + dy);
      nw = initBox.w - (nx - initBox.x);
      nh = initBox.h - (ny - initBox.y);
    } else if (dragHandle === 'tr') {
      ny = Math.min(initBox.y + initBox.h - 60, initBox.y + dy);
      nw = Math.max(60, initBox.w + dx);
      nh = initBox.h - (ny - initBox.y);
    } else if (dragHandle === 'bl') {
      nx = Math.min(initBox.x + initBox.w - 60, initBox.x + dx);
      nw = initBox.w - (nx - initBox.x);
      nh = Math.max(60, initBox.h + dy);
    } else if (dragHandle === 'top') {
      ny = Math.min(initBox.y + initBox.h - 60, initBox.y + dy);
      nh = initBox.h - (ny - initBox.y);
    } else if (dragHandle === 'bottom') {
      nh = Math.max(60, initBox.h + dy);
    } else if (dragHandle === 'left') {
      nx = Math.min(initBox.x + initBox.w - 60, initBox.x + dx);
      nw = initBox.w - (nx - initBox.x);
    } else if (dragHandle === 'right') {
      nw = Math.max(60, initBox.w + dx);
    }

    setBoundingBox({ x: nx, y: ny, w: nw, h: nh });
  };

  const handleBoxMouseUp = () => {
    setDragHandle(null);
  };

  // Quét điểm ảnh cục bộ (Fallback)
  const applyLocalPixelScan = () => {
    const cvs = maskCanvasRef.current;
    if (!cvs || !loadedImgRef.current) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.drawImage(loadedImgRef.current, 0, 0, cvs.width, cvs.height);

    const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a > 30 && (r < 235 || g < 235 || b < 235)) {
        data[i] = Math.round(r * 0.35 + 6 * 0.65);
        data[i + 1] = Math.round(g * 0.35 + 214 * 0.65);
        data[i + 2] = Math.round(b * 0.35 + 160 * 0.65);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  // AI Tự động nhận diện & bóc tách nhân vật (rembg / Remove.bg / Clipdrop / Replicate)
  const runAiSegmentation = async (imageUriToSegment: string) => {
    setAiSegmenting(true);
    userEditedMaskRef.current = false;
    try {
      const res = await fetch('/api/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageUriToSegment,
          model: aiModelChoice,
          remove_bg_api_key: removeBgKey || undefined,
          clipdrop_api_key: clipdropKey || undefined,
          replicate_api_token: replicateKey || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.overlay_base64) {
          setSegmentEngine(data.engine || 'rembg AI Local');
          if (data.cutout_base64) {
            setAiCutoutUri(data.cutout_base64);
          }

          const overlayImg = new Image();
          overlayImg.src = data.overlay_base64;
          overlayImg.onload = () => {
            const cvs = maskCanvasRef.current;
            if (cvs) {
              const ctx = cvs.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                ctx.drawImage(overlayImg, 0, 0, cvs.width, cvs.height);
              }
            }
          };
          SoundEngine.playBlessingChime();
          setAiSegmenting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('AI segmentation error, falling back to local scan:', err);
    }

    applyLocalPixelScan();
    setSegmentEngine('Thuật toán nhận diện nét cục bộ');
    setAiSegmenting(false);
  };

  // Bước 2 -> Bước 3: Crop ảnh theo Bounding Box & khởi tạo mặt nạ AI tách nền
  const handleProceedToStep3Separate = () => {
    const sourceImg = step2BaseImgRef.current || loadedImgRef.current;
    if (!sourceImg) return;

    // Cắt phần ảnh nằm gọn trong Bounding Box
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 330;
    cropCanvas.height = 320;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    // 1. Nền giấy trắng sạch
    cropCtx.fillStyle = '#FFFFFF';
    cropCtx.fillRect(0, 0, 330, 320);

    // 2. Canh giữa nhân vật đã cắt, giữ nguyên tỉ lệ (aspect ratio) với lề an toàn
    const targetMaxW = 294; // 330 - 36
    const targetMaxH = 284; // 320 - 36
    const cropScale = Math.min(targetMaxW / boundingBox.w, targetMaxH / boundingBox.h);
    const destW = Math.round(boundingBox.w * cropScale);
    const destH = Math.round(boundingBox.h * cropScale);
    const destX = Math.round((330 - destW) / 2);
    const destY = Math.round((320 - destH) / 2);

    cropCtx.drawImage(
      sourceImg,
      boundingBox.x,
      boundingBox.y,
      boundingBox.w,
      boundingBox.h,
      destX,
      destY,
      destW,
      destH
    );

    const croppedUri = cropCanvas.toDataURL('image/png');
    const croppedImg = new Image();
    croppedImg.src = croppedUri;
    croppedImg.onload = () => {
      loadedImgRef.current = croppedImg;
      setAiCutoutUri(null);
      setStep(3);
      SoundEngine.playBlessingChime();
      runAiSegmentation(croppedUri);
    };
  };

  // =========================================================================
  // BƯỚC 3: SEPARATE CHARACTER (AI TỰ ĐỘNG PHỦ MẶT NẠ & SỬA TAY NẾU CẦN)
  // =========================================================================
  useEffect(() => {
    if (step !== 3) return;
    if (loadedImgRef.current && !aiSegmenting && !aiCutoutUri) {
      runAiSegmentation(loadedImgRef.current.src);
    }
  }, [step]);

  const handleMaskDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMasking) return;
    userEditedMaskRef.current = true;
    const cvs = maskCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e, cvs);
    ctx.save();
    if (maskTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, maskBrushSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(6, 214, 160, 0.45)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, maskBrushSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Bước 3 -> Bước 4: Tạo Sticker Viền Trắng Die-Cut & Chuyển Sang Gắn Khung Xương
  const handleProceedToStep4Joints = () => {
    const cvs = maskCanvasRef.current;
    if (!cvs) return;

    // Tạo sticker viền trắng die-cut giấy thủ công chuẩn Teri the Paper Bear
    const cutoutCanvas = extractPaperCutoutWithStickerBorder(cvs, 6);
    const cutoutUri = cutoutCanvas.toDataURL('image/png');
    setCurrentImageUri(cutoutUri);

    // Tự động quét pixel nét vẽ trên Canvas để căn chỉnh 16 khớp xương chuẩn Meta
    const detected = detectHumanoidRigFromCanvas(cvs, skeletonType);
    setRigData(detected);

    const img = new Image();
    img.src = cutoutUri;
    img.onload = () => {
      loadedImgRef.current = img;
      setStep(4);
      SoundEngine.playBlessingChime();
    };
  };

  // =========================================================================
  // BƯỚC 4: FINDING CHARACTER JOINTS (GẮN KHUNG XƯƠNG & MANNEQUIN ĐỐI CHIẾU)
  // =========================================================================
  useEffect(() => {
    if (step !== 4) return;
    const cvs = rigCanvasRef.current;
    if (!cvs || !loadedImgRef.current) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, cvs.width, cvs.height);

    // 1. Vẽ nhân vật mờ trên nền giấy trắng
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.globalAlpha = 0.88;
    ctx.drawImage(loadedImgRef.current, 10, 10, cvs.width - 20, cvs.height - 20);
    ctx.restore();

    // 2. Vẽ khung xương tương tác chuẩn Meta Demo Lab
    drawInteractiveSkeleton(
      ctx,
      rigData,
      10,
      10,
      cvs.width - 20,
      cvs.height - 20,
      activeJointId,
      hoverJointId
    );
  }, [step, rigData, activeJointId, hoverJointId]);

  // Vẽ hình nhân mẫu đối chiếu (Mannequin Guide) ở góc
  useEffect(() => {
    if (step !== 4) return;
    const cvs = mannequinCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    drawReferenceMannequin(ctx, cvs.width, cvs.height, activeJointId, hoverJointId, skeletonType);
  }, [step, activeJointId, hoverJointId, skeletonType]);

  const handleSelectSkeletonType = (newType: SkeletonType) => {
    setSkeletonType(newType);
    const cvs = maskCanvasRef.current || drawCanvasRef.current;
    if (cvs) {
      const detected = detectHumanoidRigFromCanvas(cvs, newType);
      setRigData(detected);
    } else {
      setRigData(generateRigByType(newType));
    }
    SoundEngine.playBambooKnock();
  };

  const handleRigMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = rigCanvasRef.current;
    if (!cvs) return;
    const pos = getCoordinates(e, cvs);

    const boxX = 10;
    const boxY = 10;
    const boxW = cvs.width - 20;
    const boxH = cvs.height - 20;

    let foundId: string | null = null;
    let minDist = 22;

    rigData.joints.forEach((j) => {
      const jx = boxX + j.relX * boxW;
      const jy = boxY + j.relY * boxH;
      const d = Math.sqrt((pos.x - jx) ** 2 + (pos.y - jy) ** 2);
      if (d < minDist) {
        minDist = d;
        foundId = j.id;
      }
    });

    if (foundId) {
      setActiveJointId(foundId);
      SoundEngine.playBambooKnock();
    }
  };

  const handleRigMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = rigCanvasRef.current;
    if (!cvs) return;
    const pos = getCoordinates(e, cvs);

    const boxX = 10;
    const boxY = 10;
    const boxW = cvs.width - 20;
    const boxH = cvs.height - 20;

    if (activeJointId) {
      const relX = Math.max(0.04, Math.min(0.96, (pos.x - boxX) / boxW));
      const relY = Math.max(0.04, Math.min(0.96, (pos.y - boxY) / boxH));

      setRigData((prev) => ({
        ...prev,
        joints: prev.joints.map((j) => (j.id === activeJointId ? { ...j, relX, relY } : j)),
      }));
    } else {
      let hoverId: string | null = null;
      rigData.joints.forEach((j) => {
        const jx = boxX + j.relX * boxW;
        const jy = boxY + j.relY * boxH;
        if (Math.hypot(pos.x - jx, pos.y - jy) < 18) {
          hoverId = j.id;
        }
      });
      setHoverJointId(hoverId);
    }
  };

  const handleRigMouseUp = () => {
    if (activeJointId) {
      setActiveJointId(null);
    }
  };

  // Bước 4 -> Bước 5: Chuyển Sang Thổi Hồn Hoạt Ảnh & Sân Chơi 3D
  const handleProceedToStep5Animation = () => {
    setStep(5);
    SoundEngine.playBlessingChime();
  };

  // Điều hướng nhân vật trong không gian 3D rừng tre khi người chơi chạm màn hình
  const handlePreviewCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = previewCanvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * cvs.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * cvs.height;

    if (worldMode === '3d_world') {
      const horizonY = 75;
      const groundCenterY = 225;
      const cameraDist = 280;

      if (clickY >= horizonY) {
        const depthRatio = (clickY - horizonY) / (groundCenterY - horizonY);
        const z = depthRatio > 0 ? cameraDist / depthRatio - cameraDist : 0;
        const clampedZ = Math.max(-25, Math.min(150, z));
        const depthScale = cameraDist / (cameraDist + clampedZ);
        const x = (clickX - cvs.width / 2) / depthScale;
        const clampedX = Math.max(-110, Math.min(110, x));

        char3DRef.current.targetX = clampedX;
        char3DRef.current.targetZ = clampedZ;
        SoundEngine.playBambooKnock();
      }
    } else {
      SoundEngine.playBlessingChime();
    }
  };

  // Tương tác vật lý xúc giác: Người chơi ấn, đẩy, hoặc uốn cong tờ giấy
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    touchSpringRef.current = {
      pressure: 0.85,
      deflectX: 0,
      deflectY: 0,
      springTick: 0,
    };
    SoundEngine.playBambooKnock();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    touchSpringRef.current.deflectX = Math.max(-35, Math.min(35, dx));
    touchSpringRef.current.deflectY = Math.max(-35, Math.min(35, dy));
    touchSpringRef.current.pressure = Math.min(1.0, 0.4 + Math.hypot(dx, dy) * 0.025);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerStartRef.current) {
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      if (Math.hypot(dx, dy) < 6) {
        handlePreviewCanvasClick(e as unknown as React.MouseEvent<HTMLCanvasElement>);
      }
    }
    pointerStartRef.current = null;
    touchSpringRef.current.springTick = 1;
  };

  // =========================================================================
  // BƯỚC 5: ADD ANIMATION & THẾ GIỚI RỐI GIẤY 3D (TERI THE PAPER BEAR GUMBALL)
  // =========================================================================
  useEffect(() => {
    if (step !== 5 || !currentImageUri || !loadedImgRef.current) return;
    let animId: number;
    let tick = 0;

    const cvs = previewCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // Đom đóm 3D lượn trong chiều sâu rừng tre
    const fireflies3D = Array.from({ length: 14 }, () => ({
      x: (Math.random() - 0.5) * 240,
      y: Math.random() * 80 + 10,
      z: Math.random() * 200 - 40,
      speed: Math.random() * 0.03 + 0.02,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      tick++;
      const w = cvs.width;
      const h = cvs.height;

      // Cập nhật dao động lò xo xúc giác giấy (Paper Spring Oscillation)
      if (touchSpringRef.current.pressure > 0.01) {
        touchSpringRef.current.springTick++;
        if (!pointerStartRef.current) {
          touchSpringRef.current.pressure *= 0.93;
          touchSpringRef.current.deflectX *= 0.91;
          touchSpringRef.current.deflectY *= 0.91;
        }
      }

      ctx.clearRect(0, 0, w, h);

      if (worldMode === 'turntable') {
        // ===============================================================
        // CHẾ ĐỘ 1: BÀN XOAY 2.5D
        // ===============================================================
        if (isAutoSpin) {
          setTurntableRotation((prev) => (prev + 1.2) % 360);
        }

        ctx.save();
        ctx.fillStyle = '#0E171A';
        ctx.fillRect(0, 0, w, h);
        const stageGrad = ctx.createRadialGradient(w / 2, h / 2 + 10, 20, w / 2, h / 2 + 10, 130);
        stageGrad.addColorStop(0, 'rgba(244, 162, 89, 0.28)');
        stageGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = stageGrad;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 + 10, 130, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const pose = calculateRigPose(tick, previewMotion, 1);
        drawPaperPuppet(
          ctx,
          loadedImgRef.current!,
          pose,
          rigData,
          w / 2,
          h / 2 + 10,
          135,
          145,
          1,
          turntableRotation,
          previewMotion,
          tick,
          touchSpringRef.current,
          showCreasePattern,
          faceExpr
        );

        if (showSkeletonWireframe) {
          drawSkeletonWireframe(
            ctx,
            rigData,
            pose,
            w / 2 - 68,
            h / 2 - 65,
            135,
            145,
            turntableRotation,
            1
          );
        }
      } else {
        // ===============================================================
        // CHẾ ĐỘ 2: THẾ GIỚI 3D RỐI GIẤY (PHONG CÁCH GẤU GIẤY TERI TRONG GUMBALL)
        // ===============================================================
        const char = char3DRef.current;

        // Cập nhật vị trí 3D (X, Z chiều sâu)
        const dx = char.targetX - char.x;
        const dz = char.targetZ - char.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        let effectiveMotion: CreatureAction = previewMotion || 'idle';

        if (dist > 4) {
          const moveSpeed =
            previewMotion === 'run' ? 3.6 : previewMotion === 'sneak' ? 1.4 : 2.2;
          char.x += (dx / dist) * Math.min(dist, moveSpeed);
          char.z += (dz / dist) * Math.min(dist, moveSpeed);

          // Xoay mặt và lật giấy 3D
          if (dx > 2) {
            char.direction = 1;
            char.targetRotationY = 0;
          } else if (dx < -2) {
            char.direction = -1;
            char.targetRotationY = 180;
          }

          effectiveMotion =
            dist > 60 || previewMotion === 'run'
              ? 'run'
              : previewMotion === 'sneak'
              ? 'sneak'
              : 'walk';
          char.action = effectiveMotion;
        } else {
          // Khi đứng tại chỗ (dist <= 4), THỰC HIỆN TRỌN VẸN HOẠT ẢNH PREVIEW ĐANG CHỌN!
          effectiveMotion = previewMotion || 'idle';
          char.action = effectiveMotion;

          // Xử lý chuyển động & vật lý 3D cho các hoạt ảnh nhảy / xoay / ngủ
          if (previewMotion === 'happy_jump' || previewMotion === 'hop') {
            if (!char.isJumping && char.y <= 0 && tick % 45 === 0) {
              char.isJumping = true;
              char.vy = previewMotion === 'happy_jump' ? 7.6 : 5.4;
              SoundEngine.playBambooKnock();
            }
          } else if (previewMotion === 'spin') {
            // Xoay tròn 360 độ trong không gian 3D
            char.targetRotationY = (char.targetRotationY + 6) % 360;
          }
        }

        // Vật lý nhảy giấy Teri (Paper Flutter Jump)
        if (char.isJumping) {
          char.y += char.vy;
          char.vy -= 0.62; // Trọng lực nhẹ như giấy bay
          if (char.y <= 0) {
            char.y = 0;
            char.vy = 0;
            char.isJumping = false;
            SoundEngine.playBambooKnock();
          }
        }

        // Hiệu ứng lật giấy mỏng 3D quanh trục Y
        const rotDiff = char.targetRotationY - char.rotationY;
        char.rotationY += rotDiff * 0.25;

        // 1. Phông nền rừng tre 3D
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#091012');
        bgGrad.addColorStop(0.35, '#111E22');
        bgGrad.addColorStop(1, '#1A2F25');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const horizonY = 75;
        const groundCenterY = 225;
        const cameraDist = 280;

        // 2. Lưới phối cảnh mặt đất 3D hội tụ về điểm tụ
        ctx.save();
        ctx.strokeStyle = 'rgba(107, 143, 113, 0.2)';
        ctx.lineWidth = 1.2;

        for (let ray = -160; ray <= 160; ray += 32) {
          ctx.beginPath();
          ctx.moveTo(w / 2 + ray * 0.15, horizonY);
          ctx.lineTo(w / 2 + ray * 1.5, h);
          ctx.stroke();
        }

        for (let depth = -30; depth <= 150; depth += 30) {
          const depthScale = cameraDist / (cameraDist + depth);
          const lineY = horizonY + (groundCenterY - horizonY) * depthScale;
          ctx.strokeStyle = `rgba(244, 162, 89, ${0.08 + (1 - depth / 180) * 0.14})`;
          ctx.beginPath();
          ctx.moveTo(w / 2 - 170 * depthScale, lineY);
          ctx.lineTo(w / 2 + 170 * depthScale, lineY);
          ctx.stroke();
        }
        ctx.restore();

        // 3. Cây tre hậu cảnh (Z = 160)
        [
          { x: -95, z: 155, width: 8 },
          { x: -25, z: 165, width: 7 },
          { x: 45, z: 150, width: 9 },
          { x: 105, z: 140, width: 8 },
        ].forEach((tree) => {
          const tScale = cameraDist / (cameraDist + tree.z);
          const tx = w / 2 + tree.x * tScale;
          const ty = horizonY + (groundCenterY - horizonY) * tScale;
          ctx.save();
          ctx.fillStyle = 'rgba(32, 58, 40, 0.5)';
          ctx.fillRect(tx - (tree.width * tScale) / 2, 0, tree.width * tScale, ty);
          ctx.restore();
        });

        // 4. Cây tre trung cảnh (Z = 65)
        [
          { x: -125, z: 65, width: 14 },
          { x: 125, z: 75, width: 15 },
        ].forEach((tree) => {
          const tScale = cameraDist / (cameraDist + tree.z);
          const tx = w / 2 + tree.x * tScale;
          const ty = horizonY + (groundCenterY - horizonY) * tScale;
          ctx.save();
          ctx.fillStyle = 'rgba(56, 88, 64, 0.75)';
          ctx.fillRect(tx - (tree.width * tScale) / 2, 0, tree.width * tScale, ty);
          ctx.restore();
        });

        // 5. Đom đóm bay trong không gian 3D
        fireflies3D.forEach((f) => {
          f.z = ((f.z + 40 + f.speed * 20) % 200) - 40;
          f.phase += 0.05;
          const fScale = cameraDist / (cameraDist + f.z);
          const fx = w / 2 + (f.x + Math.sin(f.phase) * 15) * fScale;
          const fy = horizonY + (groundCenterY - horizonY) * fScale - (f.y + Math.cos(f.phase) * 10) * fScale;

          ctx.save();
          ctx.fillStyle = '#FFE18A';
          ctx.shadowColor = '#FFD166';
          ctx.shadowBlur = 6 * fScale;
          ctx.beginPath();
          ctx.arc(fx, fy, Math.max(1, 2.4 * fScale), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // 6. Tọa độ phối cảnh nhân vật giấy 3D
        const charScale = cameraDist / (cameraDist + char.z);
        const charScreenX = w / 2 + char.x * charScale;
        const charGroundY = horizonY + (groundCenterY - horizonY) * charScale;
        const charScreenY = charGroundY - char.y * charScale;

        // Bóng đổ elip 3D trên mặt đất
        ctx.save();
        const shadowAlpha = Math.max(0.08, 0.38 * (1 - char.y / 110));
        ctx.fillStyle = `rgba(10, 17, 19, ${shadowAlpha})`;
        ctx.beginPath();
        const shadowRadiusX = (42 + char.y * 0.15) * charScale;
        const shadowRadiusY = (10 + char.y * 0.04) * charScale;
        ctx.ellipse(charScreenX, charGroundY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Động học uốn giấy theo FK Khung Xương
        const pose = calculateRigPose(tick, effectiveMotion, 1);
        if (char.isJumping) {
          pose.bodyBend = Math.sin(tick * 0.25) * 0.12;
          pose.hopY = 0;
        }

        const charWidth = 120 * charScale;
        const charHeight = 132 * charScale;

        // Vẽ Rối Giấy Teri 3D (Sticker Viền Trắng + Lật 3D + Nếp gấp Origami + Đầy đủ hiệu ứng cảm xúc)
        drawPaperPuppet(
          ctx,
          loadedImgRef.current!,
          pose,
          rigData,
          charScreenX,
          charScreenY - charHeight * 0.42,
          charWidth,
          charHeight,
          char.direction,
          char.rotationY,
          effectiveMotion,
          tick,
          touchSpringRef.current,
          showCreasePattern,
          faceExpr
        );

        // HIỂN THỊ KHUNG XƯƠNG ĐỘNG (FK) TRONG THẾ GIỚI 3D RỪNG TRE!
        if (showSkeletonWireframe) {
          drawSkeletonWireframe(
            ctx,
            rigData,
            pose,
            charScreenX - charWidth / 2,
            charScreenY - charHeight * 0.92,
            charWidth,
            charHeight,
            char.rotationY,
            char.direction
          );
        }

        // 7. Cây tre tiền cảnh (Z = -30)
        [
          { x: -145, z: -30, width: 22 },
          { x: 145, z: -25, width: 24 },
        ].forEach((tree) => {
          const tScale = cameraDist / (cameraDist + tree.z);
          const tx = w / 2 + tree.x * tScale;
          ctx.save();
          ctx.fillStyle = '#1B3521';
          ctx.fillRect(tx - (tree.width * tScale) / 2, 0, tree.width * tScale, h);
          ctx.restore();
        });

        // Điểm đánh dấu mục tiêu khi người chơi bấm
        if (dist > 6) {
          const targetScale = cameraDist / (cameraDist + char.targetZ);
          const targetScreenX = w / 2 + char.targetX * targetScale;
          const targetGroundY = horizonY + (groundCenterY - horizonY) * targetScale;

          ctx.save();
          ctx.strokeStyle = '#FFD166';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.ellipse(targetScreenX, targetGroundY, 14 * targetScale, 6 * targetScale, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [step, currentImageUri, worldMode, turntableRotation, isAutoSpin, previewMotion, showSkeletonWireframe, showCreasePattern, rigData, faceExpr]);

  return (
    <div className="relative w-full h-full bg-[#1B2A2F] text-dongho-paper flex flex-col justify-between overflow-y-auto select-none p-3.5">
      {/* Studio Header */}
      <div className="pt-6 px-2 flex items-center justify-between border-b border-bamboo-mid/25 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-extrabold text-warm-glow">
            {step === 1 && '1. Vẽ trên giấy trắng / Tải ảnh'}
            {step === 2 && '2. Resize Box (Định vị nhân vật)'}
            {step === 3 && '3. Separate (Tách nền & Mặt nạ)'}
            {step === 4 &&
              (imageSource === 'upload'
                ? '4. Gắn Khung Xương (3 Loại Khung & Mannequin)'
                : '2. Gắn Khung Xương (3 Loại Khung & Mannequin)')}
            {step === 5 &&
              (imageSource === 'upload'
                ? '5. Thổi Hồn Hoạt Ảnh & Sân Chơi 3D'
                : '3. Thổi Hồn Hoạt Ảnh & Sân Chơi 3D')}
          </span>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-forest-darker border border-warm-amber/40 text-warm-amber font-semibold font-mono">
          {imageSource === 'upload'
            ? `Bước ${step}/5`
            : step === 1
            ? 'Bước 1/3'
            : step === 4
            ? 'Bước 2/3'
            : 'Bước 3/3'}
        </span>
      </div>

      {/* =========================================================================
          BƯỚC 1: UPLOAD / DRAW (VẼ TRÊN GIẤY TRẮNG / TẢI ẢNH)
         ========================================================================= */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-between my-2">
          {/* Tabs */}
          <div className="flex bg-forest-darker p-1 rounded-2xl border border-bamboo-mid/40 mb-2 text-xs font-semibold">
            <button
              onClick={() => setTab('draw')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                tab === 'draw'
                  ? 'bg-forest-deep text-warm-glow shadow border border-warm-amber/40'
                  : 'text-dongho-paper/60 hover:text-dongho-paper'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Vẽ tự do</span>
            </button>
            <button
              onClick={() => setTab('photo')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                tab === 'photo'
                  ? 'bg-forest-deep text-warm-glow shadow border border-warm-amber/40'
                  : 'text-dongho-paper/60 hover:text-dongho-paper'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải ảnh</span>
            </button>
            <button
              onClick={() => setTab('samples')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                tab === 'samples'
                  ? 'bg-forest-deep text-warm-glow shadow border border-warm-amber/40'
                  : 'text-dongho-paper/60 hover:text-dongho-paper'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mẫu có sẵn</span>
            </button>
          </div>

          {/* TAB 1: DRAW */}
          {tab === 'draw' && (
            <div className="flex flex-col items-center w-full">
              {/* KHUNG GIẤY VẼ TRẮNG TINH */}
              <div className="relative w-[330px] h-[320px] rounded-3xl overflow-hidden bg-white border-4 border-bamboo-mid/70 shadow-[0_12px_30px_rgba(0,0,0,0.4)] touch-none flex items-center justify-center">
                {showBodyGuide && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 opacity-20 text-[9px] font-mono select-none">
                    <div className="border-b border-dashed border-[#1B2A2F] pb-0.5 text-[#1B2A2F] flex justify-between">
                      <span>VÙNG ĐẦU &amp; MẶT</span>
                      <span>30%</span>
                    </div>
                    <div className="border-b border-dashed border-[#1B2A2F] pb-0.5 text-[#1B2A2F] flex justify-between">
                      <span>THÂN, ÁO &amp; 2 TAY</span>
                      <span>40%</span>
                    </div>
                    <div className="pt-0.5 text-[#1B2A2F] flex justify-between">
                      <span>2 CHÂN ĐỨNG</span>
                      <span>30%</span>
                    </div>
                  </div>
                )}

                <canvas
                  ref={drawCanvasRef}
                  width={330}
                  height={320}
                  style={{ backgroundColor: '#FFFFFF' }}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMove}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full cursor-crosshair"
                />
              </div>

              {/* TOOLBAR NẰM DƯỚI CANVAS */}
              <div className="w-[330px] mt-2 space-y-1.5">
                {/* Hàng 1: 4 Cọ + Đổ Màu + Tẩy + Undo/Redo */}
                <div className="flex items-center justify-between bg-forest-darker/95 p-1.5 rounded-2xl border border-bamboo-mid/40 shadow">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setActiveTool('point_pen');
                        SoundEngine.playBambooKnock();
                      }}
                      title="Bút kim nét sắc"
                      className={`p-1.5 rounded-xl transition ${
                        activeTool === 'point_pen'
                          ? 'bg-warm-amber text-forest-abyss shadow font-bold'
                          : 'text-dongho-paper/60 hover:text-dongho-paper'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool('brush');
                        SoundEngine.playBambooKnock();
                      }}
                      title="Cọ mềm lông cừu"
                      className={`p-1.5 rounded-xl transition ${
                        activeTool === 'brush'
                          ? 'bg-warm-amber text-forest-abyss shadow font-bold'
                          : 'text-dongho-paper/60 hover:text-dongho-paper'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool('brush_giggle');
                        SoundEngine.playBambooKnock();
                      }}
                      title="Cọ rung rinh mực loang"
                      className={`p-1.5 rounded-xl transition ${
                        activeTool === 'brush_giggle'
                          ? 'bg-warm-amber text-forest-abyss shadow font-bold'
                          : 'text-dongho-paper/60 hover:text-dongho-paper'
                      }`}
                    >
                      <Feather className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool('crayon');
                        SoundEngine.playBambooKnock();
                      }}
                      title="Sáp màu Đông Hồ"
                      className={`p-1.5 rounded-xl transition ${
                        activeTool === 'crayon'
                          ? 'bg-warm-amber text-forest-abyss shadow font-bold'
                          : 'text-dongho-paper/60 hover:text-dongho-paper'
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-4 w-[1px] bg-bamboo-mid/40 mx-0.5" />

                    <button
                      onClick={() => {
                        setActiveTool('fill');
                        SoundEngine.playWaterSplash();
                      }}
                      title="Đổ màu (Flood Fill)"
                      className={`p-1.5 rounded-xl transition ${
                        activeTool === 'fill'
                          ? 'bg-warm-amber text-forest-abyss shadow font-bold'
                          : 'text-dongho-paper/60 hover:text-dongho-paper'
                      }`}
                    >
                      <PaintBucket className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool('eraser');
                        SoundEngine.playBambooKnock();
                      }}
                      title="Cục tẩy"
                      className={`p-1.5 rounded-xl transition ${
                        activeTool === 'eraser'
                          ? 'bg-dongho-red text-dongho-paper shadow font-bold'
                          : 'text-dongho-paper/60 hover:text-dongho-paper'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="p-1.5 rounded-xl bg-forest-deep text-dongho-paper/80 disabled:opacity-30 hover:text-warm-amber transition"
                      title="Hoàn tác (Undo)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="p-1.5 rounded-xl bg-forest-deep text-dongho-paper/80 disabled:opacity-30 hover:text-warm-amber transition"
                      title="Làm lại (Redo)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleClear}
                      className="p-1.5 rounded-xl bg-forest-deep text-dongho-red/80 hover:text-dongho-red transition"
                      title="Xóa giấy trắng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Hàng 2: Bảng 14 Màu Đông Hồ */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1.5 bg-forest-darker/90 rounded-2xl border border-bamboo-mid/30 no-scrollbar">
                  {FOLK_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        setBrushColor(c.hex);
                        if (activeTool === 'eraser') setActiveTool('point_pen');
                        SoundEngine.playBambooKnock();
                      }}
                      className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                        brushColor === c.hex && activeTool !== 'eraser'
                          ? 'scale-125 ring-2 ring-warm-amber ring-offset-1 ring-offset-forest-darker'
                          : 'hover:scale-110 opacity-80'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Nút Tiếp tục: Đi thẳng sang Gắn Khung Xương (Nét vẽ kỹ thuật số đã có nền trắng sạch, không cần tách) */}
                <button
                  onClick={handleProceedDirectToRigging}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                >
                  <span>Xong nét vẽ → Gắn Khung Xương</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {tab === 'photo' && (
            <div className="flex flex-col items-center justify-center w-full max-w-xs py-10">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadAndProceed}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-bamboo-soft/50 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-warm-amber transition bg-forest-darker/60 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-forest-deep flex items-center justify-center text-warm-glow mb-3 group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-dongho-paper text-center">
                  Chọn ảnh chụp nét vẽ trên giấy trắng
                </p>
                <p className="text-[11px] text-dongho-paper/60 mt-1 text-center">
                  Ảnh nhân vật rõ ràng, tay chân không che lấp thân thể
                </p>
              </div>
              {uploadError && (
                <p className="text-xs text-dongho-pink mt-3 text-center">{uploadError}</p>
              )}
            </div>
          )}

          {/* TAB 3: SAMPLES */}
          {tab === 'samples' && (
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              {SAMPLE_HUMANOID_FIGURES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSampleAndProceed(sample)}
                  className="p-3 rounded-2xl bg-forest-darker/80 border border-bamboo-soft/40 hover:border-warm-amber cursor-pointer flex items-center gap-3 transition group"
                >
                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-1 border border-bamboo-mid/40 group-hover:scale-105 transition shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sample.svgUri} alt={sample.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-warm-glow">{sample.name}</h4>
                    <p className="text-[10px] text-dongho-paper/65 mt-0.5 leading-relaxed">
                      {sample.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          BƯỚC 2: RESIZE THE BOX (ĐỊNH VỊ KHUNG CHỮ NHẬT BAO QUANH NHÂN VẬT)
         ========================================================================= */}
      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-between my-1 animate-fade-in">
          <div className="text-center px-4 max-w-xs mb-1">
            <h3 className="text-xs font-bold text-warm-glow flex items-center justify-center gap-1.5">
              <Crop className="w-4 h-4 text-warm-amber" />
              <span>Bước 2: Căn chỉnh khung (Resize the Box)</span>
            </h3>
            <p className="text-[11px] text-dongho-paper/70 mt-0.5 leading-relaxed">
              Kéo 8 điểm chốt để khung chữ nhật ôm sát một nhân vật duy nhất nhé.
            </p>
          </div>

          <div className="relative w-[330px] h-[320px] rounded-3xl overflow-hidden bg-white border-4 border-warm-amber/70 shadow-2xl flex items-center justify-center touch-none">
            <canvas
              ref={boxCanvasRef}
              width={330}
              height={320}
              onMouseDown={handleBoxMouseDown}
              onMouseMove={handleBoxMouseMove}
              onMouseUp={handleBoxMouseUp}
              onMouseLeave={handleBoxMouseUp}
              className="w-full h-full cursor-crosshair"
            />
          </div>

          <div className="flex gap-2.5 mt-2.5 w-[330px]">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 rounded-2xl bg-forest-deep border border-bamboo-soft/40 text-dongho-paper/80 font-medium text-xs hover:border-warm-amber transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Vẽ lại</span>
            </button>
            <button
              onClick={handleProceedToStep3Separate}
              className="flex-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 transition flex items-center justify-center gap-1.5"
            >
              <span>Khung chuẩn → Tách nền (Bước 3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 3: SEPARATE CHARACTER (AI TỰ ĐỘNG BÓC TÁCH NỀN & SỬA TAY NẾU CẦN)
         ========================================================================= */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-between my-1 animate-fade-in">
          {/* Header trạng thái AI */}
          {aiSegmenting ? (
            <div className="w-[330px] p-2.5 rounded-2xl bg-forest-darker/95 border border-[#06D6A0]/60 flex items-center justify-between animate-pulse mb-1 shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#06D6A0] animate-spin" />
                <span className="text-xs font-bold text-[#06D6A0]">
                  AI đang tự động quét và bóc tách nét vẽ...
                </span>
              </div>
              <span className="text-[10px] text-dongho-paper/60 font-mono">rembg AI</span>
            </div>
          ) : (
            <div className="w-[330px] flex items-center justify-between mb-1 px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#06D6A0] bg-[#06D6A0]/15 border border-[#06D6A0]/40 px-2.5 py-0.5 rounded-full shadow">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI: {segmentEngine}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (loadedImgRef.current) runAiSegmentation(loadedImgRef.current.src);
                    SoundEngine.playBambooKnock();
                  }}
                  className="text-[10px] text-warm-amber hover:text-warm-glow flex items-center gap-1 bg-forest-darker px-2.5 py-1 rounded-full border border-warm-amber/40 transition shadow active:scale-95"
                  title="Chạy lại AI tách nền"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Quét lại AI</span>
                </button>
                <button
                  onClick={() => setShowAiSettingsModal(true)}
                  className="text-[10px] text-dongho-paper/80 hover:text-dongho-paper flex items-center gap-1 bg-forest-darker px-2.5 py-1 rounded-full border border-bamboo-mid/40 transition shadow active:scale-95"
                  title="Cấu hình Model AI & API Keys (Remove.bg / Clipdrop / Replicate)"
                >
                  <Settings className="w-3 h-3 text-warm-amber" />
                  <span>Model AI</span>
                </button>
              </div>
            </div>
          )}

          <p className="text-[10px] text-dongho-paper/70 text-center max-w-[330px] mb-1 px-1">
            ✨ AI đã tự động nhận diện và phủ mặt nạ. Nếu cần tinh chỉnh thêm, cậu có thể dùng{' '}
            <strong className="text-[#06D6A0]">Bút tô</strong> để bù nét hoặc{' '}
            <strong className="text-dongho-red">Tẩy</strong> để xóa mép thừa nhé.
          </p>

          <div className="relative w-[330px] h-[320px] rounded-3xl overflow-hidden bg-white border-4 border-bamboo-mid/70 shadow-2xl flex items-center justify-center touch-none">
            {aiSegmenting && (
              <div className="absolute inset-0 z-20 bg-forest-abyss/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-[#06D6A0] border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-[#06D6A0]">
                  Đang nhận diện sinh linh giấy...
                </span>
              </div>
            )}
            <canvas
              ref={maskCanvasRef}
              width={330}
              height={320}
              onMouseDown={(e) => {
                setIsMasking(true);
                handleMaskDraw(e);
              }}
              onMouseMove={handleMaskDraw}
              onMouseUp={() => setIsMasking(false)}
              onMouseLeave={() => setIsMasking(false)}
              className="w-full h-full cursor-crosshair"
            />
          </div>

          {/* Công cụ sửa tay sau khi AI tự làm (Fine-tuning tools) */}
          <div className="w-[330px] mt-1.5 space-y-1.5">
            <div className="flex items-center justify-between bg-forest-darker/95 p-1.5 rounded-2xl border border-bamboo-mid/40 shadow">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMaskTool('pen');
                    SoundEngine.playBambooKnock();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    maskTool === 'pen'
                      ? 'bg-[#06D6A0] text-forest-abyss shadow'
                      : 'text-dongho-paper/60 hover:text-dongho-paper'
                  }`}
                  title="Tô thêm vùng ngọc nếu AI bị khuyết"
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Bút tô ngọc</span>
                </button>
                <button
                  onClick={() => {
                    setMaskTool('eraser');
                    SoundEngine.playBambooKnock();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    maskTool === 'eraser'
                      ? 'bg-dongho-red text-dongho-paper shadow'
                      : 'text-dongho-paper/60 hover:text-dongho-paper'
                  }`}
                  title="Tẩy bớt vùng bị dính nét hoặc bóng bàn"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Tẩy sửa nét</span>
                </button>
              </div>

              {/* Slider cỡ cọ */}
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-[10px] text-dongho-paper/60 font-mono">Cỡ:</span>
                <input
                  type="range"
                  min={8}
                  max={32}
                  value={maskBrushSize}
                  onChange={(e) => setMaskBrushSize(Number(e.target.value))}
                  className="w-16 accent-warm-amber h-1.5"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 rounded-2xl bg-forest-deep border border-bamboo-soft/40 text-dongho-paper/80 font-medium text-xs hover:border-warm-amber transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Chỉnh lại khung</span>
              </button>
              <button
                onClick={handleProceedToStep4Joints}
                className="flex-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 transition flex items-center justify-center gap-1.5"
              >
                <span>Mặt nạ chuẩn → Gắn xương (Bước 4)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 4: FINDING CHARACTER JOINTS (GẮN KHUNG XƯƠNG & MANNEQUIN ĐỐI CHIẾU)
         ========================================================================= */}
      {step === 4 && (
        <div className="flex-1 flex flex-col items-center justify-between my-1 animate-fade-in">
          {/* Instructions */}
          <div className="text-center px-4 max-w-xs mb-1">
            <h3 className="text-xs font-bold text-warm-glow flex items-center justify-center gap-1.5">
              <Move className="w-4 h-4 text-warm-amber" />
              <span>Bước 4: Gắn Khung Xương (Finding Character Joints)</span>
            </h3>
            <p className="text-[11px] text-dongho-paper/70 mt-0.5 leading-relaxed">
              Kéo các nốt tròn màu vào đúng khớp trên nét vẽ. Đối chiếu với{' '}
              <strong>Hình nhân mẫu</strong> ở bên phải nhé.
            </p>
          </div>

          {/* BỘ CHUYỂN ĐỔI LOẠI KHUNG XƯƠNG CHUẨN META DEMO LAB */}
          <div className="w-[330px] flex items-center justify-between bg-forest-darker/95 p-1 rounded-2xl border border-bamboo-mid/40 mb-1.5 text-[11px]">
            {SKELETON_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectSkeletonType(opt.id)}
                className={`flex-1 py-1 px-1.5 rounded-xl transition text-center font-medium ${
                  skeletonType === opt.id
                    ? 'bg-warm-amber text-forest-abyss font-bold shadow'
                    : 'text-dongho-paper/60 hover:text-dongho-paper'
                }`}
              >
                <span>{opt.name}</span>
              </button>
            ))}
          </div>

          {/* KHÔNG GIAN RIG CHÍNH + HÌNH NHÂN MẪU ĐỐI CHIẾU (MANNEQUIN GUIDE) */}
          <div className="flex items-center gap-2 w-[330px]">
            {/* Canvas vẽ và kéo chốt khớp */}
            <div className="relative flex-1 h-[300px] rounded-3xl overflow-hidden bg-white border-4 border-warm-amber/70 shadow-2xl flex items-center justify-center touch-none">
              <canvas
                ref={rigCanvasRef}
                width={220}
                height={300}
                onMouseDown={handleRigMouseDown}
                onMouseMove={handleRigMouseMove}
                onMouseUp={handleRigMouseUp}
                onMouseLeave={handleRigMouseUp}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />
            </div>

            {/* HÌNH NHÂN MẪU ĐỐI CHIẾU (MANNEQUIN GUIDE BÊN CẠNH CHUẨN META) */}
            <div className="w-[95px] h-[300px] rounded-3xl overflow-hidden bg-[#0F1A1E] border-2 border-bamboo-mid/40 shadow-xl flex flex-col items-center justify-between p-1 shrink-0">
              <div className="text-[9px] font-bold text-warm-amber text-center pt-1">
                HÌNH NHÂN ĐỐI CHIẾU
              </div>
              <canvas
                ref={mannequinCanvasRef}
                width={90}
                height={240}
                className="w-full h-[240px]"
              />
              <span className="text-[8px] text-dongho-paper/50 pb-1 text-center font-mono">
                Chuẩn Meta
              </span>
            </div>
          </div>

          {/* Quick Tools & Tip */}
          <div className="mt-1.5 flex items-center justify-between w-[330px] px-1 text-xs">
            <button
              onClick={() => {
                const cvs = maskCanvasRef.current || drawCanvasRef.current;
                if (cvs) {
                  const detected = detectHumanoidRigFromCanvas(cvs, skeletonType);
                  setRigData(detected);
                } else {
                  setRigData(generateRigByType(skeletonType));
                }
                SoundEngine.playWaterSplash();
              }}
              className="text-[11px] text-dongho-paper/70 hover:text-warm-amber flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-warm-amber" />
              <span>AI Tự động căn lại khớp</span>
            </button>
            <span className="text-[10px] text-warm-glow">
              {skeletonType === 'armless_chibi'
                ? 'Khung không tay búp măng'
                : skeletonType === 'quadruped'
                ? 'Khung thú 4 chân'
                : '16 khớp hình người'}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex gap-2.5 mt-2 w-[330px]">
            <button
              onClick={() => setStep(imageSource === 'upload' ? 3 : 1)}
              className="flex-1 py-2.5 rounded-2xl bg-forest-deep border border-bamboo-soft/40 text-dongho-paper/80 font-medium text-xs hover:border-warm-amber transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{imageSource === 'upload' ? 'Tách lại nét' : 'Vẽ lại'}</span>
            </button>
            <button
              onClick={handleProceedToStep5Animation}
              className="flex-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 transition flex items-center justify-center gap-1.5"
            >
              <span>
                {imageSource === 'upload'
                  ? 'Khớp chuẩn → Thổi hồn hoạt ảnh (Bước 5)'
                  : 'Khớp chuẩn → Thổi hồn hoạt ảnh (Bước 3)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BƯỚC 5: ADD ANIMATION & 3D PAPER WORLD (TERI THE PAPER BEAR GUMBALL)
         ========================================================================= */}
      {step === 5 && (
        <div className="flex-1 flex flex-col items-center justify-between my-1 animate-fade-in">
          {/* Animated Interactive Preview Canvas */}
          <div className="relative w-64 h-64 rounded-full bg-forest-darker/95 border-2 border-warm-amber/50 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#F4A259_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full bg-warm-amber/15 blur-2xl pointer-events-none animate-pulse" />

            <canvas
              ref={previewCanvasRef}
              width={260}
              height={260}
              className="relative z-10 w-full h-full cursor-pointer touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>

          {/* Controls: Xoay 2.5D Turntable + 4 Danh Mục Hoạt Ảnh Meta Demo Lab */}
          <div className="mt-2 flex flex-col items-center gap-1.5 w-full max-w-xs">
            {/* Chế độ xem: 3D Forest World vs Turntable 2.5D */}
            <div className="w-full flex items-center justify-between bg-forest-darker/90 p-1.5 rounded-2xl border border-bamboo-mid/30 text-xs">
              <span className="font-semibold text-warm-glow text-[11px] flex items-center gap-1.5">
                <Rotate3d className="w-3.5 h-3.5 text-warm-amber" />
                <span>Chế độ:</span>
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setWorldMode('3d_world')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                    worldMode === '3d_world'
                      ? 'bg-warm-amber text-forest-abyss'
                      : 'bg-forest-deep text-dongho-paper/60'
                  }`}
                >
                  3D Rừng Tre (Gumball)
                </button>
                <button
                  onClick={() => setWorldMode('turntable')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                    worldMode === 'turntable'
                      ? 'bg-warm-amber text-forest-abyss'
                      : 'bg-forest-deep text-dongho-paper/60'
                  }`}
                >
                  Mâm Xoay 2.5D
                </button>
              </div>
            </div>

            {/* Thanh công cụ: Nếp gấp Origami & Khung xương FK */}
            <div className="w-full flex items-center justify-between bg-forest-darker/90 px-2.5 py-1.5 rounded-2xl border border-bamboo-mid/30 text-xs">
              <span className="text-[10px] text-dongho-paper/70 font-semibold flex items-center gap-1">
                <span>Cơ chế giấy:</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowCreasePattern(!showCreasePattern)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                    showCreasePattern
                      ? 'bg-warm-amber/20 border-warm-amber text-warm-glow'
                      : 'bg-forest-deep border-bamboo-mid/30 text-dongho-paper/50'
                  }`}
                  title="Hiển thị nếp gấp Origami & nếp cấn"
                >
                  <span>📐 Nếp gấp Origami</span>
                </button>
                <button
                  onClick={() => setShowSkeletonWireframe(!showSkeletonWireframe)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                    showSkeletonWireframe
                      ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0]'
                      : 'bg-forest-deep border-bamboo-mid/30 text-dongho-paper/50'
                  }`}
                  title="Hiển thị khung xương động học thuận FK"
                >
                  <span>🦴 Khung xương FK</span>
                </button>
              </div>
            </div>

            {/* Mẹo xúc giác */}
            <p className="text-[9.5px] text-warm-glow/70 text-center w-full px-1 italic">
              💡 Chạm hoặc kéo rê nhân vật để gập uốn tờ giấy và kích hoạt lò xo cơ học!
            </p>

            {/* Turntable Slider nếu chọn turntable */}
            {worldMode === 'turntable' && (
              <div className="w-full bg-forest-darker/90 p-2 rounded-2xl border border-bamboo-mid/30 text-xs flex items-center gap-2">
                <span className="text-[10px] text-dongho-paper/60">-180°</span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={turntableRotation}
                  onChange={(e) => {
                    setIsAutoSpin(false);
                    setTurntableRotation(Number(e.target.value));
                  }}
                  className="flex-1 accent-warm-amber cursor-pointer h-1.5 bg-forest-deep rounded-lg"
                />
                <span className="text-[10px] text-dongho-paper/60">+180°</span>
                <button
                  onClick={() => setIsAutoSpin(!isAutoSpin)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    isAutoSpin ? 'bg-warm-amber text-forest-abyss' : 'bg-forest-deep text-dongho-paper/60'
                  }`}
                >
                  {isAutoSpin ? 'Dừng' : 'Xoay'}
                </button>
              </div>
            )}

            {/* TÙY CHỌN: HOẠT ẢNH (12) VS BIỂU CẢM MẶT (MẮT & MIỆNG) */}
            <div className="w-full flex items-center p-1 bg-forest-darker/90 rounded-2xl border border-bamboo-mid/40 mb-1">
              <button
                onClick={() => {
                  setStep5Tab('motion');
                  SoundEngine.playBambooKnock();
                }}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  step5Tab === 'motion'
                    ? 'bg-warm-amber text-forest-abyss shadow-md'
                    : 'text-dongho-paper/60 hover:text-dongho-paper'
                }`}
              >
                <span>🏃 12 Hoạt ảnh</span>
              </button>
              <button
                onClick={() => {
                  setStep5Tab('expression');
                  SoundEngine.playBlessingChime();
                }}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  step5Tab === 'expression'
                    ? 'bg-warm-amber text-forest-abyss shadow-md'
                    : 'text-dongho-paper/60 hover:text-dongho-paper'
                }`}
              >
                <span>🎭 Biểu cảm khuôn mặt</span>
                {!faceExpr.isAuto && (
                  <span className="w-1.5 h-1.5 rounded-full bg-dongho-red animate-ping" />
                )}
              </button>
            </div>

            {/* NỘI DUNG TAB 1: 4 DANH MỤC CHUYỂN ĐỘNG CHUẨN META DEMO LAB */}
            {step5Tab === 'motion' && (
              <div className="w-full">
                {/* Category Tabs: Walking, Jumping, Dancing, Funny */}
                <div className="grid grid-cols-4 gap-1 mb-1.5">
                  {[
                    { id: 'walking', name: 'Đi lại' },
                    { id: 'jumping', name: 'Bật nhảy' },
                    { id: 'dancing', name: 'Nhảy múa' },
                    { id: 'funny', name: 'Hài hước' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setAnimationCategory(cat.id as any);
                        SoundEngine.playBambooKnock();
                      }}
                      className={`py-1 text-[10px] rounded-xl font-bold transition ${
                        animationCategory === cat.id
                          ? 'bg-forest-deep text-warm-amber border border-warm-amber/50 shadow'
                          : 'bg-forest-darker/60 text-dongho-paper/60'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Danh sách Action theo danh mục */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {animationCategory === 'walking' && (
                    <>
                      <button
                        onClick={() => {
                          setPreviewMotion('walk');
                          SoundEngine.playBambooKnock();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'walk'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        🚶 Walk (Đi bộ)
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('run');
                          SoundEngine.playBambooKnock();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'run'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        🏃 Run (Chạy)
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('sneak');
                          SoundEngine.playBambooKnock();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'sneak'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        🤫 Sneak (Rón rén)
                      </button>
                    </>
                  )}

                  {animationCategory === 'jumping' && (
                    <>
                      <button
                        onClick={() => {
                          setPreviewMotion('happy_jump');
                          SoundEngine.playBlessingChime();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'happy_jump'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        🎉 Happy Jump
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('paper_flutter');
                          SoundEngine.playWindChime();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'paper_flutter'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        🍃 Bay lơ lửng
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('hop');
                          SoundEngine.playBambooKnock();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'hop'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        🦘 Hop (Lò cò)
                      </button>
                    </>
                  )}

                  {animationCategory === 'dancing' && (
                    <>
                      <button
                        onClick={() => {
                          setPreviewMotion('dance');
                          SoundEngine.playWindChime();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'dance'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        💃 Dance (Múa)
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('wave');
                          SoundEngine.playBambooKnock();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'wave'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        👋 Wave (Vẫy tay)
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('spin');
                          SoundEngine.playBlessingChime();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'spin'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        💫 Spin (Xoay tròn)
                      </button>
                    </>
                  )}

                  {animationCategory === 'funny' && (
                    <>
                      <button
                        onClick={() => {
                          setPreviewMotion('teri_panic');
                          SoundEngine.playWaterSplash();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'teri_panic'
                            ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        😱 Teri Panic (Gumball)
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('sad');
                          SoundEngine.playBambooKnock();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'sad'
                            ? 'bg-dongho-red/40 text-dongho-paper border-dongho-red font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        😔 Sad (Ủ rũ)
                      </button>
                      <button
                        onClick={() => {
                          setPreviewMotion('sleep');
                          SoundEngine.playBambooKnock();
                        }}
                        className={`py-1.5 rounded-xl border transition ${
                          previewMotion === 'sleep'
                            ? 'bg-forest-mist text-warm-glow border-warm-amber font-bold'
                            : 'bg-forest-darker border-bamboo-soft/30 text-dongho-paper/70'
                        }`}
                      >
                        😴 Sleep (Gấp giấy)
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* NỘI DUNG TAB 2: BIỂU CẢM KHUÔN MẶT TỰ CHỌN (MẮT & MIỆNG) */}
            {step5Tab === 'expression' && (
              <div className="w-full bg-forest-darker/95 p-2 rounded-2xl border border-bamboo-mid/40 space-y-2">
                {/* Header: Chế độ Tự động theo cử động vs Cố định nét mặt */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-warm-glow">🎭 Cơ chế nét mặt:</span>
                    <span className="text-[9.5px] text-dongho-paper/60">
                      {faceExpr.isAuto ? '(Đổi theo cử động)' : '(Tự chọn)'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setFaceExpr((prev) => ({
                        ...prev,
                        isAuto: !prev.isAuto,
                      }));
                      SoundEngine.playBlessingChime();
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                      faceExpr.isAuto
                        ? 'bg-warm-amber text-forest-abyss border-warm-amber'
                        : 'bg-forest-deep border-bamboo-mid/40 text-dongho-paper/70'
                    }`}
                  >
                    <span>✨ Tự động theo cử động</span>
                  </button>
                </div>

                {/* Sub-modes: Mẫu có sẵn vs Tự vẽ nét mặt */}
                <div className="flex items-center gap-1 bg-forest-deep/80 p-0.5 rounded-xl border border-bamboo-mid/20 text-[10px]">
                  <button
                    onClick={() => setFaceCustomMode('preset')}
                    className={`flex-1 py-1 rounded-lg font-bold transition ${
                      faceCustomMode === 'preset'
                        ? 'bg-warm-amber text-forest-abyss'
                        : 'text-dongho-paper/60'
                    }`}
                  >
                    🎨 Mẫu nét vẽ có sẵn
                  </button>
                  <button
                    onClick={() => setFaceCustomMode('draw')}
                    className={`flex-1 py-1 rounded-lg font-bold transition ${
                      faceCustomMode === 'draw'
                        ? 'bg-warm-amber text-forest-abyss'
                        : 'text-dongho-paper/60'
                    }`}
                  >
                    ✏️ Tự vẽ nét mặt tay
                  </button>
                </div>

                {/* 1. MẪU NÉT VẼ CÓ SẴN (PRESETS) */}
                {faceCustomMode === 'preset' && (
                  <div className="space-y-2 text-[10px]">
                    {/* CHỌN MẮT (EYE SHAPES) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-warm-amber flex items-center gap-1">
                          <span>👀 Kiểu mắt:</span>
                        </span>
                        {!faceExpr.isAuto && (
                          <span className="text-[9px] text-dongho-paper/50 capitalize">
                            {faceExpr.eye}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'normal', label: '👀 Bình thường', desc: 'Mắt tròn mực' },
                          { id: 'wide', label: '😲 Mắt to xoe', desc: 'Ngạc nhiên' },
                          { id: 'happy', label: '😸 Cười híp', desc: '^ ^ reo vui' },
                          { id: 'sad', label: '🥺 Cụp buồn', desc: '︵ ︵ ủ rũ' },
                          { id: 'sleepy', label: '😴 Lim dim', desc: 'Nửa nhắm' },
                          { id: 'wink', label: '😉 Nháy mắt', desc: 'Tinh nghịch' },
                        ].map((eyeItem) => {
                          const isSelected = !faceExpr.isAuto && faceExpr.eye === eyeItem.id && !faceExpr.customFaceCanvas;
                          return (
                            <button
                              key={eyeItem.id}
                              onClick={() => {
                                setFaceExpr((prev) => ({
                                  ...prev,
                                  isAuto: false,
                                  eye: eyeItem.id as EyeShape,
                                  customFaceCanvas: null,
                                }));
                                SoundEngine.playBambooKnock();
                              }}
                              className={`py-1 px-1.5 rounded-lg border text-left transition flex flex-col ${
                                isSelected
                                  ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold shadow'
                                  : 'bg-forest-deep/90 border-bamboo-mid/30 text-dongho-paper/80 hover:border-warm-amber/50'
                              }`}
                            >
                              <span className="font-bold truncate">{eyeItem.label}</span>
                              <span className={`text-[8.5px] truncate ${isSelected ? 'text-forest-abyss/80' : 'text-dongho-paper/50'}`}>
                                {eyeItem.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CHỌN MIỆNG (MOUTH SHAPES) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-warm-amber flex items-center gap-1">
                          <span>👄 Kiểu miệng:</span>
                        </span>
                        {!faceExpr.isAuto && (
                          <span className="text-[9px] text-dongho-paper/50 capitalize">
                            {faceExpr.mouth}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'big_smile', label: '😃 Miệng to', desc: 'Há to reo vui' },
                          { id: 'smile', label: '😊 Mỉm cười', desc: 'Nhẹ nhàng' },
                          { id: 'sad', label: '😔 Miệng buồn', desc: 'Cụp mếu máo' },
                          { id: 'neutral', label: '😐 Ngậm bthg', desc: 'Nét thẳng' },
                          { id: 'open', label: '😮 Tròn chữ O', desc: 'Ngạc nhiên' },
                          { id: 'tongue', label: '😛 Thè lưỡi', desc: 'Tinh nghịch' },
                        ].map((mouthItem) => {
                          const isSelected = !faceExpr.isAuto && faceExpr.mouth === mouthItem.id && !faceExpr.customFaceCanvas;
                          return (
                            <button
                              key={mouthItem.id}
                              onClick={() => {
                                setFaceExpr((prev) => ({
                                  ...prev,
                                  isAuto: false,
                                  mouth: mouthItem.id as MouthShape,
                                  customFaceCanvas: null,
                                }));
                                SoundEngine.playBambooKnock();
                              }}
                              className={`py-1 px-1.5 rounded-lg border text-left transition flex flex-col ${
                                isSelected
                                  ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold shadow'
                                  : 'bg-forest-deep/90 border-bamboo-mid/30 text-dongho-paper/80 hover:border-warm-amber/50'
                              }`}
                            >
                              <span className="font-bold truncate">{mouthItem.label}</span>
                              <span className={`text-[8.5px] truncate ${isSelected ? 'text-forest-abyss/80' : 'text-dongho-paper/50'}`}>
                                {mouthItem.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TỰ VẼ NÉT MẶT TAY (CUSTOM DRAW CANVAS) */}
                {faceCustomMode === 'draw' && (
                  <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[9px] text-dongho-paper/70 text-center">
                      ✍️ Vẽ trực tiếp mắt, mũi, miệng vào ô dưới đây (nét mực sẽ tự uốn lượn theo khuôn mặt):
                    </p>
                    <div className="relative w-36 h-28 bg-[#FAF7F0] rounded-xl border-2 border-dashed border-warm-amber/70 shadow-inner overflow-hidden flex items-center justify-center">
                      <canvas
                        ref={faceCanvasRef}
                        width={144}
                        height={112}
                        className="w-full h-full cursor-crosshair touch-none"
                        onPointerDown={handleFacePointerDown}
                        onPointerMove={handleFacePointerMove}
                        onPointerUp={handleFacePointerUp}
                        onPointerCancel={handleFacePointerUp}
                      />
                      {!faceExpr.customFaceCanvas && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-[#1B2A2F]/30 text-[10px]">
                          <span>Vẽ mắt & miệng ở đây</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClearCustomFace}
                        className="px-2.5 py-1 rounded-lg bg-forest-deep border border-bamboo-mid/40 text-[10px] text-dongho-paper/80 hover:text-dongho-paper transition"
                      >
                        🗑️ Xóa nét vẽ
                      </button>
                      {faceExpr.customFaceCanvas && (
                        <span className="text-[9.5px] text-[#06D6A0] font-semibold flex items-center gap-1">
                          <span>✓ Đang áp dụng nét vẽ</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Final Buttons */}
          <div className="w-full max-w-xs space-y-2 mt-2.5">
            <button
              onClick={() => handleTriggerServerAnimation(previewMotion)}
              className="w-full py-2 rounded-xl bg-forest-darker/90 hover:bg-forest-deep border border-warm-amber/50 text-warm-glow text-[11px] font-semibold flex items-center justify-center gap-1.5 transition shadow"
            >
              <Film className="w-3.5 h-3.5 text-warm-amber" />
              <span>Xuất Video MP4 từ Python Server ({previewMotion})</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-2.5 rounded-2xl bg-forest-deep border border-bamboo-soft/40 text-dongho-paper/80 font-medium text-xs hover:border-warm-amber transition flex items-center justify-center gap-1.5"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Chỉnh lại xương</span>
              </button>
              <button
                onClick={() => {
                  if (currentImageUri) {
                    onConfirm(currentImageUri, imageSource);
                  }
                }}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-forest-abyss" />
                <span>Là bạn ấy rồi!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRẠNG THÁI GỬI LÊN SERVER PYTHON & RENDER VIDEO */}
      {isGeneratingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs bg-forest-deep border-2 border-warm-amber/60 rounded-3xl p-6 text-center text-dongho-paper shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-warm-amber border-t-transparent animate-spin mb-4" />
            <h3 className="text-sm font-bold text-warm-glow">Server AI Đang Xử Lý Hoạt Ảnh</h3>
            <p className="text-xs text-dongho-paper/80 mt-2 font-medium">
              {videoGenerationStep || 'Đang xử lý gắn xương và render chuyển động...'}
            </p>
            <span className="text-[10px] text-warm-amber/70 mt-3 font-mono">
              Chuẩn Meta Animated Drawings &bull; Python FastAPI
            </span>
          </div>
        </div>
      )}

      {/* MODAL XEM VIDEO KẾT QUẢ TỪ SERVER */}
      {showVideoModal && generatedVideoUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-forest-deep border-2 border-warm-amber/70 rounded-3xl p-5 text-dongho-paper shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-forest-darker hover:bg-forest-mist text-dongho-paper/60 hover:text-dongho-paper transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-warm-glow font-bold text-sm mb-3">
              <Film className="w-4 h-4 text-warm-amber" />
              <span>Video Hoạt Ảnh Từ Python Server</span>
            </div>

            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#0F191C] border-2 border-bamboo-mid/40 shadow-inner flex items-center justify-center mb-4">
              {generatedVideoUri.startsWith('data:video/mp4') ? (
                <video
                  src={generatedVideoUri}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={generatedVideoUri}
                  alt="Animated Result"
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-forest-abyss/80 text-[10px] font-mono text-warm-amber border border-warm-amber/30">
                Meta 16-Joints &bull; {selectedMotionForApi.toUpperCase()}
              </div>
            </div>

            <div className="w-full space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={generatedVideoUri}
                  download={`mangnon_${selectedMotionForApi}.mp4`}
                  className="py-2.5 px-3 rounded-xl bg-forest-darker hover:bg-forest-mist border border-warm-amber/40 text-warm-glow text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Video MP4</span>
                </a>
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    setStep(4);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-forest-darker hover:bg-forest-mist border border-bamboo-soft/40 text-dongho-paper text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Move className="w-4 h-4" />
                  <span>Xem Khung Xương</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowVideoModal(false);
                  if (currentImageUri) {
                    onConfirm(currentImageUri, imageSource);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss font-bold text-xs shadow-xl hover:brightness-105 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-forest-abyss" />
                <span>Đưa Măng Non Vào Rừng Tre</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẤU HÌNH MODEL AI & API KEYS (REMOVE.BG / CLIPDROP / REPLICATE) */}
      {showAiSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-abyss/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-forest-deep border-2 border-warm-amber/70 rounded-3xl p-5 text-dongho-paper shadow-2xl flex flex-col">
            <button
              onClick={() => setShowAiSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-forest-darker hover:bg-forest-mist text-dongho-paper/60 hover:text-dongho-paper transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-warm-glow font-bold text-sm mb-2">
              <Settings className="w-4 h-4 text-warm-amber" />
              <span>Cấu Hình Tách Nền AI</span>
            </div>
            <p className="text-[11px] text-dongho-paper/70 mb-3 leading-relaxed">
              Măng Non tích hợp sẵn <strong>rembg AI Local</strong> (chạy trực tiếp không cần key). Nếu có API Key riêng, cậu có thể kết nối thêm các dịch vụ bên dưới:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-warm-glow mb-1">
                  Mô hình AI tách nền ưu tiên:
                </label>
                <select
                  value={aiModelChoice}
                  onChange={(e) => setAiModelChoice(e.target.value as any)}
                  className="w-full bg-forest-darker border border-bamboo-mid/50 rounded-xl px-3 py-2 text-dongho-paper text-xs focus:outline-none focus:border-warm-amber"
                >
                  <option value="auto">Tự động (Ưu tiên API Key nếu có, fallback rembg)</option>
                  <option value="u2netp">rembg Local AI (u2netp - Siêu tốc &lt; 0.5s)</option>
                  <option value="birefnet">rembg Local AI (BiRefNet - Tinh tế 2026)</option>
                  <option value="remove_bg">Remove.bg Cloud API</option>
                  <option value="clipdrop">Clipdrop Cloud API</option>
                  <option value="replicate">Replicate Cloud AI</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-dongho-paper/80 mb-0.5">
                  Remove.bg API Key (Tùy chọn):
                </label>
                <input
                  type="password"
                  value={removeBgKey}
                  placeholder="Nhập API Key từ remove.bg..."
                  onChange={(e) => setRemoveBgKey(e.target.value)}
                  className="w-full bg-forest-darker border border-bamboo-mid/40 rounded-xl px-3 py-1.5 text-dongho-paper text-xs placeholder:text-dongho-paper/30 focus:outline-none focus:border-warm-amber"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-dongho-paper/80 mb-0.5">
                  Clipdrop API Key (Tùy chọn):
                </label>
                <input
                  type="password"
                  value={clipdropKey}
                  placeholder="Nhập API Key từ clipdrop.co..."
                  onChange={(e) => setClipdropKey(e.target.value)}
                  className="w-full bg-forest-darker border border-bamboo-mid/40 rounded-xl px-3 py-1.5 text-dongho-paper text-xs placeholder:text-dongho-paper/30 focus:outline-none focus:border-warm-amber"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-dongho-paper/80 mb-0.5">
                  Replicate API Token (Tùy chọn):
                </label>
                <input
                  type="password"
                  value={replicateKey}
                  placeholder="r8_..."
                  onChange={(e) => setReplicateKey(e.target.value)}
                  className="w-full bg-forest-darker border border-bamboo-mid/40 rounded-xl px-3 py-1.5 text-dongho-paper text-xs placeholder:text-dongho-paper/30 focus:outline-none focus:border-warm-amber"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-bamboo-mid/30 flex gap-2">
              <button
                onClick={() => setShowAiSettingsModal(false)}
                className="flex-1 py-2 rounded-xl bg-forest-darker border border-bamboo-soft/40 text-dongho-paper/80 text-xs font-medium hover:text-dongho-paper transition"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('mangnon_rb_key', removeBgKey);
                    localStorage.setItem('mangnon_cd_key', clipdropKey);
                    localStorage.setItem('mangnon_rep_key', replicateKey);
                    localStorage.setItem('mangnon_ai_model', aiModelChoice);
                  } catch {}
                  setShowAiSettingsModal(false);
                  if (loadedImgRef.current) {
                    runAiSegmentation(loadedImgRef.current.src);
                  }
                  SoundEngine.playBlessingChime();
                }}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-warm-amber to-warm-glow text-forest-abyss text-xs font-bold shadow hover:brightness-105 transition"
              >
                Lưu &amp; Quét Lại AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer spacer */}
      <div className="pb-1" />
    </div>
  );
}
