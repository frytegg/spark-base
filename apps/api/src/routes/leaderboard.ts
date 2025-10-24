import type { FastifyInstance } from "fastify";
import { prisma } from "../client.js";
import { z } from "zod";

export async function registerLeaderboardRoutes(app: FastifyInstance) {
  app.get("/api/leaderboard", async (req) => {
    const { timeFilter, limit } = z.object({
      timeFilter: z.enum(["daily","weekly","alltime"]).default("alltime"),
      limit: z.coerce.number().min(1).max(100).default(100)
    }).parse(req.query);

    // For now, alltime by xp. You can extend with time windows later.
    const users = await prisma.user.findMany({ orderBy: { xp: "desc" }, take: limit });
    return users.map((u: { id: string; nickname: string | null; walletAddress: string; avatar: string | null; xp: number; tier: string }, i: number) => ({
      rank: i + 1,
      id: u.id,
      name: u.nickname || u.walletAddress.slice(0,6),
      avatar: u.avatar || "",
      xp: u.xp,
      tier: u.tier,
      gamesWon: 0
    })); // shape per spec. :contentReference[oaicite:3]{index=3}
  });
}
