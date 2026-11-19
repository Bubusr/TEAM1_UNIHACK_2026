import hardhatVerify from "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";
dotenv.config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

export default {
  solidity: {
    version: "0.8.38",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts/src",
    tests: "./contracts/test",
    cache: "./contracts/cache_hh",
    artifacts: "./contracts/artifacts_hh",
  },
  networks: {
    fuji: {
      type: "http",
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "verifyContract",
    },
    customChains: [
      {
        network: "avalancheFujiTestnet",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
    ],
  },
  plugins: [hardhatVerify],
};
