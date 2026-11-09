// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GoalRegistry
 * @dev Quản lý mục tiêu (Goal) và sinh linh Măng Non trên Avalanche (Game L1 / Subnet)
 * Theo đặc tả Măng Non - UniHack 2026 (Idea03)
 */
contract GoalRegistry {
    enum Personality { Curious, Calm, Excited, Shy }
    enum Level { Beginner, Intermediate, Advanced }

    struct GoalStats {
        uint256 intelligence;  // Trí tuệ
        uint256 perseverance;  // Kiên trì
        uint256 fitness;       // Thể lực
        uint256 creativity;    // Sáng tạo
    }

    struct Goal {
        uint256 id;
        address owner;
        string name;
        Level level;
        Personality personality;
        string imageHash;       // Hash ảnh khởi sinh hoặc CID IPFS
        GoalStats stats;
        uint256 interactionCount;
        uint256 createdAt;
        uint256 lastInteraction;
        uint256 linkedGoalId;   // Nối với Goal khác (0 = không nối)
        bool hasVault;
        bool isResting;         // Đã hoàn thành và chuyển vào Vườn Ký Ức
    }

    uint256 public nextGoalId = 1;
    uint8 public constant MAX_ACTIVE_GOALS = 5;

    mapping(uint256 => Goal) public goals;
    mapping(address => uint256[]) private playerGoalIds;

    event GoalCreated(uint256 indexed goalId, address indexed owner, string name, Personality personality);
    event InteractionRecorded(uint256 indexed goalId, uint8 statType, uint256 boostAmount, uint256 newTotal);
    event GoalsLinked(uint256 indexed goalId1, uint256 indexed goalId2);
    event GoalResting(uint256 indexed goalId, address indexed owner, uint256 totalInteractions);

    modifier onlyGoalOwner(uint256 goalId) {
        require(goals[goalId].owner == msg.sender, "Not goal owner");
        _;
    }

    /**
     * @dev Tạo Măng Non mới gắn với 1 Goal
     */
    function createGoal(
        string calldata name,
        uint8 levelIndex,
        uint8 personalityIndex,
        string calldata imageHash,
        uint256[4] calldata initialStats,
        bool hasVault
    ) external returns (uint256) {
        uint256 activeCount = getActiveGoalCount(msg.sender);
        require(activeCount < MAX_ACTIVE_GOALS, "Exceeded max active goals (5)");

        uint256 goalId = nextGoalId++;

        Goal storage g = goals[goalId];
        g.id = goalId;
        g.owner = msg.sender;
        g.name = name;
        g.level = Level(levelIndex);
        g.personality = Personality(personalityIndex);
        g.imageHash = imageHash;
        g.stats = GoalStats({
            intelligence: initialStats[0],
            perseverance: initialStats[1],
            fitness: initialStats[2],
            creativity: initialStats[3]
        });
        g.interactionCount = 0;
        g.createdAt = block.timestamp;
        g.lastInteraction = block.timestamp;
        g.linkedGoalId = 0;
        g.hasVault = hasVault;
        g.isResting = false;

        playerGoalIds[msg.sender].push(goalId);

        emit GoalCreated(goalId, msg.sender, name, g.personality);
        return goalId;
    }

    /**
     * @dev Ghi nhận tương tác học tập hàng ngày
     * @param statType 0: intelligence, 1: perseverance, 2: fitness, 3: creativity
     */
    function recordInteraction(
        uint256 goalId,
        uint8 statType,
        uint256 boostAmount
    ) external onlyGoalOwner(goalId) {
        Goal storage g = goals[goalId];
        require(!g.isResting, "Goal is already resting");

        _boostStat(g, statType, boostAmount);
        g.interactionCount += 1;
        g.lastInteraction = block.timestamp;

        // Cơ chế Map liên kết chỉ số: Lan toả 20% sang Goal được nối
        if (g.linkedGoalId != 0 && goals[g.linkedGoalId].owner == msg.sender && !goals[g.linkedGoalId].isResting) {
            uint256 spreadAmount = boostAmount / 5;
            if (spreadAmount > 0) {
                _boostStat(goals[g.linkedGoalId], statType, spreadAmount);
            }
        }

        uint256 newTotal = g.stats.intelligence + g.stats.perseverance + g.stats.fitness + g.stats.creativity;
        emit InteractionRecorded(goalId, statType, boostAmount, newTotal);
    }

    function _boostStat(Goal storage g, uint8 statType, uint256 boostAmount) internal {
        if (statType == 0) g.stats.intelligence += boostAmount;
        else if (statType == 1) g.stats.perseverance += boostAmount;
        else if (statType == 2) g.stats.fitness += boostAmount;
        else if (statType == 3) g.stats.creativity += boostAmount;
    }

    /**
     * @dev Nối 2 Măng Non trên bản đồ Rừng Tre để nhận hiệu ứng lan tỏa
     */
    function linkGoals(uint256 goalId1, uint256 goalId2) external {
        require(goals[goalId1].owner == msg.sender && goals[goalId2].owner == msg.sender, "Must own both goals");
        require(goalId1 != goalId2, "Cannot link to self");
        require(!goals[goalId1].isResting && !goals[goalId2].isResting, "Goal is resting");

        goals[goalId1].linkedGoalId = goalId2;
        goals[goalId2].linkedGoalId = goalId1;

        emit GoalsLinked(goalId1, goalId2);
    }

    /**
     * @dev Người chơi chủ động cho Măng Non "An nghỉ" khi hoàn thành Goal
     */
    function restGoal(uint256 goalId) external onlyGoalOwner(goalId) {
        Goal storage g = goals[goalId];
        require(!g.isResting, "Already resting");

        g.isResting = true;
        emit GoalResting(goalId, msg.sender, g.interactionCount);
    }

    function getActiveGoalCount(address player) public view returns (uint256) {
        uint256[] memory ids = playerGoalIds[player];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!goals[ids[i]].isResting) {
                count++;
            }
        }
        return count;
    }

    function getPlayerGoals(address player) external view returns (Goal[] memory) {
        uint256[] memory ids = playerGoalIds[player];
        Goal[] memory result = new Goal[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = goals[ids[i]];
        }
        return result;
    }
}

