import crypto from 'node:crypto';
import { adminDb } from '../lib/firebase-admin.ts';
import {
  DAILY_LIMIT_MAX,
  STARTER_BASELINE,
  getTodayUtcDate,
} from './users.ts';
import { FIRST_BOND_QUEST_REWARD, FOOD_META } from '../shared/gameMeta.ts';
import { applyExpGain, computeMintEligibility, mapSpecies } from '../server/rewards.ts';
import type {
  CropPlot,
  CropType,
  FoodItemType,
  MarketListing,
  OrchardTree,
} from '../types.ts';

// Deterministic integer ID generator for backward compatibility
function hashUidToId(uid: string): number {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

export function buildStarterPlots(): CropPlot[] {
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

export function buildStarterTrees(): OrchardTree[] {
  const now = Date.now();
  return [
    { id: 'tree-apple', fruit: 'apple', readyAt: now - 1000, durationMs: 16000 },
    { id: 'tree-peach', fruit: 'peach', readyAt: now + 9000, durationMs: 20000 },
  ];
}

export async function firestoreGetOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  options?: { isGuest?: boolean }
) {
  const today = getTodayUtcDate();
  const isGuest = Boolean(options?.isGuest);
  const safeEmail = email || `${uid}@keeper.local`;
  const safeName = (
    displayName ||
    (isGuest ? 'Guest Keeper' : safeEmail.split('@')[0]) ||
    'Keeper'
  ).slice(0, 32);

  const userDocRef = adminDb.collection('users').doc(uid);
  const doc = await userDocRef.get();

  if (!doc.exists) {
    const numericId = hashUidToId(uid);
    const initialUserData = {
      id: numericId,
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
      fenceExpiresAt: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
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
      firstBondQuestClaimedAt: null,
      firstBondQuestPetUid: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userDocRef.set(initialUserData);

    // Seed starter pets
    const starterPets = [
      {
        petUid: `pet-calico-${uid}`,
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
        petUid: `pet-retriever-${uid}`,
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
        petUid: `pet-bunny-${uid}`,
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

    const batch = adminDb.batch();
    for (const sp of starterPets) {
      const petRef = adminDb.collection('pets').doc(sp.petUid);
      batch.set(petRef, {
        petUid: sp.petUid,
        currentOwnerUid: uid,
        currentOwnerId: numericId,
        originalDiscovererUid: uid,
        originalDiscovererId: numericId,
        originalDiscovererWallet: null,
        name: sp.name,
        species: sp.species,
        pose: sp.pose,
        photoUrl: sp.photoUrl,
        cutoutMode: sp.cutoutMode,
        posX: sp.posX,
        posY: sp.posY,
        flip: sp.flip,
        needsCare: sp.needsCare,
        accessory: null,
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
        discoveredAt: new Date().toISOString(),
        mintStatus: 'unminted',
        tokenId: null,
        contractAddress: null,
        mintTxHash: null,
        metadataUri: null,
        ipfsCid: null,
        onChainOwner: null,
      });
    }
    await batch.commit();

    return initialUserData;
  }

  // User exists - check daily limits reset
  const userData = doc.data() as any;
  if (userData.limitsDate !== today) {
    const update = {
      limitsDate: today,
      petCoinsUsed: 0,
      playCoinsUsed: 0,
      feedCoinsUsed: 0,
      cloverCoinsUsed: 0,
      updatedAt: new Date().toISOString(),
    };
    await userDocRef.update(update);
    Object.assign(userData, update);
  }

  return userData;
}

export async function firestoreGetFullKeeperState(uidOrId: string | number) {
  let userDoc: FirebaseFirestore.DocumentSnapshot;
  if (typeof uidOrId === 'string') {
    userDoc = await adminDb.collection('users').doc(uidOrId).get();
  } else {
    const q = await adminDb
      .collection('users')
      .where('id', '==', uidOrId)
      .limit(1)
      .get();
    if (q.empty) {
      throw new Error('Keeper account not found in Firestore.');
    }
    userDoc = q.docs[0];
  }

  if (!userDoc.exists) {
    throw new Error('Keeper account not found in Firestore.');
  }

  const user = userDoc.data() as any;
  const uid = user.uid;

  // Query owned pets
  const petsSnap = await adminDb
    .collection('pets')
    .where('currentOwnerUid', '==', uid)
    .get();

  const ownedPets = petsSnap.docs.map((d) => d.data() as any);
  ownedPets.sort((a, b) => {
    const tA = new Date(a.discoveredAt || a.createdAt || 0).getTime();
    const tB = new Date(b.discoveredAt || b.createdAt || 0).getTime();
    if (tA !== tB) return tA - tB;
    const starterOrder: Record<string, number> = { Mochi: 1, Sunny: 2, Pip: 3 };
    return (starterOrder[a.name] || 99) - (starterOrder[b.name] || 99);
  });

  // Query wallet
  const walletSnap = await adminDb
    .collection('wallets')
    .where('uid', '==', uid)
    .limit(1)
    .get();
  const wallet = !walletSnap.empty ? (walletSnap.docs[0].data() as any) : null;

  // Query photo submissions (album)
  const albumSnap = await adminDb
    .collection('photoSubmissions')
    .where('uid', '==', uid)
    .limit(30)
    .get();
  const submissions = albumSnap.docs.map((d) => d.data() as any);

  const fenceExpiresAtTime = new Date(user.fenceExpiresAt).getTime();
  const fenceHours = Math.max(
    0,
    Math.ceil((fenceExpiresAtTime - Date.now()) / 3600000)
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
      seedInventory: user.seedInventory || {},
      foodInventory: user.foodInventory || {},
      ownedShopItems: user.ownedShopItems || [],
      ownedToys: user.ownedToys || [],
      farmPlots: user.farmPlots || [],
      orchardTrees: user.orchardTrees || [],
      marketListings: user.marketListings || [],
      neighborStates: user.neighborStates || {},
    },
    firstBondQuest: {
      claimed: Boolean(user.firstBondQuestClaimedAt),
      claimedAt: user.firstBondQuestClaimedAt || null,
      claimedPetUid: user.firstBondQuestPetUid ?? null,
      rewardCoins: FIRST_BOND_QUEST_REWARD.COINS,
      rewardExp: FIRST_BOND_QUEST_REWARD.EXP,
      minBondXp: FIRST_BOND_QUEST_REWARD.MIN_BOND_XP,
    },
    wallet: wallet
      ? {
          address: wallet.address,
          chainId: wallet.chainId,
          verifiedAt: wallet.verifiedAt,
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
      x: p.posX ?? p.x,
      y: p.posY ?? p.y,
      flip: p.flip,
      needsCare: p.needsCare,
      accessory: p.accessory,
      score: p.discoveryScore ?? p.score,
      bondXp: p.bondXp,
      careCount: p.careCount,
      questPetDone: p.questPetDone,
      questFeedDone: p.questFeedDone,
      questPlayDone: p.questPlayDone,
      memories: p.memories || [],
      originalDiscovererUid: p.originalDiscovererUid,
      originalDiscovererWallet: p.originalDiscovererWallet,
      discoveredAt: p.discoveredAt,
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
}

export async function firestorePerformPetCareAction(params: {
  uid: string;
  userId?: number;
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

  let targetUid = params.uid;
  let userRef = adminDb.collection('users').doc(targetUid);
  const probe = await userRef.get();
  if (!probe.exists) {
    const numId = params.userId ?? Number(params.uid);
    if (!isNaN(numId)) {
      const q = await adminDb
        .collection('users')
        .where('id', '==', numId)
        .limit(1)
        .get();
      if (!q.empty) {
        targetUid = q.docs[0].id;
        userRef = adminDb.collection('users').doc(targetUid);
      }
    }
  }

  const petRef = adminDb.collection('pets').doc(params.petUid);
  const careLogRef = adminDb
    .collection('careLogs')
    .doc(`${targetUid}_${params.idempotencyKey}`);

  return adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error('Keeper not found.');

    const logDoc = await transaction.get(careLogRef);
    if (logDoc.exists) {
      return logDoc.data()?.resultPayload ?? { toast: 'Saved ✓' };
    }

    let petDoc = await transaction.get(petRef);
    let resolvedPetRef = petRef;
    if (!petDoc.exists) {
      const allUserPets = await adminDb
        .collection('pets')
        .where('currentOwnerUid', '==', targetUid)
        .get();
      const found = allUserPets.docs.find((d) => {
        const data = d.data();
        if (d.id === params.petUid || data.petUid === params.petUid) return true;
        for (const breed of ['calico', 'retriever', 'bunny', 'stray']) {
          if (
            params.petUid.includes(breed) &&
            (d.id.includes(breed) || data.species?.toLowerCase().includes(breed))
          ) {
            return true;
          }
        }
        return false;
      });
      if (found) {
        resolvedPetRef = found.ref;
        petDoc = found;
      }
    }
    if (!petDoc.exists) throw new Error('Pet not found in your sanctuary.');

    const user = userDoc.data() as any;
    const pet = petDoc.data() as any;
    if (pet.currentOwnerUid !== targetUid) {
      throw new Error('Pet not found in your sanctuary.');
    }

    const today = getTodayUtcDate();
    let petUsed = user.limitsDate === today ? user.petCoinsUsed : 0;
    let playUsed = user.limitsDate === today ? user.playCoinsUsed : 0;
    let feedUsed = user.limitsDate === today ? user.feedCoinsUsed : 0;

    let coinsDelta = 0;
    let expDelta = 0;
    let bondXpDelta = 0;
    let toast = '';
    const nextFoodInv = { ...(user.foodInventory || {}) };
    let memoryNote = '';

    if (params.actionType === 'pet') {
      bondXpDelta = 15;
      memoryNote = 'Enjoyed cozy head pats (+15 Bond XP).';
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
      const toy = params.toyId ? TOY_CATALOG_FS[params.toyId] : null;
      const owned = user.ownedToys || [];
      if (params.toyId && (!toy || !owned.includes(params.toyId))) {
        throw new Error('Toy not owned.');
      }
      const toyIcon = toy?.icon || '🎾';
      const toyName = toy?.name || 'Garden Toy';
      bondXpDelta = 20;
      memoryNote = `Played with ${toyName} (+20 Bond XP).`;
      if (playUsed < DAILY_LIMIT_MAX.playCoinsMax) {
        playUsed += 1;
        coinsDelta = 20;
        expDelta = 8;
        toast = `${toyIcon} +20 🪙 · +20 Bond`;
      } else {
        toast = `${toyIcon} +20 Bond`;
      }
    }

    const nextBondXp = pet.bondXp + bondXpDelta;
    const nextQuestPet = pet.questPetDone || params.actionType === 'pet';
    const nextQuestFeed = pet.questFeedDone || params.actionType === 'feed';
    const nextQuestPlay = pet.questPlayDone || params.actionType === 'play';

    const memoryItem = {
      id: `mem-${Date.now()}`,
      kind: params.actionType,
      note: memoryNote,
      createdAt: new Date().toISOString(),
    };
    const nextMemories = [memoryItem, ...(pet.memories || [])].slice(0, 20);

    const updatedPet = {
      ...pet,
      bondXp: nextBondXp,
      careCount: (pet.careCount || 0) + 1,
      questPetDone: nextQuestPet,
      questFeedDone: nextQuestFeed,
      questPlayDone: nextQuestPlay,
      needsCare: null,
      memories: nextMemories,
    };

    const nextCoins = Math.max(0, user.coins + coinsDelta);
    const nextExpPercent = (user.expPercent + expDelta) % 100;
    const nextLevel =
      user.level + Math.floor((user.expPercent + expDelta) / 100);

    const updatedUser = {
      ...user,
      coins: nextCoins,
      expPercent: nextExpPercent,
      level: nextLevel,
      foodInventory: nextFoodInv,
      limitsDate: today,
      petCoinsUsed: petUsed,
      playCoinsUsed: playUsed,
      feedCoinsUsed: feedUsed,
      updatedAt: new Date().toISOString(),
    };

    const resultPayload = {
      toast,
      coinsDelta,
      expDelta,
      bondXpDelta,
      pet: {
        id: updatedPet.petUid,
        petUid: updatedPet.petUid,
        name: updatedPet.name,
        species: updatedPet.species,
        pose: updatedPet.pose,
        photoUrl: updatedPet.photoUrl,
        cutoutMode: updatedPet.cutoutMode,
        x: updatedPet.posX,
        y: updatedPet.posY,
        flip: updatedPet.flip,
        needsCare: updatedPet.needsCare,
        accessory: updatedPet.accessory,
        score: updatedPet.discoveryScore,
        bondXp: updatedPet.bondXp,
        careCount: updatedPet.careCount,
        questPetDone: updatedPet.questPetDone,
        questFeedDone: updatedPet.questFeedDone,
        questPlayDone: updatedPet.questPlayDone,
        memories: updatedPet.memories,
        discoveredAt: updatedPet.discoveredAt,
        minted: updatedPet.mintStatus === 'minted',
        mintStatus: updatedPet.mintStatus,
        tokenId: updatedPet.tokenId,
        contractAddress: updatedPet.contractAddress,
        mintTxHash: updatedPet.mintTxHash,
        metadataUri: updatedPet.metadataUri,
        ipfsCid: updatedPet.ipfsCid,
        onChainOwner: updatedPet.onChainOwner,
        eligibility: computeMintEligibility(updatedPet),
      },
    };

    transaction.update(userRef, updatedUser);
    transaction.update(resolvedPetRef, updatedPet);
    transaction.set(careLogRef, {
      uid: params.uid,
      petUid: params.petUid,
      idempotencyKey: params.idempotencyKey,
      actionType: params.actionType,
      coinsDelta,
      expDelta,
      bondXpDelta,
      resultPayload,
      createdAt: new Date().toISOString(),
    });

    return resultPayload;
  });
}

export async function firestoreClaimFirstBondQuest(params: {
  uid: string;
  userId?: number;
  petUid: string;
  idempotencyKey: string;
}) {
  let targetUid = params.uid;
  let userRef = adminDb.collection('users').doc(targetUid);
  const probe = await userRef.get();
  if (!probe.exists) {
    const numId = params.userId ?? Number(params.uid);
    if (!isNaN(numId)) {
      const q = await adminDb
        .collection('users')
        .where('id', '==', numId)
        .limit(1)
        .get();
      if (!q.empty) {
        targetUid = q.docs[0].id;
        userRef = adminDb.collection('users').doc(targetUid);
      }
    }
  }

  const petRef = adminDb.collection('pets').doc(params.petUid);
  const careLogRef = adminDb
    .collection('careLogs')
    .doc(`${targetUid}_${params.idempotencyKey}`);

  return adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error('Keeper account not found.');

    const logDoc = await transaction.get(careLogRef);
    if (logDoc.exists) {
      return logDoc.data()?.resultPayload ?? { claimed: true };
    }

    let petDoc = await transaction.get(petRef);
    let resolvedPetRef = petRef;
    if (!petDoc.exists) {
      const allUserPets = await adminDb
        .collection('pets')
        .where('currentOwnerUid', '==', targetUid)
        .get();
      const found = allUserPets.docs.find((d) => {
        const data = d.data();
        if (d.id === params.petUid || data.petUid === params.petUid) return true;
        for (const breed of ['calico', 'retriever', 'bunny', 'stray']) {
          if (
            params.petUid.includes(breed) &&
            (d.id.includes(breed) || data.species?.toLowerCase().includes(breed))
          ) {
            return true;
          }
        }
        return false;
      });
      if (found) {
        resolvedPetRef = found.ref;
        petDoc = found;
      }
    }
    if (!petDoc.exists) throw new Error('Pet not found in your sanctuary.');

    const user = userDoc.data() as any;
    const pet = petDoc.data() as any;

    if (user.firstBondQuestClaimedAt) {
      const err = new Error('First Bond Quest has already been claimed on this account.');
      (err as any).statusCode = 409;
      throw err;
    }

    if (!pet.questPetDone || !pet.questFeedDone || !pet.questPlayDone || pet.bondXp < 100) {
      const err = new Error('First Bond Quest requirements not met on this pet.');
      (err as any).statusCode = 400;
      throw err;
    }

    const nextCoins = user.coins + FIRST_BOND_QUEST_REWARD.COINS;
    const nextExpPercent = (user.expPercent + FIRST_BOND_QUEST_REWARD.EXP) % 100;
    const nextLevel =
      user.level +
      Math.floor((user.expPercent + FIRST_BOND_QUEST_REWARD.EXP) / 100);
    const claimedAt = new Date().toISOString();

    const resultPayload = {
      claimed: true,
      petUid: pet.petUid,
      claimedPetUid: pet.petUid,
      rewardCoins: FIRST_BOND_QUEST_REWARD.COINS,
      rewardExp: FIRST_BOND_QUEST_REWARD.EXP,
      coinsAwarded: FIRST_BOND_QUEST_REWARD.COINS,
      expAwarded: FIRST_BOND_QUEST_REWARD.EXP,
      claimedAt,
      toast: `Quest Claimed! +${FIRST_BOND_QUEST_REWARD.COINS} 🪙 · +${FIRST_BOND_QUEST_REWARD.EXP} EXP`,
    };

    transaction.update(userRef, {
      coins: nextCoins,
      expPercent: nextExpPercent,
      level: nextLevel,
      firstBondQuestClaimedAt: claimedAt,
      firstBondQuestPetUid: pet.petUid,
      updatedAt: claimedAt,
    });

    transaction.set(careLogRef, {
      uid: params.uid,
      petUid: params.petUid,
      idempotencyKey: params.idempotencyKey,
      actionType: 'first_bond_quest_claim',
      coinsDelta: FIRST_BOND_QUEST_REWARD.COINS,
      expDelta: FIRST_BOND_QUEST_REWARD.EXP,
      bondXpDelta: 0,
      resultPayload,
      createdAt: claimedAt,
    });

    return resultPayload;
  });
}

const TOY_CATALOG_FS: Record<string, { cost: number; name: string; icon: string }> = {
  'toy-yarn': { cost: 120, name: 'Yarn Ball', icon: '🧶' },
  'toy-tennis': { cost: 150, name: 'Tennis Ball', icon: '🎾' },
  'toy-duck': { cost: 220, name: 'Plush Duck', icon: '🧸' },
};

const SHOP_CATALOG_FS: Record<string, { cost: number; kind: 'accessory' | 'energy' }> = {
  'straw-hat': { cost: 400, kind: 'accessory' },
  'flower-crown': { cost: 550, kind: 'accessory' },
  'camera-film': { cost: 250, kind: 'energy' },
};

const BUYER_NAMES_FS = ['Maya', 'Leo', 'Hana'];

const NEIGHBOR_CATALOG_FS: Record<string, { marketStock: Record<string, { item: FoodItemType; qty: number; price: number }> }> = {
  'neighbor-maya': { marketStock: { 'm-1': { item: 'peach', qty: 2, price: 60 }, 'm-2': { item: 'berry', qty: 2, price: 70 }, 'm-3': { item: 'carrot', qty: 3, price: 65 } } },
  'neighbor-leo': { marketStock: { 'l-1': { item: 'apple', qty: 2, price: 55 }, 'l-2': { item: 'wheat', qty: 4, price: 50 } } },
  'neighbor-hana': { marketStock: { 'h-1': { item: 'catnip', qty: 1, price: 65 }, 'h-2': { item: 'berry', qty: 3, price: 95 } } },
};

export async function firestorePerformGeneralGameAction(params: {
  uid: string;
  action: { type: string; payload?: any };
}) {
  const userRef = adminDb.collection('users').doc(params.uid);

  return adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error('Keeper account not found.');

    const user = userDoc.data() as any;
    const action = params.action;
    let toast = '';
    const now = Date.now();
    const today = getTodayUtcDate();

    const updatedUser: Record<string, any> = { ...user };
    const foodInv: Record<string, number> = { ...user.foodInventory };
    const seedInv: Record<string, number> = { ...user.seedInventory };
    const ownedToys: string[] = [...(user.ownedToys || [])];
    const ownedShop: string[] = [...(user.ownedShopItems || [])];
    let plots: CropPlot[] = [...(user.farmPlots || [])];
    let trees: OrchardTree[] = [...(user.orchardTrees || [])];
    let listings: MarketListing[] = [...(user.marketListings || [])];
    const neighborStates: Record<string, any> = { ...(user.neighborStates || {}) };
    let coins: number = user.coins;
    let energy: number = user.energy;
    let waterCharges: number = user.waterCharges;
    let luredRescued: boolean = user.luredRescued;
    let activeBait: string | null = user.activeBait;
    let cloverUsed: number = user.limitsDate === today ? user.cloverCoinsUsed : 0;
    let expPercent: number = user.expPercent;
    let level: number = user.level;

    switch (action.type) {
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
        const toyId = String(action.payload?.toyId || '');
        const toy = TOY_CATALOG_FS[toyId];
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
        const itemId = String(action.payload?.itemId || '');
        const item = SHOP_CATALOG_FS[itemId];
        if (!item) throw new Error('Invalid shop item.');
        if (coins < item.cost) return { toast: 'Need Coins' };
        if (item.kind === 'accessory' && ownedShop.includes(itemId)) return { toast: 'Already owned' };
        coins -= item.cost;
        if (item.kind === 'energy') {
          energy = Math.min(user.maxEnergy || 50, energy + 10);
          toast = '+10 ⚡';
        } else {
          ownedShop.push(itemId);
          toast = 'Equipped!';
        }
        break;
      }
      case 'equip_accessory': {
        // Accessory is stored on the pet doc, handled separately via pets collection
        toast = 'Accessory updated';
        break;
      }
      case 'place_bait': {
        activeBait = String(action.payload?.baitName || 'Salmon Pate').slice(0, 40);
        toast = `Placed ${activeBait}`;
        break;
      }
      case 'rescue_stray': {
        luredRescued = true;
        coins += 100;
        // Add rescue pet doc
        const rescueUid = `pet-biscuit-${params.uid}`;
        const rescuePetRef = adminDb.collection('pets').doc(rescueUid);
        const existingRescue = await rescuePetRef.get();
        if (!existingRescue.exists) {
          transaction.set(rescuePetRef, {
            petUid: rescueUid,
            currentOwnerUid: params.uid,
            currentOwnerId: user.id,
            originalDiscovererUid: params.uid,
            originalDiscovererId: user.id,
            originalDiscovererWallet: null,
            name: 'Biscuit',
            species: 'corgi',
            pose: 'Playful',
            photoUrl: '/src/assets/images/lured_stray_corgi_1794627550798.png',
            cutoutMode: 'studio',
            posX: 72,
            posY: 62,
            flip: false,
            needsCare: null,
            accessory: null,
            discoveryScore: 90,
            bondXp: 30,
            careCount: 1,
            questPetDone: false,
            questFeedDone: false,
            questPlayDone: false,
            memories: [{ id: `mem-rescue-${now}`, kind: 'rescue', note: 'Rescued Biscuit from the garden gate.', createdAt: new Date().toISOString() }],
            discoveredAt: new Date().toISOString(),
            mintStatus: 'unminted',
            tokenId: null,
            contractAddress: null,
            mintTxHash: null,
            metadataUri: null,
            ipfsCid: null,
            onChainOwner: null,
          });
        }
        toast = 'Rescued Biscuit +100 🪙';
        break;
      }
      case 'refill_water': {
        waterCharges = user.maxWater || 8;
        toast = '💧 Full!';
        break;
      }
      case 'refill_energy': {
        energy = Math.min(user.maxEnergy || 50, energy + 5);
        toast = '⚡ +5';
        break;
      }
      case 'buy_seed': {
        const crop = String(action.payload?.crop || '') as CropType;
        if (!FOOD_META[crop]?.seedCost) throw new Error('Invalid crop seed.');
        const cost = FOOD_META[crop].seedCost!;
        if (coins < cost) return { toast: 'Need Coins' };
        coins -= cost;
        seedInv[crop] = (seedInv[crop] || 0) + 1;
        toast = `+1 ${FOOD_META[crop].icon} Seed`;
        break;
      }
      case 'tap_plot': {
        const plotId = String(action.payload?.plotId || '');
        const activeSeed = action.payload?.activeSeed as CropType | null;
        const plotIdx = plots.findIndex((p) => p.id === plotId);
        if (plotIdx === -1) throw new Error('Plot not found.');
        const plot = { ...plots[plotIdx] };
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
          plot.crop = activeSeed;
          plot.plantedAt = now;
          plot.durationMs = FOOD_META[activeSeed].growMs ?? 10000;
          (plot as any).watered = false;
          toast = `Planted ${FOOD_META[activeSeed].icon}`;
        } else {
          const eff = (plot as any).watered ? plot.durationMs * 0.55 : plot.durationMs;
          const elapsed = plot.plantedAt ? now - plot.plantedAt : 0;
          if (elapsed >= eff) {
            const crop = plot.crop;
            foodInv[crop] = (foodInv[crop] || 0) + 1;
            plot.crop = null;
            plot.plantedAt = null;
            (plot as any).watered = false;
            const gain = expPercent + 8;
            level = level + Math.floor(gain / 100);
            expPercent = gain % 100;
            toast = `+1 ${FOOD_META[crop].icon}`;
          } else if (!(plot as any).watered) {
            if (waterCharges <= 0) return { toast: 'Tap Well 💧' };
            waterCharges -= 1;
            (plot as any).watered = true;
            toast = '💧 Watered!';
          } else {
            toast = '🌱 Growing...';
          }
        }
        plots = plots.map((p, i) => (i === plotIdx ? plot : p));
        break;
      }
      case 'tap_tree': {
        const treeId = String(action.payload?.treeId || '');
        const treeIdx = trees.findIndex((t) => t.id === treeId);
        if (treeIdx === -1) throw new Error('Tree not found.');
        const tree = { ...trees[treeIdx] } as any;
        if (now >= tree.readyAt) {
          foodInv[tree.fruit] = (foodInv[tree.fruit] || 0) + 2;
          tree.readyAt = now + tree.durationMs;
          tree.watered = false;
          const gain = expPercent + 10;
          level = level + Math.floor(gain / 100);
          expPercent = gain % 100;
          toast = `+2 ${FOOD_META[tree.fruit as FoodItemType]?.icon || '🍎'}`;
        } else if (!tree.watered && waterCharges > 0) {
          waterCharges -= 1;
          tree.watered = true;
          tree.readyAt = now + Math.max(2000, (tree.readyAt - now) * 0.5);
          toast = '💧 Faster!';
        } else {
          toast = '🌳 Growing...';
        }
        trees = trees.map((t, i) => (i === treeIdx ? tree : t));
        break;
      }
      case 'list_market': {
        const item = String(action.payload?.item || '') as FoodItemType;
        if (!FOOD_META[item]) throw new Error('Invalid item.');
        const qty = Math.max(1, Math.min(foodInv[item] || 0, Math.round(Number(action.payload?.qty || 1))));
        if ((foodInv[item] || 0) < qty || qty <= 0) return { toast: 'Not enough' };
        if (listings.length >= 6) return { toast: 'Stall Full' };
        const price = Math.max(1, Math.round(Number(action.payload?.price || FOOD_META[item].sellPrice * qty)));
        foodInv[item] -= qty;
        const buyer = BUYER_NAMES_FS[listings.length % BUYER_NAMES_FS.length];
        listings.push({ id: `sale-${now}-${Math.random().toString(36).slice(2, 6)}`, item, qty, price, sold: false, buyerName: buyer });
        toast = `Listed ${FOOD_META[item].icon}x${qty}`;
        break;
      }
      case 'mark_listing_sold': {
        const listingId = String(action.payload?.listingId || '');
        listings = listings.map((l) =>
          l.id === listingId && !l.sold
            ? { ...l, sold: true, buyerName: l.buyerName || BUYER_NAMES_FS[Math.floor(Math.random() * BUYER_NAMES_FS.length)] }
            : l
        );
        break;
      }
      case 'cancel_market': {
        const listingId = String(action.payload?.listingId || '');
        const target = listings.find((l) => l.id === listingId);
        if (!target || target.sold) return { toast: '' };
        foodInv[target.item] = (foodInv[target.item] || 0) + target.qty;
        listings = listings.filter((l) => l.id !== listingId);
        toast = `Returned ${FOOD_META[target.item].icon}x${target.qty}`;
        break;
      }
      case 'collect_market': {
        const listingId = String(action.payload?.listingId || '');
        const target = listings.find((l) => l.id === listingId);
        if (!target || !target.sold) return { toast: '' };
        coins += target.price;
        listings = listings.filter((l) => l.id !== listingId);
        toast = `+${target.price} 🪙`;
        break;
      }
      case 'neighbor_pat': {
        const neighborId = String(action.payload?.neighborId || '');
        const cur = neighborStates[neighborId] || {};
        const pats = cur.patsUsed || 0;
        if (pats >= 3) return { toast: '❤️ Maxed' };
        neighborStates[neighborId] = { ...cur, patsUsed: pats + 1 };
        coins += 15;
        const gain1 = expPercent + 5;
        level = level + Math.floor(gain1 / 100);
        expPercent = gain1 % 100;
        toast = '+15 🪙';
        break;
      }
      case 'neighbor_gift': {
        const neighborId = String(action.payload?.neighborId || '');
        const cur = neighborStates[neighborId] || {};
        if (cur.gifted) return { toast: '🎁 Sent' };
        neighborStates[neighborId] = { ...cur, gifted: true };
        coins += 25;
        const gain2 = expPercent + 10;
        level = level + Math.floor(gain2 / 100);
        expPercent = gain2 % 100;
        toast = '🎁 +25 🪙';
        break;
      }
      case 'neighbor_water': {
        const neighborId = String(action.payload?.neighborId || '');
        const cur = neighborStates[neighborId] || {};
        const helps = cur.waterHelpsUsed || 0;
        if (helps >= 3) return { toast: '💧 Daily Max' };
        neighborStates[neighborId] = { ...cur, waterHelpsUsed: helps + 1 };
        coins += 15;
        const gain3 = expPercent + 8;
        level = level + Math.floor(gain3 / 100);
        expPercent = gain3 % 100;
        toast = '💧 +15 🪙';
        break;
      }
      case 'neighbor_buy': {
        const neighborId = String(action.payload?.neighborId || '');
        const listingId = String(action.payload?.listingId || '');
        const stock = NEIGHBOR_CATALOG_FS[neighborId]?.marketStock?.[listingId];
        if (!stock) throw new Error('Neighbor listing not found.');
        const cur = neighborStates[neighborId] || {};
        const boughtIds: string[] = cur.boughtIds || [];
        if (boughtIds.includes(listingId) || coins < stock.price) return { toast: 'Unavailable' };
        coins -= stock.price;
        foodInv[stock.item] = (foodInv[stock.item] || 0) + stock.qty;
        neighborStates[neighborId] = { ...cur, boughtIds: [...boughtIds, listingId] };
        toast = `Bought ${FOOD_META[stock.item].icon}x${stock.qty}`;
        break;
      }
      // Legacy action types (kept for backward compat)
      case 'farm_harvest': {
        const plotId = action.payload?.plotId;
        const plot = plots.find((p) => p.id === plotId);
        if (plot && plot.crop && plot.plantedAt && now - plot.plantedAt >= plot.durationMs) {
          const crop = plot.crop as CropType;
          plots = plots.map((p) => p.id === plotId ? { ...p, crop: null, plantedAt: null } : p);
          foodInv[crop] = (foodInv[crop] || 0) + 1;
          expPercent = (expPercent + 15) % 100;
          toast = `Harvested ${crop} ✓`;
        }
        break;
      }
      case 'farm_plant': {
        const plotId = action.payload?.plotId;
        const crop = action.payload?.crop as CropType;
        const plot = plots.find((p) => p.id === plotId);
        const sc = seedInv[crop] || 0;
        if (plot && !plot.crop && sc > 0) {
          seedInv[crop] = sc - 1;
          plots = plots.map((p) => p.id === plotId ? { ...p, crop, plantedAt: now, durationMs: crop === 'wheat' ? 8000 : 10000 } : p);
          toast = `Planted ${crop} 🌱`;
        }
        break;
      }
      case 'orchard_harvest': {
        const treeId = action.payload?.treeId;
        const tree = trees.find((t) => t.id === treeId);
        if (tree && now >= tree.readyAt) {
          const fruit = tree.fruit as FoodItemType;
          trees = trees.map((t) => t.id === treeId ? { ...t, readyAt: now + t.durationMs } : t);
          foodInv[fruit] = (foodInv[fruit] || 0) + 1;
          expPercent = (expPercent + 20) % 100;
          toast = `Picked ${fruit} 🍎`;
        }
        break;
      }
      case 'shop_buy': {
        const itemId = action.payload?.itemId;
        const cost = action.payload?.cost || 100;
        if (coins >= cost) {
          coins -= cost;
          ownedShop.push(itemId);
          toast = 'Purchased item ✓';
        }
        break;
      }
      case 'water_use': {
        if (waterCharges > 0) { waterCharges -= 1; toast = 'Watered plants 💧'; }
        break;
      }
      case 'fence_extend': {
        const currentExpiry = new Date(updatedUser.fenceExpiresAt).getTime();
        const newExpiry = new Date(Math.max(now, currentExpiry) + 24 * 3600 * 1000).toISOString();
        updatedUser.fenceExpiresAt = newExpiry;
        toast = 'Fence extended +24h 🛡️';
        break;
      }
      default:
        // Unknown action — log and return empty
        console.warn(`[Firestore] Unknown action type: ${action.type}`);
        return { toast: '' };
    }

    updatedUser.coins = coins;
    updatedUser.energy = energy;
    updatedUser.level = level;
    updatedUser.expPercent = expPercent;
    updatedUser.waterCharges = waterCharges;
    updatedUser.luredRescued = luredRescued;
    updatedUser.activeBait = activeBait;
    updatedUser.limitsDate = today;
    updatedUser.cloverCoinsUsed = cloverUsed;
    updatedUser.seedInventory = seedInv;
    updatedUser.foodInventory = foodInv;
    updatedUser.ownedToys = ownedToys;
    updatedUser.ownedShopItems = ownedShop;
    updatedUser.farmPlots = plots;
    updatedUser.orchardTrees = trees;
    updatedUser.marketListings = listings;
    updatedUser.neighborStates = neighborStates;
    updatedUser.updatedAt = new Date().toISOString();
    transaction.update(userRef, updatedUser);

    return { toast, user: updatedUser };
  });
}

