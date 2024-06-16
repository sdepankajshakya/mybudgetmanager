const express = require("express");
const router = express.Router();

const transactionsController = require("../controllers/transactionsController");
const checkAuth = require("../middleware/checkAuth");

router.get("/api/getTransactionsDateRange", checkAuth, transactionsController.getTransactionsDateRange);
router.get("/api/getTransactions", checkAuth, transactionsController.getTransactions);
router.get("/api/getFilteredTransactions", checkAuth, transactionsController.getFilteredTransactions);
router.post("/api/newtransaction", checkAuth, transactionsController.newtransaction);
router.post("/api/deletetransaction", checkAuth, transactionsController.deletetransaction);

module.exports = router;
