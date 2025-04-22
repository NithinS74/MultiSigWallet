import { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import useAccountSwitcher from "./hooks/useAccountSwitcher";
import useMultiSig from "./hooks/useMultiSig";
import Transactions from "./components/Transactions";
import ListTransaction from "./components/ListTransaction";

// Import contract address from constants
import { CONTRACT_ADDRESS } from "./constants/contract.js";

// Create WalletContext in App.jsx and export it
export const WalletContext = createContext(null);

function Dashboard({ currentAccount, signer, provider }) {
  const {
    getOwners,
    getBalance,
    contract,
    error: contractError,
  } = useMultiSig(signer, CONTRACT_ADDRESS);

  const [owners, setOwners] = useState([]);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (contract) {
      getBalance().then(setBalance);
      getOwners().then(setOwners);
    }
  }, [contract]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Connected as: {currentAccount}</h2>
      <p><strong>Contract Balance:</strong> {balance} ETH</p>
      <p><strong>Owners:</strong></p>
      <ul>
        {owners.length > 0 ? (
          owners.map((owner) => (
            <li key={owner}>{owner}</li>
          ))
        ) : (
          <p>No owners found</p>
        )}
      </ul>
      {contractError && <p style={{ color: "red" }}>{contractError}</p>}

      <Link to="/transactions" style={{ marginTop: "1rem", display: "inline-block" }}>
        Go to Transactions
      </Link>
    </div>
  );
}

function App() {
  const [provider, setProvider] = useState(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showUI, setShowUI] = useState(false);

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
      setShowUI(true);
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
                <div style={{ padding: "2rem", fontFamily: "Arial" }}>
                  <h2>Enter Private Key</h2>
                  <input
                    type="password"
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    style={{ padding: "0.5rem", width: "300px" }}
                  />
                  <button onClick={handleConnect} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
                    Connect
                  </button>
                  {accountError && <p style={{ color: "red" }}>{accountError}</p>}
                </div>
              ) : (
                <Dashboard currentAccount={currentAccount} signer={signer} provider={provider} />
              )
            }
          />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/list-transaction" element={<ListTransaction />} />
        </Routes>
      </Router>
    </WalletContext.Provider>
  );
}

export default App;
