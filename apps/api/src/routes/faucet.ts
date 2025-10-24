import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { walletClient, ark } from "../chain.js";
import { oncePer } from "../ratelimit.js";
import { requireAuth } from "../auth.js";

const AMOUNT = BigInt(process.env.FAUCET_AMOUNT_WEI ?? "0");
const COOLDOWN = Number(process.env.FAUCET_COOLDOWN_SEC ?? "86400");

export async function registerFaucetRoutes(app: FastifyInstance) {
  app.post("/api/faucet/claim", { preHandler: requireAuth }, async (req, reply) => {
    const { walletAddress } = z.object({ walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/) }).parse(req.body);

    // Include cooldown value in key namespace to invalidate old TTLs when we change config
    const key = `faucet:${COOLDOWN}:${walletAddress.toLowerCase()}`;
    if (!(await oncePer(key, COOLDOWN))) {
      reply.code(429); return { success: false, reason: "cooldown" };
    }
    if (AMOUNT === 0n) { reply.code(501); return { success: false, reason: "not configured" }; }

    const hash = await walletClient.writeContract({
      ...ark,
      functionName: "faucetMint",
      args: [walletAddress as `0x${string}`, AMOUNT]
    });
    return { success: true, txHash: hash };
  });
}
