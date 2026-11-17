// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/CheckInManager.sol";
import "../src/BadgeNFT.sol";
import "../src/VoucherManager.sol";

contract BusQuestTest is Test {
    // ── Actors ───────────────────────────────────────────────────────────
    uint256 internal verifierKey;
    address internal verifierAddr;

    uint256 internal playerKey;
    address internal player;

    address internal partner = address(0xBEEF);
    address internal owner;

    // ── Contracts ────────────────────────────────────────────────────────
    BadgeNFT internal badge;
    VoucherManager internal voucher;
    CheckInManager internal manager;

    // ── Constants ────────────────────────────────────────────────────────
    uint256 constant ROUTE_ID = 1;
    uint256 constant QUOTA = 10;

    // ── Setup ────────────────────────────────────────────────────────────
    function setUp() public {
        owner = address(this);

        verifierKey = 0xA11CE;
        verifierAddr = vm.addr(verifierKey);

        playerKey = 0xB0B;
        player = vm.addr(playerKey);

        // Deploy: BadgeNFT and VoucherManager both need CheckInManager address.
        // Deploy CheckInManager with placeholder addresses, then set via constructor.
        // We need to predict addresses. Easier: deploy in correct order.
        // CheckInManager is the caller for badge and voucher.
        // We deploy BadgeNFT and VoucherManager with a predicted address (or use create2).
        // Simplest: deploy manager first with dummy addresses, replace using vm.prank.
        // But the contracts don't have setters for badgeNFT / voucherManager.
        // Instead, deploy badge+voucher with the manager address, deploy manager pointing to them.
        // Use vm.computeCreateAddress to predict manager address.
        uint256 nonce = vm.getNonce(owner);
        address predictedManager = computeCreateAddress(owner, nonce + 2);

        badge = new BadgeNFT(predictedManager);
        voucher = new VoucherManager(predictedManager);
        manager = new CheckInManager(verifierAddr, address(badge), address(voucher));

        assertEq(address(manager), predictedManager, "nonce prediction wrong");

        // Setup partner config
        voucher.registerPartner(partner);
        voucher.setRoutePartner(ROUTE_ID, partner);
        voucher.setQuota(partner, QUOTA);
    }

    // ── EIP-712 helpers ──────────────────────────────────────────────────

    function _completionDigest(address _player, uint256 routeId, uint256 nonce, uint256 deadline)
        internal
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(
            abi.encode(manager.COMPLETION_TYPEHASH(), _player, routeId, nonce, deadline)
        );
        return manager.hashTypedDataV4(structHash);
    }

    function _signCompletion(uint256 signerKey, address _player, uint256 routeId, uint256 nonce, uint256 deadline)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = _completionDigest(_player, routeId, nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _redeemDigest(uint256 voucherId, address _partner, uint256 expiry)
        internal
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(
            abi.encode(voucher.REDEEM_TYPEHASH(), voucherId, _partner, expiry)
        );
        return voucher.hashTypedDataV4(structHash);
    }

    function _signRedeem(uint256 signerKey, uint256 voucherId, address _partner, uint256 expiry)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = _redeemDigest(voucherId, _partner, expiry);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ── Test 1: Valid completion — 1 badge + 1 voucher ───────────────────
    function test_ValidRouteCompletion() public {
        uint256 nonce = 1;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, nonce, deadline);

        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, nonce, sig);

        // Exactly 1 badge
        assertEq(badge.balanceOf(player), 1);
        uint256 tokenId = 1; // first minted
        assertEq(badge.ownerOf(tokenId), player);
        assertEq(badge.badgeRouteId(tokenId), ROUTE_ID);

        // Exactly 1 voucher
        assertEq(voucher.nextVoucherId(), 2); // started at 1, now 2
        (address vOwner, address vPartner, uint256 vRouteId,, bool vUsed) = voucher.vouchers(1);
        assertEq(vOwner, player);
        assertEq(vPartner, partner);
        assertEq(vRouteId, ROUTE_ID);
        assertFalse(vUsed);
    }

    // ── Test 2a: Wrong signer ────────────────────────────────────────────
    function test_WrongSignerReverts() public {
        uint256 badKey = 0xDEAD;
        bytes memory sig = _signCompletion(badKey, player, ROUTE_ID, 1, block.timestamp + 1 hours);
        vm.prank(player);
        vm.expectRevert(CheckInManager.InvalidSignature.selector);
        manager.completeRoute(ROUTE_ID, block.timestamp + 1 hours, 1, sig);
    }

    // ── Test 2b: Expired deadline ────────────────────────────────────────
    function test_ExpiredDeadlineReverts() public {
        uint256 deadline = block.timestamp - 1;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        vm.expectRevert(CheckInManager.DeadlineExpired.selector);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig);
    }

    // ── Test 2c: Reused nonce ────────────────────────────────────────────
    function test_ReusedNonceReverts() public {
        uint256 nonce = 42;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, nonce, deadline);

        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, nonce, sig);

        // Second player attempt with same nonce, different routeId would need different completion
        // Try same player same nonce (even different route) — but we need different route partner setup
        // For simplicity just try same exact call → first revert is RouteAlreadyCompleted; test nonce
        // Create second player who also tries same nonce on route 2 — but route2 has no partner, skip.
        // Test: use a fresh player, same nonce
        address player2 = address(0x1234);
        bytes memory sig2 = _signCompletion(verifierKey, player2, ROUTE_ID, nonce, deadline);

        // Setup quota for player2 route
        voucher.setQuota(partner, QUOTA); // reset quota

        // player2 is different, different nonce state — this should succeed
        vm.prank(player2);
        manager.completeRoute(ROUTE_ID, deadline, nonce, sig2);

        // Now player tries same nonce again (already marked)
        uint256 nonce2 = 43;
        uint256 deadline2 = block.timestamp + 2 hours;
        bytes memory sig3 = _signCompletion(verifierKey, player, ROUTE_ID, nonce, deadline2);
        // nonce is already used for player
        vm.prank(player);
        vm.expectRevert(CheckInManager.NonceAlreadyUsed.selector);
        manager.completeRoute(ROUTE_ID, deadline2, nonce, sig3);
    }

    // ── Test 2d: Wrong route (no partner setup) ──────────────────────────
    function test_UnknownRouteReverts() public {
        uint256 unknownRoute = 999;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, unknownRoute, 1, deadline);
        vm.prank(player);
        vm.expectRevert(VoucherManager.NoPartnerForRoute.selector);
        manager.completeRoute(unknownRoute, deadline, 1, sig);
    }

    // ── Test 3: Same route twice → revert ───────────────────────────────
    function test_DuplicateCompletionReverts() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig1 = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig1);

        bytes memory sig2 = _signCompletion(verifierKey, player, ROUTE_ID, 2, deadline);
        vm.prank(player);
        vm.expectRevert(CheckInManager.RouteAlreadyCompleted.selector);
        manager.completeRoute(ROUTE_ID, deadline, 2, sig2);
    }

    // ── Test 4a: Badge non-transferable ──────────────────────────────────
    function test_BadgeNonTransferable() public {
        // Mint a badge
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig);

        uint256 tokenId = 1;
        address recipient = address(0xCAFE);

        // transferFrom should revert
        vm.prank(player);
        vm.expectRevert(BadgeNFT.SoulboundTransferBlocked.selector);
        badge.transferFrom(player, recipient, tokenId);
    }

    // ── Test 4b: Badge burn by owner ─────────────────────────────────────
    function test_BadgeBurnByOwner() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig);

        uint256 tokenId = 1;
        vm.prank(player);
        badge.burn(tokenId);
        assertEq(badge.balanceOf(player), 0);
    }

    // ── Test 5a: Voucher redeem twice → revert ───────────────────────────
    function test_VoucherRedeemTwiceReverts() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig);

        uint256 voucherId = 1;
        uint256 redeemExpiry = block.timestamp + 1 hours;
        bytes memory rsig = _signRedeem(playerKey, voucherId, partner, redeemExpiry);

        vm.prank(partner);
        voucher.redeem(voucherId, redeemExpiry, rsig);

        vm.prank(partner);
        vm.expectRevert(VoucherManager.VoucherAlreadyUsed.selector);
        voucher.redeem(voucherId, redeemExpiry, rsig);
    }

    // ── Test 5b: Expired voucher → revert ────────────────────────────────
    function test_ExpiredVoucherReverts() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig);

        // Fast-forward past voucher expiry (30 days)
        vm.warp(block.timestamp + 31 days);

        uint256 voucherId = 1;
        uint256 redeemExpiry = block.timestamp + 1 hours;
        bytes memory rsig = _signRedeem(playerKey, voucherId, partner, redeemExpiry);

        vm.prank(partner);
        vm.expectRevert(VoucherManager.VoucherExpired.selector);
        voucher.redeem(voucherId, redeemExpiry, rsig);
    }

    // ── Test 5c: Wrong partner → revert ──────────────────────────────────
    function test_WrongPartnerReverts() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig);

        uint256 voucherId = 1;
        uint256 redeemExpiry = block.timestamp + 1 hours;
        address badPartner = address(0x9999);
        bytes memory rsig = _signRedeem(playerKey, voucherId, partner, redeemExpiry);

        vm.prank(badPartner);
        vm.expectRevert(VoucherManager.OnlyVoucherPartner.selector);
        voucher.redeem(voucherId, redeemExpiry, rsig);
    }

    // ── Test 5d: Wrong signature for redeem → revert ─────────────────────
    function test_WrongRedeemSignatureReverts() public {
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig);

        uint256 voucherId = 1;
        uint256 redeemExpiry = block.timestamp + 1 hours;
        // Sign with wrong key (not player)
        bytes memory rsig = _signRedeem(0xDEAD, voucherId, partner, redeemExpiry);

        vm.prank(partner);
        vm.expectRevert(VoucherManager.InvalidRedeemSignature.selector);
        voucher.redeem(voucherId, redeemExpiry, rsig);
    }

    // ── Test 6: Partner quota exhausted → revert ──────────────────────────
    function test_QuotaExhaustedReverts() public {
        // Set quota to 1
        voucher.setQuota(partner, 1);

        // First player completes fine
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig1 = _signCompletion(verifierKey, player, ROUTE_ID, 1, deadline);
        vm.prank(player);
        manager.completeRoute(ROUTE_ID, deadline, 1, sig1);

        // Second player: quota now 0, should revert
        address player2 = address(0xABCD);
        bytes memory sig2 = _signCompletion(verifierKey, player2, ROUTE_ID, 2, deadline);
        vm.prank(player2);
        vm.expectRevert(VoucherManager.PartnerQuotaExhausted.selector);
        manager.completeRoute(ROUTE_ID, deadline, 2, sig2);
    }
}
