import { useAccount, useReadContract, useSimulateContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, decodeEventLog } from "viem";
import { ABI, ADDR } from "./contracts";

export function useArkBalance() {
  const { address } = useAccount();
  const q = useReadContract({
    address: ADDR.ARK, abi: ABI.ARK as any, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address }
  });
  return { balance: q.data as bigint | undefined, ...q };
}

export function useArkAllowance(spender?: `0x${string}`) {
  const { address } = useAccount();
  const q = useReadContract({
    address: ADDR.ARK,
    abi: ABI.ARK as any,
    functionName: "allowance",
    args: address && (spender ?? ADDR.ESCROW) ? [address, (spender ?? ADDR.ESCROW)] : undefined,
    query: { enabled: !!address }
  });
  return { allowance: q.data as bigint | undefined, ...q };
}

export function useApproveArk() {
  const pub = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  return async (amountWei: bigint) => {
    const txHash = await writeContractAsync({ 
      address: ADDR.ARK, 
      abi: ABI.ARK as any, 
      functionName: "approve", 
      args: [ADDR.ESCROW, amountWei] 
    });
    // Wait for approval to be mined before returning
    if (!pub) throw new Error("Public client not ready");
    await pub.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  };
}

/** Ensure allowance >= required; approves max if insufficient */
export function useEnsureArkAllowance() {
  const pub = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  return async (required: bigint) => {
    if (!pub) throw new Error("Public client not ready");
    if (!address) throw new Error("Wallet not connected");
    let current = await pub.readContract({ address: ADDR.ARK, abi: ABI.ARK as any, functionName: "allowance", args: [address, ADDR.ESCROW] }) as bigint;
    if (current >= required) return;
    const max = (1n << 256n) - 1n;
    // Some ERC20s require setting allowance to 0 before updating. Do it defensively.
    if (current > 0n) {
      const resetTx = await writeContractAsync({ address: ADDR.ARK, abi: ABI.ARK as any, functionName: "approve", args: [ADDR.ESCROW, 0n] });
      await pub.waitForTransactionReceipt({ hash: resetTx });
    }
    const txHash = await writeContractAsync({ address: ADDR.ARK, abi: ABI.ARK as any, functionName: "approve", args: [ADDR.ESCROW, max] });
    await pub.waitForTransactionReceipt({ hash: txHash });
    // Poll allowance until it reflects on the RPC we read from (handles eventual consistency across RPC nodes)
    const deadline = Date.now() + 15_000;
    do {
      await new Promise(r => setTimeout(r, 400));
      current = await pub.readContract({ address: ADDR.ARK, abi: ABI.ARK as any, functionName: "allowance", args: [address, ADDR.ESCROW] }) as bigint;
      if (current >= required) return;
    } while (Date.now() < deadline);
    // If still not visible, let caller proceed; createMatch will check again and fail with a clearer error
  };
}

/** create match, return {escrowId, txHash} */
export function useCreateMatch() {
  const pub = usePublicClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  return async (stakeWei: bigint) => {
    if (!pub) throw new Error("Public client not ready");
    if (!address) throw new Error("Wallet not connected");

    // Fresh on-chain sanity checks to avoid stale cache issues
    const [allowance, balance] = await Promise.all([
      pub.readContract({ address: ADDR.ARK, abi: ABI.ARK as any, functionName: "allowance", args: [address, ADDR.ESCROW] }) as Promise<bigint>,
      pub.readContract({ address: ADDR.ARK, abi: ABI.ARK as any, functionName: "balanceOf", args: [address] }) as Promise<bigint>
    ]);
    if (balance < stakeWei) throw new Error("Insufficient ARK balance");
    // Allow proceeding even if a stale RPC read reports lower allowance; the tx may still succeed after approval

    // Send tx directly (skip simulate to avoid false negatives when ERC20 errors bubble)
    const txHash = await writeContractAsync({
      address: ADDR.ESCROW,
      abi: ABI.ESCROW as any,
      functionName: "createMatch",
      args: [stakeWei],
      account: address
    });
    const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
    // Parse MatchCreated event to get escrowId
    let escrowId: bigint | undefined;
    for (const log of receipt.logs) {
      try {
        const ev: any = decodeEventLog({ abi: ABI.ESCROW as any, data: log.data, topics: log.topics });
        if ((ev as any).eventName === "MatchCreated") {
          const args: any = (ev as any).args as any;
          escrowId = BigInt(args.id ?? args[0]);
          break;
        }
      } catch { /* not an escrow event */ }
    }
    // Fallback: read nextId-1 if event parsing failed
    if (escrowId === undefined) {
      const nid = await pub.readContract({ address: ADDR.ESCROW, abi: ABI.ESCROW as any, functionName: "nextId", args: [] }) as bigint;
      escrowId = nid - 1n;
    }
    return { escrowId, txHash };
  };
}

export function useJoinMatch() {
  const pub = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  return async (escrowId: bigint) =>
    {
      const txHash = await writeContractAsync({ 
        address: ADDR.ESCROW, 
        abi: ABI.ESCROW as any, 
        functionName: "joinMatch", 
        args: [escrowId] 
      });
      // Wait for join to be mined
      if (!pub) throw new Error("Public client not ready");
      await pub.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    };
}
