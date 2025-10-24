// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ARKToken.sol";
import "../src/XPRegistry.sol";
import "../src/BadgeNFT.sol";
import "../src/GameEscrow.sol";

contract Deploy is Script {
    function run() external {
        address admin = vm.envAddress("DEPLOYER_ADDRESS");
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        ARKToken ark = new ARKToken();
        ark.setFaucet(admin);

        XPRegistry xp = new XPRegistry(admin);
        BadgeNFT badge = new BadgeNFT(admin, vm.envString("BADGE_BASE_URI"));
        GameEscrow escrow = new GameEscrow(IERC20(address(ark)), admin);

        // grant roles to backend signer later if different than admin

        vm.stopBroadcast();

        console2.log("ARK", address(ark));
        console2.log("XPRegistry", address(xp));
        console2.log("BadgeNFT", address(badge));
        console2.log("GameEscrow", address(escrow));
    }
}
