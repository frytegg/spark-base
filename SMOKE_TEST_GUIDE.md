# SPARK OnChain App - Smoke Test Guide

## Prerequisites Setup

Before starting, ensure you have:
- Two browser profiles or two different browsers (Chrome + Firefox, or Chrome normal + Chrome incognito)
- Two different MetaMask wallets with test ETH on Base Sepolia (Chain ID: 84532)
- Some test ARK tokens in both wallets (use faucet if needed)

---

## Step 0: Environment Preparation

### Terminal 1 - Start API Backend
```bash
cd apps/api
npm run dev
```

**Expected Output:**
- Server should start on port 3000 (or configured port)
- Should see: "API server listening on port XXXX"
- WebSocket endpoints ready: `/matchmaking` and `/game/:matchId`

**Paste the startup logs here for verification**

---

### Terminal 2 - Start Web Frontend
```bash
cd apps/web
npm run dev
```

**Expected Output:**
- Vite dev server starts on port 3000 (or 5173)
- Should see: "Local: http://localhost:XXXX"
- Should compile without errors

**Paste the startup logs here for verification**

---

## Step 1: Browser Setup

### Browser 1 (P1 - Player 1)
1. Open: `http://localhost:3000` (or the port shown)
2. Open Developer Console (F12)
3. Go to Console tab - keep it open to monitor WebSocket messages

### Browser 2 (P2 - Player 2)
1. Open: `http://localhost:3000` in a different browser/profile
2. Open Developer Console (F12)
3. Go to Console tab - keep it open

---

## Step 2: Connect Wallets

### Browser 1 (P1)
1. Click **"Connect Wallet"** button in header
2. Connect your first MetaMask wallet
3. Approve the connection
4. **Verify:** 
   - Header shows truncated address: `0xABCD...1234`
   - If wrong network, banner appears → click "Switch Network"
   
**P1 Wallet Address:** `________________________` (fill this in)

### Browser 2 (P2)
1. Click **"Connect Wallet"** button in header
2. Connect your second MetaMask wallet (different from P1)
3. Approve the connection
4. **Verify:** Address is different from P1

**P2 Wallet Address:** `________________________` (fill this in)

---

## Step 3: Check ARK Balance (Optional - Get Tokens if Needed)

### Both Browsers
1. Look at header - you should see ARK balance
2. If balance is 0 or too low:
   - Click on the ARK balance in header
   - Click "Claim Test Tokens" button
   - Confirm transaction
   - Wait for confirmation
   
**P1 ARK Balance:** `________` ARK  
**P2 ARK Balance:** `________` ARK

---

## Step 4: P1 Starts Staked Match

### Browser 1 (P1) - CRITICAL STEP
1. On home page, click on **"Tic-Tac-Toe"** (or any game)
2. You're now in the Lobby page
3. Select **"Staked"** play mode (right button)
4. Set stake amount: **10** ARK
5. Click **"Stake 10 ARK & Play"** button

### What happens in P1:
Watch the toast notifications (bottom right):
- ⏳ "Preparing stake..."
- ⏳ "Approving ARK tokens..." → **MetaMask popup appears**

6. **APPROVE** the token approval transaction in MetaMask
7. Wait for confirmation (~5-10 seconds)

- ⏳ "Creating match escrow..." → **MetaMask popup appears again**

8. **CONFIRM** the createMatch transaction
9. Wait for confirmation

- ⏳ "Connecting to matchmaking..."
- ⏳ "Searching for opponent..."

### In Console (Browser 1):
You should see:
```
Connecting to matchmaking WebSocket: ws://localhost:XXXX/matchmaking
WebSocket connected to matchmaking
Sending: {"action":"join","wallet":"0x...","gameId":"tictactoe","playMode":"stake","stakeAmount":10,"playerXP":0,"escrowId":"1"}
```

**Copy the console logs and paste here:**
```
[P1 Console Logs]
```

**P1 Status:** Waiting for opponent ⏳

---

## Step 5: P2 Joins Staked Match

