/**
 * SPARK - Lobby Page
 * Game lobby for matchmaking and stake selection
 * 
 * DEVELOPER INTEGRATION NOTES:
 * ============================================================================
 * DATA REQUIRED FROM BACKEND:
 * 
 * 1. Matchmaking System:
 *    - POST /api/matchmaking/join
 *      Body: {
 *        gameId: "{{game_id}}",
 *        playMode: "free" | "stake",
 *        stakeAmount: {{amount}},
 *        playerXP: {{user_xp}}
 *      }
 *      Response: { matchId: "{{match_id}}", status: "searching" | "found" }
 * 
 *    - WebSocket connection for real-time matchmaking:
 *      ws://your-server/matchmaking
 *      Events:
 *      - "match_found": { matchId, opponentId, opponentName, opponentXP }
 *      - "match_timeout": {} (no opponent found)
 * 
 * 2. AI Opponent Selection:
 *    - GET /api/ai-opponent?difficulty={{easy|medium|hard}}
 *      Returns AI opponent with appropriate XP level
 * 
 * 3. Stake Validation:
 *    - Verify user has sufficient ARK balance before allowing stake
 *    - Smart contract should lock staked tokens during match
 * 
 * GAME FLOW:
 * 1. User selects play mode (Free/Stake)
 * 2. If stake: user sets amount (validate against balance)
 * 3. User chooses matchmaking (Multiplayer/AI)
 * 4. Backend finds opponent or AI
 * 5. Navigate to GamePage with match details
 * ============================================================================
 */

import { useState, useRef, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Coins, ArrowLeft, Loader2, Users, Info } from "lucide-react";
import { Game } from "../types";
import { useWallet } from "../context/WalletContext";
import { useAccount } from "wagmi";
import { useApproveArk, useCreateMatch, useJoinMatch } from "../lib/hooks";
import { stakeAndQueue } from "../lib/matchClient";
import { motion } from "motion/react";
import {
  ChessIllustration,
  TicTacToeIllustration,
  ConnectFourIllustration,
  RockPaperScissorsIllustration,
} from "../components/ArcadeIllustrations";
import { StakePlay } from "../features/lobby/StakePlay";

interface LobbyPageProps {
  game: Game;
  onNavigate: (screen: string, data?: any) => void;
}

const illustrationMap = {
  chess: ChessIllustration,
  tictactoe: TicTacToeIllustration,
  connectfour: ConnectFourIllustration,
  rockpaperscissors: RockPaperScissorsIllustration,
};

