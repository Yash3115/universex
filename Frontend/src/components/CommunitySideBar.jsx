import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function CommunitySideBar() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const menuItems = [
    { name: "Edit Your Profile", route: "/profileEdit" },
    { name: "My Profile", route: "/profile" },
    { name: "Dashboard", route: "/dashboard" },
    { name: "Community", route: "/community" },
    { name: "Budget Tracker", route: "/budget" },
    { name: "Class Routine", route: "/class" },
    { name: "Attendance Tracker", route: "/attendance" },
  ];

  return (
    <aside className="hidden md:block w-1/4 bg-white p-4 rounded-lg shadow-md md:sticky md:top-4 mb-4 md:mb-0">
      {/* Profile Section */}
      {user ? (
        <div className="hidden md:flex flex-col items-center text-center">
          <img
            src={user?.image || "/default-profile.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
          />
          <h2 className="text-lg md:text-xl font-semibold mt-2">
            {`${user?.firstName || "User"} ${user?.lastName || ""}`}
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            {user?.additionalDetails?.about || "No bio available"}
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500">Loading user data...</p>
      )}

      <hr className="md:my-4 hidden md:flex" />

      {/* Sidebar Menu */}
      <ul className="text-gray-700 flex-col justify-between">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className="p-2 text-sm md:text-base hover:bg-gray-200 rounded-lg cursor-pointer"
            onClick={() => navigate(item.route)}
          >
            {item.name}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default CommunitySideBar;
