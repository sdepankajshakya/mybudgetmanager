const express = require("express");
const router = express.Router();

const transactionsController = require("../controllers/transactionsController");
const checkAuth = require("../middleware/checkAuth");

router.get("/api/transactions", checkAuth, transactionsController.getTransactions);
router.post("/api/newtransaction", checkAuth, transactionsController.newtransaction);
router.post("/api/deletetransaction", checkAuth, transactionsController.deletetransaction);

module.exports = router;
