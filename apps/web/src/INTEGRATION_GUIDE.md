# SPARK - Developer Integration Guide

## 🎮 Project Overview

**Spark** is an OnChain Mini-Games Hub where users can:
- Play mini-games (Chess & Tic-Tac-Toe)
- Earn ARK tokens
- Collect NFT badges based on XP progression
- Compete on global leaderboards

This is a **production-ready frontend** that requires backend and blockchain integration.

---

## 📁 Project Structure

```
/
├── App.tsx                    # Main application router
├── types/
│   └── index.ts              # TypeScript interfaces and utility functions
├── config/
│   └── gameData.ts           # Static game configuration
├── context/
│   └── WalletContext.tsx     # Wallet and user state management
├── pages/
│   ├── HomePage.tsx          # Landing page with game selection
│   ├── LobbyPage.tsx         # Game lobby and matchmaking
│   ├── GamePage.tsx          # Active gameplay screen
│   ├── ProfilePage.tsx       # User profile and stats
│   └── LeaderboardPage.tsx   # Global rankings
├── components/
│   ├── Header.tsx            # Navigation header
│   ├── GameCard.tsx          # Game selection card
│   ├── PixelAvatar.tsx       # User avatar component
│   ├── PixelNFTBadge.tsx     # NFT badge display
│   └── ui/                   # Shadcn UI components
└── styles/
    └── globals.css           # Global styles and design tokens
```

---

## 🔌 Integration Requirements

### 1. Web3 Wallet Integration

**Current State:** Mock implementation with fake wallet addresses

**Required:**
- Install: `ethers.js`, `wagmi`, or `web3modal`
- Connect to MetaMask, WalletConnect, or other wallets
- Listen for account/network changes
- Handle wallet disconnection

**Files to Update:**
- `/context/WalletContext.tsx` - Replace mock `connectWallet()` function

**Example (using ethers.js):**
```typescript
const connectWallet = async () => {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  setWalletAddress(accounts[0]);
  setIsConnected(true);
  
  // Fetch user data from backend
  await fetchUserProfile(accounts[0]);
};
```

---

### 2. Smart Contract Integration

**ARK Token Contract (ERC-20):**
- Read token balance
- Transfer tokens (for staked matches)
- Approve token spending

**Game Contract:**
- Store/update player XP
- Emit GameCompleted events
- Mint NFT badges at tier thresholds

**Files to Update:**
- `/context/WalletContext.tsx` - Add contract calls

**Example:**
```typescript
// Read ARK balance
const contract = new ethers.Contract(ARK_TOKEN_ADDRESS, ABI, provider);
const balance = await contract.balanceOf(walletAddress);
setArkBalance(balance.toString());
```

---

### 3. Backend API Endpoints

All API endpoints are documented in each page component. Here's a summary:

#### User Management
```
GET  /api/user/profile
POST /api/user/profile          # Update nickname
GET  /api/user/stats
GET  /api/user/nft-badges
GET  /api/user/match-history
```

#### Matchmaking
```
POST /api/matchmaking/join      # Start searching for opponent
POST /api/matchmaking/cancel    # Cancel search
```

#### Game Management
```
POST /api/match/start           # Initialize game
POST /api/match/result          # Submit match result
GET  /api/ai-opponent           # Get AI opponent data
```

#### Leaderboard
```
GET  /api/leaderboard?timeFilter={daily|weekly|alltime}
```

**Database Schema Needed:**
- Users (id, walletAddress, nickname, xp, tier, arkBalance, createdAt)
- Matches (id, gameId, player1Id, player2Id, winner, arkStaked, createdAt)
- NFTBadges (id, userId, badgeTier, unlockedAt)

---

### 4. WebSocket for Real-time Features

**Matchmaking:**
```javascript
const ws = new WebSocket('ws://your-server/matchmaking');

// Join queue
ws.send(JSON.stringify({
  action: 'join',
  gameId: 'chess',
  playMode: 'stake',
  stakeAmount: 50,
  playerXP: 1200
}));

// Listen for match found
ws.onmessage = (event) => {
  const { event: eventType, data } = JSON.parse(event.data);
  if (eventType === 'match_found') {
    // Navigate to game with opponent data
  }
};
```

**In-game Moves:**
```javascript
const gameWs = new WebSocket(`ws://your-server/game/${matchId}`);

// Send move
gameWs.send(JSON.stringify({ 
  action: 'move', 
  position: 4 
}));

