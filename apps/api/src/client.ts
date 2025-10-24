import { PrismaClient } from "@prisma/client";
import { createPublicClient, http } from "viem";
import { env } from "./env.js";

export const prisma = new PrismaClient();

export const publicClient = createPublicClient({
  chain: { id: env.BASE_CHAIN_ID, name: "base-sepolia", nativeCurrency: { name:"ETH", symbol:"ETH", decimals:18 }, rpcUrls:{ default:{ http:[env.BASE_RPC_URL] } } },
  transport: http()
});
