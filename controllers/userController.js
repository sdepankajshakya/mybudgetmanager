const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserModel = require("../models/user");
const utils = require("../utilities/utils");
const HttpStatus = require("../utilities/httpsStatusCodes");

const { OAuth2Client, JWT } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = new UserModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash,
    });

    user
      .save()
      .then((result) => utils.sendSuccessResponse(res, HttpStatus.CREATED, "Account created successfully!", null))
      .catch((err) => utils.sendErrorResponse(res, HttpStatus.BAD_REQUEST, err.name, err.message));
  });
};

exports.login = (req, res, next) => {
  UserModel.findOne({ email: req.body.email })
    .then((user) => {
      bcrypt
        .compare(req.body.password, user.password)
        .then((result) => {
          if (result) {
            try {
              const obj = { email: user.email, userId: user._id };
              const token = jwt.sign(obj, JWT_SECRET, { expiresIn: "24h" });
              utils.sendSuccessResponse(res, HttpStatus.OK, "Login successful!", {
                access_token: token,
                expiresIn: "24h",
                current_user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
              });
            } catch (err) {
              console.log(err);
            }
          } else {
            utils.sendErrorResponse(res, HttpStatus.UNAUTHORIZED, "Unauthorized!", "Incorrect password!");
          }
        })
    })
    .catch((err) => utils.sendErrorResponse(res, HttpStatus.UNAUTHORIZED, "Unauthorized!", "Incorrect email address!"));
};

exports.signInWithGoogle = (req, res, next) => {
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.body.idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userDetails = {
      email: payload["email"],
      firstname: payload["given_name"],
      lastname: payload["family_name"],
    };

    UserModel.findOne({ email: userDetails.email })
      .then((user) => {
        const obj = { email: user.email, userId: user._id };
        const token = jwt.sign(obj, JWT_SECRET, { expiresIn: "24h" });
        utils.sendSuccessResponse(res, HttpStatus.OK, "Login successful!", {
          access_token: token,
          expiresIn: "24h",
          current_user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
        });
      })
      .catch((err) => utils.sendErrorResponse(res, HttpStatus.UNAUTHORIZED, "Unauthorized!", "Incorrect email address!"));
  }

  verify().catch(console.error);
};
