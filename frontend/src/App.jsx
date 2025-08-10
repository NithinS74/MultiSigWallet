import { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import useAccountSwitcher from "./hooks/useAccountSwitcher";
import Dashboard from "./components/Dashboard";
import Deposit from "./components/Deposit";
import ProposeTransaction from "./components/ProposeTransaction";
import Transactions from "./components/Transactions";

// Create WalletContext in App.jsx and export it
export const WalletContext = createContext(null);

// A wrapper to protect routes that require a connected wallet
function PrivateRoute({ children, currentAccount }) {
  return currentAccount ? children : <Navigate to="/" />;
}

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
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !currentAccount ? (
                <div className="login-container">
                    <div className="login-card">
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
                </div>
              ) : (
                <Dashboard />
              )
            }
          />
          <Route path="/deposit" element={<PrivateRoute currentAccount={currentAccount}><Deposit /></PrivateRoute>} />
          <Route path="/propose" element={<PrivateRoute currentAccount={currentAccount}><ProposeTransaction /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute currentAccount={currentAccount}><Transactions /></PrivateRoute>} />
        </Routes>
      </Router>
    </WalletContext.Provider>
  );
}

export default App;
