// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/BadgeNFT.sol";
import "../src/VoucherManager.sol";
import "../src/CheckInManager.sol";

/// @notice Deploy all BusQuest contracts to Avalanche Fuji (or any configured network).
/// @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
///      Required env vars: DEPLOYER_PRIVATE_KEY, VERIFIER_ADDRESS, DEMO_PARTNER_ADDRESS
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address verifierAddr = vm.envAddress("VERIFIER_ADDRESS");
        address demoPartner = vm.envAddress("DEMO_PARTNER_ADDRESS");

        vm.startBroadcast(deployerKey);

        address deployer = vm.addr(deployerKey);
        uint256 nonce = vm.getNonce(deployer);

        // Predict CheckInManager address (deployed 3rd = nonce + 2)
        address predictedManager = computeCreateAddress(deployer, nonce + 2);

        // 1. Deploy BadgeNFT
        BadgeNFT badgeNFT = new BadgeNFT(predictedManager);
        console.log("BadgeNFT deployed at:", address(badgeNFT));

        // 2. Deploy VoucherManager
        VoucherManager voucherManager = new VoucherManager(predictedManager);
        console.log("VoucherManager deployed at:", address(voucherManager));

        // 3. Deploy CheckInManager (links to badge + voucher)
        CheckInManager checkInManager = new CheckInManager(
            verifierAddr,
            address(badgeNFT),
            address(voucherManager)
        );
        console.log("CheckInManager deployed at:", address(checkInManager));

        require(address(checkInManager) == predictedManager, "Deploy: address prediction mismatch");

        // 4. Register demo partner for route 1 with initial quota
        uint256 demoRouteId = 1;
        uint256 initialQuota = 100;

        voucherManager.registerPartner(demoPartner);
        voucherManager.setRoutePartner(demoRouteId, demoPartner);
        voucherManager.setQuota(demoPartner, initialQuota);

        console.log("Demo partner registered:", demoPartner);
        console.log("Route 1 partner set, quota:", initialQuota);

        vm.stopBroadcast();

        console.log("=== BusQuest Deployment Summary (TESTNET DEMO) ===");
        console.log("Network: Avalanche Fuji Testnet (chain 43113)");
        console.log("BadgeNFT:         ", address(badgeNFT));
        console.log("VoucherManager:   ", address(voucherManager));
        console.log("CheckInManager:   ", address(checkInManager));
        console.log("Verifier:         ", verifierAddr);
        console.log("Demo Partner:     ", demoPartner);
    }
}