export async function firestoreMergeGuestIntoKeeper(params: {
  guestUid: string;
  keeperUid: string;
}) {
  const guestUserRef = adminDb.collection('users').doc(params.guestUid);
  const keeperUserRef = adminDb.collection('users').doc(params.keeperUid);

  return await adminDb.runTransaction(async (transaction) => {
    const guestDoc = await transaction.get(guestUserRef);
    const keeperDoc = await transaction.get(keeperUserRef);

    if (!guestDoc.exists || (guestDoc.data() as any)?.isMerged) {
      return {
        merged: false,
        migratedPetCount: 0,
        migratedSubmissions: 0,
        reason: 'already_merged',
        mergeResult: { migratedPetCount: 0 },
      };
    }

    const guest = guestDoc.data() as any;
    const keeper = keeperDoc.data() as any;

    // Move guest pets to keeper
    const guestPetsSnap = await adminDb
      .collection('pets')
      .where('currentOwnerUid', '==', params.guestUid)
      .get();

    // Query keeper pets to merge starter pets
    const keeperPetsSnap = await adminDb
      .collection('pets')
      .where('currentOwnerUid', '==', params.keeperUid)
      .get();
    const keeperPetMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const kp of keeperPetsSnap.docs) {
      const data = kp.data();
      for (const breed of ['calico', 'retriever', 'bunny']) {
        if (kp.id.includes(breed) || data.petUid?.includes(breed)) {
          keeperPetMap.set(breed, kp);
        }
      }
    }

    let migratedPetCount = 0;
    for (const petDoc of guestPetsSnap.docs) {
      const gData = petDoc.data();
      let matchedBreed: string | null = null;
      for (const breed of ['calico', 'retriever', 'bunny']) {
        if (petDoc.id.includes(breed) || gData.petUid?.includes(breed)) {
          matchedBreed = breed;
          break;
        }
      }

      if (matchedBreed && keeperPetMap.has(matchedBreed)) {
        const kpDoc = keeperPetMap.get(matchedBreed)!;
        const kpData = kpDoc.data();
        const mergedMemories = [...(kpData.memories || [])];
        const existingIds = new Set(mergedMemories.map((m: any) => m.id));
        for (const mem of gData.memories || []) {
          if (!existingIds.has(mem.id)) {
            mergedMemories.push(mem);
          }
        }
        transaction.update(kpDoc.ref, {
          bondXp: Math.max(kpData.bondXp || 0, gData.bondXp || 0),
          careCount: (kpData.careCount || 0) + (gData.careCount || 0),
          questPetDone: Boolean(kpData.questPetDone || gData.questPetDone),
          questFeedDone: Boolean(kpData.questFeedDone || gData.questFeedDone),
          questPlayDone: Boolean(kpData.questPlayDone || gData.questPlayDone),
          memories: mergedMemories,
        });
        transaction.delete(petDoc.ref);
      } else {
        transaction.update(petDoc.ref, {
          currentOwnerUid: params.keeperUid,
          currentOwnerId: keeper?.id || hashUidToId(params.keeperUid),
        });
        migratedPetCount++;
      }
    }

    // Move photo submissions
    const guestSubmissionsSnap = await adminDb
      .collection('photoSubmissions')
      .where('uid', '==', params.guestUid)
      .get();
    let migratedSubmissions = 0;
    for (const subDoc of guestSubmissionsSnap.docs) {
      transaction.update(subDoc.ref, {
        uid: params.keeperUid,
        userId: keeper?.id || hashUidToId(params.keeperUid),
      });
      migratedSubmissions++;
    }

    const keeperIsFresh =
      !keeper?.firstBondQuestClaimedAt &&
      !keeper?.luredRescued &&
      (keeper?.coins === STARTER_BASELINE.COINS || keeper?.coins === undefined) &&
      (keeper?.level === STARTER_BASELINE.LEVEL || keeper?.level === undefined) &&
      (keeper?.expPercent === STARTER_BASELINE.EXP_PERCENT || keeper?.expPercent === undefined) &&
      (!keeper?.ownedShopItems || keeper.ownedShopItems.length === 0) &&
      (!keeper?.ownedToys || keeper.ownedToys.length <= 1);

    let nextCoins = keeper?.coins ?? STARTER_BASELINE.COINS;
    let nextLevel = keeper?.level ?? STARTER_BASELINE.LEVEL;
    let nextExpPercent = keeper?.expPercent ?? STARTER_BASELINE.EXP_PERCENT;

    if (keeperIsFresh) {
      nextCoins = guest.coins;
      nextLevel = guest.level;
      nextExpPercent = guest.expPercent;
    } else {
      const guestSurplusCoins = Math.max(
        0,
        (guest.coins || 0) - STARTER_BASELINE.COINS
      );
      let coinsToAdd = guestSurplusCoins;
      if (guest.firstBondQuestClaimedAt) {
        if (keeper?.firstBondQuestClaimedAt) {
          coinsToAdd = Math.max(
            0,
            guestSurplusCoins - FIRST_BOND_QUEST_REWARD.COINS
          );
        } else {
          coinsToAdd = Math.max(FIRST_BOND_QUEST_REWARD.COINS, guestSurplusCoins);
        }
      }
      nextCoins = (keeper?.coins || 0) + coinsToAdd;

      const guestTotalExp =
        (guest.level || STARTER_BASELINE.LEVEL) * 100 + (guest.expPercent || 0);
      const starterTotalExp =
        STARTER_BASELINE.LEVEL * 100 + STARTER_BASELINE.EXP_PERCENT;
      let guestEarnedExp = Math.max(0, guestTotalExp - starterTotalExp);
      if (keeper?.firstBondQuestClaimedAt && guest.firstBondQuestClaimedAt) {
        guestEarnedExp = Math.max(0, guestEarnedExp - FIRST_BOND_QUEST_REWARD.EXP);
      }
      if (guestEarnedExp > 0) {
        const expNext = applyExpGain(
          keeper?.level || STARTER_BASELINE.LEVEL,
          keeper?.expPercent || STARTER_BASELINE.EXP_PERCENT,
          guestEarnedExp
        );
        nextLevel = expNext.level;
        nextExpPercent = expNext.expPercent;
      }
    }

    const mergedQuestClaimed =
      keeper?.firstBondQuestClaimedAt || guest.firstBondQuestClaimedAt || null;
    let mergedQuestPetUid =
      keeper?.firstBondQuestPetUid || guest.firstBondQuestPetUid || null;
    if (mergedQuestPetUid && mergedQuestPetUid.includes('calico')) {
      mergedQuestPetUid = `pet-calico-${keeper?.id || hashUidToId(params.keeperUid)}`;
    }
    const luredRescued = Boolean(keeper?.luredRescued || guest.luredRescued);

    // Merge owned toys and shop items without duplicates
    const mergedToys = Array.from(
      new Set([...(keeper?.ownedToys || []), ...(guest.ownedToys || [])])
    );
    const mergedShopItems = Array.from(
      new Set([...(keeper?.ownedShopItems || []), ...(guest.ownedShopItems || [])])
    );

    // Migrate or clean up guest wallet if present
    const guestWallet = guest?.wallet as { address?: string; chainId?: number; verifiedAt?: string } | undefined;
    const keeperWallet = keeper?.wallet as { address?: string; chainId?: number; verifiedAt?: string } | undefined;

    const keeperUpdates: Record<string, unknown> = {
      coins: nextCoins,
      level: nextLevel,
      expPercent: nextExpPercent,
      luredRescued,
      ownedToys: mergedToys,
      ownedShopItems: mergedShopItems,
      firstBondQuestClaimedAt: mergedQuestClaimed,
      firstBondQuestPetUid: mergedQuestPetUid,
      updatedAt: new Date().toISOString(),
    };

    if (guestWallet?.address && !keeperWallet?.address) {
      keeperUpdates.wallet = guestWallet;
      const guestWalletRef = adminDb.collection('wallets').doc(params.guestUid);
      const keeperWalletRef = adminDb.collection('wallets').doc(params.keeperUid);
      transaction.set(keeperWalletRef, {
        uid: params.keeperUid,
        userId: keeper?.id || hashUidToId(params.keeperUid),
        address: guestWallet.address.toLowerCase(),
        chainId: guestWallet.chainId || 43113,
        verifiedAt: guestWallet.verifiedAt || new Date().toISOString(),
      });
      transaction.delete(guestWalletRef);
    } else if (guestWallet?.address) {
      const guestWalletRef = adminDb.collection('wallets').doc(params.guestUid);
      transaction.delete(guestWalletRef);
    }

    transaction.update(keeperUserRef, keeperUpdates);

    transaction.update(guestUserRef, {
      isMerged: true,
      mergedIntoUid: params.keeperUid,
      updatedAt: new Date().toISOString(),
    });

    return {
      merged: true,
      migratedPetCount,
      migratedSubmissions,
      mergeResult: { migratedPetCount },
    };
  });
}

