/**
 * ConnectButton Component
 * Wallet connection button using wagmi hooks
 */

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
// Initialize Web3Modal if configured
import "../lib/web3modal";
import { Button } from "./ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export function ConnectButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, status: connectStatus, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const [showPicker, setShowPicker] = useState(false);
  const { open } = (() => {
    try { return useWeb3Modal(); } catch { return { open: undefined as any }; }
  })();
  const hasW3M = typeof (import.meta as any).env.VITE_WC_PROJECT_ID === 'string' && !!(import.meta as any).env.VITE_WC_PROJECT_ID;

  if (!isConnected) {
    return (
      <div className="relative">
        <Button
          onClick={() => {
            if (hasW3M && open) open(); else setShowPicker(v => !v)
          }}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 pixel-text text-xs h-9 px-4"
        >
          <Wallet className="w-3.5 h-3.5 mr-2" />
          Connect Wallet
        </Button>
        {!hasW3M && showPicker && (
          <div className="absolute z-50 mt-2 w-56 rounded border border-white/15 bg-black/80 backdrop-blur p-2 space-y-1">
            {connectors.map((c) => (
              <Button
                key={c.uid || c.id}
                variant="outline"
                disabled={!c.ready}
                onClick={() => { connect({ connector: c }); setShowPicker(false); }}
                className="w-full justify-start h-9 text-xs"
              >
                {c.name} {c.ready ? "" : "(unsupported)"}
              </Button>
            ))}
            {connectError && (
              <div className="text-red-400 text-xs px-1">{connectError.message}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={() => { 
        disconnect(); 
        try {
          localStorage.removeItem('wagmi.store');
          localStorage.removeItem('wagmi');
          sessionStorage.removeItem('wagmi.store');
        } catch {}
      }}
      variant="outline"
      className="border-primary/50 hover:bg-primary/10 pixel-text text-xs h-9 px-4"
    >
      <div className="flex items-center gap-2">
        <Wallet className="w-3.5 h-3.5" />
        <span>{address!.slice(0, 6)}…{address!.slice(-4)}</span>
        <LogOut className="w-3 h-3 ml-1 opacity-70" />
      </div>
    </Button>
  );
}
