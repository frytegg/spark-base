/**
 * Game WebSocket Client
 * Manages real-time game communication between players
 */

export interface GameMove {
  position: number;
  player?: string;
  timestamp?: string;
}

export interface GameEndData {
  winner: string | null;
  reason: string;
  isDraw?: boolean;
  winnerSide?: "a" | "b";
}

export interface GameWebSocketCallbacks {
  onOpponentMove?: (move: GameMove) => void;
  onGameEnd?: (data: GameEndData) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onStart?: (data: { startAt: number; current: "a" | "b"; side: "a" | "b" }) => void;
  onState?: (data: { board: Array<"X"|"O"|null> | Array<"red"|"yellow"|null>; current: "a"|"b"; timestamp: number }) => void;
  onRpsReveal?: (data: { round: number; aChoice: "rock"|"paper"|"scissors"; bChoice: "rock"|"paper"|"scissors"; winnerSide: "a"|"b"|null }) => void;
}

/**
 * Create and manage a game WebSocket connection
 */
export class GameWebSocketClient {
  private ws: WebSocket | null = null;
  private callbacks: GameWebSocketCallbacks;
  private matchId: string;
  private wsUrl: string;

  constructor(matchId: string, wsUrl: string, callbacks: GameWebSocketCallbacks = {}) {
    this.matchId = matchId;
    this.wsUrl = wsUrl;
    this.callbacks = callbacks;
  }

  /**
   * Connect to the game WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${this.wsUrl}/game/${this.matchId}`);

        this.ws.onopen = () => {
          console.log("Game WebSocket connected:", this.matchId);
          this.callbacks.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            console.log("Game message received:", msg);

            if (msg.event === "opponent_move") {
              this.callbacks.onOpponentMove?.(msg.data);
            } else if (msg.event === "game_end") {
              this.callbacks.onGameEnd?.(msg.data);
            } else if (msg.event === "start") {
              this.callbacks.onStart?.(msg.data);
            } else if (msg.event === "state") {
              this.callbacks.onState?.(msg.data);
            } else if (msg.event === "rps_reveal") {
              this.callbacks.onRpsReveal?.(msg.data);
            }
          } catch (error) {
            console.error("Error parsing game message:", error);
            this.callbacks.onError?.(error as Error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("Game WebSocket error:", error);
          this.callbacks.onError?.(new Error("WebSocket error"));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("Game WebSocket closed");
          this.callbacks.onClose?.();
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error("WebSocket connection timeout"));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a move to the opponent
   */
  sendMove(position: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    this.ws.send(JSON.stringify({
      action: "move",
      position
    }));
  }

  /**
   * Send a Rock-Paper-Scissors choice
   */
  sendChoice(choice: "rock" | "paper" | "scissors"): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    this.ws.send(JSON.stringify({
      action: "choice",
      choice
    }));
  }

  /**
   * Send forfeit signal
   */
  sendForfeit(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    // Server expects 'end' to notify peer
    this.ws.send(JSON.stringify({
      action: "end",
      data: { reason: "forfeit" }
    }));
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * Submit match result to backend
 */
export async function submitMatchResult(
  apiUrl: string,
  matchId: string,
  winnerWallet: string | null,
  loserWallet: string | null,
  result: "win" | "loss" | "draw",
  durationSec: number
): Promise<void> {
  try {
    const response = await fetch(`${apiUrl}/api/match/result`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        matchId,
        winnerWallet,
        loserWallet,
        result,
        durationSec
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit match result: ${response.statusText}`);
    }

    console.log("Match result submitted successfully");
  } catch (error) {
    console.error("Error submitting match result:", error);
    throw error;
  }
}

/**
 * Hook-like function to create a game WebSocket client
 * Returns the client instance that can be used to send moves
 */
export function createGameClient(
  matchId: string,
  callbacks: GameWebSocketCallbacks = {}
): GameWebSocketClient {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";
  const wsUrl = apiUrl.replace("http", "ws");
  
  return new GameWebSocketClient(matchId, wsUrl, callbacks);
}
