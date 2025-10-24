/**
 * SPARK - Profile Page
 * User profile with stats, NFT badges, and game history
 * 
 * DEVELOPER INTEGRATION NOTES:
 * ============================================================================
 * DATA REQUIRED FROM BACKEND:
 * 
 * 1. GET /api/user/profile
 *    {
 *      id: "{{user_id}}",
 *      walletAddress: "{{wallet_address}}",
 *      nickname: "{{user_nickname}}",
 *      avatar: "{{avatar_url}}",
 *      xp: {{user_xp}},
 *      tier: "{{user_tier}}",
 *      arkBalance: {{ark_balance}},
 *      stats: {
 *        gamesPlayed: {{total_games}},
 *        gamesWon: {{games_won}},
 *        winRate: {{win_rate_percentage}}
 *      }
 *    }
 * 
 * 2. GET /api/user/nft-badges
 *    [
 *      {
 *        id: "{{badge_id}}",
 *        name: "{{badge_name}}",
 *        tier: "{{badge_tier}}",
 *        unlocked: {{true|false}},
 *        unlockedAt: "{{timestamp}}"
 *      }
 *    ]
 * 
 * 3. GET /api/user/match-history?limit=10
 *    [
 *      {
 *        id: "{{match_id}}",
 *        game: "{{game_name}}",
 *        result: "Win" | "Loss" | "Draw",
 *        arkEarned: {{ark_amount}},
 *        xpChange: {{xp_change}},
 *        date: "{{timestamp}}"
 *      }
 *    ]
 * 
 * 4. PUT /api/user/profile
 *    Body: { nickname: "{{new_nickname}}" }
 *    Save nickname updates
 * ============================================================================
 */

import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Coins, Trophy, Award, Zap, Lock, TrendingUp, Edit2, X, Check } from "lucide-react";
import { getTierFromXP } from "../types";
import { useWallet } from "../context/WalletContext";
import { useAccount } from "wagmi";
import { PixelAvatar } from "../components/PixelAvatar";
import { PixelNFTBadge } from "../components/PixelNFTBadge";

interface ProfilePageProps {
  onNavigate: (screen: string, data?: any) => void;
}

