# Multi-Signature Wallet DApp

This project is a decentralized application (DApp) that implements a multi-signature wallet on the Ethereum blockchain. It allows a group of owners to manage funds collectively, requiring a minimum number of confirmations from the owners before a transaction can be executed. This enhances security by preventing any single individual from controlling the assets.

The application features a Solidity smart contract for the wallet's logic and a React.js frontend for user interaction.

## Key Features

-   **🔐 Secure Fund Management:** Requires multiple owners to approve transactions, preventing unauthorized access.
-   **💼 Transaction Creation:** Owners can submit new transactions to transfer Ether from the wallet.
-   **✍️ Confirm & Execute:** Owners can review and confirm pending transactions. Once the required number of confirmations is met, any owner can execute the transaction.
-   **REVOKE Confirmation:** Owners can revoke their confirmation before a transaction is executed.
-   **📜 Transaction History:** View a list of all past and pending transactions, including their confirmation status.
-   **👥 Owner Management:** The wallet is initialized with a set of owners and a required number of confirmations.
-   **🌐 Web Interface:** An intuitive frontend built with React.js to interact with the smart contract on the blockchain.

## Tech Stack

-   **Backend (Smart Contract):**
    -   Solidity
    -   Hardhat (Development Environment)
    -   Ethers.js
-   **Frontend:**
    -   React.js
    -   Vite
    -   Ethers.js

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

-   Node.js and npm (or yarn)
-   MetaMask browser extension

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd MultiSigWallet
    ```

2.  **Install project dependencies:**
    This will install dependencies for both the Hardhat environment and the React frontend.
    ```sh
    npm install
    ```

### Deployment

1.  **Compile the Smart Contract:**
    ```sh
    npx hardhat compile
    ```

2.  **Run a local blockchain node:**
    ```sh
    npx hardhat node
    ```
    This will start a local Hardhat network and provide you with several test accounts and their private keys.

3.  **Deploy the Smart Contract:**
    In a new terminal, run the deployment script. This script deploys the `MultiSigWallet` contract with a predefined set of owners and a required number of confirmations (as specified in `scripts/deploy.js`).
    ```sh
    npx hardhat run scripts/deploy.js --network localhost
    ```
    After deployment, the script will log the contract address to the console.

4.  **Update Frontend with Contract Address:**
    Copy the deployed contract address and paste it into `frontend/src/constants/contract.js`, replacing the existing placeholder for `multiSigWalletAddress`.

### Running the Frontend

1.  **Navigate to the frontend directory:**
    ```sh
    cd frontend
    ```

2.  **Install frontend dependencies (if you haven't already run `npm install` in the root):**
    ```sh
    npm install
    ```

3.  **Start the frontend development server:**
    ```sh
    npm run dev
    ```
    The application will be running at `http://localhost:5173`.

4.  **Connect MetaMask:**
    -   Open MetaMask and connect it to your local Hardat network (usually `http://127.0.0.1:8545/`).
    -   Import one of the test accounts provided by the `npx hardhat node` command using its private key to interact with the DApp as one of the wallet owners.

---

> "The future of money is digital currency." - Bill Gates
