// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JourneyNFT
 * @dev ERC-721 NFT kỷ niệm hành trình trưởng thành của Măng Non khi Goal "An nghỉ"
 * Lưu giữ bằng chứng không thể giả mạo trên Avalanche C-Chain
 */
contract JourneyNFT {
    string public name = "Mang Non Journey NFT";
    string public symbol = "MANGNON";

    struct JourneyRecord {
        uint256 goalId;
        string goalName;
        string imageHash;
        uint256 intelligence;
        uint256 perseverance;
        uint256 fitness;
        uint256 creativity;
        uint256 interactionCount;
        uint256 completedAt;
    }

    uint256 public nextTokenId = 1;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => JourneyRecord) public records;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event JourneyMinted(uint256 indexed tokenId, address indexed recipient, uint256 goalId, string goalName);

    /**
     * @dev Mint NFT hành trình khi hoàn thành Goal
     */
    function mint(
        address to,
        uint256 goalId,
        string calldata goalName,
        string calldata imageHash,
        uint256[4] calldata finalStats,
        uint256 interactionCount
    ) external returns (uint256) {
        require(to != address(0), "Invalid recipient");

        uint256 tokenId = nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;

        records[tokenId] = JourneyRecord({
            goalId: goalId,
            goalName: goalName,
            imageHash: imageHash,
            intelligence: finalStats[0],
            perseverance: finalStats[1],
            fitness: finalStats[2],
            creativity: finalStats[3],
            interactionCount: interactionCount,
            completedAt: block.timestamp
        });

        emit Transfer(address(0), to, tokenId);
        emit JourneyMinted(tokenId, to, goalId, goalName);

        return tokenId;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Invalid address");
        return _balances[account];
    }

    function getJourneyRecord(uint256 tokenId) external view returns (JourneyRecord memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return records[tokenId];
    }
}
