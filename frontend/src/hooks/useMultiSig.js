import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "../../../artifacts/contracts/multiSigWallet.sol/multiSigWallet.json"; // adjust path if needed

export default function useMultiSig(signer, contractAddress) {
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);

  // Load contract with current signer
  useEffect(() => {
    if (signer && contractAddress) {
      try {
        const walletContract = new ethers.Contract(contractAddress, ABI.abi, signer);
        setContract(walletContract);
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
      setError("Failed to submit transaction");
    }
  };

  const confirmTransaction = async (txIndex) => {
    try {
      const tx = await contract.confirmTransaction(txIndex);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("ConfirmTransaction failed:", err);
      setError("Failed to confirm transaction");
    }
  };

  const revokeConfirmation = async (txIndex) => {
    try {
      const tx = await contract.revokeConfirmation(txIndex);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("RevokeConfirmation failed:", err);
      setError("Failed to revoke confirmation");
    }
  };

  const executeTransaction = async (txIndex) => {
    try {
      const tx = await contract.executeTransaction(txIndex);
      await tx.wait();
      return tx.hash;
    } catch (err) {
      console.error("ExecuteTransaction failed:", err);
      setError("Failed to execute transaction");
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
      setError("Failed to deposit Ether");
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

  // **Updated** getOwners method based on the new contract
  const getOwners = async () => {
    try {
      const owners = await contract.getOwners();
      return owners; // Make sure this returns an array of addresses
    } catch (err) {
      console.error("GetOwners failed:", err);
      setError("Failed to get owners");
      return []; // return an empty array if failed
    }
  };

  // **Updated** getBalance method based on the new contract
  const getBalance = async () => {
    try {
      const balance = await contract.getBalance();
      return ethers.formatEther(balance); // Format the balance to ETH
    } catch (err) {
      console.error("GetBalance failed:", err);
      setError("Failed to get balance");
      return "0"; // Return zero if failed
    }
  };

  // Live Event Sync (Optional)
  const listenToEvents = (callback) => {
    if (!contract) return;

    const handlers = [
      contract.on("SubmitTransaction", callback),
      contract.on("ConfirmTransaction", callback),
      contract.on("ExecuteTransaction", callback),
      contract.on("RevokeConfirmation", callback),
      contract.on("Deposit", callback),
    ];

    return () => {
      handlers.forEach((off) => contract.off(off));
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
    listenToEvents,
  };
}