export async function firestoreRecordPhotoSubmission(params: {
  userId: number;
  uid: string;
  submissionUid: string;
  imageSha256: string;
  mimeType: string;
  byteSize: number;
  photoUrl: string;
  theme: string;
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
}) {
  const subRef = adminDb.collection('photoSubmissions').doc(params.submissionUid);
  const now = new Date().toISOString();
  // Firestore single property UTF-8 byte limit is 1,048,487 bytes (~1 MiB document limit)
  const safePhotoUrl =
    params.photoUrl && params.photoUrl.length > 900000
      ? params.photoUrl.slice(0, 1000) + '...[photo-too-large-for-firestore]'
      : params.photoUrl;

  const submissionData = {
    submissionUid: params.submissionUid,
    userId: params.userId,
    uid: params.uid,
    imageSha256: params.imageSha256,
    mimeType: params.mimeType,
    byteSize: params.byteSize,
    photoUrl: safePhotoUrl,
    theme: params.theme,
    isAnimal: true,
    confidence: params.confidence,
    overallScore: params.overallScore,
    verdict: params.verdict,
    tierLabel: params.tierLabel,
    sharp: params.sharp,
    light: params.light,
    species: params.species,
    pose: params.pose,
    themeScore: params.themeScore,
    themeMatch: params.themeMatch,
    petName: params.petName,
    coinsReward: params.coinsReward,
    expReward: params.expReward,
    addedToGarden: false,
    petUid: null,
    createdAt: now,
  };
  await subRef.set(submissionData);
  return submissionData;
}

