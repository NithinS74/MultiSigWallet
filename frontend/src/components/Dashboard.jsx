import React, { useEffect, useState, useContext } from "react";
import { WalletContext } from "../App";
import useMultiSig from "../hooks/useMultiSig";
import { CONTRACT_ADDRESS } from "../constants/contract";
import { ethers } from "ethers";
import TransactionItem from "./TransactionItem";
import { Toaster, toast } from "react-hot-toast";
import "./Dashboard.css";

export default function Dashboard() {
  const { signer, currentAccount, provider } = useContext(WalletContext);
  const {
    contract,
    error,
    getBalance,
    getOwners,
    getOwnerBalance,
    submitTransaction,
    depositEther,
    listenToEvents,
  } = useMultiSig(signer, CONTRACT_ADDRESS);

  const [walletBalance, setWalletBalance] = useState("0");
  const [owners, setOwners] = useState([]);
  const [requiredConfirmations, setRequiredConfirmations] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [txTo, setTxTo] = useState("");
  const [txValue, setTxValue] = useState("");

  const fetchAllData = async () => {
    if (!contract) return;
    try {
      const [balance, ownersList, reqConfirmations, txCount] =
        await Promise.all([
          getBalance(),
          getOwners(),
          contract.noOfConfirmations(),
          contract.getTransactionCount(),
        ]);

      setWalletBalance(balance);
      setRequiredConfirmations(Number(reqConfirmations));

      const ownersWithBalances = await Promise.all(
        ownersList.map(async (owner) => ({
          address: owner,
          balance: await getOwnerBalance(owner),
        }))
      );
      setOwners(ownersWithBalances);

      const txs = [];
      for (let i = 0; i < txCount; i++) {
        const tx = await contract.getTransaction(i);
        const isConfirmed = await contract.isConfirmed(i, currentAccount);
        txs.push({
          index: i,
          to: tx.to,
          value: tx.value,
          executed: tx.executed,
          numConfirmations: Number(tx.numConfirmations),
          isConfirmed,
          confirmationsNeeded: Number(reqConfirmations),
          canExecute:
            !tx.executed &&
            Number(tx.numConfirmations) >= Number(reqConfirmations),
          owners: ownersList,
        });
      }
      setTransactions(txs.reverse());
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Error fetching data");
    }
  };

  useEffect(() => {
    if (contract && provider && currentAccount) {
      fetchAllData();
    }
  }, [contract, provider, currentAccount]);

  useEffect(() => {
    if (contract) {
      const unsubscribe = listenToEvents(() => {
        toast.success("New event detected! Refreshing data...");
        fetchAllData();
      });
      return () => unsubscribe();
    }
  }, [contract]);

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    const toastId = toast.loading("Depositing...");
    try {
      await depositEther(depositAmount);
      await fetchAllData();
      setDepositAmount("");
      toast.success("Deposit successful", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Deposit failed", { id: toastId });
    }
  };

  const handleSubmitTx = async () => {
    if (!txTo || !txValue) {
      toast.error("Please fill all fields");
      return;
    }
    if (isNaN(txValue) || Number(txValue) <= 0) {
      toast.error("Please enter a valid ETH amount");
      return;
    }
    const toastId = toast.loading("Submitting transaction...");
    try {
      await submitTransaction(txTo, txValue);
      setTxTo("");
      setTxValue("");
      toast.success("Transaction submitted", { id: toastId });
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(`Submission failed: ${error.reason || error.message}`, {
        id: toastId,
      });
    }
  };

  const handleConfirm = async (index) => {
    const toastId = toast.loading("Confirming...");
    try {
      const tx = await contract.confirmTransaction(index);
      await tx.wait();
      toast.success("Transaction confirmed", { id: toastId });
      fetchAllData();
    } catch (err) {
      console.error("Confirm failed:", err);
      toast.error(`Confirmation failed: ${err.reason || err.message}`, {
        id: toastId,
      });
    }
  };

  const handleRevoke = async (index) => {
    const toastId = toast.loading("Revoking...");
    try {
      const tx = await contract.revokeConfirmation(index);
      await tx.wait();
      toast.success("Confirmation revoked", { id: toastId });
      fetchAllData();
    } catch (err) {
      console.error("Revoke failed:", err);
      toast.error(`Revoke failed: ${err.reason || err.message}`, {
        id: toastId,
      });
    }
  };

  const handleExecute = async (index) => {
    const toastId = toast.loading("Executing...");
    try {
      const tx = await contract.executeTransaction(index);
      await tx.wait();
      toast.success("Transaction executed", { id: toastId });
      fetchAllData();
    } catch (err) {
      console.error("Execute failed:", err);
      toast.error(`Execution failed: ${err.reason || err.message}`, {
        id: toastId,
      });
    }
  };

  return (
    <div className="dashboard-container">
      <Toaster position="top-center" reverseOrder={false} />
      <header className="dashboard-header">
        <h1>Multi-Sig Wallet Dashboard</h1>
        <p>
          Connected as: <strong>{currentAccount}</strong>
        </p>
      </header>

      <div className="dashboard-main">
        <div className="left-column">
          <div className="wallet-info-card">
            <h3>Wallet Info</h3>
            <p>
              <strong>Balance:</strong> {walletBalance} ETH
            </p>
            <p>
              <strong>Required Confirmations:</strong> {requiredConfirmations}
            </p>
            <div className="owners-list">
              <strong>Owners:</strong>
              <ul>
                {owners.map((owner) => (
                  <li key={owner.address}>
                    {owner.address} ({owner.balance} ETH)
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="actions-card">
            <h3>Actions</h3>
            <div className="action-item">
              <h4>Deposit Ether</h4>
              <input
                type="text"
                placeholder="Amount in ETH"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <button onClick={handleDeposit}>Deposit</button>
            </div>
            <div className="action-item">
              <h4>Submit Transaction</h4>
              <input
                type="text"
                placeholder="Recipient Address"
                value={txTo}
                onChange={(e) => setTxTo(e.target.value)}
              />
              <input
                type="text"
                placeholder="Amount in ETH"
                value={txValue}
                onChange={(e) => setTxValue(e.target.value)}
              />
              <button onClick={handleSubmitTx}>Submit</button>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="transactions-list-card">
            <h3>Transactions</h3>
            {transactions.length === 0 ? (
              <p>No transactions found</p>
            ) : (
              transactions.map((tx) => (
                <TransactionItem
                  key={tx.index}
                  tx={tx}
                  handleConfirm={handleConfirm}
                  handleRevoke={handleRevoke}
                  handleExecute={handleExecute}
                  currentAccount={currentAccount}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
