import { ethers } from 'ethers';

export const AVALANCHE_MAINNET_CHAIN_ID = 43114;
export const FUJI_CHAIN_ID = 43113;
export const FUJI_CHAIN_HEX = '0xa869';

export const FUJI_PARAMS = {
  chainId: FUJI_CHAIN_HEX,
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

export function formatEvmChainName(chainId: number | null | undefined): string {
  if (chainId === FUJI_CHAIN_ID) return 'Avalanche Fuji Testnet (43113)';
  if (chainId === AVALANCHE_MAINNET_CHAIN_ID) {
    return 'Avalanche C-Chain Mainnet (43114)';
  }
  if (typeof chainId === 'number' && Number.isFinite(chainId)) {
    return `EVM Network (Chain ${chainId})`;
  }
  return 'Not Connected';
}

export function getWalletSecurityContext(): {
  origin: string;
  isIframe: boolean;
  isEphemeralPreviewHost: boolean;
} {
  if (typeof window === 'undefined') {
    return { origin: '', isIframe: false, isEphemeralPreviewHost: false };
  }
  let isIframe = false;
  try {
    isIframe = window.self !== window.top;
  } catch {
    isIframe = true;
  }
  const origin = window.location?.origin || '';
  const hostname = window.location?.hostname || '';
  const isEphemeralPreviewHost =
    hostname.endsWith('.run.app') ||
    hostname.startsWith('ais-dev-') ||
    hostname.startsWith('ais-pre-') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1';

  return { origin, isIframe, isEphemeralPreviewHost };
}

export class WalletRpcError extends Error {
  method: string;
  code?: number;

  constructor(method: string, message: string, code?: number) {
    const codeLabel = code !== undefined ? ` #${code}` : '';
    super(`[${method}${codeLabel}] ${message}`);
    this.name = 'WalletRpcError';
    this.method = method;
    this.code = code;
  }
}

function extractRpcErrorDetails(err: unknown): {
  code?: number;
  message: string;
} {
  if (err && typeof err === 'object') {
    const rec = err as {
      code?: unknown;
      message?: unknown;
      data?: { message?: unknown };
      info?: { error?: { code?: unknown; message?: unknown } };
    };
    const rawCode = rec.code ?? rec.info?.error?.code;
    const code =
      typeof rawCode === 'number' || typeof rawCode === 'string'
        ? Number(rawCode)
        : undefined;
    const normalizedCode = Number.isFinite(code) ? code : undefined;
    const rawMsg =
      (typeof rec.info?.error?.message === 'string' && rec.info.error.message) ||
      (typeof rec.data?.message === 'string' && rec.data.message) ||
      (typeof rec.message === 'string' && rec.message) ||
      'Wallet RPC request failed.';
    return { code: normalizedCode, message: rawMsg };
  }
  return {
    message: typeof err === 'string' ? err : 'Wallet RPC request failed.',
  };
}

async function callProviderRpc<T>(
  provider: EthereumProvider,
  method: string,
  params?: unknown[]
): Promise<T> {
  try {
    return (await provider.request(
      params !== undefined ? { method, params } : { method }
    )) as T;
  } catch (err) {
    if (err instanceof WalletRpcError) throw err;
    const { code, message } = extractRpcErrorDetails(err);
    if (code === 4001) {
      let friendlyMsg = 'Request cancelled or rejected in wallet.';
      if (method === 'eth_requestAccounts') {
        friendlyMsg = 'Wallet connection rejected by user.';
      } else if (method === 'wallet_switchEthereumChain') {
        friendlyMsg = 'User declined to switch to Avalanche Fuji Testnet.';
      } else if (method === 'wallet_addEthereumChain') {
        friendlyMsg = 'User declined to add Avalanche Fuji network to wallet.';
      } else if (method === 'personal_sign') {
        friendlyMsg = 'Message signing was rejected in wallet.';
      } else if (method === 'eth_sendTransaction') {
        friendlyMsg = 'Transaction was rejected in wallet.';
      }
      throw new WalletRpcError(method, friendlyMsg, 4001);
    }
    if (code === -32002) {
      throw new WalletRpcError(
        method,
        'A confirmation prompt is already pending in your wallet extension.',
        -32002
      );
    }
    if (code === -32601) {
      throw new WalletRpcError(
        method,
        `Wallet provider does not support ${method}.`,
        -32601
      );
    }
    throw new WalletRpcError(method, message, code);
  }
}

const PASSPORT_CLIENT_ABI = [
  'function mintWithClaim(address recipient, bytes32 petIdHash, string metadataUri, uint256 nonce, uint256 deadline, bytes signature) external returns (uint256)',
] as const;

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  isAvalanche?: boolean;
  isCoreWallet?: boolean;
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
}

interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo;
  provider: EthereumProvider;
}

const announcedProviders = new Map<string, Eip6963ProviderDetail>();
let eip6963Initialized = false;
let isHandlingAnnounceEvent = false;
let announceListenerRef: ((event: Event) => void) | null = null;

export function resetWalletDiscoveryForTest() {
  announcedProviders.clear();
  if (typeof window !== 'undefined' && announceListenerRef) {
    window.removeEventListener('eip6963:announceProvider', announceListenerRef);
  }
  announceListenerRef = null;
  eip6963Initialized = false;
  isHandlingAnnounceEvent = false;
}

function isValidEip1193Provider(
  candidate: unknown
): candidate is EthereumProvider {
  return Boolean(
    candidate &&
      typeof candidate === 'object' &&
      typeof (candidate as EthereumProvider).request === 'function'
  );
}

function initEip6963Discovery() {
  if (typeof window === 'undefined' || eip6963Initialized) return;
  eip6963Initialized = true;

  announceListenerRef = (event: Event) => {
    isHandlingAnnounceEvent = true;
    try {
      const custom = event as CustomEvent<Eip6963ProviderDetail>;
      const detail = custom.detail;
      if (detail?.info?.uuid && isValidEip1193Provider(detail.provider)) {
        announcedProviders.set(detail.info.uuid, detail);
      }
    } finally {
      isHandlingAnnounceEvent = false;
    }
  };
  window.addEventListener('eip6963:announceProvider', announceListenerRef);
  if (typeof Event === 'function' && !isHandlingAnnounceEvent) {
    try {
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    } catch {
      // ignore extensions that throw during initial synchronous EIP-6963 request
    }
  }
}

function isCoreDetail(detail: Eip6963ProviderDetail): boolean {
  const rdns = (detail.info.rdns || '').toLowerCase();
  const name = (detail.info.name || '').toLowerCase();
  return (
    rdns.includes('core') ||
    rdns.includes('avax') ||
    name.includes('core')
  );
}

export function resolvePreferredWalletProvider(): {
  provider: EthereumProvider | null;
  providerName: string;
  isCoreWallet: boolean;
} {
  if (typeof window === 'undefined') {
    return { provider: null, providerName: 'None', isCoreWallet: false };
  }

  initEip6963Discovery();

  // 1. Prioritize Core Extension announced via EIP-6963
  for (const detail of announcedProviders.values()) {
    if (isCoreDetail(detail) && isValidEip1193Provider(detail.provider)) {
      return {
        provider: detail.provider,
        providerName: detail.info.name || 'Core Wallet',
        isCoreWallet: true,
      };
    }
  }

  // 2. Fallback to Core Extension's dedicated injected window.avalanche provider
  const win = window as Window & {
    avalanche?: unknown;
    ethereum?: unknown;
  };
  if (isValidEip1193Provider(win.avalanche)) {
    return {
      provider: win.avalanche,
      providerName: 'Core Wallet',
      isCoreWallet: true,
    };
  }

  // 3. Fallback to any valid EIP-6963 EVM provider
  for (const detail of announcedProviders.values()) {
    if (isValidEip1193Provider(detail.provider)) {
      return {
        provider: detail.provider,
        providerName: detail.info.name || 'EVM Wallet',
        isCoreWallet: isCoreDetail(detail),
      };
    }
  }

  // 4. Legacy window.ethereum (check multi-provider array for Core first)
  if (win.ethereum && typeof win.ethereum === 'object') {
    const ethObj = win.ethereum as EthereumProvider;
    if (Array.isArray(ethObj.providers)) {
      const coreInArray = ethObj.providers.find(
        (p) => (p.isAvalanche || p.isCoreWallet) && isValidEip1193Provider(p)
      );
      if (coreInArray) {
        return {
          provider: coreInArray,
          providerName: 'Core Wallet',
          isCoreWallet: true,
        };
      }
      const firstInArray = ethObj.providers.find((p) => isValidEip1193Provider(p));
      if (firstInArray) {
        const label = firstInArray.isMetaMask ? 'MetaMask' : 'Browser EVM Wallet';
        return {
          provider: firstInArray,
          providerName: label,
          isCoreWallet: false,
        };
      }
    }
    if (isValidEip1193Provider(ethObj)) {
      const isCore = Boolean(ethObj.isAvalanche || ethObj.isCoreWallet);
      const label = isCore
        ? 'Core Wallet'
        : ethObj.isMetaMask
        ? 'MetaMask'
        : 'Browser EVM Wallet';
      return {
        provider: ethObj,
        providerName: label,
        isCoreWallet: isCore,
      };
    }
    return {
      provider: null,
      providerName: 'Unsupported Wallet',
      isCoreWallet: false,
    };
  }

  if (win.avalanche) {
    return {
      provider: null,
      providerName: 'Unsupported Wallet',
      isCoreWallet: false,
    };
  }

  return { provider: null, providerName: 'None', isCoreWallet: false };
}

