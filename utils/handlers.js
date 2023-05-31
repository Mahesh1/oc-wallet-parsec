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
/**
 * function to create a new wallet
 */
function createWalletHandler(req, res) {
  const walletID = getNextWalletID();
  const command = spawn(clientCliPath, [
    "2pc-compose.cfg",
    `mempool${walletID}.dat`,
    `wallet${walletID}.dat`,
    "newaddress",
  ]);
  let output = "";
  command.stdout.on("data", (data) => {
    output += data.toString();
  });
  command.on("close", (code) => {
    const newWallet = writeWalletInfo(walletID, extractAddress(output));
    res.send(newWallet);
  });
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
function mintHandler(req, res) {
  const { walletID, UTXO, atomicUnit } = req.body;
  const command = spawn(clientCliPath, [
    "2pc-compose.cfg",
    `mempool${walletID}.dat`,
    `wallet${walletID}.dat`,
    "mint",
    UTXO,
    atomicUnit,
  ]);
  let output = "";
  command.stdout.on("data", (data) => {
    output += data.toString();
  });
  command.on("close", (code) => {
    res.send(output);
  });
}

/**
 * function to get balance
 */
function balanceHandler(req, res) {
  const { walletID } = req.params;
  const command = spawn(clientCliPath, [
    "2pc-compose.cfg",
    `mempool${walletID}.dat`,
    `wallet${walletID}.dat`,
    "info",
  ]);
  let output = "";
  command.stdout.on("data", (data) => {
    output += data.toString();
  });
  command.on("close", (code) => {
    const json = accountBalanceToJSON(output);
    res.json(json);
  });
}

/**
 * function to send funds
 */
function sendHandler(req, res) {
  const { senderID, receiverAddress, amount } = req.body;
  const command = spawn(clientCliPath, [
    "2pc-compose.cfg",
    `mempool${senderID}.dat`,
    `wallet${senderID}.dat`,
    "send",
    amount,
    receiverAddress,
  ]);
  let output = "";
  command.stdout.on("data", (data) => {
    output += data.toString();
  });
  command.on("close", (code) => {
    res.send(output);
  });
}

/**
 * function to import funds
 */
async function importHandler(req, res) {
  const { walletID, importinput } = req.body;

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

/**
 * function to write wallet info
 */
function writeWalletInfo(walletID, address) {
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
function getWalletInfo(walletID) {
  const walletInfoPath = path.join(__dirname, WalletStoreFIle);

  // Check if walletInfo.json exists
  if (fs.existsSync(walletInfoPath)) {
    // Read existing data
    const rawdata = fs.readFileSync(walletInfoPath);
    const walletInfo = JSON.parse(rawdata);

    // Convert walletID to number if it's a string
    const numWalletID =
      typeof walletID === "string" ? parseInt(walletID) : walletID;

    // Find and return the wallet with the given walletID
    return walletInfo.find((wallet) => wallet.walletID === numWalletID);
  } else {
    // Return null or throw an error if the file doesn't exist
    return null;
  }
}

//export handlers
module.exports = {
  createWalletHandler,
  getWalletHandler,
  mintHandler,
  balanceHandler,
  sendHandler,
  importHandler,
};
