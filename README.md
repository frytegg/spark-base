# Spark

Competitive on-chain mini-games platform on Base. Players earn ARK tokens by winning matches across multiple game types, with stakes escrowed on-chain.

Built for the **2025 Base Batches Online Hackathon**.

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Contracts** | Solidity 0.8.24, Foundry, OpenZeppelin |
| **Backend** | Node.js, Fastify, Prisma, PostgreSQL, Redis |
| **Frontend** | React 18, Vite, Wagmi, Web3Modal, Tailwind CSS |
| **Chain** | Base Sepolia (testnet) |

## Games

| Game | Mode | Reward |
|------|------|--------|
| Tic-Tac-Toe (Infinity) | Free | 10 ARK |
| Connect Four | Free | 20 ARK |
| Rock Paper Scissors | Staked | 30 ARK |
| Chess | Free | 15 ARK |

## Smart Contracts

- **ARKToken** - ERC20 game currency with faucet
- **GameEscrow** - Holds stakes during matches, settles winners
- **BadgeNFT** - ERC721 achievement badges (Bronze/Silver/Gold/Diamond)
- **XPRegistry** - On-chain experience point tracking

## Getting Started

```bash
pnpm install

# Start PostgreSQL + Redis
docker-compose -f infra/docker-compose.yml up -d

# Backend (http://localhost:3000)
pnpm dev:api

# Frontend (http://localhost:5173)
pnpm dev:web
```

## Project Structure

```
apps/
  api/          # Fastify backend (REST + WebSocket)
  web/          # React frontend
packages/
  contracts/    # Foundry smart contracts
  shared/       # ABIs and shared types
infra/          # Docker Compose (Postgres + Redis)
```

## Player Progression

- Earn XP per match
- Tier ladder: Bronze (0) -> Silver (500) -> Gold (1000) -> Diamond (2000)
- Unlock NFT badges at each tier
- Global leaderboard rankings
