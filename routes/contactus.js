const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/checkAuth");
const settingsController = require("../controllers/settingsController");

router.post("/contactus", checkAuth, settingsController.contactus);

module.exports = router;
