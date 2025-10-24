# SPARK - Data Requirements Reference

## 🔗 Quick Reference for Backend Developers

This document lists all data points that need to be provided by the backend/blockchain.

---

## 🎮 HomePage (`/pages/HomePage.tsx`)

### User Stats Section
```javascript
// From WalletContext + Backend API
{
  arkBalance: {{user_ark_balance}},        // From blockchain ARK contract
  xp: {{user_xp}},                         // From backend database
  tier: {{user_tier}},                     // Calculated: Bronze/Silver/Gold/Diamond
  unlockedNFTs: {{unlocked_nfts_count}}    // From backend or smart contract
}
```

### Games List
```javascript
// From config/gameData.ts (static) + Real-time data
{
  id: "chess",
  name: "Chess",
  players: {{active_players_count}},       // Real-time count from backend
  arkReward: {{reward_amount}},            // From smart contract
  difficulty: "Hard"                       // Static
}
```

---

## 🎯 LobbyPage (`/pages/LobbyPage.tsx`)

### Matchmaking Request
```javascript
// POST /api/matchmaking/join
{
  gameId: "{{game_id}}",
  playMode: "free" | "stake",
  stakeAmount: {{amount}},
  playerXP: {{user_xp}}
}

// Response
{
  matchId: "{{match_id}}",
  status: "searching" | "found",
  opponentId?: "{{opponent_id}}",
  opponentName?: "{{opponent_name}}",
  opponentXP?: {{opponent_xp}}
}
```

### Stake Validation
```javascript
// Check before allowing staked match
if (stakeAmount > userARKBalance) {
  // Show error
}
```

---

## 🎮 GamePage (`/pages/GamePage.tsx`)

### Match Initialization
```javascript
// From navigation props + WebSocket
{
  matchId: "{{match_id}}",
  opponentId: "{{opponent_id}}",
  opponentName: "{{opponent_name}}",
  opponentXP: {{opponent_xp}},
  stakeAmount: {{stake_amount}},
  playMode: "free" | "stake"
}
```

### Game Move (WebSocket)
```javascript
// Send
{
  action: "move",
  matchId: "{{match_id}}",
  playerId: "{{user_id}}",
  position: {{board_position}}
}

// Receive
{
  action: "opponent_move",
  position: {{board_position}}
}
```

### Match Result Submission
```javascript
// POST /api/match/result
{
  matchId: "{{match_id}}",
  winner: "{{winner_player_id}}",
  loser: "{{loser_player_id}}",
  result: "win" | "loss" | "draw",
  arkTransferred: {{amount}},              // Positive for winner, negative for loser
  xpChanges: {
    "{{winner_id}}": {{xp_gained}},
    "{{loser_id}}": {{xp_lost}}
  },
  gameDuration: {{seconds}}
}
```

---

## 👤 ProfilePage (`/pages/ProfilePage.tsx`)

### User Profile
```javascript
// GET /api/user/profile
{
  id: "{{user_id}}",
  walletAddress: "{{wallet_address}}",
  nickname: "{{user_nickname}}",
  avatar: "{{avatar_url}}",                // IPFS or generated
  xp: {{user_xp}},
  tier: "{{user_tier}}",
  arkBalance: {{ark_balance}},
  stats: {
    gamesPlayed: {{total_games}},
    gamesWon: {{games_won}},
    winRate: {{win_rate_percentage}}
  }
}
```

### NFT Badges
```javascript
// GET /api/user/nft-badges
[
  {
    id: "{{badge_id}}",
    name: "{{badge_name}}",
    tier: "Bronze" | "Silver" | "Gold" | "Diamond",
    unlocked: true | false,
    unlockedAt: "{{timestamp}}",           // ISO 8601
    requiredXP: {{xp_threshold}}
  }
]
```

### Match History
```javascript
// GET /api/user/match-history?limit=10
[
  {
    id: "{{match_id}}",
    game: "{{game_name}}",                 // "Chess" or "Tic-Tac-Toe"
    opponentName: "{{opponent_name}}",
    result: "Win" | "Loss" | "Draw",
    arkEarned: {{ark_amount}},             // Can be negative
    xpChange: {{xp_change}},               // Can be negative
    date: "{{timestamp}}"                  // ISO 8601
  }
]
```

### Update Nickname
```javascript
// PUT /api/user/profile
{
  nickname: "{{new_nickname}}"             // 3-20 characters
}
```

