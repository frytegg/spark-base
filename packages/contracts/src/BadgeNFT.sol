// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract BadgeNFT is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    // tokenId = (uint256(uint160(player)) << 8) | tier
    mapping(address => mapping(uint8 => bool)) public hasTier;

    string private _base;

    constructor(address admin, string memory baseURI_) ERC721("Spark Badges", "SPRB") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _base = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    function setBaseURI(string calldata u) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _base = u;
    }

    function tokenIdOf(address player, uint8 tier) public pure returns (uint256) {
        return (uint256(uint160(player)) << 8) | uint256(tier);
    }

    function mintBadge(address player, uint8 tier) external onlyRole(MINTER_ROLE) {
        require(!hasTier[player][tier], "already minted");
        hasTier[player][tier] = true;
        _mint(player, tokenIdOf(player, tier));
    }

    /// @dev Override tokenURI to map low 8-bit tier to a static metadata file per tier
    ///  tier: 0=BRONZE, 1=SILVER, 2=GOLD, 3=DIAMOND
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        uint8 tier = uint8(tokenId & 0xFF);
        string memory key;
        if (tier == 0) key = "bronze.json";
        else if (tier == 1) key = "silver.json";
        else if (tier == 2) key = "gold.json";
        else if (tier == 3) key = "diamond.json";
        else key = Strings.toString(tier);
        string memory base = _baseURI();
        if (bytes(base).length == 0) return key;
        return string(abi.encodePacked(base, key));
    }

    // Required override to resolve multiple inheritance
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