export async function firestoreAddSubmissionToSanctuary(params: {
  userId: number;
  uid: string;
  submissionUid: string;
  idempotencyKey: string;
  cutoutPhotoUrl?: string;
}) {
  const userRef = adminDb.collection('users').doc(params.uid);
  const subRef = adminDb.collection('photoSubmissions').doc(params.submissionUid);
  const careLogRef = adminDb
    .collection('careLogs')
    .doc(`${params.uid}_${params.idempotencyKey}`);

  return adminDb.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error('Keeper not found.');
    const user = userDoc.data() as any;

    const logDoc = await transaction.get(careLogRef);
    if (logDoc.exists) {
      return logDoc.data()?.resultPayload ?? { alreadyProcessed: true };
    }

    const subDoc = await transaction.get(subRef);
    if (!subDoc.exists) throw new Error('Photo submission not found.');
    const submission = subDoc.data() as any;

    if (!submission.isAnimal) {
      throw new Error('Only validated animal snapshots can join the garden.');
    }
    if (submission.addedToGarden) {
      return { alreadyAdded: true, petUid: submission.petUid };
    }

    const petUid = `pet-${crypto.randomUUID()}`;
    const petRef = adminDb.collection('pets').doc(petUid);

    const gain = (user.expPercent || 0) + Math.round(submission.expReward / 2);
    const nextLevel = (user.level || 1) + Math.floor(gain / 100);
    const nextExpPercent = gain % 100;
    const now = new Date().toISOString();

    const chosenPhotoUrl = params.cutoutPhotoUrl || submission.photoUrl;
    const safePetPhotoUrl =
      chosenPhotoUrl && chosenPhotoUrl.length > 900000
        ? chosenPhotoUrl.slice(0, 1000) + '...[photo-too-large-for-firestore]'
        : chosenPhotoUrl;

    const newPet = {
      petUid,
      currentOwnerUid: params.uid,
      currentOwnerId: params.userId,
      originalDiscovererUid: params.uid,
      originalDiscovererId: params.userId,
      originalDiscovererWallet: null,
      name: submission.petName,
      species: mapSpecies(submission.species),
      pose: submission.pose,
      photoUrl: safePetPhotoUrl,
      cutoutMode: params.cutoutPhotoUrl ? 'studio' : 'auto',
      box_2d: submission.box_2d || submission.analysis?.box_2d || null,
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
          createdAt: now,
        },
      ],
      sourceSubmissionUid: submission.submissionUid,
      discoveredAt: now,
      mintStatus: 'unminted',
      tokenId: null,
      contractAddress: null,
      mintTxHash: null,
      metadataUri: null,
      ipfsCid: null,
      onChainOwner: null,
    };

    transaction.set(petRef, newPet);
    transaction.update(subRef, { addedToGarden: true, petUid });
    transaction.update(userRef, {
      coins: (user.coins || 0) + submission.coinsReward,
      level: nextLevel,
      expPercent: nextExpPercent,
      energy: Math.max(0, (user.energy || 45) - 5),
      fenceExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      updatedAt: now,
    });

    const payload = { petUid, coinsAdded: submission.coinsReward };
    transaction.set(careLogRef, {
      uid: params.uid,
      petUid,
      idempotencyKey: params.idempotencyKey,
      actionType: 'add_to_garden',
      coinsDelta: submission.coinsReward,
      expDelta: Math.round(submission.expReward / 2),
      bondXpDelta: 15,
      resultPayload: payload,
      createdAt: now,
    });

    return payload;
  });
}