// NFT Badge structure
const nftBadgesData = [
  { id: "1", name: "Bronze Badge", tier: "Bronze", requiredXP: 0, locked: false },
  { id: "2", name: "Silver Badge", tier: "Silver", requiredXP: 500, locked: false },
  { id: "3", name: "Gold Badge", tier: "Gold", requiredXP: 1000, locked: true },
  { id: "4", name: "Diamond Badge", tier: "Diamond", requiredXP: 2000, locked: true },
];

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { arkBalance, xp, nickname, setNickname } = useWallet();
  const { address } = useAccount();
  const currentTier = getTierFromXP(xp);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname);
  const [recentGames, setRecentGames] = useState<Array<{
    game: string;
    result: "Win" | "Loss" | "Draw";
    arkEarned: number;
    date: string;
  }>>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [stats, setStats] = useState<{ gamesPlayed: number; gamesWon: number; winRate: number }>({ gamesPlayed: 0, gamesWon: 0, winRate: 0 });
  const [totalEarned, setTotalEarned] = useState<number>(0);

  const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

  // Fetch user profile (stats, total earned) and match history
  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      setIsLoadingGames(true);
      try {
        const profileRes = await fetch(`${API}/api/user/profile?wallet=${address}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile?.stats) setStats(profile.stats);
          if (typeof profile?.totalArkEarned === "number") setTotalEarned(profile.totalArkEarned);
        }
        const response = await fetch(`${API}/api/user/match-history?wallet=${address}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setRecentGames(data);
        }
      } catch (error) {
        console.error("Error fetching match history:", error);
      } finally {
        setIsLoadingGames(false);
      }
    };

    fetchData();
  }, [address, API]);
  
  // Update locked status based on XP
  // Backend: Fetch actual badge unlock status from API
  const updatedNFTBadges = nftBadgesData.map(badge => ({
    ...badge,
    locked: xp < badge.requiredXP
  }));
  
  const unlockedNFTs = updatedNFTBadges.filter(nft => !nft.locked);
  
  // Calculate progress to next tier
  const getNextTierXP = (currentXP: number) => {
    if (currentXP < 500) return 500;
    if (currentXP < 1000) return 1000;
    if (currentXP < 2000) return 2000;
    return 2000;
  };
  
  const getPreviousTierXP = (currentXP: number) => {
    if (currentXP < 500) return 0;
    if (currentXP < 1000) return 500;
    if (currentXP < 2000) return 1000;
    return 2000;
  };
  
  const nextTierXP = getNextTierXP(xp);
  const prevTierXP = getPreviousTierXP(xp);
  const progressToNextTier = xp >= 2000 ? 100 : Math.floor(((xp - prevTierXP) / (nextTierXP - prevTierXP)) * 100);

  /**
   * Save nickname
   * Backend: PUT /api/user/profile with { nickname }
   */
  const handleSaveNickname = async () => {
    const trimmedNickname = tempNickname.trim();
    if (trimmedNickname.length < 3) {
      console.error("Nickname must be at least 3 characters long");
      return;
    }
    if (trimmedNickname.length > 20) {
      console.error("Nickname must be 20 characters or less");
      return;
    }
    
    // Update local state
    setNickname(trimmedNickname);
    setIsEditingNickname(false);
    console.log("Nickname updated successfully!");
    
    // Save to backend
    if (address) {
      try {
        await fetch(`${API}/api/user/profile`, {
          method: 'PUT',
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ 
            wallet: address,
            nickname: trimmedNickname 
          })
        });
      } catch (error) {
        console.error("Failed to save nickname:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setTempNickname(nickname);
    setIsEditingNickname(false);
  };

  // Stats provided by backend
  const { gamesPlayed, gamesWon, winRate } = stats;

  return (
    <div className="min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="p-6 md:p-8 mb-6 md:mb-8 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Avatar - Generated from nickname */}
              <div className="flex-shrink-0">
                <PixelAvatar seed={nickname} size={96} className="md:hidden" />
                <PixelAvatar seed={nickname} size={128} className="hidden md:block" />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                {/* Nickname Editor */}
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-3 md:mb-4 justify-center md:justify-start">
                  {isEditingNickname ? (
                    <>
                      <Input
                        value={tempNickname}
                        onChange={(e) => setTempNickname(e.target.value)}
                        className="w-48 pixel-text text-sm"
                        placeholder="Enter nickname"
                        maxLength={20}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          onClick={handleSaveNickname}
                          className="h-8 w-8 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl md:text-3xl pixel-text">{nickname}</h1>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsEditingNickname(true)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Tier Badge - {{user_tier}} */}
                <Badge className="mb-3 md:mb-4 pixel-text text-xs bg-gradient-to-r from-primary to-secondary text-white border-0">
                  {currentTier} Tier
                </Badge>

                {/* Stats Grid */}
                {/* Backend: Fetch from user stats API */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground mb-1">XP</p>
                    <p className="text-base md:text-lg pixel-text text-accent">{xp}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground mb-1">ARK Balance</p>
                    <p className="text-base md:text-lg pixel-text text-primary">{arkBalance.toLocaleString()}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground mb-1">Badges</p>
                    <p className="text-base md:text-lg pixel-text text-secondary">{unlockedNFTs.length}/4</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                    <p className="text-base md:text-lg pixel-text text-green-500">{winRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-6 md:mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground pixel-text">
                  {xp >= 2000 ? "Max Tier Reached!" : `Progress to ${nextTierXP === 500 ? "Silver" : nextTierXP === 1000 ? "Gold" : "Diamond"} Tier`}
                </span>
                <span className="text-xs text-primary pixel-text">{xp} / {nextTierXP} XP</span>
              </div>
              <Progress value={progressToNextTier} className="h-2 md:h-2.5" />
            </div>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8">
              <TabsTrigger value="badges" className="pixel-text text-xs">
                <Award className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">NFT Badges</span>
                <span className="sm:hidden">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="pixel-text text-xs">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Statistics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="pixel-text text-xs">
                <Trophy className="w-3.5 h-3.5 mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Match History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
            </TabsList>

            {/* NFT Badges Tab */}
            {/* Backend: GET /api/user/nft-badges */}
            <TabsContent value="badges">
              <Card className="p-4 md:p-6">
                <h2 className="pixel-text text-base md:text-lg mb-4 md:mb-6">NFT Badge Collection</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {updatedNFTBadges.map((badge) => (
                    <div key={badge.id} className="text-center">
                      <div className="mx-auto mb-2 md:mb-3">
                        <PixelNFTBadge
                          tier={badge.tier}
                          locked={badge.locked}
                          size={100}
                        />
                      </div>
                      <h3 className="pixel-text text-xs md:text-sm mb-1">{badge.name}</h3>
                      {badge.locked ? (
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" />
                          <span>{badge.requiredXP} XP</span>
                        </div>
                      ) : (
                        <Badge className="pixel-text text-xs bg-green-600 text-white border-0">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            {/* Backend: GET /api/user/stats */}
            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="pixel-text text-sm md:text-base">Game Stats</h3>
                      <p className="text-xs text-muted-foreground">Overall Performance</p>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">Games Played</span>
                      <span className="pixel-text text-sm md:text-base">{gamesPlayed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">Games Won</span>
                      <span className="pixel-text text-sm md:text-base text-green-500">{gamesWon}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">Win Rate</span>
                      <span className="pixel-text text-sm md:text-base text-accent">{winRate}%</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 bg-gradient-to-br from-secondary/5 to-transparent">
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/15 flex items-center justify-center">
                      <Coins className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="pixel-text text-sm md:text-base">Earnings</h3>
                      <p className="text-xs text-muted-foreground">Total ARK Earned</p>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">Current Balance</span>
                      <span className="pixel-text text-sm md:text-base text-primary">{arkBalance}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-muted-foreground">Total Earned</span>
                      <span className="pixel-text text-sm md:text-base text-accent">{totalEarned}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Match History Tab */}
            {/* Backend: GET /api/user/match-history */}
            <TabsContent value="history">
              <Card className="p-4 md:p-6">
                <h2 className="pixel-text text-base md:text-lg mb-4 md:mb-6">Recent Matches</h2>
                
                {recentGames.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-2">No match history yet</p>
                    <p className="text-xs text-muted-foreground/70">
                      Play games to see your match history here
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-4">
                      Backend: GET /api/user/match-history
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3 max-h-[500px] overflow-y-auto">
                    {recentGames.map((game, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                          <div>
                            <h3 className="pixel-text text-xs md:text-sm">{game.game}</h3>
                            <p className="text-xs text-muted-foreground">{new Date(game.date).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`pixel-text text-xs mb-1 ${
                              game.result === "Win"
                                ? "bg-green-600 text-white"
                                : game.result === "Loss"
                                ? "bg-red-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {game.result}
                          </Badge>
                          <p className="text-xs text-accent">{game.arkEarned >= 0 ? "+" : ""}{game.arkEarned} ARK</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