---

## 🏆 LeaderboardPage (`/pages/LeaderboardPage.tsx`)

### Leaderboard Rankings
```javascript
// GET /api/leaderboard?timeFilter=alltime&limit=100
[
  {
    rank: {{player_rank}},                 // 1, 2, 3, ...
    id: "{{player_id}}",
    name: "{{player_name}}",
    avatar: "{{avatar_url}}",
    xp: {{player_xp}},
    tier: "{{player_tier}}",
    gamesWon: {{games_won}}
  }
]
```

### Time Filters
- `daily`: Rankings for last 24 hours
- `weekly`: Rankings for last 7 days
- `alltime`: All-time rankings

---

## 🔐 WalletContext (`/context/WalletContext.tsx`)

### Wallet Connection
```javascript
// From Web3 provider
{
  isConnected: true | false,
  walletAddress: "{{user_wallet_address}}", // 0x...
  chainId: {{network_id}}                   // 1 (mainnet), 11155111 (sepolia), etc.
}
```

### ARK Token Balance
```javascript
// Read from smart contract
const balance = await arkContract.balanceOf(walletAddress);
// Returns: {{ark_balance}} (in wei, convert to tokens)
```

### XP from Blockchain/Backend
```javascript
// Option 1: From smart contract
const xp = await gameContract.getPlayerXP(walletAddress);

// Option 2: From backend API
// GET /api/user/xp?address={{wallet_address}}
{ xp: {{user_xp}} }
```

### Test Token Claim
```javascript
// POST /api/faucet/claim
{
  walletAddress: "{{wallet_address}}"
}

// Response
{
  success: true,
  amount: 50,
  txHash: "{{transaction_hash}}"
}
```

---

## 📊 Real-time Data Updates

### WebSocket Events

#### Matchmaking
```javascript
// ws://your-server/matchmaking
{
  event: "match_found",
  data: {
    matchId: "{{match_id}}",
    opponentId: "{{opponent_id}}",
    opponentName: "{{opponent_name}}",
    opponentXP: {{opponent_xp}}
  }
}

{
  event: "match_timeout",
  data: {}
}
```

#### In-Game
```javascript
// ws://your-server/game/:matchId
{
  event: "opponent_move",
  data: {
    position: {{board_position}},
    timestamp: "{{timestamp}}"
  }
}

{
  event: "game_end",
  data: {
    winner: "{{winner_id}}",
    reason: "checkmate" | "timeout" | "forfeit"
  }
}
```

#### Leaderboard Updates (Optional)
```javascript
// ws://your-server/leaderboard
{
  event: "rank_change",
  data: {
    playerId: "{{player_id}}",
    oldRank: {{old_rank}},
    newRank: {{new_rank}}
  }
}
```

---

## 🎯 XP Calculation Reference

### Formula (from `/types/index.ts`)

```javascript
function calculateXPChange(won, playerXP, opponentXP) {
  const xpDiff = opponentXP - playerXP;
  const baseXP = 25;
  
  if (won) {
    // Win against stronger opponent = more XP
    if (xpDiff > 500) return baseXP + 30;  // +55 XP
    if (xpDiff > 200) return baseXP + 20;  // +45 XP
    if (xpDiff > 0) return baseXP + 10;    // +35 XP
    
    // Win against weaker opponent = less XP
    if (xpDiff < -500) return baseXP - 10; // +15 XP
    if (xpDiff < -200) return baseXP - 5;  // +20 XP
    return baseXP;                         // +25 XP
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
```

---

## 🔢 Tier Thresholds

```javascript
const TIERS = {
  BRONZE: 0,      // 0 - 499 XP
  SILVER: 500,    // 500 - 999 XP
  GOLD: 1000,     // 1000 - 1999 XP
  DIAMOND: 2000   // 2000+ XP
};
```

---

## ✅ Validation Rules

### Nickname
- Min length: 3 characters
- Max length: 20 characters
- Allowed: Letters, numbers, spaces, underscores
- No profanity (implement server-side filter)

### Stake Amount
- Min: 1 ARK
- Max: User's ARK balance
- Must be integer

### Match Moves
- Validate all moves server-side
- Check if move is legal according to game rules
- Detect and prevent cheating attempts

---

This reference should be used alongside the detailed integration notes in each page component.
