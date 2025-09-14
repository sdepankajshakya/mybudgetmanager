const mongoose = require("mongoose");

const schema = mongoose.Schema({
  currency: { type: Object, require: false },
  categories: { type: Object, require: false },
  darkMode: { type: Boolean, require: false },
  theme: { type: String, require: false, default: 'blue' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Settings", schema);
