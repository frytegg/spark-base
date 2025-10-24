import { createWeb3Modal } from '@web3modal/wagmi/react'
import { baseSepolia } from './chain'
import { config as wagmiConfig } from './wallet'

const projectId = (import.meta as any).env.VITE_WC_PROJECT_ID as string | undefined

// Initialize Web3Modal once at module load (no-op if no projectId)
export function initWeb3Modal() {
  if (!projectId) return
  createWeb3Modal({
    wagmiConfig,
    projectId,
    chains: [baseSepolia],
    themeVariables: {
      '--w3m-accent': '#ff69b4',
      '--w3m-border-radius-master': '8px'
    }
  })
}

// Immediately initialize when imported
initWeb3Modal()
