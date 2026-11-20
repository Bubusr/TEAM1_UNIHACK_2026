import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Image as ImageIcon,
  RefreshCw,
  X,
  Upload,
  Video,
  VideoOff,
  Check,
  AlertCircle,
  Sparkles,
  Smartphone,
  Monitor,
} from 'lucide-react';

export interface DiscoverCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto: (file: File) => void;
  currentTheme?: string;
  isSubmitting?: boolean;
}

type CameraViewMode = 'webcam' | 'preview' | 'fallback';

export const DiscoverCameraModal: React.FC<DiscoverCameraModalProps> = ({
  isOpen,
  onClose,
  onCapturePhoto,
  currentTheme = 'Fluffy Tails',
  isSubmitting = false,
}) => {
  // Breakpoint detection (>= 768px is desktop/tablet landscape)
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 768px)').matches;
  });

  // Camera stream and UI states
  const [viewMode, setViewMode] = useState<CameraViewMode>('webcam');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const desktopFileInputRef = useRef<HTMLInputElement | null>(null);

  // Responsive breakpoint listener (pure CSS matchMedia, NO user-agent sniffing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };
    mq.addEventListener('change', handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ─── REQ-1: Stop ALL media tracks and release hardware lock ───────────────
  // Called on: modal close, unmount, retake, file selection, error fallback.
  // Setting srcObject = null detaches the stream before the GC runs,
  // ensuring the camera LED goes dark immediately on iOS Safari too.
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();         // stop() releases the hardware, not just pauses
        } catch {
          // Ignore DOMException if track already ended (e.g. device revoked)
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Detach stream reference from DOM
    }
    setWebcamActive(false);
  }, []);

  // ─── REQ-2: Start Desktop Webcam — iOS Safari + Android Chrome safe ───────
  // • playsInline is set on the <video> element (required by iOS Safari WebKit
  //   to allow autoplay without entering fullscreen).
  // • AbortError: getUserMedia call was aborted before stream was established
  //   (e.g. rapid open/close). Treated as a non-retriable soft failure → fallback.
  //   We do NOT retry on AbortError to avoid a retry loop.
  // • OverconstrainedError: requested constraints (resolution) cannot be met
  //   by any available device. Retry once without ideal width/height constraints.
  //
  // ─── RACE CONDITION FIX ─────────────────────────────────────────────────────
  // getUserMedia is async. If the modal closes while getUserMedia is still
  // pending, the useEffect cleanup calls stopWebcam() — but streamRef.current
  // is still null at that point. When getUserMedia resolves later, the stream
  // would be assigned to streamRef.current and NEVER stopped (camera LED stays on).
  //
  // Fix: a `cancelled` flag (closed over per-call) is set to true by a cleanup
  // function returned from useEffect. If the flag is true when getUserMedia
  // resolves, we immediately stop every track on the late-arriving stream and
  // return without touching React state. This is equivalent to AbortController
  // but works in every browser including older Safari.
  const startWebcam = useCallback(async (cancelledRef: { current: boolean }) => {
    stopWebcam();
    setCameraError(null);

    // Browser / secure-context check (mediaDevices is undefined on plain HTTP)
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      if (cancelledRef.current) return;
      setCameraError(
        'Webcam requires a secure context (HTTPS or localhost). ' +
        'Please upload an image file instead.'
      );
      setViewMode('fallback');
      return;
    }

    // Helper to attempt getUserMedia with given constraints
    const attemptGetUserMedia = async (
      constraints: MediaStreamConstraints
    ): Promise<MediaStream> => {
      return navigator.mediaDevices.getUserMedia(constraints);
    };

    try {
      let stream: MediaStream;
      try {
        // First attempt: ideal HD resolution
        stream = await attemptGetUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (firstErr: unknown) {
        const fe = firstErr as { name?: string };
        if (fe.name === 'OverconstrainedError' || fe.name === 'ConstraintNotSatisfiedError') {
          // REQ-2: Retry without resolution constraints (older iOS / low-res webcam)
          stream = await attemptGetUserMedia({ video: { facingMode: 'user' }, audio: false });
        } else {
          throw firstErr;
        }
      }

      // ── RACE CONDITION CHECK ──────────────────────────────────────────────
      // Modal was closed (or component unmounted) while getUserMedia was pending.
      // Stop the late-arriving stream immediately — do not touch React state.
      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // playsInline ensures iOS Safari plays inline (not fullscreen).
        // The playsInline attribute is set statically on the JSX element.
        await videoRef.current.play().catch(() => {});
      }
      setWebcamActive(true);
      setViewMode('webcam');
    } catch (err: unknown) {
      if (cancelledRef.current) return; // modal already closed, discard silently
      const e = err as { name?: string; message?: string };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        // REQ-5: Permission denied → show friendly fallback, do NOT block UI
        setCameraError(
          'Camera access was denied. You can still upload a photo from your files or drag & drop below.'
        );
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        // REQ-5: No webcam hardware found → guide user to file upload fallback
        setCameraError(
          'No webcam found on this device. Please upload an image file instead.'
        );
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        setCameraError('Webcam is already in use by another app. Close it and try again, or upload a file.');
      } else if (e.name === 'AbortError') {
        // REQ-2: iOS Safari fires AbortError on rapid modal open/close.
        // We do NOT retry here — that would create a retry loop.
        // User sees fallback with upload option instead.
        setCameraError('Camera initialisation was interrupted. Please try again or upload a file.');
      } else {
        setCameraError(
          e.message || 'Unable to access webcam. Please upload an image instead.'
        );
      }
      // REQ-5: Always fall back to file-upload view, never leave user stuck
      setViewMode('fallback');
    }
  }, [stopWebcam]);

  // ─── REQ-1 + REQ-4: Handle open/close lifecycle ───────────────────────────
  // On close: stopWebcam() THEN revoke any outstanding object URL to prevent
  // memory leaks. Object URLs are blobs held in browser memory until revoked.
  //
  // RACE CONDITION: cancelledRef is a stable object { current: boolean } that
  // is created fresh each time isOpen becomes true (new ref per open cycle).
  // startWebcam reads cancelledRef.current after every await point. The cleanup
  // function sets it to true, so if the modal closes while getUserMedia is still
  // pending, the resolved stream is stopped immediately without touching state.
  useEffect(() => {
    // Create a cancellation token for this open cycle
    const cancelledRef = { current: false };

    if (isOpen) {
      // On desktop, try starting webcam preview if available
      if (isDesktop && !selectedFile) {
        startWebcam(cancelledRef);
      } else if (!isDesktop && !selectedFile) {
        setViewMode('fallback');
      }
    } else {
      // REQ-1: Stop webcam tracks immediately when modal closes
      stopWebcam();
      // REQ-4: Revoke object URL to free blob memory on close
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSelectedFile(null);
      setCameraError(null);
      setViewMode('webcam');
    }

    // REQ-1 + RACE FIX: cleanup runs on unmount AND when isOpen/isDesktop changes.
    // Setting cancelled prevents any pending getUserMedia resolve from touching state.
    return () => {
      cancelledRef.current = true;
      stopWebcam();
    };
  }, [isOpen, isDesktop, startWebcam, stopWebcam]);

  // Capture snapshot from webcam video canvas
  const handleCaptureWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File(
          [blob],
          `webcam-snapshot-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        handleSelectFile(file);
        stopWebcam();
      },
      'image/jpeg',
      0.92
    );
  };

  // ─── REQ-3: Preserve image orientation ─────────────────────────────────────
  // Some JPEG files from iOS cameras embed EXIF orientation flags (e.g. 90°).
  // `image-orientation: from-image` tells the browser to honour the EXIF tag.
  // We also set `object-contain` so portrait/landscape both preview without
  // cropping or distortion (aspect-ratio preservation).
  const handleSelectFile = (file: File) => {
    if (!file) return;

    // Client-side sanity guard (backend remains the authoritative validator)
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setCameraError('Image exceeds maximum allowed size (12 MB).');
      return;
    }

    stopWebcam();
    setCameraError(null);
    setSelectedFile(file);

    // REQ-4: Revoke any previous object URL before creating a new one
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setViewMode('preview');
  };

  // Retake / discard photo
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setCameraError(null);

    if (isDesktop) {
      // Pass a fresh non-cancelled ref; this call is user-initiated so
      // there is no pending getUserMedia to race against.
      startWebcam({ current: false });
    } else {
      setViewMode('fallback');
    }
  };

  // Submit selected photo to shared AI Judge flow
  const handleConfirmSubmit = () => {
    if (!selectedFile || isSubmitting) return;
    onCapturePhoto(selectedFile);
    onClose();
  };

  // Drag and drop handlers for desktop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleSelectFile(files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discover-camera-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#4B3C46]/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[540px] bg-[#FFFDF9] border-[3px] border-[#DFCBBF] rounded-[32px] shadow-[0_16px_40px_rgba(75,60,70,0.22)] overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Hidden File Inputs */}
        {/* 1. Mobile Rear Camera Capture (accept="image/*" capture="environment") */}
        <input
          ref={mobileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleSelectFile(f);
            e.target.value = '';
          }}
        />

        {/* 2. Gallery Image Selection */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleSelectFile(f);
            e.target.value = '';
          }}
        />

        {/* 3. Desktop File Picker */}
        <input
          ref={desktopFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleSelectFile(f);
            e.target.value = '';
          }}
        />

        {/* Offscreen Canvas for Snapshotting */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#F0E2D8] bg-[#FFFBF7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFE07D] flex items-center justify-center text-[#4B3C46] shadow-sm">
              <Camera className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div>
              <h2
                id="discover-camera-title"
                className="font-display text-[16px] font-extrabold text-[#4B3C46] leading-tight"
              >
                Snapshot Garden Discover
              </h2>
              <p className="text-[11.5px] font-bold text-[#8A747E] flex items-center gap-1">
                <span>Theme:</span>
                <span className="text-[#C27385] font-extrabold">
                  📸 {currentTheme}
                </span>
                <span className="text-[10px] bg-[#F4E9E0] px-1.5 py-0.2 rounded-full text-[#6E5321]">
                  {isDesktop ? 'Desktop View' : 'Mobile View'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-[#F4E9E0] hover:bg-[#E8D9CD] active:scale-95 text-[#4B3C46] flex items-center justify-center transition cursor-pointer"
            aria-label="Close camera modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error / Fallback Notification Banner */}
        {cameraError && (
          <div className="mx-4 mt-3 bg-[#FFEAF0] border border-[#E6B8C5] rounded-2xl px-3 py-2 text-[12px] font-bold text-[#8F394D] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C23B5A]" />
            <div className="flex-1">
              <span>{cameraError}</span>
            </div>
          </div>
        )}

        {/* Main View Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
          {/* VIEW 1: PREVIEW CAPTURED / SELECTED PHOTO */}
          {viewMode === 'preview' && previewUrl && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="relative w-full max-w-[340px] aspect-[4/3] rounded-2xl border-4 border-[#FFFDF9] shadow-[0_8px_24px_rgba(75,60,70,0.18)] overflow-hidden bg-[#2D232A] flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Captured Pet Preview"
                  // REQ-3: honour EXIF rotation tag from iOS/Android cameras,
                  // object-contain preserves natural aspect ratio without cropping
                  style={{ imageOrientation: 'from-image' }}
                  className="w-full h-full object-contain"
                />

                {/* Viewfinder Pet Targeting Frame Overlay */}
                <div className="absolute inset-3 pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-t-2 border-l-2 border-[#FFE07D] rounded-tl-md shadow-sm" />
                    <div className="w-5 h-5 border-t-2 border-r-2 border-[#FFE07D] rounded-tr-md shadow-sm" />
                  </div>
                  <div className="self-center bg-[#4B3C46]/70 backdrop-blur-xs text-[#FFFDF9] px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <span>🐾 Pet Alignment Frame</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-b-2 border-l-2 border-[#FFE07D] rounded-bl-md shadow-sm" />
                    <div className="w-5 h-5 border-b-2 border-r-2 border-[#FFE07D] rounded-br-md shadow-sm" />
                  </div>
                </div>

                <div className="absolute top-2 left-2 bg-[#4B3C46]/80 backdrop-blur-sm text-[#FFFDF9] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#52B788]" />
                  <span>Photo Ready</span>
                </div>
              </div>

              {selectedFile && (
                <div className="text-[12px] text-[#8A747E] font-medium text-center">
                  <span className="font-bold text-[#4B3C46]">
                    {selectedFile.name}
                  </span>{' '}
                  ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}

              {/* Action Buttons: Retake vs Submit */}
              <div className="w-full flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isSubmitting}
                  className="cream-btn flex-1 py-2.5 px-4 rounded-full font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer bg-[#FFF9F2] hover:bg-[#F7EFE6] border border-[#E8D9CD]"
                >
                  <RefreshCw className="w-4 h-4 stroke-[2.4]" />
                  <span>Retake</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="buttercup-cta flex-1 py-2.5 px-4 rounded-full font-display text-[13.5px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-1.5 cursor-pointer bg-[#FFE07D] hover:bg-[#FFD752] shadow-[0_4px_12px_rgba(255,224,125,0.4)]"
                >
                  <Sparkles className="w-4 h-4 text-[#C99D66] stroke-[2.4]" />
                  <span>
                    {isSubmitting ? 'Evaluating...' : 'Submit to AI'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: DESKTOP WEBCAM LIVE PREVIEW */}
          {isDesktop && viewMode === 'webcam' && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl border-4 border-[#FFFDF9] shadow-[0_8px_24px_rgba(75,60,70,0.18)] overflow-hidden bg-[#2D232A] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                {!webcamActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#3A2E35] text-[#F3E8DF]">
                    <VideoOff className="w-8 h-8 opacity-60" />
                    <span className="text-[12px] font-bold">
                      Initializing Webcam...
                    </span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-[#4B3C46]/80 backdrop-blur-sm text-[#FFFDF9] text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#E65100] animate-pulse" />
                  <span>Live Webcam</span>
                </div>

                {/* Viewfinder Pet Targeting Frame Overlay */}
                <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-[#FFE07D] rounded-tl-md shadow-sm" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-[#FFE07D] rounded-tr-md shadow-sm" />
                  </div>
                  <div className="self-center bg-[#4B3C46]/70 backdrop-blur-xs text-[#FFFDF9] px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1 shadow-sm">
                    <span>🐾 Center pet inside frame</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-[#FFE07D] rounded-bl-md shadow-sm" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-[#FFE07D] rounded-br-md shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Shutter Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCaptureWebcam}
                  disabled={!webcamActive || isSubmitting}
                  className="buttercup-cta py-3 px-6 rounded-full font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(255,224,125,0.5)] active:scale-95 transition-transform"
                >
                  <Camera className="w-5 h-5 stroke-[2.4]" />
                  <span>Capture Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('fallback')}
                  className="cream-btn py-2 px-3.5 rounded-full text-[12px] font-bold text-[#8A747E] hover:text-[#4B3C46] border border-[#E8D9CD] cursor-pointer"
                >
                  Upload File Instead
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: FALLBACK / MOBILE OR DRAG-AND-DROP UPLOAD */}
          {((!isDesktop && viewMode !== 'preview') ||
            (isDesktop && viewMode === 'fallback')) && (
            <div className="w-full flex flex-col items-center gap-3">
              {/* DESKTOP DRAG & DROP ZONE */}
              {isDesktop ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => desktopFileInputRef.current?.click()}
                  className={`w-full max-w-[420px] aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#FFE07D] bg-[#FFF9E6] scale-[1.01]'
                      : 'border-[#DFCBBF] bg-[#FFF9F2] hover:bg-[#FFF3E6] hover:border-[#CBAEA0]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFE07D] flex items-center justify-center text-[#4B3C46] shadow-sm mb-2.5">
                    <Upload className="w-6 h-6 stroke-[2.4]" />
                  </div>
                  <h3 className="font-display text-[15px] font-extrabold text-[#4B3C46]">
                    Drag &amp; Drop Pet Photo Here
                  </h3>
                  <p className="text-[12px] font-bold text-[#8A747E] mt-1 max-w-[280px]">
                    Drop an image file from your computer, or click to browse.
                  </p>
                  <span className="text-[11px] text-[#A68F99] mt-2 font-mono">
                    JPEG, PNG, WebP · Max 12MB
                  </span>
                </div>
              ) : (
                /* MOBILE DUAL-BUTTON DISCOVERY EXPERIENCE */
                <div className="w-full max-w-[340px] flex flex-col items-center gap-3 py-2">
                  <div className="w-16 h-16 rounded-full bg-[#FFE07D] flex items-center justify-center text-[#4B3C46] shadow-md mb-1">
                    <Smartphone className="w-8 h-8 stroke-[2.2]" />
                  </div>
                  <h3 className="font-display text-[17px] font-extrabold text-[#4B3C46] text-center">
                    Discover Sanctuary Pets
                  </h3>
                  <p className="text-[12px] font-bold text-[#8A747E] text-center max-w-[260px] leading-relaxed">
                    Snap a real photo with your rear camera, or choose a pet
                    snapshot from your gallery!
                  </p>

                  <div className="w-full flex flex-col gap-2.5 pt-2">
                    {/* Primary Button: Rear Camera */}
                    <button
                      type="button"
                      onClick={() => mobileInputRef.current?.click()}
                      className="buttercup-cta w-full py-3.5 px-5 rounded-full font-display text-[15px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_16px_rgba(255,224,125,0.4)] active:scale-95 transition-transform"
                    >
                      <Camera className="w-5 h-5 stroke-[2.4]" />
                      <span>Take Photo (Rear Camera)</span>
                    </button>

                    {/* Secondary Button: Gallery Picker */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="cream-btn w-full py-3 px-5 rounded-full font-display text-[14px] font-extrabold text-[#4B3C46] flex items-center justify-center gap-2 cursor-pointer bg-[#FFF9F2] hover:bg-[#F7EFE6] border-2 border-[#E8D9CD]"
                    >
                      <ImageIcon className="w-4 h-4 stroke-[2.4]" />
                      <span>Choose from Gallery</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Switch Back to Webcam Button */}
              {isDesktop && (
                <button
                  type="button"
                  onClick={() => startWebcam({ current: false })}
                  className="cream-btn py-2 px-4 rounded-full text-[12.5px] font-extrabold text-[#4B3C46] border border-[#E8D9CD] flex items-center gap-1.5 cursor-pointer hover:bg-[#FFF9F2]"
                >
                  <Video className="w-4 h-4 text-[#C99D66]" />
                  <span>Switch to Live Webcam</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Guidance */}
        <div className="px-5 py-3 border-t border-[#F0E2D8] bg-[#FFFBF7] flex items-center justify-between text-[11px] font-bold text-[#8A747E]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C99D66]" />
            AI Judge: Confidence ≥ 85% · Score ≥ 80
          </span>
          <span className="hidden sm:inline font-mono">
            {isDesktop ? 'Desktop Experience' : 'Mobile Experience'}
          </span>
        </div>
      </div>
    </div>
  );
};
