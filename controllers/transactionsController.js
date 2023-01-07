const mongoose = require("mongoose");

const utils = require("../utilities/utils");
const TransactionModel = require("../models/transaction");

exports.getTransactions = (req, res, next) => {
    TransactionModel.find({ user: req.currentUser.userId }, (err, transactions) => {
        if (err) {
            utils.sendErrorResponse(res, 500, err.name, err.message);
        } else {
            utils.sendSuccessResponse(res, 200, "Transaction fetched succesfully!", transactions);
        }
    });
};

exports.newtransaction = (req, res, next) => {
    if (!req.body || req.body.amount === null || req.body.date === null) {
        utils.sendErrorResponse(res, 400, "Validation Error", "Invalid fields");
    } else {
        const transaction = new TransactionModel(req.body);
        if (!transaction.category.type) {
            transaction.category.type = "expense";
        }
        transaction.user = req.currentUser.userId; // associate the new transaction with current user

        if (!req.body._id) {
            // insert
            transaction.save((err, result) => {
                if (err) {
                    utils.sendErrorResponse(res, 400, err.name, err.message);
                } else {
                    utils.sendSuccessResponse(res, 201, "Transaction added succesfully!", null);
                }
            });
        } else {
            // update
            if (!mongoose.Types.ObjectId.isValid(req.body._id)) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot update transaction.");

            TransactionModel.findOneAndUpdate({ _id: transaction._id, user: req.currentUser.userId }, transaction, { runValidators: true }, (err, result) => {
                if (err) {
                    utils.sendErrorResponse(res, 400, err.name, err.message);
                } else {
                    utils.sendSuccessResponse(res, 200, "Transaction updated succesfully!", null);
                }
            });
        }
    }
};

exports.deletetransaction = (req, res, next) => {
    const transaction = new TransactionModel(req.body);
    transaction.user = req.currentUser.userId;

    if (!req.body._id) utils.sendErrorResponse(res, 400, "Bad Request", "Invalid object id received. Cannot delete transaction.");
    else {
        TransactionModel.findByIdAndRemove({ _id: transaction._id, user: req.currentUser.userId }, (err, result) => {
            if (err) {
                utils.sendErrorResponse(res, 400, err.name, err.message);
            } else {
                utils.sendSuccessResponse(res, 200, "Transaction deleted succesfully!", null);
            }
        });
    }
};