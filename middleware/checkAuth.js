const jwt = require("jsonwebtoken");
const config = require("../configuration/config");
const utils = require("../utilities/utils");

module.exports = (req, res, next) => {
  try {
    const access_token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(access_token, config.secret_key);
    req.currentUser = { userId: decodedToken.userId, email: decodedToken.email };
    next();
  } catch (err) {
    utils.sendErrorResponse(res, 401, "Unauthorized!", "Invalid authentication token!");
  }
};