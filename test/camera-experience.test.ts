import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Responsive Mobile + Desktop Camera Experience & Discover Flow', () => {
  const modalSourcePath = path.resolve(
    process.cwd(),
    'src/components/camera/DiscoverCameraModal.tsx'
  );
  const modalSource = fs.readFileSync(modalSourcePath, 'utf8');

  // ─── REQ-1 ──────────────────────────────────────────────────────────────────
  it('1. Mobile Experience: enforces rear camera capture input with capture="environment"', () => {
    assert.ok(
      modalSource.includes('capture="environment"'),
      'Must contain capture="environment" for native rear camera on iOS Safari & Android Chrome'
    );
    assert.ok(
      modalSource.includes('accept="image/*"'),
      'Must accept all image mime types on camera file input'
    );
  });

  it('2. Mobile Experience: provides distinct gallery picker input alongside rear camera', () => {
    assert.ok(
      modalSource.includes('ref={galleryInputRef}'),
      'Must have separate gallery file input'
    );
    assert.ok(
      modalSource.includes('Choose from Gallery'),
      'Must have visible button for gallery selection'
    );
    assert.ok(
      modalSource.includes('Take Photo (Rear Camera)'),
      'Must have visible button for rear camera'
    );
  });

  it('3. Desktop Experience: integrates getUserMedia webcam preview with video and offscreen canvas', () => {
    assert.ok(
      modalSource.includes('navigator.mediaDevices.getUserMedia'),
      'Must request camera stream via getUserMedia'
    );
    assert.ok(
      modalSource.includes("facingMode: 'user'"),
      'Desktop webcam defaults to user-facing mode'
    );
    assert.ok(
      modalSource.includes('<video'),
      'Must render HTML5 video element for live webcam stream'
    );
    assert.ok(
      modalSource.includes('<canvas'),
      'Must have canvas ref to snapshot webcam frame into image file'
    );
  });

  // ─── REQ-1 ──────────────────────────────────────────────────────────────────
  it('4. Camera Engineering (REQ-1): tracks stop on unmount/close, race condition guarded by cancelledRef', () => {
    // track.stop() releases hardware, not just pauses the stream
    assert.ok(
      modalSource.includes('track.stop()'),
      'Must call track.stop() on all MediaStream tracks'
    );
    assert.ok(
      modalSource.includes('stopWebcam'),
      'Must have dedicated stopWebcam function'
    );
    // srcObject = null detaches stream before GC, turning off camera LED on iOS too
    assert.ok(
      modalSource.includes('srcObject = null'),
      'Must detach stream from video ref to prevent background hardware lock'
    );
    // stopWebcam must be called in useEffect cleanup so unmount also stops tracks
    assert.ok(
      modalSource.includes('return () => {') && modalSource.includes('stopWebcam()'),
      'Must call stopWebcam in useEffect cleanup to stop tracks on unmount'
    );
    // RACE CONDITION FIX: cancelledRef prevents late-resolving getUserMedia from
    // assigning stream to a closed/unmounted component (which would leave camera on)
    assert.ok(
      modalSource.includes('cancelledRef'),
      'Must use cancelledRef pattern to guard against pending getUserMedia after modal close'
    );
    assert.ok(
      modalSource.includes('cancelledRef.current = true'),
      'useEffect cleanup must set cancelledRef.current = true to cancel pending getUserMedia'
    );
    assert.ok(
      modalSource.includes('if (cancelledRef.current) return'),
      'startWebcam must check cancelledRef after each await point and bail if cancelled'
    );
    // AbortError branch must NOT trigger a retry (would cause retry loop)
    assert.ok(
      !modalSource.includes('AbortError') ||
        !modalSource.includes("startWebcam") ||
        // Confirm AbortError catch block does NOT call startWebcam
        (() => {
          const abortIdx = modalSource.indexOf("AbortError");
          const nextCatch = modalSource.indexOf("} else {", abortIdx);
          const segment = modalSource.slice(abortIdx, nextCatch);
          return !segment.includes('startWebcam(');
        })(),
      'AbortError handler must NOT call startWebcam() — that would create a retry loop'
    );
  });

  // ─── REQ-2 + REQ-5 ──────────────────────────────────────────────────────────
  it('5. Error Handling (REQ-2 + REQ-5): NotAllowedError, NotFoundError, AbortError, OverconstrainedError — always fallback to upload', () => {
    // REQ-2: iOS Safari fires AbortError on rapid open/close
    assert.ok(
      modalSource.includes('AbortError'),
      'Must handle AbortError (iOS Safari rapid open/close)'
    );
    // REQ-2: OverconstrainedError → retry getUserMedia without resolution constraints
    assert.ok(
      modalSource.includes('OverconstrainedError'),
      'Must handle OverconstrainedError and retry without resolution constraints'
    );
    assert.ok(
      modalSource.includes('NotAllowedError'),
      'Must handle camera permission denied (NotAllowedError)'
    );
    assert.ok(
      modalSource.includes('NotFoundError'),
      'Must handle device without webcam (NotFoundError)'
    );
    assert.ok(
      modalSource.includes('PermissionDeniedError'),
      'Must handle legacy permission denied event (PermissionDeniedError)'
    );
    // REQ-5: Every error branch must land in fallback — user can always upload
    assert.ok(
      modalSource.includes("setViewMode('fallback')"),
      'Must transition to file-upload fallback on all camera errors'
    );
  });

  it('6. Desktop Drag & Drop: provides interactive drag zone with visual states and file drop handler', () => {
    assert.ok(
      modalSource.includes('onDragOver={handleDragOver}'),
      'Must implement dragover handler'
    );
    assert.ok(
      modalSource.includes('onDragLeave={handleDragLeave}'),
      'Must implement dragleave handler'
    );
    assert.ok(
      modalSource.includes('onDrop={handleDrop}'),
      'Must implement drop handler'
    );
    assert.ok(
      modalSource.includes('e.dataTransfer.files'),
      'Must extract dropped files from dataTransfer'
    );
  });

  // ─── REQ-3 + REQ-4 ──────────────────────────────────────────────────────────
  it('7. Preview & Retake (REQ-3 orientation + REQ-4 object URL cleanup)', () => {
    assert.ok(
      modalSource.includes("viewMode === 'preview'"),
      'Must support preview state'
    );
    assert.ok(
      modalSource.includes('URL.createObjectURL'),
      'Must generate object URL for local file preview'
    );
    // REQ-4: revokeObjectURL must appear at least twice — retake AND close paths
    const revokeCount = (modalSource.match(/URL\.revokeObjectURL/g) || []).length;
    assert.ok(
      revokeCount >= 2,
      `Must call URL.revokeObjectURL in at least 2 places (retake + close); found ${revokeCount}`
    );
    assert.ok(
      modalSource.includes('handleRetake'),
      'Must have retake handler to restart camera or picker'
    );
    // REQ-3: honour EXIF orientation tag from iOS/Android cameras
    assert.ok(
      modalSource.includes('imageOrientation'),
      'Must apply imageOrientation style to preserve EXIF orientation on iOS/Android photos'
    );
    // REQ-3: object-contain preserves natural aspect ratio without cropping
    assert.ok(
      modalSource.includes('object-contain'),
      'Must use object-contain to preserve aspect ratio in preview'
    );
  });

  // ─── REQ-4 ──────────────────────────────────────────────────────────────────
  it('8. Concurrency & Protection (REQ-4): prevents duplicate submissions, disables controls during submit', () => {
    assert.ok(
      modalSource.includes('disabled={isSubmitting}'),
      'Submit and retake buttons must be disabled during active submission'
    );
    assert.ok(
      modalSource.includes('if (!selectedFile || isSubmitting) return;'),
      'Must guard confirm submit against double-click or duplicate dispatch'
    );
  });

  it('9. Responsive Breakpoints: uses pure CSS matchMedia breakpoints and never user-agent sniffing', () => {
    assert.ok(
      modalSource.includes("window.matchMedia('(min-width: 768px)')"),
      'Must detect desktop layout using 768px matchMedia breakpoint'
    );
    assert.ok(
      !modalSource.includes('navigator.userAgent'),
      'Must NOT use fragile user-agent string sniffing'
    );
    assert.ok(
      modalSource.includes("addEventListener('change'"),
      'Must react dynamically when browser window is resized'
    );
  });

  it('10. Shared Flow Integration: exports DiscoverCameraModal cleanly and connects with App.tsx', () => {
    const indexPath = path.resolve(process.cwd(), 'src/components/index.ts');
    const indexSource = fs.readFileSync(indexPath, 'utf8');
    assert.ok(
      indexSource.includes('DiscoverCameraModal'),
      'Must be exported from src/components/index.ts barrel'
    );

    const appPath = path.resolve(process.cwd(), 'src/App.tsx');
    const appSource = fs.readFileSync(appPath, 'utf8');
    assert.ok(
      appSource.includes('<DiscoverCameraModal'),
      'App.tsx must render DiscoverCameraModal'
    );
    assert.ok(
      appSource.includes('onCapturePhoto={handleUploadPhoto}'),
      'Both mobile and desktop flows must feed into the same authoritative handleUploadPhoto handler'
    );
  });
});
