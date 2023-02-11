const mongoose = require("mongoose");
const validator = require("validator");

const schema = mongoose.Schema({
  firstName: { type: String, require: false },
  lastName: { type: String, require: false },
  email: {
    type: String,
    require: true,
    validate(value) {
      if (!value) throw new Error('Please enter an email');
      if (!validator.isEmail(value)) throw new Error('Please enter a valid email');
    }
  },
  message: { type: String, require: true }
});

module.exports = mongoose.model("ContactUs", schema);
