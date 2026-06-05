import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaChalkboardTeacher, FaUserGraduate, FaUserShield } from "react-icons/fa";
import { startDemoSession } from "../features/auth/authSlice";

const demoRoles = [
  {
    role: "Student",
    title: "Student Demo",
    description: "Explore courses, materials, results, chats, jobs, tasks, community, and budget tools.",
    icon: FaUserGraduate,
  },
  {
    role: "Professor",
    title: "Professor Demo",
    description: "Preview course management, materials, results, office hours, and academic workflows.",
    icon: FaChalkboardTeacher,
  },
  {
    role: "Admin",
    title: "Admin Demo",
    description: "View demo-only accounts and platform administration without touching real users.",
    icon: FaUserShield,
  },
];

const DemoPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector((state) => state.auth.loading);

  const handleStartDemo = async (role) => {
    const result = await dispatch(startDemoSession(role));
    if (startDemoSession.fulfilled.match(result)) {
      navigate("/dashboard?demo=true");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">
            Same app sandbox
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Try UniVerseX with isolated demo data
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Pick a role and enter the real product experience. Demo students, professors, admin accounts, and activity stay separate from live users.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {demoRoles.map(({ role, title, description, icon: Icon }) => (
            <button
              key={role}
              type="button"
              className="group rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handleStartDemo(role)}
              disabled={loading}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              <span className="mt-5 inline-flex text-sm font-black text-blue-700">
                Start as {role}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

export default DemoPage;
