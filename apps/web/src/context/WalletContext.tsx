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

import { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  walletAddress: string; // {{user_wallet_address}}
  
  // User data
  arkBalance: number; // {{user_ark_balance}} - Fetch from blockchain
  xp: number; // {{user_xp_points}} - Fetch from backend/contract
  nickname: string; // {{user_nickname}} - Fetch from backend
  
  // Actions
  connectWallet: () => void; // TODO: Replace with Web3 wallet connection
  disconnectWallet: () => void;
  claimTestTokens: () => void; // TODO: Call smart contract method
  addXP: (amount: number) => void; // TODO: Update backend and blockchain
  setNickname: (name: string) => void; // TODO: Save to backend
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // MOCK STATE - Replace with real Web3 state
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [arkBalance, setArkBalance] = useState(0);
  const [xp, setXP] = useState(0);
  const [nickname, setNicknameState] = useState("Player");

  /**
   * Connect wallet
   * TODO: Replace with actual Web3 wallet connection
   * Example with ethers.js:
   * ```
   * const provider = new ethers.providers.Web3Provider(window.ethereum);
   * const accounts = await provider.send("eth_requestAccounts", []);
   * setWalletAddress(accounts[0]);
   * ```
   */
  const connectWallet = () => {
    // MOCK: Generate fake wallet address
    setIsConnected(true);
    setWalletAddress("0x7ef8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8");
    
    // TODO: After real wallet connection:
    // 1. Fetch ARK balance from blockchain
    // 2. Fetch user XP from backend/contract
    // 3. Fetch user profile (nickname, avatar) from backend
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress("");
    setArkBalance(0);
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
   * Claim test tokens
   * TODO: Call smart contract faucet method
   * Example:
   * ```
   * const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
   * await contract.claimTestTokens();
   * ```
   */
  const claimTestTokens = () => {
    // MOCK: Add 50 tokens locally
    setArkBalance((prev) => prev + 50);
    
    // TODO: Call actual smart contract or backend endpoint
  };

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
        walletAddress,
        arkBalance,
        xp,
        nickname,
        connectWallet,
        disconnectWallet,
        claimTestTokens,
        addXP,
        setNickname,
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
