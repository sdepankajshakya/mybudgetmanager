const jwt = require("jsonwebtoken");
const config = require("../configuration/config");
const utils = require("../utilities/utils");

const JWT_SECRET = process.env.JWT_SECRET || config.JWT_SECRET;

module.exports = (req, res, next) => {
  try {
    const access_token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(access_token, JWT_SECRET);
    req.currentUser = { userId: decodedToken.userId, email: decodedToken.email };
    next();
  } catch (err) {
    utils.sendErrorResponse(res, 401, "Unauthorized!", "Invalid authentication token!");
  }
};