const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");

router.post("/contactus", settingsController.contactus);

module.exports = router;
