import React, { useEffect, useId, useState } from 'react';
import { CutoutMode } from '../types';

export const processedCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<{ url: string; isSilhouette: boolean }>>();

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function isTransparentOrCutout(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/png')) return true;
  if (url.endsWith('.png')) return true;
  if (processedCache.has(url)) return true;
  return false;
}

// Pre-warm ISNet background removal model in browser background
if (typeof window !== 'undefined') {
  void import('@imgly/background-removal')
    .then(({ preload }) => {
      void preload({ model: 'isnet_fp16' }).catch(() => {});
    })
    .catch(() => {});
}

/**
 * Downscale image to max 512px PNG before feeding to AI model.
 * 512x512 matches ISNet's native neural architecture for crisp edges
 * without JPEG compression block artifacts around fur, paws, and snouts.
 */
function getDownscaledDataUrl(src: string, maxDim = 512): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width <= maxDim && height <= maxDim) {
          resolve(src);
          return;
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
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}



/**
 * High-precision neural background removal (@imgly/background-removal)
 * using ISNet FP16 across all animal photos (dogs, cats, bunnies).
 * Starter & neighbor pets are pre-loaded directly as transparent PNGs (0ms).
 */
async function executeCutout(
  src: string,
  mode: CutoutMode,
  cacheKey: string
): Promise<{ url: string; isSilhouette: boolean }> {
  // If already transparent PNG or dataUrl, return as-is immediately (0ms)
  if (isTransparentOrCutout(src)) {
    processedCache.set(cacheKey, src);
    processedCache.set(`auto:${src}`, src);
    processedCache.set(`studio:${src}`, src);
    processedCache.set(src, src);
    return { url: src, isSilhouette: false };
  }

  // Real AI Segmentation Model (@imgly/background-removal) for pet photos
  if (mode === 'auto' || mode === 'studio') {
    try {
      const inputSrc = await getDownscaledDataUrl(src, 512);

      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(inputSrc, {
        model: 'isnet_fp16',
        debug: false,
        rescale: true,
      });
      const resultUrl = await blobToDataUrl(blob);
      processedCache.set(cacheKey, resultUrl);
      processedCache.set(`auto:${src}`, resultUrl);
      processedCache.set(`studio:${src}`, resultUrl);
      processedCache.set(src, resultUrl);
      processedCache.set(resultUrl, resultUrl);
      return { url: resultUrl, isSilhouette: false };
    } catch (aiErr) {
      console.warn(
        '[CroppedPetCutout] AI background removal model fallback:',
        aiErr
      );
    }
  }

  // Fallback to species sticker silhouette ONLY if explicitly mode === 'silhouette'
  return { url: src, isSilhouette: mode === 'silhouette' };
}

export function processCutoutImage(
  src: string,
  mode: CutoutMode
): Promise<{ url: string; isSilhouette: boolean }> {
  if (mode === 'silhouette') {
    return Promise.resolve({ url: src, isSilhouette: true });
  }

  const cacheKey = `${mode}:${src}`;
  const cached =
    processedCache.get(src) ||
    processedCache.get(cacheKey) ||
    processedCache.get(`auto:${src}`) ||
    processedCache.get(`studio:${src}`);
  if (cached) {
    return Promise.resolve({ url: cached, isSilhouette: false });
  }

  const existing = inFlightRequests.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = executeCutout(src, mode, cacheKey).finally(() => {
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
}) => {
  const clipId = useId().replace(/:/g, '');

  // Initialize with cached transparent cutout if available, OR clean sticker silhouette.
  // NEVER flashes raw rectangular un-cutout photo on the garden grass!
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
      isSilhouette: mode === 'silhouette',
    };
  });

  const silhouettePath = (species && SPECIES_SILHOUETTES[species]) || DEFAULT_SILHOUETTE;

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
    processCutoutImage(photoUrl, mode).then((res) => {
      if (active) setCutout(res);
    });
    return () => {
      active = false;
    };
  }, [photoUrl, mode]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft Grass Contact Shadow */}
      <div
        aria-hidden="true"
        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[58%] h-2.5 rounded-full bg-[#69B558]/40 blur-[1px]"
      />

      {cutout.isSilhouette ? (
        /* Scissor-cropped organic silhouette matching the Polaroid cut-line */
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible transition-opacity duration-300"
          style={{
            transform: flip ? 'scaleX(-1)' : undefined,
            filter:
              'drop-shadow(0 0 2px #FFFDF9) drop-shadow(0 0 1px #FFFDF9) drop-shadow(0 3px 4px rgba(75,60,70,0.22))',
          }}
        >
          <defs>
            <clipPath id={`pet-cut-${clipId}`}>
              <path d={silhouettePath} />
            </clipPath>
          </defs>
          <image
            href={cutout.url}
            x="0"
            y="0"
            width="200"
            height="200"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#pet-cut-${clipId})`}
          />
          <path
            d={silhouettePath}
            fill="none"
            stroke="#FFFDF9"
            strokeWidth="5"
          />
        </svg>
      ) : (
        /* Transparent background cutout (Canvas or AI Model) with crisp sticker outline */
        <img
          src={cutout.url}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain pointer-events-none transition-opacity duration-300"
          style={{
            transform: flip ? 'scaleX(-1)' : undefined,
            filter:
              'drop-shadow(0 0 1.8px #FFFDF9) drop-shadow(0 0 1.8px #FFFDF9) drop-shadow(0 3px 4px rgba(75,60,70,0.22))',
          }}
        />
      )}

      {/* Optional Cosmetic Accessory Sticker on Pet's Head */}
      {accessory === 'straw-hat' && (
        <span
          aria-hidden="true"
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[22px] leading-none drop-shadow-sm pointer-events-none"
        >
          👒
        </span>
      )}
      {accessory === 'flower-crown' && (
        <span
          aria-hidden="true"
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[20px] leading-none drop-shadow-sm pointer-events-none"
        >
          🌸
        </span>
      )}
    </div>
  );
};
