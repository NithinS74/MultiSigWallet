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
        
        // This is where the rogue tag was! It's clean now.
        const isConfirmed = await contract.isConfirmed(i, activeAccount.address);
        
        const confirmationsNeeded = await contract.noOfConfirmations();

        fetchedTxs.push({
          index: i,
          to: tx.to,
          value: tx.value, // Keep as BigNumber (Wei) for the UI to format
          executed: tx.executed,
          numConfirmations: tx.numConfirmations.toNumber(),
          confirmationsNeeded: confirmationsNeeded.toNumber(),
          isConfirmed: isConfirmed,
          canExecute: tx.numConfirmations.toNumber() >= confirmationsNeeded.toNumber() && !tx.executed,
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
