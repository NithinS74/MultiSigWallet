import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WalletContext } from '../App';
import { CONTRACT_ADDRESS } from '../constants/contract';
import useMultiSig from '../hooks/useMultiSig';

export default function ProposeTransaction() {
  const { signer } = useContext(WalletContext);
  const { submitTransaction, error } = useMultiSig(signer, CONTRACT_ADDRESS);
  const [to, setTo] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!to || !value || isNaN(value) || Number(value) <= 0) {
      setStatus('⚠️ Please enter a valid recipient and amount.');
      return;
    }

    setStatus('Submitting transaction...');
    try {
      await submitTransaction(to, value);
      setStatus('✅ Transaction proposed successfully!');
      setShowResult(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setStatus(`❌ Submission failed: ${err.reason || err.message}`);
      setShowResult(true);
    }
  };

  if (showResult) {
    return (
      <div className="page-container">
        <header className="page-header">
          <h1>Transaction Proposal Result</h1>
        </header>
        <main className="page-content">
          <div className="action-card">
            <p className="status-message">{status}</p>
            <button onClick={() => navigate('/')}>Back to Dashboard</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Propose New Transaction</h1>
        <Link to="/" className="back-link">← Back to Dashboard</Link>
      </header>
      <main className="page-content">
        <div className="action-card">
          <p>Enter the recipient's address and the amount of ETH to transfer.</p>
          <input
            type="text"
            placeholder="Recipient Address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Amount in ETH"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button onClick={handleSubmit}>Propose Transaction</button>
          {status && <p className="status-message">{status}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </main>
    </div>
  );
}
