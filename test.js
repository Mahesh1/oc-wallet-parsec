const axios = require("axios");

// specify the base url and api key
const API_BASE = "http://localhost:3000"; // replace with your actual base url
const API_KEY = "12345";

// helper function to make requests
async function makeRequest(method, endpoint, data = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "X-API-KEY": API_KEY };
  const response = await axios({ method, url, data, headers });
  return response.data;
}

function extractImportInput(str) {
  const match = str.match(/importinput:\n(\w+)/);
  return match ? match[1] : null;
}
// test runner
async function runTests() {
  console.log("**********************************************\n");
  // Test 1
  console.log("Running test 1: wallet Creation...");
  let wallet1 = await makeRequest("post", "/wallet");
  let wallet2 = await makeRequest("post", "/wallet");
  console.log(`Wallet 1 ID: ${wallet1.walletID}, Address: ${wallet1.address}`);
  console.log(`Wallet 2 ID: ${wallet2.walletID}, Address: ${wallet2.address}`);
  console.log("**********************************************\n");

  // Test 2
  console.log("Running test 2: Getting Wallet...");
  let wallet1Info = await makeRequest("get", `/wallet/${wallet1.walletID}`);
  let wallet2Info = await makeRequest("get", `/wallet/${wallet2.walletID}`);
  console.log(wallet1Info, wallet2Info);
  console.log("**********************************************\n");

  // Test 3
  console.log("Running test 3: Minting...");
  let mintResponse = await makeRequest("post", "/mint", {
    walletID: wallet1.walletID,
    UTXO: 1,
    atomicUnit: 100,
  });
  console.log(mintResponse);
  console.log("**********************************************\n");

  // Test 3b
  console.log("Running test 3b: Get Balance Endpoint by ID...");
  let balance = await makeRequest("get", `/balance/${wallet1.walletID}`);
  console.log(balance);
  console.log("**********************************************\n");

  // Test 3c
  console.log("Running test 3c: Get Balance Endpoint by Address...");
  let balance2 = await makeRequest("get", `/balance/${wallet1.address}`);
  console.log(balance2);
  console.log("**********************************************\n");

  // Test 4
  console.log("Running test 4: Sending Funds...");
  let sendResponse = await makeRequest("post", "/send", {
    senderID: wallet1.walletID,
    receiverAddress: wallet2.address,
    amount: 10,
  });
  console.log(sendResponse);
  console.log("**********************************************\n");

  // Test 5
  console.log("Running test 5: Inputing funds...");
  const importinput = extractImportInput(sendResponse);
  let importFundsResponse = await makeRequest("post", "/importfunds", {
    walletID: wallet2.walletID,
    importinput: importinput,
  });
  console.log(importFundsResponse);
  console.log("**********************************************\n");

  // Test 6
  console.log("Running test 6: Send and Input...");
  let sendAndImportResponse = await makeRequest("post", "/sendandimport", {
    senderID: wallet1.walletID,
    receiverAddress: wallet2.address,
    amount: 10,
  });
  console.log(sendAndImportResponse);
  console.log("**********************************************");
}

// run the tests
runTests();
