'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Paintbrush, RotateCcw, Upload, Sparkles, Wand2 } from 'lucide-react';

interface BambooCanvasProps {
  onSave: (dataUrl: string) => void;
  initialImage?: string;
}

export default function BambooCanvas({ onSave, initialImage }: BambooCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6B8F71'); // Xanh tre tự nhiên
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Bảng màu mộc bản Đông Hồ & Rừng tre theo mục 5.2
  const colors = [
    { name: 'Xanh Tre Trầm', hex: '#3E5C45' },
    { name: 'Xanh Tre Tự Nhiên', hex: '#6B8F71' },
    { name: 'Vàng Cam Ấm (Ống Nứa)', hex: '#F4A259' },
    { name: 'Vàng Trăng Rằm', hex: '#FFD166' },
    { name: 'Đỏ Hoa Gạo (Đông Hồ)', hex: '#E63946' },
    { name: 'Mực Tàu Đen', hex: '#1B2A2F' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 320;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
      };
      img.src = initialImage;
    } else {
      drawStarterGhost(ctx);
    }
  }, [initialImage]);

  const drawStarterGhost = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = '#52795B';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    // Thân măng
    ctx.beginPath();
    ctx.ellipse(160, 180, 70, 95, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Đỉnh măng
    ctx.beginPath();
    ctx.moveTo(160, 40);
    ctx.lineTo(110, 110);
    ctx.lineTo(210, 110);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasContent(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? '#132024' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    updateDataUrl();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    drawStarterGhost(ctx);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasContent(true);
        updateDataUrl();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const updateDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    onSave(data);
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-forest-darker/95 border-2 border-bamboo-mid/50 p-5 rounded-3xl shadow-2xl w-full max-w-md text-dongho-paper">
      <div className="flex items-center justify-between w-full">
        <div className="text-sm font-semibold text-warm-glow flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-warm-amber" />
          Nét vẽ độc nhất của riêng cậu
        </div>
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={`text-xs px-2.5 py-1 rounded-md font-medium border transition ${
            previewMode
              ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold shadow'
              : 'bg-forest-deep text-dongho-paper/80 border-bamboo-mid/40 hover:text-warm-glow'
          }`}
        >
          {previewMode ? 'Dừng xem trước' : '✨ Ngắm sống dậy'}
        </button>
      </div>

      {/* Canvas container */}
      <div className="relative w-80 h-80 rounded-2xl bg-gradient-to-b from-forest-abyss to-forest-darker border-2 border-bamboo-mid/40 flex items-center justify-center overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`cursor-crosshair touch-none ${
            previewMode ? 'animate-breathe animate-sway-gentle drop-shadow-[0_0_16px_rgba(255,209,102,0.5)]' : ''
          }`}
        />

        {previewMode && (
          <div className="absolute bottom-2.5 left-2 right-2 text-center text-[11px] bg-forest-abyss/85 backdrop-blur text-warm-glow py-1 px-3 rounded-full border border-warm-amber/50">
            🌱 Măng Non đang thở nhẹ nhàng giữa Rừng Tre
          </div>
        )}
      </div>

      {/* Tool palette */}
      <div className="flex flex-col gap-3 w-full">
        {/* Colors */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  setColor(c.hex);
                  setIsEraser(false);
                }}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  !isEraser && color === c.hex ? 'scale-125 border-dongho-paper shadow-md' : 'border-forest-darker opacity-80'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEraser(!isEraser)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 ${
                isEraser
                  ? 'bg-warm-amber text-forest-abyss border-warm-amber font-bold'
                  : 'bg-forest-deep text-dongho-paper/80 border-bamboo-mid/40 hover:text-warm-glow'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              title="Vẽ lại nét khác"
              className="p-2 rounded-lg border bg-forest-deep text-dongho-paper/80 border-bamboo-mid/40 hover:text-dongho-red"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Brush size slider */}
        <div className="flex items-center gap-3 text-xs text-dongho-paper/70">
          <span>Nét:</span>
          <input
            type="range"
            min="2"
            max="24"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-warm-amber bg-forest-deep h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-6 text-right font-mono text-warm-glow">{brushSize}px</span>
        </div>

        {/* Upload photo option */}
        <div className="flex items-center justify-center pt-1 border-t border-bamboo-mid/20">
          <label className="flex items-center gap-2 text-xs text-warm-amber hover:text-warm-glow cursor-pointer py-1 px-3 rounded-lg hover:bg-forest-deep transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Hoặc tải ảnh từ máy (giữ nguyên hình gốc)</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
