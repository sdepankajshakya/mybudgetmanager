const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/onGoogleSignIn", userController.onGoogleSignIn);

module.exports = router;
