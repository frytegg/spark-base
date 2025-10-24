import { useState, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { parseUnits } from "viem";
import { useApproveArk, useCreateMatch, useArkBalance, useArkAllowance, useEnsureArkAllowance, useJoinMatch } from "../../lib/hooks";
import { Button } from "../../components/ui/button";
import { Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { baseSepolia } from "../../lib/chain";

const API = (import.meta as any).env.VITE_API_URL!;
const WS = API.replace("http", "ws");

interface StakePlayProps {
  stake: string;
  gameId: string;
  onMatchFound?: (data: {
    matchId: string;
    escrowId?: string;
    opponentWallet: string;
    role: "p1" | "p2";
  }) => void;
}

export function StakePlay({ stake, gameId, onMatchFound }: StakePlayProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const approve = useApproveArk();
  const ensureAllowance = useEnsureArkAllowance();
  const createMatch = useCreateMatch();
  const { balance } = useArkBalance();
  const { allowance } = useArkAllowance();
  const joinMatch = useJoinMatch();
  const [pending, setPending] = useState(false);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const roleRef = useRef<"p1"|"p2"|null>(null);
  const opponentWalletRef = useRef<string | null>(null);
  const [peerReady, setPeerReady] = useState(false);
  const [p1Created, setP1Created] = useState(false);
  const [p2Joined, setP2Joined] = useState(false);
  const p2JoinedRef = useRef(false);
  const [signedCreateSeen, setSignedCreateSeen] = useState(false);
  const signedCreateSeenRef = useRef(false);

  // Check if user is on correct chain
  const isCorrectChain = chainId === baseSepolia.id;
  
  // Check if stake is valid (not empty and greater than 0)
  const isValidStake = stake && parseFloat(stake) > 0;

  // Button should be disabled if any of these conditions are true
  const isDisabled = !isConnected || !isCorrectChain || !isValidStake || pending;

  async function handleStake() {
    if (!address || isDisabled) return;
    
    setPending(true);
    toast.loading("Preparing stake...", { id: "stake-flow" });
    
    try {
      const stakeWei = parseUnits(stake, 18);
      // Pre-checks: balance
      if (balance !== undefined && balance < stakeWei) {
        toast.error("❌ Insufficient ARK balance for this stake", { id: "stake-flow" });
        setPending(false);
        return;
      }

      toast.loading("Connecting to matchmaking...", { id: "stake-flow" });

      // Step 1: Connect to matchmaking WebSocket (no escrow yet)
      const ws = new WebSocket(`${WS}/matchmaking`);
      wsRef.current = ws;

      ws.onopen = () => {
        toast.loading("Searching for opponent...", { id: "stake-flow" });
        ws.send(JSON.stringify({
          action: "join",
          wallet: address,
          gameId,
          playMode: "stake",
          stakeAmount: Number(stake),
          playerXP: 0
        }));
      };

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data);
        
        if (msg.event === "match_found") {
          const { matchId, escrowId: eId, opponentWallet, role } = msg.data;
          matchIdRef.current = matchId;
          roleRef.current = role;
          opponentWalletRef.current = opponentWallet;

          toast.success("Match found!", { id: "stake-flow" });
          try {
            if (role === "p1") {
              // Wait for P2 readiness before creating escrow
              toast.loading("Waiting for opponent to confirm...");
              const onReady = (ev: MessageEvent) => {
                try {
                  const m = JSON.parse(ev.data);
                  if (m.event === "ready" && m.data?.matchId === matchId) {
                    setPeerReady(true);
                    ws.removeEventListener("message", onReady as any);
                    (async () => {
                      try {
                        toast.loading("Approving ARK tokens...", { id: "stake-flow" });
                        await ensureAllowance(stakeWei);
                        toast.loading("Creating match escrow...", { id: "stake-flow" });
                        const result = await createMatch(stakeWei);
                        const createdEscrowId = result.escrowId;
                        setEscrowId(createdEscrowId.toString());
                        setP1Created(true);
                        // Inform opponent via WS
                        ws.send(JSON.stringify({ action: "escrow", matchId, escrowId: createdEscrowId.toString() }));
                        ws.send(JSON.stringify({ action: "signed_create", matchId }));
                        // Backend: record start with escrowId
                        const response = await fetch(`${API}/api/match/start`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ matchId, p1Wallet: address, p2Wallet: opponentWallet, gameId, stakeAmount: Number(stake), escrowId: createdEscrowId.toString() })
                        });
                        if (!response.ok) throw new Error(`Backend error: ${response.status}`);
                      } catch (err) {
                        console.error("createMatch failed", err);
                        try { ws.send(JSON.stringify({ action: "cancel", matchId, reason: "p1_tx_failed" })); } catch {}
                        setPending(false);
                      }
                    })();
                  }
                } catch {}
              };
              ws.addEventListener("message", onReady as any);
            } else {
              // p2: declare readiness, then wait for escrowId, then join
              ws.send(JSON.stringify({ action: "ready", matchId }));
              let finalEscrow = eId as string | null;
              if (!finalEscrow) {
                finalEscrow = await new Promise<string>((resolve, reject) => {
                  const onMsg = (ev: MessageEvent) => {
                    try {
                      const m = JSON.parse(ev.data);
                      if (m.event === "escrow" && m.data?.matchId === matchId && m.data?.escrowId) {
                        ws.removeEventListener("message", onMsg as any);
                        resolve(m.data.escrowId);
                      }
                    } catch {}
                  };
                  ws.addEventListener("message", onMsg as any);
                  setTimeout(() => { ws.removeEventListener("message", onMsg as any); reject(new Error("Timeout waiting for escrow")); }, 30000);
                });
              }
              try {
                toast.loading("Joining match escrow...", { id: "stake-flow" });
                await joinMatch(BigInt(finalEscrow));
                setP2Joined(true);
                p2JoinedRef.current = true;
                setEscrowId(finalEscrow);
                ws.send(JSON.stringify({ action: "signed_join", matchId }));
                // Backend start
                const response = await fetch(`${API}/api/match/start`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ matchId, p1Wallet: opponentWallet, p2Wallet: address, gameId, stakeAmount: Number(stake), escrowId: finalEscrow })
                });
                if (!response.ok) throw new Error(`Backend error: ${response.status}`);
                // If we already saw signed_create from P1, navigate now
                if (roleRef.current === "p2" && matchIdRef.current && signedCreateSeenRef.current) {
                  onMatchFound?.({ matchId: matchIdRef.current, escrowId: finalEscrow, opponentWallet: opponentWalletRef.current ?? "", role: "p2" });
                }
              } catch (err) {
                console.error("joinMatch failed", err);
                try { ws.send(JSON.stringify({ action: "cancel", matchId, reason: "p2_tx_failed" })); } catch {}
                setPending(false);
              }
            }
          } catch (err: any) {
            console.error("Failed during match start flow:", err);
            toast.error(`❌ Failed to start match: ${err.message}`, { id: "stake-flow" });
            setPending(false);
          }
        } else if (msg.event === "signed_join") {
          // P1 can navigate only after P2 joined
          if (roleRef.current === "p1" && matchIdRef.current) {
            onMatchFound?.({ matchId: matchIdRef.current, escrowId: escrowId ?? undefined, opponentWallet: opponentWalletRef.current ?? "", role: "p1" });
          }
        } else if (msg.event === "signed_create") {
          // Record that P1 created; if P2 already joined, navigate now; else buffer
          setSignedCreateSeen(true);
          signedCreateSeenRef.current = true;
          if (roleRef.current === "p2" && matchIdRef.current && p2JoinedRef.current) {
            onMatchFound?.({ matchId: matchIdRef.current, escrowId: escrowId ?? undefined, opponentWallet: opponentWalletRef.current ?? "", role: "p2" });
          }
        } else if (msg.event === "match_cancel") {
          toast.error("Opponent cancelled. Game aborted.", { id: "stake-flow" });
          setPending(false);
          try { ws.close(); } catch {}
        } else if (msg.event === "match_timeout" || msg.type === "error") {
          toast.error("No opponent found. Try again.", { id: "stake-flow" });
          setPending(false);
          ws.close();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("❌ Matchmaking connection failed", { id: "stake-flow" });
        setPending(false);
      };

      ws.onclose = () => {
        if (pending) {
          toast.error("❌ Matchmaking connection closed", { id: "stake-flow" });
          setPending(false);
        }
      };
      
    } catch (err: any) {
      console.error("Stake failed:", err);
      
      // More specific error messages
      if (err.message?.includes("User rejected")) {
        toast.error("Transaction rejected", { id: "stake-flow" });
      } else if (err.message?.includes("insufficient")) {
        toast.error("Insufficient balance", { id: "stake-flow" });
      } else {
        toast.error("Stake failed. Check wallet and try again.", { id: "stake-flow" });
      }
      
      setPending(false);
      
      // Cleanup WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  }

  // Helper function to get disabled reason for tooltip/display
  const getDisabledReason = () => {
    if (!isConnected) return "Connect wallet to continue";
    if (!isCorrectChain) return `Switch to ${baseSepolia.name}`;
    if (!isValidStake) return "Enter stake amount";
    if (pending) return "Processing...";
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="space-y-2">
      <Button
        disabled={isDisabled}
        onClick={handleStake}
        className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 pixel-text text-xs h-11 md:h-12 disabled:opacity-50 disabled:cursor-not-allowed"
        title={disabledReason || undefined}
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Waiting for both players to stake...
          </>
        ) : (
          <>
            <Coins className="w-4 h-4 mr-2" />
            Stake {stake || "0"} ARK & Play
          </>
        )}
      </Button>
      
      {disabledReason && (
        <p className="text-xs text-center text-muted-foreground pixel-text">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
