const express = require("express");
const {
  addTransaction,
  removeTransaction,
  updateTransaction,
  showAllTransactions,
} = require("../controllers/transactionController");
const {authMiddleware} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add", authMiddleware, addTransaction);
router.delete("/remove/:id", authMiddleware, removeTransaction);
router.put("/update/:id", authMiddleware, updateTransaction);
router.get("/all", authMiddleware, showAllTransactions);

module.exports = router;
