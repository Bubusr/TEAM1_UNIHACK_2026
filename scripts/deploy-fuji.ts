import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  Hex,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to ensure key is valid hex
function formatKey(key: string): Hex {
  return (key.startsWith('0x') ? key : `0x${key}`) as Hex;
}

async function main() {
  console.log('=====================================================');
  console.log(' Avalanche Fuji Deployment: PawsAndPicketPassport');
  console.log('=====================================================\n');

  const envPath = path.resolve(rootDir, '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  let deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
  let signerKey = process.env.BACKEND_SIGNER_PRIVATE_KEY;

  let envUpdated = false;

  // Auto-generate keys if not present so user has immediate addresses
  if (!deployerKey || deployerKey === 'YOUR_DEPLOYER_PRIVATE_KEY') {
    deployerKey = generatePrivateKey();
    envContent += `\nDEPLOYER_PRIVATE_KEY="${deployerKey}"`;
    envUpdated = true;
    console.log('Generated new DEPLOYER_PRIVATE_KEY in .env');
  }

  if (!signerKey || signerKey === 'YOUR_BACKEND_SIGNER_PRIVATE_KEY') {
    signerKey = generatePrivateKey();
    envContent += `\nBACKEND_SIGNER_PRIVATE_KEY="${signerKey}"`;
    envUpdated = true;
    console.log('Generated new BACKEND_SIGNER_PRIVATE_KEY in .env');
  }

  if (envUpdated) {
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  }

  const deployerAccount = privateKeyToAccount(formatKey(deployerKey));
  const signerAccount = privateKeyToAccount(formatKey(signerKey));

  console.log(`Deployer Address : ${deployerAccount.address}`);
  console.log(`Signer Address   : ${signerAccount.address}`);

  const rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';

  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(rpcUrl),
  });

  // 1. Verify Chain ID
  console.log('\nChecking network connectivity...');
  const chainId = await publicClient.getChainId();
  if (chainId !== 43113) {
    throw new Error(`Invalid Chain ID: expected 43113 (Fuji), got ${chainId}`);
  }
  console.log(`Connected to Avalanche Fuji (Chain ID: ${chainId})`);

  // 2. Check balance
  const balance = await publicClient.getBalance({ address: deployerAccount.address });
  const balanceAvax = formatEther(balance);
  console.log(`Deployer Balance : ${balanceAvax} AVAX`);

  if (balance < 10000000000000000n) { // Minimum 0.01 AVAX
    console.log('\n-----------------------------------------------------');
    console.log('  INSUFFICIENT FUJI TESTNET AVAX');
    console.log('-----------------------------------------------------');
    console.log(`Your deployer address is: ${deployerAccount.address}`);
    console.log('Please get free Avalanche Fuji test AVAX from:');
    console.log('  1. https://core.app/tools/testnet-faucet/?subnet=c&token=c');
    console.log('  2. or https://faucet.avax.network/');
    console.log('\nAfter claiming faucet tokens, re-run:');
    console.log('  npm run deploy:fuji');
    console.log('-----------------------------------------------------\n');
    process.exit(1);
  }

  // 3. Load Artifact
  const artifactPath = path.resolve(rootDir, 'src', 'contracts', 'PawsAndPicketPassport.json');
  if (!fs.existsSync(artifactPath)) {
    throw new Error('Contract artifact missing. Run `npm run compile:contracts` first.');
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const walletClient = createWalletClient({
    account: deployerAccount,
    chain: avalancheFuji,
    transport: http(rpcUrl),
  });

  console.log('\nBroadcasting deployment transaction to Avalanche Fuji...');
  const deployHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [signerAccount.address, deployerAccount.address],
  });

  console.log(`Transaction sent! Hash: ${deployHash}`);
  console.log('Waiting for block confirmation on Avalanche Fuji...');

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: deployHash,
    confirmations: 1,
  });

  const contractAddress = receipt.contractAddress!;
  console.log('\n=====================================================');
  console.log(' DEPLOYMENT SUCCESSFUL!');
  console.log('=====================================================');
  console.log(`Contract Address : ${contractAddress}`);
  console.log(`Transaction Hash : ${deployHash}`);
  console.log(`Block Number     : ${receipt.blockNumber}`);
  console.log(`Gas Used         : ${receipt.gasUsed.toString()}`);
  console.log(`Snowtrace Link   : https://testnet.snowtrace.io/address/${contractAddress}`);
  console.log('=====================================================\n');

  // 4. Save Deployment Record
  const deploymentInfo = {
    network: 'avalanche-fuji',
    chainId: 43113,
    contractAddress,
    deployerAddress: deployerAccount.address,
    trustedSignerAddress: signerAccount.address,
    deployTxHash: deployHash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `https://testnet.snowtrace.io/address/${contractAddress}`,
    deployedAt: new Date().toISOString(),
  };

  const contractsDir = path.resolve(rootDir, 'src', 'contracts');
  fs.writeFileSync(
    path.resolve(contractsDir, 'deployment.json'),
    JSON.stringify(deploymentInfo, null, 2),
    'utf8'
  );

  // Export configuration for Frontend & Backend
  const configTs = `// Auto-generated configuration for Paws & Picket
export const BLOCKCHAIN_CONFIG = {
  chainId: 43113,
  chainName: 'Avalanche Fuji Testnet',
  rpcUrl: '${rpcUrl}',
  contractAddress: '${contractAddress}' as \`0x\${string}\`,
  trustedSignerAddress: '${signerAccount.address}' as \`0x\${string}\`,
  explorerUrl: 'https://testnet.snowtrace.io',
} as const;
`;

  fs.writeFileSync(path.resolve(contractsDir, 'config.ts'), configTs, 'utf8');

  // Update .env with contract addresses
  let updatedEnv = fs.readFileSync(envPath, 'utf8');
  if (updatedEnv.includes('PAWS_PASSPORT_CONTRACT_ADDRESS=')) {
    updatedEnv = updatedEnv.replace(
      /PAWS_PASSPORT_CONTRACT_ADDRESS=.*/g,
      `PAWS_PASSPORT_CONTRACT_ADDRESS="${contractAddress}"`
    );
  } else {
    updatedEnv += `\nPAWS_PASSPORT_CONTRACT_ADDRESS="${contractAddress}"`;
  }

  if (updatedEnv.includes('VITE_PAWS_PASSPORT_CONTRACT_ADDRESS=')) {
    updatedEnv = updatedEnv.replace(
      /VITE_PAWS_PASSPORT_CONTRACT_ADDRESS=.*/g,
      `VITE_PAWS_PASSPORT_CONTRACT_ADDRESS="${contractAddress}"`
    );
  } else {
    updatedEnv += `\nVITE_PAWS_PASSPORT_CONTRACT_ADDRESS="${contractAddress}"`;
  }

  fs.writeFileSync(envPath, updatedEnv, 'utf8');
  console.log('Saved deployment record to:');
  console.log('  - src/contracts/deployment.json');
  console.log('  - src/contracts/config.ts');
  console.log('  - .env (PAWS_PASSPORT_CONTRACT_ADDRESS)\n');
}

main().catch((err) => {
  console.error('\nDeployment error:', err.message || err);
  process.exit(1);
});
