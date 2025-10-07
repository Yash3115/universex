import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import TransactionData from "../components/TransactionData";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import InsightsModal from "../components/InsightModal";

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

  const categories = {
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

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await axios.get("https://universex-m5nn.vercel.app/api/transaction/all", {
          withCredentials: true,
        });
        setTransactions(response.data.transactions);
        processCategoryData(response.data.transactions);
        setBalance(response.data.balance);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    }
    fetchTransactions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const processCategoryData = (transactions) => {
    const categoryTotals = {};

    // Initialize all categories with 0
    Object.keys(categories).forEach((category) => {
      categoryTotals[category] = 0;
    });

    // Aggregate amounts for debit transactions only
    transactions.forEach(({ type, amount, category }) => {
      if (type === "debit" && category) {
        categoryTotals[category] += amount;
      }
    });

    // Convert to array format for Recharts
    const chartData = Object.keys(categoryTotals).map((key) => ({
      category: key.charAt(0).toUpperCase() + key.slice(1),
      amount: categoryTotals[key],
    }));

    setCategoryData(chartData);
  };

  const handleAddTransaction = async () => {
    const { amount, description, type, category } = formData;
    if (!amount || amount <= 0 || !description) {
      setErrorMessage("Please enter a valid amount and description.");
      return;
    }
    if (!category) {
      setErrorMessage("Please select a category.");
      return;
    }

    try {
      const response = await axios.post(
        "https://universex-m5nn.vercel.app/api/transaction/add",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      const res = response.data;
      if (res.success) {
        toast.success("Transaction added successfully");
        setTransactions([res.transaction, ...transactions]);
        setBalance((prevBalance) =>
          type === "credit" ? prevBalance + Number(amount) : prevBalance - Number(amount)
        );
        processCategoryData([res.transaction, ...transactions]);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again");
    }

    setErrorMessage("");
    setFormData({ amount: "", description: "", type: "credit", category: "" });
  };

  const handleDeleteTransaction = async (transactionId, type, amount) => {
    try {
      await axios.delete(`https://universex-m5nn.vercel.app/api/transaction/remove/${transactionId}`, {
        withCredentials: true,
      });

      const updatedTransactions = transactions.filter(
        (transaction) => transaction._id !== transactionId
      );
      setTransactions(updatedTransactions);
      setBalance((prevBalance) =>
        type === "credit" ? prevBalance - amount : prevBalance + amount
      );
      processCategoryData(updatedTransactions);

      toast.success("Transaction deleted successfully");
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-wrap justify-center items-center bg-cover bg-no-repeat">
      <div className="w-full max-w-md mx-auto border rounded-lg p-5 my-10 bg-white">
        <h2 className="text-2xl font-bold text-blue-600 text-center">Budget Tracker</h2>
        <h3 className="text-xl text-center mt-2">
          Available Balance: <span className="font-semibold text-gray-800">₹{balance}</span>
        </h3>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Transaction</h3>
            {/* <button onClick={() => setIsModalOpen(true)} className="btn px-4 py-4 btn-accent">
              View Insights
            </button> */}
          </div>

          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
          <input type="number" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} className="input input-bordered w-full mt-2" />
          <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="input input-bordered w-full mt-2" />
          <select name="type" className="select select-bordered w-full mt-2" value={formData.type} onChange={handleChange}>
            <option value="credit">Credit (Income)</option>
            <option value="debit">Debit (Expense)</option>
          </select>
          <select className="select select-bordered w-full mt-2" value={formData.category} name="category" onChange={handleChange}>
            <option value="">Select Category</option>
            {Object.keys(categories).map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          <button onClick={handleAddTransaction} className="btn btn-primary w-full mt-4">Add Transaction</button>
        </div>

        <TransactionData transactions={transactions} onDelete={handleDeleteTransaction} />
      </div>

      <InsightsModal categoryData={categoryData} />
    </div>
  );
};

export default BudgetTracker;
