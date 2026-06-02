import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { FiMenu } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";
import NotificationBell from "./NotificationBell";
import { getImageUrl } from "../utils/imageUtils";

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
        userAvatar: getImageUrl(user.image, "https://www.shutterstock.com/image-vector/no-photo-vector-flat-illustration-260nw-2470053053.jpg"),
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
    { name: "Jobs", route: "/jobs" },
    { name: "Budget", route: "/budget" },
    { name: "Academics", route: "/class" },
    { name: "Students", route: "/students" },
    { name: "Directory", route: "/contactDirectory" },
    { name: "Profile", route: "/profile" },
  ];

  const getLinkClass = (route) =>
    `cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all ${
      location.pathname === route
        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
        : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
    }`;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-blue-100 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="group flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-blue-200">
            U
          </span>
          <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-blue-700 sm:text-2xl">
            UniVerseX
          </span>
        </button>

        <ul className="hidden items-center gap-1 xl:flex">
          {features.map((feature) => (
            <li
              key={feature.route}
              className={getLinkClass(feature.route)}
              onClick={() => navigate(feature.route)}
            >
              {feature.name}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
        {isAuthenticated && <NotificationBell />}
        {isAuthenticated ? (
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1 pr-3 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              onClick={toggleDropdown}
            >
              <div className="h-9 w-9 overflow-hidden rounded-full bg-blue-100">
                <img src={userData.userAvatar} alt="User Avatar" className="h-full w-full object-cover" />
              </div>
              <span className="hidden max-w-24 truncate text-sm font-semibold text-gray-700 sm:block">
                {userData.userName}
              </span>
            </button>
            {isDropdownOpen && (
              <ul className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                <li className="px-3 py-2 text-sm font-bold text-gray-800">
                  {userData.userName}
                </li>
                <li
                  onClick={() => {
                    navigate("/dashboard");
                    closeDropdown();
                  }}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                >
                  Dashboard
                </li>
                <li
                  onClick={() => {
                    navigate("/profile");
                    closeDropdown();
                  }}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  My profile
                </li>
                <li
                  onClick={() => {
                    navigate("/profileEdit");
                    closeDropdown();
                  }}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  Edit profile
                </li>
                <li
                  onClick={handleLogout}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                >
                  Logout
                </li>
              </ul>
            )}
          </div>
        ) : (
          <button
            className="hidden rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:scale-105 md:block"
            onClick={handleLogin}
          >
            Login
          </button>
        )}

        <button className="rounded-full p-2 text-gray-700 hover:bg-gray-100 xl:hidden" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <AiOutlineClose size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-blue-50 bg-white px-4 py-4 shadow-lg xl:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3">
            {features.map((feature) => (
            <button
              key={feature.route}
              type="button"
              className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                location.pathname === feature.route
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
              onClick={() => {
                navigate(feature.route);
                closeMobileMenu();
              }}
            >
              {feature.name}
            </button>
          ))}
          {!isAuthenticated && (
            <button
              type="button"
              className="rounded-2xl bg-orange-500 px-4 py-3 text-left text-sm font-bold text-white sm:hidden"
              onClick={handleLogin}
            >
              Login
            </button>
          )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
