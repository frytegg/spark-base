import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config({ path: `${process.cwd()}/../../.env` });

const Env = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  BASE_RPC_URL: z.string().url(),
  BASE_CHAIN_ID: z.coerce.number(),
  ESCROW_ADDRESS: z.string().optional(),
  XPREGISTRY_ADDRESS: z.string().optional(),
  BADGE_ADDRESS: z.string().optional(),
  ARK_ADDRESS: z.string().optional()
});

export const env = Env.parse(process.env);
