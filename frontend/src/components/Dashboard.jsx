import React, { useEffect, useState, useContext } from "react";
import { WalletContext } from "../App";
import { CONTRACT_ADDRESS } from "../constants/contract";
import { ethers } from "ethers";
import ABI from "../../../artifacts/contracts/multiSigWallet.sol/multiSigWallet.json";
import "./Dashboard.css";

export default function Dashboard() {
    const { signer, currentAccount, provider } = useContext(WalletContext);
    const [contract, setContract] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [status, setStatus] = useState("");
    const [owners, setOwners] = useState([]);
    const [requiredConfirmations, setRequiredConfirmations] = useState(0);
    const [walletBalance, setWalletBalance] = useState("0");
    const [userBalance, setUserBalance] = useState("0");
    const [depositAmount, setDepositAmount] = useState("");
    const [txTo, setTxTo] = useState("");
    const [txValue, setTxValue] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedTx, setExpandedTx] = useState(null);

    useEffect(() => {
        if (signer) {
            const instance = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, signer);
            setContract(instance);
        }
    }, [signer]);

    useEffect(() => {
        if (contract) {
            fetchContractData();
            fetchBalances();
        }
    }, [contract]);

    const fetchBalances = async () => {
        setIsRefreshing(true);
        try {
            const contractBal = await contract.getBalance();
            const userBal = await provider.getBalance(currentAccount);

            setWalletBalance(ethers.formatEther(contractBal));
            setUserBalance(ethers.formatEther(userBal));
        } catch (err) {
            console.error("Error fetching balances:", err);
            setStatus("❌ Error fetching balances");
        }
        setIsRefreshing(false);
    };

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
                const isConfirmedByCurrentUser = await contract.isConfirmed(i, currentAccount);

                const confirmations = [];
                for(const owner of ownersList) {
                    const hasConfirmed = await contract.isConfirmed(i, owner);
                    if(hasConfirmed) {
                        confirmations.push(owner);
                    }
                }

                txs.push({
                    index: i,
                    to: tx.to,
                    value: ethers.formatEther(tx.value),
                    executed: tx.executed,
                    numConfirmations: Number(tx.numConfirmations),
                    isConfirmedByCurrentUser,
                    confirmations,
                    confirmationsNeeded: Number(confirmationsRequired),
                    canExecute: !tx.executed && tx.numConfirmations >= confirmationsRequired
                });
            }

            setTransactions(txs.sort((a, b) => b.index - a.index)); // Show latest first
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setStatus("Error fetching transactions");
        }
    };

    const handleDeposit = async () => {
        if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) {
            setStatus("⚠️ Please enter a valid deposit amount.");
            return;
        }

        setStatus("Depositing...");

        try {
            const tx = await signer.sendTransaction({
                to: CONTRACT_ADDRESS,
                value: ethers.parseEther(depositAmount)
            });
            await tx.wait();
            await fetchBalances();
            setDepositAmount("");
            setStatus("✅ Deposit successful");
        } catch (error) {
            console.error(error);
            setStatus(`❌ Deposit failed: ${error?.reason}`);
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
            const tx = await contract.submitTransaction(txTo, ethers.parseEther(txValue));
            await tx.wait();
            await fetchContractData();
            setTxTo("");
            setTxValue("");
            setStatus("✅ Transaction submitted");
        } catch (error) {
            console.error("Submission failed:", error);
            setStatus(`❌ Submission failed: ${error?.reason}`);
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
            setStatus(`Confirmation failed: ${err?.reason}`);
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
            setStatus(`Revoke failed: ${err?.reason}`);
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
            setStatus(`Execution failed: ${err?.reason}`);
        }
    };

    const toggleTxDetails = (index) => {
        if(expandedTx === index) {
            setExpandedTx(null);
        } else {
            setExpandedTx(index);
        }
    }

    const isOwner = owners.includes(currentAccount);

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Multi-Sig Wallet</h1>
                <div className="account-info">
                    <p><strong>Connected:</strong> {`${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`}</p>
                    <p><strong>Your Balance:</strong> {parseFloat(userBalance).toFixed(4)} ETH</p>
                </div>
            </header>

            {status && <div className="status-toast">{status}</div>}

            <main className="dashboard-main">
                <div className="wallet-info-card">
                    <h2>Wallet Overview</h2>
                    <p><strong>Contract Balance:</strong> {parseFloat(walletBalance).toFixed(4)} ETH</p>
                    <p><strong>Required Confirmations:</strong> {requiredConfirmations} of {owners.length}</p>
                    <div className="owners-list">
                        <strong>Owners:</strong>
                        <ul>
                            {owners.map(owner => <li key={owner}>{`${owner.substring(0, 6)}...${owner.substring(38)}`}</li>)}
                        </ul>
                    </div>
                     <button onClick={() => { fetchBalances(); fetchContractData(); }} disabled={isRefreshing}>
                        {isRefreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {isOwner &&
                    <div className="wallet-actions">
                        <div className="action-card">
                            <h3>Deposit Ether</h3>
                            <input
                                type="text"
                                placeholder="Amount in ETH"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                            />
                            <button onClick={handleDeposit}>Deposit</button>
                        </div>

                        <div className="action-card">
                            <h3>Submit New Transaction</h3>
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
                }
            </main>

            <section className="transactions-section">
                <h2>Transactions</h2>
                <div className="transactions-list">
                    {transactions.length === 0 ? <p>No transactions yet.</p> :
                        transactions.map((tx) => (
                            <div key={tx.index} className={`tx-card ${tx.executed ? 'executed' : 'pending'}`}>
                                <div className="tx-header" onClick={() => toggleTxDetails(tx.index)}>
                                    <div className="tx-id">TX #{tx.index}</div>
                                    <div className="tx-details">
                                        <p><strong>To:</strong> {tx.to}</p>
                                        <p><strong>Amount:</strong> {tx.value} ETH</p>
                                    </div>
                                    <div className="tx-status">
                                        <span>{tx.executed ? "Executed" : "Pending"}</span>
                                        <div className="confirmations">
                                            {tx.numConfirmations}/{tx.confirmationsNeeded}
                                        </div>
                                    </div>
                                </div>

                                {expandedTx === tx.index &&
                                    <div className="tx-body">
                                        <div className="confirmed-by">
                                            <strong>Confirmed By:</strong>
                                            <ul>
                                                {tx.confirmations.length > 0 ?
                                                    tx.confirmations.map(c => <li key={c}>{c}</li>) :
                                                    <li>No confirmations yet.</li>
                                                }
                                            </ul>
                                        </div>
                                        {isOwner && !tx.executed &&
                                            <div className="tx-actions">
                                                {tx.isConfirmedByCurrentUser ? (
                                                    <button className="revoke" onClick={() => handleRevoke(tx.index)}>Revoke</button>
                                                ) : (
                                                    <button onClick={() => handleConfirm(tx.index)}>Confirm</button>
                                                )}

                                                {tx.canExecute && (
                                                    <button className="execute" onClick={() => handleExecute(tx.index)}>Execute</button>
                                                )}
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        ))
                    }
                </div>
            </section>
        </div>
    );
}
