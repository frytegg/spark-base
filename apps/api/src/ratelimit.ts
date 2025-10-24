import { Redis } from "ioredis";
import { env } from "./env.js";
export const redis = new Redis(env.REDIS_URL || "redis://localhost:6379");
export async function oncePer(key: string, seconds: number) {
  const ok = await redis.set(key, "1", "EX", seconds, "NX");
  return ok === "OK";
}
