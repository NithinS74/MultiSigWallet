import React, { useEffect, useState, useContext } from "react";
import { WalletContext } from "../App";
import { CONTRACT_ADDRESS } from "../constants/contract";
import { ethers } from "ethers";
import ABI from "../../../artifacts/contracts/multiSigWallet.sol/multiSigWallet.json";

export default function ListTransactions() {
  const { signer, currentAccount } = useContext(WalletContext);
  const [contract, setContract] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState("");
  const [owners, setOwners] = useState([]);
  const [requiredConfirmations, setRequiredConfirmations] = useState(0);

  useEffect(() => {
    if (signer) {
      const instance = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, signer);
      setContract(instance);
    }
  }, [signer]);

  useEffect(() => {
    if (contract) {
      fetchContractData();
    }
  }, [contract]);

  const fetchContractData = async () => {
    try {
      const [txCount, ownersList, confirmationsRequired] = await Promise.all([
        contract.getTransactionCount(),
        contract.getOwners(),
        contract.noOfConfirmations()
      ]);
      
      setOwners(ownersList);
      setRequiredConfirmations(Number(confirmationsRequired));

      const txs = [];
      for (let i = 0; i < txCount; i++) {
        const tx = await contract.getTransaction(i);
        const isConfirmed = await contract.isConfirmed(i, currentAccount);

        txs.push({
          index: i,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          executed: tx.executed,
          numConfirmations: Number(tx.numConfirmations),
          isConfirmed,
          confirmationsNeeded: Number(confirmationsRequired),
          canExecute: !tx.executed && tx.numConfirmations >= confirmationsRequired
        });
      }

      setTransactions(txs);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setStatus("Error fetching transactions");
    }
  };

  const handleConfirm = async (index) => {
    try {
      setStatus("Confirming...");
      const tx = await contract.confirmTransaction(index);
      await tx.wait();
      setStatus("Transaction confirmed ✅");
      fetchContractData();
    } catch (err) {
      console.error("Confirm failed:", err);
      setStatus(`Confirmation failed: ${err.reason || err.message}`);
    }
  };

  const handleRevoke = async (index) => {
    try {
      setStatus("Revoking...");
      const tx = await contract.revokeConfirmation(index);
      await tx.wait();
      setStatus("Confirmation revoked 🔄");
      fetchContractData();
    } catch (err) {
      console.error("Revoke failed:", err);
      setStatus(`Revoke failed: ${err.reason || err.message}`);
    }
  };

  const handleExecute = async (index) => {
    try {
      setStatus("Executing...");
      const tx = await contract.executeTransaction(index);
      await tx.wait();
      setStatus("Transaction executed ✅");
      fetchContractData();
    } catch (err) {
      console.error("Execute failed:", err);
      setStatus(`Execution failed: ${err.reason || err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>MultiSig Wallet Transactions</h2>
      <p style={styles.info}>
        <strong>Owners:</strong> {owners.join(", ")}<br />
        <strong>Required Confirmations:</strong> {requiredConfirmations}
      </p>

      {transactions.length === 0 ? (
        <p>No transactions found</p>
      ) : (
        <div style={styles.transactionsContainer}>
          {transactions.map((tx) => (
            <div 
              key={tx.index} 
              style={{
                ...styles.card,
                borderLeft: tx.executed ? "4px solid #4CAF50" : "4px solid #FF9800"
              }}
            >
              <div style={styles.cardHeader}>
                <span style={styles.txId}>TX #{tx.index}</span>
                <span style={{
                  ...styles.statusBadge,
                  background: tx.executed ? "#4CAF50" : "#FF9800"
                }}>
                  {tx.executed ? "Executed" : "Pending"}
                </span>
              </div>

              <div style={styles.cardBody}>
                <p><strong>Recipient:</strong> {tx.to}</p>
                <p><strong>Amount:</strong> {tx.value} ETH</p>
                <p>
                  <strong>Confirmations:</strong> 
                  <span style={{ color: tx.numConfirmations >= tx.confirmationsNeeded ? "#4CAF50" : "#FF5722" }}>
                    {tx.numConfirmations} of {tx.confirmationsNeeded} required
                  </span>
                </p>
              </div>

              {!tx.executed && (
                <div style={styles.cardActions}>
                  {tx.isConfirmed ? (
                    <button 
                      style={styles.revokeButton} 
                      onClick={() => handleRevoke(tx.index)}
                    >
                      Revoke
                    </button>
                  ) : (
                    <button 
                      style={styles.confirmButton} 
                      onClick={() => handleConfirm(tx.index)}
                    >
                      Confirm
                    </button>
                  )}

                  {tx.canExecute && (
                    <button 
                      style={styles.executeButton} 
                      onClick={() => handleExecute(tx.index)}
                    >
                      Execute
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#333",
  },
  info: {
    background: "#f0f8ff",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "2rem",
  },
  transactionsContainer: {
    display: "grid",
    gap: "1rem",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "1rem",
    background: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #eee",
  },
  txId: {
    fontWeight: "bold",
    color: "#666",
  },
  statusBadge: {
    padding: "0.25rem 0.5rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  cardBody: {
    marginBottom: "1rem",
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end",
  },
  confirmButton: {
    padding: "0.5rem 1rem",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  revokeButton: {
    padding: "0.5rem 1rem",
    background: "#FF5722",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  executeButton: {
    padding: "0.5rem 1rem",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  status: {
    marginTop: "1rem",
    padding: "0.75rem",
    background: "#f8f8f8",
    borderRadius: "4px",
    textAlign: "center",
    fontWeight: "bold",
  },
};
