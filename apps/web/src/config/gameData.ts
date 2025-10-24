/**
 * SPARK - Game Configuration
 * Static game data and configuration
 * 
 * DEVELOPER NOTES:
 * - Games list is static (Chess & Tic-Tac-Toe only)
 * - Replace player counts with real-time data from backend
 * - ARK rewards should be fetched from smart contract
 */

import { Game } from "../types";

/**
 * Available games in the platform
 * Backend: Can be extended to fetch from database if games are dynamic
 */
export const GAMES: Game[] = [
  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    icon: "⭕",
    mode: "Free",
    arkReward: 10, // Backend: Fetch from smart contract reward pool
    nftReward: "Starter Badge",
    difficulty: "Easy",
    players: 0, // Backend: Replace with {{active_players_count}}
    illustration: "tictactoe",
    rules: [
      "⚠️ INFINITY VERSION - Each player can only have 3 pieces on the board",
      "When you place a 4th piece, your oldest piece automatically disappears",
      "Get 3 in a row (horizontal, vertical, or diagonal) to win",
      "30 seconds per turn - timeout = automatic loss",
      "First player to achieve 3 in a row wins the match"
    ]
  },
  {
    id: "connectfour",
    name: "Connect Four",
    icon: "🔴",
    mode: "Free",
    arkReward: 20, // Backend: Fetch from smart contract reward pool
    nftReward: "Strategy Badge",
    difficulty: "Medium",
    players: 0, // Backend: Replace with {{active_players_count}}
    illustration: "connectfour",
    rules: [
      "Standard 7x6 grid - drop tokens from the top",
      "Red player vs Yellow player alternate turns",
      "Connect 4 tokens in a row (horizontal, vertical, or diagonal) to win",
      "30 seconds per turn - timeout = automatic loss",
      "If the grid fills with no winner, board resets for another round"
    ]
  },
  {
    id: "rockpaperscissors",
    name: "Rock Paper Scissors",
    icon: "✊",
    mode: "Staked",
    arkReward: 30, // Backend: Fetch from smart contract reward pool
    nftReward: "Quick Draw Badge",
    difficulty: "Easy",
    players: 0, // Backend: Replace with {{active_players_count}}
    illustration: "rockpaperscissors",
    rules: [
      "First player to win 5 rounds takes the entire ARK stake pool",
      "Both players pick Rock, Paper, or Scissors simultaneously",
      "Rock beats Scissors, Scissors beats Paper, Paper beats Rock",
      "30 seconds per round - timeout = automatic round loss",
      "Play continues until one player reaches 5 round wins"
    ]
  }
];

/**
 * Test token claim amount
 * Backend: This should be configurable in your backend
 */
export const TEST_TOKEN_CLAIM_AMOUNT = 50;

/**
 * XP Thresholds for tier progression
 * Backend: Should match your smart contract tier logic
 */
export const XP_TIERS = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1000,
  DIAMOND: 2000,
} as const;
