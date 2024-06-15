const mongoose = require("mongoose");
const connectionUrl = process.env.MONGODB_URI;

mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGODB_URI || connectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((db) => console.log("Connected to mongodb..."))
  .catch((err) => console.error(err));

module.exports = mongoose;
