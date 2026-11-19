import { network } from 'hardhat';

async function main() {
  const { ethers } = await network.connect();
  const expectedChainId = BigInt(process.env.AVALANCHE_CHAIN_ID || 43113);
  const net = await ethers.provider.getNetwork();
  if (net.chainId !== expectedChainId) {
    throw new Error(
      `Refusing deploy: expected Avalanche chainId ${expectedChainId.toString()}, got ${net.chainId.toString()}`
    );
  }

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error('Missing DEPLOYER_PRIVATE_KEY for Fuji deployment.');
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  const minRequired = ethers.parseEther('0.01');
  console.log(`Deployer balance: ${ethers.formatEther(balance)} AVAX`);
  if (balance < minRequired) {
    throw new Error(
      `Insufficient deployer balance: ${ethers.formatEther(balance)} AVAX. Minimum required is 0.01 AVAX.`
    );
  }

  const trustedSignerKey = process.env.TRUSTED_SIGNER_PRIVATE_KEY?.trim();
  const claimSigner = trustedSignerKey
    ? new ethers.Wallet(trustedSignerKey).address
    : deployer.address;

  console.log('Deploying PawsAndPicketPassport to Avalanche Fuji...');
  console.log('Deployer:', deployer.address);
  console.log('Trusted Claim Signer:', claimSigner);

  const Factory = await ethers.getContractFactory('PawsAndPicketPassport');
  const contract = await Factory.deploy(deployer.address, claimSigner);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const receipt = deployTx ? await deployTx.wait() : null;

  console.log('PawsAndPicketPassport deployed at:', address);
  if (deployTx && receipt) {
    console.log('Deployment Transaction Hash:', deployTx.hash);
    console.log('Block Number:', receipt.blockNumber);
    console.log('Gas Used:', receipt.gasUsed.toString());
    console.log('Deployed At:', new Date().toISOString());
  }
  console.log(`Set PET_PASSPORT_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