// Receive opponent move
gameWs.onmessage = (event) => {
  const { action, position } = JSON.parse(event.data);
  if (action === 'opponent_move') {
    // Update board
  }
};
```

---

### 5. XP and Tier System

**Tier Thresholds:**
- Bronze: 0 - 499 XP
- Silver: 500 - 999 XP
- Gold: 1000 - 1999 XP
- Diamond: 2000+ XP

**XP Calculation Logic:**
Located in `/types/index.ts` - `calculateXPChange()` function

**Backend Implementation:**
1. Store XP in database
2. Calculate tier on every XP change
3. Check if user unlocked new NFT badge
4. Emit badge unlock event if needed

---

### 6. NFT Badge Minting

**When to Mint:**
- User reaches 500 XP (Silver)
- User reaches 1000 XP (Gold)
- User reaches 2000 XP (Diamond)

**Smart Contract Function:**
```solidity
function mintBadge(address player, uint256 tier) external {
    require(playerXP[player] >= tierThresholds[tier], "Insufficient XP");
    _mint(player, tier);
}
```

---

## 🎨 Design System

All design tokens are in `/styles/globals.css`:

**Colors:**
- Primary: Purple/Blue gradient
- Secondary: Pink/Purple
- Accent: Yellow/Orange
- Background: Dark theme

**Typography:**
- Uses custom "pixel-text" class for retro gaming feel
- Responsive font sizes (mobile/desktop)

**Components:**
- Shadcn UI library in `/components/ui/`
- All components are customizable via Tailwind classes

---

## 🔐 Security Considerations

1. **Never store private keys in frontend**
2. **Validate all moves server-side** (prevent cheating)
3. **Use nonces for transactions** (prevent replay attacks)
4. **Rate limit API endpoints**
5. **Sanitize user inputs** (nickname, chat messages)
6. **Verify smart contract interactions** on backend

---

## 🧪 Testing Checklist

- [ ] Wallet connection/disconnection
- [ ] Token balance display updates
- [ ] Matchmaking finds opponents
- [ ] Game moves sync between players
- [ ] XP calculation is correct
- [ ] NFT badges unlock at right thresholds
- [ ] Leaderboard updates in real-time
- [ ] Mobile responsiveness
- [ ] Smart contract gas optimization

---

## 📝 Placeholder Patterns

Throughout the codebase, you'll find these placeholders that need backend data:

```
{{user_wallet_address}}    - User's blockchain address
{{user_ark_balance}}       - ARK token balance from contract
{{user_xp}}                - Experience points from backend
{{user_tier}}              - Bronze/Silver/Gold/Diamond
{{user_nickname}}          - User's display name
{{player_name}}            - Opponent/leaderboard player name
{{player_rank}}            - Leaderboard position
{{match_result}}           - Win/Loss/Draw
{{ark_earned}}             - Tokens won/lost in match
{{xp_change}}              - XP gained/lost in match
{{active_players_count}}   - Real-time player count per game
```

---

## 🚀 Deployment Steps

1. **Setup Environment Variables:**
   ```bash
   VITE_API_URL=https://your-backend.com
   VITE_WS_URL=wss://your-backend.com
   VITE_ARK_CONTRACT_ADDRESS=0x...
   VITE_GAME_CONTRACT_ADDRESS=0x...
   VITE_CHAIN_ID=1 # or testnet
   ```

2. **Install Dependencies:**
   ```bash
   npm install ethers wagmi
   ```

3. **Deploy Smart Contracts:**
   - ARK Token (ERC-20)
   - Game Contract
   - NFT Badge Contract (ERC-721)

4. **Setup Backend:**
   - PostgreSQL/MongoDB database
   - REST API server
   - WebSocket server
   - Redis for matchmaking queue

5. **Test on Testnet:**
   - Use Sepolia or Goerli testnet
   - Get test ETH from faucet
   - Test all features thoroughly

6. **Deploy to Production:**
   - Frontend: Vercel/Netlify
   - Backend: AWS/GCP/Heroku
   - Database: Managed service
   - Monitor with Sentry/LogRocket

---

## 📞 Support

For questions about this codebase:
1. Check inline comments in each file
2. Review type definitions in `/types/index.ts`
3. Check component-specific integration notes

---

## 📄 License

This is a prototype/demo application. Update license before production use.

---

**Ready for Integration!** 🎮

All UI components are production-ready. Follow this guide to connect backend services and smart contracts.
