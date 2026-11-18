import crypto from 'node:crypto';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { ethers } from 'ethers';
import { db } from '../db/index.ts';
import {
  firestorePerformPetCareAction,
  firestoreClaimFirstBondQuest,
  firestorePerformGeneralGameAction,
  firestoreMergeGuestIntoKeeper,
  firestoreRecordPhotoSubmission,
  firestoreAddSubmissionToSanctuary,
  firestoreAcquirePhotoReservation,
  firestoreCompletePhotoReservation,
  firestoreCommitPhotoSubmissionAndReservation,
  firestoreFailPhotoReservation,
  isTransientError,
} from '../db/firestoreStorage.ts';
import {
  adoptionOffers,
  careLogs,
  pets,
  photoSubmissions,
  users,
  wallets,
} from '../db/schema.ts';
import { FIRST_BOND_QUEST_REWARD, FOOD_META } from '../shared/gameMeta.ts';
import {
  DAILY_LIMIT_MAX,
  STARTER_BASELINE,
  getTodayUtcDate,
} from '../db/users.ts';
import type { CropPlot, CropType, FoodItemType, MarketListing, OrchardTree } from '../types.ts';
import { analyzePetPhotoWithGemini, validateImageUpload } from './aiJudge.ts';
import { applyExpGain, mapSpecies } from './rewards.ts';
import {
  PAWS_PASSPORT_ABI,
  confirmFujiAdoptionTransaction,
  getFujiProvider,
  getWeb3Status,
} from './web3Service.ts';

const SHOP_CATALOG: Record<
  string,
  { cost: number; kind: 'accessory' | 'energy' }
> = {
  'straw-hat': { cost: 400, kind: 'accessory' },
  'flower-crown': { cost: 550, kind: 'accessory' },
  'camera-film': { cost: 250, kind: 'energy' },
};

const TOY_CATALOG: Record<string, { cost: number; name: string; icon: string }> = {
  'toy-yarn': { cost: 120, name: 'Yarn Ball', icon: '🧶' },
  'toy-tennis': { cost: 150, name: 'Tennis Ball', icon: '🎾' },
  'toy-duck': { cost: 220, name: 'Plush Duck', icon: '🧸' },
};

const BUYER_NAMES = ['Maya', 'Leo', 'Hana'];

const NEIGHBOR_CATALOG: Record<
  string,
  {
    marketStock: Record<string, { item: FoodItemType; qty: number; price: number }>;
  }
> = {
  'neighbor-maya': {
    marketStock: {
      'm-1': { item: 'peach', qty: 2, price: 60 },
      'm-2': { item: 'berry', qty: 2, price: 70 },
      'm-3': { item: 'carrot', qty: 3, price: 65 },
    },
  },
  'neighbor-leo': {
    marketStock: {
      'l-1': { item: 'apple', qty: 2, price: 55 },
      'l-2': { item: 'wheat', qty: 4, price: 50 },
    },
  },
  'neighbor-hana': {
    marketStock: {
      'h-1': { item: 'catnip', qty: 1, price: 65 },
      'h-2': { item: 'berry', qty: 3, price: 95 },
    },
  },
};

