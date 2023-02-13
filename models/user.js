const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const validator = require("validator");

const schema = mongoose.Schema({
  firstName: { type: String, require: false, trim: true },
  lastName: { type: String, require: false, trim: true },
  email: {
    type: String, require: true, unique: true, lowercase: true, trim: true,
    validate(value) {
      if (!value) throw new Error('Please enter an email');
      if (!validator.isEmail(value)) throw new Error('Please enter a valid email');
    }
  },
  password: { type: String, require: true, trim: true }
});

schema.plugin(uniqueValidator);

module.exports = mongoose.model("User", schema);