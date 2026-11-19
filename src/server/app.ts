import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { adminAuth, adminDb } from '../lib/firebase-admin.ts';
import {
  requireAuth,
  requireGameActor,
  resolveOptionalGameActor,
  type AuthRequest,
} from '../middleware/auth.ts';
import { getFullKeeperState, getOrCreateUser } from '../db/users.ts';
import { db } from '../db/index.ts';
import { pets } from '../db/schema.ts';
import { createRateLimiter } from './rateLimit.ts';
import { analyzePetPhotoWithGemini, validateImageUpload } from './aiJudge.ts';
import {
  assertGuestSessionConfig,
  clearGuestCookie,
  extractGuestTokenDetails,
  extractGuestTokenFromRequest,
  isCrossSiteCookieMutation,
  issueGuestSessionToken,
  setGuestCookie,
  verifyGuestSessionToken,
} from './guestSession.ts';
import {
  addSubmissionToSanctuary,
  claimFirstBondQuest,
  judgeAndRecordPhoto,
  mergeGuestIntoKeeper,
  performGeneralGameAction,
  performPetCareAction,
} from './gameActions.ts';
import {
  issueWalletNonce,
  unlinkWallet,
  verifyAndBindWallet,
} from './walletAuth.ts';
import {
  buildPublicPetMetadata,
  confirmFujiMintTransaction,
  getCanonicalOrigin,
  getWeb3Status,
  isPetPubliclyAccessible,
  issueSignedMintClaim,
  reconcileMintedPetOwnership,
} from './web3Service.ts';
import { getPetForWeb3 } from '../db/web3Repository.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const PORT =
  Number.isFinite(parsedPort) && parsedPort > 0 && parsedPort <= 65535
    ? parsedPort
    : 3000;

