import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
          Admin managed access
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
          UniVerseX accounts are created by your college admin.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Students and professors receive a temporary password from an admin.
          After logging in, they are prompted to update their password and
          complete the profile details needed for courses, chat, discovery, and
          department groups.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn btn-primary rounded-xl"
            onClick={() => navigate("/request-access")}
          >
            Request access
          </button>
          <button
            type="button"
            className="btn rounded-xl bg-white"
            onClick={() => navigate("/login")}
          >
            Go to login
          </button>
          <button
            type="button"
            className="btn rounded-xl bg-white"
            onClick={() => navigate("/")}
          >
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
};

export default SignUp;
