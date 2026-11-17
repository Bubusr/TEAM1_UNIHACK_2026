// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title VoucherManager — Issues and redeems one-time vouchers for BusQuest.
contract VoucherManager is Ownable, EIP712 {
    // ── Types ───────────────────────────────────────────────────────────
    struct Voucher {
        address owner;
        address partner;
        uint256 routeId;
        uint256 expiry;
        bool used;
    }

    // ── Errors ──────────────────────────────────────────────────────────
    error OnlyCheckInManager();
    error PartnerNotRegistered();
    error PartnerQuotaExhausted();
    error NoPartnerForRoute();
    error VoucherAlreadyUsed();
    error VoucherExpired();
    error SignatureExpired();
    error OnlyVoucherPartner();
    error InvalidRedeemSignature();

    // ── Events ──────────────────────────────────────────────────────────
    event VoucherIssued(uint256 indexed voucherId, address indexed owner, address indexed partner, uint256 routeId);
    event VoucherRedeemed(uint256 indexed voucherId, address indexed partner);
    event PartnerRegistered(address indexed partner);
    event RoutePartnerSet(uint256 indexed routeId, address indexed partner);
    event QuotaSet(address indexed partner, uint256 amount);

    // ── Constants ───────────────────────────────────────────────────────
    bytes32 public constant REDEEM_TYPEHASH =
        keccak256("Redeem(uint256 voucherId,address partner,uint256 expiry)");

    uint256 public constant VOUCHER_VALIDITY = 30 days;

    // ── State ───────────────────────────────────────────────────────────
    address public checkInManager;

    uint256 public nextVoucherId;
    mapping(uint256 => Voucher) public vouchers;

    mapping(address => uint256) public partnerQuota;
    mapping(address => bool) public isPartner;
    mapping(uint256 => address) public routePartner;

    // ── Constructor ─────────────────────────────────────────────────────
    constructor(address _checkInManager)
        Ownable(msg.sender)
        EIP712("BusQuest", "1")
    {
        checkInManager = _checkInManager;
        nextVoucherId = 1;
    }

    // ── Modifiers ───────────────────────────────────────────────────────
    modifier onlyCheckInManager() {
        if (msg.sender != checkInManager) revert OnlyCheckInManager();
        _;
    }

    // ── Public view helpers ─────────────────────────────────────────────

    /// @dev Expose EIP-712 digest for off-chain signing and test verification.
    function hashTypedDataV4(bytes32 structHash) external view returns (bytes32) {
        return _hashTypedDataV4(structHash);
    }

    // ── External — issue (called by CheckInManager) ─────────────────────
    function issue(address to, uint256 routeId) external onlyCheckInManager returns (uint256 voucherId) {
        address partner = routePartner[routeId];
        if (partner == address(0)) revert NoPartnerForRoute();
        if (!isPartner[partner]) revert PartnerNotRegistered();
        if (partnerQuota[partner] == 0) revert PartnerQuotaExhausted();

        unchecked {
            partnerQuota[partner] -= 1;
        }

        voucherId = nextVoucherId++;
        vouchers[voucherId] = Voucher({
            owner: to,
            partner: partner,
            routeId: routeId,
            expiry: block.timestamp + VOUCHER_VALIDITY,
            used: false
        });

        emit VoucherIssued(voucherId, to, partner, routeId);
    }

    // ── External — redeem (called by partner) ───────────────────────────
    /// @param voucherId The voucher to redeem.
    /// @param expiry    Short-lived signature expiry chosen by the voucher owner.
    /// @param signature EIP-712 signature from the voucher owner.
    function redeem(uint256 voucherId, uint256 expiry, bytes calldata signature) external {
        Voucher storage v = vouchers[voucherId];
        if (v.owner == address(0)) revert VoucherExpired(); // non-existent
        if (v.used) revert VoucherAlreadyUsed();
        if (block.timestamp > v.expiry) revert VoucherExpired();
        if (block.timestamp > expiry) revert SignatureExpired();
        if (msg.sender != v.partner) revert OnlyVoucherPartner();

        bytes32 structHash = keccak256(
            abi.encode(REDEEM_TYPEHASH, voucherId, v.partner, expiry)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        if (signer != v.owner) revert InvalidRedeemSignature();

        v.used = true;
        emit VoucherRedeemed(voucherId, msg.sender);
    }

    // ── Admin ───────────────────────────────────────────────────────────
    function registerPartner(address partner) external onlyOwner {
        isPartner[partner] = true;
        emit PartnerRegistered(partner);
    }

    function setRoutePartner(uint256 routeId, address partner) external onlyOwner {
        routePartner[routeId] = partner;
        emit RoutePartnerSet(routeId, partner);
    }

    function setQuota(address partner, uint256 amount) external onlyOwner {
        partnerQuota[partner] = amount;
        emit QuotaSet(partner, amount);
    }
}