function getPublicOrigin(req: express.Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && configured !== 'MY_APP_URL') {
    return configured.replace(/\/$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function getStatusCode(error: unknown, fallback = 400): number {
  if (
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return fallback;
}

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '12mb' }));
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.url.startsWith('/api')) {
        console.log(
          `[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - start}ms)`
        );
      }
    });
    next();
  });

  const rootDir = path.resolve(__dirname, '../../');
  app.use(
    '/src/assets/images',
    express.static(path.resolve(rootDir, 'src/assets/images'))
  );

  const judgeLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'judge',
  });
  const walletLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 15,
    keyPrefix: 'wallet',
  });
  const mintLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 12,
    keyPrefix: 'mint',
  });
  const actionLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 120,
    keyPrefix: 'action',
  });

  // Health check endpoints for Cloud Run, Kubernetes, and load balancers
  app.get(['/api/health', '/healthz'], (_req, res) => {
    return res.json({
      status: 'ok',
      service: 'paws-and-picket',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    });
  });

  // Public Web3 configuration status (never exposes private keys)
  app.get('/api/web3/status', (_req, res) => {
    return res.json(getWeb3Status());
  });

  // Public ERC-721 Pet Passport metadata JSON (no PII or EXIF)
  app.get('/api/metadata/:petUid', async (req, res) => {
    try {
      const petUid = String(req.params.petUid || '').trim();
      if (!petUid) return res.status(400).json({ error: 'Missing petUid.' });

      const pet = await getPetForWeb3(petUid);

      if (!pet) {
        return res.status(404).json({ error: 'Pet Passport not found.' });
      }

      if (!isPetPubliclyAccessible(pet)) {
        return res.status(404).json({
          error: 'Pet Passport metadata is not published or eligible for public view.',
        });
      }

      const canonicalOrigin = getCanonicalOrigin();
      if (!canonicalOrigin) {
        return res.status(503).json({
          error:
            'Public production origin is not configured on the server. Set APP_URL to a verified public HTTPS domain.',
        });
      }

      const publicImageUrl = `${canonicalOrigin}/api/pets/${encodeURIComponent(pet.petUid)}/portrait`;

      return res.json(
        buildPublicPetMetadata({
          petUid: pet.petUid,
          name: pet.name,
          species: pet.species,
          pose: pet.pose,
          discoveryScore: pet.discoveryScore,
          bondXp: pet.bondXp,
          careCount: pet.careCount,
          discoveredAt: pet.discoveredAt,
          originalDiscovererWallet: pet.originalDiscovererWallet,
          publicImageUrl,
        })
      );
    } catch (error) {
      console.error('Metadata lookup failed:', error);
      return res.status(500).json({ error: 'Failed to load Pet Passport metadata.' });
    }
  });

  // Public unauthenticated portrait image endpoint for Pet Passport tokens
  app.get('/api/pets/:petUid/portrait', async (req, res) => {
    try {
      const petUid = String(req.params.petUid || '').trim();
      if (!petUid) return res.status(400).send('Missing petUid');

      const pet = await getPetForWeb3(petUid);
      const photoUrl = pet?.photoUrl;

      if (!pet || !photoUrl) return res.status(404).send('Pet portrait not found');

      // Privacy boundary: ensure private/unpublished pets are not exposed
      if (!isPetPubliclyAccessible(pet)) {
        return res
          .status(404)
          .send('Pet portrait is private or not eligible for public viewing');
      }

      // 1. Data URL (uploaded pet photo in Firestore)
      if (photoUrl.startsWith('data:')) {
        const match = photoUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
        if (!match) return res.status(404).send('Invalid image format');
        const buf = Buffer.from(match[2], 'base64');
        res.setHeader('Content-Type', match[1]);
        res.setHeader('Content-Length', buf.length);
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
        return res.send(buf);
      }

      // 2. External HTTPS URL
      if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
        return res.redirect(302, photoUrl);
      }

      // 3. Local asset path (e.g. /src/assets/images/cropped_golden_dog_...)
      const cleanedRelPath = photoUrl.replace(/^\/+/, '');
      const absPath = path.resolve(rootDir, cleanedRelPath);
      if (absPath.startsWith(rootDir) && fs.existsSync(absPath)) {
        const ext = path.extname(absPath).toLowerCase();
        const mimeType =
          ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(absPath);
      }

      return res.status(404).send('Image file not found');
    } catch (error) {
      console.error('Portrait load failed:', error);
      return res.status(500).send('Error loading portrait');
    }
  });

  // Dedicated Pet Passport mint eligibility verification endpoint (P0.6 for Member 03 contract pipeline)
  app.get('/api/pets/:petUid/mint-eligibility', async (req, res) => {
    try {
      const petUid = String(req.params.petUid || '').trim();
      if (!petUid) {
        return res.status(400).json({ error: 'Missing petUid parameter.' });
      }

      let pet: any = null;
      if (!process.env.DATABASE_URL) {
        const petDoc = await adminDb.collection('pets').doc(petUid).get();
        if (petDoc.exists) {
          pet = petDoc.data();
        }
      } else {
        const [p] = await db
          .select()
          .from(pets)
          .where(eq(pets.petUid, petUid))
          .limit(1);
        pet = p || null;
      }

      if (!pet) {
        return res.status(404).json({ error: 'Pet not found.' });
      }

      const score = Number(pet.discoveryScore ?? pet.score ?? 0);
      const bondXp = Number(pet.bondXp ?? 0);
      const careCount = Number(pet.careCount ?? 0);
      const notMinted = pet.mintStatus !== 'minted';
      const imageScorePassed = score >= 80;
      const bondLevelPassed = bondXp >= 100;
      const firstBondQuestCompleted = Boolean(
        pet.questPetDone && pet.questFeedDone && pet.questPlayDone
      );
      const careEventsVerified = careCount >= 3;
      const validDiscovery = Boolean(pet.sourceSubmissionUid || score >= 80);
      const inSanctuary = Boolean(pet.currentOwnerId || pet.currentOwnerUid);

      const reasons: string[] = [];
      if (!notMinted) reasons.push('ALREADY_MINTED');
      if (!imageScorePassed) reasons.push('IMAGE_SCORE_TOO_LOW');
      if (!bondLevelPassed) reasons.push('BOND_LEVEL_TOO_LOW');
      if (!firstBondQuestCompleted) reasons.push('FIRST_BOND_QUEST_INCOMPLETE');

      const eligible =
        notMinted && imageScorePassed && bondLevelPassed && firstBondQuestCompleted;

      return res.json({
        eligible,
        petId: pet.petUid,
        reasons,
        requirements: {
          validDiscovery,
          confidencePassed: true,
          imageScorePassed,
          duplicateCheckPassed: true,
          inSanctuary,
          bondLevelPassed,
          firstBondQuestCompleted,
          careEventsVerified,
          notMinted,
        },
      });
    } catch (error) {
      console.error('GET /api/pets/:petUid/mint-eligibility failed:', error);
      return res
        .status(500)
        .json({ error: 'Failed to verify mint eligibility.' });
    }
  });

  // Hardened AI Photo Judge (requires authenticated keeper or HMAC-signed guest session)
  app.post('/api/judge', judgeLimiter, async (req, res) => {
    try {
      if (
        !process.env.GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY'
      ) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        });
      }

      const { imageBase64, mimeType, theme } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        theme?: string;
      };

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: 'Missing imageBase64 or mimeType.' });
      }

      // Check CSRF on cookies and resolve actor if present
      const actor = await resolveOptionalGameActor(req);

      // Validates format, MIME, and magic bytes (returns 400 if spoofed/invalid)
      validateImageUpload(imageBase64, mimeType);

      if (!actor) {
        return res.status(401).json({
          error: 'Sign in or initialize a guest session first.',
        });
      }

      const user = await getOrCreateUser(
        actor.uid,
        actor.email,
        actor.displayName,
        { isGuest: actor.isGuest }
      );

      const report = await judgeAndRecordPhoto({
        userId: user.id,
        uid: user.uid,
        imageBase64,
        mimeType,
        theme: theme || 'Fluffy Tails',
      });

      return res.json(report);
    } catch (error: unknown) {
      const code = getStatusCode(error, 500);
      const message =
        error instanceof Error ? error.message : 'Failed to analyze pet photo.';
      return res.status(code).json({ error: message });
    }
  });

  // Server-backed guest session initialization (HMAC-signed token + PostgreSQL persistence)
  app.post('/api/guest/session', actionLimiter, async (req, res) => {
    try {
      const { token: existingToken, source } = extractGuestTokenDetails(req);
      if (
        isCrossSiteCookieMutation(req, {
          requirePositiveSameOrigin: source === 'cookie',
        })
      ) {
        return res.status(403).json({ error: 'Cross-site request rejected.' });
      }
      const existing = verifyGuestSessionToken(existingToken);
      const session = existing
        ? { ...existing, token: existingToken! }
        : issueGuestSessionToken();

      setGuestCookie(res, req, session.token);

      const user = await getOrCreateUser(
        session.guestUid,
        `${session.guestId}@guest.local`,
        'Guest Keeper',
        { isGuest: true }
      );
      const state = await getFullKeeperState(user.id);
      return res.json({ guestToken: session.token, state });
    } catch (error) {
      const code = getStatusCode(error, 500);
      console.error('POST /api/guest/session failed:', error);
      const message =
        code === 503 && error instanceof Error
          ? error.message
          : 'Could not initialize guest session.';
      return res.status(code).json({ error: message });
    }
  });

  // Load or initialize Keeper / Guest PostgreSQL state
  app.get('/api/keeper/state', requireGameActor, async (req: AuthRequest, res) => {
    try {
      const actor = req.actor!;
      const user = await getOrCreateUser(
        actor.uid,
        actor.email,
        actor.displayName,
        { isGuest: actor.isGuest }
      );
      const state = await getFullKeeperState(user.id);
      return res.json(state);
    } catch (error) {
      console.error('GET /api/keeper/state failed:', error);
      return res.status(500).json({ error: 'Could not load sanctuary state.' });
    }
  });

  // Merge guest PostgreSQL progress safely into authenticated Google Keeper account
  app.post(
    '/api/keeper/merge-guest',
    requireAuth,
    actionLimiter,
    async (req: AuthRequest, res) => {
      try {
        const bodyGuest =
          typeof (req.body as { guestToken?: unknown })?.guestToken === 'string'
            ? (req.body as { guestToken: string }).guestToken
            : null;
        const rawGuestToken = bodyGuest || extractGuestTokenFromRequest(req);
        const verifiedGuest = verifyGuestSessionToken(rawGuestToken);

        const keeper = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || '',
          req.user!.name,
          { isGuest: false }
        );

        let mergeResult: Record<string, unknown> = { merged: false };
        if (verifiedGuest) {
          mergeResult = await mergeGuestIntoKeeper({
            guestUid: verifiedGuest.guestUid,
            keeperUserId: keeper.id,
            keeperUid: keeper.uid,
          });
          clearGuestCookie(res, req);
        }

        const state = await getFullKeeperState(keeper.id);
        return res.json({ mergeResult, state });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Could not merge guest data.';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Add judged submission into sanctuary garden (In-Game Pet Adoption)
  app.post(
    '/api/keeper/add-to-garden',
    requireGameActor,
    actionLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { submissionUid, idempotencyKey, cutoutPhotoUrl } = req.body as {
          submissionUid?: string;
          idempotencyKey?: string;
          cutoutPhotoUrl?: string;
        };
        if (!submissionUid || !idempotencyKey) {
          return res
            .status(400)
            .json({ error: 'Missing submissionUid or idempotencyKey.' });
        }
        const actor = req.actor!;
        const user = await getOrCreateUser(
          actor.uid,
          actor.email,
          actor.displayName,
          { isGuest: actor.isGuest }
        );
        const result = await addSubmissionToSanctuary({
          userId: user.id,
          uid: user.uid,
          submissionUid,
          idempotencyKey,
          cutoutPhotoUrl,
        });
        const state = await getFullKeeperState(user.id);
        return res.json({ result, state });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Failed to add pet to garden.';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Server-authoritative pet care (pet, feed, play) -> awards coins, Bond XP & updates per-pet quest flags
  app.post(
    '/api/keeper/care',
    requireGameActor,
    actionLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { petUid, actionType, food, toyId, idempotencyKey } = req.body as {
          petUid?: string;
          actionType?: 'pet' | 'feed' | 'play';
          food?: 'carrot' | 'berry' | 'catnip' | 'wheat' | 'apple' | 'peach';
          toyId?: string;
          idempotencyKey?: string;
        };
        if (!petUid || !actionType || !idempotencyKey) {
          return res
            .status(400)
            .json({ error: 'Missing petUid, actionType, or idempotencyKey.' });
        }
        const SUPPORTED_CARE_ACTIONS = ['pet', 'feed', 'play'] as const;
        if (
          typeof actionType !== 'string' ||
          !SUPPORTED_CARE_ACTIONS.includes(actionType as any)
        ) {
          return res.status(400).json({
            error: `Invalid care actionType. Must be one of: ${SUPPORTED_CARE_ACTIONS.join(', ')}.`,
          });
        }
        const actor = req.actor!;
        const user = await getOrCreateUser(
          actor.uid,
          actor.email,
          actor.displayName,
          { isGuest: actor.isGuest }
        );
        const result = await performPetCareAction({
          userId: user.id,
          uid: user.uid,
          petUid,
          actionType,
          food,
          toyId,
          idempotencyKey,
        });
        const state = await getFullKeeperState(user.id);
        return res.json({ result, state });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Pet care action failed.';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Server-verified First Bond Quest claim (Pet + Feed + Play + 100 Bond XP on one pet)
  app.post(
    '/api/keeper/quest/claim',
    requireGameActor,
    actionLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { petUid, idempotencyKey } = req.body as {
          petUid?: string;
          idempotencyKey?: string;
        };
        if (!petUid || !idempotencyKey) {
          return res
            .status(400)
            .json({ error: 'Missing petUid or idempotencyKey.' });
        }
        const actor = req.actor!;
        const user = await getOrCreateUser(
          actor.uid,
          actor.email,
          actor.displayName,
          { isGuest: actor.isGuest }
        );
        const result = await claimFirstBondQuest({
          userId: user.id,
          uid: user.uid,
          petUid,
          idempotencyKey,
        });
        const state = await getFullKeeperState(user.id);
        return res.json({ result, state });
      } catch (error) {
        const code = getStatusCode(error, 400);
        const msg =
          error instanceof Error ? error.message : 'Quest claim failed.';
        return res.status(code).json({ error: msg });
      }
    }
  );

  // Server-authoritative general sanctuary (including in-game rescue_stray), farm, market & neighbor actions
  app.post(
    '/api/keeper/action',
    requireGameActor,
    actionLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { action, payload, idempotencyKey } = req.body as {
          action?: string;
          payload?: Record<string, unknown>;
          idempotencyKey?: string;
        };
        if (!action || !idempotencyKey) {
          return res
            .status(400)
            .json({ error: 'Missing action or idempotencyKey.' });
        }
        const actor = req.actor!;
        const user = await getOrCreateUser(
          actor.uid,
          actor.email,
          actor.displayName,
          { isGuest: actor.isGuest }
        );
        if (action === 'claim_first_bond_quest') {
          const petUid = String(payload?.petUid || '');
          if (!petUid) {
            return res.status(400).json({ error: 'Missing petUid.' });
          }
          const result = await claimFirstBondQuest({
            userId: user.id,
            petUid,
            idempotencyKey,
          });
          const state = await getFullKeeperState(user.id);
          return res.json({ result, state });
        }
        const result = await performGeneralGameAction({
          userId: user.id,
          uid: user.uid,
          action,
          payload: payload || {},
          idempotencyKey,
        });
        const state = await getFullKeeperState(user.id);
        return res.json({ result, state });
      } catch (error) {
        const code = getStatusCode(error, 400);
        const msg =
          error instanceof Error ? error.message : 'Game action failed.';
        return res.status(code).json({ error: msg });
      }
    }
  );

  // Nonce-based EIP-191 wallet verification
  app.post(
    '/api/wallet/nonce',
    requireAuth,
    walletLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { walletAddress } = req.body as { walletAddress?: string };
        if (!walletAddress) {
          return res.status(400).json({ error: 'Missing walletAddress.' });
        }
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || '',
          req.user!.name
        );
        const challenge = await issueWalletNonce({
          userId: user.id,
          uid: user.uid,
          rawAddress: walletAddress,
        });
        return res.json(challenge);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Failed to create nonce.';
        return res.status(400).json({ error: msg });
      }
    }
  );

  app.post(
    '/api/wallet/verify',
    requireAuth,
    walletLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { walletAddress, nonce, signature } = req.body as {
          walletAddress?: string;
          nonce?: string;
          signature?: string;
        };
        if (!walletAddress || !nonce || !signature) {
          return res
            .status(400)
            .json({ error: 'Missing walletAddress, nonce, or signature.' });
        }
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || '',
          req.user!.name
        );
        const wallet = await verifyAndBindWallet({
          userId: user.id,
          uid: user.uid,
          rawAddress: walletAddress,
          nonce,
          signature,
        });
        return res.json({ wallet });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Wallet verification failed.';
        const statusCode = msg.includes('already linked') ? 409 : 400;
        return res.status(statusCode).json({ error: msg });
      }
    }
  );

  app.delete('/api/wallet', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name
      );
      await unlinkWallet(user.id, user.uid);
      return res.json({ unlinked: true });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Failed to unlink wallet.';
      return res.status(500).json({ error: msg });
    }
  });

  // EIP-712 Signed Mint Claim issuance (server checks score 80+ & Bond XP 100+)
  app.post(
    '/api/web3/mint-claim',
    requireAuth,
    mintLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { petUid } = req.body as { petUid?: string };
        if (!petUid) {
          return res.status(400).json({ error: 'Missing petUid.' });
        }
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || '',
          req.user!.name
        );
        const publicConsent =
          req.body.publicConsent ??
          (req.body.consent !== undefined
            ? {
                accepted: Boolean(req.body.consent?.accepted),
                consentVersion: req.body.consent?.consentVersion || '1.0',
              }
            : req.body.consentToPublicIpfs !== undefined
            ? {
                accepted: Boolean(req.body.consentToPublicIpfs),
                consentVersion: req.body.consentVersion,
              }
            : undefined);

        const claimData = await issueSignedMintClaim({
          userId: user.id,
          uid: user.uid,
          petUid,
          publicBaseUrl: getCanonicalOrigin(),
          publicConsent,
        });
        return res.json(claimData);
      } catch (error: any) {
        const code = getStatusCode(error, 400);
        const msg =
          error instanceof Error ? error.message : 'Failed to issue mint claim.';
        const responseBody: Record<string, unknown> = { error: msg };
        if (error?.code) responseBody.code = error.code;
        if (error?.supportedVersions) {
          responseBody.supportedVersions = error.supportedVersions;
        }
        return res.status(code).json(responseBody);
      }
    }
  );

  // Confirm Fuji mint receipt & PetMinted event before marking minted
  app.post(
    '/api/web3/confirm-mint',
    requireAuth,
    mintLimiter,
    async (req: AuthRequest, res) => {
      try {
        const { petUid, txHash } = req.body as {
          petUid?: string;
          txHash?: string;
        };
        if (!petUid || !txHash) {
          return res.status(400).json({ error: 'Missing petUid or txHash.' });
        }
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || '',
          req.user!.name
        );
        const confirmation = await confirmFujiMintTransaction({
          userId: user.id,
          uid: user.uid,
          petUid,
          txHash,
        });
        const state = await getFullKeeperState(user.id);
        return res.json({ confirmation, state });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Mint verification failed.';
        return res.status(400).json({ error: msg });
      }
    }
  );

  app.post(
    '/api/web3/reconcile/:petUid',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const petUid = String(req.params.petUid || '').trim();
        const result = await reconcileMintedPetOwnership(petUid);
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || '',
          req.user!.name
        );
        const state = await getFullKeeperState(user.id);
        return res.json({ result, state });
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Reconciliation failed.';
        return res.status(400).json({ error: msg });
      }
    }
  );

  // Player-to-player adoption ownership transfers are deferred to Phase 2.
  // In-game stray rescue (/api/keeper/action rescue_stray) and photo adoption (/api/keeper/add-to-garden) remain active.
  app.post('/api/adoptions/offer', requireAuth, (_req, res) => {
    return res.status(501).json({
      error:
        'Player-to-player adoption ownership transfers are scheduled for Phase 2 and disabled in Phase 1.',
    });
  });

  app.post('/api/adoptions/accept', requireAuth, (_req, res) => {
    return res.status(501).json({
      error:
        'Player-to-player adoption ownership transfers are scheduled for Phase 2 and disabled in Phase 1.',
    });
  });

  app.post('/api/adoptions/cancel', requireAuth, (_req, res) => {
    return res.status(501).json({
      error:
        'Player-to-player adoption ownership transfers are scheduled for Phase 2 and disabled in Phase 1.',
    });
  });

  // Global error handler for uncaught controller exceptions
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('[CRITICAL] Express uncaught API error:', err);
      const code = getStatusCode(err, 500);
      const msg = err instanceof Error ? err.message : 'Internal Server Error';
      res.status(code).json({ error: msg });
    }
  );

  return app;
}

export async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    assertGuestSessionConfig();
  }
  const app = createApp();
  const rootDir = path.resolve(__dirname, '../../');

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: rootDir,
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(rootDir, 'dist');
    app.use(
      '/src/assets/images',
      express.static(path.resolve(rootDir, 'src/assets/images'))
    );
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
) {
  startServer().catch((err) => {
    console.error(
      'Fatal server startup error:',
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  });
}
