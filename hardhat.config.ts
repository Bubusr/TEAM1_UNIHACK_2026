import 'dotenv/config';
import { defineConfig } from 'hardhat/config';
import hardhatEthers from '@nomicfoundation/hardhat-ethers';

const fujiAccounts = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : [];

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31337,
    },
    ...(fujiAccounts.length > 0
      ? {
          fuji: {
            type: 'http',
            url:
              process.env.AVALANCHE_FUJI_RPC_URL?.trim() ||
              'https://api.avax-test.network/ext/bc/C/rpc',
            chainId: Number(process.env.AVALANCHE_CHAIN_ID || 43113),
            accounts: fujiAccounts,
          },
        }
      : {}),
  },
});
