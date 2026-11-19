import React, { useEffect, useId, useState } from 'react';
import { CutoutMode } from '../types';

const processedCache = new Map<string, string>();

/**
 * Checks if image corners share a uniform light studio background and, if so,
 * edge flood-fills transparent alpha so the real photographed pet sits cleanly on grass.
 */
async function processCutoutImage(
  src: string,
  mode: CutoutMode
): Promise<{ url: string; isSilhouette: boolean }> {
  if (mode === 'silhouette') {
    return { url: src, isSilhouette: true };
  }

  const cacheKey = `${mode}:${src}`;
  const cached = processedCache.get(cacheKey);
  if (cached) {
    return { url: cached, isSilhouette: false };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve({ url: src, isSilhouette: true });
          return;
        }

        // Cover-draw centered square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Sample 4 corners to verify uniform studio backdrop
        const cornerCoords = [
          [2, 2],
          [size - 3, 2],
          [2, size - 3],
          [size - 3, size - 3],
        ];
        let avgR = 0;
        let avgG = 0;
        let avgB = 0;
        for (const [cx, cy] of cornerCoords) {
          const i = (cy * size + cx) * 4;
          avgR += data[i];
          avgG += data[i + 1];
          avgB += data[i + 2];
        }
        avgR /= 4;
        avgG /= 4;
        avgB /= 4;

        let maxCornerSpread = 0;
        for (const [cx, cy] of cornerCoords) {
          const i = (cy * size + cx) * 4;
          const d =
            Math.abs(data[i] - avgR) +
            Math.abs(data[i + 1] - avgG) +
            Math.abs(data[i + 2] - avgB);
          if (d > maxCornerSpread) maxCornerSpread = d;
        }

        const isUniformLight =
          avgR > 215 && avgG > 215 && avgB > 215 && maxCornerSpread < 65;

        if (mode === 'auto' && !isUniformLight) {
          resolve({ url: src, isSilhouette: true });
          return;
        }

        // Edge BFS flood-fill to remove connected studio background cleanly
        const total = size * size;
        const visited = new Uint8Array(total);
        const isBg = new Uint8Array(total);
        const queue = new Int32Array(total);
        let head = 0;
        let tail = 0;

        const threshold = 24;
        const softEdge = 36;

        const matchesBg = (idx: number) => {
          const p = idx * 4;
          const dr = data[p] - avgR;
          const dg = data[p + 1] - avgG;
          const db = data[p + 2] - avgB;
          return Math.sqrt(dr * dr + dg * dg + db * db);
        };

        const enqueue = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= size || y >= size) return;
          const idx = y * size + x;
          if (visited[idx]) return;
          visited[idx] = 1;
          const dist = matchesBg(idx);
          if (dist <= threshold) {
            isBg[idx] = 1;
            queue[tail++] = idx;
          }
        };

        for (let x = 0; x < size; x++) {
          enqueue(x, 0);
          enqueue(x, size - 1);
        }
        for (let y = 0; y < size; y++) {
          enqueue(0, y);
          enqueue(size - 1, y);
        }

        while (head < tail) {
          const cur = queue[head++];
          const cx = cur % size;
          const cy = (cur - cx) / size;
          enqueue(cx + 1, cy);
          enqueue(cx - 1, cy);
          enqueue(cx, cy + 1);
          enqueue(cx, cy - 1);
        }

        // Apply transparency + subtle bottom floor shadow fade + edge feathering
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const idx = y * size + x;
            const p = idx * 4;
            if (isBg[idx]) {
              data[p + 3] = 0;
            } else {
              // Feather immediate border pixels slightly for smooth cutout edges
              const dist = matchesBg(idx);
              const touchesBg =
                (x > 0 && isBg[idx - 1]) ||
                (x < size - 1 && isBg[idx + 1]) ||
                (y > 0 && isBg[idx - size]) ||
                (y < size - 1 && isBg[idx + size]);
              if (touchesBg && dist < softEdge) {
                data[p + 3] = Math.round(
                  255 * Math.min(1, Math.max(0.25, (dist - 10) / softEdge))
                );
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const resultUrl = canvas.toDataURL('image/png');
        processedCache.set(cacheKey, resultUrl);
        resolve({ url: resultUrl, isSilhouette: false });
      } catch {
        resolve({ url: src, isSilhouette: mode !== 'studio' });
      }
    };
    img.onerror = () => resolve({ url: src, isSilhouette: true });
    img.src = src;
  });
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
  const [cutout, setCutout] = useState<{ url: string; isSilhouette: boolean }>({
    url: photoUrl,
    isSilhouette: mode === 'silhouette',
  });

  const silhouettePath = (species && SPECIES_SILHOUETTES[species]) || DEFAULT_SILHOUETTE;

  useEffect(() => {
    let active = true;
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
          className="w-full h-full overflow-visible"
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
        /* Transparent background studio cutout with crisp sticker outline */
        <img
          src={cutout.url}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain pointer-events-none"
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
