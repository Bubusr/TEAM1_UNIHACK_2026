import { ethers } from 'ethers';
import 'dotenv/config';
import { adminDb } from '../src/server/firebaseAdmin.ts';
import { getCanonicalOrigin } from '../src/server/web3Service.ts';

interface PreflightOptions {
  sender?: string;
  recipient?: string;
  petUid?: string;
  metadataBaseUrl?: string;
}

const CONTRACT_ADDRESS =
  process.env.PET_PASSPORT_CONTRACT_ADDRESS ||
  '0x2aA2EbA597E8E2a1bB727Fd4317dBb6cEC2Bee31';
const RPC_URL =
  process.env.AVALANCHE_FUJI_RPC_URL ||
  'https://api.avax-test.network/ext/bc/C/rpc';
const CHAIN_ID = Number(process.env.AVALANCHE_CHAIN_ID || 43113);

const CONTRACT_ABI = [
  'function owner() view returns (address)',
  'function claimSigner() view returns (address)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenByPetId(bytes32 petIdHash) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

export async function runPreflight(options: PreflightOptions = {}) {
  console.log('='.repeat(70));
  console.log('🐾 PAWS & PICKET — PHASE I AVALANCHE FUJI PREFLIGHT AUDIT');
  console.log('='.repeat(70));

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);

  // --------------------------------------------------------------------------
  // 1. On-Chain Contract & Role Verification
  // --------------------------------------------------------------------------
  console.log('\n[1/5] VERIFYING AVALANCHE FUJI SMART CONTRACT...');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  let contractName = '';
  let contractSymbol = '';
  let contractOwner = '';
  let onChainSigner = '';

  try {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) {
      throw new Error(
        `Connected chain ID ${network.chainId} does not match expected ${CHAIN_ID}`
      );
    }
    contractName = await contract.name();
    contractSymbol = await contract.symbol();
    contractOwner = await contract.owner();
    onChainSigner = await contract.claimSigner();
    console.log(`  ✓ Network: Avalanche Fuji (Chain ID ${CHAIN_ID})`);
    console.log(`  ✓ Contract: ${CONTRACT_ADDRESS} (${contractName} [${contractSymbol}])`);
    console.log(`  ✓ Contract Owner / Deployer: ${contractOwner}`);
    console.log(`  ✓ On-Chain Claim Signer:     ${onChainSigner}`);
  } catch (err: any) {
    console.error(`  ✗ Failed to connect to Fuji contract: ${err.message}`);
    process.exit(1);
  }

  // Verify backend trusted signer key matches on-chain signer
  const rawSignerKey = process.env.TRUSTED_SIGNER_PRIVATE_KEY?.trim();
  let localSignerAddress = '';
  if (rawSignerKey) {
    try {
      localSignerAddress = new ethers.Wallet(rawSignerKey).address;
      if (localSignerAddress.toLowerCase() === onChainSigner.toLowerCase()) {
        console.log(`  ✓ Local TRUSTED_SIGNER_PRIVATE_KEY matches on-chain claimSigner.`);
      } else {
        console.warn(
          `  ⚠ MISMATCH: Local signer (${localSignerAddress}) != On-chain signer (${onChainSigner})`
        );
      }
    } catch {
      console.warn('  ⚠ Invalid TRUSTED_SIGNER_PRIVATE_KEY in .env');
    }
  } else {
    console.warn('  ⚠ Missing TRUSTED_SIGNER_PRIVATE_KEY in .env');
  }

  // --------------------------------------------------------------------------
  // 2. Wallet Separation & Roles
  // --------------------------------------------------------------------------
  console.log('\n[2/5] VERIFYING WALLET ROLES & SEPARATION...');
  const senderAddress = options.sender ? options.sender.trim() : null;
  const recipientAddress = options.recipient
    ? options.recipient.trim()
    : senderAddress;

  if (!senderAddress) {
    console.log('  ⚠ NO CORE WALLET CONNECTED.');
    console.log('  → Per strict requirements: do NOT assume Deployer or Signer is recipient.');
    console.log('  → Please connect your Core Wallet or pass --sender <0x...>');
  } else {
    try {
      const checksummedSender = ethers.getAddress(senderAddress.toLowerCase());
      const checksummedRecipient = ethers.getAddress(recipientAddress!.toLowerCase());
      console.log(`  • Transaction Sender:       ${checksummedSender} (Connected Core Wallet)`);
      console.log(`  • NFT Recipient:            ${checksummedRecipient} (Verified Keeper Wallet)`);
      console.log(`  • Trusted EIP-712 Signer:   ${onChainSigner} (Paws & Picket Backend)`);
      console.log(`  • Deployer / Contract Owner: ${contractOwner} (Smart Contract Owner)`);

      const isDeployer =
        checksummedSender.toLowerCase() === contractOwner.toLowerCase();
      if (isDeployer) {
        console.warn('  ⚠ Notice: Sender is identical to Deployer wallet.');
      } else {
        console.log('  ✓ Role Separation Confirmed: Player sender is distinct from Deployer.');
      }
    } catch (err: any) {
      console.error(`  ✗ Invalid sender or recipient address: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Pet Eligibility Verification
  // --------------------------------------------------------------------------
  console.log('\n[3/5] VERIFYING PET CANDIDATE & ELIGIBILITY...');
  let targetPetUid = options.petUid;
  let petData: any = null;

  if (targetPetUid) {
    const doc = await adminDb.collection('pets').doc(targetPetUid).get();
    if (doc.exists) {
      petData = doc.data();
    } else {
      console.error(`  ✗ Pet UID ${targetPetUid} not found in Firestore.`);
    }
  } else {
    // Pick the first eligible unminted pet
    const snapshot = await adminDb
      .collection('pets')
      .where('mintStatus', '==', 'unminted')
      .limit(50)
      .get();

    for (const doc of snapshot.docs) {
      const d = doc.data();
      const score = Number(d.discoveryScore ?? d.score ?? 0);
      const bond = Number(d.bondXp ?? 0);
      if (score >= 80 && bond >= 100) {
        targetPetUid = doc.id;
        petData = d;
        break;
      }
    }
  }

  if (petData) {
    const score = Number(petData.discoveryScore ?? petData.score ?? 0);
    const bond = Number(petData.bondXp ?? 0);
    const isEligible = score >= 80 && bond >= 100;

    console.log(`  • Pet UID:         ${targetPetUid}`);
    console.log(`  • Pet Name:        ${petData.name} (${petData.species})`);
    console.log(`  • Discovery Score: ${score}/100 (Threshold: 80) -> ${score >= 80 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`  • Bond XP:         ${bond}/100 (Threshold: 100) -> ${bond >= 100 ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`  • Mint Status:     ${petData.mintStatus}`);
    console.log(`  • Overall:         ${isEligible ? 'ELIGIBLE FOR PET PASSPORT ✓' : 'NOT ELIGIBLE ✗'}`);

    // Check on-chain if pet was already minted
    const petIdHash = ethers.id(targetPetUid!);
    const onChainTokenId = await contract.tokenByPetId(petIdHash);
    if (Number(onChainTokenId) > 0) {
      console.warn(`  ⚠ Warning: Pet already has on-chain Token ID #${onChainTokenId}`);
    } else {
      console.log(`  ✓ On-chain check: Pet has not been minted yet (Token ID 0).`);
    }
  } else {
    console.log('  ⚠ No eligible unminted pet found to test.');
  }

  // --------------------------------------------------------------------------
  // 4. Metadata URI & Schema Verification
  // --------------------------------------------------------------------------
  console.log('\n[4/5] VERIFYING METADATA ACCESSIBILITY & ERC-721 SCHEMA...');
  const origin = options.metadataBaseUrl || getCanonicalOrigin() || 'http://127.0.0.1:3000';
  const metadataUrl = `${origin}/api/metadata/${encodeURIComponent(targetPetUid || 'demo')}`;
  console.log(`  • Proposed Metadata URI: ${metadataUrl}`);
  console.log(
    '  • Disclosure: Server-hosted metadata is mutable and hosted on Express/Cloud Run; it is not immutable IPFS.'
  );

  try {
    const res = await fetch(metadataUrl);
    if (res.status === 200) {
      const json = await res.json();
      console.log(`  ✓ HTTP Status: 200 OK`);
      console.log(`  ✓ ERC-721 Name: "${json.name}"`);
      console.log(`  ✓ ERC-721 Description: "${json.description?.slice(0, 50)}..."`);
      console.log(`  ✓ ERC-721 Image URL: ${json.image}`);
      if (json.image && !json.image.includes('localhost') && !json.image.includes('127.0.0.1')) {
        console.log(`  ✓ Image URL uses canonical origin without localhost.`);
      } else {
        console.warn(`  ⚠ Image URL contains localhost/loopback address.`);
      }
    } else {
      console.warn(`  ⚠ Metadata request returned status ${res.status}`);
    }
  } catch (err: any) {
    console.warn(`  ⚠ Could not fetch metadata URL (${err.message}). Server may not be running locally.`);
  }

  // --------------------------------------------------------------------------
  // 5. Gas & Sender Balance Verification
  // --------------------------------------------------------------------------
  console.log('\n[5/5] VERIFYING TRANSACTION SENDER GAS & FUJI AVAX BALANCE...');
  if (senderAddress) {
    try {
      const balanceWei = await provider.getBalance(senderAddress);
      const balanceAvax = ethers.formatEther(balanceWei);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('25', 'gwei');

      // Estimated gas units for mintWithClaim
      const estimatedGasUnits = 180000n;
      const estimatedCostWei = estimatedGasUnits * gasPrice;
      const estimatedCostAvax = ethers.formatEther(estimatedCostWei);
      const safetyMarginAvax = '0.01';
      const requiredWei = estimatedCostWei + ethers.parseEther(safetyMarginAvax);

      console.log(`  • Sender Address:     ${senderAddress}`);
      console.log(`  • Current Balance:    ${balanceAvax} AVAX`);
      console.log(`  • Gas Price:          ${ethers.formatUnits(gasPrice, 'gwei')} nAVAX`);
      console.log(`  • Estimated Gas:      ${estimatedGasUnits.toString()} units (~${estimatedCostAvax} AVAX)`);
      console.log(`  • Safety Margin:      ${safetyMarginAvax} AVAX`);

      if (balanceWei >= requiredWei) {
        console.log(`  ✓ Balance Check: SUFFICIENT BALANCE to broadcast mint transaction.`);
      } else {
        console.warn(
          `  ⚠ INSUFFICIENT BALANCE: Sender needs at least ${ethers.formatEther(requiredWei)} AVAX on Fuji testnet.`
        );
        console.log('  → Obtain free testnet AVAX at: https://faucet.avax.network');
      }
    } catch (err: any) {
      console.error(`  ✗ Failed to verify sender balance: ${err.message}`);
    }
  } else {
    console.log('  ⚠ Gas balance check skipped (no sender address specified).');
  }

  // --------------------------------------------------------------------------
  // Summary & Strict Stop
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(70));
  console.log('📋 PREFLIGHT SUMMARY');
  console.log('='.repeat(70));
  console.log(`• Network:            Avalanche Fuji (Chain ID ${CHAIN_ID})`);
  console.log(`• Contract:           ${CONTRACT_ADDRESS}`);
  console.log(`• Deployer / Owner:   ${contractOwner}`);
  console.log(`• Trusted Signer:     ${onChainSigner}`);
  console.log(`• Transaction Sender: ${senderAddress || '[WAITING FOR USER WALLET]'}`);
  console.log(`• NFT Recipient:      ${recipientAddress || '[WAITING FOR USER WALLET]'}`);
  console.log(`• Pet:                ${petData ? `${petData.name} (${targetPetUid})` : 'N/A'}`);
  console.log(`• Proposed Metadata:  ${metadataUrl}`);
  console.log('='.repeat(70));
  console.log('🛑 STRICT STOP: No transaction broadcast. Waiting for explicit user approval.');
  console.log('='.repeat(70));
}

// Parse CLI flags
const args = process.argv.slice(2);
const options: PreflightOptions = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--sender' && args[i + 1]) {
    options.sender = args[++i];
  } else if (args[i] === '--recipient' && args[i + 1]) {
    options.recipient = args[++i];
  } else if (args[i] === '--petUid' && args[i + 1]) {
    options.petUid = args[++i];
  } else if (args[i] === '--metadataBaseUrl' && args[i + 1]) {
    options.metadataBaseUrl = args[++i];
  }
}

runPreflight(options).catch((err) => {
  console.error('Preflight error:', err);
  process.exit(1);
});
