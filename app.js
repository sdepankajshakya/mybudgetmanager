const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const app = express();
const db = require("./db");
const bodyParser = require("body-parser");
const path = require("path");
const compression = require('compression');
const cors = require('cors');
const helmet = require("helmet");
const rateLimit = require('express-rate-limit');

const transactionRoutes = require("./routes/transactions");
const userRoutes = require("./routes/user");
const settingsRoute = require("./routes/settings");
const contactUsRoute = require("./routes/contactus");

app.use(compression()); // Enable gzip compression
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Allow requests from localhost
app.use(cors({
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(helmet()); // Set various HTTP headers for security

// Implement rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

const numberOfProxies = 1;
app.set("trust proxy", numberOfProxies);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  next();
});

// user routes
app.get('/api', (req, res) => res.send('Budget Manager API Working successfully ✅'))
app.use(transactionRoutes, settingsRoute);
app.use("/api/user", userRoutes, contactUsRoute);

// serve the static files
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/public"));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/public/index.html"));
  });
}

module.exports = app;
