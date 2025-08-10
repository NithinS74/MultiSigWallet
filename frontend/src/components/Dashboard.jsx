import React, { useEffect, useState, useContext } from "react";
import { Link } from 'react-router-dom';
import { WalletContext } from "../App";
import { CONTRACT_ADDRESS } from "../constants/contract";
import { ethers } from "ethers";
import ABI from "../../../artifacts/contracts/multiSigWallet.sol/multiSigWallet.json";
import "./Dashboard.css";

export default function Dashboard() {
    const { signer, currentAccount, provider } = useContext(WalletContext);
    const [contract, setContract] = useState(null);
    const [status, setStatus] = useState("");
    const [owners, setOwners] = useState([]);
    const [requiredConfirmations, setRequiredConfirmations] = useState(0);
    const [walletBalance, setWalletBalance] = useState("0");
    const [userBalance, setUserBalance] = useState("0");
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (signer) {
            const instance = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, signer);
            setContract(instance);
        }
    }, [signer]);

    useEffect(() => {
        if (contract) {
            fetchBalances();
            fetchContractData();
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
            const [ownersList, confirmationsRequired] = await Promise.all([
                contract.getOwners(),
                contract.noOfConfirmations()
            ]);

            setOwners(ownersList);
            setRequiredConfirmations(Number(confirmationsRequired));
        } catch (err) {
            console.error("Error fetching contract data:", err);
            setStatus("Error fetching contract data");
        }
    };

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

                <div className="wallet-actions">
                    <div className="action-card">
                        <h3>Wallet Actions</h3>
                        <Link to="/deposit" className="action-button">Deposit Ether</Link>
                        <Link to="/propose" className="action-button">Propose a Transaction</Link>
                        <Link to="/transactions" className="action-button">View Transactions</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
