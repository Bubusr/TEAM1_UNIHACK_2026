// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVillageTree {
    function contributeEnergy(uint256 amount) external;
}

/**
 * @title MamLucVault
 * @dev Hợp đồng cam kết Mầm Lực Vault cho từng Goal (Avalanche C-Chain)
 * Không ai mất vốn gốc. Mock-yield sinh ra theo cam kết, khi hoàn thành Goal:
 * 100% vốn gốc về ví người chơi, phần mock-yield được trích một phần nuôi Cây Làng.
 */
contract MamLucVault {
    struct VaultPosition {
        address owner;
        uint256 goalId;
        uint256 principal;      // Vốn gốc nạp vào (AVAX / testnet token)
        uint256 depositedAt;
        bool isWithdrawn;
    }

    address public owner;
    address public villageTreeContract;

    // goalId => VaultPosition
    mapping(uint256 => VaultPosition) public vaults;

    event VaultDeposited(uint256 indexed goalId, address indexed depositor, uint256 amount);
    event VaultCompleted(
        uint256 indexed goalId,
        address indexed owner,
        uint256 principalReturned,
        uint256 yieldGenerated,
        uint256 communityShare
    );

    constructor() {
        owner = msg.sender;
    }

    function setVillageTree(address _villageTree) external {
        require(msg.sender == owner, "Only owner");
        villageTreeContract = _villageTree;
    }

    /**
     * @dev Gửi cam kết mầm lực cho một Goal
     */
    function deposit(uint256 goalId) external payable {
        require(msg.value > 0, "Deposit amount must be > 0");
        require(vaults[goalId].principal == 0, "Vault already exists for this goal");

        vaults[goalId] = VaultPosition({
            owner: msg.sender,
            goalId: goalId,
            principal: msg.value,
            depositedAt: block.timestamp,
            isWithdrawn: false
        });

        emit VaultDeposited(goalId, msg.sender, msg.value);
    }

    /**
     * @dev Tính mock-yield ước lượng dựa trên thời gian khóa (mô phỏng 12% APY)
     */
    function calculateMockYield(uint256 goalId) public view returns (uint256) {
        VaultPosition memory v = vaults[goalId];
        if (v.principal == 0 || v.isWithdrawn) return 0;

        uint256 duration = block.timestamp - v.depositedAt;
        // Mock yield: 12% APY = (principal * 12 * duration) / (100 * 365 days)
        // Để demo hackathon thấy rõ ngay trong vài phút, ta cho tỷ lệ mock-yield linh hoạt
        uint256 mockRatePerMinute = (v.principal * 1) / 1000; // ~0.1% mỗi phút demo
        uint256 minutesPassed = duration / 60;
        if (minutesPassed == 0) minutesPassed = 1;

        return mockRatePerMinute * minutesPassed;
    }

    /**
     * @dev Khi Goal hoàn thành ("An nghỉ"):
     * - Hoàn trả 100% vốn gốc lại cho người chơi
     * - Trích 30% mock-yield gửi vào Cây Làng Phù Đổng
     */
    function completeGoal(uint256 goalId) external {
        VaultPosition storage v = vaults[goalId];
        require(v.owner == msg.sender, "Not vault owner");
        require(!v.isWithdrawn, "Already withdrawn");
        require(v.principal > 0, "No active vault");

        v.isWithdrawn = true;
        uint256 principal = v.principal;
        uint256 mockYield = calculateMockYield(goalId);
        uint256 communityShare = (mockYield * 30) / 100;

        // Trả lại 100% vốn gốc
        (bool success, ) = payable(msg.sender).call{value: principal}("");
        require(success, "Failed to return principal");

        // Góp năng lượng vào Cây Làng
        if (villageTreeContract != address(0) && communityShare > 0) {
            IVillageTree(villageTreeContract).contributeEnergy(communityShare);
        }

        emit VaultCompleted(goalId, msg.sender, principal, mockYield, communityShare);
    }

    // Cho phép nạp thêm thanh khoản trả mock yield (nếu cần)
    receive() external payable {}
}

