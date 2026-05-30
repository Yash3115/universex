const Transaction = require("../models/transactionSchema");
const User = require("../models/userSchema");
const Budget = require("../models/budgetSchema");
const categorizeExpense = require("../utils/aiCategorization");

const parsePositiveAmount = (amount) => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : null;
};

const isSupportedType = (type) => ["credit", "debit"].includes(type);

const getMonthKey = (date = new Date()) => date.toISOString().slice(0, 7);

// ✅ Add Transaction & Update Balance
exports.addTransaction = async (req, res) => {
  try {
    const { amount, description, type, category } = req.body;
    const numericAmount = parsePositiveAmount(amount);

    if (!numericAmount || !description || !isSupportedType(type)) {
      return res.status(400).json({
        success: false,
        message: "A positive amount, description, and valid type are required",
      });
    }

    const normalizedCategory = category || categorizeExpense(description) || "other";
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newTransaction = new Transaction({
      userId: req.user.id,
      amount: numericAmount,
      description,
      type,
      category: normalizedCategory,
    });

    await newTransaction.save();

    // Update User Balance
    user.balance = type === "credit" ? user.balance + numericAmount : user.balance - numericAmount;
    await user.save();

    res.status(201).json({ success:true, transaction: newTransaction, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: "Error adding transaction", error: error.message });
  }
};

// ✅ Remove Transaction & Update Balance
exports.removeTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this transaction" });
    }

    const user = await User.findById(transaction.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Reverse transaction effect before deleting
    user.balance = transaction.type === "credit" ? user.balance - transaction.amount : user.balance + transaction.amount;
    await user.save();

    await transaction.deleteOne();
    res.status(200).json({ message: "Transaction deleted", balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: "Error deleting transaction", error: error.message });
  }
};

// ✅ Update Transaction & Adjust Balance
exports.updateTransaction = async (req, res) => {
    try {
        const { amount, description, type, category } = req.body;
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to update this transaction" });
        }

        const user = await User.findById(transaction.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (type && !isSupportedType(type)) {
            return res.status(400).json({ message: "Invalid transaction type" });
        }

        const nextAmount = amount === undefined ? transaction.amount : parsePositiveAmount(amount);
        if (!nextAmount) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }
        
        // Adjust balance before updating
        if (transaction.type === "credit") {
            user.balance -= transaction.amount;
        } else {
            user.balance += transaction.amount;
        }

        // Ensure description is not undefined
        const updatedDescription = description || transaction.description;

        // Update transaction
        transaction.amount = nextAmount;
        transaction.description = updatedDescription;
        transaction.type = type || transaction.type;
        transaction.category = category || categorizeExpense(updatedDescription) || transaction.category; 

        await transaction.save();

        // Adjust balance after updating
        if (transaction.type === "credit") {
            user.balance += transaction.amount;
        } else {
            user.balance -= transaction.amount;
        }

        await user.save();

        res.status(200).json({ transaction, balance: user.balance });
    } catch (error) {
        res.status(500).json({ message: "Error updating transaction", error: error.message });
    }
};


// ✅ Show All Transactions & Balance
exports.showAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ transactions, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error: error.message });
  }
};

exports.getBudgetAnalytics = async (req, res) => {
  try {
    const month = req.query.month || getMonthKey();
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const [transactions, budgets] = await Promise.all([
      Transaction.find({ userId: req.user.id, date: { $gte: start, $lt: end } }).sort({ date: -1 }),
      Budget.find({ user: req.user.id, month }),
    ]);

    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "credit") acc.income += transaction.amount;
        if (transaction.type === "debit") {
          acc.expense += transaction.amount;
          acc.byCategory[transaction.category] = (acc.byCategory[transaction.category] || 0) + transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0, byCategory: {} }
    );

    const budgetUsage = budgets.map((budget) => ({
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
      spent: totals.byCategory[budget.category] || 0,
      usagePercent: budget.monthlyLimit ? Math.round(((totals.byCategory[budget.category] || 0) / budget.monthlyLimit) * 100) : 0,
    }));

    res.status(200).json({
      success: true,
      month,
      totals,
      budgetUsage,
      recentTransactions: transactions.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching budget analytics", error: error.message });
  }
};

exports.upsertBudget = async (req, res) => {
  try {
    const { category, monthlyLimit, month = getMonthKey() } = req.body;
    const limit = Number(monthlyLimit);
    if (!category || !Number.isFinite(limit) || limit < 0) {
      return res.status(400).json({ success: false, message: "Category and valid monthly limit are required" });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user.id, category, month },
      { monthlyLimit: limit },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, message: "Budget saved", budget });
  } catch (error) {
    res.status(500).json({ message: "Error saving budget", error: error.message });
  }
};
