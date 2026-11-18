import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from './index.ts';
import { adminDb } from '../lib/firebase-admin.ts';
import { authNonces, mintClaims, pets, wallets } from './schema.ts';

export interface Web3PetRecord {
  id: number | string;
  petUid: string;
  currentOwnerId: number;
  currentOwnerUid?: string;
  name: string;
  species: string;
  pose: string;
  photoUrl: string;
  discoveryScore: number;
  bondXp: number;
  careCount: number;
  discoveredAt: Date;
  mintStatus: 'unminted' | 'pending' | 'minted';
  tokenId?: string | null;
  mintTxHash?: string | null;
  metadataUri?: string | null;
  ipfsCid?: string | null;
  originalDiscovererWallet: string | null;
  memories?: any[];
}

export interface Web3WalletRecord {
  address: string;
  chainId: number;
  verifiedAt: Date | string;
  userId?: number;
  uid?: string;
}

/**
 * Retrieve a pet record for Web3 metadata and mint-claim workflows,
 * abstracting Cloud Firestore vs PostgreSQL.
 */
export async function getPetForWeb3(petUid: string): Promise<Web3PetRecord | null> {
  const cleanUid = String(petUid || '').trim();
  if (!cleanUid) return null;

  if (!process.env.DATABASE_URL) {
    const petRef = adminDb.collection('pets').doc(cleanUid);
    const petDoc = await petRef.get();
    let data: any = null;

    if (petDoc.exists) {
      data = petDoc.data();
    } else {
      const q = await adminDb
        .collection('pets')
        .where('petUid', '==', cleanUid)
        .limit(1)
        .get();
      if (!q.empty) {
        data = q.docs[0].data();
      }
    }

    if (!data) return null;

    return {
      id: data.id || data.petUid || cleanUid,
      petUid: data.petUid || cleanUid,
      currentOwnerId: Number(data.currentOwnerId || 0),
      currentOwnerUid: data.currentOwnerUid || undefined,
      name: data.name || 'Pet',
      species: data.species || 'pet',
      pose: data.pose || 'Cozy',
      photoUrl: data.photoUrl || '',
      discoveryScore: Number(data.discoveryScore ?? data.score ?? 0),
      bondXp: Number(data.bondXp ?? 0),
      careCount: Number(data.careCount ?? 0),
      discoveredAt: data.discoveredAt ? new Date(data.discoveredAt) : new Date(),
      mintStatus: data.mintStatus || (data.minted ? 'minted' : 'unminted'),
      tokenId: data.tokenId || null,
      mintTxHash: data.mintTxHash || null,
      metadataUri: data.metadataUri || null,
      ipfsCid: data.ipfsCid || null,
      originalDiscovererWallet: data.originalDiscovererWallet || null,
      memories: data.memories || [],
    };
  }

  const [pet] = await db
    .select()
    .from(pets)
    .where(eq(pets.petUid, cleanUid))
    .limit(1);

  if (!pet) return null;

  return {
    id: pet.id,
    petUid: pet.petUid,
    currentOwnerId: pet.currentOwnerId,
    name: pet.name,
    species: pet.species,
    pose: pet.pose,
    photoUrl: pet.photoUrl,
    discoveryScore: pet.discoveryScore,
    bondXp: pet.bondXp,
    careCount: pet.careCount,
    discoveredAt: pet.discoveredAt,
    mintStatus: pet.mintStatus as any,
    tokenId: pet.tokenId,
    mintTxHash: pet.mintTxHash,
    metadataUri: pet.metadataUri,
    ipfsCid: pet.ipfsCid,
    originalDiscovererWallet: pet.originalDiscovererWallet ?? null,
    memories: pet.memories as any,
  };
}

/**
 * Retrieve a verified linked wallet record by userId and/or uid.
 */
