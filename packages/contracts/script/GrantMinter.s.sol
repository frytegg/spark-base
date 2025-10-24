// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/BadgeNFT.sol";

contract GrantMinter is Script {
    function run() external {
        address admin = vm.envAddress("DEPLOYER_ADDRESS");
        address badgeAddr = vm.envAddress("BADGE_ADDRESS");
        address minter = vm.envAddress("MINTER_ADDRESS");
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        BadgeNFT badge = BadgeNFT(badgeAddr);
        // grant minter role if not already
        bytes32 MINTER_ROLE = badge.MINTER_ROLE();
        badge.grantRole(MINTER_ROLE, minter);
        vm.stopBroadcast();
    }
}
