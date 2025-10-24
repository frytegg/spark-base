import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider, createStorage } from "wagmi";
import { injected, metaMask, walletConnect } from "wagmi/connectors";
import { baseSepolia } from "./chain";

const wcProjectId = (import.meta as any).env.VITE_WC_PROJECT_ID as string | undefined;

const configuredConnectors = [
  // Prefer explicit MetaMask connector
  metaMask(),
  // Target injected specifically to Rabby to avoid Phantom grabbing injected
  injected({ target: 'rabby', shimDisconnect: true }),
  // Optionally add WalletConnect (QR) if project id configured
  ...(wcProjectId ? [walletConnect({
    projectId: wcProjectId,
    qrModalOptions: { themeVariables: { '--wcm-z-index': '9999' } },
    metadata: {
      name: 'SPARK OnChain',
      description: 'SPARK OnChain test app',
      url: 'http://localhost:5173',
      icons: ['https://walletconnect.com/walletconnect-logo.png']
    }
  })] : [])
];

export const config = createConfig({
  chains: [baseSepolia],
  connectors: configuredConnectors,
  transports: { [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]) },
  // Use session storage to avoid sticky auto-reconnects across browser restarts
  storage: createStorage({ storage: typeof window !== 'undefined' ? window.sessionStorage : undefined })
});

const qc = new QueryClient();

export function WalletProviders({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
