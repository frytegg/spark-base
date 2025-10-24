import { useState } from "react";
import { Coins, Trophy, Gift, Menu, Home, User, X } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useWallet } from "../context/WalletContext";
import { ConnectButton } from "./ConnectButton";

interface HeaderProps {
  onNavigate: (screen: string) => void;
  currentScreen: string;
}

export function Header({ onNavigate, currentScreen }: HeaderProps) {
  const { isConnected, arkBalance, claimTestTokens, isFaucetLoading } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleClaimTokens = async () => {
    await claimTestTokens();
    console.log("Test tokens claimed");
  };

  const handleProfileClick = () => {
    if (!isConnected) {
      console.error("Please connect your wallet first!");
      return;
    }
    setMobileMenuOpen(false);
    onNavigate("profile");
  };

  const handleNavigation = (screen: string) => {
    setMobileMenuOpen(false);
    onNavigate(screen);
  };

  return (
    <>
      <div className="sticky top-0 z-50 w-full px-2 md:px-4 pt-4">
        <header className="max-w-7xl mx-auto rounded-2xl border border-border/50 backdrop-blur-xl bg-background/70 shadow-xl shadow-primary/5">
          <div className="px-3 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-2">
            {/* Mobile Menu - Left Side */}
            <div className="flex items-center gap-1 md:gap-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 border-border/50 bg-background/95 backdrop-blur-xl [&>button]:hidden">
                  <div className="flex items-center gap-3 pt-2 pb-4 px-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <h2 className="pixel-text text-lg">Menu</h2>
                  </div>
                  <div className="flex flex-col gap-4 mt-4">
                    <Button
                      variant={currentScreen === "landing" ? "default" : "ghost"}
                      onClick={() => handleNavigation("landing")}
                      className={`justify-start pixel-text text-xs h-12 ${currentScreen === "landing" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
                    >
                      <Home className="w-4 h-4 mr-3" />
                      HOME
                    </Button>
                    <Button
                      variant={currentScreen === "profile" ? "default" : "ghost"}
                      onClick={handleProfileClick}
                      className={`justify-start pixel-text text-xs h-12 ${currentScreen === "profile" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
                    >
                      <User className="w-4 h-4 mr-3" />
                      PROFILE
                    </Button>
                    <Button
                      variant={currentScreen === "leaderboard" ? "default" : "ghost"}
                      onClick={() => handleNavigation("leaderboard")}
                      className={`justify-start pixel-text text-xs h-12 ${currentScreen === "leaderboard" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
                    >
                      <Trophy className="w-4 h-4 mr-3" />
                      LEADERBOARD
                    </Button>

                    {/* ARK Balance for Mobile */}
                    {isConnected && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-lg border border-primary/30 bg-primary/10">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-accent" />
                            <span className="pixel-text text-xs text-accent">
                              {arkBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            handleClaimTokens();
                            setMobileMenuOpen(false);
                          }}
                          disabled={isFaucetLoading}
                          className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 pixel-text text-xs"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          {isFaucetLoading ? "Claiming..." : "Claim 10 Test ARK"}
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <div
                onClick={() => onNavigate("landing")}
                className="flex items-center gap-1.5 md:gap-4 cursor-pointer group"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-10 md:h-10">
                    {/* X symbol (cross) */}
                    <rect x="3" y="3" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="8" y="8" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="13" y="13" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="8" y="18" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="3" y="23" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="18" y="3" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="13" y="8" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="18" y="18" width="5" height="5" fill="hsl(var(--primary))" />
                    <rect x="23" y="23" width="5" height="5" fill="hsl(var(--primary))" />
                    
                    {/* O symbol (square) */}
                    <rect x="28" y="15" width="9" height="9" fill="hsl(var(--secondary))" />
                    <rect x="30" y="17" width="5" height="5" fill="hsl(var(--background))" />
                  </svg>
                </div>
                <h1 className="text-base md:text-xl pixel-text bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  SPARK
                </h1>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={currentScreen === "landing" ? "default" : "ghost"}
                onClick={() => onNavigate("landing")}
                className={`pixel-text text-xs transition-all ${currentScreen === "landing" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
              >
                HOME
              </Button>
              <Button
                variant={currentScreen === "profile" ? "default" : "ghost"}
                onClick={handleProfileClick}
                className={`pixel-text text-xs transition-all ${currentScreen === "profile" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
              >
                PROFILE
              </Button>
              <Button
                variant={currentScreen === "leaderboard" ? "default" : "ghost"}
                onClick={() => onNavigate("leaderboard")}
                className={`pixel-text text-xs transition-all ${currentScreen === "leaderboard" ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
              >
                <Trophy className="w-3 h-3 mr-2" />
                LEADERBOARD
              </Button>
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              {isConnected ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/30 bg-primary/10 cursor-pointer hover:bg-primary/20 transition-all">
                      <Coins className="w-4 h-4 text-accent" />
                      <span className="pixel-text text-xs text-accent">
                        {arkBalance.toLocaleString()}
                      </span>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-6 border border-primary/30 bg-card/95 backdrop-blur-xl">
                    <div className="space-y-5">
                      <div className="text-center">
                        <p className="pixel-text text-xs mb-3 text-muted-foreground">ARK Balance</p>
                        <div className="text-4xl pixel-text text-accent mb-3">
                          {arkBalance}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Need more tokens for testing?
                        </p>
                      </div>
                      <Button
                        onClick={handleClaimTokens}
                        disabled={isFaucetLoading}
                        className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 pixel-text text-xs"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        {isFaucetLoading ? "Claiming..." : "Claim 10 Test ARK"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/30 bg-muted/20 opacity-40">
                  <Coins className="w-4 h-4 text-muted-foreground" />
                  <span className="pixel-text text-xs text-muted-foreground">
                    ---
                  </span>
                </div>
              )}
              
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>
    </div>
    </>
  );
}