export async function judgeAndRecordPhoto(params: {
  userId: number;
  uid?: string;
  imageBase64: string;
  mimeType: string;
  theme: string;
  analyzer?: typeof analyzePetPhotoWithGemini;
  leaseTtlMs?: number;
}) {
  const validatedImage = validateImageUpload(
    params.imageBase64,
    params.mimeType
  );
  const analyzeFn = params.analyzer || analyzePetPhotoWithGemini;

  if (!process.env.DATABASE_URL) {
    const scopeKey = 'u_' + (params.uid || String(params.userId));
    const reservation = await firestoreAcquirePhotoReservation({
      scopeKey,
      imageSha256: validatedImage.sha256,
      leaseTtlMs: params.leaseTtlMs,
    });

    if (reservation.status === 'ALREADY_COMPLETED') {
      const err = new Error(
        'This exact photo was already judged. Snap a fresh pet photo!'
      );
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    if (reservation.status === 'PROCESSING_ACTIVE') {
      const err = new Error(
        'This photo is currently being evaluated. Please wait.'
      );
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    if (reservation.status === 'RETRY_COOLDOWN') {
      const isPerm = reservation.errorType === 'PERMANENT';
      const err = new Error(
        isPerm
          ? reservation.lastError ||
            'No real pet or animal detected in this snapshot. Please upload a clear photo of an animal!'
          : `AI evaluation failed recently. Please wait ${reservation.waitSec}s before retrying this photo.`
      );
      (err as Error & { statusCode?: number }).statusCode = isPerm ? 422 : 429;
      throw err;
    }

    if (reservation.status === 'MAX_RETRIES_EXCEEDED') {
      const err = new Error(
        `Maximum evaluation attempts (${reservation.maxAttempts}) exceeded for this photo. Please snap a fresh pet photo!`
      );
      (err as Error & { statusCode?: number }).statusCode = 429;
      (err as any).code = 'MAX_RETRIES_EXCEEDED';
      throw err;
    }

    const submissionUid = reservation.submissionUid;
    try {
      const outcome = await analyzeFn({
        base64: validatedImage.base64,
        mimeType: validatedImage.mimeType,
        theme: params.theme || 'Fluffy Tails',
      });

      if (!outcome.isAnimal) {
        await firestoreFailPhotoReservation({
          scopeKey,
          imageSha256: validatedImage.sha256,
          submissionUid,
          error:
            'No real pet or animal detected in this snapshot. Please upload a clear photo of an animal!',
          errorType: 'PERMANENT',
        }).catch(() => {});
        const err = new Error(
          'No real pet or animal detected in this snapshot. Please upload a clear photo of an animal!'
        );
        (err as Error & { statusCode?: number }).statusCode = 422;
        throw err;
      }

      const dataUrl = `data:${validatedImage.mimeType};base64,${validatedImage.base64}`;

      const commitResult =
        await firestoreCommitPhotoSubmissionAndReservation({
          userId: params.userId,
          uid: params.uid || String(params.userId),
          scopeKey,
          submissionUid,
          imageSha256: validatedImage.sha256,
          mimeType: validatedImage.mimeType,
          byteSize: validatedImage.byteSize,
          photoUrl: dataUrl,
          theme: params.theme || 'Fluffy Tails',
          confidence: outcome.confidence,
          overallScore: outcome.overallScore,
          verdict: outcome.verdict,
          tierLabel: outcome.tierLabel,
          sharp: outcome.sharp,
          light: outcome.light,
          species: outcome.species,
          pose: outcome.pose,
          themeScore: outcome.themeScore,
          themeMatch: outcome.themeMatch,
          petName: outcome.petName,
          coinsReward: outcome.coinsReward,
          expReward: outcome.expReward,
        });

      if (!commitResult.success) {
        if (commitResult.reason === 'LEASE_SUPERSEDED') {
          const err = new Error(
            'Photo evaluation lease expired before completion. Please retry.'
          );
          (err as Error & { statusCode?: number }).statusCode = 409;
          throw err;
        }
        if (commitResult.reason === 'ALREADY_SUBMITTED') {
          const err = new Error(
            'This exact photo was already judged. Snap a fresh pet photo!'
          );
          (err as Error & { statusCode?: number }).statusCode = 409;
          throw err;
        }
      }

      return {
        id: submissionUid,
        submissionUid,
        photoUrl: dataUrl,
        theme: params.theme || 'Fluffy Tails',
        overallScore: outcome.overallScore,
        verdict: outcome.verdict,
        tierLabel: outcome.tierLabel,
        sharp: outcome.sharp,
        light: outcome.light,
        species: outcome.species,
        pose: outcome.pose,
        themeScore: outcome.themeScore,
        themeMatch: outcome.themeMatch,
        petName: outcome.petName,
        coinsReward: outcome.coinsReward,
        expReward: outcome.expReward,
        cropped: false,
        minted: false,
      };
    } catch (err) {
      const errorType = isTransientError(err) ? 'TRANSIENT' : 'PERMANENT';
      await firestoreFailPhotoReservation({
        scopeKey,
        imageSha256: validatedImage.sha256,
        submissionUid,
        error: err instanceof Error ? err.message : String(err),
        errorType,
      }).catch(() => {});
      throw err;
    }
  }

  try {
    // Duplicate image detection before calling Gemini
    const existing = await db
      .select({ id: photoSubmissions.id })
      .from(photoSubmissions)
      .where(
        and(
          eq(photoSubmissions.userId, params.userId),
          eq(photoSubmissions.imageSha256, validatedImage.sha256)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const err = new Error(
        'This exact photo was already judged. Snap a fresh pet photo!'
      );
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    const outcome = await analyzePetPhotoWithGemini({
      base64: validatedImage.base64,
      mimeType: validatedImage.mimeType,
      theme: params.theme || 'Fluffy Tails',
    });

    if (!outcome.isAnimal) {
      const err = new Error(
        'No real pet or animal detected in this snapshot. Please upload a clear photo of an animal!'
      );
      (err as Error & { statusCode?: number }).statusCode = 422;
      throw err;
    }

    const submissionUid = `sub-${crypto.randomUUID()}`;
    const dataUrl = `data:${validatedImage.mimeType};base64,${validatedImage.base64}`;

    const [created] = await db
      .insert(photoSubmissions)
      .values({
        submissionUid,
        userId: params.userId,
        imageSha256: validatedImage.sha256,
        mimeType: validatedImage.mimeType,
        byteSize: validatedImage.byteSize,
        photoUrl: dataUrl,
        theme: params.theme || 'Fluffy Tails',
        isAnimal: true,
        confidence: outcome.confidence,
        overallScore: outcome.overallScore,
        verdict: outcome.verdict,
        tierLabel: outcome.tierLabel,
        sharp: outcome.sharp,
        light: outcome.light,
        species: outcome.species,
        pose: outcome.pose,
        themeScore: outcome.themeScore,
        themeMatch: outcome.themeMatch,
        petName: outcome.petName,
        coinsReward: outcome.coinsReward,
        expReward: outcome.expReward,
        addedToGarden: false,
      })
      .returning();

    return {
      id: created.submissionUid,
      submissionUid: created.submissionUid,
      photoUrl: created.photoUrl,
      theme: created.theme,
      overallScore: created.overallScore,
      verdict: created.verdict,
      tierLabel: created.tierLabel,
      sharp: created.sharp,
      light: created.light,
      species: created.species,
      pose: created.pose,
      themeScore: created.themeScore,
      themeMatch: created.themeMatch,
      petName: created.petName,
      coinsReward: created.coinsReward,
      expReward: created.expReward,
      cropped: created.addedToGarden,
      minted: false,
    };
  } catch (error: any) {
    if (
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('password must be a string') ||
      error?.message?.includes('connect ECONNREFUSED')
    ) {
      const outcome = await analyzePetPhotoWithGemini({
        base64: validatedImage.base64,
        mimeType: validatedImage.mimeType,
        theme: params.theme || 'Fluffy Tails',
      });

      if (!outcome.isAnimal) {
        const err = new Error(
          'No real pet or animal detected in this snapshot. Please upload a clear photo of an animal!'
        );
        (err as Error & { statusCode?: number }).statusCode = 422;
        throw err;
      }

      const submissionUid = `sub-${crypto.randomUUID()}`;
      const dataUrl = `data:${validatedImage.mimeType};base64,${validatedImage.base64}`;

      await firestoreRecordPhotoSubmission({
        userId: params.userId,
        uid: params.uid || String(params.userId),
        submissionUid,
        imageSha256: validatedImage.sha256,
        mimeType: validatedImage.mimeType,
        byteSize: validatedImage.byteSize,
        photoUrl: dataUrl,
        theme: params.theme || 'Fluffy Tails',
        confidence: outcome.confidence,
        overallScore: outcome.overallScore,
        verdict: outcome.verdict,
        tierLabel: outcome.tierLabel,
        sharp: outcome.sharp,
        light: outcome.light,
        species: outcome.species,
        pose: outcome.pose,
        themeScore: outcome.themeScore,
        themeMatch: outcome.themeMatch,
        petName: outcome.petName,
        coinsReward: outcome.coinsReward,
        expReward: outcome.expReward,
      });

      return {
        id: submissionUid,
        submissionUid,
        photoUrl: dataUrl,
        theme: params.theme || 'Fluffy Tails',
        overallScore: outcome.overallScore,
        verdict: outcome.verdict,
        tierLabel: outcome.tierLabel,
        sharp: outcome.sharp,
        light: outcome.light,
        species: outcome.species,
        pose: outcome.pose,
        themeScore: outcome.themeScore,
        themeMatch: outcome.themeMatch,
        petName: outcome.petName,
        coinsReward: outcome.coinsReward,
        expReward: outcome.expReward,
        cropped: false,
        minted: false,
      };
    }
    throw error;
  }
}

export async function addSubmissionToSanctuary(params: {
  userId: number;
  uid: string;
  submissionUid: string;
  idempotencyKey: string;
}) {
  if (!process.env.DATABASE_URL) {
    return await firestoreAddSubmissionToSanctuary(params);
  }

  try {
    return await db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .for('update')
      .limit(1);
    if (!user) throw new Error('Keeper not found.');

    const dupLog = await tx
      .select()
      .from(careLogs)
      .where(
        and(
          eq(careLogs.userId, params.userId),
          eq(careLogs.idempotencyKey, params.idempotencyKey)
        )
      )
      .limit(1);

    if (dupLog.length > 0) {
      return dupLog[0].resultPayload ?? { alreadyProcessed: true };
    }

    const [submission] = await tx
      .select()
      .from(photoSubmissions)
      .where(
        and(
          eq(photoSubmissions.submissionUid, params.submissionUid),
          eq(photoSubmissions.userId, params.userId)
        )
      )
      .for('update')
      .limit(1);

    if (!submission) {
      throw new Error('Photo submission not found.');
    }
    if (!submission.isAnimal) {
      throw new Error('Only validated animal snapshots can join the garden.');
    }
    if (submission.addedToGarden) {
      return { alreadyAdded: true, petUid: submission.petUid };
    }

    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, params.userId))
      .limit(1);

    const expNext = applyExpGain(
      user.level,
      user.expPercent,
      Math.round(submission.expReward / 2)
    );

    const petUid = `pet-${crypto.randomUUID()}`;
    const [newPet] = await tx
      .insert(pets)
      .values({
        petUid,
        originalDiscovererId: params.userId,
        originalDiscovererUid: params.uid,
        originalDiscovererWallet: wallet?.address ?? null,
        currentOwnerId: params.userId,
        name: submission.petName,
        species: mapSpecies(submission.species),
        pose: submission.pose,
        photoUrl: submission.photoUrl,
        cutoutMode: 'auto',
        posX: 48,
        posY: 52,
        flip: false,
        discoveryScore: submission.overallScore,
        bondXp: 15,
        careCount: 0,
        questPetDone: false,
        questFeedDone: false,
        questPlayDone: false,
        memories: [
          {
            id: `mem-disc-${Date.now()}`,
            kind: 'discovery',
            note: `Discovered via "${submission.theme}" snapshot (${submission.overallScore}/100).`,
            createdAt: new Date().toISOString(),
          },
        ],
        sourceSubmissionUid: submission.submissionUid,
        mintStatus: 'unminted',
      })
      .returning();

    await tx
      .update(photoSubmissions)
      .set({ addedToGarden: true, petUid })
      .where(eq(photoSubmissions.id, submission.id));

    await tx
      .update(users)
      .set({
        coins: user.coins + submission.coinsReward,
        level: expNext.level,
        expPercent: expNext.expPercent,
        energy: Math.max(0, user.energy - 5),
        fenceExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const payload = { petUid: newPet.petUid, coinsAdded: submission.coinsReward };
    await tx.insert(careLogs).values({
      userId: params.userId,
      petUid,
      idempotencyKey: params.idempotencyKey,
      actionType: 'add_to_garden',
      coinsDelta: submission.coinsReward,
      expDelta: Math.round(submission.expReward / 2),
      bondXpDelta: 15,
      resultPayload: payload,
    });

    return payload;
  });
  } catch (error: any) {
    if (
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('password must be a string') ||
      error?.message?.includes('connect ECONNREFUSED')
    ) {
      return await firestoreAddSubmissionToSanctuary(params);
    }
    throw error;
  }
}

export async function performPetCareAction(params: {
  userId: number;
  uid?: string;
  petUid: string;
  actionType: 'pet' | 'feed' | 'play';
  food?: FoodItemType;
  toyId?: string;
  idempotencyKey: string;
}) {
  const SUPPORTED_CARE_ACTIONS = ['pet', 'feed', 'play'] as const;
  if (!params.actionType || !SUPPORTED_CARE_ACTIONS.includes(params.actionType as any)) {
    throw new Error(
      `Invalid care actionType. Must be one of: ${SUPPORTED_CARE_ACTIONS.join(', ')}.`
    );
  }

  if (!process.env.DATABASE_URL) {
    return await firestorePerformPetCareAction({
      uid: params.uid || String(params.userId),
      userId: params.userId,
      petUid: params.petUid,
      actionType: params.actionType,
      food: params.food,
      toyId: params.toyId,
      idempotencyKey: params.idempotencyKey,
    });
  }

  try {
    return await db.transaction(async (tx) => {
    // Lock Keeper first, then pet, matching claimFirstBondQuest lock order to guarantee deadlock-free atomic care
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .for('update')
      .limit(1);
    if (!user) throw new Error('Keeper not found.');

    const dup = await tx
      .select()
      .from(careLogs)
      .where(
        and(
          eq(careLogs.userId, params.userId),
          eq(careLogs.idempotencyKey, params.idempotencyKey)
        )
      )
      .limit(1);
    if (dup.length > 0) {
      return dup[0].resultPayload ?? { toast: 'Saved ✓' };
    }

    const [pet] = await tx
      .select()
      .from(pets)
      .where(eq(pets.petUid, params.petUid))
      .for('update')
      .limit(1);
    if (!pet || pet.currentOwnerId !== params.userId) {
      throw new Error('Pet not found in your sanctuary.');
    }

    const today = getTodayUtcDate();
    let petUsed = user.limitsDate === today ? user.petCoinsUsed : 0;
    let playUsed = user.limitsDate === today ? user.playCoinsUsed : 0;
    let feedUsed = user.limitsDate === today ? user.feedCoinsUsed : 0;
    const cloverUsed = user.limitsDate === today ? user.cloverCoinsUsed : 0;

    let coinsDelta = 0;
    let expDelta = 0;
    let bondXpDelta = 0;
    let toast = '';
    const nextFoodInv = { ...user.foodInventory };
    let memoryNote = '';

    if (params.actionType === 'pet') {
      bondXpDelta = 15;
      memoryNote = `Enjoyed cozy head pats (+15 Bond XP).`;
      if (petUsed < DAILY_LIMIT_MAX.petCoinsMax) {
        petUsed += 1;
        coinsDelta = 15;
        expDelta = 6;
        toast = '+15 🪙 · +15 Bond';
      } else {
        toast = '❤️ +15 Bond';
      }
    } else if (params.actionType === 'feed') {
      const foodKey = params.food;
      if (!foodKey || !(foodKey in FOOD_META)) {
        throw new Error('Invalid food item.');
      }
      if ((nextFoodInv[foodKey] || 0) <= 0) {
        return { toast: 'No food' };
      }
      nextFoodInv[foodKey] = (nextFoodInv[foodKey] || 0) - 1;
      bondXpDelta = 25;
      memoryNote = `Ate ${FOOD_META[foodKey].name} (+25 Bond XP).`;
      if (feedUsed < DAILY_LIMIT_MAX.feedCoinsMax) {
        feedUsed += 1;
        coinsDelta = 25;
        expDelta = 12;
        toast = `${FOOD_META[foodKey].icon} +25 🪙 · +25 Bond`;
      } else {
        expDelta = 10;
        toast = `${FOOD_META[foodKey].icon} +25 Bond`;
      }
    } else if (params.actionType === 'play') {
      const toy = params.toyId ? TOY_CATALOG[params.toyId] : null;
      if (!toy || !user.ownedToys.includes(params.toyId!)) {
        throw new Error('Toy not owned.');
      }
      bondXpDelta = 20;
      memoryNote = `Played with ${toy.name} (+20 Bond XP).`;
      if (playUsed < DAILY_LIMIT_MAX.playCoinsMax) {
        playUsed += 1;
        coinsDelta = 20;
        expDelta = 8;
        toast = `${toy.icon} +20 🪙 · +20 Bond`;
      } else {
        toast = `${toy.icon} +20 Bond`;
      }
    }

    const expNext = applyExpGain(user.level, user.expPercent, expDelta);
    const updatedMemories = [
      ...(pet.memories || []).slice(-19),
      {
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: params.actionType,
        note: memoryNote,
        createdAt: new Date().toISOString(),
      },
    ];

    const nextQuestPetDone =
      pet.questPetDone || params.actionType === 'pet';
    const nextQuestFeedDone =
      pet.questFeedDone || params.actionType === 'feed';
    const nextQuestPlayDone =
      pet.questPlayDone || params.actionType === 'play';

    await tx
      .update(pets)
      .set({
        needsCare: null,
        bondXp: pet.bondXp + bondXpDelta,
        careCount: pet.careCount + 1,
        questPetDone: nextQuestPetDone,
        questFeedDone: nextQuestFeedDone,
        questPlayDone: nextQuestPlayDone,
        memories: updatedMemories,
      })
      .where(eq(pets.id, pet.id));

    await tx
      .update(users)
      .set({
        coins: user.coins + coinsDelta,
        level: expNext.level,
        expPercent: expNext.expPercent,
        limitsDate: today,
        petCoinsUsed: petUsed,
        playCoinsUsed: playUsed,
        feedCoinsUsed: feedUsed,
        cloverCoinsUsed: cloverUsed,
        foodInventory: nextFoodInv,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const payload = {
      toast,
      bondXp: pet.bondXp + bondXpDelta,
      questPetDone: nextQuestPetDone,
      questFeedDone: nextQuestFeedDone,
      questPlayDone: nextQuestPlayDone,
    };
    await tx.insert(careLogs).values({
      userId: params.userId,
      petUid: pet.petUid,
      idempotencyKey: params.idempotencyKey,
      actionType: params.actionType,
      coinsDelta,
      expDelta,
      bondXpDelta,
      resultPayload: payload,
    });

    return payload;
  });
} catch (error: any) {
  if (
    error?.code === 'ECONNREFUSED' ||
    error?.message?.includes('ECONNREFUSED') ||
    error?.message?.includes('password must be a string')
  ) {
    return await firestorePerformPetCareAction({
      uid: params.uid || String(params.userId),
      petUid: params.petUid,
      actionType: params.actionType,
      food: params.food,
      toyId: params.toyId,
      idempotencyKey: params.idempotencyKey,
    });
  }
  throw error;
}
}

export function evaluateFirstBondQuestEligibility(params: {
  alreadyClaimed: boolean;
  questPetDone: boolean;
  questFeedDone: boolean;
  questPlayDone: boolean;
  bondXp: number;
}): { eligible: boolean; reason: string | null } {
  if (params.alreadyClaimed) {
    return { eligible: false, reason: 'First Bond Quest reward already claimed.' };
  }
  if (!params.questPetDone || !params.questFeedDone || !params.questPlayDone) {
    return {
      eligible: false,
      reason: 'Complete Pet, Feed, and Play on this exact pet first.',
    };
  }
  if (params.bondXp < FIRST_BOND_QUEST_REWARD.MIN_BOND_XP) {
    return {
      eligible: false,
      reason: `Reach ${FIRST_BOND_QUEST_REWARD.MIN_BOND_XP} Bond XP on this pet first (${params.bondXp}/${FIRST_BOND_QUEST_REWARD.MIN_BOND_XP}).`,
    };
  }
  return { eligible: true, reason: null };
}

export async function claimFirstBondQuest(params: {
  userId: number;
  uid?: string;
  petUid: string;
  idempotencyKey: string;
}) {
  if (!process.env.DATABASE_URL) {
    return await firestoreClaimFirstBondQuest({
      uid: params.uid || String(params.userId),
      userId: params.userId,
      petUid: params.petUid,
      idempotencyKey: params.idempotencyKey,
    });
  }

  try {
    return await db.transaction(async (tx) => {
    // Lock the Keeper row first so concurrent quest claims serialize cleanly
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .for('update')
      .limit(1);
    if (!user) throw new Error('Keeper account not found.');

    const dup = await tx
      .select()
      .from(careLogs)
      .where(
        and(
          eq(careLogs.userId, params.userId),
          eq(careLogs.idempotencyKey, params.idempotencyKey)
        )
      )
      .limit(1);
    if (dup.length > 0) {
      return dup[0].resultPayload ?? { claimed: true };
    }

    const [pet] = await tx
      .select()
      .from(pets)
      .where(eq(pets.petUid, params.petUid))
      .for('update')
      .limit(1);
    if (!pet || pet.currentOwnerId !== params.userId) {
      throw new Error('Pet not found in your sanctuary.');
    }

    const check = evaluateFirstBondQuestEligibility({
      alreadyClaimed: Boolean(user.firstBondQuestClaimedAt),
      questPetDone: pet.questPetDone,
      questFeedDone: pet.questFeedDone,
      questPlayDone: pet.questPlayDone,
      bondXp: pet.bondXp,
    });
    if (!check.eligible) {
      const err = new Error(check.reason || 'First Bond Quest requirements not met.');
      (err as Error & { statusCode?: number }).statusCode = user.firstBondQuestClaimedAt
        ? 409
        : 400;
      throw err;
    }

    const expNext = applyExpGain(
      user.level,
      user.expPercent,
      FIRST_BOND_QUEST_REWARD.EXP
    );
    const now = new Date();
    const updatedMemories = [
      ...(pet.memories || []).slice(-19),
      {
        id: `mem-quest-${Date.now()}`,
        kind: 'quest',
        note: `Completed First Bond Quest (+${FIRST_BOND_QUEST_REWARD.COINS} Coins · +${FIRST_BOND_QUEST_REWARD.EXP} EXP).`,
        createdAt: now.toISOString(),
      },
    ];

    const updatedUsers = await tx
      .update(users)
      .set({
        coins: user.coins + FIRST_BOND_QUEST_REWARD.COINS,
        level: expNext.level,
        expPercent: expNext.expPercent,
        firstBondQuestClaimedAt: now,
        firstBondQuestPetUid: pet.petUid,
        updatedAt: now,
      })
      .where(and(eq(users.id, user.id), isNull(users.firstBondQuestClaimedAt)))
      .returning({ id: users.id });

    if (updatedUsers.length === 0) {
      const err = new Error('First Bond Quest reward already claimed.');
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    await tx
      .update(pets)
      .set({ memories: updatedMemories })
      .where(eq(pets.id, pet.id));

    const resultPayload = {
      claimed: true,
      petUid: pet.petUid,
      coinsAwarded: FIRST_BOND_QUEST_REWARD.COINS,
      expAwarded: FIRST_BOND_QUEST_REWARD.EXP,
      toast: `First Bond Quest ✓ +${FIRST_BOND_QUEST_REWARD.COINS} 🪙`,
    };

    await tx.insert(careLogs).values({
      userId: params.userId,
      petUid: pet.petUid,
      idempotencyKey: params.idempotencyKey,
      actionType: 'claim_first_bond_quest',
      coinsDelta: FIRST_BOND_QUEST_REWARD.COINS,
      expDelta: FIRST_BOND_QUEST_REWARD.EXP,
      bondXpDelta: 0,
      resultPayload,
    });

    return resultPayload;
  });
} catch (error: any) {
  if (
    error?.code === 'ECONNREFUSED' ||
    error?.message?.includes('ECONNREFUSED') ||
    error?.message?.includes('password must be a string')
  ) {
    return await firestoreClaimFirstBondQuest({
      uid: params.uid || String(params.userId),
      petUid: params.petUid,
      idempotencyKey: params.idempotencyKey,
    });
  }
  throw error;
}
}

export async function mergeGuestIntoKeeper(params: {
  guestUid: string;
  keeperUserId: number;
  keeperUid: string;
}) {
  if (!process.env.DATABASE_URL) {
    return await firestoreMergeGuestIntoKeeper({
      guestUid: params.guestUid,
      keeperUid: params.keeperUid,
    });
  }

  try {
    return await db.transaction(async (tx) => {
    // Lock Keeper row first so concurrent Google Sign-In merge attempts serialize cleanly
    const [keeper] = await tx
      .select()
      .from(users)
      .where(eq(users.id, params.keeperUserId))
      .for('update')
      .limit(1);
    if (!keeper) {
      throw new Error('Keeper account not found.');
    }

    const mergeKey = `merge-guest-${params.guestUid}`;
    const alreadyMerged = await tx
      .select({ id: careLogs.id })
      .from(careLogs)
      .where(
        and(
          eq(careLogs.userId, params.keeperUserId),
          eq(careLogs.idempotencyKey, mergeKey)
        )
      )
      .limit(1);
    if (alreadyMerged.length > 0) {
      return { merged: false, reason: 'already_merged' };
    }

    const [guestUser] = await tx
      .select()
      .from(users)
      .where(and(eq(users.uid, params.guestUid), eq(users.isGuest, true)))
      .for('update')
      .limit(1);
    if (!guestUser || guestUser.id === params.keeperUserId) {
      return { merged: false, reason: 'no_guest_data' };
    }

    const keeperNonStarterActions = await tx
      .select({ id: careLogs.id })
      .from(careLogs)
      .where(
        and(
          eq(careLogs.userId, keeper.id),
          ne(careLogs.idempotencyKey, 'starter-seed-v1')
        )
      )
      .limit(1);
    const keeperSubmissionsCount = await tx
      .select({ id: photoSubmissions.id })
      .from(photoSubmissions)
      .where(eq(photoSubmissions.userId, keeper.id))
      .limit(1);
    const keeperIsFresh =
      keeperNonStarterActions.length === 0 &&
      keeperSubmissionsCount.length === 0 &&
      !keeper.firstBondQuestClaimedAt &&
      !keeper.luredRescued;

    const guestPets = await tx
      .select()
      .from(pets)
      .where(eq(pets.currentOwnerId, guestUser.id));
    const keeperPets = await tx
      .select()
      .from(pets)
      .where(eq(pets.currentOwnerId, keeper.id));

    const starterMap = new Map<string, string>();
    const starterSuffixes = [
      [`pet-calico-${guestUser.id}`, `pet-calico-${keeper.id}`],
      [`pet-retriever-${guestUser.id}`, `pet-retriever-${keeper.id}`],
      [`pet-bunny-${guestUser.id}`, `pet-bunny-${keeper.id}`],
      [`pet-biscuit-${guestUser.id}`, `pet-biscuit-${keeper.id}`],
    ];
    for (const [gUid, kUid] of starterSuffixes) {
      starterMap.set(gUid, kUid);
    }

    const keeperPetByUid = new Map(keeperPets.map((p) => [p.petUid, p]));
    let migratedPetCount = 0;

    for (const gp of guestPets) {
      const mappedKeeperUid = starterMap.get(gp.petUid);
      if (mappedKeeperUid && keeperPetByUid.has(mappedKeeperUid)) {
        const kp = keeperPetByUid.get(mappedKeeperUid)!;
        const mergedMemories = [...(kp.memories || [])];
        const existingIds = new Set(mergedMemories.map((m) => m.id));
        for (const mem of gp.memories || []) {
          if (!existingIds.has(mem.id)) {
            mergedMemories.push(mem);
          }
        }
        await tx
          .update(pets)
          .set({
            bondXp: Math.max(kp.bondXp, gp.bondXp),
            careCount: Math.max(kp.careCount, gp.careCount),
            questPetDone: kp.questPetDone || gp.questPetDone,
            questFeedDone: kp.questFeedDone || gp.questFeedDone,
            questPlayDone: kp.questPlayDone || gp.questPlayDone,
            accessory: kp.accessory ?? gp.accessory,
            memories: mergedMemories.slice(-25),
          })
          .where(eq(pets.id, kp.id));
      } else {
        const nextPetUid = mappedKeeperUid || gp.petUid;
        await tx
          .update(pets)
          .set({
            petUid: nextPetUid,
            originalDiscovererId: keeper.id,
            originalDiscovererUid: params.keeperUid,
            currentOwnerId: keeper.id,
          })
          .where(eq(pets.id, gp.id));
        migratedPetCount += 1;
      }
    }

    const guestSubmissions = await tx
      .select()
      .from(photoSubmissions)
      .where(eq(photoSubmissions.userId, guestUser.id));
    const keeperSubmissions = await tx
      .select({ imageSha256: photoSubmissions.imageSha256 })
      .from(photoSubmissions)
      .where(eq(photoSubmissions.userId, keeper.id));
    const keeperHashes = new Set(keeperSubmissions.map((s) => s.imageSha256));

    let migratedSubmissions = 0;
    for (const gs of guestSubmissions) {
      if (!keeperHashes.has(gs.imageSha256)) {
        const remappedPetUid =
          gs.petUid && starterMap.has(gs.petUid)
            ? starterMap.get(gs.petUid)!
            : gs.petUid;
        await tx
          .update(photoSubmissions)
          .set({
            userId: keeper.id,
            petUid: remappedPetUid,
          })
          .where(eq(photoSubmissions.id, gs.id));
        keeperHashes.add(gs.imageSha256);
        migratedSubmissions += 1;
      }
    }

    const remappedQuestPetUid =
      guestUser.firstBondQuestPetUid &&
      starterMap.has(guestUser.firstBondQuestPetUid)
        ? starterMap.get(guestUser.firstBondQuestPetUid)!
        : guestUser.firstBondQuestPetUid;

    const mergedShopItems = Array.from(
      new Set([...(keeper.ownedShopItems || []), ...(guestUser.ownedShopItems || [])])
    );
    const mergedToys = Array.from(
      new Set([...(keeper.ownedToys || []), ...(guestUser.ownedToys || [])])
    );

    let nextCoins = keeper.coins;
    let nextLevel = keeper.level;
    let nextExpPercent = keeper.expPercent;
    let nextEnergy = keeper.energy;
    let nextWater = keeper.waterCharges;
    let nextActiveBait = keeper.activeBait ?? guestUser.activeBait;
    let nextSeedInv = keeper.seedInventory;
    let nextFoodInv = keeper.foodInventory;
    let nextFarmPlots = keeper.farmPlots;
    let nextTrees = keeper.orchardTrees;
    let nextListings = keeper.marketListings;
    let nextNeighborStates = keeper.neighborStates;
    let mergedExpDelta = 0;

    if (keeperIsFresh) {
      // Fresh Keeper inherits Guest's full progression & resources directly (0 duplicate starter coins)
      nextCoins = guestUser.coins;
      nextLevel = guestUser.level;
      nextExpPercent = guestUser.expPercent;
      nextEnergy = guestUser.energy;
      nextWater = guestUser.waterCharges;
      nextActiveBait = guestUser.activeBait;
      nextSeedInv = guestUser.seedInventory;
      nextFoodInv = guestUser.foodInventory;
      nextFarmPlots = guestUser.farmPlots;
      nextTrees = guestUser.orchardTrees;
      nextListings = guestUser.marketListings;
      nextNeighborStates = guestUser.neighborStates;
      mergedExpDelta = Math.max(
        0,
        guestUser.level * 100 +
          guestUser.expPercent -
          (STARTER_BASELINE.LEVEL * 100 + STARTER_BASELINE.EXP_PERCENT)
      );
    } else {
      // Active Keeper keeps own balances; transfer Guest's net earned Coins/EXP/surpluses above starter baseline
      const guestSurplusCoins = Math.max(
        0,
        guestUser.coins - STARTER_BASELINE.COINS
      );
      let coinsToAdd = guestSurplusCoins;
      if (guestUser.firstBondQuestClaimedAt) {
        if (keeper.firstBondQuestClaimedAt) {
          // Both already claimed First Bond Quest: strip duplicate Quest coin reward, keep other earned coins
          coinsToAdd = Math.max(
            0,
            guestSurplusCoins - FIRST_BOND_QUEST_REWARD.COINS
          );
        } else {
          // Keeper hasn't claimed yet while Guest did: ensure at least the Quest reward + any extra surplus
          coinsToAdd = Math.max(FIRST_BOND_QUEST_REWARD.COINS, guestSurplusCoins);
        }
      }
      nextCoins = keeper.coins + coinsToAdd;

      const guestTotalExp = guestUser.level * 100 + guestUser.expPercent;
      const starterTotalExp =
        STARTER_BASELINE.LEVEL * 100 + STARTER_BASELINE.EXP_PERCENT;
      let guestEarnedExp = Math.max(0, guestTotalExp - starterTotalExp);
      if (keeper.firstBondQuestClaimedAt && guestUser.firstBondQuestClaimedAt) {
        guestEarnedExp = Math.max(0, guestEarnedExp - FIRST_BOND_QUEST_REWARD.EXP);
      }
      mergedExpDelta = guestEarnedExp;
      if (guestEarnedExp > 0) {
        const expNext = applyExpGain(
          keeper.level,
          keeper.expPercent,
          guestEarnedExp
        );
        nextLevel = expNext.level;
        nextExpPercent = expNext.expPercent;
      }

      const mergedSeeds = { ...keeper.seedInventory };
      for (const k of Object.keys(guestUser.seedInventory || {})) {
        const surplus = Math.max(
          0,
          (guestUser.seedInventory[k] || 0) -
            (STARTER_BASELINE.SEED_INVENTORY[k] || 0)
        );
        if (surplus > 0) {
          mergedSeeds[k] = (mergedSeeds[k] || 0) + surplus;
        }
      }
      nextSeedInv = mergedSeeds;

      const mergedFood = { ...keeper.foodInventory };
      for (const k of Object.keys(guestUser.foodInventory || {})) {
        const surplus = Math.max(
          0,
          (guestUser.foodInventory[k] || 0) -
            (STARTER_BASELINE.FOOD_INVENTORY[k] || 0)
        );
        if (surplus > 0) {
          mergedFood[k] = (mergedFood[k] || 0) + surplus;
        }
      }
      nextFoodInv = mergedFood;
    }

    await tx
      .update(users)
      .set({
        coins: nextCoins,
        level: nextLevel,
        expPercent: nextExpPercent,
        energy: nextEnergy,
        waterCharges: nextWater,
        activeBait: nextActiveBait,
        seedInventory: nextSeedInv,
        foodInventory: nextFoodInv,
        farmPlots: nextFarmPlots,
        orchardTrees: nextTrees,
        marketListings: nextListings,
        neighborStates: nextNeighborStates,
        ownedShopItems: mergedShopItems,
        ownedToys: mergedToys,
        luredRescued: keeper.luredRescued || guestUser.luredRescued,
        firstBondQuestClaimedAt:
          keeper.firstBondQuestClaimedAt ?? guestUser.firstBondQuestClaimedAt,
        firstBondQuestPetUid:
          keeper.firstBondQuestPetUid ?? remappedQuestPetUid,
        updatedAt: new Date(),
      })
      .where(eq(users.id, keeper.id));

    await tx.insert(careLogs).values({
      userId: keeper.id,
      petUid: 'sanctuary',
      idempotencyKey: mergeKey,
      actionType: 'merge_guest',
      coinsDelta: nextCoins - keeper.coins,
      expDelta: mergedExpDelta,
      bondXpDelta: 0,
      resultPayload: { migratedPetCount, migratedSubmissions },
    });

    await tx
      .delete(pets)
      .where(eq(pets.originalDiscovererId, guestUser.id));
    await tx.delete(pets).where(eq(pets.currentOwnerId, guestUser.id));
    await tx.delete(users).where(eq(users.id, guestUser.id));

    return { merged: true, migratedPetCount, migratedSubmissions };
  });
} catch (error: any) {
  if (
    error?.code === 'ECONNREFUSED' ||
    error?.message?.includes('ECONNREFUSED') ||
    error?.message?.includes('password must be a string')
  ) {
    return await firestoreMergeGuestIntoKeeper({
      guestUid: params.guestUid,
      keeperUid: params.keeperUid,
    });
  }
  throw error;
}
}

export async function performGeneralGameAction(params: {
  userId: number;
  uid: string;
  action: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
}) {
  if (!process.env.DATABASE_URL) {
    return await firestorePerformGeneralGameAction({
      uid: params.uid || String(params.userId),
      action: { type: params.action, payload: params.payload },
    });
  }

  try {
    return await db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .for('update')
      .limit(1);
    if (!user) throw new Error('Keeper not found.');

    const dup = await tx
      .select()
      .from(careLogs)
      .where(
        and(
          eq(careLogs.userId, params.userId),
          eq(careLogs.idempotencyKey, params.idempotencyKey)
        )
      )
      .limit(1);
    if (dup.length > 0) {
      return dup[0].resultPayload ?? { toast: 'Done' };
    }

    const today = getTodayUtcDate();
    let coins = user.coins;
    let energy = user.energy;
    let level = user.level;
    let expPercent = user.expPercent;
    let waterCharges = user.waterCharges;
    let luredRescued = user.luredRescued;
    let activeBait = user.activeBait;
    let cloverUsed = user.limitsDate === today ? user.cloverCoinsUsed : 0;
    const seedInv = { ...user.seedInventory };
    const foodInv = { ...user.foodInventory };
    const ownedShop = [...user.ownedShopItems];
    const ownedToys = [...user.ownedToys];
    let plots = [...(user.farmPlots as CropPlot[])];
    let trees = [...(user.orchardTrees as OrchardTree[])];
    let listings = [...(user.marketListings as MarketListing[])];
    const neighborStates = {
      ...(user.neighborStates as Record<
        string,
        { patsUsed?: number; gifted?: boolean; waterHelpsUsed?: number; boughtIds?: string[] }
      >),
    };

    let toast = '';

    switch (params.action) {
      case 'tap_clover': {
        if (cloverUsed >= DAILY_LIMIT_MAX.cloverCoinsMax) {
          toast = '🦋 Maxed';
        } else {
          cloverUsed += 1;
          coins += 10;
          toast = '🦋 +10 🪙';
        }
        break;
      }
      case 'buy_toy': {
        const toyId = String(params.payload.toyId || '');
        const toy = TOY_CATALOG[toyId];
        if (!toy) throw new Error('Invalid toy.');
        if (ownedToys.includes(toyId) || coins < toy.cost) {
          return { toast: 'Cannot buy' };
        }
        coins -= toy.cost;
        ownedToys.push(toyId);
        toast = `Bought ${toy.icon}`;
        break;
      }
      case 'buy_shop_item': {
        const itemId = String(params.payload.itemId || '');
        const item = SHOP_CATALOG[itemId];
        if (!item) throw new Error('Invalid shop item.');
        if (coins < item.cost) return { toast: 'Need Coins' };
        if (item.kind === 'accessory' && ownedShop.includes(itemId)) {
          return { toast: 'Already owned' };
        }
        coins -= item.cost;
        if (item.kind === 'energy') {
          energy = Math.min(user.maxEnergy, energy + 10);
          toast = '+10 ⚡';
        } else {
          ownedShop.push(itemId);
          toast = 'Equipped!';
        }
        break;
      }
      case 'equip_accessory': {
        const petUid = String(params.payload.petUid || '');
        const accessoryId =
          params.payload.accessoryId === null
            ? null
            : String(params.payload.accessoryId || '');
        if (accessoryId && !ownedShop.includes(accessoryId)) {
          throw new Error('Accessory not owned.');
        }
        await tx
          .update(pets)
          .set({ accessory: accessoryId })
          .where(
            and(eq(pets.petUid, petUid), eq(pets.currentOwnerId, user.id))
          );
        toast = accessoryId ? 'Hat Equipped!' : 'Hat Removed';
        break;
      }
      case 'place_bait': {
        activeBait = String(params.payload.baitName || 'Salmon Pate').slice(
          0,
          40
        );
        toast = `Placed ${activeBait}`;
        break;
      }
      case 'rescue_stray': {
        if (luredRescued) return { toast: 'Already rescued' };
        luredRescued = true;
        coins += 100;
        const [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.userId, user.id))
          .limit(1);
        const rescueUid = `pet-biscuit-${user.id}`;
        await tx
          .insert(pets)
          .values({
            petUid: rescueUid,
            originalDiscovererId: user.id,
            originalDiscovererUid: params.uid,
            originalDiscovererWallet: wallet?.address ?? null,
            currentOwnerId: user.id,
            name: 'Biscuit',
            species: 'corgi',
            pose: 'Playful',
            photoUrl: '/src/assets/images/lured_stray_corgi_1794627550798.jpg',
            cutoutMode: 'silhouette',
            posX: 72,
            posY: 62,
            discoveryScore: 90,
            bondXp: 30,
            careCount: 1,
            questPetDone: false,
            questFeedDone: false,
            questPlayDone: false,
            memories: [
              {
                id: `mem-rescue-${Date.now()}`,
                kind: 'rescue',
                note: 'Rescued Biscuit from the garden gate.',
                createdAt: new Date().toISOString(),
              },
            ],
            mintStatus: 'unminted',
          })
          .onConflictDoNothing();
        toast = 'Rescued Biscuit +100 🪙';
        break;
      }
      case 'refill_water': {
        waterCharges = user.maxWater;
        toast = '💧 Full!';
        break;
      }
      case 'buy_seed': {
        const crop = String(params.payload.crop || '') as CropType;
        if (!FOOD_META[crop]?.seedCost) throw new Error('Invalid crop seed.');
        const cost = FOOD_META[crop].seedCost!;
        if (coins < cost) return { toast: 'Need Coins' };
        coins -= cost;
        seedInv[crop] = (seedInv[crop] || 0) + 1;
        toast = `+1 ${FOOD_META[crop].icon} Seed`;
        break;
      }
      case 'tap_plot': {
        const plotId = String(params.payload.plotId || '');
        const activeSeed = params.payload.activeSeed as CropType | null;
        const plot = plots.find((p) => p.id === plotId);
        if (!plot) throw new Error('Plot not found.');
        if (!plot.crop) {
          if (!activeSeed || !FOOD_META[activeSeed]?.seedCost) {
            return { toast: '' };
          }
          if ((seedInv[activeSeed] || 0) <= 0) {
            const cost = FOOD_META[activeSeed].seedCost!;
            if (coins < cost) return { toast: 'Need Coins' };
            coins -= cost;
          } else {
            seedInv[activeSeed] -= 1;
          }
          plots = plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  crop: activeSeed,
                  plantedAt: Date.now(),
                  durationMs: FOOD_META[activeSeed].growMs ?? 10000,
                  watered: false,
                }
              : p
          );
          toast = `Planted ${FOOD_META[activeSeed].icon}`;
        } else {
          const eff = plot.watered ? plot.durationMs * 0.55 : plot.durationMs;
          const elapsed = plot.plantedAt ? Date.now() - plot.plantedAt : 0;
          if (elapsed >= eff) {
            const crop = plot.crop;
            foodInv[crop] = (foodInv[crop] || 0) + 1;
            plots = plots.map((p) =>
              p.id === plotId
                ? { ...p, crop: null, plantedAt: null, watered: false }
                : p
            );
            const next = applyExpGain(level, expPercent, 8);
            level = next.level;
            expPercent = next.expPercent;
            toast = `+1 ${FOOD_META[crop].icon}`;
          } else if (!plot.watered) {
            if (waterCharges <= 0) return { toast: 'Tap Well 💧' };
            waterCharges -= 1;
            plots = plots.map((p) =>
              p.id === plotId ? { ...p, watered: true } : p
            );
            toast = '💧 Watered!';
          } else {
            toast = '🌱 Growing...';
          }
        }
        break;
      }
      case 'tap_tree': {
        const treeId = String(params.payload.treeId || '');
        const tree = trees.find((t) => t.id === treeId);
        if (!tree) throw new Error('Tree not found.');
        if (Date.now() >= tree.readyAt) {
          foodInv[tree.fruit] = (foodInv[tree.fruit] || 0) + 2;
          trees = trees.map((t) =>
            t.id === treeId
              ? { ...t, readyAt: Date.now() + t.durationMs, watered: false }
              : t
          );
          const next = applyExpGain(level, expPercent, 10);
          level = next.level;
          expPercent = next.expPercent;
          toast = `+2 ${FOOD_META[tree.fruit].icon}`;
        } else if (!tree.watered && waterCharges > 0) {
          waterCharges -= 1;
          trees = trees.map((t) =>
            t.id === treeId
              ? {
                  ...t,
                  watered: true,
                  readyAt:
                    Date.now() + Math.max(2000, (t.readyAt - Date.now()) * 0.5),
                }
              : t
          );
          toast = '💧 Faster!';
        } else {
          toast = '🌳 Growing...';
        }
        break;
      }
      case 'list_market': {
        const item = String(params.payload.item || '') as FoodItemType;
        if (!FOOD_META[item]) throw new Error('Invalid item.');
        const qty = Math.max(
          1,
          Math.min(foodInv[item] || 0, Math.round(Number(params.payload.qty || 1)))
        );
        if ((foodInv[item] || 0) < qty || qty <= 0) return { toast: 'Not enough' };
        if (listings.length >= 6) return { toast: 'Stall Full' };
        const baseTotal = FOOD_META[item].sellPrice * qty;
        const minPrice = Math.max(1, Math.round(baseTotal * 0.4));
        const maxPrice = Math.max(minPrice + 10, Math.round(baseTotal * 2.5));
        const price = Math.max(
          minPrice,
          Math.min(maxPrice, Math.round(Number(params.payload.price || baseTotal)))
        );
        foodInv[item] -= qty;
        const buyer = BUYER_NAMES[listings.length % BUYER_NAMES.length];
        listings.push({
          id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          item,
          qty,
          price,
          sold: false,
          buyerName: buyer,
        });
        toast = `Listed ${FOOD_META[item].icon}x${qty}`;
        break;
      }
      case 'mark_listing_sold': {
        const listingId = String(params.payload.listingId || '');
        listings = listings.map((l) =>
          l.id === listingId && !l.sold
            ? {
                ...l,
                sold: true,
                buyerName:
                  l.buyerName ||
                  BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)],
              }
            : l
        );
        break;
      }
      case 'cancel_market': {
        const listingId = String(params.payload.listingId || '');
        const target = listings.find((l) => l.id === listingId);
        if (!target || target.sold) return { toast: '' };
        foodInv[target.item] = (foodInv[target.item] || 0) + target.qty;
        listings = listings.filter((l) => l.id !== listingId);
        toast = `Returned ${FOOD_META[target.item].icon}x${target.qty}`;
        break;
      }
      case 'collect_market': {
        const listingId = String(params.payload.listingId || '');
        const target = listings.find((l) => l.id === listingId);
        if (!target || !target.sold) return { toast: '' };
        coins += target.price;
        listings = listings.filter((l) => l.id !== listingId);
        toast = `+${target.price} 🪙`;
        break;
      }
      case 'neighbor_pat': {
        const neighborId = String(params.payload.neighborId || '');
        const cur = neighborStates[neighborId] || {};
        const pats = cur.patsUsed || 0;
        if (pats >= 3) return { toast: '❤️ Maxed' };
        neighborStates[neighborId] = { ...cur, patsUsed: pats + 1 };
        coins += 15;
        const next = applyExpGain(level, expPercent, 5);
        level = next.level;
        expPercent = next.expPercent;
        toast = '+15 🪙';
        break;
      }
      case 'neighbor_gift': {
        const neighborId = String(params.payload.neighborId || '');
        const cur = neighborStates[neighborId] || {};
        if (cur.gifted) return { toast: '🎁 Sent' };
        neighborStates[neighborId] = { ...cur, gifted: true };
        coins += 25;
        const next = applyExpGain(level, expPercent, 10);
        level = next.level;
        expPercent = next.expPercent;
        toast = '🎁 +25 🪙';
        break;
      }
      case 'neighbor_water': {
        const neighborId = String(params.payload.neighborId || '');
        const cur = neighborStates[neighborId] || {};
        const helps = cur.waterHelpsUsed || 0;
        if (helps >= 3) return { toast: '💧 Daily Max' };
        neighborStates[neighborId] = { ...cur, waterHelpsUsed: helps + 1 };
        coins += 15;
        const next = applyExpGain(level, expPercent, 8);
        level = next.level;
        expPercent = next.expPercent;
        toast = '💧 +15 🪙';
        break;
      }
      case 'neighbor_buy': {
        const neighborId = String(params.payload.neighborId || '');
        const listingId = String(params.payload.listingId || '');
        const stock = NEIGHBOR_CATALOG[neighborId]?.marketStock?.[listingId];
        if (!stock) throw new Error('Neighbor listing not found.');
        const cur = neighborStates[neighborId] || {};
        const boughtIds = cur.boughtIds || [];
        if (boughtIds.includes(listingId) || coins < stock.price) {
          return { toast: 'Unavailable' };
        }
        coins -= stock.price;
        foodInv[stock.item] = (foodInv[stock.item] || 0) + stock.qty;
        neighborStates[neighborId] = {
          ...cur,
          boughtIds: [...boughtIds, listingId],
        };
        toast = `Bought ${FOOD_META[stock.item].icon}x${stock.qty}`;
        break;
      }
      case 'refill_energy': {
        energy = Math.min(user.maxEnergy, energy + 5);
        toast = '⚡ +5';
        break;
      }
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }

    await tx
      .update(users)
      .set({
        coins,
        energy,
        level,
        expPercent,
        waterCharges,
        luredRescued,
        activeBait,
        limitsDate: today,
        cloverCoinsUsed: cloverUsed,
        seedInventory: seedInv,
        foodInventory: foodInv,
        ownedShopItems: ownedShop,
        ownedToys,
        farmPlots: plots,
        orchardTrees: trees,
        marketListings: listings,
        neighborStates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const resultPayload = { toast };
    await tx.insert(careLogs).values({
      userId: params.userId,
      petUid: 'sanctuary',
      idempotencyKey: params.idempotencyKey,
      actionType: params.action,
      coinsDelta: coins - user.coins,
      expDelta: 0,
      bondXpDelta: 0,
      resultPayload,
    });

    return resultPayload;
  });
} catch (error: any) {
  if (
    error?.code === 'ECONNREFUSED' ||
    error?.message?.includes('ECONNREFUSED') ||
    error?.message?.includes('password must be a string')
  ) {
    return await firestorePerformGeneralGameAction({
      uid: params.uid || String(params.userId),
      action: { type: params.action, payload: params.payload },
    });
  }
  throw error;
}
}

