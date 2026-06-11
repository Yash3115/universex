import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaBriefcase,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaChartPie,
  FaClipboardList,
  FaComments,
  FaPhoneAlt,
  FaUserCircle,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { fetchCourseMaterials } from "../features/courseMaterials/courseMaterialsSlice";
import { fetchMyCourses } from "../features/courses/coursesSlice";

function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { myCourses } = useSelector((state) => state.courses);
  const materialsByCourseId = useSelector((state) => state.courseMaterials.itemsByCourseId);
  const username = user?.firstName || "there";
  const role = user?.role || "Student";

  useEffect(() => {
    if (role === "Student") dispatch(fetchMyCourses());
  }, [dispatch, role]);

  useEffect(() => {
    if (role !== "Student") return;
    myCourses.slice(0, 6).forEach((course) => {
      dispatch(fetchCourseMaterials({ courseId: course._id, filters: {} }));
    });
  }, [dispatch, myCourses, role]);

  const recentMaterials = useMemo(
    () =>
      Object.entries(materialsByCourseId)
        .flatMap(([courseId, materials]) => {
          const course = myCourses.find((item) => item._id === courseId);
          return (materials || []).map((material) => ({ ...material, courseId, course }));
        })
        .sort((first, second) => {
          if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
          return new Date(second.publishedAt || second.releaseAt || second.createdAt) - new Date(first.publishedAt || first.releaseAt || first.createdAt);
        })
        .slice(0, 4),
    [materialsByCourseId, myCourses]
  );

  const roleContent = {
    Student: {
      eyebrow: "Student command center",
      description: "Track classes, materials, assignments, chats, jobs, budget, and campus connections from one place.",
      primary: { label: "Open Planner", route: "/class" },
      secondary: { label: "View Courses", route: "/courses" },
      stats: [
        [myCourses.length || "0", "Courses"],
        [recentMaterials.length || "0", "Recent materials"],
        ["Live", "Student session"],
        ["Smart", "Budget tools"],
      ],
    },
    Professor: {
      eyebrow: "Professor workspace",
      description: "Manage courses, publish materials, answer doubts, track assignments, post opportunities, and run office hours.",
      primary: { label: "Manage Courses", route: "/courses" },
      secondary: { label: "Office Hours", route: "/office-hours" },
      stats: [
        ["Teach", "Courses"],
        ["Publish", "Materials"],
        ["Review", "Results"],
        ["Guide", "Office hours"],
      ],
    },
    Admin: {
      eyebrow: "Admin control center",
      description: "Provision student and professor accounts, review access requests, monitor demo-safe workflows, and keep campus data governed.",
      primary: { label: "Manage Accounts", route: "/admin/accounts" },
      secondary: { label: "Open Community", route: "/community" },
      stats: [
        ["Admin", "Role"],
        ["Secure", "Provisioning"],
        ["Demo", "Isolated"],
        ["Review", "Access leads"],
      ],
    },
  };

  const currentContent = roleContent[role] || roleContent.Student;

  const features = [
    {
      name: "Community Posts",
      icon: FaComments,
      accent: "from-blue-500 to-cyan-500",
      route: "/community",
      roles: ["Student", "Professor", "Admin"],
      description: "Share updates, answer questions, and keep campus conversations visible.",
    },
    {
      name: "Budget Calculator",
      icon: FaChartPie,
      accent: "from-emerald-500 to-teal-500",
      route: "/budget",
      roles: ["Student"],
      description: "Track and manage your student expenses effectively.",
    },
    {
      name: "Jobs & Opportunities",
      icon: FaBriefcase,
      accent: "from-orange-500 to-rose-500",
      route: "/jobs",
      roles: ["Student", "Professor", "Admin"],
      description: role === "Student" ? "Find internships, placements, hackathons, and scholarships." : "Publish and manage campus opportunities.",
    },
    {
      name: "Contact Directory",
      icon: FaPhoneAlt,
      accent: "from-purple-500 to-indigo-500",
      route: "/contactDirectory",
      roles: ["Student", "Professor", "Admin"],
      description: "Access important campus contacts in one place.",
    },
    {
      name: "Academic Planner",
      icon: FaCalendarAlt,
      accent: "from-red-500 to-orange-500",
      route: "/class",
      roles: ["Student"],
      description: "Stay updated with your schedule, tasks, materials, and deadlines.",
    },
    {
      name: "Courses",
      icon: FaChalkboardTeacher,
      accent: "from-indigo-500 to-cyan-500",
      route: "/courses",
      roles: ["Student", "Professor", "Admin"],
      description: role === "Student" ? "Join courses and access academic work." : "Create courses and manage teaching workflows.",
    },
    {
      name: "Results & Gradebook",
      icon: FaClipboardList,
      accent: "from-emerald-500 to-blue-500",
      route: role === "Student" ? "/results" : "/courses",
      roles: ["Student", "Professor", "Admin"],
      description: role === "Student" ? "Review published marks and feedback." : "Open assessment and grade workflows from courses.",
    },
    {
      name: "Profile Page",
      icon: FaUserCircle,
      accent: "from-indigo-500 to-blue-500",
      route: "/profile",
      roles: ["Student", "Professor", "Admin"],
      description: "Manage your personal information and account settings.",
    },
    {
      name: "Student Discovery",
      icon: FaUsers,
      accent: "from-fuchsia-500 to-purple-500",
      route: "/students",
      roles: ["Student"],
      description: "Find peers by college, department, year, and profile details.",
    },
    {
      name: "Account Management",
      icon: FaUserShield,
      accent: "from-slate-700 to-blue-700",
      route: "/admin/accounts",
      roles: ["Admin"],
      description: "Create accounts, review access requests, and track first-login setup.",
    },
  ].filter((feature) => feature.roles.includes(role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-6 text-white shadow-2xl shadow-blue-200 sm:p-8 lg:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                <FaBookOpen /> {currentContent.eyebrow}
              </p>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Hello {username}, welcome back to UniVerseX.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-blue-100 sm:text-lg">
                {currentContent.description}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="btn border-none bg-white text-blue-700 hover:bg-blue-50" onClick={() => navigate(currentContent.primary.route)}>
                  {currentContent.primary.label}
                </button>
                <button className="btn border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate(currentContent.secondary.route)}>
                  {currentContent.secondary.label}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {currentContent.stats.map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/15 p-4 text-center backdrop-blur">
                  <p className="text-2xl font-black sm:text-3xl">{value}</p>
                  <p className="text-xs font-medium text-blue-100 sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {role === "Student" && (
          <section className="rounded-3xl border border-white bg-white p-5 shadow-lg shadow-slate-200/70">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Recent course materials</h2>
                <p className="text-sm text-gray-500">Pinned and newly published resources from your enrolled courses.</p>
              </div>
              <button className="btn btn-sm rounded-xl" onClick={() => navigate("/class")}>Open planner</button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {recentMaterials.map((material) => (
                <button
                  key={material._id}
                  type="button"
                  className="rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-blue-50"
                  onClick={() => navigate(`/courses/${material.course?._id || material.courseId}`)}
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    {material.pinned && <span className="rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700">Pinned</span>}
                    <span className="rounded-full bg-blue-50 px-2 py-1 font-bold text-blue-700">{material.type}</span>
                    {!material.isRead && <span className="rounded-full bg-white px-2 py-1 font-bold text-slate-600">Unread</span>}
                  </div>
                  <p className="mt-3 font-black text-gray-900">{material.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{material.course?.code || "Course"} {material.week ? `- Week ${material.week}` : ""}</p>
                </button>
              ))}
              {recentMaterials.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-gray-500 md:col-span-2">No published materials from your courses yet.</p>}
            </div>
          </section>
        )}

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
                <span className="mt-5 inline-flex text-sm font-bold text-blue-600 transition-transform group-hover:translate-x-1">
                  Open module
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
