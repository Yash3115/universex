import React from "react";
import { useSelector } from "react-redux";

const Landing = () => {
  // const isAuthenticated = useSelector
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center px-8 md:px-16 py-20">
        {/* Left Image (Hidden on Mobile) */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Empowering University Students
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            A community-driven platform designed to help students collaborate,
            manage expenses, and access academic resources effortlessly.
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo minus nihil officia suscipit natus! Dicta, suscipit fugiat culpa laborum eligendi, voluptatibus autem temporibus unde illum, qui et. Ab, minima odio.
          </p>
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <button className="bg-purple-700 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-800">
              Get Started
            </button>
            <button className="bg-gray-200 px-6 py-3 rounded-lg shadow-md hover:bg-gray-300">
              Learn More
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="hidden md:block w-1/2">
          <img src="/Landing.jpg" alt="Illustration" className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default Landing;
