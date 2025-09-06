import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "../../../artifacts/contracts/multiSigWallet.sol/multiSigWallet.json"; // adjust path if needed

export default function useMultiSig(signer, contractAddress) {
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  // Load contract with current signer
  useEffect(() => {
    if (signer && contractAddress) {
      try {
        const walletContract = new ethers.Contract(contractAddress, ABI.abi, signer);
        setContract(walletContract);
        setProvider(signer.provider);
      } catch (err) {
        console.error("Contract connection failed:", err);
        setError("Failed to connect contract");
      }
    }
  }, [signer, contractAddress]);

  // Transaction Actions
  const submitTransaction = async (to, value) => {
    try {
      const tx = await contract.submitTransaction(to, ethers.parseEther(value));
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("SubmitTransaction failed:", err);
      throw err;
    }
  };

  const confirmTransaction = async (txIndex) => {
    try {
      const tx = await contract.confirmTransaction(txIndex);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("ConfirmTransaction failed:", err);
      throw err;
    }
  };

  const revokeConfirmation = async (txIndex) => {
    try {
      const tx = await contract.revokeConfirmation(txIndex);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("RevokeConfirmation failed:", err);
      throw err;
    }
  };

  const executeTransaction = async (txIndex) => {
    try {
      const tx = await contract.executeTransaction(txIndex);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("ExecuteTransaction failed:", err);
      throw err;
    }
  };

  const depositEther = async (amount) => {
    try {
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("Deposit failed:", err);
      throw err;
    }
  };

  // Getters
  const getTransaction = async (txIndex) => {
    try {
      const tx = await contract.getTransaction(txIndex);
      return {
        to: tx[0],
        value: ethers.formatEther(tx[1]),
        executed: tx[2],
        numConfirmations: Number(tx[3]),
      };
    } catch (err) {
      console.error("GetTransaction failed:", err);
      setError("Failed to get transaction");
    }
  };

  const getTransactionCount = async () => {
    try {
      const count = await contract.getTransactionCount();
      return Number(count);
    } catch (err) {
      console.error("GetTransactionCount failed:", err);
      setError("Failed to get transaction count");
    }
  };

  const getOwners = async () => {
    try {
      const owners = await contract.getOwners();
      return owners;
    } catch (err) {
      console.error("GetOwners failed:", err);
      setError("Failed to get owners");
      return [];
    }
  };

  const getBalance = async () => {
    try {
      const balance = await contract.getBalance();
      return ethers.formatEther(balance);
    } catch (err) {
      console.error("GetBalance failed:", err);
      setError("Failed to get balance");
      return "0";
    }
  };

  const getOwnerBalance = async (ownerAddress) => {
    try {
      const balance = await provider.getBalance(ownerAddress);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error(`GetBalance for ${ownerAddress} failed:`, err);
      return "0";
    }
  };

  // Live Event Sync
  const listenToEvents = (callback) => {
    if (!contract) return;

    const eventNames = [
      "SubmitTransaction",
      "ConfirmTransaction",
      "ExecuteTransaction",
      "RevokeConfirmation",
      "Deposit",
    ];
    
    eventNames.forEach(eventName => contract.on(eventName, callback));

    return () => {
      eventNames.forEach(eventName => contract.off(eventName, callback));
    };
  };

  return {
    contract,
    error,
    submitTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    depositEther,
    getTransaction,
    getTransactionCount,
    getOwners,
    getBalance,
    getOwnerBalance,
    listenToEvents,
  };
}
