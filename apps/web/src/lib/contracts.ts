import ARK from "@spark/shared/abi/ARKToken.json";
import XP from "@spark/shared/abi/XPRegistry.json";
import BADGE from "@spark/shared/abi/BadgeNFT.json";
import ESCROW from "@spark/shared/abi/GameEscrow.json";

export const ADDR = {
  ARK: import.meta.env.VITE_ARK_ADDRESS as `0x${string}`,
  XP: import.meta.env.VITE_XPREGISTRY_ADDRESS as `0x${string}`,
  BADGE: import.meta.env.VITE_BADGE_ADDRESS as `0x${string}`,
  ESCROW: import.meta.env.VITE_ESCROW_ADDRESS as `0x${string}`
} as const;

export const ABI = { ARK, XP, BADGE, ESCROW } as const;
