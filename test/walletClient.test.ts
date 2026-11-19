import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { ethers } from 'ethers';
import {
  AVALANCHE_MAINNET_CHAIN_ID,
  FUJI_CHAIN_ID,
  FUJI_CHAIN_HEX,
  FUJI_PARAMS,
  WalletRpcError,
  connectInjectedWallet,
  ensureFujiNetwork,
  formatEvmChainName,
  getBrowserWalletState,
  resetWalletDiscoveryForTest,
  resolvePreferredWalletProvider,
  signChallengeMessage,
  subscribePreferredWalletEvents,
  type EthereumProvider,
} from '../src/lib/walletClient.ts';

function createMockWindow(props: {
  avalanche?: unknown;
  ethereum?: unknown;
  eip6963Details?: Array<{
    info: { uuid: string; name: string; icon: string; rdns: string };
    provider: EthereumProvider;
  }>;
}) {
  const target = new EventTarget();
  const win = {
    avalanche: props.avalanche,
    ethereum: props.ethereum,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  };

  if (props.eip6963Details && props.eip6963Details.length > 0) {
    target.addEventListener('eip6963:requestProvider', () => {
      for (const detail of props.eip6963Details!) {
        target.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', { detail })
        );
      }
    });
  }

  return win;
}

function makeProvider(opts?: {
  address?: string;
  chainIdHex?: string;
  isMetaMask?: boolean;
  isAvalanche?: boolean;
  isCoreWallet?: boolean;
  shouldThrow?: boolean;
}): EthereumProvider {
  return {
    isMetaMask: opts?.isMetaMask,
    isAvalanche: opts?.isAvalanche,
    isCoreWallet: opts?.isCoreWallet,
    request: async ({ method }) => {
      if (opts?.shouldThrow) {
        throw new Error('Unsupported method');
      }
      if (method === 'eth_accounts') {
        return opts?.address ? [opts.address] : [];
      }
      if (method === 'eth_chainId') {
        return opts?.chainIdHex ?? '0xa869';
      }
      return null;
    },
  };
}

