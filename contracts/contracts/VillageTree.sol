// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VillageTree
 * @dev Hợp đồng Cây Làng Phù Đổng (C-Chain)
 * Tích lũy đóng góp từ mock-yield Mầm Lực Vault & nhà tài trợ CSR.
 * Khi năng lượng đạt ngưỡng, Cây Làng "bùng nổ" ban phước (Blessing) cho toàn bộ cộng đồng.
 */
contract VillageTree {
    string public name = "Cay Lang Phu Dong";
    
    uint256 public totalLifetimeEnergy;
    uint256 public currentCycleEnergy;
    uint256 public thresholdForBlessing = 500; // Ngưỡng năng lượng mỗi mùa
    uint256 public blessingCycleCount = 0;

    mapping(address => uint256) public playerContributions;

    event EnergyContributed(address indexed contributor, uint256 amount, uint256 newCycleTotal);
    event BlessingTriggered(uint256 indexed cycle, uint256 energyReleased, uint256 timestamp);

    /**
     * @dev Đóng góp năng lượng (từ Vault, người chơi hoặc nhà tài trợ CSR)
     */
    function contributeEnergy(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        totalLifetimeEnergy += amount;
        currentCycleEnergy += amount;
        playerContributions[msg.sender] += amount;

        emit EnergyContributed(msg.sender, amount, currentCycleEnergy);

        // Kiểm tra điều kiện bùng nổ ban phước
        if (currentCycleEnergy >= thresholdForBlessing) {
            _triggerBlessing();
        }
    }

    function _triggerBlessing() internal {
        blessingCycleCount += 1;
        uint256 energyReleased = currentCycleEnergy;
        currentCycleEnergy = 0; // Bắt đầu mùa mới

        emit BlessingTriggered(blessingCycleCount, energyReleased, block.timestamp);
    }

    /**
     * @dev Lấy trạng thái hiện tại của Cây Làng
     */
    function getTreeStatus() external view returns (
        uint256 lifetime,
        uint256 currentCycle,
        uint256 threshold,
        uint256 cyclesCompleted
    ) {
        return (totalLifetimeEnergy, currentCycleEnergy, thresholdForBlessing, blessingCycleCount);
    }
}

