const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== BẮT ĐẦU DEPLOY HỆ THỐNG SMART CONTRACT MĂNG NON TRÊN AVALANCHE ===");

  const [deployer] = await hre.ethers.getSigners();
  if (deployer) {
    console.log("Deployer address:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "AVAX");
  }

  // 1. Deploy VillageTree (Cây Làng Phù Đổng)
  console.log("\n1. Deploying VillageTree...");
  const VillageTree = await hre.ethers.getContractFactory("VillageTree");
  const villageTree = await VillageTree.deploy();
  await villageTree.waitForDeployment();
  const villageTreeAddress = await villageTree.getAddress();
  console.log("-> VillageTree deployed at:", villageTreeAddress);

  // 2. Deploy GoalRegistry (Quản lý Goal & Măng Non)
  console.log("\n2. Deploying GoalRegistry...");
  const GoalRegistry = await hre.ethers.getContractFactory("GoalRegistry");
  const goalRegistry = await GoalRegistry.deploy();
  await goalRegistry.waitForDeployment();
  const goalRegistryAddress = await goalRegistry.getAddress();
  console.log("-> GoalRegistry deployed at:", goalRegistryAddress);

  // 3. Deploy MamLucVault (Vault cam kết Mầm Lực)
  console.log("\n3. Deploying MamLucVault...");
  const MamLucVault = await hre.ethers.getContractFactory("MamLucVault");
  const mamLucVault = await MamLucVault.deploy();
  await mamLucVault.waitForDeployment();
  const mamLucVaultAddress = await mamLucVault.getAddress();
  await mamLucVault.setVillageTree(villageTreeAddress);
  console.log("-> MamLucVault deployed at:", mamLucVaultAddress);

  // 4. Deploy JourneyNFT (NFT hành trình)
  console.log("\n4. Deploying JourneyNFT...");
  const JourneyNFT = await hre.ethers.getContractFactory("JourneyNFT");
  const journeyNFT = await JourneyNFT.deploy();
  await journeyNFT.waitForDeployment();
  const journeyNFTAddress = await journeyNFT.getAddress();
  console.log("-> JourneyNFT deployed at:", journeyNFTAddress);

  // 5. Deploy TramTreCheckin (Check-in trạm đối tác)
  console.log("\n5. Deploying TramTreCheckin...");
  const TramTreCheckin = await hre.ethers.getContractFactory("TramTreCheckin");
  const tramTreCheckin = await TramTreCheckin.deploy();
  await tramTreCheckin.waitForDeployment();
  const tramTreCheckinAddress = await tramTreCheckin.getAddress();
  console.log("-> TramTreCheckin deployed at:", tramTreCheckinAddress);

  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      VillageTree: villageTreeAddress,
      GoalRegistry: goalRegistryAddress,
      MamLucVault: mamLucVaultAddress,
      JourneyNFT: journeyNFTAddress,
      TramTreCheckin: tramTreCheckinAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✓ Đã lưu thông tin triển khai vào:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
