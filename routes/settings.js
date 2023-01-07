const express = require("express");
const router = express.Router();
const multer = require("multer");

const checkAuth = require("../middleware/checkAuth");
const settingsController = require("../controllers/settingsController");

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

router.get("/api/getsettings", checkAuth, settingsController.getSettings);
router.post("/api/updatesettings", checkAuth, settingsController.updatesettings);
router.get("/api/getCategories", checkAuth, settingsController.getCategories);
router.get("/api/getCurrencies", checkAuth, settingsController.getCurrencies);
router.get("/api/getPaymentModes", checkAuth, settingsController.getPaymentModes);
router.post("/api/deletealltransactions", checkAuth, settingsController.deletealltransactions);
router.post("/api/uploadSpreadsheet", checkAuth, multer({ storage: storageConfig }).single("spreadsheet"), settingsController.uploadSpreadsheet);
router.get("/api/downloadSpreadsheet", checkAuth, settingsController.downloadSpreadsheet);
router.post("/api/addcategory", checkAuth, settingsController.addCategory);
router.post("/api/deletecategory", checkAuth, settingsController.deleteCategory);
router.post("/api/addPaymentMode", checkAuth, settingsController.addPaymentMode);
router.post("/api/deletePaymentMode", checkAuth, settingsController.deletePaymentMode);

module.exports = router;
