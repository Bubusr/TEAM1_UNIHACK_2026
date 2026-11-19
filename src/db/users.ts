import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  firestoreGetOrCreateUser,
  firestoreGetFullKeeperState,
} from './firestoreStorage.ts';
import {
  careLogs,
  pets,
  photoSubmissions,
  users,
  wallets,
} from './schema.ts';
import { computeMintEligibility } from '../server/rewards.ts';
import { FIRST_BOND_QUEST_REWARD } from '../shared/gameMeta.ts';

export const DAILY_LIMIT_MAX = {
  petCoinsMax: 10,
  playCoinsMax: 5,
  feedCoinsMax: 6,
  cloverCoinsMax: 5,
} as const;

export const STARTER_BASELINE = {
  COINS: 12560,
  LEVEL: 12,
  EXP_PERCENT: 64,
  SEED_INVENTORY: { wheat: 3, carrot: 2, berry: 1, catnip: 0 } as Record<string, number>,
  FOOD_INVENTORY: {
    wheat: 0,
    carrot: 1,
    berry: 0,
    catnip: 0,
    apple: 0,
    peach: 0,
  } as Record<string, number>,
} as const;

export function getTodayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildStarterPlots() {
  const now = Date.now();
  return [
    { id: 'plot-1', crop: 'carrot', plantedAt: now - 8000, durationMs: 10000 },
    { id: 'plot-2', crop: 'wheat', plantedAt: now - 5000, durationMs: 8000 },
    { id: 'plot-3', crop: null, plantedAt: null, durationMs: 10000 },
    { id: 'plot-4', crop: null, plantedAt: null, durationMs: 10000 },
    { id: 'plot-5', crop: null, plantedAt: null, durationMs: 10000 },
    { id: 'plot-6', crop: null, plantedAt: null, durationMs: 10000 },
  ];
}

