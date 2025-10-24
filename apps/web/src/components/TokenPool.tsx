import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArcadeTokenIllustration } from "./ArcadeIllustrations";
import { Card } from "./ui/card";

interface TokenPoolProps {
  yourStake: number;
  opponentStake: number;
  isSearching: boolean;
}

export function TokenPool({ yourStake, opponentStake, isSearching }: TokenPoolProps) {
  const [animatedYourStake, setAnimatedYourStake] = useState(0);
  const [animatedOpponentStake, setAnimatedOpponentStake] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedYourStake(yourStake);
    }, 300);
    return () => clearTimeout(timer);
  }, [yourStake]);

  useEffect(() => {
    if (isSearching && opponentStake > 0) {
      const timer = setTimeout(() => {
        setAnimatedOpponentStake(opponentStake);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSearching, opponentStake]);

  const totalPool = animatedYourStake + animatedOpponentStake;
  const yourPercentage = totalPool > 0 ? (animatedYourStake / totalPool) * 100 : 50;

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-muted/30 to-card border-2 border-primary/30 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 animate-pulse" />
      
      <div className="relative z-10">
        <div className="text-center mb-6">
          <h3 className="pixel-text text-sm mb-2 arcade-glow text-accent">TOKEN POOL</h3>
          <div className="text-4xl pixel-text mb-1 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {totalPool}
          </div>
          <div className="text-xs text-muted-foreground pixel-text">ARK TOKENS</div>
        </div>

        {/* Pool container */}
        <div className="relative">
          {/* Pool background - arcade style container */}
          <div className="w-full h-48 border-4 border-primary/50 bg-muted/30 relative overflow-hidden rounded-lg">
            {/* Liquid fill animation */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary via-secondary to-accent/50"
              initial={{ height: 0 }}
              animate={{ 
                height: `${(totalPool / (yourStake + opponentStake)) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Wave effect */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute w-full h-8 bg-gradient-to-b from-white to-transparent animate-pulse" />
              </div>
            </motion.div>

            {/* Floating tokens */}
            <div className="absolute inset-0 flex flex-wrap items-end justify-center gap-2 p-4">
              {Array.from({ length: Math.min(Math.floor(totalPool / 10), 15) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -100, opacity: 0, rotate: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    rotate: Math.random() * 360,
                  }}
                  transition={{ 
                    delay: i * 0.1,
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                >
                  <ArcadeTokenIllustration className="w-8 h-8" />
                </motion.div>
              ))}
            </div>

            {/* Pool level indicator */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
          </div>

          {/* Deposit indicators */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-primary/10 border-2 border-primary/30 rounded-lg">
              <div className="text-xs pixel-text text-muted-foreground mb-1">YOUR STAKE</div>
              <motion.div
                key={animatedYourStake}
                initial={{ scale: 1.5, color: "#8b5cf6" }}
                animate={{ scale: 1, color: "#06b6d4" }}
                className="text-2xl pixel-text arcade-glow"
              >
                {animatedYourStake}
              </motion.div>
            </div>
            
            <div className="text-center p-3 bg-secondary/10 border-2 border-secondary/30 rounded-lg">
              <div className="text-xs pixel-text text-muted-foreground mb-1">OPPONENT</div>
              <motion.div
                key={animatedOpponentStake}
                initial={{ scale: 1.5, color: "#ec4899" }}
                animate={{ scale: 1, color: "#06b6d4" }}
                className="text-2xl pixel-text arcade-glow"
              >
                {animatedOpponentStake > 0 ? animatedOpponentStake : "..."}
              </motion.div>
            </div>
          </div>

          {/* Winner takes percentage */}
          <div className="mt-4 p-3 bg-gradient-to-r from-accent/10 to-accent/5 border-2 border-accent/30 rounded-lg text-center">
            <div className="text-xs pixel-text text-muted-foreground mb-1">WINNER TAKES</div>
            <div className="text-xl pixel-text text-accent arcade-glow">
              {Math.round(totalPool * 0.9)} ARK
            </div>
            <div className="text-xs text-muted-foreground mt-1">(10% platform fee)</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
