const mongoose = require("mongoose");
const xlsx = require("xlsx");
const fs = require("fs");

const utils = require("../utilities/utils");
const ContactUs = require("../models/contactus");
const SettingsModel = require("../models/settings");
const TransactionModel = require("../models/transaction");
const CategoryModel = require("../models/category");
const CurrencyModel = require("../models/currency");
const PaymentMode = require("../models/paymentMode");

exports.contactus = (req, res, next) => {
  if (!req.body) {
    utils.sendErrorResponse(res, 400, "Failed to send", "Request body not found");
  } else {
    const contactus = new ContactUs(req.body);

    if (!req.body._id) {
      // insert
      contactus
        .save()
        .then((result) => utils.sendSuccessResponse(res, 200, "Message sent succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
    }
  }
};

exports.getSettings = (req, res, next) => {
  SettingsModel.find({ user: req.currentUser.userId })
    .then((result) => utils.sendSuccessResponse(res, 200, "Settings fetched succesfully!", result))
    .catch((err) => utils.sendErrorResponse(res, 500, err.name, err.message));
};

exports.updatesettings = (req, res, next) => {
  if (!req.body) {
    utils.sendErrorResponse(res, 400, "Failed to update", "Request body not found");
  } else {
    const settings = new SettingsModel(req.body);
    settings.user = req.currentUser.userId;

    if (!req.body._id) {
      // insert
      settings
        .save()
        .then((result) => utils.sendSuccessResponse(res, 200, "Settings saved succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
    } else {
      // update
      if (!mongoose.Types.ObjectId.isValid(req.body._id)) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot update settings.");

      SettingsModel.findOneAndUpdate({ _id: settings._id, user: req.currentUser.userId }, settings, { runValidators: true })
        .then((result) => utils.sendSuccessResponse(res, 200, "Settings updated succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
    }
  }
};

exports.getCategories = (req, res, next) => {
  CategoryModel.find({ user: { $in: [null, req.currentUser.userId] } })
    .then((result) => utils.sendSuccessResponse(res, 200, "Categories fetched succesfully!", result))
    .catch((err) => utils.sendErrorResponse(res, 500, err.name, err.message));
};

exports.getCurrencies = (req, res, next) => {
  CurrencyModel.find({})
    .then((result) => utils.sendSuccessResponse(res, 200, "Currencies fetched succesfully!", result))
    .catch((err) => utils.sendErrorResponse(res, 500, err.name, err.message));
};

exports.getPaymentModes = (req, res, next) => {
  PaymentMode.find({ user: { $in: [null, req.currentUser.userId] } })
    .then((result) => utils.sendSuccessResponse(res, 200, "Payment Modes fetched succesfully!", result))
    .catch((err) => utils.sendErrorResponse(res, 500, err.name, err.message));
};

exports.deletealltransactions = (req, res, next) => {
  const user = req.body;

  if (!user._id) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot find the user.");
  else {
    TransactionModel.deleteMany({ user: user._id })
      .then((result) => utils.sendSuccessResponse(res, 200, "Transactions deleted succesfully!", null))
      .catch((err) => utils.sendErrorResponse(res, 500, err.name, err.message));
  }
};

exports.uploadSpreadsheet = (req, res, next) => {
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
        CategoryModel.find({ name: trans.category })
          .then((result) => {
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
          })
          .catch((err) => utils.sendErrorResponse(res, 500, err.name, err.message));
      } else {
        utils.sendErrorResponse(res, 400, "Failed to upload", "Error parsing the file");
        break;
      }
    }
  }
};

function sheetToJson(filePath) {
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  let transactions = xlsx.utils.sheet_to_json(worksheet);

  return transactions;
}

function insertIntoDB(trans, res, transactionsObj, lastIndex) {
  if (trans) {
    const transaction = new TransactionModel(trans);
    transaction
      .save()
      .then((result) => {
        if (result && lastIndex) {
          utils.sendSuccessResponse(res, 201, "Transactions added successfully!", transactionsObj); // send success response only after the entire transaction array has been iterated
        }
      })
      .catch((err) => console.log(err));
  }
}

exports.downloadSpreadsheet = (req, res, next) => {
  TransactionModel.find({ user: req.currentUser.userId })
    .then((result) => {
      const workbook = xlsx.utils.book_new(); // create workbook
      try {
        let modifiedTransactions = [];
        result.forEach((trans) => {
          modifiedTransactions.push({
            date: trans.date,
            category: trans.category.name,
            amount: trans.amount,
            note: trans.note,
            paymentMode: trans.paymentMode,
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
    })
    .catch((err) => utils.sendErrorResponse(res, 500, err.name, err.message));
};

exports.addCategory = (req, res, next) => {
  if (!req.body) {
    utils.sendErrorResponse(res, 400, "Validation Error", "Invalid fields");
  } else {
    const category = new CategoryModel(req.body);
    category.user = req.currentUser.userId;
    if (!req.body._id) {
      category
        .save()
        .then((result) => utils.sendSuccessResponse(res, 201, "Category added succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
    } else {
      if (!mongoose.Types.ObjectId.isValid(req.body._id)) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot update category.");
      CategoryModel.findOneAndUpdate({ _id: category._id, user: req.currentUser.userId }, category, { runValidators: true })
        .then((result) => utils.sendSuccessResponse(res, 200, "Category updated succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
    }
  }
};

exports.deleteCategory = (req, res, next) => {
  const category = new CategoryModel(req.body);
  category.user = req.currentUser.userId;

  if (!req.body._id) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot delete category.");
  else {
    CategoryModel.findByIdAndRemove({ _id: category._id, user: req.currentUser.userId })
      .then((result) => utils.sendSuccessResponse(res, 200, "Category deleted succesfully!", null))
      .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
  }
};

exports.addPaymentMode = (req, res, next) => {
  if (!req.body) {
    utils.sendErrorResponse(res, 400, "Validation Error", "Invalid fields");
  } else {
    const mode = new PaymentMode(req.body);
    mode.user = req.currentUser.userId;
    if (!req.body._id) {
      mode
        .save()
        .then((result) => utils.sendSuccessResponse(res, 201, "Payment mode added succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
    } else {
      if (!mongoose.Types.ObjectId.isValid(req.body._id)) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot update payment mode.");
      PaymentMode.findOneAndUpdate({ _id: mode._id, user: req.currentUser.userId }, mode, { runValidators: true })
        .then((result) => utils.sendSuccessResponse(res, 200, "Payment mode updated succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
    }
  }
};

exports.deletePaymentMode = (req, res, next) => {
  const mode = new PaymentMode(req.body);

  if (!req.body._id) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot delete payment mode.");
  else {
    PaymentMode.findByIdAndRemove({ _id: mode._id, user: req.currentUser.userId })
      .then((result) => utils.sendSuccessResponse(res, 200, "Payment mode deleted succesfully!", null))
      .catch((err) => utils.sendErrorResponse(res, 400, err.name, err.message));
  }
};
