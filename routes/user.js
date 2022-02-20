const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserModel = require("../models/user");
const config = require("../configuration/config");
const utils = require("../utilities/utils");

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = new UserModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash,
    });

    user.save((err, result) => {
      if (err) {
        utils.sendErrorResponse(res, 400, err.name, err.message);
      } else {
        utils.sendSuccessResponse(res, 201, "Account created successfully!", null);
      }
    });
  });
});

router.post("/login", (req, res, next) => {
  UserModel.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      bcrypt.compare(req.body.password, user.password).then((result) => {
        if (result) {
          try {
            const obj = { email: user.email, userId: user._id };
            const token = jwt.sign(obj, config.secret_key, { expiresIn: 3600 });
            utils.sendSuccessResponse(res, 200, "Login successful!", {
              access_token: token,
              expiresIn: 3600,
              current_user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
            });
          } catch (err) {
            console.log(err);
          }
        } else {
          utils.sendErrorResponse(res, 401, "Unauthorized!", "Incorrect password!");
        }
      });
    } else {
      utils.sendErrorResponse(res, 401, "Unauthorized!", "Incorrect email address!");
    }
  });
});

module.exports = router;
