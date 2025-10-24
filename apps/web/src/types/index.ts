/**
 * SPARK - Type Definitions
 * Core TypeScript interfaces for the Spark OnChain Mini-Games Hub
 */

// ============================================================================
// GAME TYPES
// ============================================================================

export interface Game {
  id: string;
  name: string;
  icon: string;
  mode: "Free" | "Staked";
  arkReward: number;
  nftReward: string;
  difficulty: "Easy" | "Medium" | "Hard";
  players: number;
  illustration: "chess" | "tictactoe" | "connectfour" | "rockpaperscissors" | "puzzle" | "trivia" | "speed" | "memory";
  rules?: string[]; // Optional game rules to display before match
}

// ============================================================================
// NFT & BADGE TYPES
// ============================================================================

export interface NFTBadge {
  id: string;
  name: string;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum";
  image: string;
  earnedDate?: string;
  locked: boolean;
  requiredXP: number; // Backend: XP threshold to unlock this badge
}

// ============================================================================
// PLAYER & USER TYPES
// ============================================================================

export interface Player {
  id: string; // Backend: User wallet address or unique identifier
  name: string; // Backend: Username or ENS name
  avatar: string; // Backend: IPFS URL or generated avatar
  level: number; // Backend: Calculated from total XP
  tier: "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum";
  arkBalance: number; // Backend: Current ARK token balance from blockchain
  xp: number; // Backend: Total experience points
  gamesWon: number; // Backend: Count of won games
  rank: number; // Backend: Global ranking position
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export type Screen = "landing" | "lobby" | "gameplay" | "profile" | "leaderboard";

export interface NavigationData {
  game?: Game;
  stakeAmount?: number;
  playMode?: "free" | "stake";
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate tier based on XP
 * Backend: Use this logic to determine user tier
 */
export function getTierFromXP(xp: number): "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum" {
  if (xp >= 2000) return "Diamond";
  if (xp >= 1000) return "Gold";
  if (xp >= 500) return "Silver";
  return "Bronze";
}

/**
 * Calculate XP change based on match outcome
 * Backend: Implement this in your XP calculation service
 * 
 * @param won - Whether the player won the match
 * @param playerXP - Current player's XP
 * @param opponentXP - Opponent's XP
 * @returns XP change (positive for gain, negative for loss)
 */
export function calculateXPChange(won: boolean, playerXP: number, opponentXP: number): number {
  const xpDiff = opponentXP - playerXP;
  const baseXP = 25;
  
  if (won) {
    // Win against stronger opponent = more XP
    if (xpDiff > 500) return baseXP + 30;
    if (xpDiff > 200) return baseXP + 20;
    if (xpDiff > 0) return baseXP + 10;
    // Win against weaker opponent = less XP
    if (xpDiff < -500) return baseXP - 10;
    if (xpDiff < -200) return baseXP - 5;
    return baseXP;
  } else {
    // Loss against stronger opponent = small XP loss
    if (xpDiff > 500) return -5;
    if (xpDiff > 200) return -10;
    if (xpDiff > 0) return -15;
    // Loss against weaker opponent = bigger XP loss
    if (xpDiff < -500) return -35;
    if (xpDiff < -200) return -30;
    return -20;
  }
}

/**
 * Get NFT badges configuration
 * Backend: Store this in your database or smart contract
 */
export function getNFTBadgeThresholds(): { tier: string; requiredXP: number }[] {
  return [
    { tier: "Bronze", requiredXP: 0 },
    { tier: "Silver", requiredXP: 500 },
    { tier: "Gold", requiredXP: 1000 },
    { tier: "Diamond", requiredXP: 2000 },
  ];
}
