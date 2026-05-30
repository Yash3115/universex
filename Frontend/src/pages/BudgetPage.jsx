import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import TransactionData from "../components/TransactionData";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import InsightsModal from "../components/InsightModal";
import api from "../services/api";

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
  }, [processCategoryData]);

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

      toast.success("Transaction deleted successfully");
    } catch {
      toast.error("Failed to delete transaction");
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
      </div>
    </div>
  );
};

export default BudgetTracker;