export function LobbyPage({ game, onNavigate }: LobbyPageProps) {
  const [playMode, setPlayMode] = useState<"free" | "stake">("free");
  const [stakeAmount, setStakeAmount] = useState(1);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingMode, setMatchmakingMode] = useState<"multiplayer" | "ai" | null>(null);
  const [matchmakingFailed, setMatchmakingFailed] = useState(false);
  const { arkBalance, xp } = useWallet();
  const { address } = useAccount();
  const approveArk = useApproveArk();
  const createMatch = useCreateMatch();
  const joinMatch = useJoinMatch();
  const wsRef = useRef<WebSocket | null>(null);

  const Illustration = illustrationMap[game.illustration as keyof typeof illustrationMap];
  
  // WebSocket URL from environment - convert http to ws
  const apiUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";
  const wsUrl = apiUrl.replace("http", "ws");
  
  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  /**
   * Start matchmaking
   * For stake mode: Calls smart contract approve + createMatch, then sends WebSocket join
   * For free mode: Sends WebSocket join directly
   * WebSocket: Listen for match_found or match_timeout events
   */
  const handleStartMatch = async (mode: "multiplayer" | "ai") => {
    setMatchmakingMode(mode);
    setIsMatchmaking(true);
    setMatchmakingFailed(false);
    
    try {
      if (mode === "ai") {
        // AI mode - simpler flow, no multiplayer matchmaking needed
        if (playMode === "stake") {
          // For stake mode with AI, still need to create escrow
          if (!address) {
            throw new Error("Wallet not connected");
          }
          
          // Connect WebSocket for AI stake mode
          const ws = new WebSocket(`${wsUrl}/matchmaking`);
          wsRef.current = ws;
          
          // Wait for WebSocket to connect
          await new Promise<void>((resolve, reject) => {
            ws.onopen = () => resolve();
            ws.onerror = () => reject(new Error("WebSocket connection failed"));
            setTimeout(() => reject(new Error("WebSocket timeout")), 5000);
          });
          
          // Call stakeAndQueue to handle approve + createMatch + join
          await stakeAndQueue(
            stakeAmount.toString(),
            address,
            ws,
            approveArk,
            createMatch
          );
          
          // For AI, we can navigate immediately after stake
          setTimeout(() => {
            onNavigate("gameplay", { 
              game, 
              stakeAmount,
              playMode,
              opponentType: "ai",
              opponentXP: xp
            });
          }, 1500);
        } else {
          // Free play AI - no blockchain interaction needed
          setTimeout(() => {
            onNavigate("gameplay", { 
              game, 
              stakeAmount: 0,
              playMode,
              opponentType: "ai",
              opponentXP: xp
            });
          }, 1500);
        }
      } else {
        // Multiplayer mode - real matchmaking via WebSocket
        if (!address) {
          throw new Error("Wallet not connected");
        }
        
        // Connect WebSocket
        const ws = new WebSocket(`${wsUrl}/matchmaking`);
        wsRef.current = ws;
        
        // Setup WebSocket event handlers
        ws.onopen = async () => {
          console.log("WebSocket connected to matchmaking");
          
          if (playMode === "stake") {
            // Stake mode: approve + createMatch + send join with escrowId
            try {
              await stakeAndQueue(
                stakeAmount.toString(),
                address,
                ws,
                approveArk,
                createMatch
              );
            } catch (error) {
              console.error("Stake and queue failed:", error);
              setIsMatchmaking(false);
              setMatchmakingFailed(true);
              ws.close();
            }
          } else {
            // Free mode: just send join message
            ws.send(JSON.stringify({
              action: "join",
              wallet: address,
              gameId: game.id,
              playMode: "free",
              stakeAmount: 0,
              playerXP: xp
            }));
          }
        };
        
        ws.onmessage = async (event) => {
          const msg = JSON.parse(event.data);
          console.log("WebSocket message:", msg);
          
          if (msg.event === "match_found") {
            try {
              const { matchId, escrowId, opponentWallet, role } = msg.data;
              
              // P1 informs backend to start the match
              if (role === "p1") {
                await fetch(`${apiUrl}/api/match/start`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    p1Wallet: address,
                    p2Wallet: opponentWallet,
                    gameId: game.id,
                    stakeAmount: playMode === "stake" ? Number(stakeAmount) : 0,
                    escrowId: escrowId ? BigInt(escrowId).toString() : null
                  })
                });
              }
              
              // P2 joins on-chain if escrowId is present
              if (role === "p2" && escrowId) {
                try {
                  await joinMatch(BigInt(escrowId));
                  console.log("P2 joined match on-chain:", escrowId);
                } catch (error) {
                  console.error("Failed to join match on-chain:", error);
                  // Continue anyway - backend can handle this
                }
              }
              
              // Navigate to game page
              onNavigate("gameplay", { 
                game, 
                stakeAmount: playMode === "stake" ? stakeAmount : 0,
                playMode,
                opponentType: "player",
                matchId,
                escrowId,
                opponentWallet,
                role
              });
            } catch (error) {
              console.error("Error handling match_found:", error);
              setIsMatchmaking(false);
              setMatchmakingFailed(true);
            }
          } else if (msg.event === "match_timeout" || msg.type === "error") {
            setIsMatchmaking(false);
            setMatchmakingFailed(true);
          }
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsMatchmaking(false);
          setMatchmakingFailed(true);
        };
        
        ws.onclose = () => {
          console.log("WebSocket closed");
          if (isMatchmaking) {
            setIsMatchmaking(false);
            setMatchmakingFailed(true);
          }
        };
      }
    } catch (error) {
      console.error("Error starting match:", error);
      setIsMatchmaking(false);
      setMatchmakingFailed(true);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  };

  const switchToAIMode = () => {
    setMatchmakingFailed(false);
    handleStartMatch("ai");
  };

  const canAffordStake = arkBalance >= stakeAmount;

  return (
    <div className="min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => onNavigate("landing")}
            className="mb-4 md:mb-6 pixel-text text-xs hover:bg-primary/10"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
            Back to Games
          </Button>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Game Info */}
            <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-3 md:gap-4 mb-4">
                  <span className="text-3xl md:text-4xl">{game.icon}</span>
                  <div>
                    <h1 className="text-2xl md:text-3xl pixel-text">{game.name}</h1>
                    <Badge className="mt-1 pixel-text text-xs bg-gradient-to-r from-primary to-secondary text-white border-0">
                      {game.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* Game Illustration */}
                <div className="my-6 md:my-8 flex justify-center">
                  <Illustration />
                </div>

                {/* Game Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Active Players</span>
                    <span className="pixel-text flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {game.players.toLocaleString()}
                      {/* Backend: Real-time player count */}
                    </span>
                  </div>
                  {/* Removed ARK Reward and NFT Reward display as requested */}
                </div>

                {/* Game Rules */}
                {game.rules && game.rules.length > 0 && (
                  <>
                    <div className="h-px bg-border/50 my-6" />
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4 text-primary" />
                        <h3 className="pixel-text text-sm">Game Rules</h3>
                      </div>
                      <ul className="space-y-2">
                        {game.rules.map((rule, index) => (
                          <li
                            key={index}
                            className={`text-xs flex items-start gap-2 ${
                              rule.includes("⚠️") ? "text-accent font-medium" : "text-muted-foreground"
                            }`}
                          >
                            <span className="mt-0.5 flex-shrink-0">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Matchmaking Panel */}
            <div className="space-y-4 md:space-y-6">
              {/* Play Mode Selection */}
              <Card className="p-6 md:p-8">
                <h2 className="pixel-text text-base md:text-lg mb-4">Choose Play Mode</h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                  <Button
                    variant={playMode === "free" ? "default" : "outline"}
                    onClick={() => setPlayMode("free")}
                    disabled={isMatchmaking}
                    className={`pixel-text text-xs h-auto py-4 ${
                      playMode === "free" ? "bg-gradient-to-r from-primary to-secondary" : ""
                    }`}
                  >
                    <div className="text-center">
                      <div className="mb-1">Free Play</div>
                      <div className="text-xs opacity-80">No stake</div>
                    </div>
                  </Button>
                  <Button
                    variant={playMode === "stake" ? "default" : "outline"}
                    onClick={() => setPlayMode("stake")}
                    disabled={isMatchmaking}
                    className={`pixel-text text-xs h-auto py-4 ${
                      playMode === "stake" ? "bg-gradient-to-r from-accent to-secondary" : ""
                    }`}
                  >
                    <div className="text-center">
                      <div className="mb-1">Staked</div>
                      <div className="text-xs opacity-80">Win double</div>
                    </div>
                  </Button>
                </div>

                {/* Stake Amount Input */}
                {/* Backend: Validate stake amount and lock tokens */}
                {playMode === "stake" && (
                  <div className="space-y-2 mb-6">
                    <label className="text-xs text-muted-foreground pixel-text">
                      Stake Amount (ARK)
                    </label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.1"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
                        className="pl-10 pixel-text"
                        min={0.1}
                        max={arkBalance}
                        disabled={isMatchmaking}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Balance: {arkBalance} ARK
                      </span>
                      {!canAffordStake && (
                        <span className="text-red-500">Insufficient balance</span>
                      )}
                    </div>
                  </div>
                )}

                {/* User XP Display */}
                <div className="mb-6 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Your XP</span>
                    <span className="pixel-text text-accent">{xp}</span>
                  </div>
                </div>

                {/* Matchmaking Buttons */}
                {!isMatchmaking && !matchmakingFailed && (
                  <div className="space-y-3">
                    {playMode === "stake" ? (
                      // Use StakePlay component for stake mode multiplayer
                      <StakePlay
                        stake={stakeAmount.toString()}
                        gameId={game.id}
                        onMatchFound={(data) => {
                          // Navigate to game page with match data
                          onNavigate("gameplay", {
                            game,
                            stakeAmount,
                            playMode,
                            opponentType: "player",
                            matchId: data.matchId,
                            escrowId: data.escrowId,
                            opponentWallet: data.opponentWallet,
                            role: data.role
                          });
                        }}
                      />
                    ) : (
                      // Free mode multiplayer - use existing button
                      <Button
                        onClick={() => handleStartMatch("multiplayer")}
                        disabled={isMatchmaking}
                        className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 pixel-text text-xs h-11 md:h-12"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Find Multiplayer Match
                      </Button>
                    )}
                    <Button
                      onClick={() => handleStartMatch("ai")}
                      disabled={isMatchmaking || (playMode === "stake" && !canAffordStake)}
                      variant="outline"
                      className="w-full border-2 border-secondary/50 hover:bg-secondary/10 pixel-text text-xs h-11 md:h-12"
                    >
                      Play vs AI
                    </Button>
                  </div>
                )}

                {/* Matchmaking Loading */}
                {isMatchmaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6"
                  >
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <p className="pixel-text text-sm mb-2">
                      {matchmakingMode === "ai" ? "Preparing AI Opponent..." : "Finding Opponent..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {matchmakingMode === "multiplayer" && "Matching based on your XP level"}
                    </p>
                  </motion.div>
                )}

                {/* Matchmaking Failed */}
                {matchmakingFailed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6 space-y-4"
                  >
                    <p className="pixel-text text-sm text-muted-foreground">
                      No opponent found
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={switchToAIMode}
                        className="w-full bg-gradient-to-r from-secondary to-accent pixel-text text-xs"
                      >
                        Play vs AI Instead
                      </Button>
                      <Button
                        onClick={() => {
                          setMatchmakingFailed(false);
                          setIsMatchmaking(false);
                        }}
                        variant="ghost"
                        className="w-full pixel-text text-xs"
                      >
                        Try Again
                      </Button>
                    </div>
                  </motion.div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
