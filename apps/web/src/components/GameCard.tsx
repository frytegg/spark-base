import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Coins, Users, Trophy } from "lucide-react";
import { Game } from "../types";
import { useWallet } from "../context/WalletContext";
import { toast } from "sonner@2.0.3";
import {
  ChessIllustration,
  TicTacToeIllustration,
  ConnectFourIllustration,
  RockPaperScissorsIllustration,
  PuzzleIllustration,
  TriviaIllustration,
  SpeedMatchIllustration,
  MemoryCardsIllustration,
} from "./ArcadeIllustrations";

interface GameCardProps {
  game: Game;
  onPlay: () => void;
}

const illustrationMap = {
  chess: ChessIllustration,
  tictactoe: TicTacToeIllustration,
  connectfour: ConnectFourIllustration,
  rockpaperscissors: RockPaperScissorsIllustration,
  puzzle: PuzzleIllustration,
  trivia: TriviaIllustration,
  speed: SpeedMatchIllustration,
  memory: MemoryCardsIllustration,
};

export function GameCard({ game, onPlay }: GameCardProps) {
  const Illustration = illustrationMap[game.illustration];
  const { isConnected } = useWallet();

  const handlePlay = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first!");
      return;
    }
    onPlay();
  };

  return (
    <Card className="overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/15 hover:border-primary/50 transition-all duration-300 group cursor-pointer">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="w-full h-full group-hover:scale-105 transition-transform duration-300">
          <Illustration />
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="mb-2 pixel-text text-sm">{game.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Users className="w-3 h-3" />
            <span>{game.players.toLocaleString()} playing</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground/70">
            <Trophy className="w-3 h-3" />
            <span className="truncate">{game.nftReward}</span>
          </div>
          <Badge variant="outline" className="text-xs pixel-text border-primary/30">
            {game.difficulty}
          </Badge>
        </div>

        <Button
          onClick={handlePlay}
          className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 pixel-text text-xs shadow-lg"
        >
          {">> PLAY <<"}
        </Button>
      </div>
    </Card>
  );
}
