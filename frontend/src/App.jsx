import { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import useAccountSwitcher from "./hooks/useAccountSwitcher";
import Dashboard from "./components/Dashboard"; // Import the new Dashboard

// Create WalletContext in App.jsx and export it
export const WalletContext = createContext(null);

function App() {
  const [provider, setProvider] = useState(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");

  useEffect(() => {
    // Connect to the local Hardhat node
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
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !currentAccount ? (
                <div className="login-container">
                  <h2>Connect with Private Key</h2>
                  <input
                    type="password"
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    placeholder="Enter your private key"
                  />
                  <button onClick={handleConnect}>Connect Wallet</button>
                  {accountError && <p className="error-message">{accountError}</p>}
                </div>
              ) : (
                <Dashboard />
              )
            }
          />
        </Routes>
      </Router>
    </WalletContext.Provider>
  );
}

export default App;
