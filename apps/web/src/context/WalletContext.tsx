/**
 * SPARK - Wallet Context
 * Manages wallet connection and user state
 * 
 * DEVELOPER INTEGRATION NOTES:
 * ============================================================================
 * This is a MOCK implementation for UI demonstration.
 * Replace with actual Web3 wallet integration:
 * 
 * REQUIRED INTEGRATIONS:
 * 1. Web3 Wallet Connection (e.g., MetaMask, WalletConnect)
 *    - Install: ethers.js or web3.js or wagmi
 *    - Connect to user's wallet
 *    - Listen to account/network changes
 * 
 * 2. Smart Contract Integration:
 *    - ARK token balance: Read from ERC-20 contract
 *    - XP points: Read from game contract
 *    - Test token claim: Call contract method (if applicable)
 * 
 * 3. Backend API Integration:
 *    - Fetch user profile data (nickname, stats)
 *    - Sync XP and achievements
 *    - Store game results
 * 
 * PLACEHOLDER DATA PATTERNS:
 * - walletAddress: {{user_wallet_address}}
 * - arkBalance: {{user_ark_balance}}
 * - xp: {{user_xp_points}}
 * - nickname: {{user_nickname}}
 * ============================================================================
 */

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { useArkBalance } from "../lib/hooks";
import { formatUnits } from "viem";
import { claimFaucet } from "../lib/faucet";
import { ABI, ADDR } from "../lib/contracts";

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  walletAddress: string; // {{user_wallet_address}}
  
  // User data
  arkBalance: number; // {{user_ark_balance}} - Fetch from blockchain
  xp: number; // {{user_xp_points}} - Fetch from backend/contract
  nickname: string; // {{user_nickname}} - Fetch from backend
  
  // Faucet state
  isFaucetLoading: boolean;
  faucetError: string | null;
  
  // Actions
  connectWallet: () => void; // TODO: Replace with Web3 wallet connection
  disconnectWallet: () => void;
  claimTestTokens: () => Promise<void>; // Calls backend faucet API
  addXP: (amount: number) => void; // TODO: Update backend and blockchain
  setNickname: (name: string) => void; // TODO: Save to backend
  refreshArkBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // Real Web3 state via wagmi
  const { address, isConnected } = useAccount();
  const { balance: arkBalanceRaw, refetch: refetchBalance } = useArkBalance();
  
  // MOCK STATE - Replace with real backend data
  const [xp, setXP] = useState(0);
  const [nickname, setNicknameState] = useState("Player");
  
  // Faucet state
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  
  // Convert ARK balance from bigint (wei) to number with 2 decimals
  const arkBalance = arkBalanceRaw 
    ? Math.floor(Number(formatUnits(arkBalanceRaw, 18)) * 100) / 100
    : 0;

  /**
   * Fetch user profile from backend when wallet connects
   */
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!address) {
        // Reset profile data when disconnected
        setXP(0);
        setNicknameState("Player");
        return;
      }

      const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";
      
      try {
        const response = await fetch(`${API}/api/user/profile?wallet=${address}`);
        
        if (response.ok) {
          const profile = await response.json();
          
          // Update state with profile data
          if (profile.xp !== undefined) {
            setXP(profile.xp);
          }
          if (profile.nickname) {
            setNicknameState(profile.nickname);
          }
          
          console.log("User profile loaded:", profile);
        } else {
          console.log("No profile found for user, using defaults");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Keep default values on error
      }
    };

    fetchUserProfile();
  }, [address]);

  /**
   * Connect wallet
   * Now handled by wagmi hooks - wallet connection happens via injected connector
   * This function is kept for backward compatibility but wagmi handles the actual connection
   */
  const connectWallet = () => {
    // Connection is now handled by wagmi's useConnect hook
    // Components should use wagmi's connect functionality directly
    console.log("Use wagmi's useConnect hook for wallet connection");
    
    // TODO: After real wallet connection:
    // 1. ARK balance - now fetched via useArkBalance() hook ✓
    // 2. Fetch user XP from backend/contract
    // 3. Fetch user profile (nickname, avatar) from backend
  };

  /**
   * Disconnect wallet
   * Now handled by wagmi hooks
   */
  const disconnectWallet = () => {
    // Disconnection is now handled by wagmi's useDisconnect hook
    // Reset local state only
    setXP(0);
    setNicknameState("Player");
  };

  /**
   * Set user nickname
   * TODO: Save to backend database
   */
  const setNickname = (name: string) => {
    setNicknameState(name || "Player");
    // TODO: POST to /api/user/profile with { nickname: name }
  };

  /**
   * Claim test tokens from faucet
   * Calls backend API to mint tokens to user's wallet
   */
  const claimTestTokens = async () => {
    if (!address) {
      console.error("No wallet connected");
      setFaucetError("Please connect your wallet first");
      return;
    }

    setIsFaucetLoading(true);
    setFaucetError(null);

    try {
      const result = await claimFaucet(address);

      if (result.success) {
        console.log("Faucet claim successful:", result.txHash);
        // Wait a bit for the transaction to be mined, then refetch balance
        setTimeout(() => {
          refetchBalance();
        }, 2000);
      } else {
        console.error("Faucet claim failed:", result.reason);
        setFaucetError(result.reason || "Failed to claim tokens");
      }
    } catch (error) {
      console.error("Error claiming faucet:", error);
      setFaucetError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsFaucetLoading(false);
    }
  };

  /** Manually refresh ARK balance from chain */
  const refreshArkBalance = async () => {
    try { await refetchBalance(); } catch (e) { console.warn("Refetch ARK failed", e); }
  };

  // Auto-refresh ARK balance on Transfer events involving the user
  useWatchContractEvent({
    address: ADDR.ARK,
    abi: ABI.ARK as any,
    eventName: "Transfer",
    // when user receives tokens
    args: address ? { to: address } as any : undefined,
    enabled: !!address,
    onLogs: () => { void refetchBalance(); }
  });
  useWatchContractEvent({
    address: ADDR.ARK,
    abi: ABI.ARK as any,
    eventName: "Transfer",
    // when user sends tokens
    args: address ? { from: address } as any : undefined,
    enabled: !!address,
    onLogs: () => { void refetchBalance(); }
  });

  /**
   * Add XP to user
   * TODO: Update backend and/or blockchain
   */
  const addXP = (amount: number) => {
    setXP((prev) => Math.max(0, prev + amount));
    
    // TODO: POST to /api/user/xp with { xpChange: amount }
    // Backend should calculate new tier and unlock NFT badges
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress: address || "",
        arkBalance,
        xp,
        nickname,
        isFaucetLoading,
        faucetError,
        connectWallet,
        disconnectWallet,
        claimTestTokens,
        addXP,
        setNickname,
        refreshArkBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
