/**
 * SPARK - Leaderboard Page
 * Display global player rankings with time filters
 * 
 * DEVELOPER INTEGRATION NOTES:
 * ============================================================================
 * DATA REQUIRED FROM BACKEND:
 * 
 * 1. GET /api/leaderboard?timeFilter={daily|weekly|alltime}
 *    Returns array of players:
 *    [
 *      {
 *        id: "{{player_id}}",
 *        name: "{{player_name}}",
 *        avatar: "{{avatar_url}}",
 *        xp: {{player_xp}},
 *        tier: "{{player_tier}}",
 *        rank: {{player_rank}}
 *      }
 *    ]
 * 
 * 2. Current User Rank:
 *    - Highlight current user in leaderboard
 *    - Show user's position even if not in top players
 * 
 * 3. Real-time Updates:
 *    - Consider WebSocket connection for live rank updates
 *    - Or poll every 30-60 seconds
 * 
 * PLACEHOLDER PATTERNS:
 * - {{player_name}}: Player username or ENS name
 * - {{player_xp}}: Player's total XP
 * - {{player_tier}}: Bronze/Silver/Gold/Diamond
 * - {{player_rank}}: Position in leaderboard (1, 2, 3...)
 * ============================================================================
 */

import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Medal, Crown, Trophy } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { PixelAvatar } from "../components/PixelAvatar";

interface LeaderboardPageProps {
  onNavigate: (screen: string, data?: any) => void;
}

// MOCK DATA STRUCTURE - Replace with API call
interface LeaderboardPlayer {
  id: string; // {{player_id}}
  name: string; // {{player_name}}
  avatar: string; // {{avatar_url}}
  xp: number; // {{player_xp}}
  tier: string; // {{player_tier}}
  rank: number; // {{player_rank}}
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const [timeFilter, setTimeFilter] = useState<"daily" | "weekly" | "alltime">("alltime");
  const { isConnected, xp, nickname, walletAddress } = useWallet();

  // TODO: Replace with actual API call
  // Example: const { data: players } = useQuery(['leaderboard', timeFilter], () => 
  //   fetch(`/api/leaderboard?timeFilter=${timeFilter}`).then(r => r.json())
  // );
  
