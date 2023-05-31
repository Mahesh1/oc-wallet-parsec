const fs = require("fs");
const path = require("path");

function accountBalanceToJSON(text) {
  const balanceRegex = /Balance: \$([\d.]+),/;
  const utxosRegex = /UTXOs: (\d+),/;
  const pendingRegex = /pending TXs: (\d+)/;

  const balance = text.match(balanceRegex)[1];
  const utxos = text.match(utxosRegex)[1];
  const pending = text.match(pendingRegex)[1];

  return {
    balance,
    utxos,
    pending,
  };
}

//Get the next wallet ID
function getNextWalletID() {
  // The path where the wallets are stored
  const walletDirectoryPath = path.join(__dirname, "../");
  console.log(walletDirectoryPath, "walletDirectoryPath");
  // Synchronous version of fs.readdir
  const files = fs.readdirSync(walletDirectoryPath);

  const walletRegex = /^wallet(\d+)\.dat$/;
  let highestNumber = -1;
  for (const file of files) {
    const match = file.match(walletRegex);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number > highestNumber) {
        highestNumber = number;
      }
    }
  }
  return highestNumber + 1;
}

function extractAddress(output) {
  console.log(output);
  const regex = /\b(usd\w+)\b/i;
  const match = output.match(regex);
  return match ? match[1] : null;
}
module.exports = { accountBalanceToJSON, getNextWalletID, extractAddress };
