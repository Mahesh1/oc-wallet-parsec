const path = require("path");
const fs = require("fs");
const WalletStoreFIle = "walletInfo.json";
const { spawn } = require("child_process");
const {
  accountBalanceToJSON,
  getNextWalletID,
  extractAddress,
} = require("./utils");
// Obtain the absolute path of client-cli
const clientCliPath = path.join(__dirname, "./bin/client-cli");
const walletsDirectory = path.join(__dirname, "../wallets");
/**
 * function to create a new wallet
 */
async function createWalletHandler(req, res) {
  try {
    const walletID = getNextWalletID();
    const output = await runCommands(
      [
        "2pc-compose.cfg",
        `mempool${walletID}.dat`,
        `wallet${walletID}.dat`,
        "newaddress",
      ],
      walletsDirectory
    );
    const newWallet = writeWalletInfo(walletID, extractAddress(output));
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
  try {
    const output = await runCommands([
      "2pc-compose.cfg",
      `mempool${walletID}.dat`,
      `wallet${walletID}.dat`,
      "mint",
      UTXO,
      atomicUnit,
    ]);
    res.send(output);
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

  const ID = walletInfo.walletID;
  try {
    const output = await runCommands([
      "2pc-compose.cfg",
      `mempool${ID}.dat`,
      `wallet${ID}.dat`,
      "info",
    ]);
    const json = accountBalanceToJSON(output);
    res.json(json);
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
  try {
    const output = await runCommands([
      "2pc-compose.cfg",
      `mempool${senderID}.dat`,
      `wallet${senderID}.dat`,
      "send",
      amount,
      receiverAddress,
    ]);
    res.send(output);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}

/**
 * function to send funds and import the unspent output
 */
async function sendAndImportHandler(req, res) {
  const { senderID, receiverAddress, amount } = req.body;
  const senderWalletInfo = getWalletInfo(senderID);
  const senderWalletID = senderWalletInfo.walletID;
  try {
    const output = await runCommands([
      "2pc-compose.cfg",
      `mempool${senderWalletID}.dat`,
      `wallet${senderWalletID}.dat`,
      "send",
      amount,
      receiverAddress,
    ]);
    const importinput = extractImportInput(output);
    if (!importinput) {
      return res.status(500).send("Failed to extract importinput");
    }
    const walletInfo = getWalletInfo(receiverAddress);
    const recieverID = walletInfo.walletID;
    const infoOutput = await importUnspentOutput(recieverID, importinput);
    res.send(infoOutput);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}

/**
 * function to import funds
 */
async function importHandler(req, res) {
  const { walletID, importinput } = req.body;
  try {
    const infoOutput = await importUnspentOutput(walletID, importinput);
    res.send(infoOutput);
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}

/**** HELPERS *******/
/**
 * function to run multple commands
 */
function runCommands(commandArgs) {
  return new Promise((resolve, reject) => {
    const command = spawn(clientCliPath, commandArgs);
    let output = "";

    command.stdout.on("data", (data) => {
      output += data.toString();
    });

    command.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command exited with code ${code}: ${output}`));
      } else {
        resolve(output);
      }
    });

    command.on("error", reject);
  });
}

/*
 ** Helper function to import unspent output
 */
async function importUnspentOutput(walletID, importinput) {
  try {
    const importOutput = await runCommands([
      "2pc-compose.cfg",
      `mempool${walletID}.dat`,
      `wallet${walletID}.dat`,
      "importinput",
      importinput,
    ]);
    console.log(importOutput);

    const syncOutput = await runCommands([
      "2pc-compose.cfg",
      `mempool${walletID}.dat`,
      `wallet${walletID}.dat`,
      "sync",
    ]);
    console.log(syncOutput);

    const infoOutput = await runCommands([
      "2pc-compose.cfg",
      `mempool${walletID}.dat`,
      `wallet${walletID}.dat`,
      "info",
    ]);
    console.log(infoOutput);
    return infoOutput;
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
}
/**
 * function to write wallet info
 * */
function writeWalletInfo(walletID, address) {
  // Check if address is empty or null
  if (!address) {
    return false;
  }

  const walletInfoPath = path.join(__dirname, WalletStoreFIle);
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
    address: address,
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
  const walletInfoPath = path.join(__dirname, WalletStoreFIle);

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
    console.log("foundWallet");
    console.log(foundWallet);

    return foundWallet;
  } else {
    // Return null or throw an error if the file doesn't exist
    console.log(`Wallet info file does not exist at path: ${walletInfoPath}`);
    return null;
  }
}

/**
 * Function to extract importinput from string
 */
function extractImportInput(str) {
  const match = str.match(/importinput:\n(\w+)/);
  return match ? match[1] : null;
}

//export handlers
module.exports = {
  createWalletHandler,
  getWalletHandler,
  mintHandler,
  balanceHandler,
  sendHandler,
  sendAndImportHandler,
  importHandler,
};
