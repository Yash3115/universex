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
    { name: "Jobs & Opportunities", route: "/jobs" },
    { name: "Budget Tracker", route: "/budget" },
    { name: "Class Routine", route: "/class" },
    { name: "Attendance Tracker", route: "/attendance" },
  ];

  return (
    <aside className="hidden w-full rounded-3xl border border-white bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur lg:sticky lg:top-24 lg:block lg:w-80 lg:self-start">
      {/* Profile Section */}
      {user ? (
        <div className="hidden md:flex flex-col items-center text-center">
          <img
            src={user?.image || "/default-profile.png"}
            alt="Profile"
            className="h-24 w-24 rounded-full border-4 border-blue-100 object-cover shadow-lg"
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

      <hr className="my-5 border-gray-100" />

      <ul className="space-y-2 text-gray-700">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold transition hover:bg-blue-50 hover:text-blue-700"
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