export async function getLinkedWallet(params: {
  userId: number;
  uid?: string;
}): Promise<Web3WalletRecord | null> {
  if (!process.env.DATABASE_URL) {
    if (params.uid) {
      const q = await adminDb
        .collection('wallets')
        .where('uid', '==', params.uid)
        .limit(1)
        .get();
      if (!q.empty) {
        const d = q.docs[0].data();
        return {
          address: d.address,
          chainId: d.chainId || 43113,
          verifiedAt: d.verifiedAt || new Date().toISOString(),
          userId: params.userId,
          uid: params.uid,
        };
      }

      // Fallback check on user doc
      const uDoc = await adminDb.collection('users').doc(params.uid).get();
      if (uDoc.exists) {
        const uData = uDoc.data();
        if (uData?.wallet?.address) {
          return {
            address: uData.wallet.address,
            chainId: uData.wallet.chainId || 43113,
            verifiedAt: uData.wallet.verifiedAt || new Date().toISOString(),
            userId: params.userId,
            uid: params.uid,
          };
        }
      }
    }

    if (params.userId) {
      const qNum = await adminDb
        .collection('wallets')
        .where('userId', '==', params.userId)
        .limit(1)
        .get();
      if (!qNum.empty) {
        const d = qNum.docs[0].data();
        return {
          address: d.address,
          chainId: d.chainId || 43113,
          verifiedAt: d.verifiedAt || new Date().toISOString(),
          userId: params.userId,
          uid: d.uid,
        };
      }
    }

    return null;
  }

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, params.userId))
    .limit(1);

  if (!wallet) return null;

  return {
    address: wallet.address,
    chainId: wallet.chainId,
    verifiedAt: wallet.verifiedAt,
    userId: wallet.userId,
  };
}

/**
 * Record an issued signed mint claim voucher in database.
 */
export async function recordIssuedMintClaim(params: {
  petUid: string;
  userId: number;
  uid?: string;
  walletAddress: string;
  contractAddress: string;
  chainId: number;
  nonce: string;
  deadline: number;
  metadataUri: string;
  ipfsCid?: string | null;
  signature: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL) {
    const petRef = adminDb.collection('pets').doc(params.petUid);
    await petRef.set(
      {
        metadataUri: params.metadataUri,
        ipfsCid: params.ipfsCid || null,
      },
      { merge: true }
    );

    await adminDb
      .collection('mintClaims')
      .doc(`${params.petUid}_${params.nonce}`)
      .set({
        petUid: params.petUid,
        userId: params.userId,
        uid: params.uid || null,
        walletAddress: params.walletAddress,
        contractAddress: params.contractAddress,
        chainId: params.chainId,
        nonce: params.nonce,
        deadline: params.deadline,
        metadataUri: params.metadataUri,
        signature: params.signature,
        status: 'issued',
        createdAt: new Date().toISOString(),
      });
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(pets)
      .set({
        metadataUri: params.metadataUri,
        ipfsCid: params.ipfsCid || null,
      })
      .where(eq(pets.petUid, params.petUid));

    await tx.insert(mintClaims).values({
      petUid: params.petUid,
      userId: params.userId,
      walletAddress: params.walletAddress,
      contractAddress: params.contractAddress,
      chainId: params.chainId,
      nonce: params.nonce,
      deadline: params.deadline,
      metadataUri: params.metadataUri,
      signature: params.signature,
      status: 'issued',
    });
  });
}

/**
 * Record a confirmed on-chain mint transaction receipt in database.
 */
export async function recordConfirmedMint(params: {
  petUid: string;
  userId: number;
  uid?: string;
  tokenId: string;
  txHash: string;
  onChainOwner: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL) {
    const petRef = adminDb.collection('pets').doc(params.petUid);
    const snap = await petRef.get();
    const existing = snap.data() || {};

    if (existing.mintStatus === 'minted') {
      throw new Error('Pet was already confirmed as minted.');
    }

    const updatedMemories = [
      ...(existing.memories || []),
      {
        id: `mem-mint-${Date.now()}`,
        kind: 'mint',
        note: `Minted Pet Passport #${params.tokenId} on Avalanche Fuji.`,
        createdAt: new Date().toISOString(),
      },
    ];

    await petRef.set(
      {
        mintStatus: 'minted',
        minted: true,
        tokenId: params.tokenId,
        mintTxHash: params.txHash,
        onChainOwner: params.onChainOwner,
        memories: updatedMemories,
      },
      { merge: true }
    );
    return;
  }

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(pets)
      .where(eq(pets.petUid, params.petUid))
      .limit(1);

    if (existing?.mintStatus === 'minted') {
      throw new Error('Pet was already confirmed as minted.');
    }

    const updatedMemories = [
      ...(existing.memories || []),
      {
        id: `mem-mint-${Date.now()}`,
        kind: 'mint',
        note: `Minted Pet Passport #${params.tokenId} on Avalanche Fuji.`,
        createdAt: new Date().toISOString(),
      },
    ];

    await tx
      .update(pets)
      .set({
        mintStatus: 'minted',
        tokenId: params.tokenId,
        mintTxHash: params.txHash,
        onChainOwner: params.onChainOwner,
        memories: updatedMemories,
      })
      .where(eq(pets.petUid, params.petUid));
  });
}

/**
 * Store an auth challenge nonce for wallet binding.
 */
