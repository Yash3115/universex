import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const username = useSelector((state) => state.auth.user.firstName);

  const features = [
    {
      name: "Community Posts",
      color: "text-blue-600",
      route: "/community",
      description:
        "Share ideas, ask questions, and collaborate with fellow students.",
    },
    {
      name: "Budget Calculator",
      color: "text-green-600",
      route: "/budget",
      description: "Track and manage your student expenses effectively.",
    },
    {
      name: "Contact Directory",
      color: "text-purple-600",
      route: "/contactDirectory",
      description: "Access all the important contact at one place.",
    },
    {
      name: "Class Routine",
      color: "text-red-600",
      route: "/class",
      description:
        "Stay updated with your class schedules and never miss a class.",
    },
    {
      name: "Profile Page",
      color: "text-indigo-600",
      route: "/profile",
      description: "Manage your personal information and account settings.",
    },
  ];

  return (
    <div className="py-16 px-6 md:px-20 bg-gray-50">
      <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
        Hello {username}<br/>Welcome to UniVersex
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-lg text-center cursor-pointer hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out border border-gray-200 hover:border-primary"
            onClick={() => navigate(feature.route)}
          >
            <h3 className={`text-xl font-semibold mb-2 ${feature.color}`}>
              {feature.name}
            </h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
