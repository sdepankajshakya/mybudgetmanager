const mongoose = require("mongoose");

const schema = mongoose.Schema({
  firstName: { type: String, require: false },
  lastName: { type: String, require: false },
  email: { type: String, require: true },
  message: { type: String, require: true},
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("ContactUs", schema);
