export const baseSepolia = {
  id: Number(import.meta.env.VITE_BASE_CHAIN_ID),
  name: "base-sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [import.meta.env.VITE_BASE_RPC_URL] } }
} as const;