  // PLACEHOLDER: Empty leaderboard - populate from backend
  const sortedPlayers: LeaderboardPlayer[] = [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-muted-foreground pixel-text text-xs">#{rank}</span>;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Diamond":
        return "border-cyan-400 text-cyan-400 bg-cyan-400/10";
      case "Platinum":
        return "border-purple-400 text-purple-400 bg-purple-400/10";
      case "Gold":
        return "border-yellow-400 text-yellow-400 bg-yellow-400/10";
      case "Silver":
        return "border-gray-400 text-gray-400 bg-gray-400/10";
      default:
        return "border-orange-600 text-orange-600 bg-orange-600/10";
    }
  };

  return (
    <div className="min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="mb-2 md:mb-3 text-3xl md:text-4xl pixel-text bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <p className="text-muted-foreground/70 text-xs md:text-sm">
              Compete with the best players and climb the ranks
            </p>
          </div>

          {/* Time Filter */}
          {/* Backend: Fetch different rankings based on timeFilter */}
          <div className="flex justify-center mb-6 md:mb-10">
            <div className="inline-flex gap-2 p-1.5 rounded-xl bg-card/30 border border-primary/20">
              <Button
                size="sm"
                variant={timeFilter === "daily" ? "default" : "ghost"}
                onClick={() => setTimeFilter("daily")}
                className={`pixel-text text-xs ${timeFilter === "daily" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
              >
                Daily
              </Button>
              <Button
                size="sm"
                variant={timeFilter === "weekly" ? "default" : "ghost"}
                onClick={() => setTimeFilter("weekly")}
                className={`pixel-text text-xs ${timeFilter === "weekly" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
              >
                Weekly
              </Button>
              <Button
                size="sm"
                variant={timeFilter === "alltime" ? "default" : "ghost"}
                onClick={() => setTimeFilter("alltime")}
                className={`pixel-text text-xs ${timeFilter === "alltime" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
              >
                All Time
              </Button>
            </div>
          </div>

          {/* Empty State / Placeholder */}
          {sortedPlayers.length === 0 && (
            <Card className="p-12 text-center bg-card/30 border-border/30">
              <div className="space-y-4">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30" />
                <div>
                  <h3 className="text-lg pixel-text text-muted-foreground mb-2">
                    No Rankings Available
                  </h3>
                  <p className="text-xs text-muted-foreground/70">
                    Backend Integration Required
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-2">
                    Connect to: GET /api/leaderboard?timeFilter={timeFilter}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Top 3 Podium */}
          {/* Backend: First 3 players from leaderboard API */}
          {sortedPlayers.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              {/* 2nd Place - {{rank_2_player}} */}
              {sortedPlayers[1] && (
                <Card className="p-4 md:p-6 border border-gray-400/20 bg-gradient-to-br from-gray-400/5 to-transparent order-2 md:order-1">
                  <div className="text-center">
                    <div className="flex justify-center mb-2 md:mb-3">
                      <Medal className="w-10 md:w-12 h-10 md:h-12 text-gray-400" />
                    </div>
                    <div className="flex justify-center mb-2 md:mb-3">
                      <PixelAvatar seed={sortedPlayers[1].name} size={64} className="md:hidden" />
                      <PixelAvatar seed={sortedPlayers[1].name} size={80} className="hidden md:block" />
                    </div>
                    <h3 className="pixel-text text-sm md:text-base mb-1">{sortedPlayers[1].name}</h3>
                    <Badge className={`pixel-text text-xs mb-2 ${getTierColor(sortedPlayers[1].tier)}`}>
                      {sortedPlayers[1].tier}
                    </Badge>
                    <p className="text-xs md:text-sm text-muted-foreground">{sortedPlayers[1].xp.toLocaleString()} XP</p>
                  </div>
                </Card>
              )}

              {/* 1st Place - {{rank_1_player}} */}
              {sortedPlayers[0] && (
                <Card className="p-4 md:p-8 border-2 border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-transparent order-1 md:order-2 md:scale-105">
                  <div className="text-center">
                    <div className="flex justify-center mb-2 md:mb-4">
                      <Crown className="w-12 md:w-16 h-12 md:h-16 text-yellow-400" />
                    </div>
                    <div className="flex justify-center mb-2 md:mb-4">
                      <PixelAvatar seed={sortedPlayers[0].name} size={80} className="md:hidden" />
                      <PixelAvatar seed={sortedPlayers[0].name} size={96} className="hidden md:block" />
                    </div>
                    <h3 className="pixel-text text-base md:text-lg mb-1 md:mb-2">{sortedPlayers[0].name}</h3>
                    <Badge className={`pixel-text text-xs mb-2 md:mb-3 ${getTierColor(sortedPlayers[0].tier)}`}>
                      {sortedPlayers[0].tier}
                    </Badge>
                    <p className="text-sm md:text-base text-muted-foreground">{sortedPlayers[0].xp.toLocaleString()} XP</p>
                  </div>
                </Card>
              )}

              {/* 3rd Place - {{rank_3_player}} */}
              {sortedPlayers[2] && (
                <Card className="p-4 md:p-6 border border-orange-600/20 bg-gradient-to-br from-orange-600/5 to-transparent order-3">
                  <div className="text-center">
                    <div className="flex justify-center mb-2 md:mb-3">
                      <Medal className="w-10 md:w-12 h-10 md:h-12 text-orange-600" />
                    </div>
                    <div className="flex justify-center mb-2 md:mb-3">
                      <PixelAvatar seed={sortedPlayers[2].name} size={64} className="md:hidden" />
                      <PixelAvatar seed={sortedPlayers[2].name} size={80} className="hidden md:block" />
                    </div>
                    <h3 className="pixel-text text-sm md:text-base mb-1">{sortedPlayers[2].name}</h3>
                    <Badge className={`pixel-text text-xs mb-2 ${getTierColor(sortedPlayers[2].tier)}`}>
                      {sortedPlayers[2].tier}
                    </Badge>
                    <p className="text-xs md:text-sm text-muted-foreground">{sortedPlayers[2].xp.toLocaleString()} XP</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Full Rankings Table */}
          {/* Backend: All players from leaderboard API */}
          {sortedPlayers.length > 0 && (
            <Card className="p-4 md:p-6 bg-card/30 border-border/30 overflow-hidden">
              <h2 className="pixel-text text-base md:text-lg mb-4 md:mb-6">Full Rankings</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg transition-all ${
                      isConnected && player.id === walletAddress
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-card/50 hover:bg-card/80"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 md:w-12 flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <PixelAvatar seed={player.name} size={40} className="md:hidden" />
                      <PixelAvatar seed={player.name} size={48} className="hidden md:block" />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="pixel-text text-xs md:text-sm truncate">{player.name}</h3>
                      <Badge className={`pixel-text text-xs mt-1 ${getTierColor(player.tier)}`}>
                        {player.tier}
                      </Badge>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="pixel-text text-xs md:text-sm text-primary">
                        {player.xp.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
