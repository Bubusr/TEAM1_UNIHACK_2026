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
  const [color, setColor] = useState('#22c55e'); // Green bamboo
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const colors = [
    { name: 'Xanh Mầm', hex: '#4ade80' },
    { name: 'Xanh Tre', hex: '#16a34a' },
    { name: 'Vàng Nắng', hex: '#fbbf24' },
    { name: 'Đất Nâu', hex: '#b45309' },
    { name: 'Hồng Nụ', hex: '#f472b6' },
    { name: 'Mực Đen', hex: '#0f172a' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 320;
    canvas.height = 320;

    // Nền trong suốt
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
      // Vẽ sẵn hình gợi ý măng non mờ mờ
      drawStarterGhost(ctx);
    }
  }, [initialImage]);

  const drawStarterGhost = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
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
    ctx.strokeStyle = isEraser ? '#090d16' : color;
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
    <div className="flex flex-col items-center gap-4 bg-slate-900/90 border border-emerald-800/40 p-5 rounded-2xl shadow-xl w-full max-w-md">
      <div className="flex items-center justify-between w-full">
        <div className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-emerald-400" />
          Họa hình Măng Non của riêng bạn
        </div>
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={`text-xs px-2.5 py-1 rounded-md font-medium border transition ${
            previewMode
              ? 'bg-emerald-600 text-white border-emerald-500 shadow'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
          }`}
        >
          {previewMode ? 'Dừng xem trước' : '✨ Xem sống dậy'}
        </button>
      </div>

      {/* Canvas container */}
      <div className="relative w-80 h-80 rounded-2xl bg-gradient-to-b from-slate-950 to-emerald-950/40 border-2 border-emerald-800/60 flex items-center justify-center overflow-hidden shadow-inner">
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
            previewMode ? 'animate-breathe animate-sway drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]' : ''
          }`}
        />

        {previewMode && (
          <div className="absolute bottom-2 left-2 right-2 text-center text-[11px] bg-slate-950/80 backdrop-blur text-emerald-300 py-1 px-2 rounded-full border border-emerald-700/40">
            🌱 Măng Non đang thở &amp; sống dậy trong Rừng Tre!
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
                  !isEraser && color === c.hex ? 'scale-125 border-white shadow-md' : 'border-slate-800 opacity-90'
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
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={clearCanvas}
              title="Xóa vẽ lại"
              className="p-2 rounded-lg border bg-slate-800 text-slate-300 border-slate-700 hover:text-red-400"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Brush size slider */}
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span>Nét:</span>
          <input
            type="range"
            min="2"
            max="24"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-6 text-right font-mono">{brushSize}px</span>
        </div>

        {/* Upload photo option */}
        <div className="flex items-center justify-center pt-1 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 cursor-pointer py-1 px-3 rounded-lg hover:bg-emerald-950/40 transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Hoặc tải ảnh từ máy (tự động tách nền)</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
