import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { FiMenu } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);

  const [userData, setUserData] = useState({
    userName: "User",
    userAvatar:
      "https://www.shutterstock.com/image-vector/no-photo-vector-flat-illustration-260nw-2470053053.jpg",
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setUserData({
        userName: user.firstName,
        userAvatar: user.image,
      });
    }
  }, [isAuthenticated, user]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const closeDropdown = () => setIsDropdownOpen(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogin = () => {
    navigate("/login");
    closeMobileMenu();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    closeDropdown();
    closeMobileMenu();
  };

  const features = [
    { name: "Community", route: "/community" },
    { name: "Profile", route: "/profile" },
    { name: "Budget", route: "/budget" },
    { name: "Class Routine", route: "/class" },
    { name: "Contact Directory", route: "/contactDirectory" },
    
  ];

  return (
    <nav className="flex justify-between items-center px-6 md:px-12 py-4 shadow-md bg-white w-full relative">
      <h1
        className="text-2xl font-bold text-blue-600 cursor-pointer"
        onClick={() => navigate("/")}
      >
        UniVerseX
      </h1>

      {/* Desktop Menu - Centered */}
      <ul className="hidden md:flex gap-8 text-gray-700 font-medium absolute left-1/2 transform -translate-x-1/2">
        {features.map((feature, index) => (
          <li
            key={index}
            className={`cursor-pointer transition-all ${location.pathname === feature.route ? "text-blue-600 font-bold" : "hover:text-blue-600"}`}
            onClick={() => navigate(feature.route)}
          >
            {feature.name}
          </li>
        ))}
      </ul>

      {/* Mobile Menu and User Avatar */}
      <div className="flex items-center gap-4">
        {/* User Avatar - Positioned Top Right in Desktop View */}
        {isAuthenticated ? (
          <div className="relative">
            <label
              tabIndex={0}
              className="btn btn-ghost btn-circle avatar"
              onClick={toggleDropdown}
            >
              <div className="w-10 rounded-full">
                <img src={userData.userAvatar} alt="User Avatar" />
              </div>
            </label>
            {isDropdownOpen && (
              <ul className="menu menu-sm dropdown-content mt-3 shadow bg-white rounded-lg w-52 absolute right-0 z-50 border border-gray-200">
                <li className="p-2 text-gray-700 font-semibold">
                  {userData.userName}
                </li>
                <hr />
                <li onClick={() => navigate("/dashboard")}>
                  <a className="hover:bg-gray-200 p-2 cursor-pointer text-blue-500">
                    Dashboard
                  </a>
                </li>
                <li onClick={handleLogout}>
                  <a className="hover:bg-gray-200 p-2 cursor-pointer text-red-500">
                    Logout
                  </a>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <button
            className="hidden md:block bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600"
            onClick={handleLogin}
          >
            Login
          </button>
        )}

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-700" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <AiOutlineClose size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <ul className="absolute top-16 left-0 w-full bg-white shadow-md py-4 flex flex-col items-center space-y-4 z-50 border-t border-gray-200">
          {features.map((feature, index) => (
            <li
              key={index}
              className={`cursor-pointer text-lg ${location.pathname === feature.route ? "text-blue-600 font-bold" : "hover:text-blue-600"}`}
              onClick={() => {
                navigate(feature.route);
                closeMobileMenu();
              }}
            >
              {feature.name}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