export async function storeWalletAuthNonce(params: {
  nonce: string;
  userId: number;
  uid: string;
  walletAddress: string;
  expiresAt: Date;
}): Promise<void> {
  if (!process.env.DATABASE_URL) {
    await adminDb.collection('authNonces').doc(params.nonce).set({
      nonce: params.nonce,
      userId: params.userId,
      uid: params.uid,
      walletAddress: params.walletAddress.toLowerCase(),
      expiresAt: params.expiresAt.toISOString(),
      consumedAt: null,
      createdAt: new Date().toISOString(),
    });
    return;
  }

  await db.insert(authNonces).values({
    nonce: params.nonce,
    userId: params.userId,
    walletAddress: params.walletAddress,
    expiresAt: params.expiresAt,
  });
}

/**
 * Verify, consume, and bind wallet to user account.
 */
export async function consumeNonceAndBindWallet(params: {
  nonce: string;
  userId: number;
  uid: string;
  walletAddress: string;
  chainId: number;
}): Promise<{ address: string; chainId: number; verifiedAt: string }> {
  const normalizedAddress = params.walletAddress.toLowerCase();
  const now = new Date();

  if (!process.env.DATABASE_URL) {
    const nonceRef = adminDb.collection('authNonces').doc(params.nonce);
    const nonceDoc = await nonceRef.get();
    if (!nonceDoc.exists) {
      throw new Error('Verification challenge expired, invalid, or already used.');
    }
    const nonceData = nonceDoc.data()!;
    if (nonceData.usedAt) {
      throw new Error('Verification challenge expired, invalid, or already used.');
    }
    if (new Date(nonceData.expiresAt).getTime() < now.getTime()) {
      throw new Error('Verification challenge expired, invalid, or already used.');
    }
    if (nonceData.walletAddress !== normalizedAddress) {
      throw new Error('Verification challenge address mismatch.');
    }

    // Mark nonce consumed
    await nonceRef.set({ usedAt: now.toISOString() }, { merge: true });

    // Check if wallet already linked to another keeper
    const existing = await adminDb
      .collection('wallets')
      .where('address', '==', normalizedAddress)
      .limit(1)
      .get();
    if (!existing.empty) {
      const exData = existing.docs[0].data();
      if (exData.uid && exData.uid !== params.uid) {
        throw new Error('This wallet address is already linked to another Keeper account.');
      }
    }

    // Store in wallets collection
    const walletRecord = {
      uid: params.uid,
      userId: params.userId,
      address: normalizedAddress,
      chainId: params.chainId,
      verifiedAt: now.toISOString(),
    };
    await adminDb.collection('wallets').doc(params.uid).set(walletRecord);

    // Also update user doc for fast state hydration
    await adminDb.collection('users').doc(params.uid).set(
      {
        wallet: {
          address: normalizedAddress,
          chainId: params.chainId,
          verifiedAt: now.toISOString(),
        },
      },
      { merge: true }
    );

    return {
      address: normalizedAddress,
      chainId: params.chainId,
      verifiedAt: now.toISOString(),
    };
  }

  return await db.transaction(async (tx) => {
    const [consumedNonce] = await tx
      .update(authNonces)
      .set({ usedAt: now })
      .where(
        and(
          eq(authNonces.nonce, params.nonce),
          eq(authNonces.walletAddress, normalizedAddress),
          eq(authNonces.userId, params.userId),
          isNull(authNonces.usedAt),
          gt(authNonces.expiresAt, now)
        )
      )
      .returning();

    if (!consumedNonce) {
      throw new Error('Verification challenge expired, invalid, or already used.');
    }

    const existingOwner = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.address, normalizedAddress))
      .limit(1);

    if (existingOwner.length > 0 && existingOwner[0].userId !== params.userId) {
      throw new Error(
        'This wallet address is already linked to another Keeper account.'
      );
    }

    const [bound] = await tx
      .insert(wallets)
      .values({
        userId: params.userId,
        address: normalizedAddress,
        chainId: params.chainId,
        verifiedAt: now,
      })
      .onConflictDoUpdate({
        target: wallets.userId,
        set: {
          address: normalizedAddress,
          chainId: params.chainId,
          verifiedAt: now,
        },
      })
      .returning();

    return {
      address: bound.address,
      chainId: bound.chainId,
      verifiedAt: bound.verifiedAt.toISOString(),
    };
  });
}

/**
 * Remove bound wallet from user account.
 */
export async function removeBoundWallet(params: {
  userId: number;
  uid?: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL) {
    if (params.uid) {
      await adminDb.collection('wallets').doc(params.uid).delete();
      await adminDb.collection('users').doc(params.uid).set(
        { wallet: null },
        { merge: true }
      );
    }
    return;
  }

  await db.delete(wallets).where(eq(wallets.userId, params.userId));
}
