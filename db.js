const mongoose = require("mongoose");
const connectionUrl = "mongodb://127.0.0.1:27017/mybudgetmanager"; // local connection url

mongoose.set("strictQuery", true);

mongoose
  .connect(process.env.MONGODB_URI || connectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((db) => console.log("Connected to mongodb..."))
  .catch((err) => console.error(err));

module.exports = mongoose;
