// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract GameEscrow is AccessControl {
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    IERC20 public immutable ark;

    struct Match {
        address p1;
        address p2;
        uint256 stake;
        uint8 state; // 0=new,1=joined,2=settled,3=refunded
        address winner; // optional after settle
    }

    uint256 public nextId = 1;
    mapping(uint256 => Match) public matches;

    event MatchCreated(uint256 indexed id, address indexed p1, uint256 stake);
    event MatchJoined(uint256 indexed id, address indexed p2);
    event MatchSettled(uint256 indexed id, address winner, uint256 payout);
    event MatchRefunded(uint256 indexed id);

    constructor(IERC20 ark_, address admin) {
        ark = ark_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SETTLER_ROLE, admin);
    }

    function createMatch(uint256 stake) external returns (uint256 id) {
        require(stake > 0, "stake=0");
        id = nextId++;
        matches[id] = Match(msg.sender, address(0), stake, 0, address(0));
        require(ark.transferFrom(msg.sender, address(this), stake), "p1 transfer failed");
        emit MatchCreated(id, msg.sender, stake);
    }

    function joinMatch(uint256 id) external {
        Match storage m = matches[id];
        require(m.p1 != address(0) && m.state == 0, "bad state");
        require(msg.sender != m.p1, "self");
        m.p2 = msg.sender;
        m.state = 1;
        require(ark.transferFrom(msg.sender, address(this), m.stake), "p2 transfer failed");
        emit MatchJoined(id, msg.sender);
    }

    // Backend arbiter calls after off-chain game completes
    function settle(uint256 id, address winner) external onlyRole(SETTLER_ROLE) {
        Match storage m = matches[id];
        require(m.state == 1, "not ready");
        require(winner == m.p1 || winner == m.p2 || winner == address(0), "invalid winner");
        m.state = 2;
        m.winner = winner;
        uint256 pot = m.stake * 2;
        if (winner == address(0)) {
            // draw: refund
            require(ark.transfer(m.p1, m.stake), "refund p1");
            require(ark.transfer(m.p2, m.stake), "refund p2");
            emit MatchRefunded(id);
        } else {
            require(ark.transfer(winner, pot), "payout");
            emit MatchSettled(id, winner, pot);
        }
    }
}
