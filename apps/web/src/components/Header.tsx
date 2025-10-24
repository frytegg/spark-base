import { useState } from "react";
import { Wallet, Coins, Trophy, CheckCircle2, Gift, LogOut, Menu, Home, User, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useWallet } from "../context/WalletContext";
import { toast } from "sonner@2.0.3";

interface HeaderProps {
  onNavigate: (screen: string) => void;
  currentScreen: string;
}

export function Header({ onNavigate, currentScreen }: HeaderProps) {
  const { isConnected, walletAddress, arkBalance, connectWallet, disconnectWallet, claimTestTokens } = useWallet();
  const [showConnectedDialog, setShowConnectedDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}……${address.slice(-3)}`;
  };

  const handleConnectWallet = () => {
    connectWallet();
    setShowConnectedDialog(true);
    setTimeout(() => setShowConnectedDialog(false), 2000);
  };

  const handleClaimTokens = () => {
    claimTestTokens();
    toast.success("Successfully claimed 50 test ARK tokens!");
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDisconnectDialog(false);
    toast.success("Wallet disconnected");
    onNavigate("landing");
  };

  const handleProfileClick = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first!");
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
                          className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 pixel-text text-xs"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Claim 50 Test ARK
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
                        className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 pixel-text text-xs"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Claim 50 Test ARK
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
              
              {isConnected ? (
                <Button 
                  onClick={() => setShowDisconnectDialog(true)}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-600/90 hover:to-green-500/90 pixel-text text-xs h-9 md:h-10 px-3 md:px-4"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">{formatWalletAddress(walletAddress)}</span>
                  <span className="sm:hidden">{walletAddress.slice(0, 4)}...{walletAddress.slice(-2)}</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleConnectWallet}
                  className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 pixel-text text-xs h-9 md:h-10 px-2.5 md:px-4"
                >
                  <Wallet className="w-3 h-3 mr-1 md:mr-2" />
                  CONNECT
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>

      {/* Connected Wallet Dialog */}
      <Dialog open={showConnectedDialog} onOpenChange={setShowConnectedDialog}>
        <DialogContent className="border border-green-500/30 bg-card/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex flex-col items-center gap-5 py-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="pixel-text text-sm text-green-500 mb-2">
                    Wallet Connected!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    You're all set to start playing
                  </p>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Disconnect Wallet Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent className="border border-primary/30 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text">
              Disconnect Wallet?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your wallet? You'll need to reconnect to play games and access your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="pixel-text text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisconnect}
              className="bg-destructive hover:bg-destructive/90 pixel-text text-xs"
            >
              <LogOut className="w-3 h-3 mr-2" />
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
