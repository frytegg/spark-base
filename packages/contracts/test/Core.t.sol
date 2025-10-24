// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ARKToken.sol";
import "../src/XPRegistry.sol";
import "../src/BadgeNFT.sol";
import "../src/GameEscrow.sol";

contract CoreTest is Test {
    ARKToken ark;
    XPRegistry xp;
    BadgeNFT badge;
    GameEscrow escrow;

    address admin = address(this);
    address alice = address(0xA11CE);
    address bob   = address(0xB0B);

    function setUp() public {
        ark = new ARKToken();
        ark.setFaucet(admin);
        xp = new XPRegistry(admin);
        badge = new BadgeNFT(admin, "");
        escrow = new GameEscrow(IERC20(address(ark)), admin);

        ark.faucetMint(alice, 1_000e18);
        ark.faucetMint(bob,   1_000e18);
        vm.prank(alice); IERC20(address(ark)).approve(address(escrow), type(uint256).max);
        vm.prank(bob);   IERC20(address(ark)).approve(address(escrow), type(uint256).max);
    }

    function test_match_flow_win() public {
        vm.startPrank(alice);
        uint256 id = escrow.createMatch(100e18);
        vm.stopPrank();

        vm.prank(bob);
        escrow.joinMatch(id);

        escrow.settle(id, alice);

        assertEq(ark.balanceOf(alice), 1_000e18 - 100e18 + 200e18);
        assertEq(ark.balanceOf(bob),   1_000e18 - 100e18);
    }

    function test_xp_and_badge() public {
        xp.setXP(alice, 510);
        badge.mintBadge(alice, 1); // Silver
        assertTrue(badge.hasTier(alice, 1));
    }
}
