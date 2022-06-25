const express = require("express");
const router = express.Router();

const ContactUs = require("../models/contactus");
const utils = require("../utilities/utils");

const checkAuth = require("../middleware/checkAuth");

router.post("/contactus", checkAuth, (req, res, next) => {
  if (!req.body) {
    utils.sendErrorResponse(res, 400, "Failed to send", "Request body not found");
  } else {
    const contactus = new ContactUs(req.body);
    contactus.user = req.currentUser.userId;

    if (!req.body._id) {
      // insert
      contactus.save((err, result) => {
        if (err) {
          utils.sendErrorResponse(res, 400, err.name, err.message);
        } else {
          utils.sendSuccessResponse(res, 201, "Message sent succesfully!", null);
        }
      });
    }
  }
});

module.exports = router;
