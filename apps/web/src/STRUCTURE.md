# SPARK - Project Structure

## 📂 Clean, Production-Ready Architecture

This document explains the reorganized file structure for easy developer handoff.

---

## 🗂️ Directory Organization

```
/
├── 📄 App.tsx                          # Main app router
├── 📄 INTEGRATION_GUIDE.md             # Complete integration instructions
├── 📄 DATA_REQUIREMENTS.md             # Backend data requirements reference
├── 📄 STRUCTURE.md                     # This file
│
├── 📁 types/
│   └── index.ts                        # TypeScript interfaces, types, and utilities
│
├── 📁 config/
│   └── gameData.ts                     # Static game configuration (Chess, Tic-Tac-Toe)
│
├── 📁 context/
│   └── WalletContext.tsx               # Wallet connection and user state
│
├── 📁 pages/
│   ├── HomePage.tsx                    # Landing page with stats and game selection
│   ├── LobbyPage.tsx                   # Game lobby and matchmaking
│   ├── GamePage.tsx                    # Active gameplay (Tic-Tac-Toe/Chess)
│   ├── ProfilePage.tsx                 # User profile, NFT badges, stats
│   └── LeaderboardPage.tsx             # Global rankings
│
├── 📁 components/
│   ├── Header.tsx                      # Navigation header with wallet connect
│   ├── GameCard.tsx                    # Game selection card component
│   ├── PixelAvatar.tsx                 # Pixel-art style avatar generator
│   ├── PixelNFTBadge.tsx               # NFT badge display component
│   ├── ArcadeIllustrations.tsx         # Game illustrations (Chess, TTT)
│   ├── TokenPool.tsx                   # Token pool visualization
│   │
│   ├── 📁 figma/
│   │   └── ImageWithFallback.tsx       # Protected: Image component with fallback
│   │
│   └── 📁 ui/                          # Shadcn UI component library
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       ├── sheet.tsx
│       ├── sonner.tsx                  # Toast notifications
│       ├── tabs.tsx
│       └── ... (other UI components)
│
└── 📁 styles/
    └── globals.css                     # Global styles, design tokens, Tailwind config
```

---

## 📑 File Purposes

### Core Files

#### **App.tsx**
- Main application entry point
- Handles routing between pages
- Wraps app with WalletProvider
- Clean, simple router logic

#### **types/index.ts**
- All TypeScript interfaces (Game, Player, NFTBadge, etc.)
- Utility functions (getTierFromXP, calculateXPChange)
- Type definitions for navigation and state
- **No mock data** - only type definitions

#### **config/gameData.ts**
- Static game configurations (Chess, Tic-Tac-Toe)
- XP tier thresholds
- Test token claim amount
- Immutable game data

---

### Context

#### **context/WalletContext.tsx**
- Manages wallet connection state
- Stores user data (ARK balance, XP, nickname)
- **Mock implementation** - requires Web3 integration
- Detailed developer notes for integration

**Key Functions:**
- `connectWallet()` - Connect to Web3 wallet
- `disconnectWallet()` - Disconnect wallet
- `claimTestTokens()` - Claim test ARK tokens
- `addXP()` - Update user XP
- `setNickname()` - Update user nickname

---

### Pages

#### **pages/HomePage.tsx**
- Hero section with platform intro
- User stats display (ARK, XP, Tier, NFT count)
- XP progress bar to next tier
- Game selection cards
- **Data:** User stats from WalletContext

#### **pages/LobbyPage.tsx**
- Game information and illustration
- Play mode selection (Free/Staked)
- Stake amount input
- Matchmaking buttons (Multiplayer/AI)
- **Data:** Game config, user balance, matchmaking status

#### **pages/GamePage.tsx**
- Active gameplay screen
- Tic-Tac-Toe implementation (working demo)
- Chess placeholder (needs chess.js integration)
- Timer, game state, match result modal
- **Data:** Match details, opponent info, game moves

#### **pages/ProfilePage.tsx**
- User profile header with avatar
- Editable nickname
- Tabs: NFT Badges, Statistics, Match History
- XP progress and tier display
- **Data:** User profile, badges, stats, match history

#### **pages/LeaderboardPage.tsx**
- Time filter (Daily/Weekly/All-time)
- Top 3 podium display
- Full rankings table
- **Data:** Leaderboard rankings from backend

---

### Components

#### **Header.tsx**
- Navigation menu (responsive)
- Wallet connect button
- ARK balance display with claim button
- Mobile hamburger menu
- Disconnect wallet dialog

#### **GameCard.tsx**
- Displays game info (name, difficulty, players)
- Game illustration
- Play button
- Validates wallet connection before play

#### **PixelAvatar.tsx**
- Generates unique pixel-art avatars from seed (username)
- Consistent avatar per user
- Used in profile, leaderboard, game screens

