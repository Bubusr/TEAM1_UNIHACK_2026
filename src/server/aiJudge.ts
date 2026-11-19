import crypto from 'node:crypto';
import { GoogleGenAI, Type } from '@google/genai';
import {
  aiJudgeSchema,
  calculateJudgeOutcome,
  type ServerComputedJudgeOutcome,
} from './rewards.ts';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export interface ValidatedImagePayload {
  buffer: Buffer;
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sha256: string;
  byteSize: number;
}

function detectMagicMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function badUploadError(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 400;
  return err;
}

export function validateImageUpload(
  imageBase64: string,
  declaredMimeType: string
): ValidatedImagePayload {
  const normalizedMime = declaredMimeType.trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
    throw badUploadError('Only JPEG, PNG, and WEBP pet photos are supported.');
  }

  const cleanBase64 = imageBase64.replace(/\s+/g, '');
  if (!cleanBase64 || !/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw badUploadError('Invalid base64 image payload.');
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw badUploadError('Image must be smaller than 8 MB.');
  }

  const detectedMime = detectMagicMime(buffer);
  if (!detectedMime || detectedMime !== normalizedMime) {
    throw badUploadError(
      'Image file signature does not match a valid JPEG, PNG, or WEBP photo.'
    );
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  return {
    buffer,
    base64: cleanBase64,
    mimeType: detectedMime as 'image/jpeg' | 'image/png' | 'image/webp',
    sha256,
    byteSize: buffer.length,
  };
}

export const GEMINI_REQUEST_TIMEOUT_MS = 25000; // 25s per candidate model call
export const GEMINI_MAX_ATTEMPTS = 1; // Disables uncontrolled internal SDK retries

export async function analyzePetPhotoWithGemini(params: {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  theme: string;
}): Promise<ServerComputedJudgeOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured in Settings > Secrets.'
    );
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: GEMINI_REQUEST_TIMEOUT_MS,
      retryOptions: {
        attempts: GEMINI_MAX_ATTEMPTS,
      },
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-4-hydrogen'];
  let lastError: unknown = null;
  let rawText = '';

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: params.mimeType,
                data: params.base64,
              },
            },
            {
              text: `You are the visual evaluator in a pet sanctuary photo game.
Analyze this image strictly and honestly.
1. Set isAnimal to true ONLY if the image clearly features a real animal or pet (not a blank screenshot, meme text card, human-only photo, UI screenshot, or random object).
2. Set confidence (0-100) for how sure you are that this is a genuine animal photograph.
3. Score sharp (0-100), light (0-100), and themeScore (0-100) against today's theme: "${params.theme}".
4. Set themeMatch boolean.
5. Provide species (1 word like Dog, Cat, Bunny, Corgi, Bird, Hamster), pose (1 word like Playful, Cozy, Curious, Happy, Sleepy), and a cute 1-word petName.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isAnimal: { type: Type.BOOLEAN },
              confidence: { type: Type.INTEGER },
              sharp: { type: Type.INTEGER },
              light: { type: Type.INTEGER },
              themeScore: { type: Type.INTEGER },
              themeMatch: { type: Type.BOOLEAN },
              species: { type: Type.STRING },
              pose: { type: Type.STRING },
              petName: { type: Type.STRING },
            },
            required: [
              'isAnimal',
              'confidence',
              'sharp',
              'light',
              'themeScore',
              'themeMatch',
              'species',
              'pose',
              'petName',
            ],
          },
        },
      });

      rawText = (response.text ?? '').trim();
      if (rawText) {
        lastError = null;
        break;
      }
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTemporary =
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('overloaded') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('timeout') ||
        msg.includes('timed out') ||
        msg.includes('DEADLINE_EXCEEDED') ||
        msg.includes('Deadline expired') ||
        msg.includes('deadline') ||
        msg.includes('aborted');
      if (!isTemporary) {
        break;
      }
    }
  }

  if (!rawText && lastError) {
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    if (
      msg.includes('503') ||
      msg.includes('429') ||
      msg.includes('high demand') ||
      msg.includes('UNAVAILABLE') ||
      msg.includes('overloaded') ||
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('DEADLINE_EXCEEDED') ||
      msg.includes('Deadline expired') ||
      msg.includes('deadline') ||
      msg.includes('aborted')
    ) {
      const friendlyErr = new Error(
        'Google Gemini AI is currently experiencing high demand or request deadline expired. Please wait a moment and snap again!'
      );
      (friendlyErr as Error & { statusCode?: number }).statusCode = 503;
      throw friendlyErr;
    }
    throw lastError;
  }
  if (!rawText) {
    throw new Error('AI Judge returned an empty response. Please retry.');
  }

  let jsonParsed: unknown;
  try {
    jsonParsed = JSON.parse(rawText);
  } catch {
    throw new Error('AI Judge returned malformed JSON. Please retry.');
  }

  const parsed = aiJudgeSchema.safeParse(jsonParsed);
  if (!parsed.success) {
    throw new Error('AI Judge output failed validation. Please retry.');
  }

  return calculateJudgeOutcome(parsed.data);
}
