const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: { type: String, require: true },
  type: { type: String, require: false },
  icon: { type: String, require: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
});

module.exports = mongoose.model("Category", schema);
