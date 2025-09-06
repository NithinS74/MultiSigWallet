import React from "react";
import { ethers } from "ethers";
import "./TransactionItem.css";

export default function TransactionItem({
  tx,
  handleConfirm,
  handleRevoke,
  handleExecute,
  currentAccount,
}) {
  const isOwner = tx.owners.includes(currentAccount);

  return (
    <div
      className="transaction-card"
      style={{
        borderLeft: tx.executed
          ? "4px solid #4CAF50"
          : "4px solid #FF9800",
      }}
    >
      <div className="card-header">
        <span className="tx-id">TX #{tx.index}</span>
        <span
          className="status-badge"
          style={{
            background: tx.executed ? "#4CAF50" : "#FF9800",
          }}
        >
          {tx.executed ? "Executed" : "Pending"}
        </span>
      </div>

      <div className="card-body">
        <p>
          <strong>Recipient:</strong> {tx.to}
        </p>
        <p>
          <strong>Amount:</strong> {ethers.formatEther(tx.value)} ETH
        </p>
        <p>
          <strong>Confirmations:</strong>
          <span
            style={{
              color:
                tx.numConfirmations >= tx.confirmationsNeeded
                  ? "#4CAF50"
                  : "#FF5722",
            }}
          >
            {tx.numConfirmations} of {tx.confirmationsNeeded} required
          </span>
        </p>
      </div>

      {!tx.executed && isOwner && (
        <div className="card-actions">
          {tx.isConfirmed ? (
            <button
              className="revoke-button"
              onClick={() => handleRevoke(tx.index)}
            >
              Revoke
            </button>
          ) : (
            <button
              className="confirm-button"
              onClick={() => handleConfirm(tx.index)}
            >
              Confirm
            </button>
          )}

          {tx.canExecute && (
            <button
              className="execute-button"
              onClick={() => handleExecute(tx.index)}
            >
              Execute
            </button>
          )}
        </div>
      )}
    </div>
  );
}
