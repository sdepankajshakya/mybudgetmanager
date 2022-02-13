const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const schema = mongoose.Schema({
  firstName: { type: String, require: false },
  lastName: { type: String, require: false },
  email: { type: String, require: true, unique: true },
  password: { type: String, require: true }
});

schema.plugin(uniqueValidator);

module.exports = mongoose.model("User", schema);