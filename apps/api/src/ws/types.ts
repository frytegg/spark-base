import { z } from "zod";

export const Wallet = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const JoinMsg = z.object({
  action: z.literal("join"),
  wallet: Wallet,
  gameId: z.enum(["chess", "tictactoe", "connectfour", "rockpaperscissors"]),
  playMode: z.enum(["free", "stake"]),
  stakeAmount: z.coerce.number().min(0).default(0),
  playerXP: z.coerce.number().min(0),
  // P1 includes the on-chain Escrow match id (string to avoid BigInt JSON issues)
  escrowId: z.string().regex(/^\d+$/).optional()
});

export type JoinMsg = z.infer<typeof JoinMsg>;
