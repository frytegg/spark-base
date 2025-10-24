import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { prisma } from "../client.js";

const Wallet = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const Nick = z.string().min(3).max(20).regex(/^[\w ]+$/);

const TIERS = [
  { name: "BRONZE", threshold: 0 },
  { name: "SILVER", threshold: 500 },
  { name: "GOLD", threshold: 1000 },
  { name: "DIAMOND", threshold: 2000 }
] as const;

function tierFromXP(xp: number) {
  if (xp >= 2000) return "DIAMOND";
  if (xp >= 1000) return "GOLD";
  if (xp >= 500) return "SILVER";
  return "BRONZE";
}

export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/api/user/profile", async (req, reply) => {
    try {
      const { wallet } = z.object({ wallet: Wallet }).parse(req.query);
      let user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
      if (!user) user = await prisma.user.create({ data: { walletAddress: wallet } });
      // Aggregate stats and earnings
      const matches = await prisma.match.findMany({ where: { OR: [{ p1Id: user.id }, { p2Id: user.id }] } });
      const gamesPlayed = matches.length;
      const gamesWon = matches.filter((m: any) => m.winnerId === user.id).length;
      const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
      const totalArkEarned = matches.reduce((acc: number, m: any) => {
        if (m.result === "DRAW") return acc;
        if (m.winnerId === user.id) return acc + (m.arkStaked || 0);
        // if lost
        return acc - (m.arkStaked || 0);
      }, 0);
      return {
        id: user.id,
        walletAddress: user.walletAddress,
        nickname: user.nickname,
        avatar: user.avatar,
        xp: user.xp,
        tier: user.tier,
        arkBalance: 0, // frontend reads on-chain; kept for shape parity
        stats: { gamesPlayed, gamesWon, winRate },
        totalArkEarned
      };
    } catch (e) {
      // Fallback to a default profile if DB is temporarily unavailable, to avoid blocking UI
      const q: any = req.query || {};
      const wallet = typeof q.wallet === "string" ? q.wallet : "0x0000000000000000000000000000000000000000";
      return {
        id: "unknown",
        walletAddress: wallet,
        nickname: "",
        avatar: "",
        xp: 0,
        tier: "BRONZE",
        arkBalance: 0,
        stats: { gamesPlayed: 0, gamesWon: 0, winRate: 0 },
        totalArkEarned: 0,
        fallback: true
      } as any;
    }
  });

  app.put("/api/user/profile", async (req) => {
    const { wallet, nickname } = z.object({ wallet: Wallet, nickname: Nick }).parse(req.body);
    const user = await prisma.user.upsert({
      where: { walletAddress: wallet },
      update: { nickname },
      create: { walletAddress: wallet, nickname }
    });
    return { id: user.id, nickname: user.nickname };
  });

  app.get("/api/user/nft-badges", async (req) => {
    const { wallet } = z.object({ wallet: Wallet }).parse(req.query);
    const user = await prisma.user.findUniqueOrThrow({ where: { walletAddress: wallet } });
    const unlocked = await prisma.badge.findMany({ where: { userId: user.id } });
    const xp = user.xp;
    const res = ["BRONZE","SILVER","GOLD","DIAMOND"].map((tier, i) => ({
      id: `${tier.toLowerCase()}`,
      name: `${tier} Badge`,
      tier,
      unlocked: !!unlocked.find((b: { tier: string }) => b.tier === tier),
      unlockedAt: unlocked.find((b: { tier: string; unlockedAt: Date }) => b.tier === tier)?.unlockedAt ?? null,
      requiredXP: TIERS[i].threshold
    }));
    return res; // shape per spec. :contentReference[oaicite:1]{index=1}
  });

  app.get("/api/user/match-history", async (req) => {
    const { wallet, limit } = z.object({ wallet: Wallet, limit: z.coerce.number().min(1).max(50).default(10) }).parse(req.query);
    const user = await prisma.user.findUniqueOrThrow({ where: { walletAddress: wallet } });
    const matches = await prisma.match.findMany({
      where: { OR: [{ p1Id: user.id }, { p2Id: user.id }] },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    const result = [] as any[];
    for (const m of matches as any[]) {
      const isP1 = m.p1Id === user.id;
      const opponentId = isP1 ? m.p2Id : m.p1Id;
      let opponentName = "Anon";
      try {
        const opp = await prisma.user.findUnique({ where: { id: opponentId } });
        if (opp) opponentName = opp.nickname || opp.walletAddress.slice(0,6);
      } catch {}
      const outcome = m.result === "DRAW" ? "Draw" : m.winnerId === user.id ? "Win" : "Loss";
      const arkEarned = m.result === "DRAW" ? 0 : (m.winnerId === user.id ? (m.arkStaked || 0) : -(m.arkStaked || 0));
      const xpChange = m.result === "DRAW" ? 0 : (m.winnerId === user.id ? (m.xpWinner || 0) : -(m.xpLoser || 0));
      const gameName = m.game === "C4" ? "Connect Four" : (m.game === "RPS" ? "Rock Paper Scissors" : (m.game === "CHESS" ? "Chess" : "Tic-Tac-Toe"));
      result.push({
        id: m.id,
        game: gameName,
        opponentName,
        result: outcome,
        arkEarned,
        xpChange,
        date: m.createdAt.toISOString()
      });
    }
    return result; // shape per spec.
  });
}
