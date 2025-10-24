import { useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "../lib/chain";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function NetworkBanner() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // Check if user is on correct chain
  const isCorrectChain = chainId === baseSepolia.id;

  if (isCorrectChain) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-yellow-500 bg-yellow-500/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="pixel-text">Wrong Network</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          Please switch to {baseSepolia.name} (Chain ID: {baseSepolia.id})
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => switchChain({ chainId: baseSepolia.id })}
          disabled={isPending}
          className="ml-4 pixel-text text-xs"
        >
          {isPending ? "Switching..." : "Switch Network"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
