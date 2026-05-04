const { ethers } = require("ethers");

async function generateBurnerWallets() {
  console.log("🔥 Generating 3 Burner Wallets for Sepolia Demo...\n");

  for (let i = 1; i <= 3; i++) {
    // createRandom() generates a brand new private key and address
    const wallet = ethers.Wallet.createRandom();
    
    console.log(`--- Owner ${i} ---`);
    console.log(`Address:     ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}\n`);
  }

  console.log("⚠️ IMPORTANT: Copy and paste these into your .env files.");
  console.log("❌ NEVER send real Mainnet ETH to these addresses!");
}

generateBurnerWallets();
