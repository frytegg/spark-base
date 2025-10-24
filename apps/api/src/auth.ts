import * as QuickAuth from "@farcaster/quick-auth";
import type { FastifyRequest, FastifyReply } from "fastify";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return reply.code(401).send({ error: "missing token" });
  try {
    const { payload } = await (QuickAuth as any).verifyJwt(h.slice(7)); // payload.sub = FID
    (req as any).fid = payload.sub;
  } catch {
    return reply.code(401).send({ error: "invalid token" });
  }
}
