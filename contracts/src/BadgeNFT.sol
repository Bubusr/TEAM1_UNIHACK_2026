// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title BadgeNFT — Non-transferable (soulbound) badge for BusQuest route completion.
contract BadgeNFT is ERC721 {
    using Strings for uint256;

    // ── Errors ──────────────────────────────────────────────────────────
    error OnlyCheckInManager();
    error SoulboundTransferBlocked();
    error OnlyTokenOwner();

    // ── State ───────────────────────────────────────────────────────────
    address public checkInManager;
    uint256 private _nextTokenId;

    /// tokenId → routeId that the badge represents.
    mapping(uint256 => uint256) public badgeRouteId;

    string public constant BASE_URI = "https://busquest.app/api/badge/";

    // ── Events ──────────────────────────────────────────────────────────
    event BadgeMinted(address indexed to, uint256 indexed tokenId, uint256 routeId);

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(address _checkInManager) ERC721("BusQuest Badge", "BQBADGE") {
        checkInManager = _checkInManager;
        _nextTokenId = 1;
    }

    // ── Modifiers ───────────────────────────────────────────────────────
    modifier onlyCheckInManager() {
        if (msg.sender != checkInManager) revert OnlyCheckInManager();
        _;
    }

    // ── External functions ──────────────────────────────────────────────

    /// @notice Mint a soulbound badge. Only callable by CheckInManager.
    function mint(address to, uint256 routeId) external onlyCheckInManager returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        badgeRouteId[tokenId] = routeId;
        _safeMint(to, tokenId);
        emit BadgeMinted(to, tokenId, routeId);
    }

    /// @notice Burn a badge. Only the token owner may burn.
    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert OnlyTokenOwner();
        _burn(tokenId);
    }

    // ── Overrides ───────────────────────────────────────────────────────

    /// @dev Block all transfers except mint (from == 0) and burn (to == 0).
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferBlocked();
        }
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(BASE_URI, badgeRouteId[tokenId].toString());
    }
}
