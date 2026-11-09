const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mang Non Smart Contracts", function () {
  let goalRegistry, mamLucVault, journeyNFT, villageTree, tramTreCheckin;
  let owner, player1, player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const VillageTree = await ethers.getContractFactory("VillageTree");
    villageTree = await VillageTree.deploy();

    const GoalRegistry = await ethers.getContractFactory("GoalRegistry");
    goalRegistry = await GoalRegistry.deploy();

    const MamLucVault = await ethers.getContractFactory("MamLucVault");
    mamLucVault = await MamLucVault.deploy();
    await mamLucVault.setVillageTree(await villageTree.getAddress());

    const JourneyNFT = await ethers.getContractFactory("JourneyNFT");
    journeyNFT = await JourneyNFT.deploy();

    const TramTreCheckin = await ethers.getContractFactory("TramTreCheckin");
    tramTreCheckin = await TramTreCheckin.deploy();
  });

  describe("GoalRegistry", function () {
    it("Tạo Goal và khởi sinh Măng Non thành công", async function () {
      const initialStats = [50, 40, 30, 20];
      await expect(
        goalRegistry.connect(player1).createGoal(
          "Luyện IELTS 7.5",
          1, // Intermediate
          0, // Curious
          "ipfs://bafy-mangnon-seed-1",
          initialStats,
          true
        )
      ).to.emit(goalRegistry, "GoalCreated");

      const activeCount = await goalRegistry.getActiveGoalCount(player1.address);
      expect(activeCount).to.equal(1);
    });

    it("Ghi nhận tương tác và lan tỏa chỉ số sang Goal liên kết", async function () {
      // Tạo 2 Goals
      await goalRegistry.connect(player1).createGoal("Goal 1", 0, 0, "hash1", [10, 10, 10, 10], false);
      await goalRegistry.connect(player1).createGoal("Goal 2", 0, 1, "hash2", [10, 10, 10, 10], false);

      // Nối 2 Goals
      await goalRegistry.connect(player1).linkGoals(1, 2);

      // Tương tác với Goal 1: tăng Trí tuệ 20 điểm
      await goalRegistry.connect(player1).recordInteraction(1, 0, 20);

      const goals = await goalRegistry.getPlayerGoals(player1.address);
      // Goal 1: 10 + 20 = 30
      expect(goals[0].stats.intelligence).to.equal(30);
      // Goal 2 hưởng 20% lan tỏa: 10 + 4 = 14
      expect(goals[1].stats.intelligence).to.equal(14);
    });
  });

  describe("MamLucVault & VillageTree", function () {
    it("Gửi vốn cam kết và hoàn vốn 100% khi An nghỉ, trích mock-yield cho Cây Làng", async function () {
      const depositAmount = ethers.parseEther("1.0");

      // Deposit vào vault
      await mamLucVault.connect(player1).deposit(1, { value: depositAmount });
      const vaultPos = await mamLucVault.vaults(1);
      expect(vaultPos.principal).to.equal(depositAmount);

      // Hoàn thành goal
      const balanceBefore = await ethers.provider.getBalance(player1.address);
      const tx = await mamLucVault.connect(player1).completeGoal(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      // Người chơi nhận lại tiền vốn (trừ gas)
      expect(balanceAfter + gasUsed).to.be.closeTo(balanceBefore + depositAmount, ethers.parseEther("0.01"));
    });

    it("Cây Làng kích hoạt bùng nổ (Blessing) khi đạt ngưỡng năng lượng", async function () {
      await expect(villageTree.connect(player1).contributeEnergy(600))
        .to.emit(villageTree, "BlessingTriggered");

      const status = await villageTree.getTreeStatus();
      expect(status.cyclesCompleted).to.equal(1);
    });
  });

  describe("JourneyNFT & TramTre", function () {
    it("Mint NFT hành trình khi Goal an nghỉ", async function () {
      await journeyNFT.mint(
        player1.address,
        1,
        "Hoàn thành khóa học Solidity",
        "ipfs://hash123",
        [100, 95, 60, 80],
        25
      );

      const bal = await journeyNFT.balanceOf(player1.address);
      expect(bal).to.equal(1);
      const rec = await journeyNFT.getJourneyRecord(1);
      expect(rec.goalName).to.equal("Hoàn thành khóa học Solidity");
    });

    it("Check-in Trạm Tre nhận voucher thành công", async function () {
      const voucher = await tramTreCheckin.connect(player1).checkin.staticCall(1);
      expect(voucher).to.include("VOUCHER");

      await tramTreCheckin.connect(player1).checkin(1);
      // Check-in lần 2 phải bị revert
      await expect(tramTreCheckin.connect(player1).checkin(1)).to.be.revertedWith(
        "Already claimed voucher at this station"
      );
    });
  });
});
