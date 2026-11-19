import React, { useState, useEffect } from 'react';
import type { CutoutMode } from '../types';

// In-memory LRU-style cache for segmented transparent PNGs (prevents re-computing across renders)
export const processedCache = new Map<string, string>();
const inFlightRequests = new Map<
  string,
  Promise<{ url: string; isSilhouette: boolean }>
>();

// Persistent IndexedDB cache for transparent PNG cutouts (survives page refresh F5)
const IDB_NAME = 'paws_cutouts_v1';
const IDB_STORE = 'cutouts';

function getCutoutIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB unavailable'));
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPersistentCutout(key: string): Promise<string | null> {
  try {
    const db = await getCutoutIdb();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setPersistentCutout(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await getCutoutIdb();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(dataUrl, key);
  } catch {
    // Non-critical cache failure
  }
}

function isTransparentOrCutout(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('data:image/png') ||
    url.endsWith('.png') ||
    url.includes('/cropped_') ||
    url.includes('/neighbor_')
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

// Warm up ISNet neural network model in browser memory immediately on app load
if (typeof window !== 'undefined') {
  void import('@imgly/background-removal')
    .then(({ preload }) => {
      void preload({ model: 'isnet_fp16' });
    })
    .catch(() => {});
}

/**
 * Connected Component Analysis (Mask Refinement):
 * Clears disconnected stray speckles, grass bits, and dirt islands (<80px)
 * leaving only the clean, solid pet body.
 */
function refineMaskIslands(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  minComponentSize = 80
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;
  const isForeground = new Uint8Array(totalPixels);
  const visited = new Uint8Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    if (data[i * 4 + 3] > 25) {
      isForeground[i] = 1;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      if (isForeground[pIdx] && !visited[pIdx]) {
        const component: number[] = [pIdx];
        const queue: number[] = [pIdx];
        visited[pIdx] = 1;

        while (queue.length > 0) {
          const curr = queue.pop()!;
          const cy = Math.floor(curr / width);
          const cx = curr % width;

          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              if (isForeground[nIdx] && !visited[nIdx]) {
                visited[nIdx] = 1;
                queue.push(nIdx);
                component.push(nIdx);
              }
            }
          }
        }

        // If component is a small detached noise island, erase it completely
        if (component.length < minComponentSize) {
          for (const idx of component) {
            data[idx * 4 + 3] = 0;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Downscale full image to max 512px PNG before feeding to ISNet.
 */
function getDownscaledDataUrl(img: HTMLImageElement, maxDim = 512): string {
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (width <= maxDim && height <= maxDim) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  }
  if (width > height) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

/**
 * Pipeline B: Crop ROI based on Animal Detection Bounding Box + 12% padding.
 */
function cropRoiToCanvas(
  img: HTMLImageElement,
  bbox: [number, number, number, number],
  maxDim = 512
): { roiDataUrl: string; roiW: number; roiH: number } {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;
  const [ymin, xmin, ymax, xmax] = bbox;

  // Add 12% margin around the animal to avoid clipping ears, tail, or paws
  const bw = xmax - xmin;
  const bh = ymax - ymin;
  const padX = Math.round(bw * 0.12);
  const padY = Math.round(bh * 0.12);

  const normYmin = Math.max(0, ymin - padY);
  const normXmin = Math.max(0, xmin - padX);
  const normYmax = Math.min(1000, ymax + padY);
  const normXmax = Math.min(1000, xmax + padX);

  const cropX = Math.round((normXmin / 1000) * origW);
  const cropY = Math.round((normYmin / 1000) * origH);
  const cropW = Math.max(10, Math.round(((normXmax - normXmin) / 1000) * origW));
  const cropH = Math.max(10, Math.round(((normYmax - normYmin) / 1000) * origH));

  const scale = Math.min(maxDim / cropW, maxDim / cropH);
  const targetW = Math.round(cropW * scale);
  const targetH = Math.round(cropH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { roiDataUrl: img.src, roiW: targetW, roiH: targetH };
  }

  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
  return { roiDataUrl: canvas.toDataURL('image/png'), roiW: targetW, roiH: targetH };
}

/**
 * High-precision neural background removal:
 * Pipeline B: Animal Detection ROI -> ISNet FP16 -> Mask Refinement
 */
async function executeCutout(
  src: string,
  mode: CutoutMode,
  cacheKey: string,
  bbox?: [number, number, number, number]
): Promise<{ url: string; isSilhouette: boolean }> {
  // If already transparent PNG or dataUrl, return as-is immediately (0ms)
  if (isTransparentOrCutout(src)) {
    processedCache.set(cacheKey, src);
    processedCache.set(`auto:${src}`, src);
    processedCache.set(`studio:${src}`, src);
    processedCache.set(src, src);
    return { url: src, isSilhouette: false };
  }

  if (mode === 'auto' || mode === 'studio') {
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const img = await loadImage(src);

      let inputDataUrl: string;
      let targetW: number;
      let targetH: number;

      // Pipeline B: Use animal detection bounding box ROI if available
      if (bbox && bbox.length === 4 && bbox[2] > bbox[0] && bbox[3] > bbox[1]) {
        const cropped = cropRoiToCanvas(img, bbox, 512);
        inputDataUrl = cropped.roiDataUrl;
        targetW = cropped.roiW;
        targetH = cropped.roiH;
      } else {
        inputDataUrl = getDownscaledDataUrl(img, 512);
        targetW = img.naturalWidth || 512;
        targetH = img.naturalHeight || 512;
      }

      // 1. Neural Segmentation with ISNet (quint8: fast & lightweight 42MB)
      const blob = await removeBackground(inputDataUrl, {
        model: 'isnet_quint8',
        debug: false,
        rescale: true,
      });

      const rawCutoutUrl = await blobToDataUrl(blob);

      // 2. Mask Refinement: Disconnected Component Cleanup
      const cutoutImg = await loadImage(rawCutoutUrl);
      const refineCanvas = document.createElement('canvas');
      refineCanvas.width = cutoutImg.naturalWidth || targetW;
      refineCanvas.height = cutoutImg.naturalHeight || targetH;
      const rCtx = refineCanvas.getContext('2d');

      let finalUrl = rawCutoutUrl;
      if (rCtx) {
        rCtx.drawImage(cutoutImg, 0, 0);
        refineMaskIslands(rCtx, refineCanvas.width, refineCanvas.height, 80);
        finalUrl = refineCanvas.toDataURL('image/png');
      }

      processedCache.set(cacheKey, finalUrl);
      processedCache.set(`auto:${src}`, finalUrl);
      processedCache.set(`studio:${src}`, finalUrl);
      processedCache.set(src, finalUrl);
      processedCache.set(finalUrl, finalUrl);

      // Persist transparent PNG to IndexedDB so page reload (F5) is instant (0ms)
      void setPersistentCutout(src, finalUrl);
      void setPersistentCutout(cacheKey, finalUrl);
      return { url: finalUrl, isSilhouette: false };
    } catch (aiErr) {
      console.warn(
        '[CroppedPetCutout] AI background removal fallback to ROI crop:',
        aiErr
      );
      try {
        const img = await loadImage(src);
        const roiUrl =
          bbox && bbox.length === 4
            ? cropRoiToCanvas(img, bbox, 512).roiDataUrl
            : getDownscaledDataUrl(img, 512);
        processedCache.set(cacheKey, roiUrl);
        processedCache.set(src, roiUrl);
        void setPersistentCutout(src, roiUrl);
        void setPersistentCutout(cacheKey, roiUrl);
        return { url: roiUrl, isSilhouette: false };
      } catch {
        return { url: src, isSilhouette: false };
      }
    }
  }

  return { url: src, isSilhouette: false };
}

export async function processCutoutImage(
  src: string,
  mode: CutoutMode,
  bbox?: [number, number, number, number]
): Promise<{ url: string; isSilhouette: boolean }> {
  if (mode === 'silhouette') {
    return { url: src, isSilhouette: true };
  }

  const cacheKey = bbox ? `${mode}:${src}:${bbox.join(',')}` : `${mode}:${src}`;
  const cached =
    processedCache.get(src) ||
    processedCache.get(cacheKey) ||
    processedCache.get(`auto:${src}`) ||
    processedCache.get(`studio:${src}`);
  if (cached) {
    return { url: cached, isSilhouette: false };
  }

  // Check persistent IndexedDB cache (fast 2ms lookup) before computing
  const persisted =
    (await getPersistentCutout(cacheKey)) || (await getPersistentCutout(src));
  if (persisted) {
    processedCache.set(src, persisted);
    processedCache.set(cacheKey, persisted);
    processedCache.set(`auto:${src}`, persisted);
    processedCache.set(`studio:${src}`, persisted);
    return { url: persisted, isSilhouette: false };
  }

  const existing = inFlightRequests.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = executeCutout(src, mode, cacheKey, bbox).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, request);
  return request;
}

// Pre-register instant transparent PNG cutouts for starter & neighbor pets (0ms load)
const PRELOADED_CUTOUTS: Record<string, string> = {
  '/src/assets/images/cropped_calico_cat_1794637541476.jpg':
    '/src/assets/images/cropped_calico_cat_1794637541476.png',
  '/src/assets/images/cropped_calico_cat_1794637541476.png':
    '/src/assets/images/cropped_calico_cat_1794637541476.png',
  '/src/assets/images/cropped_golden_dog_1794637542709.jpg':
    '/src/assets/images/cropped_golden_dog_1794637542709.png',
  '/src/assets/images/cropped_golden_dog_1794637542709.png':
    '/src/assets/images/cropped_golden_dog_1794637542709.png',
  '/src/assets/images/cropped_fluffy_bunny_1794637542800.jpg':
    '/src/assets/images/cropped_fluffy_bunny_1794637542800.png',
  '/src/assets/images/cropped_fluffy_bunny_1794637542800.png':
    '/src/assets/images/cropped_fluffy_bunny_1794637542800.png',
  '/src/assets/images/neighbor_ragdoll_cat_1794722671151.jpg':
    '/src/assets/images/neighbor_ragdoll_cat_1794722671151.png',
  '/src/assets/images/neighbor_ragdoll_cat_1794722671151.png':
    '/src/assets/images/neighbor_ragdoll_cat_1794722671151.png',
  '/src/assets/images/neighbor_samoyed_pup_1794722672155.jpg':
    '/src/assets/images/neighbor_samoyed_pup_1794722672155.png',
  '/src/assets/images/neighbor_samoyed_pup_1794722672155.png':
    '/src/assets/images/neighbor_samoyed_pup_1794722672155.png',
  '/src/assets/images/neighbor_shiba_dog_1794722670611.jpg':
    '/src/assets/images/neighbor_shiba_dog_1794722670611.png',
  '/src/assets/images/neighbor_shiba_dog_1794722670611.png':
    '/src/assets/images/neighbor_shiba_dog_1794722670611.png',
};

for (const [src, pngPath] of Object.entries(PRELOADED_CUTOUTS)) {
  processedCache.set(src, pngPath);
  processedCache.set(`studio:${src}`, pngPath);
  processedCache.set(`auto:${src}`, pngPath);
  const publicPath = src.replace(/^\/src/, '');
  const publicPng = pngPath.replace(/^\/src/, '');
  processedCache.set(publicPath, publicPng);
  processedCache.set(`studio:${publicPath}`, publicPng);
  processedCache.set(`auto:${publicPath}`, publicPng);
}

interface CroppedPetCutoutProps {
  photoUrl: string;
  alt: string;
  species?: string;
  mode?: CutoutMode;
  accessory?: string | null;
  flip?: boolean;
  className?: string;
  bbox?: [number, number, number, number];
}

const SPECIES_SILHOUETTES: Record<string, string> = {
  Bunny:
    'M100 70 C104 55 110 18 118 16 C124 16 126 38 122 68 C136 78 148 95 150 118 C152 142 146 168 140 180 C130 188 116 188 100 188 C84 188 70 188 60 180 C54 168 48 142 50 118 C52 95 64 78 78 68 C74 38 76 16 82 16 C90 18 96 55 100 70 Z',
  Cat:
    'M100 50 C106 38 116 22 126 22 C129 28 126 44 122 56 C136 64 146 76 148 94 C152 115 146 145 144 172 C135 186 118 188 100 188 C82 188 65 186 56 172 C54 145 48 115 52 94 C54 76 64 64 78 56 C74 44 71 28 74 22 C84 22 94 38 100 50 Z',
  Kitten:
    'M100 50 C106 38 116 22 126 22 C129 28 126 44 122 56 C136 64 146 76 148 94 C152 115 146 145 144 172 C135 186 118 188 100 188 C82 188 65 186 56 172 C54 145 48 115 52 94 C54 76 64 64 78 56 C74 44 71 28 74 22 C84 22 94 38 100 50 Z',
  Bird:
    'M100 32 C116 32 134 42 148 50 C136 60 134 72 136 88 C144 105 146 130 138 162 C130 184 115 190 100 186 C85 182 74 165 72 140 C68 110 72 82 76 60 C80 44 88 32 100 32 Z',
  Hamster:
    'M100 48 C110 46 118 36 124 38 C128 44 124 52 120 58 C138 68 152 86 154 112 C156 142 148 174 136 184 C124 190 112 190 100 190 C88 190 76 190 64 184 C52 174 44 142 46 112 C48 86 62 68 80 58 C76 52 72 44 76 38 C82 36 90 46 100 48 Z',
  Dog:
    'M100 28 C128 28 144 44 148 68 C156 78 154 96 142 102 C145 125 154 150 144 174 C135 186 118 188 100 188 C82 188 65 186 56 174 C46 150 55 125 58 102 C46 96 44 78 52 68 C56 44 72 28 100 28 Z',
  Puppy:
    'M100 28 C128 28 144 44 148 68 C156 78 154 96 142 102 C145 125 154 150 144 174 C135 186 118 188 100 188 C82 188 65 186 56 174 C46 150 55 125 58 102 C46 96 44 78 52 68 C56 44 72 28 100 28 Z',
};

const DEFAULT_SILHOUETTE =
  'M100 28 C128 28 144 44 148 68 C156 78 154 96 142 102 C145 125 154 150 144 174 C135 186 118 188 100 188 C82 188 65 186 56 174 C46 150 55 125 58 102 C46 96 44 78 52 68 C56 44 72 28 100 28 Z';

export const CroppedPetCutout: React.FC<CroppedPetCutoutProps> = ({
  photoUrl,
  alt,
  species,
  mode = 'auto',
  accessory,
  flip = false,
  className = 'w-[84px] h-[84px]',
  bbox,
}) => {
  const [cutout, setCutout] = useState<{ url: string; isSilhouette: boolean }>(() => {
    if (isTransparentOrCutout(photoUrl)) {
      const cached =
        processedCache.get(photoUrl) ||
        processedCache.get(`${mode}:${photoUrl}`) ||
        processedCache.get(`auto:${photoUrl}`) ||
        processedCache.get(`studio:${photoUrl}`) ||
        photoUrl;
      return { url: cached, isSilhouette: false };
    }
    const cached =
      processedCache.get(photoUrl) ||
      processedCache.get(`${mode}:${photoUrl}`) ||
      processedCache.get(`auto:${photoUrl}`) ||
      processedCache.get(`studio:${photoUrl}`);
    if (cached) {
      return { url: cached, isSilhouette: false };
    }
    return {
      url: photoUrl,
      isSilhouette: true,
    };
  });

  useEffect(() => {
    let active = true;
    if (isTransparentOrCutout(photoUrl)) {
      const cached =
        processedCache.get(photoUrl) ||
        processedCache.get(`${mode}:${photoUrl}`) ||
        processedCache.get(`auto:${photoUrl}`) ||
        processedCache.get(`studio:${photoUrl}`) ||
        photoUrl;
      setCutout({ url: cached, isSilhouette: false });
      return;
    }
    const cached =
      processedCache.get(photoUrl) ||
      processedCache.get(`${mode}:${photoUrl}`) ||
      processedCache.get(`auto:${photoUrl}`) ||
      processedCache.get(`studio:${photoUrl}`);
    if (cached) {
      setCutout({ url: cached, isSilhouette: false });
      return;
    }

    const cacheKey = bbox ? `${mode}:${photoUrl}:${bbox.join(',')}` : `${mode}:${photoUrl}`;

    // 1. First check persistent IndexedDB cache (2-5ms) to avoid re-running ISNet on page refresh
    void Promise.all([
      getPersistentCutout(cacheKey),
      getPersistentCutout(photoUrl),
    ]).then(([persistedKey, persistedSrc]) => {
      if (!active) return;
      const hit = persistedKey || persistedSrc;
      if (hit) {
        processedCache.set(photoUrl, hit);
        processedCache.set(cacheKey, hit);
        processedCache.set(`auto:${photoUrl}`, hit);
        processedCache.set(`studio:${photoUrl}`, hit);
        setCutout({ url: hit, isSilhouette: false });
        return;
      }

      // 2. If IndexedDB cache miss, run AI Pipeline B
      void processCutoutImage(photoUrl, mode, bbox).then((res) => {
        if (active) setCutout(res);
      });
    });

    return () => {
      active = false;
    };
  }, [photoUrl, mode, bbox]);

  const accessoriesMap: Record<string, string> = {
    'item-bell': '🔔',
    'item-ribbon': '🎀',
    'item-flower': '🌸',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <img
        src={cutout.url}
        alt={alt}
        className={`w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] pointer-events-none transition-all duration-300 ${
          cutout.isSilhouette ? 'opacity-70 animate-pulse scale-95' : 'opacity-100 scale-100'
        }`}
        loading="eager"
        decoding="async"
      />

      {accessory && accessoriesMap[accessory] && (
        <span
          className="absolute -top-1 -right-1 text-base pointer-events-none select-none drop-shadow"
          style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
        >
          {accessoriesMap[accessory]}
        </span>
      )}
    </div>
  );
};