### Browser 2 (P2)
1. Click on **"Tic-Tac-Toe"** game
2. Select **"Staked"** play mode
3. Set stake amount: **10** ARK
4. Click **"Stake 10 ARK & Play"**

### What happens in P2:
5. **APPROVE** token approval transaction
6. **CONFIRM** createMatch transaction
7. Should see "Searching for opponent..."

### In Console (Browser 2):
You should see:
```
Connecting to matchmaking WebSocket: ws://localhost:XXXX/matchmaking
WebSocket message: {event: "match_found", data: {...}}
```

---

## Step 6: Match Found! (Both Browsers)

### Browser 1 (P1) - Should see:
- ✅ Toast: "Match found!"
- **Console should show:**
```javascript
WebSocket message: {
  event: "match_found", 
  data: {
    matchId: "clxxxxx...",
    escrowId: "1",
    opponentWallet: "0x..." (P2's address),
    role: "p1"
  }
}
POST /api/match/start with escrowId
```

**P1 Match Data - Copy from console:**
```json
{
  "matchId": "",
  "escrowId": "",
  "opponentWallet": "",
  "role": ""
}
```

### Browser 2 (P2) - Should see:
- ✅ Toast: "Match found!"
- **MetaMask popup appears** for joinMatch(escrowId) transaction
- **Console shows:**
```javascript
WebSocket message: {event: "match_found", data: {...}}
P2 joined match on-chain: 1
```

7. **CONFIRM** the joinMatch transaction in P2

**P2 Match Data - Copy from console:**
```json
{
  "matchId": "",
  "escrowId": "",
  "opponentWallet": "",
  "role": ""
}
```

---

## Step 7: Verify Game Page Navigation

### Both Browsers Should:
- Automatically navigate to Game Page
- See game board (Tic-Tac-Toe grid)
- See opponent info at top

### Browser 1 (P1) - Verify:
- Top left shows: **YOU** with your address
- Top right shows: **OPP** with P2's address
- Stake amount visible: 10 ARK

**Screenshot or describe what you see:** ________________________

### Browser 2 (P2) - Verify:
- Top left shows: **YOU** with your address
- Top right shows: **OPP** with P1's address
- Stake amount visible: 10 ARK

**Screenshot or describe what you see:** ________________________

---

## Step 8: Play the Game (Move Relay Test)

### Browser 1 (P1) - You start as X
1. Click any cell in the Tic-Tac-Toe board (e.g., center cell)
2. **Check console:** Should see `Sending move: 4`
3. Your cell should show **X**

