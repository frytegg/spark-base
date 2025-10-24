import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../client.js";
import { walletClient, escrow, xp as xpC, badge as badgeC } from "../chain.js";

  const Join = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  gameId: z.enum(["chess","tictactoe","connectfour","rockpaperscissors"]),
  playMode: z.enum(["free","stake"]),
  stakeAmount: z.coerce.number().min(0).default(0),
  playerXP: z.coerce.number().min(0)
});

export async function registerMatchRoutes(app: FastifyInstance) {
  app.post("/api/matchmaking/join", async (req) => {
    const { wallet, gameId } = Join.parse(req.body);
    const user = await prisma.user.upsert({ where: { walletAddress: wallet }, update: {}, create: { walletAddress: wallet } });
    // Stub: immediately “found” vs simple self-match for now
    return { matchId: "pending", status: "searching" }; // spec shape. :contentReference[oaicite:4]{index=4}
  });

  app.post("/api/matchmaking/cancel", async () => ({ ok: true }));

  app.post("/api/match/start", async (req) => {
    const { matchId, p1Wallet, p2Wallet, gameId, stakeAmount, escrowId } = z.object({
      matchId: z.string().optional(),
      p1Wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      p2Wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      gameId: z.enum(["chess","tictactoe","connectfour","rockpaperscissors"]),
      stakeAmount: z.coerce.number().min(0).default(0),
      escrowId: z.string().optional().nullable()
    }).parse(req.body);

    const [p1, p2] = await Promise.all([
      prisma.user.upsert({ where: { walletAddress: p1Wallet }, update: {}, create: { walletAddress: p1Wallet } }),
      prisma.user.upsert({ where: { walletAddress: p2Wallet }, update: {}, create: { walletAddress: p2Wallet } })
    ]);
    let m: any;
    // If matchmaking already created a match row, update it with escrowId and details
    if (matchId) {
      try {
        m = await prisma.match.update({
          where: { id: matchId },
          data: ({
            game: (gameId === "chess" ? "CHESS" : (gameId === "connectfour" ? "C4" : (gameId === "rockpaperscissors" ? "RPS" : "TTT"))) as any,
            p1Id: p1.id,
            p2Id: p2.id,
            result: "DRAW",
            arkStaked: stakeAmount,
            escrowId: escrowId ? BigInt(escrowId) : null
          } as any)
        });
      } catch {
        // Row not found or DB transient issue, create a fresh one
        m = await prisma.match.create({
          data: ({
            game: (gameId === "chess" ? "CHESS" : (gameId === "connectfour" ? "C4" : (gameId === "rockpaperscissors" ? "RPS" : "TTT"))) as any,
            p1Id: p1.id,
            p2Id: p2.id,
            result: "DRAW",
            arkStaked: stakeAmount,
            escrowId: escrowId ? BigInt(escrowId) : null
          } as any)
        });
      }
    } else {
      m = await prisma.match.create({
        data: ({
          game: (gameId === "chess" ? "CHESS" : (gameId === "connectfour" ? "C4" : (gameId === "rockpaperscissors" ? "RPS" : "TTT"))) as any,
          p1Id: p1.id,
          p2Id: p2.id,
          result: "DRAW",
          arkStaked: stakeAmount,
          escrowId: escrowId ? BigInt(escrowId) : null
        } as any)
      });
    }
    return { matchId: m.id };
  });

  // XP calc per frontend spec. :contentReference[oaicite:5]{index=5}
  function xpChange(won: boolean, playerXP: number, opponentXP: number) {
    const diff = opponentXP - playerXP;
    const base = 25;
    if (won) {
      if (diff > 500) return base + 30;
      if (diff > 200) return base + 20;
      if (diff > 0) return base + 10;
      if (diff < -500) return base - 10;
      if (diff < -200) return base - 5;
      return base;
    } else {
      if (diff > 500) return -5;
      if (diff > 200) return -10;
      if (diff > 0) return -15;
      if (diff < -500) return -35;
      if (diff < -200) return -30;
      return -20;
    }
  }

  app.post("/api/match/result", async (req) => {
    const body = z.object({
      matchId: z.string(),
      winnerWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable(),
      loserWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).nullable(),
      result: z.enum(["win","loss","draw"]),
      durationSec: z.coerce.number().min(0).default(0)
    }).parse(req.body);

    const m = await prisma.match.findUniqueOrThrow({ where: { id: body.matchId } });
    const [p1, p2] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: m.p1Id } }),
      prisma.user.findUniqueOrThrow({ where: { id: m.p2Id } })
    ]);

    const winner = body.result === "draw" ? null :
      (body.winnerWallet?.toLowerCase() === p1.walletAddress.toLowerCase() ? p1 : p2);
    const loser  = body.result === "draw" ? null :
      (winner?.id === p1.id ? p2 : p1);

    const xpW = winner ? xpChange(true,  winner.xp, loser!.xp) : 0;
    const xpL = loser  ? -xpChange(false, loser.xp, winner!.xp) : 0;

    // persist match
    await prisma.match.update({
      where: { id: m.id },
      data: {
        winnerId: winner?.id ?? null,
        result: body.result === "draw" ? "DRAW" : "WIN",
        xpWinner: winner ? xpW : 0,
        xpLoser: loser ? Math.abs(xpL) : 0,
        durationSec: body.durationSec
      }
    });

    // update players and tiers
    const upd = [];
    if (winner) upd.push(prisma.user.update({ where: { id: winner.id }, data: { xp: winner.xp + xpW, tier: tierFromXP(winner.xp + xpW) as any } }));
    if (loser)  upd.push(prisma.user.update({ where: { id: loser.id },  data: { xp: loser.xp + xpL,  tier: tierFromXP(loser.xp + xpL) as any } }));
    await prisma.$transaction(upd);

        // 1) Settle escrow if applicable (only when escrowId exists)
        const mAny: any = m as any;
        if (mAny.escrowId) {
          const winnerAddr = winner ? winner.walletAddress as `0x${string}` : "0x0000000000000000000000000000000000000000";
          await walletClient.writeContract({ ...escrow, functionName: "settle", args: [mAny.escrowId as any, winnerAddr] });
        }

    // 2) Mirror XP on-chain
    const wAfter = winner ? await prisma.user.findUniqueOrThrow({ where: { id: winner.id } }) : null;
    const lAfter = loser  ? await prisma.user.findUniqueOrThrow({ where: { id: loser.id } }) : null;
    if (wAfter) await walletClient.writeContract({ ...xpC, functionName: "setXP", args: [wAfter.walletAddress as `0x${string}`, wAfter.xp] });
    if (lAfter) await walletClient.writeContract({ ...xpC, functionName: "setXP", args: [lAfter.walletAddress as `0x${string}`, lAfter.xp] });

    // 3) Mint badge if crossed thresholds
    async function maybeMint(addr: string, xpNow: number) {
    const tier = tierFromXP(xpNow);
    const tierIndex = tier === "BRONZE" ? 0 : tier === "SILVER" ? 1 : tier === "GOLD" ? 2 : 3;
    if (tierIndex > 0) {
        try {
        await walletClient.writeContract({ ...badgeC, functionName: "mintBadge", args: [addr as `0x${string}`, tierIndex as any] });
        } catch { /* ignore if already minted */ }
    }
    }
    if (wAfter) await maybeMint(wAfter.walletAddress, wAfter.xp);
    if (lAfter) await maybeMint(lAfter.walletAddress, lAfter.xp);


    return { ok: true };
  });
}
function tierFromXP(xp: number) {
  if (xp >= 2000) return "DIAMOND";
  if (xp >= 1000) return "GOLD";
  if (xp >= 500) return "SILVER";
  return "BRONZE";
}
