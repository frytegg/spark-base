/**
 * SPARK - Game Page
 * Active gameplay screen with game logic and match results
 * 
 * DEVELOPER INTEGRATION NOTES:
 * ============================================================================
 * BACKEND REQUIREMENTS:
 * 
 * 1. WebSocket Connection for Real-time Gameplay:
 *    ws://your-server/game/:matchId
 *    Events to send:
 *    - "move": { position, playerId }
 *    - "forfeit": { playerId }
 *    Events to receive:
 *    - "opponent_move": { position }
 *    - "game_end": { winner, reason }
 * 
 * 2. Game State Management:
 *    - Store game state in backend
 *    - Validate moves server-side (prevent cheating)
 *    - Handle disconnections (timeout = forfeit)
 * 
 * 3. Match Result Submission:
 *    POST /api/match/result
 *    Body: {
 *      matchId: "{{match_id}}",
 *      winner: "{{player_id}}",
 *      loser: "{{player_id}}",
 *      arkTransferred: {{amount}},
 *      xpChanges: {
 *        winner: {{xp_gained}},
 *        loser: {{xp_lost}}
 *      }
 *    }
 * 
 * 4. Smart Contract Integration:
 *    - If staked match: Transfer ARK from loser to winner
 *    - Emit GameCompleted event on blockchain
 *    - Update player NFT badges if tier changed
 * 
 * GAME LOGIC:
 * - Tic-Tac-Toe: Simple board game (3x3 grid)
 * - Chess: Can use chess.js library for move validation
 * - Both games should be validated server-side
 * 
 * PLACEHOLDER PATTERNS:
 * - {{opponent_name}}: Opponent username
 * - {{opponent_xp}}: Opponent's XP level
 * - {{match_result}}: "win" | "loss" | "draw"
 * - {{ark_earned}}: ARK tokens won/lost
 * - {{xp_change}}: XP points gained/lost
 * ============================================================================
 */

import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Coins, Trophy, Clock, RotateCcw, Home, PartyPopper, Zap } from "lucide-react";
import { Game, calculateXPChange } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useWallet } from "../context/WalletContext";
import { toast } from "sonner@2.0.3";

interface GamePageProps {
  game: Game;
  stakeAmount: number;
  playMode: "free" | "stake";
  onNavigate: (screen: string, data?: any) => void;
}

