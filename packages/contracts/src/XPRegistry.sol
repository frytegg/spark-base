// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract XPRegistry is AccessControl {
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");
    mapping(address => uint32) private _xp;

    event XPUpdated(address indexed player, uint32 oldXP, uint32 newXP);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SETTER_ROLE, admin);
    }

    function getPlayerXP(address player) external view returns (uint32) {
        return _xp[player];
    }

    function setXP(address player, uint32 newXP) external onlyRole(SETTER_ROLE) {
        uint32 old = _xp[player];
        _xp[player] = newXP;
        emit XPUpdated(player, old, newXP);
    }
}