export async function createAdoptionOffer(params: {
  userId: number;
  petUid: string;
  toEmail?: string;
  toWallet?: string;
  note?: string;
  offerTxHash?: string;
}) {
  const [pet] = await db
    .select()
    .from(pets)
    .where(eq(pets.petUid, params.petUid))
    .limit(1);

  if (!pet || pet.currentOwnerId !== params.userId) {
    throw new Error('Only the current owner can create an adoption offer.');
  }

  let normalizedToWallet: string | null = null;
  if (params.toWallet?.trim()) {
    try {
      normalizedToWallet = ethers.getAddress(params.toWallet.trim()).toLowerCase();
    } catch {
      throw new Error('Recipient wallet address is invalid.');
    }
  }

  const normalizedEmail = params.toEmail?.trim().toLowerCase() || null;
  if (!normalizedToWallet && !normalizedEmail) {
    throw new Error('Enter a recipient Keeper email or wallet address.');
  }

  const [fromWalletRow] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, params.userId))
    .limit(1);

  if (pet.mintStatus === 'minted') {
    if (!normalizedToWallet) {
      throw new Error(
        'Minted Pet Passports require the recipient’s EVM wallet address for on-chain adoption.'
      );
    }
    if (!params.offerTxHash || !/^0x[a-fA-F0-9]{64}$/.test(params.offerTxHash)) {
      throw new Error(
        'Minted pets require a confirmed createAdoptionOffer transaction hash.'
      );
    }
    const status = getWeb3Status();
    if (!status.contractAddress) {
      throw new Error('PET_PASSPORT_CONTRACT_ADDRESS is not configured.');
    }
    const provider = getFujiProvider();
    const receipt = await provider.getTransactionReceipt(params.offerTxHash);
    if (!receipt || receipt.status !== 1) {
      throw new Error('On-chain adoption offer transaction is not confirmed.');
    }
    const iface = new ethers.Interface(PAWS_PASSPORT_ABI);
    let verifiedOffer = false;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== status.contractAddress.toLowerCase()) {
        continue;
      }
      try {
        const parsed = iface.parseLog(log);
        if (
          parsed &&
          parsed.name === 'AdoptionOffered' &&
          parsed.args.tokenId.toString() === pet.tokenId &&
          String(parsed.args.to).toLowerCase() === normalizedToWallet
        ) {
          verifiedOffer = true;
          break;
        }
      } catch {
        // ignore unrelated log
      }
    }
    if (!verifiedOffer) {
      throw new Error(
        'Receipt did not emit AdoptionOffered for this Pet Passport and recipient.'
      );
    }
  }

  // Resolve target user if registered
  let toUserId: number | null = null;
  if (normalizedToWallet) {
    const [targetWallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, normalizedToWallet))
      .limit(1);
    if (targetWallet) toUserId = targetWallet.userId;
  }
  if (!toUserId && normalizedEmail) {
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (targetUser) toUserId = targetUser.id;
  }

  if (toUserId === params.userId) {
    throw new Error('You cannot send an adoption offer to yourself.');
  }

  return db.transaction(async (tx) => {
    const existingPending = await tx
      .select()
      .from(adoptionOffers)
      .where(
        and(
          eq(adoptionOffers.petUid, pet.petUid),
          eq(adoptionOffers.status, 'pending')
        )
      )
      .limit(1);

    if (existingPending.length > 0) {
      throw new Error('This pet already has an active pending adoption offer.');
    }

    const offerUid = `offer-${crypto.randomUUID()}`;
    const [created] = await tx
      .insert(adoptionOffers)
      .values({
        offerUid,
        petUid: pet.petUid,
        fromUserId: params.userId,
        fromWallet: fromWalletRow?.address ?? null,
        toUserId,
        toEmail: normalizedEmail,
        toWallet: normalizedToWallet,
        note: params.note?.trim().slice(0, 140) || null,
        isOnChain: pet.mintStatus === 'minted',
        offerTxHash: params.offerTxHash?.toLowerCase() ?? null,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      })
      .returning();

    return created;
  });
}