export function subscribePreferredWalletEvents(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  initEip6963Discovery();
  const win = window as Window & {
    avalanche?: EthereumProvider;
    ethereum?: EthereumProvider;
  };
  let active = true;
  let notifyScheduled = false;
  const targets = new Set<EthereumProvider>();

  const scheduleNotify = () => {
    if (!active || notifyScheduled) return;
    notifyScheduled = true;
    queueMicrotask(() => {
      notifyScheduled = false;
      if (active) cb();
    });
  };

  const attachProvider = (p: unknown) => {
    if (!isValidEip1193Provider(p) || targets.has(p)) return;
    targets.add(p);
    p.on?.('accountsChanged', scheduleNotify);
    p.on?.('chainChanged', scheduleNotify);
  };

  attachProvider(win.avalanche);
  attachProvider(win.ethereum);
  for (const detail of announcedProviders.values()) {
    attachProvider(detail.provider);
  }

  const onAnnounce = (event: Event) => {
    const custom = event as CustomEvent<Eip6963ProviderDetail>;
    attachProvider(custom.detail?.provider);
    scheduleNotify();
  };

  window.addEventListener('eip6963:announceProvider', onAnnounce);
  return () => {
    active = false;
    for (const p of targets) {
      p.removeListener?.('accountsChanged', scheduleNotify);
      p.removeListener?.('chainChanged', scheduleNotify);
    }
    window.removeEventListener('eip6963:announceProvider', onAnnounce);
  };
}

export async function getBrowserWalletState(): Promise<{
  available: boolean;
  address: string | null;
  chainId: number | null;
  providerName: string;
  isCoreWallet: boolean;
}> {
  const { provider, providerName, isCoreWallet } =
    resolvePreferredWalletProvider();
  if (!provider) {
    return {
      available: false,
      address: null,
      chainId: null,
      providerName,
      isCoreWallet: false,
    };
  }
  try {
    const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
    const chainHex = (await provider.request({ method: 'eth_chainId' })) as string;
    const address = accounts?.[0] ? ethers.getAddress(accounts[0]) : null;
    const chainId = chainHex ? Number.parseInt(chainHex, 16) : null;
    return {
      available: true,
      address,
      chainId,
      providerName,
      isCoreWallet,
    };
  } catch {
    return {
      available: false,
      address: null,
      chainId: null,
      providerName: 'Unsupported Wallet',
      isCoreWallet: false,
    };
  }
}

export async function connectInjectedWallet(): Promise<{
  address: string;
  chainId: number;
  providerName: string;
  isCoreWallet: boolean;
}> {
  const { provider, providerName, isCoreWallet } =
    resolvePreferredWalletProvider();
  if (!provider) {
    throw new WalletRpcError(
      'eth_requestAccounts',
      'No desktop browser wallet detected. Install Core Extension (recommended) or an injected EVM wallet.'
    );
  }

  const accounts = await callProviderRpc<string[]>(
    provider,
    'eth_requestAccounts'
  );
  if (!accounts || accounts.length === 0) {
    throw new WalletRpcError(
      'eth_requestAccounts',
      'Wallet connection was cancelled or no account was selected.'
    );
  }

  const chainHex = await callProviderRpc<string>(provider, 'eth_chainId');
  const parsedChainId = Number.parseInt(chainHex, 16);
  if (!Number.isFinite(parsedChainId)) {
    throw new WalletRpcError(
      'eth_chainId',
      `Unexpected chain ID returned by wallet: ${String(chainHex)}`
    );
  }

  return {
    address: ethers.getAddress(accounts[0]),
    chainId: parsedChainId,
    providerName,
    isCoreWallet,
  };
}

