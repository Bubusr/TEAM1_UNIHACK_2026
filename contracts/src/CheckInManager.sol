// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./BadgeNFT.sol";
import "./VoucherManager.sol";

/// @title CheckInManager — Verifies route completion and awards badge + voucher.
contract CheckInManager is Ownable, EIP712 {
    // ── Errors ──────────────────────────────────────────────────────────
    error DeadlineExpired();
    error NonceAlreadyUsed();
    error RouteAlreadyCompleted();
    error InvalidSignature();
    error ZeroAddress();

    // ── Events ──────────────────────────────────────────────────────────
    event RouteCompleted(address indexed player, uint256 indexed routeId);
    event VerifierUpdated(address indexed newVerifier);

    // ── Constants ───────────────────────────────────────────────────────
    bytes32 public constant COMPLETION_TYPEHASH =
        keccak256("Completion(address player,uint256 routeId,uint256 nonce,uint256 deadline)");

    // ── State ───────────────────────────────────────────────────────────
    address public verifier;
    BadgeNFT public badgeNFT;
    VoucherManager public voucherManager;

    /// player → routeId → completed
    mapping(address => mapping(uint256 => bool)) public completed;
    /// player → nonce → used
    mapping(address => mapping(uint256 => bool)) public usedNonce;

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(address _verifier, address _badgeNFT, address _voucherManager)
        Ownable(msg.sender)
        EIP712("BusQuest", "1")
    {
        verifier = _verifier;
        badgeNFT = BadgeNFT(_badgeNFT);
        voucherManager = VoucherManager(_voucherManager);
    }

    // ── Public view helpers ─────────────────────────────────────────────

    /// @dev Expose EIP-712 digest for off-chain signing and test verification.
    function hashTypedDataV4(bytes32 structHash) external view returns (bytes32) {
        return _hashTypedDataV4(structHash);
    }

    // ── External ────────────────────────────────────────────────────────

    /// @notice Complete a route. Caller is the player.
    /// @param routeId  The route being completed.
    /// @param deadline Unix timestamp after which the server signature expires.
    /// @param nonce    Single-use nonce to prevent replay.
    /// @param signature EIP-712 signature from the verifier server.
    function completeRoute(
        uint256 routeId,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external {
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (usedNonce[msg.sender][nonce]) revert NonceAlreadyUsed();
        if (completed[msg.sender][routeId]) revert RouteAlreadyCompleted();

        // Verify EIP-712 signature from verifier
        bytes32 structHash = keccak256(
            abi.encode(COMPLETION_TYPEHASH, msg.sender, routeId, nonce, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != verifier) revert InvalidSignature();

        // Mark state
        usedNonce[msg.sender][nonce] = true;
        completed[msg.sender][routeId] = true;

        // Award badge and voucher
        badgeNFT.mint(msg.sender, routeId);
        voucherManager.issue(msg.sender, routeId);

        emit RouteCompleted(msg.sender, routeId);
    }

    /// @notice Update the verifier address. Only owner.
    function setVerifier(address _verifier) external onlyOwner {
        if (_verifier == address(0)) revert ZeroAddress();
        verifier = _verifier;
        emit VerifierUpdated(_verifier);
    }
}
