require("dotenv").config();
const path = require("path");
const fs = require("fs");
const WalletStoreFile = "../wallets/walletInfo.json";
const ethers = require("ethers"); // Importing ethers.js
const parsecConfig = require("../parsec.config.js"); // Assuming this is how it's structured
const CBDC_NETWORK = process.env.CBDC_NETWORK; // If using dotenv
const provider = new ethers.providers.JsonRpcProvider(CBDC_NETWORK);

/**
 * function to create a new wallet
 */
async function createWalletHandler(req, res) {
  try {
    const walletID = getNextWalletID();

    // Use ethers.js to create a new Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey;

    // Store the generated Ethereum address and private key
    const newWallet = writeWalletInfo(walletID, address, privateKey);

    res.send(newWallet);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}

/**
 * function to get wallet info
 */
function getWalletHandler(req, res) {
  const { walletID } = req.params;
  const walletInfo = getWalletInfo(walletID);
  if (walletInfo) {
    res.send(walletInfo);
  } else {
    res.status(404).send("Wallet not found");
  }
}

/**
 * function to mint new funds
 */
async function mintHandler(req, res) {
  const { walletID, UTXO, atomicUnit } = req.body;
  const amount = atomicUnit.toString();

  try {
    // Get wallet info
    const walletInfo = getWalletInfo(walletID);

    if (!walletInfo) {
      res.status(400).send("Wallet not found");
      return;
    }

    // Extract the private key from wallet info
    const privateKey = parsecConfig.defaultAccount.privateKey;

    // Use the private key to initialize ethers Wallet
    const wallet = new ethers.Wallet(privateKey, provider); // Assuming parsecConfig.provider is your Ethereum provider

    // Construct the transaction
    const tx = {
      to: walletInfo.address, // sending to the same wallet (you can change this if needed)
      value: ethers.utils.parseEther(amount), // Convert amount to wei (or atomic units)
    };

    // Sign and send the transaction
    const txResponse = await wallet.sendTransaction(tx);
    const receipt = await txResponse.wait();

    // Send the transaction receipt back in the response
    res.send(receipt);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}

/**
 * function to get balance
 */
async function balanceHandler(req, res) {
  const { walletID } = req.params;
  const walletInfo = getWalletInfo(walletID);

  // Check if walletInfo is empty
  if (!walletInfo) {
    return res.status(404).json({ error: "Wallet not found" });
  }

  try {
    // Query the balance using ethers.js
    const balanceWei = await provider.getBalance(walletInfo.address);
    const balanceEth = ethers.utils.formatEther(balanceWei); // Convert balance from Wei to Ether

    // Return the balance
    res.json({
      walletID: walletInfo.walletID,
      address: walletInfo.address,
      balance: balanceEth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}

/**
 * function to send funds
 */
async function sendHandler(req, res) {
  const { senderID, receiverAddress, amount } = req.body;

  const senderWalletInfo = getWalletInfo(senderID);
  if (!senderWalletInfo) {
    return res.status(404).json({ error: "Sender wallet not found" });
  }

  // Create the sender's wallet using the private key
  const senderWallet = new ethers.Wallet(senderWalletInfo.privateKey, provider);

  try {
    // Send the transaction using ethers.js
    const transactionResponse = await senderWallet.sendTransaction({
      to: receiverAddress,
      value: ethers.utils.parseEther(amount.toString()), // Convert the amount from Ether to Wei
    });

    // Wait for the transaction to be mined (optional)
    const transactionReceipt = await provider.waitForTransaction(
      transactionResponse.hash
    );

    // Return the transaction hash or receipt
    res.json({
      transactionHash: transactionResponse.hash,
      transactionReceipt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}

/**
 * function to send funds and import the unspent output
 */
async function sendAndImportHandler(req, res) {
  try {
    // Call the sendHandler function and wait for its completion
    let response = await sendHandler(req, res);
    res.json(response);
    // If you want to process or modify the output from sendHandler, you can do it here.
    // For now, the output from sendHandler will be directly sent as a response to the client.
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred in sendAndImportHandler");
  }
}

/**
 * function to write wallet info
 * */
function writeWalletInfo(walletID, address, privateKey) {
  // Check if address or privateKey is empty or null
  if (!address || !privateKey) {
    return false;
  }

  const walletInfoPath = path.join(__dirname, WalletStoreFile);
  let walletInfo;

  // Check if walletInfo.json already exists
  if (fs.existsSync(walletInfoPath)) {
    // Read existing data
    const rawdata = fs.readFileSync(walletInfoPath);
    walletInfo = JSON.parse(rawdata);
  } else {
    // Initialize as an empty array if it doesn't exist
    walletInfo = [];
  }

  // Append new wallet info
  const newWallet = {
    walletID,
    address,
    privateKey, // Store privateKey
  };

  walletInfo.push(newWallet);

  // Write updated walletInfo back to the file
  fs.writeFileSync(walletInfoPath, JSON.stringify(walletInfo, null, 2));

  return newWallet;
}

/**
 * function to get wallet info
 */
function getWalletInfo(identifier) {
  const walletInfoPath = path.join(__dirname, WalletStoreFile);
  // Check if walletInfo.json exists
  if (fs.existsSync(walletInfoPath)) {
    // Read existing data
    const rawdata = fs.readFileSync(walletInfoPath);
    const walletInfo = JSON.parse(rawdata);
    console.log(walletInfo);
    // Find and return the wallet with the given walletID or address
    const foundWallet = walletInfo.find(
      (wallet) =>
        wallet.walletID.toString() === identifier ||
        wallet.address === identifier
    );

    if (!foundWallet) {
      console.log(`No wallet found for identifier: ${identifier}`);
    }

    return foundWallet;
  } else {
    // Return null or throw an error if the file doesn't exist
    console.log(`Wallet info file does not exist at path: ${walletInfoPath}`);
    return null;
  }
}

/**
 * function to get the next wallet ID
 */
function getNextWalletID() {
  let wallets;
  const walletInfoPath = path.join(__dirname, WalletStoreFile);
  try {
    // Read the JSON file
    if (fs.existsSync(walletInfoPath)) {
      const rawData = fs.readFileSync(walletInfoPath, "utf8");
      wallets = JSON.parse(rawData);
    } else {
      // If the file doesn't exist, create it with an empty array
      fs.writeFileSync(walletInfoPath, JSON.stringify([], null, 2));
      return 0;
    }
  } catch (error) {
    console.error("Error reading the wallet store file:", error);
    return 0; // return 0 in case of any unexpected error
  }

  // If the file is empty or not an array, start with ID 0
  if (!Array.isArray(wallets)) {
    return 0;
  }

  // Return the next index in the array
  return wallets.length;
}

//export handlers
module.exports = {
  createWalletHandler,
  getWalletHandler,
  mintHandler,
  balanceHandler,
  sendHandler,
  sendAndImportHandler,
};
