import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { WalletContext } from "../App";
import useMultiSig from "../hooks/useMultiSig";
import { CONTRACT_ADDRESS } from "../constants/contract";
import { ethers } from "ethers";

export default function Transactions() {
  const { currentAccount, signer, provider } = useContext(WalletContext);
  const { 
    contract, 
    error,
    submitTransaction, 
    getBalance,
    depositEther
  } = useMultiSig(signer, CONTRACT_ADDRESS);

  const [walletBalance, setWalletBalance] = useState("0");
  const [userBalance, setUserBalance] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [txTo, setTxTo] = useState("");
  const [txValue, setTxValue] = useState("");
  const [status, setStatus] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (contract && provider && currentAccount) {
      fetchBalances();
    }
  }, [contract, provider, currentAccount]);

  const fetchBalances = async () => {
    setIsRefreshing(true);
    try {
      // Use getBalance from the hook which already formats the balance
      const contractBal = await getBalance();
      const userBal = await provider.getBalance(currentAccount);

      setWalletBalance(contractBal); // Already formatted by the hook
      setUserBalance(ethers.formatEther(userBal));
    } catch (err) {
      console.error("Error fetching balances:", err);
      setStatus("❌ Error fetching balances");
    }
    setIsRefreshing(false);
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
      setStatus("⚠️ Please enter a valid deposit amount.");
      return;
    }

    setStatus("Depositing...");

    try {
      // Use depositEther from the hook
      await depositEther(depositAmount);
      await fetchBalances();
      setDepositAmount("");
      setStatus("✅ Deposit successful");
    } catch (error) {
      console.error(error);
      setStatus("❌ Deposit failed");
    }
  };

  const handleSubmitTx = async () => {
    if (!txTo || !txValue) {
      setStatus("⚠️ Please fill all fields");
      return;
    }
    
    if (isNaN(txValue) || Number(txValue) <= 0) {
      setStatus("⚠️ Please enter a valid ETH amount");
      return;
    }

    setStatus("Submitting transaction...");
    try {
      await submitTransaction(txTo, txValue);
      setTxTo("");
      setTxValue("");
      setStatus("✅ Transaction submitted");
    } catch (error) {
      console.error("Submission failed:", error);
      setStatus(`❌ Submission failed: ${error.reason || error.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>MultiSig Wallet Dashboard</h2>
      <p><strong>Connected Account:</strong> {currentAccount}</p>
      <p><strong>Wallet Balance:</strong> {walletBalance} ETH</p>
      <p><strong>Your Wallet Balance:</strong> {userBalance} ETH</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button 
        onClick={fetchBalances} 
        style={styles.refreshButton} 
        disabled={isRefreshing}
      >
        {isRefreshing ? "Refreshing..." : "Refresh Balances"}
      </button>

      <div style={styles.card}>
        <h3>Deposit Ether</h3>
        <input
          type="text"
          placeholder="Amount in ETH"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleDeposit} style={styles.button}>Deposit</button>
      </div>

      <div style={styles.card}>
        <h3>Submit Transaction</h3>
        <input
          type="text"
          placeholder="Recipient Address"
          value={txTo}
          onChange={(e) => setTxTo(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Amount in ETH"
          value={txValue}
          onChange={(e) => setTxValue(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSubmitTx} style={styles.button}>Submit</button>
      </div>

    <Link to="/list-transaction" style={styles.linkButton}>
      View Transaction List →
    </Link>

      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  card: {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "1rem",
    marginBottom: "1.5rem",
    background: "#f9f9f9",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "0.5rem",
    marginBottom: "1rem",
    borderRadius: "5px",
    border: "1px solid #aaa",
  },
  button: {
    padding: "0.6rem 1.2rem",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  refreshButton: {
    padding: "0.6rem 1.2rem",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "1.5rem",
  },
  linkButton: {
    display: "inline-block",
    textAlign: "center",
    padding: "0.6rem 1.2rem",
    background: "#FF9800",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "1rem",
  },
  status: {
    textAlign: "center",
    marginTop: "1rem",
    fontWeight: "bold",
  },
};
