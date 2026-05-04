import React from "react";
import { ethers } from "ethers";
import "./TransactionItem.css";

export default function TransactionItem({
  tx,
  currentAccount,
  handleConfirm,
  handleExecute,
  handleRevoke
}) {
  // Check if the currently selected activeAccount is one of the owners
  const isOwner = tx.owners.includes(currentAccount);

  return (
    <div className={`tx-card ${tx.executed ? "tx-executed" : "tx-pending"}`}>
      
      <div className="tx-header">
        <span className="tx-id">TX #{tx.index}</span>
        <span className={`status-badge ${tx.executed ? "badge-success" : "badge-warning"}`}>
          {tx.executed ? "Executed" : "Pending"}
        </span>
      </div>

      <div className="tx-body">
        <div className="tx-row">
          <span className="tx-label">Recipient:</span>
          <code className="tx-value address-text">{tx.to}</code>
        </div>
        <div className="tx-row">
          <span className="tx-label">Amount:</span>
          <span className="tx-value font-bold">{ethers.utils.formatEther(tx.value)} ETH</span>
        </div>
        
        <div className="progress-container">
          <div className="progress-labels">
            <span className="tx-label">Signatures:</span>
            <span className={`tx-value ${tx.numConfirmations >= tx.confirmationsNeeded ? "text-success" : "text-warning"}`}>
              {tx.numConfirmations} / {tx.confirmationsNeeded} Required
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min((tx.numConfirmations / tx.confirmationsNeeded) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS: Only show if the user is an owner and the tx is not executed */}
      {!tx.executed && isOwner && (
        <div className="tx-actions">
          
          {/* If the user HAS confirmed, show Revoke. If they HAVEN'T, show Confirm */}
          {tx.isConfirmed ? (
            <button className="btn-revoke" onClick={() => handleRevoke(tx.index)}>
              Revoke Signature
            </button>
          ) : (
            <button className="btn-confirm" onClick={() => handleConfirm(tx.index)}>
              Sign & Confirm
            </button>
          )}

          {/* Only show Execute if the threshold is met */}
          {tx.canExecute && (
            <button className="btn-execute" onClick={() => handleExecute(tx.index)}>
              Execute Transaction
            </button>
          )}
        </div>
      )}
    </div>
  );
}