function buildStarterTrees() {
  const now = Date.now();
  return [
    { id: 'tree-apple', fruit: 'apple', readyAt: now - 1000, durationMs: 16000 },
    { id: 'tree-peach', fruit: 'peach', readyAt: now + 9000, durationMs: 20000 },
  ];
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  options?: { isGuest?: boolean }
) {
  if (!process.env.DATABASE_URL) {
    return await firestoreGetOrCreateUser(uid, email, displayName, options);
  }

  const today = getTodayUtcDate();
  const isGuest = Boolean(options?.isGuest);
  const safeEmail = email || `${uid}@keeper.local`;
  const safeName = (
    displayName ||
    (isGuest ? 'Guest Keeper' : safeEmail.split('@')[0]) ||
    'Keeper'
  ).slice(0, 32);

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          uid,
          email: safeEmail,
          displayName: safeName,
          isGuest,
          coins: STARTER_BASELINE.COINS,
          energy: 45,
          maxEnergy: 50,
          level: STARTER_BASELINE.LEVEL,
          expPercent: STARTER_BASELINE.EXP_PERCENT,
          streakDays: 7,
          fenceExpiresAt: new Date(Date.now() + 14 * 3600 * 1000),
          waterCharges: 8,
          maxWater: 8,
          luredRescued: false,
          activeBait: null,
          limitsDate: today,
          petCoinsUsed: 2,
          playCoinsUsed: 0,
          feedCoinsUsed: 0,
          cloverCoinsUsed: 0,
          seedInventory: { ...STARTER_BASELINE.SEED_INVENTORY },
          foodInventory: { ...STARTER_BASELINE.FOOD_INVENTORY },
          ownedShopItems: [],
          ownedToys: ['toy-yarn'],
          farmPlots: buildStarterPlots(),
          orchardTrees: buildStarterTrees(),
          marketListings: [
            {
              id: 'init-sale',
              item: 'carrot',
              qty: 1,
              price: 36,
              sold: true,
              buyerName: 'Maya',
            },
          ],
          neighborStates: {},
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: safeEmail,
            updatedAt: new Date(),
          },
        })
        .returning();

      // Reset daily caps if UTC date changed
      if (user.limitsDate !== today) {
        const [resetUser] = await tx
          .update(users)
          .set({
            limitsDate: today,
            petCoinsUsed: 0,
            playCoinsUsed: 0,
            feedCoinsUsed: 0,
            cloverCoinsUsed: 0,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
        Object.assign(user, resetUser);
      }

      // Seed starter sanctuary companions exactly once per user
      const existingSeedLog = await tx
        .select({ id: careLogs.id })
        .from(careLogs)
        .where(
          and(
            eq(careLogs.userId, user.id),
            eq(careLogs.idempotencyKey, 'starter-seed-v1')
          )
        )
        .limit(1);

      if (existingSeedLog.length === 0) {
        await tx
          .insert(careLogs)
          .values({
            userId: user.id,
            petUid: 'starter-seed',
            idempotencyKey: 'starter-seed-v1',
            actionType: 'starter_seed',
            coinsDelta: 0,
            expDelta: 0,
            bondXpDelta: 0,
          })
          .onConflictDoNothing();

        const starterPets = [
          {
            petUid: `pet-calico-${user.id}`,
            name: 'Mochi',
            species: 'cat',
            pose: 'Cozy',
            photoUrl: '/src/assets/images/cropped_calico_cat_1794637541476.png',
            cutoutMode: 'studio',
            posX: 34,
            posY: 50,
            flip: false,
            needsCare: 'heart',
            discoveryScore: 94,
            bondXp: 65,
            careCount: 3,
          },
          {
            petUid: `pet-retriever-${user.id}`,
            name: 'Sunny',
            species: 'dog',
            pose: 'Happy',
            photoUrl: '/src/assets/images/cropped_golden_dog_1794637542709.png',
            cutoutMode: 'studio',
            posX: 63,
            posY: 45,
            flip: true,
            needsCare: null,
            discoveryScore: 91,
            bondXp: 40,
            careCount: 2,
          },
          {
            petUid: `pet-bunny-${user.id}`,
            name: 'Pip',
            species: 'bunny',
            pose: 'Curious',
            photoUrl: '/src/assets/images/cropped_fluffy_bunny_1794637542800.png',
            cutoutMode: 'studio',
            posX: 50,
            posY: 62,
            flip: false,
            needsCare: null,
            discoveryScore: 88,
            bondXp: 25,
            careCount: 1,
          },
        ];

        for (const sp of starterPets) {
          await tx
            .insert(pets)
            .values({
              petUid: sp.petUid,
              originalDiscovererId: user.id,
              originalDiscovererUid: user.uid,
              currentOwnerId: user.id,
              name: sp.name,
              species: sp.species,
              pose: sp.pose,
              photoUrl: sp.photoUrl,
              cutoutMode: sp.cutoutMode,
              posX: sp.posX,
              posY: sp.posY,
              flip: sp.flip,
              needsCare: sp.needsCare,
              discoveryScore: sp.discoveryScore,
              bondXp: sp.bondXp,
              careCount: sp.careCount,
              questPetDone: false,
              questFeedDone: false,
              questPlayDone: false,
              memories: [
                {
                  id: `mem-init-${sp.petUid}`,
                  kind: 'discovery',
                  note: `${sp.name} joined your sanctuary garden.`,
                  createdAt: new Date().toISOString(),
                },
              ],
              mintStatus: 'unminted',
            })
            .onConflictDoNothing();
        }
      }

      return user;
    });
  } catch (error) {
    try {
      return await firestoreGetOrCreateUser(uid, email, displayName, options);
    } catch (fsErr) {
      console.error('Failed to get or create user:', error, fsErr);
      throw new Error('Failed to load Keeper profile from database.', {
        cause: error,
      });
    }
  }
}

