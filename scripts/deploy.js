const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  
  //taking 3 owners
  const owners = signers.slice(0, 3);

  console.log("Deploying MultisigWallet with the following owners:\n");

  for (let i = 0; i < owners.length; i++) {
    const balance = await ethers.provider.getBalance(owners[i].address);
    console.log(`Owner ${i + 1}: ${owners[i].address}`);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
  }

  const Multisig = await ethers.getContractFactory("multiSigWallet");

  // Deploying the contract with 3 owners and 2 required confirmations
  const wallet = await Multisig.deploy(
    owners.map(o => o.address), // array of owner addresses
    2 // required confirmations
  );

  await wallet.deployed();

  console.log("✅ MultisigWallet deployed at:", wallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
