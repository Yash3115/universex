import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { submitAccessRequest } from "../features/auth/authSlice";

const RequestAccessPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.isDemo ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    email: "",
    college: user?.college || "",
    role: "Student",
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(submitAccessRequest(formData));
    if (submitAccessRequest.fulfilled.match(result)) {
      setSubmitted(true);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="space-y-5">
          <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
            Admin managed access
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            Request a real UniVerseX account
          </h1>
          <p className="text-base leading-7 text-slate-600">
            Public signup is closed so colleges can create verified student and professor accounts. Send your details and an admin can provision your login.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Verified campus identity", "Temporary password on first login", "Student and professor roles", "Demo data stays separate"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 sm:p-8">
          {submitted ? (
            <div className="space-y-5">
              <p className="text-sm font-black uppercase tracking-wide text-emerald-600">Request received</p>
              <h2 className="text-3xl font-black text-slate-950">Your access request is saved.</h2>
              <p className="text-slate-600">
                An admin can review this request and create a student or professor account for you. Demo activity will not be migrated.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn btn-primary rounded-xl" onClick={() => navigate(user?.isDemo ? "/dashboard" : "/")}>
                  {user?.isDemo ? "Back to demo" : "Back to home"}
                </button>
                <button type="button" className="btn rounded-xl bg-white" onClick={() => navigate("/login")}>
                  Go to login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Access request</h2>
                <p className="mt-1 text-sm text-slate-500">Use your real college email so an admin can verify you.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  Full name
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>

                <label className="block text-sm font-bold text-slate-700">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </label>
              </div>

              <label className="block text-sm font-bold text-slate-700">
                College
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Role
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Student">Student</option>
                  <option value="Professor">Professor</option>
                </select>
              </label>

              <label className="block text-sm font-bold text-slate-700">
                Message
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Department, year, professor designation, or anything the admin should know."
                />
              </label>

              <button type="submit" className="btn btn-primary w-full rounded-xl">
                Submit request
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default RequestAccessPage;