export async function acceptAdoptionOffer(params: {
  userId: number;
  userEmail: string;
  offerUid: string;
  acceptTxHash?: string;
}) {
  const [offer] = await db
    .select()
    .from(adoptionOffers)
    .where(eq(adoptionOffers.offerUid, params.offerUid))
    .limit(1);

  if (!offer || offer.status !== 'pending') {
    throw new Error('Adoption offer not found or no longer active.');
  }
  if (offer.expiresAt.getTime() < Date.now()) {
    throw new Error('This adoption offer has expired.');
  }
  if (offer.fromUserId === params.userId) {
    throw new Error('The sender cannot accept their own adoption offer.');
  }

  const [myWallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, params.userId))
    .limit(1);

  const isIntended =
    offer.toUserId === params.userId ||
    (offer.toEmail && offer.toEmail === params.userEmail.toLowerCase()) ||
    (offer.toWallet &&
      myWallet &&
      offer.toWallet === myWallet.address.toLowerCase());

  if (!isIntended) {
    throw new Error('You are not the intended recipient of this adoption offer.');
  }

  const [pet] = await db
    .select()
    .from(pets)
    .where(eq(pets.petUid, offer.petUid))
    .limit(1);
  if (!pet) throw new Error('Pet passport not found.');

  if (pet.mintStatus === 'minted') {
    if (!params.acceptTxHash) {
      throw new Error(
        'Minted Pet Passports require completing acceptAdoption on Avalanche Fuji first.'
      );
    }
    return confirmFujiAdoptionTransaction({
      userId: params.userId,
      offerUid: params.offerUid,
      txHash: params.acceptTxHash,
    });
  }

  await db.transaction(async (tx) => {
    const [recipientUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);
    if (!recipientUser) throw new Error('Recipient account not found.');

    const updatedMemories = [
      ...(pet.memories || []),
      {
        id: `mem-adopt-${Date.now()}`,
        kind: 'adoption',
        note: `Adopted into ${recipientUser.displayName}’s sanctuary.`,
        createdAt: new Date().toISOString(),
      },
    ];

    await tx
      .update(pets)
      .set({
        currentOwnerId: params.userId,
        memories: updatedMemories,
      })
      .where(eq(pets.id, pet.id));

    await tx
      .update(adoptionOffers)
      .set({
        status: 'accepted',
        toUserId: params.userId,
        resolvedAt: new Date(),
      })
      .where(eq(adoptionOffers.id, offer.id));
  });

  return { petUid: pet.petUid, adopted: true };
}

export async function cancelAdoptionOffer(params: {
  userId: number;
  offerUid: string;
}) {
  const [offer] = await db
    .select()
    .from(adoptionOffers)
    .where(eq(adoptionOffers.offerUid, params.offerUid))
    .limit(1);
  if (!offer || offer.status !== 'pending') {
    throw new Error('Pending adoption offer not found.');
  }
  if (offer.fromUserId !== params.userId) {
    throw new Error('Only the sender can cancel this adoption offer.');
  }

  await db
    .update(adoptionOffers)
    .set({ status: 'cancelled', resolvedAt: new Date() })
    .where(eq(adoptionOffers.id, offer.id));

  return { cancelled: true };
}
