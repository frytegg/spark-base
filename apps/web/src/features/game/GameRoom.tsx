import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "../../components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const API = (import.meta as any).env.VITE_API_URL!;
const WS = API.replace("http", "ws");

interface GameRoomProps {
  matchId: string;
  opponentWallet: `0x${string}`;
  onOpponentMove?: (position: number) => void;
  onGameEnd?: (winner: `0x${string}`) => void;
  children?: (props: {
    sendMove: (position: number) => void;
    endGame: (didIWin: boolean, durationSec: number) => Promise<void>;
    sending: boolean;
  }) => React.ReactNode;
}

export function GameRoom({ 
  matchId, 
  opponentWallet, 
  onOpponentMove,
  onGameEnd,
  children 
}: GameRoomProps) {
  const { address } = useAccount();
  const wsRef = useRef<WebSocket | null>(null);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log(`Connecting to game WebSocket: ${WS}/game/${matchId}`);
    
    const ws = new WebSocket(`${WS}/game/${matchId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Game WebSocket connected");
      setConnected(true);
      toast.success("Connected to game");
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        console.log("Game WebSocket message:", msg);

        if (msg.event === "opponent_move") {
          // Relay opponent's move to the board component
          const position = msg.data?.position;
          if (typeof position === "number" && onOpponentMove) {
            onOpponentMove(position);
          }
        }

        if (msg.event === "game_end") {
          // Game ended notification
          const winner = msg.data?.winner;
          if (winner && onGameEnd) {
            onGameEnd(winner as `0x${string}`);
          }
          
          // Show result toast
          if (winner === address) {
            toast.success("You won! 🎉");
          } else {
            toast.info("Game ended");
          }
        }
      } catch (err) {
        console.error("Failed to parse game message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("Game WebSocket error:", error);
      toast.error("❌ Game connection error");
      setConnected(false);
    };

    ws.onclose = () => {
      console.log("Game WebSocket closed");
      if (connected) {
        toast.info("Game connection closed");
      }
      setConnected(false);
    };

    return () => {
      console.log("Cleaning up game WebSocket");
      ws.close();
      wsRef.current = null;
    };
  }, [matchId, address, onOpponentMove, onGameEnd]);

  function sendMove(position: number) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error("❌ Not connected to game server");
      return;
    }

    console.log("Sending move:", position);
    wsRef.current.send(JSON.stringify({ 
      action: "move", 
      position 
    }));
  }

  async function endGame(didIWin: boolean, durationSec: number) {
    if (!address) {
      toast.error("❌ Wallet not connected", { id: "game-result" });
      return;
    }

    setSending(true);
    toast.loading("Submitting game result...", { id: "game-result" });

    try {
      // Post result to backend
      const response = await fetch(`${API}/api/match/result`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          matchId,
          winnerWallet: didIWin ? address : opponentWallet,
          loserWallet: didIWin ? opponentWallet : address,
          result: didIWin ? "win" : "loss",
          durationSec
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const resultData = await response.json();
      console.log("Result submitted successfully:", resultData);

      // Notify opponent via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ 
          action: "end", 
          data: { 
            winner: didIWin ? address : opponentWallet 
          } 
        }));
      }

      toast.success(didIWin ? "🎉 Victory submitted!" : "Result submitted", { id: "game-result" });
    } catch (err: any) {
      console.error("Failed to end game:", err);
      toast.error(`❌ Failed to submit result: ${err.message}`, { id: "game-result" });
      throw err; // Re-throw so caller can handle if needed
    } finally {
      setSending(false);
    }
  }

  // Render props pattern - allows parent to control UI while GameRoom handles logic
  if (children) {
    return <>{children({ sendMove, endGame, sending })}</>;
  }

  // Default UI - simple test buttons
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
        {connected ? "Connected" : "Disconnected"}
      </div>

      <div className="space-y-2">
        <Button
          disabled={sending || !connected}
          onClick={() => endGame(true, 120)}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 pixel-text"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Report Win"
          )}
        </Button>

        <Button
          disabled={sending || !connected}
          onClick={() => endGame(false, 120)}
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-500/10 pixel-text"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Report Loss"
          )}
        </Button>
      </div>
    </div>
  );
}
