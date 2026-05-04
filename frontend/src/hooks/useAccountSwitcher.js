import { useState, useMemo } from 'react';
import { ethers } from 'ethers';

// 1. Move the provider OUTSIDE the hook. 
// It only gets created once per page load now.
const provider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_SEPOLIA_RPC_URL);

export const useAccountSwitcher = () => {
  
  // 2. Empty dependency array means this array is only built once!
  const burners = useMemo(() => [
    new ethers.Wallet(import.meta.env.VITE_BURNER_KEY_1, provider),
    new ethers.Wallet(import.meta.env.VITE_BURNER_KEY_2, provider),
    new ethers.Wallet(import.meta.env.VITE_BURNER_KEY_3, provider)
  ], []);

  const [activeAccount, setActiveAccount] = useState(burners[0]);

  const switchAccount = (index) => {
    setActiveAccount(burners[index]);
  };

  return { activeAccount, switchAccount, burners };
};
