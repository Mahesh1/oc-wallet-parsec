const express = require("express");
const {
  createWalletHandler,
  getWalletHandler,
  mintHandler,
  balanceHandler,
  sendHandler,
  importHandler,
} = require("./utils/handlers");

const router = express.Router();
/**
 * @swagger
 * /wallet:
 *   post:
 *     summary: Create a new wallet
 *     description: Creates a new wallet and returns the wallet info and address.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 */
router.post("/wallet", createWalletHandler);
/**
 * @swagger
 * /wallet/{walletID}:
 *   get:
 *     summary: Get wallet info
 *     description: Retrieves wallet info and address based on the wallet ID.
 *     parameters:
 *       - in: path
 *         name: walletID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 info:
 *                   type: string
 */
router.get("/wallet/:walletID", getWalletHandler);
/**
 * @swagger
 * /mint:
 *   post:
 *     summary: Mint new funds
 *     description: Mints new funds to the specified wallet.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletID:
 *                 type: number
 *               UTXO:
 *                 type: number
 *               atomicUnit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */
router.post("/mint", mintHandler);
/**
 * @swagger
 * /balance/{walletID}:
 *   get:
 *     summary: Get user balance
 *     description: Retrieves the balance of a user's wallet based on the wallet ID.
 *     parameters:
 *       - in: path
 *         name: walletID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 */
router.get("/balance/:walletID", balanceHandler);
/**
 * @swagger
 * /send:
 *   post:
 *     summary: Send funds between accounts
 *     description: Sends funds from the sender's wallet to the receiver's address.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderID:
 *                 type: number
 *               receiverAddress:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */
router.post("/send", sendHandler);
/**
 * @swagger
 * /importfunds:
 *   post:
 *     summary: Import unspent funds into a wallet
 *     description: Imports unspent funds into the given wallet ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletID:
 *                 type: string
 *               importinput:
 *                 type: string
 *             example:
 *               walletID: "0"
 *               importinput: ""
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */

router.post("/importfunds", importHandler);

module.exports = router;