export async function ensureFujiNetwork(): Promise<number> {
  const { provider } = resolvePreferredWalletProvider();
  if (!provider) {
    throw new WalletRpcError(
      'wallet_switchEthereumChain',
      'No desktop EVM wallet extension detected.'
    );
  }
  const currentHex = await callProviderRpc<string>(provider, 'eth_chainId');
  const currentId = Number.parseInt(currentHex, 16);
  if (currentId === FUJI_CHAIN_ID) return currentId;

  try {
    await callProviderRpc(provider, 'wallet_switchEthereumChain', [
      { chainId: FUJI_CHAIN_HEX },
    ]);
  } catch (err: unknown) {
    const rpcErr =
      err instanceof WalletRpcError
        ? err
        : new WalletRpcError(
            'wallet_switchEthereumChain',
            extractRpcErrorDetails(err).message,
            extractRpcErrorDetails(err).code
          );
    if (rpcErr.code === 4001) {
      throw rpcErr;
    }
    if (rpcErr.code === 4902) {
      await callProviderRpc(provider, 'wallet_addEthereumChain', [FUJI_PARAMS]);
    } else {
      throw rpcErr;
    }
  }

  const verifiedHex = await callProviderRpc<string>(provider, 'eth_chainId');
  const verifiedId = Number.parseInt(verifiedHex, 16);
  if (verifiedId !== FUJI_CHAIN_ID) {
    throw new WalletRpcError(
      'wallet_switchEthereumChain',
      'Please switch your wallet to Avalanche Fuji Testnet (43113).'
    );
  }
  return verifiedId;
}

export async function signChallengeMessage(
  message: string,
  expectedAddress?: string
): Promise<string> {
  const { provider } = resolvePreferredWalletProvider();
  if (!provider) {
    throw new WalletRpcError(
      'personal_sign',
      'No desktop EVM wallet extension detected.'
    );
  }

  let signerAddress: string;
  if (expectedAddress) {
    signerAddress = ethers.getAddress(expectedAddress);
  } else {
    let accounts = await callProviderRpc<string[]>(provider, 'eth_accounts');
    if (!accounts || accounts.length === 0) {
      accounts = await callProviderRpc<string[]>(
        provider,
        'eth_requestAccounts'
      );
    }
    if (!accounts || accounts.length === 0) {
      throw new WalletRpcError(
        'eth_accounts',
        'No active wallet account selected for signing.'
      );
    }
    signerAddress = ethers.getAddress(accounts[0]);
  }

  // Send direct EIP-1193 personal_sign with UTF-8 hex message so Core Extension prompts
  // cleanly across Avalanche Mainnet (43114), Fuji (43113), or any connected EVM network.
  const hexMessage = ethers.hexlify(ethers.toUtf8Bytes(message));
  const signature = await callProviderRpc<string>(provider, 'personal_sign', [
    hexMessage,
    signerAddress,
  ]);

  if (
    typeof signature !== 'string' ||
    !/^0x[a-fA-F0-9]{130,}$/.test(signature.trim())
  ) {
    throw new WalletRpcError(
      'personal_sign',
      'Wallet returned an invalid or empty EIP-191 signature.'
    );
  }
  return signature.trim();
}

export async function executeFujiMintTx(params: {
  contractAddress: string;
  recipient: string;
  petIdHash: string;
  metadataUri: string;
  nonce: string;
  deadline: number;
  signature: string;
}): Promise<string> {
  const { provider } = resolvePreferredWalletProvider();
  if (!provider) {
    throw new WalletRpcError(
      'eth_sendTransaction',
      'No desktop EVM wallet extension detected.'
    );
  }
  await ensureFujiNetwork();

  const browserProvider = new ethers.BrowserProvider(provider);
  const signer = await browserProvider.getSigner();
  const signerAddr = (await signer.getAddress()).toLowerCase();
  if (signerAddr !== params.recipient.toLowerCase()) {
    throw new Error(
      `Switch your active wallet account to your verified wallet (${params.recipient.slice(0, 6)}...${params.recipient.slice(-4)}).`
    );
  }

  const contract = new ethers.Contract(
    params.contractAddress,
    PASSPORT_CLIENT_ABI,
    signer
  );

  const tx = await contract.mintWithClaim(
    params.recipient,
    params.petIdHash,
    params.metadataUri,
    BigInt(params.nonce),
    BigInt(params.deadline),
    params.signature
  );
  const receipt = await tx.wait(1);
  if (!receipt || receipt.status !== 1) {
    throw new Error('Mint transaction failed on Avalanche Fuji.');
  }
  return tx.hash;
}
