import { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import useAccountSwitcher from "./hooks/useAccountSwitcher";
import Dashboard from "./components/Dashboard";
import "./App.css";

// Create WalletContext in App.jsx and export it
export const WalletContext = createContext(null);

function App() {
  const [provider, setProvider] = useState(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");

  useEffect(() => {
    const localProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    setProvider(localProvider);
  }, []);

  const {
    currentAccount,
    signer,
    connectWithPrivateKey,
    error: accountError,
  } = useAccountSwitcher();

  const handleConnect = () => {
    if (privateKeyInput && provider) {
      connectWithPrivateKey(privateKeyInput.trim(), provider);
    }
  };

  return (
    <WalletContext.Provider value={{ currentAccount, signer, provider }}>
      {!currentAccount ? (
        <div className="connect-container">
          <div className="connect-card">
            <h2>Connect to Your Wallet</h2>
            <input
              type="password"
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              placeholder="Enter Your Private Key"
            />
            <button onClick={handleConnect}>Connect</button>
            {accountError && <p className="connect-error">{accountError}</p>}
          </div>
        </div>
      ) : (
        <Dashboard />
      )}
    </WalletContext.Provider>
  );
}

export default App;
