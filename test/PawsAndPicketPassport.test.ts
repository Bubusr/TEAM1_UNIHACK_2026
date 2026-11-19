import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';
import type { Contract, Signer } from 'ethers';

async function signMintClaim(
  contract: Contract,
  signer: Signer,
  params: {
    recipient: string;
    petIdHash: string;
    metadataUri: string;
    nonce: bigint;
    deadline: number;
  }
) {
  const provider = signer.provider;
  if (!provider) throw new Error('Missing signer provider');
  const net = await provider.getNetwork();
  const domain = {
    name: 'PawsAndPicketPassport',
    version: '1',
    chainId: net.chainId,
    verifyingContract: await contract.getAddress(),
  };
  const types = {
    MintClaim: [
      { name: 'recipient', type: 'address' },
      { name: 'petIdHash', type: 'bytes32' },
      { name: 'metadataUriHash', type: 'bytes32' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };
  const { ethers } = await network.connect();
  const value = {
    recipient: params.recipient,
    petIdHash: params.petIdHash,
    metadataUriHash: ethers.keccak256(ethers.toUtf8Bytes(params.metadataUri)),
    nonce: params.nonce,
    deadline: params.deadline,
  };
  return signer.signTypedData(domain, types, value);
}

describe('PawsAndPicketPassport', () => {
  async function deployFixture() {
    const connection = await network.connect();
    const { ethers } = connection;
    const [owner, claimSigner, alice, bob, attacker] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('PawsAndPicketPassport');
    const contract = await Factory.deploy(owner.address, claimSigner.address);
    await contract.waitForDeployment();
    return { contract, ethers, owner, claimSigner, alice, bob, attacker };
  }

  it('mints a Pet Passport with valid EIP-712 claim and records immutable discoverer', async () => {
    const { contract, ethers, claimSigner, alice } = await deployFixture();
    const petIdHash = ethers.id('pet-mochi-001');
    const metadataUri = 'https://example.test/api/metadata/pet-mochi-001';
    const latestBlock = await ethers.provider.getBlock('latest');
    const deadline = (latestBlock?.timestamp ?? 0) + 3600;
    const nonce = 1001n;

    const sig = await signMintClaim(contract, claimSigner, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce,
      deadline,
    });

    const tx = await (contract.connect(alice) as Contract).mintWithClaim(
      alice.address,
      petIdHash,
      metadataUri,
      nonce,
      deadline,
      sig
    );
    const receipt = await tx.wait();
    assert.equal(receipt.status, 1);

    assert.equal(await contract.ownerOf(1n), alice.address);
    assert.equal(await contract.tokenByPetId(petIdHash), 1n);
    assert.equal(await contract.tokenURI(1n), metadataUri);

    const passport = await contract.passports(1n);
    assert.equal(passport.petIdHash, petIdHash);
    assert.equal(passport.originalDiscoverer, alice.address);
  });

  it('emits PetMinted log and stores ipfs:// metadataUri matching backend claim confirmation format', async () => {
    const { contract, ethers, claimSigner, alice } = await deployFixture();
    const petIdHash = ethers.id('pet-ipfs-e2e-001');
    const metadataUri = 'ipfs://QmPhase1PassportMetaCid123456';
    const latestBlock = await ethers.provider.getBlock('latest');
    const deadline = (latestBlock?.timestamp ?? 0) + 3600;
    const nonce = 777n;

    const sig = await signMintClaim(contract, claimSigner, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce,
      deadline,
    });

    const tx = await (contract.connect(alice) as Contract).mintWithClaim(
      alice.address,
      petIdHash,
      metadataUri,
      nonce,
      deadline,
      sig
    );
    const receipt = await tx.wait();
    assert.equal(receipt.status, 1);

    const parsedLogs = receipt.logs
      .map((log: { topics: string[]; data: string }) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const mintedEvent = parsedLogs.find(
      (ev: { name: string } | null) => ev?.name === 'PetMinted'
    );
    assert.ok(mintedEvent, 'PetMinted event must be emitted');
    assert.equal(mintedEvent.args.tokenId, 1n);
    assert.equal(mintedEvent.args.petIdHash, petIdHash);
    assert.equal(mintedEvent.args.discoverer, alice.address);
    assert.equal(mintedEvent.args.metadataUri, metadataUri);
    assert.equal(mintedEvent.args.nonce, nonce);
    assert.equal(await contract.ownerOf(1n), alice.address);
    assert.equal(await contract.tokenURI(1n), metadataUri);
  });

  it('rejects invalid signature, wrong caller, expired claim, replay nonce, and duplicate pet mint', async () => {
    const { contract, ethers, claimSigner, alice, bob, attacker } =
      await deployFixture();
    const petIdHash = ethers.id('pet-sunny-002');
    const metadataUri = 'https://example.test/api/metadata/pet-sunny-002';
    const latestBlock = await ethers.provider.getBlock('latest');
    const deadline = (latestBlock?.timestamp ?? 0) + 3600;

    // 1. Wrong signer
    const badSig = await signMintClaim(contract, attacker, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce: 1n,
      deadline,
    });
    await assert.rejects(
      (contract.connect(alice) as Contract).mintWithClaim(
        alice.address,
        petIdHash,
        metadataUri,
        1n,
        deadline,
        badSig
      )
    );

    // 2. Valid signature submitted by wrong caller
    const validSig = await signMintClaim(contract, claimSigner, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce: 2n,
      deadline,
    });
    await assert.rejects(
      (contract.connect(bob) as Contract).mintWithClaim(
        alice.address,
        petIdHash,
        metadataUri,
        2n,
        deadline,
        validSig
      )
    );

    // 3. Expired deadline
    const expiredDeadline = (latestBlock?.timestamp ?? 0) - 10;
    const expiredSig = await signMintClaim(contract, claimSigner, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce: 3n,
      deadline: expiredDeadline,
    });
    await assert.rejects(
      (contract.connect(alice) as Contract).mintWithClaim(
        alice.address,
        petIdHash,
        metadataUri,
        3n,
        expiredDeadline,
        expiredSig
      )
    );

    // 4. Successful mint
    await (
      await (contract.connect(alice) as Contract).mintWithClaim(
        alice.address,
        petIdHash,
        metadataUri,
        2n,
        deadline,
        validSig
      )
    ).wait();

    // 5. Nonce replay blocked
    await assert.rejects(
      (contract.connect(alice) as Contract).mintWithClaim(
        alice.address,
        ethers.id('other-pet'),
        metadataUri,
        2n,
        deadline,
        validSig
      )
    );

    // 6. Duplicate pet mint with fresh nonce blocked
    const dupPetSig = await signMintClaim(contract, claimSigner, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce: 4n,
      deadline,
    });
    await assert.rejects(
      (contract.connect(alice) as Contract).mintWithClaim(
        alice.address,
        petIdHash,
        metadataUri,
        4n,
        deadline,
        dupPetSig
      )
    );
  });

  it('blocks direct transfers and approvals AND disables all player-to-player adoption transfers in Phase 1', async () => {
    const { contract, ethers, claimSigner, alice, bob } = await deployFixture();
    assert.equal(await contract.ADOPTION_TRANSFERS_ENABLED(), false);

    const petIdHash = ethers.id('pet-pip-003');
    const metadataUri = 'https://example.test/api/metadata/pet-pip-003';
    const latestBlock = await ethers.provider.getBlock('latest');
    const deadline = (latestBlock?.timestamp ?? 0) + 3600;

    const sig = await signMintClaim(contract, claimSigner, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce: 55n,
      deadline,
    });
    await (
      await (contract.connect(alice) as Contract).mintWithClaim(
        alice.address,
        petIdHash,
        metadataUri,
        55n,
        deadline,
        sig
      )
    ).wait();

    // Direct transfers & approvals must revert (DirectTransferBlocked)
    await assert.rejects(
      (contract.connect(alice) as Contract).transferFrom(
        alice.address,
        bob.address,
        1n
      ),
      /DirectTransferBlocked/
    );
    await assert.rejects(
      (contract.connect(alice) as Contract)[
        'safeTransferFrom(address,address,uint256)'
      ](alice.address, bob.address, 1n),
      /DirectTransferBlocked/
    );
    await assert.rejects(
      (contract.connect(alice) as Contract)[
        'safeTransferFrom(address,address,uint256,bytes)'
      ](alice.address, bob.address, 1n, '0x'),
      /DirectTransferBlocked/
    );
    await assert.rejects(
      (contract.connect(alice) as Contract).approve(bob.address, 1n),
      /DirectTransferBlocked/
    );
    await assert.rejects(
      (contract.connect(alice) as Contract).setApprovalForAll(bob.address, true),
      /DirectTransferBlocked/
    );

    // Phase 2 player-to-player adoption paths must ALL revert in Phase 1 (AdoptionTransfersDisabled)
    await assert.rejects(
      (contract.connect(alice) as Contract).createAdoptionOffer(
        1n,
        bob.address,
        3600
      ),
      /AdoptionTransfersDisabled/
    );
    await assert.rejects(
      (contract.connect(alice) as Contract).cancelAdoptionOffer(1n),
      /AdoptionTransfersDisabled/
    );
    await assert.rejects(
      (contract.connect(bob) as Contract).acceptAdoption(1n),
      /AdoptionTransfersDisabled/
    );

    // Ownership and originalDiscoverer remain immutably Alice
    assert.equal(await contract.ownerOf(1n), alice.address);
    const passport = await contract.passports(1n);
    assert.equal(passport.originalDiscoverer, alice.address);
    assert.equal(passport.petIdHash, petIdHash);
  });

  it('allows owner to update claim signer, emits ClaimSignerUpdated, and accepts claims signed by new signer', async () => {
    const { contract, ethers, owner, claimSigner, bob, alice } =
      await deployFixture();
    assert.equal(await contract.claimSigner(), claimSigner.address);

    const tx = await (contract.connect(owner) as Contract).setClaimSigner(
      bob.address
    );
    const receipt = await tx.wait();
    assert.equal(receipt.status, 1);

    // Verify claimSigner updated on-chain
    assert.equal(await contract.claimSigner(), bob.address);

    // Verify ClaimSignerUpdated event emitted
    const parsedLogs = receipt.logs
      .map((log: { topics: string[]; data: string }) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const updatedEvent = parsedLogs.find(
      (ev: { name: string } | null) => ev?.name === 'ClaimSignerUpdated'
    );
    assert.ok(updatedEvent, 'ClaimSignerUpdated event must be emitted');
    assert.equal(updatedEvent.args.previousSigner, claimSigner.address);
    assert.equal(updatedEvent.args.newSigner, bob.address);

    // Verify a claim signed by the new signer (bob) is accepted for minting
    const petIdHash = ethers.id('pet-new-signer-001');
    const metadataUri = 'ipfs://QmNewSignerPassportMetaCid';
    const latestBlock = await ethers.provider.getBlock('latest');
    const deadline = (latestBlock?.timestamp ?? 0) + 3600;
    const nonce = 8881n;

    const newSignerSig = await signMintClaim(contract, bob, {
      recipient: alice.address,
      petIdHash,
      metadataUri,
      nonce,
      deadline,
    });

    const mintTx = await (contract.connect(alice) as Contract).mintWithClaim(
      alice.address,
      petIdHash,
      metadataUri,
      nonce,
      deadline,
      newSignerSig
    );
    const mintReceipt = await mintTx.wait();
    assert.equal(mintReceipt.status, 1);
    assert.equal(await contract.ownerOf(1n), alice.address);

    // Old signer signature must now be rejected
    const oldSignerSig = await signMintClaim(contract, claimSigner, {
      recipient: alice.address,
      petIdHash: ethers.id('pet-new-signer-002'),
      metadataUri,
      nonce: 8882n,
      deadline,
    });
    await assert.rejects(
      (contract.connect(alice) as Contract).mintWithClaim(
        alice.address,
        ethers.id('pet-new-signer-002'),
        metadataUri,
        8882n,
        deadline,
        oldSignerSig
      ),
      /InvalidSignature/
    );
  });

  it('rejects claim signer update when called by non-owner account', async () => {
    const { contract, alice, bob, attacker } = await deployFixture();

    await assert.rejects(
      (contract.connect(alice) as Contract).setClaimSigner(bob.address),
      /OwnableUnauthorizedAccount/
    );
    await assert.rejects(
      (contract.connect(attacker) as Contract).setClaimSigner(attacker.address),
      /OwnableUnauthorizedAccount/
    );
  });

  it('rejects zero address when updating claim signer or deploying contract', async () => {
    const { contract, ethers, owner } = await deployFixture();

    // 1. Rejects zero address on setClaimSigner
    await assert.rejects(
      (contract.connect(owner) as Contract).setClaimSigner(ethers.ZeroAddress),
      /InvalidClaimSigner/
    );

    // 2. Rejects zero address as initialClaimSigner during deployment
    const Factory = await ethers.getContractFactory('PawsAndPicketPassport');
    await assert.rejects(
      Factory.deploy(owner.address, ethers.ZeroAddress),
      /InvalidClaimSigner/
    );
  });
});
