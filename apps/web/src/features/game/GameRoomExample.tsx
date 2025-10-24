/**
 * Example: How to use GameRoom component in your game pages
 * 
 * GameRoom handles:
 * - WebSocket connection to /game/:matchId
 * - Relaying player moves via WebSocket
 * - Receiving opponent moves
 * - Posting game results to backend API
 * - Toast notifications for connection status and results
 */

import { useState } from "react";
import { GameRoom } from "./GameRoom";
import { Button } from "../../components/ui/button";

interface ExampleTicTacToeProps {
  matchId: string;
  opponentWallet: `0x${string}`;
}

export function ExampleTicTacToe({ matchId, opponentWallet }: ExampleTicTacToeProps) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [gameStartTime] = useState(Date.now());

  // Handle opponent's move received via WebSocket
  const handleOpponentMove = (position: number) => {
    console.log("Opponent played position:", position);
    
    const newBoard = [...board];
    newBoard[position] = "O"; // Opponent is O
    setBoard(newBoard);
    setCurrentPlayer("X"); // Back to player's turn
    
    // Check for winner
    const winner = checkWinner(newBoard);
    if (winner) {
      console.log("Opponent wins!");
    }
  };

  // Handle game end event from WebSocket
  const handleGameEnd = (winner: `0x${string}`) => {
    console.log("Game ended, winner:", winner);
    // Show end game UI
  };

  // Check if there's a winner
  const checkWinner = (board: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Tic-Tac-Toe</h1>
      
      {/* 
        GameRoom with render props pattern 
        Provides: sendMove, endGame functions and sending state
      */}
      <GameRoom
        matchId={matchId}
        opponentWallet={opponentWallet}
        onOpponentMove={handleOpponentMove}
        onGameEnd={handleGameEnd}
      >
        {({ sendMove, endGame, sending }) => (
          <div className="space-y-6">
            {/* Game Board */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {board.map((cell, index) => (
                <Button
                  key={index}
                  disabled={cell !== null || currentPlayer !== "X" || sending}
                  onClick={() => {
                    // Make move locally
                    const newBoard = [...board];
                    newBoard[index] = "X";
                    setBoard(newBoard);
                    setCurrentPlayer("O");
                    
                    // Send move to opponent via WebSocket
                    sendMove(index);
                    
                    // Check for winner
                    const winner = checkWinner(newBoard);
                    if (winner === "X") {
                      // Player won! Calculate game duration and report
                      const durationSec = Math.floor((Date.now() - gameStartTime) / 1000);
                      endGame(true, durationSec);
                    }
                  }}
                  className="h-24 text-4xl"
                  variant={cell === "X" ? "default" : cell === "O" ? "secondary" : "outline"}
                >
                  {cell || ""}
                </Button>
              ))}
            </div>

            {/* Game Controls */}
            <div className="flex gap-2 justify-center">
              <Button
                disabled={sending}
                onClick={() => {
                  const durationSec = Math.floor((Date.now() - gameStartTime) / 1000);
                  endGame(false, durationSec); // Forfeit
                }}
                variant="outline"
              >
                Forfeit
              </Button>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Current turn: {currentPlayer}
            </p>
          </div>
        )}
      </GameRoom>

      {/* Alternative: Use default UI */}
      {/* 
      <GameRoom
        matchId={matchId}
        opponentWallet={opponentWallet}
        onOpponentMove={handleOpponentMove}
        onGameEnd={handleGameEnd}
      />
      */}
    </div>
  );
}

/**
 * INTEGRATION STEPS:
 * 
 * 1. Import GameRoom component:
 *    import { GameRoom } from "@/features/game/GameRoom";
 * 
 * 2. Pass required props:
 *    - matchId: string (from matchmaking result)
 *    - opponentWallet: `0x${string}` (from matchmaking result)
 * 
 * 3. Provide callbacks:
 *    - onOpponentMove: (position: number) => void
 *      Called when opponent makes a move
 *    - onGameEnd: (winner: `0x${string}`) => void
 *      Called when game ends via WebSocket
 * 
 * 4. Use render props pattern to access:
 *    - sendMove(position): Send your move to opponent
 *    - endGame(didIWin, durationSec): Report match result to backend
 *    - sending: boolean - True when submitting result
 * 
 * 5. GameRoom automatically handles:
 *    - WebSocket connection lifecycle
 *    - Connection status toasts
 *    - Result submission to /api/match/result
 *    - Notifying opponent of game end
 * 
 * BACKEND API ENDPOINT:
 * POST /api/match/result
 * Body: {
 *   matchId: string,
 *   winnerWallet: `0x${string}`,
 *   loserWallet: `0x${string}`,
 *   result: "win" | "loss",
 *   durationSec: number
 * }
 */
