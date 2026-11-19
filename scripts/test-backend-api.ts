import {
  getBlockchainStatus,
  createPassportClaim,
  EIP712_DOMAIN,
  EIP712_TYPES,
} from '../src/server/blockchainService.js';
import { recoverTypedDataAddress } from 'viem';

async function testBackendApi() {
  console.log('=====================================================');
  console.log(' Testing Backend EIP-712 Claim & Verification (M03-02)');
  console.log('=====================================================\n');

  // 1. Test getBlockchainStatus
  console.log('1. Fetching blockchain status...');
  const status = await getBlockchainStatus();
  console.log('Status result:', status);
  if (status.status !== 'ONLINE' || status.chainId !== 43113) {
    throw new Error('Blockchain status test failed');
  }
  console.log('  [PASS] Blockchain status is ONLINE on Avalanche Fuji\n');

  // 2. Test createPassportClaim
  console.log('2. Generating signed EIP-712 Passport Claim...');
  const testRecipient = '0xd7fA1F935eaE310a80A5C5E8F45CE92cEBd54537';
  const claimResponse = await createPassportClaim({
    recipient: testRecipient,
    petId: 201,
    petName: 'Mochi The Calico',
    species: 'cat',
    score: 95,
    imageUrl: 'https://pawsandpicket.app/images/mochi.jpg',
  });

  console.log('Claim created:');
  console.log('  Recipient:', claimResponse.claim.recipient);
  console.log('  Pet ID   :', claimResponse.claim.petId);
  console.log('  Nonce    :', claimResponse.claim.nonce);
  console.log('  Deadline :', claimResponse.claim.deadline);
  console.log('  Signature:', claimResponse.signature);

  // 3. Verify Signature Recovery matches backend signer
  console.log('\n3. Verifying signature recovery...');
  const recoveredSigner = await recoverTypedDataAddress({
    domain: EIP712_DOMAIN,
    types: EIP712_TYPES,
    primaryType: 'PassportClaim',
    message: {
      recipient: claimResponse.claim.recipient as `0x${string}`,
      petId: BigInt(claimResponse.claim.petId),
      petName: claimResponse.claim.petName,
      species: claimResponse.claim.species,
      score: BigInt(claimResponse.claim.score),
      tokenURI: claimResponse.claim.tokenURI,
      nonce: BigInt(claimResponse.claim.nonce),
      deadline: BigInt(claimResponse.claim.deadline),
    },
    signature: claimResponse.signature,
  });

  console.log('Recovered Signer Address:', recoveredSigner);
  console.log('Expected Signer Address :', claimResponse.signerAddress);

  if (recoveredSigner.toLowerCase() !== claimResponse.signerAddress.toLowerCase()) {
    throw new Error('Signature recovery failed: signer mismatch');
  }
  console.log('  [PASS] EIP-712 Signature matches Backend Trusted Signer perfectly!\n');

  console.log('=====================================================');
  console.log(' All Phase 3 Backend Blockchain Tests PASSED!');
  console.log('=====================================================');
}

testBackendApi().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
