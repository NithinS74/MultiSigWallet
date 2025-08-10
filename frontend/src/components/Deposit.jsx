import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletContext } from '../App';
import { CONTRACT_ADDRESS } from '../constants/contract';
import useMultiSig from '../hooks/useMultiSig';

export default function Deposit() {
  const { signer } = useContext(WalletContext);
  const { depositEther, error } = useMultiSig(signer, CONTRACT_ADDRESS);
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setStatus('⚠️ Please enter a valid amount.');
      return;
    }

    setStatus('Depositing...');
    try {
      await depositEther(amount);
      setStatus('✅ Deposit successful! Returning to dashboard...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Deposit failed:', err);
      setStatus(`❌ Deposit failed: ${err.reason || err.message}`);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Deposit Ether</h1>
        <Link to="/" className="back-link">← Back to Dashboard</Link>
      </header>
      <main className="page-content">
        <div className="action-card">
          <p>Enter the amount of ETH you want to deposit into the Multi-Sig wallet.</p>
          <input
            type="text"
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={handleDeposit}>Deposit</button>
          {status && <p className="status-message">{status}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </main>
    </div>
  );
}