export type PhotoReservationStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ReservationErrorType = 'TRANSIENT' | 'PERMANENT';

export const DEFAULT_PROCESSING_MAX_MS = 20000; // 2 models x 10s timeout
export const DEFAULT_SAFETY_BUFFER_MS = 15000; // buffer for DB transactions and network
export const DEFAULT_LEASE_TTL_MS =
  DEFAULT_PROCESSING_MAX_MS + DEFAULT_SAFETY_BUFFER_MS; // 35,000 ms
export const TRANSIENT_COOLDOWN_MS = 5000; // 5s cooldown after transient errors
export const PERMANENT_COOLDOWN_MS = 30000; // 30s cooldown for permanent non-animal errors
export const MAX_RESERVATION_ATTEMPTS = 3; // Max retry attempts before blocking
export const ATTEMPT_RESET_WINDOW_MS = 60000; // 60s reset window after which retry attempts reset

export interface PhotoReservationRecord {
  id: string;
  scopeKey: string;
  imageSha256: string;
  status: PhotoReservationStatus;
  submissionUid: string;
  leaseExpiresAt: number;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  failedAtMs?: number;
  error?: string | null;
  errorType?: ReservationErrorType;
  resultPayload?: any | null;
}

export function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const status =
    (err as { statusCode?: unknown })?.statusCode ||
    (err as { status?: unknown })?.status;
  if (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    status === 502 ||
    status === 504
  ) {
    return true;
  }
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('high demand') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('overloaded') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborted') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNRESET') ||
    msg.includes('fetch failed')
  );
}

