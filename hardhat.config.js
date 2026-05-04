require("@nomiclabs/hardhat-ethers"); // Updated from hardhat-toolbox
require("dotenv").config();

module.exports = {
  solidity: "0.8.26", // Updated to match the solc version in your lockfile
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY] // Ensure these match your .env variables
    }
  }
};
