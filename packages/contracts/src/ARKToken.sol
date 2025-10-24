// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ARKToken is ERC20, Ownable {
    address public faucet; // backend minter

    constructor() ERC20("ARK Token", "ARK") Ownable(msg.sender) {}

    function setFaucet(address f) external onlyOwner { faucet = f; }

    function faucetMint(address to, uint256 amount) external {
        require(msg.sender == faucet || msg.sender == owner(), "not authorized");
        _mint(to, amount);
    }
}
