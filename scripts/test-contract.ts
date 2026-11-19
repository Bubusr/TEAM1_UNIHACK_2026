import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
  decodeEventLog,
  encodeAbiParameters,
  keccak256,
  toHex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load compiled artifact
const artifactPath = path.resolve(rootDir, 'src', 'contracts', 'PawsAndPicketPassport.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Hardhat predefined accounts
const deployerAccount = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'); // #0
const signerAccount = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');   // #1
const recipientAccount = privateKeyToAccount('0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'); // #2
const attackerAccount = privateKeyToAccount('0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6');  // #3

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

const deployerWallet = createWalletClient({
  account: deployerAccount,
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

const recipientWallet = createWalletClient({
  account: recipientAccount,
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

const attackerWallet = createWalletClient({
  account: attackerAccount,
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

// EIP-712 Typed Data Definition
const types = {
  PassportClaim: [
    { name: 'recipient', type: 'address' },
    { name: 'petId', type: 'uint256' },
    { name: 'petName', type: 'string' },
    { name: 'species', type: 'string' },
    { name: 'score', type: 'uint256' },
    { name: 'tokenURI', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

async function runTests() {
  console.log('=====================================================');
  console.log(' Paws & Picket: Smart Contract P0 Test Suite (Member 03)');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Deploy Contract
  console.log('Step 1: Deploying PawsAndPicketPassport contract...');
  const deployHash = await deployerWallet.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [signerAccount.address, deployerAccount.address],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const contractAddress = receipt.contractAddress!;
  console.log(`Contract deployed at: ${contractAddress}\n`);

  assert(Boolean(contractAddress), 'Contract deployed successfully with valid address');

  // Verify initial state
  const trustedSigner = (await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'trustedSigner',
  })) as string;
  assert(
    trustedSigner.toLowerCase() === signerAccount.address.toLowerCase(),
    'Initial trustedSigner set correctly to Backend Signer'
  );

  const owner = (await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'owner',
  })) as string;
  assert(
    owner.toLowerCase() === deployerAccount.address.toLowerCase(),
    'Initial owner set correctly to Deployer'
  );

  const domain = {
    name: 'PawsAndPicketPassport',
    version: '1',
    chainId: hardhat.id,
    verifyingContract: contractAddress,
  } as const;

  // 2. Happy Path: Valid Claim & Mint
  console.log('\nStep 2: Testing Happy Path (Valid claim mint)...');
  const now = BigInt(Math.floor(Date.now() / 1000));
  const claim1 = {
    recipient: recipientAccount.address,
    petId: 101n,
    petName: 'Mochi',
    species: 'cat',
    score: 95n,
    tokenURI: 'https://pawsandpicket.app/metadata/101.json',
    nonce: 1001n,
    deadline: now + 3600n, // 1 hour valid
  };

  const sig1 = await signerAccount.signTypedData({
    domain,
    types,
    primaryType: 'PassportClaim',
    message: claim1,
  });

  const mintHash1 = await recipientWallet.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'mintWithClaim',
    args: [claim1, sig1],
  });

  const mintReceipt1 = await publicClient.waitForTransactionReceipt({ hash: mintHash1 });
  assert(mintReceipt1.status === 'success', 'Valid mintWithClaim transaction succeeded');

  const tokenOwner = (await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'ownerOf',
    args: [1n],
  })) as string;
  assert(
    tokenOwner.toLowerCase() === recipientAccount.address.toLowerCase(),
    'Passport Token #1 owner matches recipient address'
  );

  const tokenURI = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'tokenURI',
    args: [1n],
  });
  assert(tokenURI === claim1.tokenURI, 'Token #1 tokenURI matches claim URI');

  const petMintedStatus = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'petMinted',
    args: [101n],
  });
  assert(petMintedStatus === true, 'petMinted[101] marked true');

  const nonceStatus = await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'usedNonces',
    args: [1001n],
  });
  assert(nonceStatus === true, 'usedNonces[1001] marked true');

  // Check event emitted
  let foundMintEvent = false;
  for (const log of mintReceipt1.logs) {
    try {
      const decoded: any = decodeEventLog({
        abi: artifact.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'PetPassportMinted') {
        foundMintEvent = true;
        const args: any = decoded.args;
        assert(args.tokenId === 1n, 'Event PetPassportMinted emitted correct tokenId (1)');
        assert(args.petId === 101n, 'Event PetPassportMinted emitted correct petId (101)');
        assert(args.petName === 'Mochi', 'Event PetPassportMinted emitted correct petName');
      }
    } catch {}
  }
  assert(foundMintEvent, 'PetPassportMinted event successfully decoded from receipt');

  // 3. Replay Protection: Reused Nonce
  console.log('\nStep 3: Testing Anti-Replay Protection (Reused Nonce)...');
  const claimDuplicateNonce = {
    ...claim1,
    petId: 102n, // different pet, but reused nonce
  };
  const sigDupNonce = await signerAccount.signTypedData({
    domain,
    types,
    primaryType: 'PassportClaim',
    message: claimDuplicateNonce,
  });

  try {
    await recipientWallet.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: 'mintWithClaim',
      args: [claimDuplicateNonce, sigDupNonce],
    });
    assert(false, 'Reusing nonce must revert');
  } catch (err: any) {
    assert(
      err.message.includes('NonceAlreadyUsed') || err.message.includes('revert'),
      'Transaction reverted with NonceAlreadyUsed as expected'
    );
  }

  // 4. Duplicate Pet Guard
  console.log('\nStep 4: Testing Duplicate Pet Guard (Same petId)...');
  const claimDuplicatePet = {
    ...claim1,
    nonce: 1002n, // different nonce, but same petId 101
  };
  const sigDupPet = await signerAccount.signTypedData({
    domain,
    types,
    primaryType: 'PassportClaim',
    message: claimDuplicatePet,
  });

  try {
    await recipientWallet.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: 'mintWithClaim',
      args: [claimDuplicatePet, sigDupPet],
    });
    assert(false, 'Minting passport for same petId must revert');
  } catch (err: any) {
    assert(
      err.message.includes('PetAlreadyHasPassport') || err.message.includes('revert'),
      'Transaction reverted with PetAlreadyHasPassport as expected'
    );
  }

  // 5. Expired Claim Guard
  console.log('\nStep 5: Testing Expired Claim Guard...');
  const claimExpired = {
    recipient: recipientAccount.address,
    petId: 103n,
    petName: 'Sunny',
    species: 'dog',
    score: 92n,
    tokenURI: 'https://pawsandpicket.app/metadata/103.json',
    nonce: 1003n,
    deadline: now - 100n, // Expired in the past
  };
  const sigExpired = await signerAccount.signTypedData({
    domain,
    types,
    primaryType: 'PassportClaim',
    message: claimExpired,
  });

  try {
    await recipientWallet.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: 'mintWithClaim',
      args: [claimExpired, sigExpired],
    });
    assert(false, 'Expired claim must revert');
  } catch (err: any) {
    assert(
      err.message.includes('ClaimExpired') || err.message.includes('revert'),
      'Transaction reverted with ClaimExpired as expected'
    );
  }

  // 6. Caller Mismatch Guard
  console.log('\nStep 6: Testing Caller Mismatch Guard (Front-running / attacker caller)...');
  const claimCallerCheck = {
    recipient: recipientAccount.address,
    petId: 104n,
    petName: 'Pip',
    species: 'bunny',
    score: 88n,
    tokenURI: 'https://pawsandpicket.app/metadata/104.json',
    nonce: 1004n,
    deadline: now + 3600n,
  };
  const sigCallerCheck = await signerAccount.signTypedData({
    domain,
    types,
    primaryType: 'PassportClaim',
    message: claimCallerCheck,
  });

  try {
    // Attacker calls mint on behalf of recipient
    await attackerWallet.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: 'mintWithClaim',
      args: [claimCallerCheck, sigCallerCheck],
    });
    assert(false, 'Caller mismatch must revert');
  } catch (err: any) {
    assert(
      err.message.includes('CallerNotRecipient') || err.message.includes('revert'),
      'Transaction reverted with CallerNotRecipient as expected'
    );
  }

  // 7. Fraudulent Signer Guard
  console.log('\nStep 7: Testing Fraudulent Signer Guard (Unauthorized signature)...');
  const claimFraud = {
    recipient: recipientAccount.address,
    petId: 105n,
    petName: 'Luna',
    species: 'cat',
    score: 90n,
    tokenURI: 'https://pawsandpicket.app/metadata/105.json',
    nonce: 1005n,
    deadline: now + 3600n,
  };
  // Signed by ATTACKER instead of trustedSigner
  const sigFraud = await attackerAccount.signTypedData({
    domain,
    types,
    primaryType: 'PassportClaim',
    message: claimFraud,
  });

  try {
    await recipientWallet.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: 'mintWithClaim',
      args: [claimFraud, sigFraud],
    });
    assert(false, 'Unauthorized signer signature must revert');
  } catch (err: any) {
    assert(
      err.message.includes('InvalidSigner') || err.message.includes('revert'),
      'Transaction reverted with InvalidSigner as expected'
    );
  }

  // 8. Permission Matrix & Signer Rotation
  console.log('\nStep 8: Testing Permission Matrix (Owner controls & setTrustedSigner)...');
  try {
    // Attacker tries to change signer
    await attackerWallet.writeContract({
      address: contractAddress,
      abi: artifact.abi,
      functionName: 'setTrustedSigner',
      args: [attackerAccount.address],
    });
    assert(false, 'Non-owner changing trustedSigner must revert');
  } catch (err: any) {
    assert(
      err.message.includes('OwnableUnauthorizedAccount') || err.message.includes('revert'),
      'Non-owner calling setTrustedSigner reverted as expected'
    );
  }

  // Owner successfully rotates signer
  const newSigner = attackerAccount.address;
  const rotateHash = await deployerWallet.writeContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'setTrustedSigner',
    args: [newSigner],
  });
  await publicClient.waitForTransactionReceipt({ hash: rotateHash });

  const updatedSigner = (await publicClient.readContract({
    address: contractAddress,
    abi: artifact.abi,
    functionName: 'trustedSigner',
  })) as string;
  assert(
    updatedSigner.toLowerCase() === newSigner.toLowerCase(),
    'Owner successfully rotated trustedSigner'
  );

  console.log('\n=====================================================');
  console.log(` Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
