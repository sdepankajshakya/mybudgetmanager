const mongoose = require("mongoose");

const schema = mongoose.Schema({
  category: { type: Object, require: false },
  date: { type: String, require: true },
  amount: { type: Number, require: true },
  note: { type: String, require: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Transaction", schema);