export function buildReservationDocId(
  scopeKey: string,
  imageSha256: string
): string {
  const safeScope = scopeKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `res_${safeScope}_${imageSha256}`;
}

export async function firestoreAcquirePhotoReservation(params: {
  scopeKey: string;
  imageSha256: string;
  leaseTtlMs?: number;
}): Promise<
  | {
      status: 'ACQUIRED';
      submissionUid: string;
      isRecovery?: boolean;
      isRetry?: boolean;
      attemptCount: number;
    }
  | { status: 'ALREADY_COMPLETED'; submissionUid: string; resultPayload?: any }
  | { status: 'PROCESSING_ACTIVE'; leaseExpiresAt: number }
  | {
      status: 'RETRY_COOLDOWN';
      cooldownRemainingMs: number;
      waitSec: number;
      errorType: ReservationErrorType;
      lastError?: string | null;
    }
  | {
      status: 'MAX_RETRIES_EXCEEDED';
      attemptCount: number;
      maxAttempts: number;
      lastError?: string | null;
    }
> {
  const leaseTtlMs = params.leaseTtlMs ?? DEFAULT_LEASE_TTL_MS;
  const docId = buildReservationDocId(params.scopeKey, params.imageSha256);
  const resRef = adminDb.collection('photoReservations').doc(docId);

  return adminDb.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(resRef);
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (docSnap.exists) {
      const data = docSnap.data() as PhotoReservationRecord;

      if (data.status === 'COMPLETED') {
        return {
          status: 'ALREADY_COMPLETED',
          submissionUid: data.submissionUid,
          resultPayload: data.resultPayload,
        };
      }

      if (data.status === 'PROCESSING') {
        if (now < data.leaseExpiresAt) {
          return {
            status: 'PROCESSING_ACTIVE',
            leaseExpiresAt: data.leaseExpiresAt,
          };
        }

        // Stale lease recovery (worker crashed or timed out)
        // TODO: Repeated stale PROCESSING lease exhaustion currently has no automatic 60-second recovery window;
        // recovery requires explicit reset via firestoreResetPhotoReservation() or transition to FAILED.
        const currentAttempts = data.attemptCount || 1;
        if (currentAttempts >= MAX_RESERVATION_ATTEMPTS) {
          return {
            status: 'MAX_RETRIES_EXCEEDED',
            attemptCount: currentAttempts,
            maxAttempts: MAX_RESERVATION_ATTEMPTS,
            lastError: data.error || 'Evaluation lease timed out repeatedly.',
          };
        }

        const newSubmissionUid = `sub-${crypto.randomUUID()}`;
        const newAttemptCount = currentAttempts + 1;
        transaction.update(resRef, {
          status: 'PROCESSING',
          submissionUid: newSubmissionUid,
          leaseExpiresAt: now + leaseTtlMs,
          attemptCount: newAttemptCount,
          updatedAt: nowIso,
          error: null,
        });
        return {
          status: 'ACQUIRED',
          submissionUid: newSubmissionUid,
          isRecovery: true,
          attemptCount: newAttemptCount,
        };
      }

      if (data.status === 'FAILED') {
        const failedAtMs =
          data.failedAtMs ||
          (data.failedAt ? new Date(data.failedAt).getTime() : 0);
        const errorType = data.errorType || 'TRANSIENT';
        const cooldownMs =
          errorType === 'PERMANENT'
            ? PERMANENT_COOLDOWN_MS
            : TRANSIENT_COOLDOWN_MS;
        const elapsed = now - failedAtMs;

        if (elapsed < cooldownMs) {
          const waitSec = Math.max(1, Math.ceil((cooldownMs - elapsed) / 1000));
          return {
            status: 'RETRY_COOLDOWN',
            cooldownRemainingMs: cooldownMs - elapsed,
            waitSec,
            errorType,
            lastError: data.error,
          };
        }

        // Check if retry attempts exceed max limit OR if reset window elapsed
        const currentAttempts = data.attemptCount || 1;
        const hasResetWindowElapsed = elapsed >= ATTEMPT_RESET_WINDOW_MS;

        if (currentAttempts >= MAX_RESERVATION_ATTEMPTS && !hasResetWindowElapsed) {
          return {
            status: 'MAX_RETRIES_EXCEEDED',
            attemptCount: currentAttempts,
            maxAttempts: MAX_RESERVATION_ATTEMPTS,
            lastError: data.error,
          };
        }

        // Cooldown passed: Allow safe retry (reset to 1 if reset window elapsed, otherwise increment)
        const newSubmissionUid = `sub-${crypto.randomUUID()}`;
        const newAttemptCount = hasResetWindowElapsed ? 1 : currentAttempts + 1;
        transaction.update(resRef, {
          status: 'PROCESSING',
          submissionUid: newSubmissionUid,
          leaseExpiresAt: now + leaseTtlMs,
          attemptCount: newAttemptCount,
          updatedAt: nowIso,
          error: null,
        });
        return {
          status: 'ACQUIRED',
          submissionUid: newSubmissionUid,
          isRetry: true,
          attemptCount: newAttemptCount,
        };
      }
    }

    // Check if photo was already recorded in photoSubmissions for user-scoped keys (backward compatibility)
    if (params.scopeKey.startsWith('u_')) {
      const uid = params.scopeKey.slice(2);
      const existingSubmissionQuery = adminDb
        .collection('photoSubmissions')
        .where('uid', '==', uid)
        .where('imageSha256', '==', params.imageSha256)
        .limit(1);
      const existingSubmissionSnap = await transaction.get(
        existingSubmissionQuery
      );
      if (!existingSubmissionSnap.empty) {
        const existingDoc = existingSubmissionSnap.docs[0].data();
        const existingSubmissionUid =
          existingDoc.submissionUid || existingSubmissionSnap.docs[0].id;
        transaction.set(resRef, {
          id: docId,
          scopeKey: params.scopeKey,
          imageSha256: params.imageSha256,
          status: 'COMPLETED',
          submissionUid: existingSubmissionUid,
          leaseExpiresAt: 0,
          attemptCount: 1,
          createdAt: existingDoc.createdAt || nowIso,
          updatedAt: nowIso,
          completedAt: existingDoc.createdAt || nowIso,
          resultPayload: existingDoc,
        });
        return {
          status: 'ALREADY_COMPLETED',
          submissionUid: existingSubmissionUid,
          resultPayload: existingDoc,
        };
      }
    }

    // Brand new reservation
    const newSubmissionUid = `sub-${crypto.randomUUID()}`;
    transaction.set(resRef, {
      id: docId,
      scopeKey: params.scopeKey,
      imageSha256: params.imageSha256,
      status: 'PROCESSING',
      submissionUid: newSubmissionUid,
      leaseExpiresAt: now + leaseTtlMs,
      attemptCount: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return {
      status: 'ACQUIRED',
      submissionUid: newSubmissionUid,
      attemptCount: 1,
    };
  });
}

