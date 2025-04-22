// src/hooks/useAccountSwitcher.js
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../constants/contract";

export default function useAccountSwitcher() {
  const [signer, setSigner] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [error, setError] = useState(null);

  const connectWithPrivateKey = (privKey, provider) => {
    try {
      const wallet = new ethers.Wallet(privKey, provider);
      setSigner(wallet);
      setCurrentAccount(wallet.address);
      console.log("Connected to contract at:", CONTRACT_ADDRESS);
    } catch (err) {
      console.error("Error connecting with private key:", err);
      setError("Failed to connect with private key");
    }
  };

  return {
    currentAccount,
    signer,
    error,
    connectWithPrivateKey,
  };
}