export async function getFullKeeperState(userId: number) {
  if (!process.env.DATABASE_URL) {
    return await firestoreGetFullKeeperState(userId);
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('Keeper account not found.');
    }

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    const ownedPets = await db
      .select()
      .from(pets)
      .where(eq(pets.currentOwnerId, userId))
      .orderBy(pets.id);

    const submissions = await db
      .select()
      .from(photoSubmissions)
      .where(eq(photoSubmissions.userId, userId))
      .orderBy(desc(photoSubmissions.createdAt))
      .limit(30);

    const fenceHours = Math.max(
      0,
      Math.ceil((user.fenceExpiresAt.getTime() - Date.now()) / 3600000)
    );

    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isGuest: user.isGuest,
        coins: user.coins,
        energy: user.energy,
        maxEnergy: user.maxEnergy,
        level: user.level,
        expPercent: user.expPercent,
        streakDays: user.streakDays,
        fenceHours,
        waterCharges: user.waterCharges,
        maxWater: user.maxWater,
        luredRescued: user.luredRescued,
        activeBait: user.activeBait,
        limits: {
          petCoinsUsed: user.petCoinsUsed,
          petCoinsMax: DAILY_LIMIT_MAX.petCoinsMax,
          playCoinsUsed: user.playCoinsUsed,
          playCoinsMax: DAILY_LIMIT_MAX.playCoinsMax,
          feedCoinsUsed: user.feedCoinsUsed,
          feedCoinsMax: DAILY_LIMIT_MAX.feedCoinsMax,
          cloverCoinsUsed: user.cloverCoinsUsed,
          cloverCoinsMax: DAILY_LIMIT_MAX.cloverCoinsMax,
        },
        seedInventory: user.seedInventory,
        foodInventory: user.foodInventory,
        ownedShopItems: user.ownedShopItems,
        ownedToys: user.ownedToys,
        farmPlots: user.farmPlots,
        orchardTrees: user.orchardTrees,
        marketListings: user.marketListings,
        neighborStates: user.neighborStates,
      },
      firstBondQuest: {
        claimed: Boolean(user.firstBondQuestClaimedAt),
        claimedAt: user.firstBondQuestClaimedAt
          ? user.firstBondQuestClaimedAt.toISOString()
          : null,
        claimedPetUid: user.firstBondQuestPetUid ?? null,
        rewardCoins: FIRST_BOND_QUEST_REWARD.COINS,
        rewardExp: FIRST_BOND_QUEST_REWARD.EXP,
        minBondXp: FIRST_BOND_QUEST_REWARD.MIN_BOND_XP,
      },
      wallet: wallet
        ? {
            address: wallet.address,
            chainId: wallet.chainId,
            verifiedAt: wallet.verifiedAt.toISOString(),
          }
        : null,
      pets: ownedPets.map((p) => ({
        id: p.petUid,
        petUid: p.petUid,
        name: p.name,
        species: p.species,
        pose: p.pose,
        photoUrl: p.photoUrl,
        cutoutMode: p.cutoutMode,
        x: p.posX,
        y: p.posY,
        flip: p.flip,
        needsCare: p.needsCare,
        accessory: p.accessory,
        score: p.discoveryScore,
        bondXp: p.bondXp,
        careCount: p.careCount,
        questPetDone: p.questPetDone,
        questFeedDone: p.questFeedDone,
        questPlayDone: p.questPlayDone,
        memories: p.memories,
        originalDiscovererUid: p.originalDiscovererUid,
        originalDiscovererWallet: p.originalDiscovererWallet,
        discoveredAt: p.discoveredAt.toISOString(),
        minted: p.mintStatus === 'minted',
        mintStatus: p.mintStatus,
        tokenId: p.tokenId,
        contractAddress: p.contractAddress,
        mintTxHash: p.mintTxHash,
        metadataUri: p.metadataUri,
        ipfsCid: p.ipfsCid,
        onChainOwner: p.onChainOwner,
        eligibility: computeMintEligibility(p),
      })),
      album: submissions.map((s) => ({
        id: s.submissionUid,
        submissionUid: s.submissionUid,
        photoUrl: s.photoUrl,
        theme: s.theme,
        overallScore: s.overallScore,
        verdict: s.verdict,
        tierLabel: s.tierLabel,
        sharp: s.sharp,
        light: s.light,
        species: s.species,
        pose: s.pose,
        themeScore: s.themeScore,
        themeMatch: s.themeMatch,
        petName: s.petName,
        coinsReward: s.coinsReward,
        expReward: s.expReward,
        cropped: s.addedToGarden,
        petUid: s.petUid,
        minted: false,
      })),
      adoptionOffers: [],
    };
  } catch (error) {
    try {
      return await firestoreGetFullKeeperState(userId);
    } catch (fsErr) {
      console.error('Failed to assemble Keeper state:', error, fsErr);
      throw new Error('Failed to load sanctuary state from database.', {
        cause: error,
      });
    }
  }
}
