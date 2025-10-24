import { authedFetch } from "./auth";
/**
 * Faucet utility functions
 * Handles claiming test tokens from the backend faucet
 */

export interface FaucetClaimResponse {
  success: boolean;
  txHash?: string;
  reason?: string;
  message?: string;
}

/**
 * Claim test tokens from the faucet
 * 
 * @param walletAddress - The wallet address to send tokens to
 * @returns Promise with claim result containing success status, txHash, or error reason
 */
export async function claimFaucet(walletAddress: string): Promise<FaucetClaimResponse> {
  try {
    const response = await authedFetch(`/api/faucet/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ walletAddress })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        reason: data.reason || data.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return data;
  } catch (error) {
    console.error("Faucet claim error:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Failed to connect to faucet service"
    };
  }
}
