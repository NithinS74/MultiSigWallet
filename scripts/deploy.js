const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  
  // taking 3 owners (These are strings, not objects)
  const owners = [
    "0x4c77CF5ea4c4Ccd028c235dc23dE8eAf4719f8ac",
    "0x365A94015aC36f53b9F2C2be42e78fDfb0C54A97",
    "0x4DF2FEFBEAA177BA822413B742128c2041DE5A41"
  ];
  
  console.log("Deploying MultisigWallet with the following owners:\n");
  
  for (let i = 0; i < owners.length; i++) {
    // FIX: owners[i] is already the address string. No need for .address
    const balance = await ethers.provider.getBalance(owners[i]);
    console.log(`Owner ${i + 1}: ${owners[i]}`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
  }
  
  // 1. Get the Contract Factory (Ethers v5 style)
  const Multisig = await ethers.getContractFactory("multiSigWallet");
  
  // 2. Deploying the contract with 3 owners and 2 required confirmations
  // FIX: Just pass the 'owners' array directly instead of mapping it
  const wallet = await Multisig.deploy(owners, 2);
  
  // 3. Wait for deployment (Ethers v5 style)
  await wallet.deployed();
  
  // 4. Log the address (Ethers v5 style)
  console.log("✅ MultisigWallet deployed at:", wallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
