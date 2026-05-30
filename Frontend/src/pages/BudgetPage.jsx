import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import TransactionData from "../components/TransactionData";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import InsightsModal from "../components/InsightModal";
import api from "../services/api";
import { fetchBudgetAnalytics, saveCategoryBudget } from "../features/budget/budgetSlice";

const CATEGORIES = {
  food: ["restaurant", "dinner", "lunch", "breakfast", "snacks", "coffee", "tea", "meal"],
  transport: ["uber", "bus", "train", "taxi", "fuel", "gas", "petrol", "diesel", "metro"],
  entertainment: ["movie", "netflix", "concert", "games", "show", "music", "cinema"],
  shopping: ["clothes", "electronics", "fashion", "grocery", "mall", "shoes"],
  rent: ["apartment", "house", "rent", "lease"],
  bills: ["electricity", "water", "wifi", "phone", "gas bill", "internet"],
  health: ["hospital", "medicine", "doctor", "treatment", "pharmacy"],
  education: ["tuition", "books", "school", "college", "university", "course", "exam"],
  other: [],
};

const BudgetTracker = () => {
  const dispatch = useDispatch();
  const analytics = useSelector((state) => state.budget.analytics);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    type: "credit",
    category: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [budgetForm, setBudgetForm] = useState({ category: "food", monthlyLimit: "" });

  const processCategoryData = useCallback((transactions) => {
    const categoryTotals = {};

    Object.keys(CATEGORIES).forEach((category) => {
      categoryTotals[category] = 0;
    });

    transactions.forEach(({ type, amount, category }) => {
      if (type === "debit" && category && categoryTotals[category] !== undefined) {
        categoryTotals[category] += Number(amount) || 0;
      }
    });

    const chartData = Object.keys(categoryTotals).map((key) => ({
      category: key.charAt(0).toUpperCase() + key.slice(1),
      amount: categoryTotals[key],
    }));

    setCategoryData(chartData);
  }, []);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await api.get("/api/transaction/all");
        setTransactions(response.data.transactions);
        processCategoryData(response.data.transactions);
        setBalance(response.data.balance);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    }
    fetchTransactions();
    dispatch(fetchBudgetAnalytics());
  }, [dispatch, processCategoryData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = async () => {
    const { amount, description, category } = formData;
    if (!amount || amount <= 0 || !description) {
      setErrorMessage("Please enter a valid amount and description.");
      return;
    }
    if (!category) {
      setErrorMessage("Please select a category.");
      return;
    }

    try {
      const response = await api.post("/api/transaction/add", {
        ...formData,
        amount: Number(amount),
      });

      const res = response.data;
      if (res.success) {
        toast.success("Transaction added successfully");
        const updatedTransactions = [res.transaction, ...transactions];
        setTransactions(updatedTransactions);
        setBalance(res.balance);
        processCategoryData(updatedTransactions);
        dispatch(fetchBudgetAnalytics());
      }
    } catch {
      toast.error("Something went wrong. Please try again");
    }

    setErrorMessage("");
    setFormData({ amount: "", description: "", type: "credit", category: "" });
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await api.delete(`/api/transaction/remove/${transactionId}`);

      const updatedTransactions = transactions.filter(
        (transaction) => transaction._id !== transactionId
      );
      setTransactions(updatedTransactions);
      setBalance(response.data.balance);
      processCategoryData(updatedTransactions);
      dispatch(fetchBudgetAnalytics());

      toast.success("Transaction deleted successfully");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const handleBudgetSave = async () => {
    try {
      await dispatch(saveCategoryBudget({ ...budgetForm, monthlyLimit: Number(budgetForm.monthlyLimit) })).unwrap();
      toast.success("Budget goal saved");
      setBudgetForm({ category: "food", monthlyLimit: "" });
      dispatch(fetchBudgetAnalytics());
    } catch (error) {
      toast.error(error || "Unable to save budget goal");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="w-full rounded-[2rem] border border-white bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white shadow-lg shadow-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Budget tracker</p>
          <h2 className="mt-2 text-3xl font-black">₹{balance}</h2>
          <p className="text-sm text-emerald-100">Available balance</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Transaction</h3>
            {/* <button onClick={() => setIsModalOpen(true)} className="btn px-4 py-4 btn-accent">
              View Insights
            </button> */}
          </div>

          {errorMessage && <p className="mt-2 rounded-2xl bg-red-50 p-3 text-sm text-red-600">{errorMessage}</p>}
          <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} className="input input-bordered mt-3 w-full rounded-2xl" />
          <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="input input-bordered mt-3 w-full rounded-2xl" />
          <select name="type" className="select select-bordered mt-3 w-full rounded-2xl" value={formData.type} onChange={handleChange}>
            <option value="credit">Credit (Income)</option>
            <option value="debit">Debit (Expense)</option>
          </select>
          <select className="select select-bordered mt-3 w-full rounded-2xl" value={formData.category} name="category" onChange={handleChange}>
            <option value="">Select Category</option>
            {Object.keys(CATEGORIES).map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <button onClick={handleAddTransaction} className="btn btn-primary mt-4 w-full rounded-2xl">Add Transaction</button>
        </div>

        <TransactionData transactions={transactions} onDelete={handleDeleteTransaction} />
      </div>

      <InsightsModal categoryData={categoryData} />
      <div className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur lg:col-span-2">
        <h3 className="text-xl font-black text-gray-900">Monthly intelligence</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Income</p>
            <p className="text-2xl font-black text-emerald-800">₹{analytics?.totals?.income || 0}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-4">
            <p className="text-sm text-red-700">Expenses</p>
            <p className="text-2xl font-black text-red-800">₹{analytics?.totals?.expense || 0}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Net flow</p>
            <p className="text-2xl font-black text-blue-800">₹{(analytics?.totals?.income || 0) - (analytics?.totals?.expense || 0)}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select className="select select-bordered rounded-2xl" value={budgetForm.category} onChange={(e) => setBudgetForm((prev) => ({ ...prev, category: e.target.value }))}>
            {Object.keys(CATEGORIES).map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="input input-bordered rounded-2xl" type="number" placeholder="Monthly limit" value={budgetForm.monthlyLimit} onChange={(e) => setBudgetForm((prev) => ({ ...prev, monthlyLimit: e.target.value }))} />
          <button className="btn btn-primary rounded-2xl" onClick={handleBudgetSave}>Save goal</button>
        </div>

        <div className="mt-5 space-y-3">
          {analytics?.budgetUsage?.length ? analytics.budgetUsage.map((item) => (
            <div key={item.category}>
              <div className="flex justify-between text-sm font-semibold text-gray-700">
                <span>{item.category}</span><span>₹{item.spent} / ₹{item.monthlyLimit}</span>
              </div>
              <progress className={`progress w-full ${item.usagePercent > 90 ? "progress-error" : item.usagePercent > 70 ? "progress-warning" : "progress-success"}`} value={Math.min(item.usagePercent, 100)} max="100" />
            </div>
          )) : <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">No monthly goals yet.</p>}
        </div>
      </div>
      </div>
    </div>
  );
};

export default BudgetTracker;
