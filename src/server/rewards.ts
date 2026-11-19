import { z } from 'zod';
import { MINT_ELIGIBILITY_RULES } from '../shared/gameMeta.ts';
import type { PetSpecies } from '../types.ts';

export const aiJudgeSchema = z.object({
  isAnimal: z.boolean(),
  confidence: z.number().int().min(0).max(100),
  sharp: z.number().int().min(0).max(100),
  light: z.number().int().min(0).max(100),
  themeScore: z.number().int().min(0).max(100),
  themeMatch: z.boolean(),
  species: z.string().trim().min(1).max(24),
  pose: z.string().trim().min(1).max(24),
  petName: z.string().trim().min(1).max(24),
  box_2d: z.array(z.number()).length(4).optional(),
});

export type ValidatedAiEvaluation = z.infer<typeof aiJudgeSchema>;

export interface ServerComputedJudgeOutcome {
  isAnimal: boolean;
  confidence: number;
  overallScore: number;
  verdict: string;
  tierLabel: string;
  sharp: number;
  light: number;
  species: string;
  pose: string;
  themeScore: number;
  themeMatch: boolean;
  petName: string;
  coinsReward: number;
  expReward: number;
  box_2d?: [number, number, number, number];
}

export function sanitizeOneWord(input: string, fallback: string): string {
  if (!input || typeof input !== 'string') return fallback;
  // 1. Strip script and style blocks along with their contents
  let cleaned = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ' '
  );
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ' '
  );
  // 2. Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // 3. Strip HTML entity encodings
  cleaned = cleaned.replace(/&(?:[a-z\d]+|#\d+|#x[a-f\d]+);/gi, ' ');
  // 4. Strip inline event handlers and pseudo-protocols
  cleaned = cleaned.replace(/\bon\w+\s*=/gi, ' ');
  cleaned = cleaned.replace(/\b(?:javascript|vbscript|data):/gi, ' ');
  // 5. Allow Unicode letters, numbers, hyphens, underscores, and spaces
  cleaned = cleaned.replace(/[^\p{L}\p{N} _-]/gu, ' ').trim();
  const first = cleaned.split(/\s+/).find((token) => token.length > 0);
  return first ? first.slice(0, 24) : fallback;
}

export function calculateJudgeOutcome(
  evalData: ValidatedAiEvaluation
): ServerComputedJudgeOutcome {
  const sharp = Math.max(0, Math.min(100, Math.round(evalData.sharp)));
  const light = Math.max(0, Math.min(100, Math.round(evalData.light)));
  const themeScore = Math.max(0, Math.min(100, Math.round(evalData.themeScore)));
  const confidence = Math.max(0, Math.min(100, Math.round(evalData.confidence)));
  const species = sanitizeOneWord(evalData.species, 'Pet');
  const pose = sanitizeOneWord(evalData.pose, 'Cozy');
  const petName = sanitizeOneWord(evalData.petName, 'Clover');

  let box_2d: [number, number, number, number] | undefined = undefined;
  if (Array.isArray(evalData.box_2d) && evalData.box_2d.length === 4) {
    const rawNums = evalData.box_2d.map((v) => Number(v) || 0);
    const maxVal = Math.max(...rawNums);
    const multiplier = maxVal <= 1.0 ? 1000 : maxVal <= 100.0 ? 10 : 1;
    const [ymin, xmin, ymax, xmax] = rawNums.map((v) =>
      Math.max(0, Math.min(1000, Math.round(v * multiplier)))
    );
    if (ymax > ymin + 30 && xmax > xmin + 30) {
      box_2d = [ymin, xmin, ymax, xmax];
    }
  }

  if (!evalData.isAnimal || confidence < 60) {
    return {
      isAnimal: false,
      confidence,
      overallScore: Math.min(35, Math.round((sharp + light) / 4)),
      verdict: 'NO PET FOUND',
      tierLabel: 'Snap a Real Pet!',
      sharp,
      light,
      species,
      pose,
      themeScore: 0,
      themeMatch: false,
      petName,
      coinsReward: 0,
      expReward: 0,
      box_2d,
    };
  }

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(sharp * 0.35 + light * 0.3 + themeScore * 0.35)
    )
  );

  if (overallScore >= 80) {
    return {
      isAnimal: true,
      confidence,
      overallScore,
      verdict: 'EXCELLENT!',
      tierLabel: '80+ Tier: New Pet Unlocked!',
      sharp,
      light,
      species,
      pose,
      themeScore,
      themeMatch: evalData.themeMatch && themeScore >= 70,
      petName,
      coinsReward: 150,
      expReward: 50,
      box_2d,
    };
  }

  if (overallScore >= 60) {
    return {
      isAnimal: true,
      confidence,
      overallScore,
      verdict: 'SWEET SNAP!',
      tierLabel: '60+ Tier: Fence Renewed!',
      sharp,
      light,
      species,
      pose,
      themeScore,
      themeMatch: evalData.themeMatch && themeScore >= 60,
      petName,
      coinsReward: 75,
      expReward: 25,
      box_2d,
    };
  }

  return {
    isAnimal: true,
    confidence,
    overallScore,
    verdict: 'TRY AGAIN!',
    tierLabel: 'Keep Snapping!',
    sharp,
    light,
    species,
    pose,
    themeScore,
    themeMatch: false,
    petName,
    coinsReward: 20,
    expReward: 10,
    box_2d,
  };
}

export function computeMintEligibility(pet: {
  discoveryScore: number;
  bondXp: number;
  mintStatus: string;
}) {
  const scoreMet = pet.discoveryScore >= MINT_ELIGIBILITY_RULES.MIN_SCORE;
  const bondMet = pet.bondXp >= MINT_ELIGIBILITY_RULES.MIN_BOND_XP;
  const alreadyMinted = pet.mintStatus === 'minted';
  return {
    scoreMet,
    bondMet,
    alreadyMinted,
    notAlreadyMinted: !alreadyMinted,
    eligible: scoreMet && bondMet && !alreadyMinted,
    minScore: MINT_ELIGIBILITY_RULES.MIN_SCORE,
    minBondXp: MINT_ELIGIBILITY_RULES.MIN_BOND_XP,
    currentScore: pet.discoveryScore,
    currentBondXp: pet.bondXp,
  };
}

export function mapSpecies(speciesText: string): PetSpecies {
  const s = speciesText.toLowerCase();
  if (s.includes('cat') || s.includes('kitten')) return 'cat';
  if (s.includes('bun') || s.includes('rabbit')) return 'bunny';
  if (s.includes('corgi')) return 'corgi';
  if (s.includes('shiba')) return 'shiba';
  if (s.includes('samoyed')) return 'samoyed';
  return 'dog';
}

export function applyExpGain(
  currentLevel: number,
  currentExpPercent: number,
  gain: number
): { level: number; expPercent: number } {
  let level = currentLevel;
  let exp = currentExpPercent + Math.max(0, Math.round(gain));
  while (exp >= 100) {
    level += 1;
    exp -= 100;
  }
  return { level, expPercent: exp };
}
