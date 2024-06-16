const mongoose = require("mongoose");

const utils = require("../utilities/utils");
const HttpStatus = require("../utilities/httpsStatusCodes");
const TransactionModel = require("../models/transaction");

exports.getTransactionsDateRange = async (req, res, next) => {
  try {
    const firstTransaction = await TransactionModel.find().sort({ date: 1 }).limit(1).exec();
    const lastTransaction = await TransactionModel.find().sort({ date: -1 }).limit(1).exec();

    if (firstTransaction.length === 0 || lastTransaction.length === 0) {
      return utils.sendSuccessResponse(res, HttpStatus.OK, "No transactions found!", { firstDate: null, lastDate: null });
    }

    const firstDate = firstTransaction[0].date;
    const lastDate = lastTransaction[0].date;

    utils.sendSuccessResponse(res, HttpStatus.OK, "Transaction date range fetched successfully!", { firstDate, lastDate });
  } catch (err) {
    utils.sendErrorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, err.name, err.message);
  }
};

exports.getTransactions = (req, res, next) => {
  TransactionModel.find({ user: req.currentUser.userId })
    .then((result) => utils.sendSuccessResponse(res, HttpStatus.OK, "Transaction fetched succesfully!", result))
    .catch((err) => utils.sendErrorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, err.name, err.message));
};

exports.getFilteredTransactions = (req, res, next) => {
  const { paymentMode, month, year, search } = req.query;
  const query = { user: req.currentUser.userId };

  // Add paymentMode filter if provided
  if (paymentMode && paymentMode !== '0') {
    query.paymentMode = Number(paymentMode);
  }
  
  // Add date filter if month and year are provided
  if (Number(year)) {
    if (Number(month)) {
      // Filter for specific month and year
      const startMonth = month.padStart(2, '0');
      startDate = `${year}-${startMonth}-01`;
      const endMonth = month.padStart(2, '0');
      endDate = new Date(year, month, 0);
      endDate = `${year}-${endMonth}-${endDate.getDate()}`;
      query.date = { $gte: startDate, $lte: endDate };
    } else {
      // Filter for the entire year
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query.date = { $gte: startDate, $lte: endDate };
    }
  }

  // Add search keyword filter if provided
  if (search) {
    query.note = { $regex: search, $options: 'i' }; // Case-insensitive search in notes
  }

  TransactionModel.find(query)
    .then((result) => utils.sendSuccessResponse(res, HttpStatus.OK, "Transactions fetched successfully!", result))
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
