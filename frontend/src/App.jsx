import { createContext } from "react";
// FIX 1: Add curly braces around useAccountSwitcher
import { useAccountSwitcher } from "./hooks/useAccountSwitcher"; 
import Dashboard from "./components/Dashboard";
import "./App.css";

export const WalletContext = createContext(null);

function App() {
  // FIX 2: Grab the new return values from our updated hook
  const { activeAccount } = useAccountSwitcher();

  // If the account hasn't loaded yet, show a quick loading state
  if (!activeAccount) {
    return <div className="connect-container"><h2>Loading Demo...</h2></div>;
  }

  // FIX 3: Pass the active burner wallet down through the context
  // activeAccount is an ethers.Wallet, which means it contains both the signer and the provider!
  return (
    <WalletContext.Provider value={{ 
      currentAccount: activeAccount.address, 
      signer: activeAccount, 
      provider: activeAccount.provider 
    }}>
      <Dashboard />
    </WalletContext.Provider>
  );
}

export default App;