#### **PixelNFTBadge.tsx**
- Displays NFT badges (Bronze, Silver, Gold, Diamond)
- Shows locked/unlocked state
- Used in profile page

#### **ArcadeIllustrations.tsx**
- SVG illustrations for games
- Chess and Tic-Tac-Toe visuals
- Retro arcade style

---

### UI Components (`/components/ui/`)

All components are from **Shadcn UI library**:
- Production-ready
- Fully accessible
- Customizable with Tailwind
- TypeScript support

**Key Components:**
- `Button` - Various button styles
- `Card` - Container component
- `Badge` - Labels and tags
- `Dialog/AlertDialog` - Modals
- `Input` - Form inputs
- `Progress` - Progress bars
- `Tabs` - Tabbed interfaces
- `Sonner` - Toast notifications

---

## 🎨 Styling System

### **styles/globals.css**

Contains:
1. Tailwind CSS imports
2. Custom design tokens (colors, spacing)
3. Global typography settings
4. `.pixel-text` class for retro font style
5. Component-specific styles

**Design Tokens:**
```css
--primary: Purple/blue gradient
--secondary: Pink/purple
--accent: Yellow/orange
--background: Dark theme
--foreground: White text
--muted: Gray tones
```

**Typography:**
- Base: System fonts
- Pixel: Custom pixel font for retro feel
- Responsive sizing (mobile/desktop)

---

## 🔄 Data Flow

### 1. User Authentication
```
User → Connect Wallet → WalletContext → Fetch Profile → Update UI
```

### 2. Game Selection
```
HomePage → Select Game → LobbyPage → Matchmaking → GamePage
```

### 3. Match Flow
```
LobbyPage → Join Queue → Find Opponent → GamePage → Play → Submit Result → Update XP/ARK
```

### 4. XP Update
```
Match End → Calculate XP → Update Backend → Check Tier Change → Unlock Badge (if needed)
```

---

## 🚫 Removed Files

Cleaned up old structure:
- ❌ `/components/mockData.ts` - Replaced by `/types/` and `/config/`
- ❌ `/components/WalletContext.tsx` - Moved to `/context/`
- ❌ `/components/LandingScreen.tsx` - Renamed to `/pages/HomePage.tsx`
- ❌ `/components/GameLobby.tsx` - Renamed to `/pages/LobbyPage.tsx`
- ❌ `/components/GameplayScreen.tsx` - Renamed to `/pages/GamePage.tsx`
- ❌ `/components/ProfileScreen.tsx` - Renamed to `/pages/ProfilePage.tsx`
- ❌ `/components/LeaderboardScreen.tsx` - Renamed to `/pages/LeaderboardPage.tsx`

---

## ✅ What's Ready

- ✅ Complete UI/UX implementation
- ✅ Responsive design (mobile/desktop)
- ✅ Type-safe with TypeScript
- ✅ Clean component architecture
- ✅ Consistent design system
- ✅ Developer notes in every file
- ✅ Placeholder patterns for backend data
- ✅ Ready for Web3 integration

---

## 🔜 What Needs Integration

- 🔌 Web3 wallet connection (MetaMask, WalletConnect)
- 🔌 Smart contracts (ARK token, game logic, NFT badges)
- 🔌 Backend API endpoints (user, matchmaking, leaderboard)
- 🔌 WebSocket for real-time gameplay
- 🔌 Database for user profiles and match history
- 🔌 Chess game logic (chess.js library)
- 🔌 Production authentication and security

---

## 📖 How to Use This Structure

1. **Frontend Developers:**
   - Work in `/pages/` and `/components/`
   - Update UI based on designs
   - Add new features following existing patterns

2. **Backend Developers:**
   - Read `INTEGRATION_GUIDE.md` for API specs
   - Check `DATA_REQUIREMENTS.md` for data formats
   - Look for `// TODO:` comments in context/pages

3. **Smart Contract Developers:**
   - See `/context/WalletContext.tsx` for contract calls
   - Review XP calculation logic in `/types/index.ts`
   - Implement badge minting in NFT contract

4. **Full Stack Developers:**
   - Start with `/context/WalletContext.tsx`
   - Implement WebSocket in `/pages/GamePage.tsx`
   - Connect all API endpoints as documented

---

## 🎯 Quick Start for Integration

1. **Install Web3 dependencies:**
   ```bash
   npm install ethers wagmi
   ```

2. **Update WalletContext:**
   ```typescript
   // Replace mock wallet connection with real Web3
   ```

3. **Setup environment variables:**
   ```
   VITE_API_URL=your-backend
   VITE_ARK_CONTRACT=0x...
   ```

4. **Connect backend APIs:**
   - Follow patterns in page components
   - Replace empty arrays with API calls

5. **Test on testnet:**
   - Use Sepolia or Goerli
   - Verify all flows work end-to-end

---

**The UI is 100% complete and production-ready. Just add your backend!** 🚀
