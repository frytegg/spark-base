import { encodeFunctionData, parseUnits } from "viem";
import { ABI, ADDR } from "./contracts";
import { tryBatch } from "./batch";

/**
 * Stake ARK tokens and join matchmaking queue
 * 
 * This function handles the complete flow for staking:
 * 1. Attempts to batch approve + createMatch (if wallet supports it)
 * 2. Falls back to sequential approve -> createMatch
 * 3. Sends WebSocket join message with escrowId
 * 
 * @param stakeStr - Stake amount as string (e.g., "50")
 * @param p1Wallet - Player 1 wallet address
 * @param ws - WebSocket connection to matchmaking server
 * @param approveArk - Hook function for approving ARK tokens
 * @param createMatch - Hook function for creating match on escrow
 * @returns Promise with escrowId
 */
export async function stakeAndQueue(
  stakeStr: string,
  p1Wallet: `0x${string}`,
  ws: WebSocket,
  approveArk: (amountWei: bigint) => Promise<any>,
  createMatch: (stakeWei: bigint) => Promise<{ escrowId: bigint; txHash: `0x${string}` }>
) {
  const stakeWei = parseUnits(stakeStr, 18);

  // Try batch approve + createMatch
  const calls = [
    { 
      to: ADDR.ARK, 
      data: encodeFunctionData({ 
        abi: ABI.ARK as any, 
        functionName: "approve", 
        args: [ADDR.ESCROW, stakeWei] 
      }) as `0x${string}` 
    },
    { 
      to: ADDR.ESCROW, 
      data: encodeFunctionData({ 
        abi: ABI.ESCROW as any, 
        functionName: "createMatch", 
        args: [stakeWei] 
      }) as `0x${string}` 
    }
  ];
  
  const batched = await tryBatch(calls);

  let escrowId: bigint;
  
  if (batched.ok) {
    // NOTE: Batch transaction sent successfully
    // However, we need to get the escrowId that was created
    // TODO: Implement reliable nextId-1 read client-side
    // For now, throw error to force sequential path
    throw new Error(
      "Batch sent, but escrowId retrieval not implemented. " +
      "Need to compute escrowId as nextId-1 via a public read on ESCROW. " +
      "Using sequential fallback instead."
    );
  } else {
    // Sequential fallback - this is the reliable path for hackathon
    console.log("Using sequential approve + createMatch");
    
    // Step 1: Approve ARK tokens for escrow contract
    await approveArk(stakeWei);
    
    // Step 2: Create match and get escrowId
    const result = await createMatch(stakeWei);
    escrowId = result.escrowId;
  }

  // Send WebSocket join message with escrowId
  const joinMessage = {
    action: "join",
    wallet: p1Wallet,
    gameId: "tictactoe",
    playMode: "stake",
    stakeAmount: Number(stakeStr),
    playerXP: 0, // TODO: Get actual player XP
    escrowId: escrowId.toString()
  };
  
  console.log("Sending join message to matchmaking:", joinMessage);
  ws.send(JSON.stringify(joinMessage));

  return { escrowId };
}
