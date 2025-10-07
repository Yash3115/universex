import React from "react";
import { FiTrash } from "react-icons/fi";

const TransactionData = ({ transactions, onDelete }) => {
  return (
    <div className="mt-2 space-y-2">
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map(({ _id, type, amount, description }) => (
            <div
              key={_id}
              className={`p-3 rounded-lg flex justify-between items-center shadow-md ${
                type === "credit" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <div className="flex-1 overflow-hidden">
                <span className="block font-semibold truncate">{description}</span>
              </div>
              <span
                className={`w-24 text-right ${type === "credit" ? "text-green-600" : "text-red-600"}`}
              >
                {type === "credit" ? "+" : "-"}₹{amount}
              </span>
              <button
                onClick={() => onDelete(_id, type, amount)}
                className="btn btn-sm btn-error ml-4 rounded-full"
              >
                <FiTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionData;
