/**
 * SPARK - Main Application
 * OnChain Mini-Games Hub
 * 
 * DEVELOPER INTEGRATION CHECKLIST:
 * ================================
 * □ Connect Web3 wallet (MetaMask, WalletConnect)
 * □ Integrate smart contracts for ARK token
 * □ Setup backend API endpoints (see page components for details)
 * □ Implement WebSocket for real-time matchmaking and gameplay
 * □ Add database for user profiles and match history
 * □ Configure blockchain network (testnet/mainnet)
 * □ Setup NFT minting for achievement badges
 * □ Implement proper authentication and security
 */

import { useState } from "react";
import { Header } from "./components/Header";
import { NetworkBanner } from "./components/NetworkBanner";
import { HomePage } from "./pages/HomePage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { ProfilePage } from "./pages/ProfilePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { Toaster } from "./components/ui/sonner";
import { WalletProvider } from "./context/WalletContext";
import { Game, Screen, NavigationData } from "./types";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");
  const [navData, setNavData] = useState<NavigationData>({});

  const handleNavigate = (screen: string, data?: any) => {
    setCurrentScreen(screen as Screen);
    if (data) {
      setNavData((prev) => ({ ...prev, ...data }));
    }
  };

  return (
    <WalletProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header onNavigate={handleNavigate} currentScreen={currentScreen} />
        
        {/* Network validation banner */}
        <div className="container mx-auto px-4 pt-4">
          <NetworkBanner />
        </div>

        <main>
          {currentScreen === "landing" && <HomePage onNavigate={handleNavigate} />}
          
          {currentScreen === "lobby" && navData.game && (
            <LobbyPage game={navData.game} onNavigate={handleNavigate} />
          )}
          
          {currentScreen === "gameplay" && navData.game && (
            <GamePage
              game={navData.game}
              stakeAmount={navData.stakeAmount || 0}
              playMode={navData.playMode || "free"}
              onNavigate={handleNavigate}
              opponentType={navData.opponentType}
              matchId={navData.matchId}
              escrowId={navData.escrowId}
              opponentWallet={navData.opponentWallet}
              role={navData.role}
            />
          )}
          
          {currentScreen === "profile" && <ProfilePage onNavigate={handleNavigate} />}
          
          {currentScreen === "leaderboard" && <LeaderboardPage onNavigate={handleNavigate} />}
        </main>

        <Toaster />
      </div>
    </WalletProvider>
  );
}
