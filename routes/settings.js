const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

const checkAuth = require("../middleware/checkAuth");
const SettingsModel = require("../models/settings");
const utils = require("../utilities/utils");
const TransactionModel = require("../models/transaction");
const CategoryModel = require("../models/category");
const CurrencyModel = require("../models/currency");

const MIME_TYPE_MAP = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel.sheet.binary.macroEnabled.12": "xlsb",
  "application/vnd.ms-excel": "xls",
  "application/vnd.ms-excel.sheet.macroEnabled.12": "xlsm",
};

const storageConfig = multer.diskStorage({
  destination: (req, file, callback) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    callback(error, "spreadsheets"); // filePath
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

router.get("/api/getsettings", checkAuth, (req, res, next) => {
  SettingsModel.find({ user: req.currentUser.userId }, (err, settings) => {
    if (err) {
      utils.sendErrorResponse(res, 500, err.name, err.message);
    } else {
      utils.sendSuccessResponse(res, 200, "Settings fetched succesfully!", settings);
    }
  });
});

router.post("/api/updatesettings", checkAuth, (req, res, next) => {
  if (!req.body) {
    utils.sendErrorResponse(res, 400, "Failed to update", "Request body not found");
  } else {
    const settings = new SettingsModel(req.body);
    settings.user = req.currentUser.userId;

    if (!req.body._id) {
      // insert
      settings.save((err, result) => {
        if (err) {
          utils.sendErrorResponse(res, 400, err.name, err.message);
        } else {
          utils.sendSuccessResponse(res, 201, "Settings saved succesfully!", null);
        }
      });
    } else {
      // update
      if (!mongoose.Types.ObjectId.isValid(req.body._id)) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot update settings.");

      SettingsModel.findOneAndUpdate({ _id: settings._id, user: req.currentUser.userId }, settings, { runValidators: true }, (err, result) => {
        if (err) {
          utils.sendErrorResponse(res, 400, err.name, err.message);
        } else {
          utils.sendSuccessResponse(res, 200, "Settings updated succesfully!", null);
        }
      });
    }
  }
});

router.get("/api/getCategories", checkAuth, (req, res, next) => {
  CategoryModel.find({ user: { $in: [null, req.currentUser.userId] } }, (err, settings) => {
    if (err) {
      utils.sendErrorResponse(res, 500, err.name, err.message);
    } else {
      utils.sendSuccessResponse(res, 200, "Categories fetched succesfully!", settings);
    }
  });
});

router.get("/api/getCurrencies", checkAuth, (req, res, next) => {
  CurrencyModel.find({}, (err, settings) => {
    if (err) {
      utils.sendErrorResponse(res, 500, err.name, err.message);
    } else {
      utils.sendSuccessResponse(res, 200, "Currencies fetched succesfully!", settings);
    }
  });
});

router.post("/api/deletealltransactions", checkAuth, (req, res, next) => {
  const user = req.body;

  if (!user._id) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot find the user.");
  else {
    TransactionModel.deleteMany({ user: user._id }, (err, result) => {
      if (err) {
        utils.sendErrorResponse(res, 400, err.name, err.message);
      } else {
        utils.sendSuccessResponse(res, 200, "Transactions deleted succesfully!", null);
      }
    });
  }
});

router.post("/api/uploadSpreadsheet", checkAuth, multer({ storage: storageConfig }).single("spreadsheet"), (req, res, next) => {
  if (!req.file) {
    utils.sendErrorResponse(res, 400, "Failed to upload", "Invalid file");
  } else {
    let transactionsObj = sheetToJson(req.file.path);
    for (const [index, trans] of transactionsObj.entries()) {
      let isValid = false;
      if (trans.hasOwnProperty("amount") && trans.hasOwnProperty("date")) {
        isValid = true; // if trans obj has amount and date
      }

      if (isValid) {
        CategoryModel.find({ name: trans.category }, (err, result) => {
          let lastIndex = false;
          if (index === transactionsObj.length - 1) {
            lastIndex = true; // last index of transactions array
          }

          if (!!Object.keys(result).length) {
            trans.category = result[0]; // converting the category string from sheet to category object
            trans.user = req.currentUser.userId; // adding the userId to every transaction
            try {
              trans.date = trans.date;
              insertIntoDB(trans, res, transactionsObj, lastIndex);
            } catch (err) {
              return res.status(400).end();
            }
          }
        });
      } else {
        utils.sendErrorResponse(res, 400, "Failed to upload", "Error parsing the file");
        break;
      }
    }
  }
});

function sheetToJson(filePath) {
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  let transactions = xlsx.utils.sheet_to_json(worksheet);

  return transactions;
}

function insertIntoDB(trans, res, transactionsObj, lastIndex) {
  if (trans) {
    const transaction = new TransactionModel(trans);
    transaction.save((err, result) => {
      if (result && lastIndex) {
        utils.sendSuccessResponse(res, 201, "Transactions added successfully!", transactionsObj); // send success response only after the entire transaction array has been iterated
      }
      if (err) {
        console.log(err);
      }
    });
  }
}

router.get("/api/downloadSpreadsheet", checkAuth, (req, res, next) => {
  TransactionModel.find({ user: req.currentUser.userId }, (err, transactions) => {
    if (err) {
      utils.sendErrorResponse(res, 500, err.name, err.message);
    } else {
      const workbook = xlsx.utils.book_new(); // create workbook
      try {
        let modifiedTransactions = [];
        transactions.forEach((trans) => {
          modifiedTransactions.push({
            date: trans.date,
            category: trans.category.name,
            amount: trans.amount,
            note: trans.note,
          });
        });
        const worksheet = xlsx.utils.json_to_sheet(modifiedTransactions); // convert data to sheet
        xlsx.utils.sheet_add_aoa(worksheet, [["date", "category", "amount", "note"]], { origin: "A1" });
        xlsx.utils.book_append_sheet(workbook, worksheet, "Transactions"); // add sheet to workbook
        const fileName = "BudgetManager.xlsx";
        const workbook_opts = { bookType: "xlsx", type: "binary" }; // workbook options
        xlsx.writeFile(workbook, fileName, workbook_opts); // write workbook file
        const stream = fs.createReadStream(fileName);
        stream.pipe(res);
      } catch (err) {
        console.log(err);
        utils.sendErrorResponse(res, 500, err.name, err.message);
      } finally {
        // utils.sendSuccessResponse(res, 201, "Transactions fetched successfully!", transactions);
      }
    }
  });
});

router.post("/api/addcategory", checkAuth, (req, res, next) => {
  if (!req.body) {
    utils.sendErrorResponse(res, 400, "Validation Error", "Invalid fields");
  } else {
    const category = new CategoryModel(req.body);
    category.user = req.currentUser.userId;
    if (!req.body._id) {
      CategoryModel.find({ name: req.body.name }, (err, result) => {
        if (result) {
          utils.sendErrorResponse(res, 400, "Error!", "Category already exits");
        } else {
          category.save((err, result) => {
            if (err) {
              utils.sendErrorResponse(res, 400, err.name, err.message);
            } else {
              utils.sendSuccessResponse(res, 201, "Category added succesfully!", null);
            }
          });
        }
      });
    } else {
      if (!mongoose.Types.ObjectId.isValid(req.body._id)) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot update category.");
      CategoryModel.findOneAndUpdate({ _id: category._id, user: req.currentUser.userId }, category, { runValidators: true }, (err, result) => {
        if (err) {
          utils.sendErrorResponse(res, 400, err.name, err.message);
        } else {
          utils.sendSuccessResponse(res, 200, "Category updated succesfully!", null);
        }
      });
    }
  }
});

router.post("/api/deletecategory", checkAuth, (req, res, next) => {
  const category = new CategoryModel(req.body);
  category.user = req.currentUser.userId;

  if (!req.body._id) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot delete category.");
  else {
    CategoryModel.findByIdAndRemove({ _id: category._id, user: req.currentUser.userId }, (err, result) => {
      if (err) {
        utils.sendErrorResponse(res, 400, err.name, err.message);
      } else {
        utils.sendSuccessResponse(res, 200, "Category deleted succesfully!", null);
      }
    });
  }
});

module.exports = router;
