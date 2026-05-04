import React, { useState, useEffect } from "react";
import { useAccountSwitcher } from "../hooks/useAccountSwitcher";
import { useMultiSig } from "../hooks/useMultiSig";
import { CONTRACT_ADDRESS } from "../constants/contract";
import TransactionItem from "./TransactionItem";
import "./Dashboard.css";

export default function Dashboard() {
  const { activeAccount, switchAccount, burners } = useAccountSwitcher();
  const { 
    submitTx, 
    confirmTx, 
    executeTx, 
    revokeTx, 
    getBalance, 
    depositETH, 
    getTransactions 
  } = useMultiSig(activeAccount);
// Replace the single isLoading with two separate states
const [isDepositing, setIsDepositing] = useState(false);
const [isProposing, setIsProposing] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState("0.0");
  const [burnerBalances, setBurnerBalances] = useState(["0", "0", "0"]);
  const [transactions, setTransactions] = useState([]);
  
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all balances and transactions
  const fetchData = async () => {
    if (!activeAccount) return;
    
    const tBal = await getBalance(CONTRACT_ADDRESS);
    setTreasuryBalance(tBal);

    const b0 = await getBalance(burners[0].address);
    const b1 = await getBalance(burners[1].address);
    const b2 = await getBalance(burners[2].address);
    setBurnerBalances([b0, b1, b2]);

    const txs = await getTransactions(burners);
    setTransactions(txs);
  };

  useEffect(() => {
    fetchData();
  }, [activeAccount, burners]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount) return;
    setIsLoading(true);
    const success = await depositETH(depositAmount);
    if (success) {
      setDepositAmount("");
      fetchData(); // Refresh UI immediately
      alert("Successfully deposited ETH into Treasury!");
    }
    setIsLoading(false);
  };

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!toAddress || !amount) return;
    setIsLoading(true);
    const success = await submitTx(toAddress, amount);
    if (success) {
      setToAddress("");
      setAmount("");
      fetchData(); // Refresh UI immediately
      alert("Transaction Proposed Successfully!");
    }
    setIsLoading(false);
  };

  // Transaction action wrappers
  const handleConfirm = async (txIndex) => {
    setIsLoading(true);
    const success = await confirmTx(txIndex);
    if (success) fetchData();
    setIsLoading(false);
  };

  const handleExecute = async (txIndex) => {
    setIsLoading(true);
    const success = await executeTx(txIndex);
    if (success) fetchData();
    setIsLoading(false);
  };

  const handleRevoke = async (txIndex) => {
    setIsLoading(true);
    const success = await revokeTx(txIndex);
    if (success) fetchData();
    setIsLoading(false);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-title">
          <h1>MultiSig Treasury</h1>
          <p className="contract-address">Contract: <span>{CONTRACT_ADDRESS}</span></p>
        </div>
        <div className="account-switcher-box">
          <p>👤 Acting as:</p>
          <select 
            value={burners.findIndex(b => b.address === activeAccount.address)}
            onChange={(e) => switchAccount(Number(e.target.value))}
          >
            <option value={0}>Owner 1 ({burners[0].address.slice(0,6)}...)</option>
            <option value={1}>Owner 2 ({burners[1].address.slice(0,6)}...)</option>
            <option value={2}>Owner 3 ({burners[2].address.slice(0,6)}...)</option>
          </select>
        </div>
      </div>

      <div className="dashboard-main">
        {/* LEFT COLUMN: 35% Width */}
        <div className="left-column">
          
          <div className="wallet-info-card treasury-card">
            <h3>Treasury Balance</h3>
            <h2 className="big-balance">{parseFloat(treasuryBalance).toFixed(4)} <span className="eth-label">ETH</span></h2>
            
            {/* DEPOSIT UI */}
            <form onSubmit={handleDeposit} className="deposit-form">
              <input 
                type="number" 
                step="0.0001"
                placeholder="Amount to deposit" 
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" className="deposit-btn" disabled={isLoading}>
                {isLoading ? "Mining..." : "Deposit"}
              </button>
            </form>
          </div>

          <div className="wallet-info-card">
            <h3>Signer Balances</h3>
            <ul className="owners-list">
              {burners.map((burner, index) => (
                <li key={index} className={activeAccount.address === burner.address ? "active-owner" : ""}>
                  <div className="owner-header">
                    <div className="owner-meta">
                      <span className="owner-label">Owner {index + 1}</span>
                      {activeAccount.address === burner.address && <span className="active-badge">Active</span>}
                    </div>
                    <span className="owner-bal">{parseFloat(burnerBalances[index]).toFixed(4)} ETH</span>
                  </div>
                  
                  {/* Copyable Address Section */}
                  <div className="address-row">
                    <code className="full-address">{burner.address}</code>
                    <button 
                      className="copy-btn" 
                      onClick={() => {
                        navigator.clipboard.writeText(burner.address);
                      }}
                      title="Copy Address"
                    >
                      Copy
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="actions-card">
             <h3>Propose Transaction</h3>
             <form onSubmit={handlePropose} className="action-item">
                <input 
                  type="text" 
                  placeholder="Recipient Address (Paste here...)" 
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  disabled={isLoading}
                />
                <input 
                  type="number" 
                  step="0.0001"
                  placeholder="Amount (ETH)" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
                <button type="submit" className="propose-btn" disabled={isLoading}>
                  {isLoading ? "Mining on Sepolia..." : "Propose Tx"}
                </button>
             </form>
          </div>
        </div>
        
        {/* RIGHT COLUMN: 65% Width */}
        <div className="right-column">
          <div className="transactions-list-card">
            <h3>Transaction Ledger</h3>
            <p className="subtitle">Watch the consensus happen in real-time.</p>
            
            {/* Render the actual transactions */}
            {transactions.length === 0 ? (
              <div className="placeholder-ledger">
                 <p>No transactions found on the network.</p>
              </div>
            ) : (
              <div className="transaction-feed">
                {transactions.map((tx) => (
                  <TransactionItem 
                    key={tx.index} 
                    tx={tx} 
                    currentAccount={activeAccount.address}
                    handleConfirm={handleConfirm}
                    handleExecute={handleExecute}
                    handleRevoke={handleRevoke}
                  />
                ))}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
