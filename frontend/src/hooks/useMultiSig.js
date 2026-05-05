import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../constants/contract';
import multiSigAbi from '../multiSigWallet.json'; 

export const useMultiSig = (activeAccount) => {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, multiSigAbi.abi, activeAccount);

  // 1. DEPOSIT
  const depositETH = async (amountInEth) => {
    try {
      const tx = await contract.deposit({
        value: ethers.utils.parseEther(amountInEth)
      });
      console.log("Depositing ETH... waiting for block");
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Deposit failed:", error);
      return false;
    }
  };

  // 2. SUBMIT
  const submitTx = async (to, value) => {
    try {
      const valueInWei = ethers.utils.parseEther(value);
      const tx = await contract.submitTransaction(to, valueInWei);
      console.log("Transaction proposed! Waiting...");
      await tx.wait(); 
      return true;
    } catch (error) {
      console.error("Submit failed:", error);
      return false;
    }
  };

  // 3. CONFIRM
  const confirmTx = async (txIndex) => {
    try {
      const tx = await contract.confirmTransaction(txIndex);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Confirm failed:", error);
      return false;
    }
  };

  // 4. EXECUTE
  const executeTx = async (txIndex) => {
    try {
      const tx = await contract.executeTransaction(txIndex);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Execute failed:", error);
      return false;
    }
  };

  // 5. REVOKE
  const revokeTx = async (txIndex) => {
    try {
      const tx = await contract.revokeConfirmation(txIndex);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Revoke failed:", error);
      return false;
    }
  };

  // 6. FETCH LEDGER
  const getTransactions = async (burnersArray) => {
    try {
      const txCount = await contract.getTransactionCount();
      const count = txCount.toNumber(); 
      
      let fetchedTxs = [];
      
      for (let i = 0; i < count; i++) {
        const tx = await contract.transactions(i);
        const isConfirmed = await contract.isConfirmed(i, activeAccount.address);
        const confirmationsNeeded = await contract.noOfConfirmations();
        const numConf = tx.numConfirmations.toNumber();

        // ── CONTRACT BUG WORKAROUND ──────────────────────────────────
        // submitTransaction() sets isConfirmed[txIndex][proposer] = true
        // but does NOT increment numConfirmations. This means the proposer's
        // mapping entry is true while numConfirmations stays at 0.
        //
        // revokeConfirmation() does:
        //   require(isConfirmed[txIndex][msg.sender])  ← passes (mapping is true)
        //   numConfirmations -= 1                      ← REVERTS: 0 - 1 underflows in ^0.8
        //
        // Fix: canRevoke is only true when numConfirmations > 0, meaning at least
        // one explicit confirmTransaction() call has been made and can safely be decremented.
        const canRevoke = isConfirmed && numConf > 0;

        fetchedTxs.push({
          index: i,
          to: tx.to,
          value: tx.value,       // Keep as BigNumber for UI formatting
          executed: tx.executed,
          numConfirmations: numConf,
          confirmationsNeeded: confirmationsNeeded.toNumber(),
          isConfirmed: isConfirmed,
          canRevoke: canRevoke,  // Use this in UI instead of isConfirmed for the Revoke button
          canExecute: numConf >= confirmationsNeeded.toNumber() && !tx.executed,
          owners: burnersArray.map(b => b.address) 
        });
      }
      
      return fetchedTxs.reverse(); 
      
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      return [];
    }
  };

  // 7. GET OWNERS
  const fetchContractOwners = async () => {
    try {
      return await contract.getOwners();
    } catch (error) {
      console.error("Failed to fetch owners:", error);
      return [];
    }
  };

  // 8. BALANCES
  const getBalance = async (address) => {
    const balance = await activeAccount.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  };

  return { 
    contract, 
    submitTx, 
    confirmTx, 
    executeTx, 
    revokeTx, 
    getBalance, 
    depositETH, 
    getTransactions,
    fetchContractOwners 
  };
};
