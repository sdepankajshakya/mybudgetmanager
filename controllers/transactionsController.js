const mongoose = require("mongoose");

const utils = require("../utilities/utils");
const HttpStatus = require("../utilities/httpsStatusCodes");
const TransactionModel = require("../models/transaction");

exports.getTransactions = (req, res, next) => {
  TransactionModel.find({ user: req.currentUser.userId })
    .then((result) => utils.sendSuccessResponse(res, HttpStatus.OK, "Transaction fetched succesfully!", result))
    .catch((err) => utils.sendErrorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, err.name, err.message));
};

exports.newtransaction = (req, res, next) => {
  if (!req.body || req.body.amount === null || req.body.date === null) {
    utils.sendErrorResponse(res, HttpStatus.BAD_REQUEST, "Validation Error", "Invalid fields");
  } else {
    const transaction = new TransactionModel(req.body);
    if (!transaction.category.type) {
      transaction.category.type = "expense";
    }
    transaction.user = req.currentUser.userId; // associate the new transaction with current user

    if (!req.body._id) {
      // insert
      transaction
        .save()
        .then((result) => utils.sendSuccessResponse(res, HttpStatus.CREATED, "Transaction added succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, HttpStatus.BAD_REQUEST, err.name, err.message));
    } else {
      // update
      if (!mongoose.Types.ObjectId.isValid(req.body._id)) utils.sendErrorResponse(res, HttpStatus.BAD_REQUEST, "Bad Request", "Invalid object id received. Cannot update transaction.");

      TransactionModel.findOneAndUpdate({ _id: transaction._id, user: req.currentUser.userId }, transaction, { runValidators: true })
        .then((result) => utils.sendSuccessResponse(res, HttpStatus.OK, "Transaction updated succesfully!", null))
        .catch((err) => utils.sendErrorResponse(res, HttpStatus.BAD_REQUEST, err.name, err.message));
    }
  }
};

exports.deletetransaction = (req, res, next) => {
  const transaction = new TransactionModel(req.body);
  transaction.user = req.currentUser.userId;

  if (!req.body._id) utils.sendErrorResponse(res, HttpStatus.BAD_REQUEST, "Bad Request", "Invalid object id received. Cannot delete transaction.");
  else {
    TransactionModel.findByIdAndRemove({ _id: transaction._id, user: req.currentUser.userId })
      .then((result) => utils.sendSuccessResponse(res, HttpStatus.OK, "Transaction deleted succesfully!", null))
      .catch((err) => utils.sendErrorResponse(res, HttpStatus.BAD_REQUEST, err.name, err.message));
  }
};
