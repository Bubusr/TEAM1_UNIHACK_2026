import { getCurrentIdToken } from './firebase';
import type {
  CropType,
  FoodItemType,
  KeeperServerState,
  WalletInfo,
  Web3ConfigStatus,
} from '../types';

const GUEST_TOKEN_STORAGE_KEY = 'paws_guest_session_token';

export function getStoredGuestToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredGuestToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

export function newIdempotencyKey(prefix = 'act'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  authMode: 'none' | 'actor' | 'firebase' = 'actor'
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const firebaseToken = await getCurrentIdToken();
  const guestToken = getStoredGuestToken();

  if (firebaseToken) {
    headers.set('Authorization', `Bearer ${firebaseToken}`);
  } else if (authMode === 'firebase') {
    throw new Error('Please sign in with Google in Keeper Profile first.');
  } else if (guestToken) {
    headers.set('X-Guest-Token', guestToken);
  } else if (authMode === 'actor') {
    // Lazy-initialize server guest session before sending actor action
    const resGuest = await fetch('/api/guest/session', {
      method: 'POST',
      credentials: 'include',
    });
    if (resGuest.ok) {
      const gJson = (await resGuest.json()) as { guestToken?: string };
      if (gJson.guestToken) {
        setStoredGuestToken(gJson.guestToken);
        headers.set('X-Guest-Token', gJson.guestToken);
      }
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`
    );
  }
  return data as T;
}

export async function initGuestSession(): Promise<{
  guestToken: string;
  state: KeeperServerState;
}> {
  const headers = new Headers();
  const existing = getStoredGuestToken();
  if (existing) {
    headers.set('X-Guest-Token', existing);
  }
  const res = await fetch('/api/guest/session', {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || 'Failed to start guest session.'
    );
  }
  const typed = data as { guestToken: string; state: KeeperServerState };
  if (typed.guestToken) {
    setStoredGuestToken(typed.guestToken);
  }
  return typed;
}

let inflightMergePromise: Promise<{
  mergeResult: Record<string, unknown>;
  state: KeeperServerState;
}> | null = null;

export async function apiMergeGuestIntoKeeper(): Promise<{
  mergeResult: Record<string, unknown>;
  state: KeeperServerState;
}> {
  if (inflightMergePromise) {
    return inflightMergePromise;
  }
  const guestToken = getStoredGuestToken();
  inflightMergePromise = apiFetch<{
    mergeResult: Record<string, unknown>;
    state: KeeperServerState;
  }>(
    '/api/keeper/merge-guest',
    {
      method: 'POST',
      body: JSON.stringify({ guestToken }),
    },
    'firebase'
  )
    .then((res) => {
      setStoredGuestToken(null);
      return res;
    })
    .finally(() => {
      inflightMergePromise = null;
    });
  return inflightMergePromise;
}

export async function fetchWeb3Status(): Promise<Web3ConfigStatus> {
  return apiFetch<Web3ConfigStatus>('/api/web3/status', { method: 'GET' }, 'none');
}

export async function fetchKeeperState(): Promise<KeeperServerState> {
  return apiFetch<KeeperServerState>('/api/keeper/state', { method: 'GET' }, 'actor');
}

export async function apiJudgePhoto(params: {
  imageBase64: string;
  mimeType: string;
  theme: string;
}) {
  return apiFetch<Record<string, unknown>>(
    '/api/judge',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    'actor'
  );
}

export async function apiAddToGarden(
  submissionUid: string,
  cutoutPhotoUrl?: string
) {
  return apiFetch<{
    result: { petUid: string; coinsAdded?: number };
    state: KeeperServerState;
  }>(
    '/api/keeper/add-to-garden',
    {
      method: 'POST',
      body: JSON.stringify({
        submissionUid,
        cutoutPhotoUrl,
        idempotencyKey: newIdempotencyKey('garden'),
      }),
    },
    'actor'
  );
}

export async function apiCarePet(params: {
  petUid: string;
  actionType: 'pet' | 'feed' | 'play';
  food?: FoodItemType;
  toyId?: string;
}) {
  return apiFetch<{
    result: { toast?: string; bondXp?: number };
    state: KeeperServerState;
  }>(
    '/api/keeper/care',
    {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        idempotencyKey: newIdempotencyKey(params.actionType),
      }),
    },
    'actor'
  );
}

export async function apiClaimFirstBondQuest(petUid: string) {
  return apiFetch<{
    result: {
      claimed: boolean;
      petUid: string;
      coinsAwarded: number;
      expAwarded: number;
      toast?: string;
    };
    state: KeeperServerState;
  }>(
    '/api/keeper/quest/claim',
    {
      method: 'POST',
      body: JSON.stringify({
        petUid,
        idempotencyKey: newIdempotencyKey('quest'),
      }),
    },
    'actor'
  );
}

export async function apiGameAction(
  action: string,
  payload: Record<string, unknown> = {}
) {
  return apiFetch<{
    result: { toast?: string };
    state: KeeperServerState;
  }>(
    '/api/keeper/action',
    {
      method: 'POST',
      body: JSON.stringify({
        action,
        payload,
        idempotencyKey: newIdempotencyKey(action),
      }),
    },
    'actor'
  );
}

export async function apiRequestWalletNonce(walletAddress: string) {
  return apiFetch<{
    nonce: string;
    walletAddress: string;
    message: string;
    expiresAt: string;
  }>(
    '/api/wallet/nonce',
    {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    },
    'firebase'
  );
}

export async function apiVerifyWalletSignature(params: {
  walletAddress: string;
  nonce: string;
  signature: string;
}) {
  return apiFetch<{ wallet: WalletInfo }>(
    '/api/wallet/verify',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    'firebase'
  );
}

export async function apiUnlinkWallet() {
  return apiFetch<{ unlinked: boolean }>(
    '/api/wallet',
    {
      method: 'DELETE',
    },
    'firebase'
  );
}

export async function apiRequestMintClaim(
  petUid: string,
  consent?: { accepted: boolean; consentVersion: string }
) {
  return apiFetch<{
    chainId: number;
    contractAddress: string;
    claim: {
      recipient: string;
      petId?: string;
      petName?: string;
      species?: string;
      score?: number;
      tokenURI?: string;
      petIdHash: string;
      metadataUri: string;
      nonce: string;
      deadline: number;
      signature: string;
    };
  }>(
    '/api/web3/mint-claim',
    {
      method: 'POST',
      body: JSON.stringify({ petUid, consent, publicConsent: consent }),
    },
    'firebase'
  );
}

export async function apiConfirmMint(petUid: string, txHash: string) {
  return apiFetch<{
    confirmation: { tokenId: string; txHash: string; onChainOwner: string };
    state: KeeperServerState;
  }>(
    '/api/web3/confirm-mint',
    {
      method: 'POST',
      body: JSON.stringify({ petUid, txHash }),
    },
    'firebase'
  );
}

export async function apiReconcilePet(petUid: string) {
  return apiFetch<{
    result: {
      reconciled: boolean;
      inSync?: boolean;
      onChainOwner?: string;
      conflict?: boolean;
      reason?: string;
    };
    state: KeeperServerState;
  }>(
    `/api/web3/reconcile/${encodeURIComponent(petUid)}`,
    {
      method: 'POST',
    },
    'firebase'
  );
}

export interface SponsorCampaignItem {
  id: string;
  brandName: string;
  brandLogo: string;
  category: 'cafe' | 'campus' | 'pet_brand';
  campaignTitle: string;
  description: string;
  rewardCoins: number;
  perkDescription: string;
  budgetUsdc: number;
  remainingUsdc: number;
  active: boolean;
}

export interface DeFiVaultData {
  protocol: string;
  network: string;
  totalPooledUsdc: number;
  apyPercentage: number;
  yieldTodayUsdc: number;
  totalDistributedUsdc: number;
  activeSponsorsCount: number;
  lastUpdated: string;
}

export async function apiGetSponsorCampaigns() {
  return apiFetch<{ campaigns: SponsorCampaignItem[] }>(
    '/api/sponsors/campaigns',
    { method: 'GET' },
    'none'
  );
}

export async function apiGetVaultStats() {
  return apiFetch<{ vault: DeFiVaultData }>(
    '/api/vault/stats',
    { method: 'GET' },
    'none'
  );
}

export async function apiCheckGrantStatus(walletAddress: string) {
  return apiFetch<{ claimed: boolean }>(
    `/api/sponsors/status/${encodeURIComponent(walletAddress)}`,
    { method: 'GET' },
    'none'
  );
}

export async function apiClaimStudentGrant(walletAddress: string) {
  return apiFetch<{
    result: {
      success: boolean;
      txHash: string | null;
      coinsGranted: number;
      avaxGranted: string;
      sponsor: string;
      message: string;
    };
    state: KeeperServerState;
  }>(
    '/api/sponsors/claim-grant',
    {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    },
    'firebase'
  );
}

export type { CropType };
