import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const InsightsModal = ({ categoryData }) => {

    return (
        <div className="relative w-full rounded-[2rem] border border-white bg-white/90 p-4 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-6">
            <h3 className="text-xl font-bold text-center mb-4">Your Insights</h3>

            {/* Close Button */}
            {/* <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900">
          ✖
        </button> */}

            {/* Bar Chart */}
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryData}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#FF6363" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default InsightsModal;