export function GamePage({ game, stakeAmount, playMode, onNavigate }: GamePageProps) {
  const { xp, addXP } = useWallet();
  const [turnTime, setTurnTime] = useState(30); // 30 seconds per turn
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [winner, setWinner] = useState<"player" | "opponent" | "draw" | null>(null);
  const [earnedARK, setEarnedARK] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);
  const [opponentXP, setOpponentXP] = useState(800); // {{opponent_xp}}
  const [opponentName, setOpponentName] = useState("Opponent"); // {{opponent_name}}
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Tic Tac Toe state with move history (for 3-piece limit)
  const [tttBoard, setTttBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttCurrentPlayer, setTttCurrentPlayer] = useState<"X" | "O">("X");
  const [playerMoves, setPlayerMoves] = useState<number[]>([]); // Track X moves order
  const [opponentMoves, setOpponentMoves] = useState<number[]>([]); // Track O moves order
  const [fadingCell, setFadingCell] = useState<number | null>(null); // Cell being removed

  // Chess state (simplified - use chess.js in production)
  const [chessMoves, setChessMoves] = useState<string[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);

  // Connect Four state (7 columns x 6 rows)
  const [c4Board, setC4Board] = useState<(string | null)[]>(Array(42).fill(null)); // 7x6 = 42 cells
  const [c4CurrentPlayer, setC4CurrentPlayer] = useState<"red" | "yellow">("red");
  const [c4DroppingToken, setC4DroppingToken] = useState<{ col: number; row: number } | null>(null);
  const [c4RoundCount, setC4RoundCount] = useState(1);

  // Rock Paper Scissors state
  type RPSChoice = "rock" | "paper" | "scissors" | null;
  const [rpsPlayerChoice, setRpsPlayerChoice] = useState<RPSChoice>(null);
  const [rpsOpponentChoice, setRpsOpponentChoice] = useState<RPSChoice>(null);
  const [rpsPlayerScore, setRpsPlayerScore] = useState(0);
  const [rpsOpponentScore, setRpsOpponentScore] = useState(0);
  const [rpsCurrentRound, setRpsCurrentRound] = useState(1);
  const [rpsRoundResult, setRpsRoundResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [rpsRevealing, setRpsRevealing] = useState(false);
  const [rpsWaitingForOpponent, setRpsWaitingForOpponent] = useState(false);

  /**
   * Initialize opponent data
   * Backend: Fetch from matchmaking result
   */
  useEffect(() => {
    // TODO: Get opponent data from props or WebSocket
    // const { opponentId, opponentName, opponentXP } = matchData;
    setOpponentName("AI Opponent"); // Placeholder
    setOpponentXP(800); // Placeholder
  }, []);

  /**
   * Turn-based timer (30 seconds per turn)
   * Backend: Sync timer with server to prevent manipulation
   */
  useEffect(() => {
    if (gameState === "finished" || fadingCell !== null || c4DroppingToken !== null || rpsWaitingForOpponent || rpsRevealing) return;
    
    const timer = setInterval(() => {
      setTurnTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Current player loses on timeout
          if (game.name === "Tic-Tac-Toe") {
            if (tttCurrentPlayer === "X") {
              handleGameEnd("opponent"); // Player timeout = loss
            } else {
              handleGameEnd("player"); // Opponent timeout = win
            }
          } else if (game.name === "Connect Four") {
            if (c4CurrentPlayer === "red") {
              handleGameEnd("opponent"); // Player timeout = loss
            } else {
              handleGameEnd("player"); // Opponent timeout = win
            }
          } else if (game.name === "Rock Paper Scissors") {
            // Player didn't pick in time
            handleGameEnd("opponent");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, tttCurrentPlayer, c4CurrentPlayer, fadingCell, c4DroppingToken, rpsWaitingForOpponent, rpsRevealing, game.name]);

  /**
   * Reset timer when turn changes
   */
  const resetTurnTimer = () => {
    setTurnTime(30);
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  /**
   * Handle game end
   * Backend: Submit result to server, update blockchain if staked
   */
  const handleGameEnd = (gameWinner: "player" | "opponent" | "draw") => {
    setWinner(gameWinner);
    setGameState("finished");

    // Calculate rewards ONLY for stake mode
    if (playMode === "stake") {
      const won = gameWinner === "player";
      const xpChange = calculateXPChange(won, xp, opponentXP);
      const arkReward = won ? stakeAmount * 2 : -stakeAmount;

      setEarnedXP(xpChange);
      setEarnedARK(arkReward);
      addXP(xpChange);
    } else {
      // Free play mode - no rewards
      setEarnedXP(0);
      setEarnedARK(0);
    }

    // TODO: Submit match result to backend
    // await fetch('/api/match/result', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     matchId,
    //     winner: won ? userId : opponentId,
    //     arkTransferred: arkReward,
    //     xpChanges: { [userId]: xpChange }
    //   })
    // });
  };

  /**
   * Tic Tac Toe Logic - NEW RULES (Updated)
   * ==========================================
   * - Each player can only have 3 pieces on the board at a time
   * - When placing a 4th piece, the oldest piece automatically disappears
   * - Disappearing pieces show a fade-out animation (0.4s)
   * - Game continues until one player gets 3 in a row
   * - First win ends the match
   * - Rules tooltip shown below the board
   * 
   * Backend: Validate moves server-side to prevent cheating
   */
  const checkTTTWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleTTTCellClick = (index: number) => {
    if (tttBoard[index] || tttCurrentPlayer === "O" || fadingCell !== null) return;

    const newBoard = [...tttBoard];
    const newPlayerMoves = [...playerMoves];

    // Check if player already has 3 pieces
    if (newPlayerMoves.length >= 3) {
      // Remove oldest piece with animation
      const oldestMove = newPlayerMoves[0];
      setFadingCell(oldestMove);
      
      // Wait for fade animation, then place new piece
      setTimeout(() => {
        const updatedBoard = [...newBoard];
        updatedBoard[oldestMove] = null; // Remove oldest
        updatedBoard[index] = "X"; // Place new
        setTttBoard(updatedBoard);
        setFadingCell(null);
        
        // Update move history
        newPlayerMoves.shift(); // Remove oldest from history
        newPlayerMoves.push(index); // Add new move
        setPlayerMoves(newPlayerMoves);

        // Check for win
        const winner = checkTTTWinner(updatedBoard);
        if (winner === "X") {
          handleGameEnd("player");
          return;
        }

        // AI's turn
        setTttCurrentPlayer("O");
        resetTurnTimer();
        makeAIMove(updatedBoard, [...opponentMoves]);
      }, 400); // Match animation duration
    } else {
      // Place piece normally (first 3 pieces)
      newBoard[index] = "X";
      setTttBoard(newBoard);
      newPlayerMoves.push(index);
      setPlayerMoves(newPlayerMoves);

      // Check for win
      const winner = checkTTTWinner(newBoard);
      if (winner === "X") {
        handleGameEnd("player");
        return;
      }

      // AI's turn
      setTttCurrentPlayer("O");
      resetTurnTimer();
      makeAIMove(newBoard, [...opponentMoves]);
    }

    // TODO: Send move to server via WebSocket
    // ws.send(JSON.stringify({ event: 'move', position: index }));
  };

  const makeAIMove = (currentBoard: (string | null)[], currentOpponentMoves: number[]) => {
    setTimeout(() => {
      const emptySpots = currentBoard
        .map((val, i) => (val === null ? i : null))
        .filter((val) => val !== null) as number[];
      
      if (emptySpots.length === 0) return;

      const aiMove = emptySpots[Math.floor(Math.random() * emptySpots.length)];
      const newOpponentMoves = [...currentOpponentMoves];

      // Check if opponent already has 3 pieces
      if (newOpponentMoves.length >= 3) {
        // Remove oldest piece with animation
        const oldestMove = newOpponentMoves[0];
        setFadingCell(oldestMove);

        setTimeout(() => {
          const updatedBoard = [...currentBoard];
          updatedBoard[oldestMove] = null; // Remove oldest
          updatedBoard[aiMove] = "O"; // Place new
          setTttBoard(updatedBoard);
          setFadingCell(null);

          // Update move history
          newOpponentMoves.shift();
          newOpponentMoves.push(aiMove);
          setOpponentMoves(newOpponentMoves);

          // Check for win
          const winner = checkTTTWinner(updatedBoard);
          if (winner === "O") {
            handleGameEnd("opponent");
            return;
          }

          setTttCurrentPlayer("X");
          resetTurnTimer();
        }, 400);
      } else {
        // Place piece normally
        const updatedBoard = [...currentBoard];
        updatedBoard[aiMove] = "O";
        setTttBoard(updatedBoard);
        newOpponentMoves.push(aiMove);
        setOpponentMoves(newOpponentMoves);

        // Check for win
        const winner = checkTTTWinner(updatedBoard);
        if (winner === "O") {
          handleGameEnd("opponent");
          return;
        }

        setTttCurrentPlayer("X");
        resetTurnTimer();
      }
    }, 700);
  };

  /**
   * Connect Four Logic
   * ==========================================
   * - 7x6 grid (7 columns, 6 rows = 42 cells)
   * - Tokens drop from top to bottom
   * - Win: 4 in a row (horizontal, vertical, diagonal)
   * - Full board with no winner = reset and play another round
   * - 30 second timer per turn
   * 
   * Backend: Validate moves server-side to prevent cheating
   */
  const checkC4Winner = (board: (string | null)[]) => {
    const rows = 6;
    const cols = 7;
    
    // Check horizontal
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 3; col++) {
        const idx = row * cols + col;
        if (
          board[idx] &&
          board[idx] === board[idx + 1] &&
          board[idx] === board[idx + 2] &&
          board[idx] === board[idx + 3]
        ) {
          return board[idx];
        }
      }
    }
    
    // Check vertical
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows - 3; row++) {
        const idx = row * cols + col;
        if (
          board[idx] &&
          board[idx] === board[idx + cols] &&
          board[idx] === board[idx + cols * 2] &&
          board[idx] === board[idx + cols * 3]
        ) {
          return board[idx];
        }
      }
    }
    
    // Check diagonal (down-right)
    for (let row = 0; row < rows - 3; row++) {
      for (let col = 0; col < cols - 3; col++) {
        const idx = row * cols + col;
        if (
          board[idx] &&
          board[idx] === board[idx + cols + 1] &&
          board[idx] === board[idx + cols * 2 + 2] &&
          board[idx] === board[idx + cols * 3 + 3]
        ) {
          return board[idx];
        }
      }
    }
    
    // Check diagonal (down-left)
    for (let row = 0; row < rows - 3; row++) {
      for (let col = 3; col < cols; col++) {
        const idx = row * cols + col;
        if (
          board[idx] &&
          board[idx] === board[idx + cols - 1] &&
          board[idx] === board[idx + cols * 2 - 2] &&
          board[idx] === board[idx + cols * 3 - 3]
        ) {
          return board[idx];
        }
      }
    }
    
    return null;
  };

  const handleC4ColumnClick = (col: number) => {
    if (c4CurrentPlayer === "yellow" || c4DroppingToken !== null) return;
    
    const rows = 6;
    const cols = 7;
    
    // Find the lowest empty row in this column
    let targetRow = -1;
    for (let row = rows - 1; row >= 0; row--) {
      const idx = row * cols + col;
      if (!c4Board[idx]) {
        targetRow = row;
        break;
      }
    }
    
    if (targetRow === -1) return; // Column is full
    
    // Animate token drop
    setC4DroppingToken({ col, row: targetRow });
    
    setTimeout(() => {
      const newBoard = [...c4Board];
      const idx = targetRow * cols + col;
      newBoard[idx] = "red";
      setC4Board(newBoard);
      setC4DroppingToken(null);
      
      // Check for win
      const winner = checkC4Winner(newBoard);
      if (winner === "red") {
        handleGameEnd("player");
        return;
      }
      
      // Check if board is full
      if (newBoard.every(cell => cell !== null)) {
        // Board full, no winner - reset for another round
        toast.info(`Round ${c4RoundCount} complete! Starting round ${c4RoundCount + 1}...`);
        setTimeout(() => {
          setC4Board(Array(42).fill(null));
          setC4RoundCount(prev => prev + 1);
          setC4CurrentPlayer("red");
          resetTurnTimer();
        }, 2000);
        return;
      }
      
      // AI's turn
      setC4CurrentPlayer("yellow");
      resetTurnTimer();
      makeC4AIMove(newBoard);
    }, 500); // Drop animation duration
    
    // TODO: Send move to server via WebSocket
  };

  const makeC4AIMove = (currentBoard: (string | null)[]) => {
    setTimeout(() => {
      const rows = 6;
      const cols = 7;
      
      // Find available columns
      const availableCols: number[] = [];
      for (let col = 0; col < cols; col++) {
        if (!currentBoard[col]) {
          availableCols.push(col);
        }
      }
      
      if (availableCols.length === 0) return;
      
      const aiCol = availableCols[Math.floor(Math.random() * availableCols.length)];
      
      // Find the lowest empty row in AI's chosen column
      let targetRow = -1;
      for (let row = rows - 1; row >= 0; row--) {
        const idx = row * cols + aiCol;
        if (!currentBoard[idx]) {
          targetRow = row;
          break;
        }
      }
      
      if (targetRow === -1) return;
      
      // Animate AI token drop
      setC4DroppingToken({ col: aiCol, row: targetRow });
      
      setTimeout(() => {
        const newBoard = [...currentBoard];
        const idx = targetRow * cols + aiCol;
        newBoard[idx] = "yellow";
        setC4Board(newBoard);
        setC4DroppingToken(null);
        
        // Check for win
        const winner = checkC4Winner(newBoard);
        if (winner === "yellow") {
          handleGameEnd("opponent");
          return;
        }
        
        // Check if board is full
        if (newBoard.every(cell => cell !== null)) {
          // Board full, no winner - reset for another round
          toast.info(`Round ${c4RoundCount} complete! Starting round ${c4RoundCount + 1}...`);
          setTimeout(() => {
            setC4Board(Array(42).fill(null));
            setC4RoundCount(prev => prev + 1);
            setC4CurrentPlayer("red");
            resetTurnTimer();
          }, 2000);
          return;
        }
        
        setC4CurrentPlayer("red");
        resetTurnTimer();
      }, 500);
    }, 1000); // AI thinking time
  };

  /**
   * Rock Paper Scissors Logic
   * ==========================================
   * Simple first-to-5-wins format
   * - Both players pick simultaneously
   * - Reveal animation shows both choices
   * - Round result and scoreboard update
   * - First to 5 wins takes the match
   * 
   * Backend: Send {{encrypted_choice}} to server, reveal on blockchain
   */
  const determineRPSWinner = (player: RPSChoice, opponent: RPSChoice): "win" | "lose" | "draw" => {
    if (!player || !opponent) return "draw";
    if (player === opponent) return "draw";
    
    if (
      (player === "rock" && opponent === "scissors") ||
      (player === "scissors" && opponent === "paper") ||
      (player === "paper" && opponent === "rock")
    ) {
      return "win";
    }
    
    return "lose";
  };

  const handleRPSChoice = (choice: RPSChoice) => {
    if (rpsWaitingForOpponent || rpsRevealing) return;
    
    setRpsPlayerChoice(choice);
    setRpsWaitingForOpponent(true);
    
    // TODO Backend: Send encrypted choice to server
    // await sendChoice({ choice: encrypt(choice), matchId: {{match_id}} })
    
    // Simulate opponent AI choice (replace with real opponent from server)
    setTimeout(() => {
      const choices: RPSChoice[] = ["rock", "paper", "scissors"];
      const opponentChoice = choices[Math.floor(Math.random() * 3)];
      setRpsOpponentChoice(opponentChoice);
      
      // Reveal animation
      setRpsRevealing(true);
      
      setTimeout(() => {
        // Determine round winner
        const result = determineRPSWinner(choice, opponentChoice);
        setRpsRoundResult(result);
        
        // Update scores
        let newPlayerScore = rpsPlayerScore;
        let newOpponentScore = rpsOpponentScore;
        
        if (result === "win") {
          newPlayerScore = rpsPlayerScore + 1;
          setRpsPlayerScore(newPlayerScore);
        } else if (result === "lose") {
          newOpponentScore = rpsOpponentScore + 1;
          setRpsOpponentScore(newOpponentScore);
        }
        
        // Check if match is over (first to 5 wins)
        setTimeout(() => {
          if (newPlayerScore >= 5) {
            handleGameEnd("player");
          } else if (newOpponentScore >= 5) {
            handleGameEnd("opponent");
          } else {
            // Next round
            setRpsCurrentRound(prev => prev + 1);
            setRpsPlayerChoice(null);
            setRpsOpponentChoice(null);
            setRpsRoundResult(null);
            setRpsRevealing(false);
            setRpsWaitingForOpponent(false);
            resetTurnTimer();
          }
        }, 2500); // Show result for 2.5 seconds
      }, 1000); // Reveal delay
    }, 1500); // Opponent "thinking" time
  };

  const handleForfeit = () => {
    setShowExitDialog(false);
    handleGameEnd("opponent");
  };

  return (
    <div className="min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Game Header */}
          <Card className="p-4 md:p-6 mb-6 md:mb-8 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Players Info */}
              <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start">
                {/* Current Player */}
                <div className="text-center">
                  <Avatar className="w-12 h-12 md:w-16 md:h-16 mb-2 mx-auto border-2 border-primary">
                    <AvatarFallback className="bg-primary text-white pixel-text">
                      YOU
                    </AvatarFallback>
                  </Avatar>
                  <p className="pixel-text text-xs md:text-sm">You</p>
                  <p className="text-xs text-muted-foreground">{xp} XP</p>
                </div>

                <div className="text-center">
                  <Badge className="pixel-text text-xs bg-gradient-to-r from-primary to-secondary text-white border-0">
                    VS
                  </Badge>
                </div>

                {/* Opponent - {{opponent_name}} {{opponent_xp}} */}
                <div className="text-center">
                  <Avatar className="w-12 h-12 md:w-16 md:h-16 mb-2 mx-auto border-2 border-secondary">
                    <AvatarFallback className="bg-secondary text-white pixel-text">
                      OPP
                    </AvatarFallback>
                  </Avatar>
                  <p className="pixel-text text-xs md:text-sm">{opponentName}</p>
                  <p className="text-xs text-muted-foreground">{opponentXP} XP</p>
                </div>
              </div>

              {/* Game Info */}
              <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  turnTime <= 10 
                    ? "bg-red-500/10 border-red-500/50 animate-pulse" 
                    : "bg-card border-border/50"
                }`}>
                  <Clock className={`w-4 h-4 ${turnTime <= 10 ? "text-red-500" : "text-accent"}`} />
                  <span className={`pixel-text text-sm ${turnTime <= 10 ? "text-red-500" : ""}`}>
                    {formatTime(turnTime)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">/turn</span>
                </div>
                {playMode === "stake" && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30">
                    <Coins className="w-4 h-4 text-accent" />
                    <span className="pixel-text text-sm">{stakeAmount} ARK</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Game Board */}
          {game.name === "Tic-Tac-Toe" && (
            <Card className="p-6 md:p-8 mb-6 md:mb-8">
              <div className="max-w-md mx-auto">
                {/* Game Grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {tttBoard.map((cell, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleTTTCellClick(index)}
                      disabled={gameState === "finished" || tttCurrentPlayer === "O" || fadingCell !== null}
                      animate={{
                        opacity: fadingCell === index ? 0 : 1,
                        scale: fadingCell === index ? 0.8 : 1,
                      }}
                      transition={{ duration: 0.4 }}
                      className={`aspect-square rounded-lg border-2 transition-all pixel-text text-3xl md:text-4xl flex items-center justify-center ${
                        cell
                          ? "bg-card border-primary/30"
                          : "bg-muted/30 border-border/30 hover:border-primary/50 hover:bg-primary/5"
                      } ${gameState === "finished" || tttCurrentPlayer === "O" || fadingCell !== null ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {cell === "X" && <span className="text-primary">X</span>}
                      {cell === "O" && <span className="text-secondary">O</span>}
                    </motion.button>
                  ))}
                </div>

                {/* Turn Indicator */}
                <div className="mt-4 text-center">
                  <p className="text-xs md:text-sm text-muted-foreground pixel-text">
                    {gameState === "playing" && tttCurrentPlayer === "X" && "Your turn"}
                    {gameState === "playing" && tttCurrentPlayer === "O" && "Opponent's turn..."}
                  </p>
                </div>

                {/* Rules Info */}
                <Card className="mt-6 p-4 bg-muted/30 border-border/30">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    <strong className="text-foreground">Rules:</strong> Each player can have up to 3 marks on the board. 
                    When a 4th mark is placed, the oldest one disappears.
                  </p>
                </Card>
              </div>
            </Card>
          )}

          {/* Connect Four Board */}
          {game.name === "Connect Four" && (
            <Card className="p-6 md:p-8 mb-6 md:mb-8">
              <div className="max-w-2xl mx-auto">
                {/* Round Indicator */}
                <div className="text-center mb-4">
                  <Badge className="pixel-text text-xs bg-gradient-to-r from-primary to-secondary">
                    Round {c4RoundCount}
                  </Badge>
                </div>

                {/* Game Grid - 7 columns x 6 rows */}
                <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 border-4 border-primary/30">
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 42 }, (_, index) => {
                      const row = Math.floor(index / 7);
                      const col = index % 7;
                      const cell = c4Board[index];
                      const isDropping = c4DroppingToken?.col === col && c4DroppingToken?.row === row;
                      
                      return (
                        <div key={index} className="relative aspect-square">
                          {/* Column clickable area (only on top row) */}
                          {row === 0 && (
                            <button
                              onClick={() => handleC4ColumnClick(col)}
                              disabled={gameState === "finished" || c4CurrentPlayer === "yellow" || c4DroppingToken !== null}
                              className={`absolute inset-0 -top-8 z-10 ${
                                gameState === "finished" || c4CurrentPlayer === "yellow" || c4DroppingToken !== null
                                  ? "cursor-not-allowed"
                                  : "cursor-pointer hover:bg-primary/10 rounded-t-lg"
                              }`}
                            />
                          )}
                          
                          {/* Cell background (hole) */}
                          <div className="absolute inset-0 bg-background rounded-full border-2 border-primary/20" />
                          
                          {/* Token */}
                          {cell && (
                            <motion.div
                              initial={isDropping ? { y: -200, opacity: 0 } : { y: 0, opacity: 1 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.5, ease: "easeIn" }}
                              className={`absolute inset-1 rounded-full ${
                                cell === "red"
                                  ? "bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50"
                                  : "bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/50"
                              }`}
                            />
                          )}
                          
                          {/* Dropping token preview */}
                          {isDropping && (
                            <motion.div
                              initial={{ y: -200, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ duration: 0.5, ease: "easeIn" }}
                              className={`absolute inset-1 rounded-full ${
                                c4CurrentPlayer === "red"
                                  ? "bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50"
                                  : "bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/50"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Turn Indicator */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${
                      c4CurrentPlayer === "red" 
                        ? "bg-gradient-to-br from-red-400 to-red-600 animate-pulse" 
                        : "bg-gradient-to-br from-yellow-300 to-yellow-500 animate-pulse"
                    }`} />
                    <p className="text-xs md:text-sm text-muted-foreground pixel-text">
                      {gameState === "playing" && c4CurrentPlayer === "red" && "Your turn (Red)"}
                      {gameState === "playing" && c4CurrentPlayer === "yellow" && "Opponent's turn (Yellow)..."}
                    </p>
                  </div>
                </div>

                {/* Rules Info */}
                <Card className="mt-6 p-4 bg-muted/30 border-border/30">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    <strong className="text-foreground">Rules:</strong> Drop tokens from the top. 
                    Connect 4 in a row to win. If the board fills with no winner, it resets for another round!
                  </p>
                </Card>
              </div>
            </Card>
          )}

          {/* Rock Paper Scissors Board */}
          {game.name === "Rock Paper Scissors" && (
            <Card className="p-6 md:p-8 mb-6 md:mb-8">
              <div className="max-w-3xl mx-auto">
                {/* Scoreboard */}
                <div className="mb-8">
                  <div className="text-center mb-4">
                    <Badge className="pixel-text text-xs bg-gradient-to-r from-primary to-secondary">
                      Round {rpsCurrentRound} — First to 5 Wins
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2 pixel-text">You</p>
                      <div className="text-3xl pixel-text text-primary">{rpsPlayerScore}</div>
                    </div>
                    
                    <div className="text-2xl text-muted-foreground pixel-text">:</div>
                    
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2 pixel-text">Opponent</p>
                      <div className="text-3xl pixel-text text-secondary">{rpsOpponentScore}</div>
                    </div>
                  </div>
                </div>

                {/* Round Result Display */}
                <AnimatePresence>
                  {rpsRoundResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="mb-6 text-center"
                    >
                      <Badge 
                        className={`pixel-text text-sm px-6 py-2 ${
                          rpsRoundResult === "win" 
                            ? "bg-green-500 hover:bg-green-600" 
                            : rpsRoundResult === "lose"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-muted hover:bg-muted"
                        }`}
                      >
                        {rpsRoundResult === "win" && "🎉 You Win This Round!"}
                        {rpsRoundResult === "lose" && "😔 You Lose This Round"}
                        {rpsRoundResult === "draw" && "🤝 Draw - Try Again!"}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Choices Display */}
                <div className="mb-8">
                  <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
                    {/* Player Choice */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-3 pixel-text">Your Pick</p>
                      <AnimatePresence mode="wait">
                        {rpsRevealing && rpsPlayerChoice ? (
                          <motion.div
                            key="player-reveal"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center justify-center"
                          >
                            <div className="text-6xl">
                              {rpsPlayerChoice === "rock" && "✊"}
                              {rpsPlayerChoice === "paper" && "✋"}
                              {rpsPlayerChoice === "scissors" && "✌️"}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex items-center justify-center h-24">
                            <div className="text-4xl text-muted-foreground/30">?</div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Opponent Choice */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-3 pixel-text">Opponent's Pick</p>
                      <AnimatePresence mode="wait">
                        {rpsRevealing && rpsOpponentChoice ? (
                          <motion.div
                            key="opponent-reveal"
                            initial={{ rotateY: -90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center justify-center"
                          >
                            <div className="text-6xl">
                              {rpsOpponentChoice === "rock" && "✊"}
                              {rpsOpponentChoice === "paper" && "✋"}
                              {rpsOpponentChoice === "scissors" && "✌️"}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex items-center justify-center h-24">
                            <div className="text-4xl text-muted-foreground/30">
                              {rpsWaitingForOpponent ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  ⏳
                                </motion.div>
                              ) : "?"}
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Choice Buttons */}
                {!rpsWaitingForOpponent && !rpsRevealing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
                  >
                    <Button
                      onClick={() => handleRPSChoice("rock")}
                      disabled={gameState === "finished"}
                      className="h-32 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-5xl"
                      >
                        ✊
                      </motion.div>
                      <span className="pixel-text text-xs">ROCK</span>
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    </Button>

                    <Button
                      onClick={() => handleRPSChoice("paper")}
                      disabled={gameState === "finished"}
                      className="h-32 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-5xl"
                      >
                        ✋
                      </motion.div>
                      <span className="pixel-text text-xs">PAPER</span>
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    </Button>

                    <Button
                      onClick={() => handleRPSChoice("scissors")}
                      disabled={gameState === "finished"}
                      className="h-32 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-5xl"
                      >
                        ✌️
                      </motion.div>
                      <span className="pixel-text text-xs">SCISSORS</span>
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    </Button>
                  </motion.div>
                )}

                {/* Waiting State */}
                {rpsWaitingForOpponent && !rpsRevealing && (
                  <div className="text-center">
                    <motion.p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-sm text-muted-foreground pixel-text"
                    >
                      Waiting for opponent...
                    </motion.p>
                  </div>
                )}

                {/* Rules Info */}
                <Card className="mt-6 p-4 bg-muted/30 border-border/30">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    <strong className="text-foreground">Rules:</strong> Rock beats Scissors, Scissors beats Paper, Paper beats Rock. 
                    First player to reach 5 round wins takes the entire ARK stake pool!
                  </p>
                </Card>
              </div>
            </Card>
          )}

          {/* Chess Board Placeholder */}
          {game.name === "Chess" && (
            <Card className="p-6 md:p-8 mb-6 md:mb-8">
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="pixel-text text-sm text-muted-foreground mb-2">
                  Chess Game Board
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Integrate chess.js library for full chess functionality
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          {gameState === "playing" && (
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExitDialog(true)}
                className="pixel-text text-xs border-red-500/50 text-red-500 hover:bg-red-500/10"
              >
                Forfeit Match
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text">Forfeit Match?</AlertDialogTitle>
            <AlertDialogDescription>
              Leaving now will count as a loss and you'll lose XP
              {playMode === "stake" && ` and ${stakeAmount} ARK tokens`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="pixel-text text-xs">Continue Playing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForfeit}
              className="bg-red-600 hover:bg-red-700 pixel-text text-xs"
            >
              Forfeit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Game Result Modal */}
      {/* Backend: Display match result with {{match_result}} {{ark_earned}} {{xp_change}} */}
      <AnimatePresence>
        {gameState === "finished" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <Card className="p-6 md:p-8 max-w-md w-full bg-card border-primary/30 shadow-2xl">
                <div className="text-center space-y-4 md:space-y-6">
                  {/* Result Icon */}
                  {winner === "player" && (
                    <PartyPopper className="w-16 h-16 md:w-20 md:h-20 mx-auto text-yellow-400" />
                  )}
                  {winner === "opponent" && (
                    <Trophy className="w-16 h-16 md:w-20 md:h-20 mx-auto text-muted-foreground" />
                  )}
                  {winner === "draw" && (
                    <Trophy className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-400" />
                  )}

                  {/* Result Text */}
                  <div>
                    <h2 className="text-2xl md:text-3xl pixel-text mb-2">
                      {winner === "player" && "Victory!"}
                      {winner === "opponent" && "Defeat"}
                      {winner === "draw" && "Draw"}
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {winner === "player" && "Congratulations on your win!"}
                      {winner === "opponent" && "Better luck next time"}
                      {winner === "draw" && "Well played!"}
                    </p>
                    {playMode === "free" && (
                      <p className="text-xs text-accent mt-2">
                        Practice mode - Play staked games to earn rewards!
                      </p>
                    )}
                  </div>

                  {/* Rewards - Only show in stake mode */}
                  {playMode === "stake" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-accent" />
                          <span className="text-sm text-muted-foreground">ARK</span>
                        </div>
                        <span className={`pixel-text ${earnedARK >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {earnedARK >= 0 ? "+" : ""}{earnedARK}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">XP</span>
                        </div>
                        <span className={`pixel-text ${earnedXP >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {earnedXP >= 0 ? "+" : ""}{earnedXP}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => onNavigate("lobby", { game })}
                      className="w-full bg-gradient-to-r from-primary via-secondary to-accent pixel-text text-xs"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                    <Button
                      onClick={() => onNavigate("landing")}
                      variant="outline"
                      className="w-full pixel-text text-xs"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Back to Home
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
