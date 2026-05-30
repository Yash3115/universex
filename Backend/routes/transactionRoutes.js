const express = require("express");
const {
  addTransaction,
  removeTransaction,
  updateTransaction,
  showAllTransactions,
  getBudgetAnalytics,
  upsertBudget,
} = require("../controllers/transactionController");
const {authMiddleware} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add", authMiddleware, addTransaction);
router.delete("/remove/:id", authMiddleware, removeTransaction);
router.put("/update/:id", authMiddleware, updateTransaction);
router.get("/all", authMiddleware, showAllTransactions);
router.get("/analytics", authMiddleware, getBudgetAnalytics);
router.put("/budget", authMiddleware, upsertBudget);

module.exports = router;
