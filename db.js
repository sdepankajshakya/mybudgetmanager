const mongoose = require("mongoose");
const connectionUrl = "mongodb+srv://pankajshakya:thisisapasswordformybudgetmanager@mybudgetmanagercluster.adar9bs.mongodb.net/mybudgetmanager?retryWrites=true&w=majority"
// const connectionUrl = "mongodb://127.0.0.1:27017/mybudgetmanager"; // local connection url

mongoose.connect(
  process.env.MONGODB_URI || connectionUrl,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, db) => {
    if (err) {
      console.error(err);
    }

    if (db) {
      console.log("Connected to mongodb...");
    }
  }
);

module.exports = mongoose;
