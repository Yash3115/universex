import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBookOpen, FaBriefcase, FaCalendarAlt, FaChartPie, FaComments, FaPhoneAlt, FaUserCircle, FaUsers } from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const username = useSelector((state) => state.auth.user?.firstName || "there");

  const features = [
    {
      name: "Community Posts",
      icon: FaComments,
      accent: "from-blue-500 to-cyan-500",
      route: "/community",
      description:
        "Share ideas, ask questions, and collaborate with fellow students.",
    },
    {
      name: "Budget Calculator",
      icon: FaChartPie,
      accent: "from-emerald-500 to-teal-500",
      route: "/budget",
      description: "Track and manage your student expenses effectively.",
    },
    {
      name: "Jobs & Opportunities",
      icon: FaBriefcase,
      accent: "from-orange-500 to-rose-500",
      route: "/jobs",
      description: "Find internships, placements, hackathons, and scholarships shared by your campus network.",
    },
    {
      name: "Contact Directory",
      icon: FaPhoneAlt,
      accent: "from-purple-500 to-indigo-500",
      route: "/contactDirectory",
      description: "Access all the important contact at one place.",
    },
    {
      name: "Academic Planner",
      icon: FaCalendarAlt,
      accent: "from-red-500 to-orange-500",
      route: "/class",
      description:
        "Stay updated with your class schedules and never miss a class.",
    },
    {
      name: "Profile Page",
      icon: FaUserCircle,
      accent: "from-indigo-500 to-blue-500",
      route: "/profile",
      description: "Manage your personal information and account settings.",
    },
    {
      name: "Student Discovery",
      icon: FaUsers,
      accent: "from-fuchsia-500 to-purple-500",
      route: "/students",
      description: "Find peers by college, department, year, and profile details.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-6 text-white shadow-2xl shadow-blue-200 sm:p-8 lg:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                <FaBookOpen /> Campus command center
              </p>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Hello {username}, welcome back to UniVerseX.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-blue-100 sm:text-lg">
                Manage your student life from one place — community discussions, jobs, budgets, routines, profiles, and campus contacts.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="btn border-none bg-white text-blue-700 hover:bg-blue-50" onClick={() => navigate("/community")}>Explore Community</button>
                <button className="btn border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate("/jobs")}>View Opportunities</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["6", "Core modules"],
                ["24/7", "Campus access"],
                ["Live", "User session"],
                ["Smart", "Budget insights"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/15 p-4 text-center backdrop-blur">
                  <p className="text-2xl font-black sm:text-3xl">{value}</p>
                  <p className="text-xs font-medium text-blue-100 sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.route}
                type="button"
                className="group relative overflow-hidden rounded-3xl border border-white bg-white p-6 text-left shadow-lg shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                onClick={() => navigate(feature.route)}
              >
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-2xl text-white shadow-lg transition-transform group-hover:scale-110`}>
                  <Icon />
                </div>
                <h3 className="text-xl font-black text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                <span className="mt-5 inline-flex text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  Open module →
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