export async function firestoreCommitPhotoSubmissionAndReservation(params: {
  userId: number;
  uid: string;
  scopeKey: string;
  submissionUid: string;
  imageSha256: string;
  mimeType: string;
  byteSize: number;
  photoUrl: string;
  theme: string;
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
}): Promise<{
  success: boolean;
  reason?: string;
  submission: any;
}> {
  const docId = buildReservationDocId(params.scopeKey, params.imageSha256);
  const resRef = adminDb.collection('photoReservations').doc(docId);
  const subRef = adminDb.collection('photoSubmissions').doc(params.submissionUid);

  return adminDb.runTransaction(async (transaction) => {
    // 1. ALL READS FIRST
    const resSnap = await transaction.get(resRef);
    const subSnap = await transaction.get(subRef);

    // Guard against duplicate submissions by the same user with the same hash
    const existingQuery = adminDb
      .collection('photoSubmissions')
      .where('uid', '==', params.uid)
      .where('imageSha256', '==', params.imageSha256)
      .limit(1);
    const existingSnap = await transaction.get(existingQuery);

    if (
      !existingSnap.empty &&
      existingSnap.docs[0].id !== params.submissionUid
    ) {
      const existingData = existingSnap.docs[0].data();
      return {
        success: false,
        reason: 'ALREADY_SUBMITTED',
        submission: existingData,
      };
    }

    if (!resSnap.exists) {
      return {
        success: false,
        reason: 'RESERVATION_NOT_FOUND',
        submission: null,
      };
    }

    const resData = resSnap.data() as PhotoReservationRecord;

    // Verify reservation ownership (stale worker cannot write)
    if (resData.submissionUid !== params.submissionUid) {
      return {
        success: false,
        reason: 'LEASE_SUPERSEDED',
        submission: null,
      };
    }

    if (resData.status === 'COMPLETED' && subSnap.exists) {
      return {
        success: true,
        reason: 'ALREADY_COMPLETED',
        submission: subSnap.data(),
      };
    }

    // 2. ALL WRITES AFTER READS
    const now = new Date().toISOString();
    const safePhotoUrl =
      params.photoUrl && params.photoUrl.length > 900000
        ? params.photoUrl.slice(0, 1000) + '...[photo-too-large-for-firestore]'
        : params.photoUrl;

    const submissionData = {
      submissionUid: params.submissionUid,
      userId: params.userId,
      uid: params.uid,
      imageSha256: params.imageSha256,
      mimeType: params.mimeType,
      byteSize: params.byteSize,
      photoUrl: safePhotoUrl,
      theme: params.theme,
      isAnimal: true,
      confidence: params.confidence,
      overallScore: params.overallScore,
      verdict: params.verdict,
      tierLabel: params.tierLabel,
      sharp: params.sharp,
      light: params.light,
      species: params.species,
      pose: params.pose,
      themeScore: params.themeScore,
      themeMatch: params.themeMatch,
      petName: params.petName,
      coinsReward: params.coinsReward,
      expReward: params.expReward,
      addedToGarden: false,
      petUid: null,
      createdAt: now,
    };

    transaction.set(subRef, submissionData);
    transaction.update(resRef, {
      status: 'COMPLETED',
      resultPayload: submissionData,
      completedAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      submission: submissionData,
    };
  });
}

export async function firestoreCompletePhotoReservation(params: {
  scopeKey: string;
  imageSha256: string;
  submissionUid: string;
  resultPayload: any;
}): Promise<{ completed: boolean; reason?: string }> {
  const docId = buildReservationDocId(params.scopeKey, params.imageSha256);
  const resRef = adminDb.collection('photoReservations').doc(docId);

  return adminDb.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(resRef);
    if (!docSnap.exists) {
      return { completed: false, reason: 'RESERVATION_NOT_FOUND' };
    }
    const data = docSnap.data() as PhotoReservationRecord;
    // Guard against superseded lease
    if (data.submissionUid !== params.submissionUid) {
      return { completed: false, reason: 'LEASE_SUPERSEDED' };
    }
    const nowIso = new Date().toISOString();
    transaction.update(resRef, {
      status: 'COMPLETED',
      resultPayload: params.resultPayload,
      completedAt: nowIso,
      updatedAt: nowIso,
    });
    return { completed: true };
  });
}