describe('Wallet Discovery Prioritization, Fallbacks & UI States', () => {
  const g = globalThis as unknown as { window?: unknown };

  afterEach(() => {
    resetWalletDiscoveryForTest();
    delete g.window;
  });

  it('prioritizes EIP-6963 Core Wallet over MetaMask even when MetaMask announces first', async () => {
    const metamaskProvider = makeProvider({
      address: '0x1111111111111111111111111111111111111111',
      chainIdHex: '0x1',
      isMetaMask: true,
    });
    const coreProvider = makeProvider({
      address: '0x2222222222222222222222222222222222222222',
      chainIdHex: '0xa869',
      isAvalanche: true,
      isCoreWallet: true,
    });

    g.window = createMockWindow({
      ethereum: metamaskProvider,
      eip6963Details: [
        {
          info: {
            uuid: 'mm-uuid-1',
            name: 'MetaMask',
            icon: '',
            rdns: 'io.metamask',
          },
          provider: metamaskProvider,
        },
        {
          info: {
            uuid: 'core-uuid-2',
            name: 'Core',
            icon: '',
            rdns: 'app.core',
          },
          provider: coreProvider,
        },
      ],
    });

    const resolved = resolvePreferredWalletProvider();
    assert.equal(resolved.isCoreWallet, true);
    assert.equal(resolved.providerName, 'Core');
    assert.equal(resolved.provider, coreProvider);

    const state = await getBrowserWalletState();
    assert.equal(state.available, true);
    assert.equal(state.isCoreWallet, true);
    assert.equal(state.chainId, 43113);
    assert.equal(state.address, '0x2222222222222222222222222222222222222222');
  });

  it('falls back to window.avalanche when EIP-6963 only announces non-Core wallets', async () => {
    const metamaskProvider = makeProvider({
      address: '0x1111111111111111111111111111111111111111',
      chainIdHex: '0x1',
      isMetaMask: true,
    });
    const avalancheProvider = makeProvider({
      address: '0x3333333333333333333333333333333333333333',
      chainIdHex: '0xa869',
      isAvalanche: true,
    });

    g.window = createMockWindow({
      avalanche: avalancheProvider,
      ethereum: metamaskProvider,
      eip6963Details: [
        {
          info: {
            uuid: 'mm-uuid-only',
            name: 'MetaMask',
            icon: '',
            rdns: 'io.metamask',
          },
          provider: metamaskProvider,
        },
      ],
    });

    const resolved = resolvePreferredWalletProvider();
    assert.equal(resolved.isCoreWallet, true);
    assert.equal(resolved.providerName, 'Core Wallet');
    assert.equal(resolved.provider, avalancheProvider);

    const state = await getBrowserWalletState();
    assert.equal(state.available, true);
    assert.equal(state.isCoreWallet, true);
    assert.equal(state.chainId, 43113);
    assert.equal(state.address, '0x3333333333333333333333333333333333333333');
  });

  it('falls back to generic window.ethereum and handles window.ethereum.providers arrays', async () => {
    const mm = makeProvider({
      address: '0x4444444444444444444444444444444444444444',
      chainIdHex: '0x1',
      isMetaMask: true,
    });
    g.window = createMockWindow({ ethereum: mm });

    const singleState = await getBrowserWalletState();
    assert.equal(singleState.available, true);
    assert.equal(singleState.isCoreWallet, false);
    assert.equal(singleState.providerName, 'MetaMask');
    assert.equal(singleState.chainId, 1);

    resetWalletDiscoveryForTest();
    const coreInArray = makeProvider({
      address: '0x5555555555555555555555555555555555555555',
      chainIdHex: '0xa869',
      isCoreWallet: true,
    });
    g.window = createMockWindow({
      ethereum: {
        providers: [mm, coreInArray],
        request: mm.request,
      },
    });
    const multiResolved = resolvePreferredWalletProvider();
    assert.equal(multiResolved.isCoreWallet, true);
    assert.equal(multiResolved.providerName, 'Core Wallet');
    assert.equal(multiResolved.provider, coreInArray);
  });

  it('reports no-wallet and unsupported-wallet states safely and matches Keeper UI branches', async () => {
    // 1. No wallet present
    g.window = createMockWindow({});
    const noWallet = await getBrowserWalletState();
    assert.equal(noWallet.available, false);
    assert.equal(noWallet.providerName, 'None');
    assert.equal(noWallet.isCoreWallet, false);

    // 2. Non-EIP-1193 injected object on window.ethereum
    resetWalletDiscoveryForTest();
    g.window = createMockWindow({ ethereum: { isWeirdExtension: true } });
    const nonEip1193 = await getBrowserWalletState();
    assert.equal(nonEip1193.available, false);
    assert.equal(nonEip1193.providerName, 'Unsupported Wallet');
    assert.equal(nonEip1193.isCoreWallet, false);

    // 3. Provider whose EIP-1193 request throws
    resetWalletDiscoveryForTest();
    g.window = createMockWindow({
      ethereum: makeProvider({ shouldThrow: true }),
    });
    const brokenWallet = await getBrowserWalletState();
    assert.equal(brokenWallet.available, false);
    assert.equal(brokenWallet.providerName, 'Unsupported Wallet');
    assert.equal(brokenWallet.isCoreWallet, false);

    // 4. Verify CreamSheets renders distinct labels for No Extension vs Unsupported Wallet
    const creamSheetsSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/CreamSheets.tsx'),
      'utf8'
    );
    assert.ok(creamSheetsSrc.includes("'No Extension Detected'"));
    assert.ok(creamSheetsSrc.includes("'Unsupported Wallet'"));
    assert.ok(creamSheetsSrc.includes("'Unsupported EVM Provider'"));
  });

  it('does not re-dispatch eip6963:requestProvider inside announce handlers (prevents InvalidStateError with cached extension events)', async () => {
    const coreProvider = makeProvider({
      address: '0x2222222222222222222222222222222222222222',
      chainIdHex: '0xa869',
      isAvalanche: true,
      isCoreWallet: true,
    });
    const target = new EventTarget();
    const cachedAnnounceEvent = new CustomEvent('eip6963:announceProvider', {
      detail: {
        info: {
          uuid: 'core-cached-1',
          name: 'Core',
          icon: '',
          rdns: 'app.core',
        },
        provider: coreProvider,
      },
    });
    let requestProviderCount = 0;
    target.addEventListener('eip6963:requestProvider', () => {
      requestProviderCount += 1;
      // Core Extension dispatches the exact same cached CustomEvent instance
      target.dispatchEvent(cachedAnnounceEvent);
    });

    g.window = {
      addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
    };

    const callbackCalls: number[] = [];
    const unsub = subscribePreferredWalletEvents(() => {
      callbackCalls.push(1);
      // Calling resolvePreferredWalletProvider / getBrowserWalletState from subscriber must NOT re-dispatch requestProvider
      void getBrowserWalletState();
    });

    // Trigger initial wallet read + simulate a subsequent extension re-announce using the same cached Event instance
    const initial = await getBrowserWalletState();
    assert.equal(initial.isCoreWallet, true);
    assert.equal(requestProviderCount, 1);

    target.dispatchEvent(cachedAnnounceEvent);
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.equal(requestProviderCount, 1);
    assert.equal(callbackCalls.length, 1);
    unsub();
  });

  it('connects Core on Avalanche C-Chain Mainnet (43114), triggers readable personal_sign EIP-191 prompt without chain switch, and switches/adds Fuji (43113) on explicit request', async () => {
    const testWallet = ethers.Wallet.createRandom();
    let currentChainHex = '0xa86a'; // 43114 Avalanche Mainnet
    let addedChainParams: unknown = null;
    const rpcLog: Array<{ method: string; params?: unknown[] }> = [];

    const coreProvider: EthereumProvider = {
      isAvalanche: true,
      isCoreWallet: true,
      request: async ({ method, params }) => {
        rpcLog.push({ method, params });
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
          return [testWallet.address];
        }
        if (method === 'eth_chainId') {
          return currentChainHex;
        }
        if (method === 'personal_sign') {
          const hexMsg = String(params?.[0] ?? '');
          const decoded = ethers.toUtf8String(hexMsg);
          return testWallet.signMessage(decoded);
        }
        if (method === 'wallet_switchEthereumChain') {
          const target = (params?.[0] as { chainId?: string })?.chainId;
          if (target === FUJI_CHAIN_HEX && !addedChainParams) {
            const err = new Error('Unrecognized chain ID') as Error & { code: number };
            err.code = 4902;
            throw err;
          }
          currentChainHex = target || FUJI_CHAIN_HEX;
          return null;
        }
        if (method === 'wallet_addEthereumChain') {
          addedChainParams = params?.[0];
          currentChainHex = FUJI_CHAIN_HEX;
          return null;
        }
        return null;
      },
    };

    g.window = createMockWindow({
      avalanche: coreProvider,
    });

    // 1. Identify 43114 correctly & connect without forcing chain switch
    assert.equal(
      formatEvmChainName(AVALANCHE_MAINNET_CHAIN_ID),
      'Avalanche C-Chain Mainnet (43114)'
    );
    assert.equal(
      formatEvmChainName(FUJI_CHAIN_ID),
      'Avalanche Fuji Testnet (43113)'
    );

    const connected = await connectInjectedWallet();
    assert.equal(connected.isCoreWallet, true);
    assert.equal(connected.chainId, 43114);
    assert.equal(connected.address.toLowerCase(), testWallet.address.toLowerCase());
    assert.ok(!rpcLog.some((c) => c.method === 'wallet_switchEthereumChain'));

    // 2. Direct personal_sign EIP-191 prompt on chain 43114 produces verifiable signature
    const challengeMsg = [
      'Paws & Picket Keeper Wallet Verification',
      'Account: keeper-123',
      `Wallet: ${testWallet.address}`,
      'Chain ID: 43113',
      'Nonce: abc123',
    ].join('\n');
    const sig = await signChallengeMessage(challengeMsg, connected.address);
    assert.equal(
      ethers.verifyMessage(challengeMsg, sig).toLowerCase(),
      testWallet.address.toLowerCase()
    );
    const personalSignCall = rpcLog.find((c) => c.method === 'personal_sign');
    assert.ok(personalSignCall);
    assert.equal(
      ethers.toUtf8String(String(personalSignCall.params?.[0])),
      challengeMsg
    );

    // 3. Explicit Fuji switch attempts wallet_switchEthereumChain (0xa869) and falls back to wallet_addEthereumChain on 4902
    const switchedChainId = await ensureFujiNetwork();
    assert.equal(switchedChainId, 43113);
    assert.deepEqual(addedChainParams, FUJI_PARAMS);
  });

  it('surfaces exact failed JSON-RPC method & code on user rejection (4001) or unsupported signature RPC (-32601), and updates cleanly on accountsChanged / chainChanged', async () => {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    let activeAddress = '0x1111111111111111111111111111111111111111';
    let activeChainHex = '0xa86a'; // 43114
    let mode: 'reject-connect' | 'reject-sign' | 'unsupported-sign' | 'ok' = 'reject-connect';

    const provider: EthereumProvider = {
      isAvalanche: true,
      isCoreWallet: true,
      on: (evt, fn) => {
        if (!listeners.has(evt)) listeners.set(evt, new Set());
        listeners.get(evt)!.add(fn);
      },
      removeListener: (evt, fn) => {
        listeners.get(evt)?.delete(fn);
      },
      request: async ({ method }) => {
        if (method === 'eth_requestAccounts') {
          if (mode === 'reject-connect') {
            const err = new Error('User rejected request') as Error & { code: number };
            err.code = 4001;
            throw err;
          }
          return [activeAddress];
        }
        if (method === 'eth_accounts') return [activeAddress];
        if (method === 'eth_chainId') return activeChainHex;
        if (method === 'personal_sign') {
          if (mode === 'reject-sign') {
            const err = new Error('User denied message signature') as Error & { code: number };
            err.code = 4001;
            throw err;
          }
          if (mode === 'unsupported-sign') {
            const err = new Error('Method not supported') as Error & { code: number };
            err.code = -32601;
            throw err;
          }
        }
        return null;
      },
    };

    g.window = createMockWindow({ avalanche: provider });

    // Cancelled connect (4001)
    await assert.rejects(
      () => connectInjectedWallet(),
      (err: unknown) =>
        err instanceof WalletRpcError &&
        err.method === 'eth_requestAccounts' &&
        err.code === 4001
    );

    // Cancelled signature (4001)
    mode = 'reject-sign';
    await assert.rejects(
      () => signChallengeMessage('hello', activeAddress),
      (err: unknown) =>
        err instanceof WalletRpcError &&
        err.method === 'personal_sign' &&
        err.code === 4001
    );

    // Unsupported signature RPC (-32601)
    mode = 'unsupported-sign';
    await assert.rejects(
      () => signChallengeMessage('hello', activeAddress),
      (err: unknown) =>
        err instanceof WalletRpcError &&
        err.method === 'personal_sign' &&
        err.code === -32601
    );

    // accountsChanged & chainChanged event propagation
    let eventCount = 0;
    const unsub = subscribePreferredWalletEvents(() => {
      eventCount += 1;
    });

    activeAddress = '0x9999999999999999999999999999999999999999';
    for (const fn of listeners.get('accountsChanged') || []) fn([activeAddress]);
    activeChainHex = FUJI_CHAIN_HEX;
    for (const fn of listeners.get('chainChanged') || []) fn(FUJI_CHAIN_HEX);

    await new Promise((r) => setTimeout(r, 10));
    assert.ok(eventCount >= 1);
    const updatedState = await getBrowserWalletState();
    assert.equal(updatedState.address, '0x9999999999999999999999999999999999999999');
    assert.equal(updatedState.chainId, 43113);
    unsub();
  });

  it('differentiates distinct human-readable errors for connection rejection, network switch decline, missing account, and missing provider', async () => {
    // 1. Missing provider
    delete g.window;
    await assert.rejects(
      () => connectInjectedWallet(),
      (err: unknown) =>
        err instanceof WalletRpcError &&
        err.message.includes('No desktop browser wallet detected')
    );

    // 2. Empty accounts returned
    const emptyProvider: EthereumProvider = {
      request: async ({ method }) => {
        if (method === 'eth_requestAccounts') return [];
        if (method === 'eth_chainId') return '0xa869';
        return null;
      },
    };
    g.window = createMockWindow({ avalanche: emptyProvider });
    await assert.rejects(
      () => connectInjectedWallet(),
      (err: unknown) =>
        err instanceof WalletRpcError &&
        err.message.includes('Wallet connection was cancelled or no account was selected')
    );

    // 3. User rejects connection (4001)
    const rejectConnectProvider: EthereumProvider = {
      request: async ({ method }) => {
        if (method === 'eth_requestAccounts') {
          const err = new Error('User rejected') as Error & { code: number };
          err.code = 4001;
          throw err;
        }
        return null;
      },
    };
    g.window = createMockWindow({ avalanche: rejectConnectProvider });
    await assert.rejects(
      () => connectInjectedWallet(),
      (err: unknown) =>
        err instanceof WalletRpcError &&
        err.message.includes('Wallet connection rejected by user')
    );

    // 4. User declines network switch (4001)
    const rejectSwitchProvider: EthereumProvider = {
      request: async ({ method }) => {
        if (method === 'eth_chainId') return '0x1'; // Ethereum Mainnet
        if (method === 'wallet_switchEthereumChain') {
          const err = new Error('User declined switch') as Error & { code: number };
          err.code = 4001;
          throw err;
        }
        return null;
      },
    };
    g.window = createMockWindow({ avalanche: rejectSwitchProvider });
    await assert.rejects(
      () => ensureFujiNetwork(),
      (err: unknown) =>
        err instanceof WalletRpcError &&
        err.message.includes('User declined to switch to Avalanche Fuji Testnet')
    );
  });
});
