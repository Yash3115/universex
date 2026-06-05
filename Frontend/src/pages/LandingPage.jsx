import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Campus Community",
    description: "Share updates, ask questions, and collaborate with students across your university network.",
  },
  {
    title: "Academic Planner",
    description: "Organize routines, attendance, and academic tasks so your semester stays on track.",
  },
  {
    title: "Budget Tracking",
    description: "Record expenses, monitor spending patterns, and make student life easier to manage.",
  },
  {
    title: "Student Discovery",
    description: "Find classmates, build connections, and explore profiles by department, college, and batch.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authLoading = useSelector((state) => state.auth.loading);

  const handleGetStarted = () => {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  const handleTryDemo = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    navigate("/demo");
  };

  const handleLearnMore = () => {
    document.getElementById("landing-features")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-20 md:flex-row md:px-10 lg:px-16">
        {/* Left Image (Hidden on Mobile) */}
        <div className="w-full text-center md:w-1/2 md:text-left">
          <p className="mb-4 inline-flex rounded-full bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700">
            Your all-in-one campus companion
          </p>
          <h2 className="text-4xl font-black leading-tight text-gray-900 md:text-5xl">
            Empowering University Students
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            UniVerseX brings your academic life, campus connections, budgeting,
            jobs, and communities into one student-focused platform so you can
            spend less time switching tools and more time growing.
          </p>
          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            {!isAuthenticated && (
              <button
                type="button"
                className="rounded-xl bg-purple-700 px-6 py-3 font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleTryDemo}
                disabled={authLoading}
              >
                Try Demo
              </button>
            )}
            <button
              type="button"
              className={`rounded-xl px-6 py-3 font-bold shadow-md transition hover:-translate-y-0.5 ${
                isAuthenticated
                  ? "bg-purple-700 text-white shadow-purple-200 hover:bg-purple-800"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
              onClick={handleGetStarted}
            >
              {isAuthenticated ? "Open Dashboard" : "Login"}
            </button>
            <button
              type="button"
              className="rounded-xl bg-white px-6 py-3 font-bold text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:bg-gray-50"
              onClick={handleLearnMore}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="hidden w-1/2 md:block">
          <img src="/Landing.jpg" alt="Students collaborating on UniVerseX" className="w-full rounded-[2rem] shadow-2xl shadow-blue-100" />
        </div>
      </div>

      <section id="landing-features" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-20 md:px-10 lg:px-16">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 md:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-wide text-purple-600">Why UniVerseX</p>
            <h3 className="mt-2 text-3xl font-black text-gray-900 md:text-4xl">
              Everything students need to stay connected and organized
            </h3>
            <p className="mt-4 text-gray-600">
              From discovering peers to planning classes and managing expenses,
              UniVerseX is built around real university workflows.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-blue-50">
                <h4 className="text-lg font-black text-gray-900">{feature.title}</h4>
                <p className="mt-3 text-sm leading-6 text-gray-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
