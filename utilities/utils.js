module.exports.sendSuccessResponse = (responseObj, httpStatus, message, datatoSend) => {
  let responseData = {
    message: message,
    data: datatoSend,
  };
  return responseObj.status(httpStatus).send(responseData);
};

module.exports.sendErrorResponse = (responseObj, httpStatus, error, message) => {
  let responseData = {
    error: error,
    message: message,
  };
  return responseObj.status(httpStatus).send(responseData);
};
