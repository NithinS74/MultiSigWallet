import React, { useEffect, useState, useContext } from "react";
import { Link } from 'react-router-dom';
import { WalletContext } from "../App";
import { CONTRACT_ADDRESS } from "../constants/contract";
import { ethers } from "ethers";
import ABI from "../../../artifacts/contracts/multiSigWallet.sol/multiSigWallet.json";
import "./Dashboard.css"; // Reusing the dashboard styles

export default function Transactions() {
    const { signer, currentAccount } = useContext(WalletContext);
    const [contract, setContract] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [status, setStatus] = useState("");
    const [owners, setOwners] = useState([]);
    const [requiredConfirmations, setRequiredConfirmations] = useState(0);
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
                const isConfirmedByCurrentUser = await contract.isConfirmed(i, currentAccount);

                const confirmations = [];
                for (const owner of ownersList) {
                    const hasConfirmed = await contract.isConfirmed(i, owner);
                    if (hasConfirmed) {
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
        if (expandedTx === index) {
            setExpandedTx(null);
        } else {
            setExpandedTx(index);
        }
    }

    const isOwner = owners.includes(currentAccount);

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Transaction History</h1>
                <Link to="/" className="back-link">← Back to Dashboard</Link>
            </header>
            <main className="page-content">
                {status && <div className="status-toast">{status}</div>}
                <section className="transactions-section">
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
            </main>
        </div>
    );
}
