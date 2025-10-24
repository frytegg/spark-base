/**
 * SPARK - Home Page
 * Landing page with hero section, user stats, and game selection
 * 
 * DEVELOPER INTEGRATION NOTES:
 * ============================================================================
 * DATA REQUIRED FROM BACKEND:
 * 
 * 1. User Stats (from WalletContext + Backend):
 *    - {{user_ark_balance}}: ARK token balance from blockchain
 *    - {{user_xp}}: Experience points from backend/contract
 *    - {{user_tier}}: Calculated tier (Bronze/Silver/Gold/Diamond)
 *    - {{unlocked_nfts_count}}: Number of unlocked NFT badges
 * 
 * 2. Games List (from config/gameData.ts):
 *    - Games are static (Chess & Tic-Tac-Toe)
 *    - {{active_players_count}}: Real-time count per game from backend
 * 
 * 3. XP Progress:
 *    - Calculate progress bar to next tier
 *    - Show current XP / next tier threshold
 * ============================================================================
 */

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Coins, Trophy, Zap, Award, Sparkles, Gift, Play } from "lucide-react";
import { getTierFromXP } from "../types";
import { GAMES } from "../config/gameData";
import { GameCard } from "../components/GameCard";
import { useWallet } from "../context/WalletContext";
import { toast } from "sonner@2.0.3";

interface HomePageProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  // Get user data from wallet context
  // Backend: These values should be fetched from blockchain and backend API
  const { arkBalance, xp, claimTestTokens, isConnected } = useWallet();
  const currentTier = getTierFromXP(xp);
  
  // Calculate unlocked NFTs based on XP
  // Backend: Fetch actual unlocked badges from user profile
  const nftBadgesData = [
    { requiredXP: 0, locked: false },
    { requiredXP: 500, locked: xp < 500 },
    { requiredXP: 1000, locked: xp < 1000 },
    { requiredXP: 2000, locked: xp < 2000 },
  ];
  const unlockedNFTs = nftBadgesData.filter(nft => !nft.locked).length;
  
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

  const scrollToGames = () => {
    const gamesSection = document.getElementById('games-section');
    if (gamesSection) {
      gamesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClaimTokens = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first!");
      return;
    }
    claimTestTokens();
    toast.success("Successfully claimed 50 test ARK tokens!");
  };

  return (
    <div className="min-h-screen">
      {/* Background Gradient */}
      <div className="absolute inset-x-0 top-0 h-[700px] md:h-[800px] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_50%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 px-4 md:px-5 py-1.5 text-xs">
              <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5 mr-1.5 md:mr-2" />
              OnChain Gaming Revolution
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-transparent leading-tight px-4">
              Play Together. Earn ARK. Collect NFTs.
            </h1>
            
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Join the ultimate mini-games hub where skill meets rewards. Compete, win, and build your legendary NFT collection.
            </p>

            <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap px-4">
              <Button
                onClick={scrollToGames}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 pixel-text text-xs h-11 md:h-12 px-6 md:px-8 w-full sm:w-auto"
              >
                <Play className="w-3.5 md:w-4 h-3.5 md:h-4 mr-2" />
                Play Now
              </Button>
              <Button
                onClick={handleClaimTokens}
                variant="outline"
                className="border-2 border-accent/50 hover:bg-accent/10 pixel-text text-xs h-11 md:h-12 px-6 md:px-8 w-full sm:w-auto"
              >
                <Gift className="w-3.5 md:w-4 h-3.5 md:h-4 mr-2" />
                Claim Test Token
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* User Stats Preview */}
      {/* Backend: Fetch these values from user profile API */}
      <section className="py-8 md:py-16 container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-6xl mx-auto">
          {/* ARK Balance - {{user_ark_balance}} */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
            <div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Coins className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <div className="text-xs text-muted-foreground mb-1">ARK Balance</div>
                <div className="text-lg md:text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {arkBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </Card>

          {/* NFT Badges - {{unlocked_nfts_count}} */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-secondary/5 to-transparent border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-lg hover:shadow-secondary/10">
            <div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/15 flex items-center justify-center">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
              </div>
              <div className="text-center md:text-left">
                <div className="text-xs text-muted-foreground mb-1">NFT Badges</div>
                <div className="text-lg md:text-xl bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  {unlockedNFTs}/4
                </div>
              </div>
            </div>
          </Card>

          {/* XP - {{user_xp}} */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-accent/5 to-transparent border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg hover:shadow-accent/10">
            <div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              </div>
              <div className="text-center md:text-left">
                <div className="text-xs text-muted-foreground mb-1">XP</div>
                <div className="text-lg md:text-xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  {xp}
                </div>
              </div>
            </div>
          </Card>

          {/* Tier - {{user_tier}} */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              </div>
              <div className="text-center md:text-left">
                <div className="text-xs text-muted-foreground mb-1">Tier</div>
                <div className="text-lg md:text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {currentTier}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tier Progress Bar */}
        {/* Backend: Calculate based on {{user_xp}} and tier thresholds */}
        <Card className="mt-6 md:mt-8 p-4 md:p-6 max-w-6xl mx-auto bg-card/30 backdrop-blur-sm border-border/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs text-muted-foreground pixel-text">
              {xp >= 2000 ? "Max Tier Reached!" : `Progress to ${nextTierXP === 500 ? "Silver" : nextTierXP === 1000 ? "Gold" : "Diamond"} Tier`}
            </span>
            <span className="text-xs text-primary pixel-text">{xp} / {nextTierXP} XP</span>
          </div>
          <Progress value={progressToNextTier} className="h-2 md:h-2.5" />
        </Card>
      </section>

      {/* Featured Games */}
      {/* Backend: Update player counts with real-time data */}
      <section id="games-section" className="py-8 md:py-16 container mx-auto px-4 md:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl pixel-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 md:mb-3">
              Choose Your Game
            </h2>
            <p className="text-sm md:text-base text-muted-foreground/70">Select a game and start your journey to glory</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            {GAMES.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPlay={() => onNavigate("lobby", { game })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 border-t border-border/50 mt-8 md:mt-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-xs md:text-sm text-muted-foreground">
            © 2025 Spark - OnChain Mini-Games Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