export async function firestoreFailPhotoReservation(params: {
  scopeKey: string;
  imageSha256: string;
  submissionUid?: string;
  error: string;
  errorType?: ReservationErrorType;
}): Promise<void> {
  const docId = buildReservationDocId(params.scopeKey, params.imageSha256);
  const resRef = adminDb.collection('photoReservations').doc(docId);

  return adminDb.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(resRef);
    if (!docSnap.exists) {
      return;
    }
    const data = docSnap.data() as PhotoReservationRecord;
    // Guard against superseded lease
    if (params.submissionUid && data.submissionUid !== params.submissionUid) {
      return;
    }
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const errorType =
      params.errorType ||
      (isTransientError(params.error) ? 'TRANSIENT' : 'PERMANENT');

    transaction.update(resRef, {
      status: 'FAILED',
      error: params.error.slice(0, 500),
      errorType,
      failedAt: nowIso,
      failedAtMs: now,
      updatedAt: nowIso,
    });
  });
}

export async function firestoreGetPhotoReservation(
  scopeKey: string,
  imageSha256: string
): Promise<PhotoReservationRecord | null> {
  const docId = buildReservationDocId(scopeKey, imageSha256);
  const snap = await adminDb.collection('photoReservations').doc(docId).get();
  if (!snap.exists) return null;
  return snap.data() as PhotoReservationRecord;
}

export async function firestoreResetPhotoReservation(params: {
  scopeKey: string;
  imageSha256: string;
}): Promise<void> {
  const docId = buildReservationDocId(params.scopeKey, params.imageSha256);
  const resRef = adminDb.collection('photoReservations').doc(docId);
  await resRef.delete();
}