### Browser 2 (P2) - Should immediately see:
4. **Check console:** Should see `Opponent moved: 4`
5. The same cell should show **X** on P2's board
6. Now it's P2's turn (you're O)

### Browser 2 (P2) - Make a move
7. Click a different cell
8. **Check console:** Should see `Sending move: X`
9. Cell shows **O**

### Browser 1 (P1) - Should immediately see:
10. **Check console:** Should see `Opponent moved: X`
11. The cell shows **O** on P1's board

**Continue playing 2-3 more moves to verify relay works**

**Paste move logs from both consoles:**
```
[P1 Moves Log]


[P2 Moves Log]

```

---

## Step 9: End Game

### Option A: Play until someone wins
- Continue taking turns until there's a winner
- Winner's browser should show victory screen

### Option B: Manual end (for testing)
One player can forfeit or report result

### The Winner's Browser:
- Should see game end animation
- Should see result screen

**Game Result:**
- Winner: P1 / P2 (circle one)
- Duration: _______ seconds

---

## Step 10: Result Submission

### Winner's Browser (or both can submit):
1. Game should auto-submit result
2. **Check console:** Should see:
```
Submitting game result...
POST /api/match/result
Result submitted successfully
```

**Check API Terminal:** Should see:
```
POST /api/match/result 200
Match result saved: {...}
```

**Paste API logs:**
```
[API Result Logs]

```

---

## Step 11: Verify Profile Updates

### Browser 1 (P1):
1. Click **"Profile"** in header
2. Check your XP
3. Check match history - should show the game just played

**P1 Profile Data:**
- XP: _______ (should have changed)
- Match History: Shows recent match? Yes / No
- Match result shown correctly? Yes / No

### Browser 2 (P2):
1. Click **"Profile"** in header
2. Check your XP
3. Check match history

**P2 Profile Data:**
- XP: _______ (should have changed)
- Match History: Shows recent match? Yes / No
- Match result shown correctly? Yes / No

---

## Step 12: Verify Leaderboard

### Both Browsers:
1. Click **"Leaderboard"** in header
2. Find your wallet addresses in the list

**Leaderboard:**
- P1 visible? Yes / No - Position: _______
- P2 visible? Yes / No - Position: _______
- XP values match profile? Yes / No
- Rankings correct (winner higher if different XP)? Yes / No

---

## ✅ Test Completion Checklist

Mark each item as you complete it:

- [ ] Step 0: API and Web servers started
- [ ] Step 1: Two browsers opened
- [ ] Step 2: Both wallets connected with different addresses
- [ ] Step 3: Both have ARK balance > 10
- [ ] Step 4: P1 approved + created escrow successfully
- [ ] Step 5: P2 approved + created escrow successfully
- [ ] Step 6: Both received match_found with matchId and escrowId
- [ ] Step 6: P1 POSTed /api/match/start
- [ ] Step 6: P2 called joinMatch(escrowId) transaction
- [ ] Step 7: Both navigated to game page showing opponent wallets
- [ ] Step 8: Moves relayed in real-time between browsers
- [ ] Step 9: Game ended with clear winner
- [ ] Step 10: Result submitted to /api/match/result successfully
- [ ] Step 11: Both profiles show updated XP
- [ ] Step 12: Leaderboard shows both players with correct rankings

---

## 🐛 If Something Fails

### Common Issues & Fixes

**Network Banner Won't Go Away:**
- MetaMask → Networks → Add Base Sepolia manually
- Chain ID: 84532
- RPC: (check your .env VITE_BASE_RPC_URL)

**Transaction Rejected:**
- Check you have enough ETH for gas
- Check ARK balance >= stake amount

**WebSocket Not Connecting:**
- Check API console - is WebSocket server running?
- Check browser console for connection errors
- Verify API URL in .env matches running server

**Match Not Found:**
- Wait 10-15 seconds
- Check both browsers sent "join" message (console logs)
- Check API console for matchmaking messages

**Moves Not Relaying:**
- Check game WebSocket connected (console shows "Connected to game")
- Verify matchId is same in both browsers

**Result Not Submitting:**
- Check API is running
- Check browser console for error message
- Verify /api/match/result endpoint responding

---

## 📋 Final Report Template

After completing all steps, provide this summary:

```
=== SPARK SMOKE TEST REPORT ===

Date: ___________
Tester: ___________

SETUP:
- API Port: _______
- Web Port: _______
- P1 Wallet: 0x______...______
- P2 Wallet: 0x______...______

RESULTS:
✅/❌ Wallet Connection
✅/❌ Token Approval (P1)
✅/❌ Escrow Creation (P1)
✅/❌ Token Approval (P2)
✅/❌ Escrow Creation (P2)
✅/❌ Matchmaking (both received match_found)
✅/❌ P1 POST /api/match/start with escrowId
✅/❌ P2 joinMatch transaction
✅/❌ Game Page Navigation
✅/❌ Move Relay (real-time)
✅/❌ Game End
✅/❌ Result Submission
✅/❌ Profile XP Update
✅/❌ Leaderboard Accuracy

ERRORS ENCOUNTERED:
[List any errors]

CONSOLE LOGS:
[Attach key console logs]

API LOGS:
[Attach key API logs]

OVERALL RESULT: ✅ PASS / ❌ FAIL

NOTES:
[Any additional observations]
```

---

## Ready to Start?

1. Make sure you have both terminals ready (API + Web)
2. Have two browsers/profiles prepared
3. Have two wallets with test ETH and ARK
4. Keep this guide open in a third window
5. Start with **Step 0** and work through sequentially

**When ready, paste the output from Step 0 (API and Web startup logs) and I'll verify you're good to proceed!**
