const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: { type: String, require: true },
  type: { type: String, require: true },
});

module.exports = mongoose.model("Currency", schema);
